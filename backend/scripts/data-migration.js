import { Client } from "pg";
console.log("Starting data migration...");

const SOURCE_DB_URL = "postgres://estate:Bytive@2003@194.238.19.238:5432/estate-craft-prod?sslmode=disable";

const TARGET_DB_URL = "postgres://bytive:Bytive@100@13.234.175.169:5432/estate-craft-dev?sslmode=disable";

const SCHEMA = "public";
const BATCH_SIZE = 1000;

// Optional: migrate only a subset (comma-separated): TABLES=users,orders
const TABLES_ALLOWLIST = [];

// Optional: exclude tables (comma-separated)
const EXCLUDE_TABLES = new Set(["_prisma_migrations"]);

const PG_MAX_PARAMS = 65000; // leave a little headroom below 65535

/**
 * 🚀 MIGRATION LOGIC
 */
function qIdent(ident) {
  // Safely quote identifiers: schema/table/column
  return `"${String(ident).replaceAll('"', '""')}"`;
}

function tableRef(schema, table) {
  return `${qIdent(schema)}.${qIdent(table)}`;
}

async function getTables(client, schema) {
  const { rows } = await client.query(
    `
    SELECT tablename
    FROM pg_catalog.pg_tables
    WHERE schemaname = $1
    ORDER BY tablename
    `,
    [schema]
  );

  let tables = rows.map(r => r.tablename).filter(t => !EXCLUDE_TABLES.has(t));

  if (TABLES_ALLOWLIST.length > 0) {
    const allow = new Set(TABLES_ALLOWLIST);
    tables = tables.filter(t => allow.has(t));
  }

  return tables;
}

async function getForeignKeyEdges(client, schema) {
  const { rows } = await client.query(
    `
    SELECT
      child.relname  AS child_table,
      parent.relname AS parent_table
    FROM pg_constraint c
    JOIN pg_class child  ON child.oid  = c.conrelid
    JOIN pg_class parent ON parent.oid = c.confrelid
    JOIN pg_namespace n  ON n.oid = child.relnamespace
    WHERE c.contype = 'f' AND n.nspname = $1
    `,
    [schema]
  );
  return rows;
}

function topoSortTables(tables, fkEdges) {
  const tableSet = new Set(tables);
  const adj = new Map();
  const indeg = new Map();

  for (const t of tables) {
    adj.set(t, new Set());
    indeg.set(t, 0);
  }

  // parent -> child (parents first)
  for (const { child_table, parent_table } of fkEdges) {
    if (!tableSet.has(child_table) || !tableSet.has(parent_table)) continue;
    if (child_table === parent_table) continue;
    const children = adj.get(parent_table);
    if (!children.has(child_table)) {
      children.add(child_table);
      indeg.set(child_table, (indeg.get(child_table) ?? 0) + 1);
    }
  }

  const queue = [];
  for (const [t, d] of indeg.entries()) if (d === 0) queue.push(t);
  queue.sort();

  const out = [];
  while (queue.length > 0) {
    const t = queue.shift();
    out.push(t);
    for (const child of adj.get(t) ?? []) {
      indeg.set(child, indeg.get(child) - 1);
      if (indeg.get(child) === 0) {
        queue.push(child);
        queue.sort();
      }
    }
  }

  // Cycles/self-references: append remaining tables deterministically
  if (out.length !== tables.length) {
    const remaining = tables.filter(t => !out.includes(t)).sort();
    out.push(...remaining);
  }

  return out;
}

