import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { containerVariants } from '../../constants/constants';
import { Button, Checkbox, CheckIcon, Loader, Select, Table } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { IconChevronDown, IconMinus } from '@tabler/icons-react';
import { useGetRolesQuery } from '../../../../store/services/role/roleSlice';
import {
  useGetModuleDefinitionsQuery,
  useGetRoleModuleAccessQuery,
  useUpdateRoleModuleAccessMutation,
  type TModuleDefinition,
} from '../../../../store/services/moduleAccess/moduleAccessSlice';
import { toast } from 'react-toastify';

// Animation variants for accordion
const accordionVariants = {
  collapsed: {
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
  expanded: {
    opacity: 1,
    height: 'auto',
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};

// Helper to build a unique key for a module entry
const makeModuleKey = (topLevel: string, typeLevel?: string | null, subtypeLevel?: string | null) =>
  `${topLevel}::${typeLevel || ''}::${subtypeLevel || ''}`;

// Group module definitions by topLevel
type ModuleGroup = {
  topLevel: string;
  displayName: string;
  children: TModuleDefinition[];
};

const groupModuleDefinitions = (definitions: TModuleDefinition[]): ModuleGroup[] => {
  const groups: ModuleGroup[] = [];
  const groupMap = new Map<string, ModuleGroup>();

  for (const def of definitions) {
    // Top-level only entries (typeLevel is null) are group headers
    if (!def.typeLevel) {
      const group: ModuleGroup = {
        topLevel: def.topLevel,
        displayName: def.displayName,
        children: [],
      };
      groupMap.set(def.topLevel, group);
      groups.push(group);
    }
  }

  // Assign children
  for (const def of definitions) {
    if (def.typeLevel) {
      const group = groupMap.get(def.topLevel);
      if (group) {
        group.children.push(def);
      }
    }
  }

  return groups;
};

type ModuleAccessTableProps = {
  selectedRoleId: string | null;
  onRoleChange: (roleId: string | null) => void;
};

export const ModuleAccessTable = ({ selectedRoleId, onRoleChange }: ModuleAccessTableProps) => {
  // Fetch roles
  const { data: rolesData, isLoading: rolesLoading } = useGetRolesQuery();
  const roles = useMemo(() => rolesData?.data || [], [rolesData]);

  // Fetch module definitions
  const { data: definitionsData, isLoading: definitionsLoading } = useGetModuleDefinitionsQuery();
  const moduleGroups = useMemo(
    () => groupModuleDefinitions(definitionsData?.data || []),
    [definitionsData],
  );

  // Fetch current module access for the selected role
  const { data: roleModuleData, isFetching: moduleAccessFetching } = useGetRoleModuleAccessQuery(
    selectedRoleId!,
    { skip: !selectedRoleId },
  );

  // Mutation
  const [updateModuleAccess, { isLoading: isUpdating }] = useUpdateRoleModuleAccessMutation();

  // Local state: set of enabled module keys
  const [enabledModules, setEnabledModules] = useState<Set<string>>(new Set());

  // Expanded accordion group
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Track unsaved changes
  const [hasChanges, setHasChanges] = useState(false);

  // Select first non-super_admin role by default
  useEffect(() => {
    if (roles.length > 0 && !selectedRoleId) {
      const first = roles.find((r) => r.name !== 'super_admin');
      onRoleChange(first?.id || roles[0]?.id || null);
    }
  }, [roles, selectedRoleId, onRoleChange]);

  // Initialize enabled modules when role data loads
  useEffect(() => {
    if (roleModuleData?.data) {
      const entries = roleModuleData.data.moduleAccess;
      const newSet = new Set<string>();
      entries.forEach((e) => {
        newSet.add(makeModuleKey(e.topLevel, e.typeLevel, e.subtypeLevel));
      });
      setEnabledModules(newSet);
      setHasChanges(false);
    }
  }, [roleModuleData]);

  // Toggle accordion
  const toggleAccordion = (topLevel: string) => {
    setExpandedGroup((prev) => (prev === topLevel ? null : topLevel));
  };

  // Check if a top-level module is enabled (the topLevel-only entry)
  const isTopLevelEnabled = (topLevel: string) => {
    return enabledModules.has(makeModuleKey(topLevel));
  };

  // Check if all children of a group are enabled
  const isGroupAllChecked = (group: ModuleGroup) => {
    if (group.children.length === 0) return isTopLevelEnabled(group.topLevel);
    return (
      isTopLevelEnabled(group.topLevel) &&
      group.children.every((c) =>
        enabledModules.has(makeModuleKey(c.topLevel, c.typeLevel, c.subtypeLevel)),
      )
    );
  };

  // Check if some (but not all) children are enabled
  const isGroupIndeterminate = (group: ModuleGroup) => {
    if (group.children.length === 0) return false;
    const topEnabled = isTopLevelEnabled(group.topLevel);
    const childCount = group.children.filter((c) =>
      enabledModules.has(makeModuleKey(c.topLevel, c.typeLevel, c.subtypeLevel)),
    ).length;
    const allEnabled = topEnabled && childCount === group.children.length;
    const someEnabled = topEnabled || childCount > 0;
    return someEnabled && !allEnabled;
  };

  // Toggle a single module entry
  const toggleModule = (
    topLevel: string,
    typeLevel?: string | null,
    subtypeLevel?: string | null,
  ) => {
    const key = makeModuleKey(topLevel, typeLevel, subtypeLevel);
    setEnabledModules((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    setHasChanges(true);
  };

  // Toggle entire group (topLevel + all children)
  const toggleGroup = (group: ModuleGroup) => {
    const allChecked = isGroupAllChecked(group);
    const newValue = !allChecked;

    setEnabledModules((prev) => {
      const next = new Set(prev);
      const topKey = makeModuleKey(group.topLevel);

      if (newValue) {
        next.add(topKey);
        group.children.forEach((c) => {
          next.add(makeModuleKey(c.topLevel, c.typeLevel, c.subtypeLevel));
        });
      } else {
        next.delete(topKey);
        group.children.forEach((c) => {
          next.delete(makeModuleKey(c.topLevel, c.typeLevel, c.subtypeLevel));
        });
      }
      return next;
    });
    setHasChanges(true);
  };

  // Save
  const handleSave = async () => {
    if (!selectedRoleId) return;

    // Convert the set of keys back to module entries
    const modules: { topLevel: string; typeLevel?: string | null; subtypeLevel?: string | null }[] =
      [];
    enabledModules.forEach((key) => {
      const [topLevel, typeLevel, subtypeLevel] = key.split('::');
      modules.push({
        topLevel,
        typeLevel: typeLevel || null,
        subtypeLevel: subtypeLevel || null,
      });
    });

    try {
      const result = await updateModuleAccess({
        roleId: selectedRoleId,
        modules,
      }).unwrap();

      toast.success(
        `Module access updated: ${result.data.created} added, ${result.data.deleted} removed`,
      );
      setHasChanges(false);
    } catch {
      toast.error('Failed to update module access');
    }
  };

  // Get role display name
  const getRoleDisplayName = (roleName: string) => {
    const displayNames: Record<string, string> = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      internal_user: 'Internal User',
      client: 'Client',
      client_contact: 'Client Contact',
      vendor: 'Vendor',
      vendor_contact: 'Vendor Contact',
    };
    return (
      displayNames[roleName] || roleName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    );
  };

  // Loading state
  if (rolesLoading || definitionsLoading) {
    return (
      <div className='flex justify-center items-center p-8'>
        <Loader size='lg' color='dark' />
      </div>
    );
  }

  // Selected role info
  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const isSuperAdmin = selectedRole?.name === 'super_admin';

  return (
    <motion.div
      variants={containerVariants}
      initial='hidden'
      animate='visible'
      className='bg-white rounded-lg shadow-sm mt-8'
    >
      {/* Header */}
      <div className='flex items-center justify-between p-4 border-b'>
        <div className='flex items-center gap-4'>
          <Select
            label='Select Role'
            placeholder='Choose a role'
            data={roles.map((r) => ({
              value: r.id,
              label: getRoleDisplayName(r.name),
            }))}
            value={selectedRoleId}
            onChange={onRoleChange}
            className='w-64'
          />
          {isSuperAdmin && (
            <p className='text-sm text-amber-600 mt-6'>
              Super Admin has full access to all modules by default.
            </p>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isUpdating || isSuperAdmin}
          loading={isUpdating}
          color='dark'
        >
          Save Changes
        </Button>
      </div>

      {/* Info bar */}
      {selectedRoleId && !isSuperAdmin && (
        <div className='px-4 py-2 bg-gray-50 text-sm text-gray-600'>
          {moduleAccessFetching ? (
            <span className='flex items-center gap-2'>
              <Loader size='xs' color='dark' /> Loading module access...
            </span>
          ) : (
            <span>{enabledModules.size} modules enabled</span>
          )}
        </div>
      )}

      {/* Module access table */}
      <div className='overflow-x-auto'>
        <Table verticalSpacing='md' withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th className='w-3/4'>Module</Table.Th>
              <Table.Th className='w-1/4 text-center'>Enabled</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {moduleGroups.map((group) => {
              const isExpanded = expandedGroup === group.topLevel;
              const hasChildren = group.children.length > 0;

              return (
                <React.Fragment key={group.topLevel}>
                  {/* Group header row */}
                  <Table.Tr className='cursor-pointer bg-[#F0F0F0]! hover:bg-gray-200 transition-colors'>
                    <Table.Td
                      onClick={() => hasChildren && toggleAccordion(group.topLevel)}
                      className='flex items-center gap-2'
                    >
                      {hasChildren ? (
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                        >
                          <IconChevronDown className='w-4 h-4' />
                        </motion.div>
                      ) : (
                        <div className='w-4 h-4' />
                      )}
                      <p className='font-semibold'>{group.displayName}</p>
                      {hasChildren && (
                        <div className='rounded-full text-sm px-2 ml-auto font-semibold border-[#D9D9D9] border-2'>
                          {group.children.length}
                        </div>
                      )}
                    </Table.Td>
                    <Table.Td className='text-center'>
                      <div className='flex justify-center cursor-pointer'>
                        <Checkbox
                          indeterminate={isGroupIndeterminate(group)}
                          variant='outline'
                          checked={isGroupAllChecked(group)}
                          onChange={() => toggleGroup(group)}
                          disabled={isSuperAdmin || moduleAccessFetching}
                          color='dark'
                          icon={({ className, ...others }) =>
                            isGroupAllChecked(group) ? (
                              <CheckIcon className={className} {...others} />
                            ) : (
                              <IconMinus className={className} color='#000000' {...others} />
                            )
                          }
                          styles={{
                            input: {
                              borderRadius: '2px',
                              borderWidth: '2.3px',
                              borderColor: '#000000',
                              cursor: 'pointer',
                            },
                            icon: {
                              color: '#000000',
                            },
                          }}
                        />
                      </div>
                    </Table.Td>
                  </Table.Tr>

                  {/* Animated children rows */}
                  {hasChildren && (
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <Table.Tr>
                          <Table.Td colSpan={2} className='p-0!'>
                            <motion.div
                              initial='collapsed'
                              animate='expanded'
                              exit='collapsed'
                              variants={accordionVariants}
                              className='overflow-hidden'
                            >
                              <table className='w-full'>
                                <tbody>
                                  {group.children.map((child) => {
                                    const childKey = makeModuleKey(
                                      child.topLevel,
                                      child.typeLevel,
                                      child.subtypeLevel,
                                    );
                                    const isChecked = enabledModules.has(childKey);

                                    return (
                                      <tr
                                        key={childKey}
                                        className='border-t border-gray-200 transition-all hover:bg-gray-50 cursor-pointer select-none'
                                        onClick={() =>
                                          !isSuperAdmin &&
                                          !moduleAccessFetching &&
                                          toggleModule(
                                            child.topLevel,
                                            child.typeLevel,
                                            child.subtypeLevel,
                                          )
                                        }
                                      >
                                        <td className='py-3 px-4 w-3/4'>
                                          <p className='pl-6'>{child.displayName}</p>
                                        </td>
                                        <td
                                          className='py-3 px-4 w-1/4 text-center'
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Checkbox
                                            classNames={{
                                              root: 'flex justify-center cursor-pointer',
                                            }}
                                            variant='outline'
                                            checked={isChecked}
                                            onChange={() =>
                                              toggleModule(
                                                child.topLevel,
                                                child.typeLevel,
                                                child.subtypeLevel,
                                              )
                                            }
                                            disabled={isSuperAdmin || moduleAccessFetching}
                                            color='dark'
                                            styles={{
                                              input: {
                                                borderRadius: '2px',
                                                borderWidth: '2.3px',
                                                borderColor: '#000000',
                                                cursor: 'pointer',
                                              },
                                              icon: {
                                                color: '#000000',
                                              },
                                            }}
                                          />
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </motion.div>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </AnimatePresence>
                  )}
                </React.Fragment>
              );
            })}
          </Table.Tbody>
        </Table>
      </div>
    </motion.div>
  );
};
