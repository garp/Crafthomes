import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { containerVariants } from '../../constants/constants';
import { Button, Checkbox, CheckIcon, Loader, Select, Table, TextInput } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { IconChevronDown, IconMinus, IconSearch } from '@tabler/icons-react';
import { useGetRolesQuery } from '../../../../store/services/role/roleSlice';
import {
  useGetEndpointsQuery,
  useGetRolePermissionsQuery,
  useUpdateRolePermissionsMutation,
  type TEndpointGroup,
} from '../../../../store/services/permission/permissionSlice';
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

type RolePermissionTableProps = {
  selectedRoleId: string | null;
  onRoleChange: (roleId: string | null) => void;
};

export const RolePermissionTable = ({ selectedRoleId, onRoleChange }: RolePermissionTableProps) => {
  // Fetch roles
  const { data: rolesData, isLoading: rolesLoading } = useGetRolesQuery();
  const roles = useMemo(() => rolesData?.data || [], [rolesData]);

  // Fetch available endpoints
  const { data: endpointsData, isLoading: endpointsLoading } = useGetEndpointsQuery();
  const endpointGroups: TEndpointGroup[] = useMemo(
    () => endpointsData?.data || [],
    [endpointsData],
  );

  // Fetch permissions for selected role
  const { data: rolePermissionsData, isFetching: permissionsFetching } = useGetRolePermissionsQuery(
    selectedRoleId!,
    {
      skip: !selectedRoleId,
    },
  );

  // Update permissions mutation
  const [updatePermissions, { isLoading: isUpdating }] = useUpdateRolePermissionsMutation();

  // Permission state: { 'endpoint:method': boolean }
  const [permissionState, setPermissionState] = useState<Record<string, boolean>>({});

  // Expanded group state - only one can be open at a time (null means all closed)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Track if there are unsaved changes
  const [hasChanges, setHasChanges] = useState(false);

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Set default role on load
  useEffect(() => {
    if (roles.length > 0 && !selectedRoleId) {
      // Select first role (skip super_admin for default selection)
      const firstNonSuperAdmin = roles.find((r) => r.name !== 'super_admin');
      if (firstNonSuperAdmin) {
        onRoleChange(firstNonSuperAdmin.id);
      } else if (roles[0]) {
        onRoleChange(roles[0].id);
      }
    }
  }, [roles, selectedRoleId, onRoleChange]);

  // Toggle accordion - only one group open at a time
  const toggleAccordion = (groupName: string) => {
    setExpandedGroup((prev) => (prev === groupName ? null : groupName));
  };

  // Initialize permission state when role permissions load
  useEffect(() => {
    if (rolePermissionsData?.data) {
      const permissions = rolePermissionsData.data.permissions;
      const newState: Record<string, boolean> = {};

      // Mark all endpoints from the permission list as enabled
      permissions.forEach((perm) => {
        const key = `${perm.endpoint}:${perm.method}`;
        newState[key] = true;
      });

      setPermissionState(newState);
      setHasChanges(false);
    }
  }, [rolePermissionsData]);

  // Helper to get permission key
  const getPermKey = (endpoint: string, method: string) => `${endpoint}:${method}`;

  // Filter endpoint groups based on search query
  const filteredEndpointGroups = useMemo(() => {
    if (!searchQuery.trim()) return endpointGroups;

    const query = searchQuery.toLowerCase().trim();
    return endpointGroups
      .map((group) => {
        // Check if group name matches
        const groupNameMatch = group.group.toLowerCase().includes(query);

        // Filter endpoints that match the search
        const filteredEndpoints = group.endpoints.filter(
          (ep) =>
            ep.displayName.toLowerCase().includes(query) || ep.name.toLowerCase().includes(query),
        );

        // If group name matches, show all endpoints; otherwise show only matching ones
        if (groupNameMatch) return group;
        if (filteredEndpoints.length > 0) {
          return { ...group, endpoints: filteredEndpoints };
        }
        return null;
      })
      .filter(Boolean) as TEndpointGroup[];
  }, [endpointGroups, searchQuery]);

  // Check if all endpoints in a group are checked
  const isGroupChecked = (group: TEndpointGroup) => {
    return group.endpoints.every((ep) => permissionState[getPermKey(ep.endpoint, ep.method)]);
  };

  // Check if some (but not all) endpoints in a group are checked
  const isGroupIndeterminate = (group: TEndpointGroup) => {
    const checkedCount = group.endpoints.filter(
      (ep) => permissionState[getPermKey(ep.endpoint, ep.method)],
    ).length;
    return checkedCount > 0 && checkedCount < group.endpoints.length;
  };

  // Toggle a single endpoint permission
  const toggleEndpoint = (endpoint: string, method: string) => {
    const key = getPermKey(endpoint, method);
    setPermissionState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setHasChanges(true);
  };

  // Toggle all endpoints in a group
  const toggleGroup = (group: TEndpointGroup) => {
    const allChecked = isGroupChecked(group);
    const newValue = !allChecked;

    setPermissionState((prev) => {
      const newState = { ...prev };
      group.endpoints.forEach((ep) => {
        newState[getPermKey(ep.endpoint, ep.method)] = newValue;
      });
      return newState;
    });
    setHasChanges(true);
  };

  // Save permissions - only send changed permissions
  const handleSave = async () => {
    if (!selectedRoleId) return;

    // Build permissions array - only include enabled ones for efficiency
    const permissions: {
      endpoint: string;
      method: string;
      enabled: boolean;
      name: string;
      displayName: string;
      group: string;
    }[] = [];

    endpointGroups.forEach((group) => {
      group.endpoints.forEach((ep) => {
        const key = getPermKey(ep.endpoint, ep.method);
        permissions.push({
          endpoint: ep.endpoint,
          method: ep.method,
          enabled: !!permissionState[key],
          name: ep.name,
          displayName: ep.displayName,
          group: group.group,
        });
      });
    });

    try {
      const result = await updatePermissions({
        roleId: selectedRoleId,
        permissions,
      }).unwrap();

      toast.success(
        `Permissions updated: ${result.data.created} added, ${result.data.deleted} removed`,
      );
      setHasChanges(false);
    } catch {
      toast.error('Failed to update permissions');
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
  if (rolesLoading || endpointsLoading) {
    return (
      <div className='flex justify-center items-center p-8'>
        <Loader size='lg' color='dark' />
      </div>
    );
  }

  // Get selected role
  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const isSuperAdmin = selectedRole?.name === 'super_admin';

  // Total permission counts (from unfiltered groups)
  const totalPermissions = endpointGroups.reduce((acc, g) => acc + g.endpoints.length, 0);
  const enabledPermissions = Object.values(permissionState).filter(Boolean).length;

  return (
    <motion.div
      variants={containerVariants}
      initial='hidden'
      animate='visible'
      className='bg-white rounded-lg shadow-sm mt-8'
    >
      {/* Header with role selector and save button */}
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
              Super Admin has full access to all endpoints by default.
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

      {/* Permission info + search bar */}
      {selectedRoleId && !isSuperAdmin && (
        <div className='flex items-center justify-between px-4 py-2 bg-gray-50'>
          <div className='text-sm text-gray-600'>
            {permissionsFetching ? (
              <span className='flex items-center gap-2'>
                <Loader size='xs' color='dark' /> Loading permissions...
              </span>
            ) : (
              <span>
                {enabledPermissions} of {totalPermissions} permissions enabled
              </span>
            )}
          </div>
          <TextInput
            placeholder='Search permissions...'
            leftSection={<IconSearch size={16} className='text-gray-400' />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            className='w-64'
            size='xs'
            styles={{
              input: {
                borderColor: '#D1D5DB',
                '&:focus': {
                  borderColor: '#000000',
                },
              },
            }}
          />
        </div>
      )}

      {/* Permissions table */}
      <div className='overflow-x-auto'>
        <Table verticalSpacing='md' withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th className='w-3/4'>Permission</Table.Th>
              <Table.Th className='w-1/4 text-center'>Enabled</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredEndpointGroups.length === 0 && searchQuery.trim() ? (
              <Table.Tr>
                <Table.Td colSpan={2} className='text-center text-gray-500 py-8'>
                  No permissions match &ldquo;{searchQuery}&rdquo;
                </Table.Td>
              </Table.Tr>
            ) : (
              filteredEndpointGroups.map((group) => {
                const isExpanded = expandedGroup === group.group;

                return (
                  <React.Fragment key={group.group}>
                    {/* Group header row */}
                    <Table.Tr className='cursor-pointer bg-[#F0F0F0]! hover:bg-gray-200 transition-colors'>
                      <Table.Td
                        onClick={() => toggleAccordion(group.group)}
                        className='flex items-center gap-2'
                      >
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                        >
                          <IconChevronDown className='w-4 h-4' />
                        </motion.div>
                        <p className='font-semibold'>{group.group}</p>
                        <div className='rounded-full text-sm px-2 ml-auto font-semibold border-[#D9D9D9] border-2'>
                          {group.endpoints.length}
                        </div>
                      </Table.Td>
                      <Table.Td className='text-center'>
                        <div className='flex justify-center cursor-pointer'>
                          <Checkbox
                            indeterminate={isGroupIndeterminate(group)}
                            variant='outline'
                            checked={isGroupChecked(group)}
                            onChange={() => toggleGroup(group)}
                            disabled={isSuperAdmin || permissionsFetching}
                            color='dark'
                            icon={({ className, ...others }) =>
                              isGroupChecked(group) ? (
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

                    {/* Animated endpoint rows */}
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
                                  {group.endpoints.map((endpoint) => {
                                    const permKey = getPermKey(endpoint.endpoint, endpoint.method);
                                    const isChecked = !!permissionState[permKey];

                                    return (
                                      <tr
                                        key={permKey}
                                        className='border-t border-gray-200 transition-all hover:bg-gray-50 cursor-pointer select-none'
                                        onClick={() =>
                                          !isSuperAdmin &&
                                          !permissionsFetching &&
                                          toggleEndpoint(endpoint.endpoint, endpoint.method)
                                        }
                                      >
                                        <td className='py-3 px-4 w-3/4'>
                                          <p className='pl-6'>{endpoint.displayName}</p>
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
                                              toggleEndpoint(endpoint.endpoint, endpoint.method)
                                            }
                                            disabled={isSuperAdmin || permissionsFetching}
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
                  </React.Fragment>
                );
              })
            )}
          </Table.Tbody>
        </Table>
      </div>
    </motion.div>
  );
};
