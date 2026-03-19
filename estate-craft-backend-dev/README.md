# Estate Craft Backend

## Database Setup

### Seed Database

Seed the database with an initial Super Admin user.

**Script:** `prisma/seed.js`

This script creates:
- **Role:** Super Admin
- **Designation:** Depends on designation set (e.g. Admin for Bytive, Founder for Modora)
- **User:** Crafthomes Admin (admin@crafthome.com)

#### Prerequisites

1. Ensure your database is migrated:
   ```bash
   npm run prisma:migrate:deploy
   ```

2. Set `DATABASE_URL` in your `.env.dev` (or appropriate env file)

#### Run Seed

```bash
npm run seed
```

#### Login Credentials

After seeding, use these credentials to login:

| Field    | Value               |
|----------|---------------------|
| Email    | admin@crafthome.com |
| Password | admin@123           |

> **Note:** The seed is idempotent - running it multiple times won't create duplicate records.

---

## Scripts

### Cleanup unlinked master data

Script: `scripts/cleanup-unlinked-master-data.js`

This script helps clean up master tables by deleting records that are not linked/used, with **dry-run by default**.

#### Prerequisites

- Set `DATABASE_URL` in your environment (same as Prisma).

#### Run (dry-run)

```bash
node scripts/cleanup-unlinked-master-data.js
```

#### Run (apply deletes)

```bash
node scripts/cleanup-unlinked-master-data.js --apply
```

#### Flags

- **`--apply`**: Actually performs deletes (otherwise it only prints counts).
- **`--phases-only`**: Only considers/deletes `MasterPhase` candidates.
- **`--tasks-only`**: Only considers/deletes `MasterTask` candidates.
- **`--project-types-only`**: Only considers/deletes `ProjectType` candidates.
- **`--delete-phases-without-tasks`**: Also deletes `MasterPhase` records with **no `MasterPhaseMasterTask` rows** (safety: won’t delete phases used in any project `Phase`).

#### Examples

- Delete phases not linked to any project type (dry-run):

```bash
node scripts/cleanup-unlinked-master-data.js --phases-only
```

- Delete phases with no tasks (apply):

```bash
node scripts/cleanup-unlinked-master-data.js --delete-phases-without-tasks --apply
```

- Delete project types with no `ProjectTypeMasterPhase` mappings (apply):

```bash
node scripts/cleanup-unlinked-master-data.js --project-types-only --apply
```