async function getColumns(client, schema, table) {
  const { rows } = await client.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = $1 AND table_name = $2
    ORDER BY ordinal_position
    `,
    [schema, table]
  );
  return rows.map(r => r.column_name);
}

async function getPrimaryKeyColumns(client, schema, table) {
  const { rows } = await client.query(
    `
    SELECT a.attname AS column_name
    FROM pg_index i
    JOIN pg_class t ON t.oid = i.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a
      ON a.attrelid = i.indrelid
     AND a.attnum = ANY(i.indkey)
    WHERE i.indisprimary = true
      AND n.nspname = $1
      AND t.relname = $2
    ORDER BY array_position(i.indkey, a.attnum)
    `,
    [schema, table]
  );
  return rows.map(r => r.column_name);
}

async function resetSequencesForTable(client, schema, table) {
  // Handles SERIAL / IDENTITY-like defaults that use nextval(...)
  const { rows } = await client.query(
    `
    SELECT
      column_name,
      pg_get_serial_sequence(format('%I.%I', $1, $2), column_name) AS seq_name
    FROM information_schema.columns
    WHERE table_schema = $1
      AND table_name = $2
      AND column_default LIKE 'nextval%'
    `,
    [schema, table]
  );

  for (const { column_name, seq_name } of rows) {
    if (!seq_name) continue;
    const maxRes = await client.query(
      `SELECT MAX(${qIdent(column_name)})::bigint AS max_id FROM ${tableRef(schema, table)}`
    );
    const maxId = Number(maxRes.rows?.[0]?.max_id ?? 0);

    if (Number.isFinite(maxId) && maxId > 0) {
      await client.query(`SELECT setval($1, $2, true)`, [seq_name, maxId]);
    } else {
      // No rows -> set sequence to 1 and mark as not-called
      await client.query(`SELECT setval($1, 1, false)`, [seq_name]);
    }
  }
}

async function migrateTable({ source, target, schema, table }) {
  const cols = await getColumns(source, schema, table);
  if (cols.length === 0) {
    console.log(`⚠️  Skipping ${schema}.${table} (no columns)`);
    return;
  }

  const pkCols = await getPrimaryKeyColumns(source, schema, table);
  const quotedCols = cols.map(qIdent);
  const selectCols = quotedCols.join(", ");

  const orderBy =
    pkCols.length > 0 ? pkCols.map(qIdent).join(", ") : quotedCols[0];

  const colCount = cols.length;
  const maxRowsByParams = Math.max(1, Math.floor(PG_MAX_PARAMS / colCount));
  const pageSize = Math.max(1, Math.min(BATCH_SIZE, maxRowsByParams));

  let offset = 0;
  let total = 0;

  console.log(
    `🚀 Migrating ${schema}.${table} (batch=${pageSize}, pk=${pkCols.length ? pkCols.join(",") : "none"
    })`
  );

  while (true) {
    const res = await source.query(
      `
      SELECT ${selectCols}
      FROM ${tableRef(schema, table)}
      ORDER BY ${orderBy}
      LIMIT $1 OFFSET $2
      `,
      [pageSize, offset]
    );

    const rows = res.rows;
    if (rows.length === 0) break;

    // Flatten values in consistent column order
    const values = [];
    for (const r of rows) {
      for (const c of cols) values.push(r[c]);
    }

    const rowsPlaceholders = rows
      .map((_, rowIdx) => {
        const base = rowIdx * colCount;
        const ph = cols.map((__, colIdx) => `$${base + colIdx + 1}`).join(", ");
        return `(${ph})`;
      })
      .join(", ");

    let conflictSql = "ON CONFLICT DO NOTHING";
    if (pkCols.length > 0) {
      const nonPkCols = cols.filter(c => !pkCols.includes(c));
      if (nonPkCols.length === 0) {
        conflictSql = `ON CONFLICT (${pkCols.map(qIdent).join(", ")}) DO NOTHING`;
      } else {
        const setSql = nonPkCols
          .map(c => `${qIdent(c)} = EXCLUDED.${qIdent(c)}`)
          .join(", ");
        conflictSql = `ON CONFLICT (${pkCols
          .map(qIdent)
          .join(", ")}) DO UPDATE SET ${setSql}`;
      }
    } else if (offset === 0) {
      console.log(
        `⚠️  ${schema}.${table} has no primary key; conflicts can't be detected reliably. Using DO NOTHING on conflicts.`
      );
    }

    await target.query(
      `
      INSERT INTO ${tableRef(schema, table)} (${quotedCols.join(", ")})
      VALUES ${rowsPlaceholders}
      ${conflictSql}
      `,
      values
    );

    offset += rows.length;
    total += rows.length;
    console.log(`✅ ${schema}.${table}: migrated ${total} rows`);
  }

  await resetSequencesForTable(target, schema, table);
  console.log(`🎯 ${schema}.${table}: done (rows=${total})`);
}

async function migrate() {
  const source = new Client({ connectionString: SOURCE_DB_URL });
  const target = new Client({ connectionString: TARGET_DB_URL });

  try {
    await source.connect();
    await target.connect();

    // Best-effort: reduce FK constraint pain while bulk inserting.
    // This requires superuser on many Postgres setups; if it fails, we continue.
    try {
      await target.query("SET session_replication_role = replica");
    } catch (e) {
      console.log(
        `⚠️  Could not disable triggers/constraints via session_replication_role (continuing): ${e.message}`
      );
    }

    const tables = await getTables(source, SCHEMA);
    const fkEdges = await getForeignKeyEdges(source, SCHEMA);
    const orderedTables = topoSortTables(tables, fkEdges);

    console.log(
      `📦 Tables to migrate (${orderedTables.length}): ${orderedTables.join(", ")}`
    );

    for (const table of orderedTables) {
      await migrateTable({ source, target, schema: SCHEMA, table });
    }

    try {
      await target.query("SET session_replication_role = origin");
    } catch (_) {
      // ignore
    }

    console.log("🎉 Migration completed successfully");
  } finally {
    await source.end().catch(() => { });
    await target.end().catch(() => { });
  }
}

migrate().catch(err => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
