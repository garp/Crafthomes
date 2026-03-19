import { useState } from 'react';
import { Button, Skeleton } from '@mantine/core';
import { IconBriefcase, IconChevronRight, IconUsers } from '@tabler/icons-react';
import { useGetOrganizationQuery } from '../../../store/services/settings/settings';
import { UserOrgCard } from '../../../components/common/UserOrgCard';
import type { TOrgUser } from '../../../store/types/user.types';
import ManageDesignationsSidebar from './components/ManageDesignationsSidebar';
import ManageDepartmentsSidebar from './components/ManageDepartmentsSidebar';

const uniqById = (users: TOrgUser[] = []) => {
  const map = new Map<string, TOrgUser>();
  for (const u of users) {
    if (u?.id && !map.has(u.id)) map.set(u.id, u);
  }
  return Array.from(map.values());
};

const getInitials = (name: string) => {
  if (!name) return '';
  const parts = name.split(' ');
  return parts[0].charAt(0).toUpperCase() + (parts[1]?.charAt(0)?.toUpperCase() || '');
};

const bgColors = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
];

const getColorForName = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return bgColors[Math.abs(hash) % bgColors.length];
};

/** Top-level hero card for the selected user */
const PersonCard = ({
  user,
  actionLabel,
  onAction,
}: {
  user: TOrgUser;
  actionLabel?: string;
  onAction?: () => void;
}) => {
  const designation = user.designation?.displayName || user.designation?.name || '';

  return (
    <div className='w-full max-w-2xl rounded-lg border border-gray-200 bg-white px-6 py-5 shadow-sm'>
      <div className='flex items-center gap-4'>
        {/* Avatar */}
        {user.profilePhoto ? (
          <img
            src={user.profilePhoto}
            alt={user.name}
            className='w-14 h-14 rounded-full object-cover border border-gray-200'
          />
        ) : (
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold border border-gray-200 ${getColorForName(
              user.name,
            )}`}
          >
            {getInitials(user.name)}
          </div>
        )}

        {/* Info */}
        <div className='flex-1 min-w-0'>
          <p className='text-base font-semibold text-gray-900 truncate'>{user.name}</p>
          {designation && <p className='text-sm text-gray-600'>{designation}</p>}
          {user.department && <p className='text-sm text-gray-500'>{user.department}</p>}
        </div>

        {actionLabel && onAction && (
          <button
            type='button'
            onClick={onAction}
            className='inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
          >
            <span className='hidden sm:inline'>{actionLabel}</span>
            <IconChevronRight className='w-4 h-4 text-gray-500' />
          </button>
        )}
      </div>
    </div>
  );
};

const OrgTreeHeader = ({
  user,
  onNavigateToManager,
}: {
  user: TOrgUser;
  onNavigateToManager?: () => void;
}) => {
  const manager = user.ReportsTo || null;

  return (
    <div className='mb-6 flex flex-col items-center justify-center'>
      {manager && (
        <>
          <PersonCard user={manager} actionLabel='View' onAction={onNavigateToManager} />

          {/* Connector */}
          <div className='flex flex-col items-center py-3'>
            <div className='h-6 w-px bg-gray-300' />
            <div className='h-2 w-2 rounded-full bg-gray-300' />
            <div className='h-6 w-px bg-gray-300' />
          </div>
        </>
      )}

      <PersonCard
        user={user}
        actionLabel={manager ? 'Manager' : undefined}
        onAction={manager ? onNavigateToManager : undefined}
      />
    </div>
  );
};

const OrgSkeleton = () => {
  return (
    <div className='relative max-w-6xl mx-auto'>
      {/* Tree header skeleton */}
      <div className='mb-6 flex flex-col items-center justify-center'>
        <div className='w-full max-w-2xl rounded-lg border border-gray-200 bg-white px-6 py-5 shadow-sm'>
          <div className='flex items-center gap-4'>
            <Skeleton height={56} width={56} radius={9999} />
            <div className='flex-1'>
              <Skeleton height={14} width='40%' radius='sm' />
              <div className='mt-2'>
                <Skeleton height={12} width='55%' radius='sm' />
              </div>
              <div className='mt-2'>
                <Skeleton height={12} width='35%' radius='sm' />
              </div>
            </div>
            <Skeleton height={36} width={90} radius='md' />
          </div>
        </div>

        <div className='flex flex-col items-center py-3'>
          <div className='h-6 w-px bg-gray-200' />
          <div className='h-2 w-2 rounded-full bg-gray-200' />
          <div className='h-6 w-px bg-gray-200' />
        </div>

        <div className='w-full max-w-2xl rounded-lg border border-gray-200 bg-white px-6 py-5 shadow-sm'>
          <div className='flex items-center gap-4'>
            <Skeleton height={56} width={56} radius={9999} />
            <div className='flex-1'>
              <Skeleton height={14} width='45%' radius='sm' />
              <div className='mt-2'>
                <Skeleton height={12} width='60%' radius='sm' />
              </div>
              <div className='mt-2'>
                <Skeleton height={12} width='40%' radius='sm' />
              </div>
            </div>
            <Skeleton height={36} width={90} radius='md' />
          </div>
        </div>
      </div>

      {/* Section skeleton */}
      <div className='rounded-lg border border-gray-200 bg-white p-6 shadow-sm mb-6'>
        <div className='flex items-center justify-between mb-5'>
          <Skeleton height={12} width={220} radius='sm' />
          <Skeleton height={24} width={36} radius={9999} />
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
          {Array.from({ length: 6 }, (_, idx) => `report-${idx}`).map((key) => (
            <div key={key} className='rounded-lg border border-gray-200 bg-white px-4 py-3'>
              <div className='flex items-center gap-3'>
                <Skeleton height={40} width={40} radius={9999} />
                <div className='flex-1'>
                  <Skeleton height={12} width='55%' radius='sm' />
                  <div className='mt-2'>
                    <Skeleton height={10} width='45%' radius='sm' />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='mt-6'>
        <div className='flex items-center justify-between mb-5'>
          <Skeleton height={12} width={200} radius='sm' />
          <Skeleton height={24} width={36} radius={9999} />
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
          {Array.from({ length: 6 }, (_, idx) => `coworker-${idx}`).map((key) => (
            <div key={key} className='rounded-lg border border-gray-200 bg-white px-4 py-3'>
              <div className='flex items-center gap-3'>
                <Skeleton height={40} width={40} radius={9999} />
                <div className='flex-1'>
                  <Skeleton height={12} width='55%' radius='sm' />
                  <div className='mt-2'>
                    <Skeleton height={10} width='45%' radius='sm' />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function OrganizationPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [designationsSidebarOpen, setDesignationsSidebarOpen] = useState(false);
  const [departmentsSidebarOpen, setDepartmentsSidebarOpen] = useState(false);

  const { data, isLoading, isFetching } = useGetOrganizationQuery(
    selectedUserId ? { userId: selectedUserId } : undefined,
  );

  const orgData = data?.data;

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleNavigateToManager = () => {
    if (orgData?.user?.ReportsTo) {
      setSelectedUserId(orgData.user.ReportsTo.id);
    }
  };

  if (isLoading) {
    return <OrgSkeleton />;
  }

  if (!orgData) {
    return (
      <div className='flex items-center justify-center h-96'>
        <p className='text-gray-500'>No organization data found.</p>
      </div>
    );
  }

  const userName = orgData.user.name;
  const managerId = orgData.user.ReportsTo?.id;

  // Ensure we don't show the same person twice (e.g. manager also in "also works with")
  const directReports = uniqById(orgData.directReports);
  const directReportIds = new Set(directReports.map((u) => u.id));
  const alsoWorksWith = uniqById(orgData.alsoWorksWith).filter((u) => {
    if (!u?.id) return false;
    if (u.id === orgData.user.id) return false;
    if (managerId && u.id === managerId) return false;
    if (directReportIds.has(u.id)) return false;
    return true;
  });

  return (
    <div className='relative max-w-6xl mx-auto'>
      {/* Management Buttons */}
      <div className='flex items-center gap-3 mb-6'>
        <Button
          style={{
            outline: 'none',
            color: '#222',
            fontWeight: 500,
            background: 'white',
            border: '1px solid black',
          }}
          leftSection={<IconBriefcase size={18} color='#222' />}
          onClick={() => setDesignationsSidebarOpen(true)}
        >
          Designations
        </Button>
        <Button
          style={{
            outline: 'none',
            color: '#222',
            fontWeight: 500,
            background: 'white',
            border: '1px solid black',
          }}
          leftSection={<IconUsers size={18} color='#222' />}
          onClick={() => setDepartmentsSidebarOpen(true)}
        >
          Departments
        </Button>
      </div>

      {/* Sidebars */}
      <ManageDesignationsSidebar
        opened={designationsSidebarOpen}
        onClose={() => setDesignationsSidebarOpen(false)}
      />
      <ManageDepartmentsSidebar
        opened={departmentsSidebarOpen}
        onClose={() => setDepartmentsSidebarOpen(false)}
      />

      {/* Loading overlay for refetches */}
      {isFetching && !isLoading && (
        <div className='absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-lg'>
          <div className='w-full max-w-xs'>
            <Skeleton height={10} radius='sm' />
            <div className='mt-2'>
              <Skeleton height={10} radius='sm' />
            </div>
            <div className='mt-2'>
              <Skeleton height={10} width='70%' radius='sm' />
            </div>
          </div>
        </div>
      )}

      {/* Tree Header (Manager -> User) */}
      <OrgTreeHeader
        user={orgData.user}
        onNavigateToManager={orgData.user.ReportsTo ? handleNavigateToManager : undefined}
      />

      {/* Direct Reports Section */}
      {directReports.length > 0 && (
        <div className='rounded-lg border border-gray-200 bg-white p-6 shadow-sm mb-6'>
          <div className='flex items-center justify-between mb-5'>
            <h3 className='text-sm font-medium text-gray-700'>People reporting to {userName}</h3>
            <span className='text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-1'>
              {directReports.length}
            </span>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
            {directReports.map((user) => (
              <UserOrgCard key={user.id} user={user} onClick={handleUserClick} />
            ))}
          </div>
        </div>
      )}

      {/* Also Works With Section */}
      {alsoWorksWith.length > 0 && (
        <div className='mt-6'>
          <div className='flex items-center justify-between mb-5'>
            <h3 className='text-sm font-medium text-gray-700'>{userName} also works with</h3>
            <span className='text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-1'>
              {alsoWorksWith.length}
            </span>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
            {alsoWorksWith.map((user) => (
              <UserOrgCard key={user.id} user={user} onClick={handleUserClick} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state when no reports and no colleagues */}
      {directReports.length === 0 && alsoWorksWith.length === 0 && (
        <div className='flex items-center justify-center h-48'>
          <p className='text-gray-500 text-sm'>
            No direct reports or colleagues found for this user.
          </p>
        </div>
      )}
    </div>
  );
}
