import { useNavigate } from 'react-router-dom';
// import { motion } from 'framer-motion';
import { Table, Text } from '@mantine/core';
import { IconAlertTriangle, IconChevronRight } from '@tabler/icons-react';
import { lazy } from 'react';

// import { getTotalPages } from '../../../utils/helper';

import { TextHeader } from '../../../components/base/table/TableHeader';
import { Avatar } from '../../../components/common';
import ProjectStatusDropdown from '../../../components/common/ProjectStatusDropdown';
// import ProgressCircle from '../../../components/common/ProgressCircle';
import TeamMemberAvatar from '../../../components/common/TeamMembersAvatar';
import {
  useDeleteProjectMutation,
  useGetProjectsQuery,
  useLazyGetProjectLinkedDataQuery,
} from '../../../store/services/project/projectSlice';
// import CustomPagination from '../../../components/base/CustomPagination';
import useUrlSearchParams from '../../../hooks/useUrlSearchParams';
import { DeleteButton, EditButton } from '../../../components';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import type { TProject } from '../../../store/types/project.types';
import EditProjectSidebar from '../../../components/project/EditProjectSidebar';
import { format } from 'date-fns';
import TableData from '../../../components/base/table/TableData';
import AlertModal from '../../../components/base/AlertModal';
import { toast } from 'react-toastify';
import type { TErrorResponse } from '../../../store/types/common.types';
import TableLoader from '../../../components/common/loaders/TableLoader';
import NotFoundTextTable from '../../../components/common/NotFound';
import TableWrapper from '../../../components/base/table/TableWrapper';
import { Button } from '../../../components/base';

const CreateProjectSidebar = lazy(() => import('../../../components/project/AddProjectSidebar'));

// const StatusBadge = ({ status }: { status: string }) => {
//   const getStatusConfig = (status: string) => {
//     switch (status) {
//       case 'in-progress':
//         return {
//           bgColor: 'bg-blue-100',
//           textColor: 'text-blue-800',
//           dotColor: 'bg-blue-500',
//         };
//       case 'completed':
//         return {
//           bgColor: 'bg-green-100',
//           textColor: 'text-green-800',
//           dotColor: 'bg-green-500',
//         };
//       case 'on-hold':
//         return {
//           bgColor: 'bg-yellow-100',
//           textColor: 'text-yellow-800',
//           dotColor: 'bg-yellow-500',
//         };
//       case 'cancelled':
//         return {
//           bgColor: 'bg-red-100',
//           textColor: 'text-red-800',
//           dotColor: 'bg-red-500',
//         };
//       default:
//         return {
//           bgColor: 'bg-gray-100',
//           textColor: 'text-gray-800',
//           dotColor: 'bg-gray-500',
//         };
//     }
//   };

//   const config = getStatusConfig(status);

//   return (
//     <div
//       className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
//     >
//       <div className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`}></div>
//       {status.charAt(0).toUpperCase() + status.slice(1)}
//     </div>
//   );
// };

//////////////////////
export const ProjectTable = () => {
  const navigate = useNavigate();
  const { getParam } = useUrlSearchParams();
  const page = getParam('page') || '0';
  const searchQuery = getParam('query') || '';
  const statusFilter = getParam('status') || '';
  const globalQuery = getParam('globalQuery') || '';
  const { data: projectsData, isFetching } = useGetProjectsQuery({
    pageNo: page,
    pageLimit: '10',
    search: searchQuery,
    projectStatus: statusFilter,
    searchText: globalQuery,
  });
  const [deleteProject, { isLoading: isDeletingProject }] = useDeleteProjectMutation();
  const [getProjectLinkedData, { data: linkedData, isFetching: isFetchingLinkedData }] =
    useLazyGetProjectLinkedDataQuery();
  const [selectedProject, setSelectedProject] = useState<TProject | null>(null);
  const [isOpenSidebar, { open: openSidebar, close: closeSidebar }] = useDisclosure();
  const [isOpenDeleteSidebar, { open: openDeleteSidebar, close: closeDeleteSidebar }] =
    useDisclosure(false);
  const [isOpenCreateSidebar, { open: openCreateSidebar, close: closeCreateSidebar }] =
    useDisclosure(false);

  // Check if we should show empty state (no projects and no active filters)
  const hasNoProjects = !isFetching && projectsData?.projects?.length === 0;
  const hasActiveFilters = searchQuery || statusFilter || globalQuery;
  const shouldShowEmptyState = hasNoProjects && !hasActiveFilters;

  function handleDeleteProject() {
    if (!selectedProject?.id) {
      toast.error('Unable to delete project');
      console.log('Selected project id is undefined');
      return;
    }
    deleteProject({ id: selectedProject?.id })
      .unwrap()
      .then(() => {
        toast.success('Project deleted successfully');
        closeDeleteSidebar();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else toast.error('Internal server error');
        console.log('Error in creating user:', error);
      });
  }
  function handleDeleteClick(project: TProject) {
    setSelectedProject(project);
    getProjectLinkedData({ projectId: project.id });
    openDeleteSidebar();
  }

  // Helper to get user initials
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Convert internal users (projectUsers) to TeamMember format for display
  const convertTeamMembers = (project: TProject) => {
    const members: {
      id: string;
      name: string;
      initial: string;
      color: string;
      designation?: string;
    }[] = [];

    // Add internal users from projectUsers
    if (project.projectUsers && project.projectUsers.length > 0) {
      project.projectUsers.forEach((projectUser) => {
        const user = projectUser.user as any;
        if (user?.id && user?.name) {
          const designationName =
            typeof user.designation === 'object' ? user.designation?.displayName : user.designation;
          members.push({
            id: user.id,
            name: user.name,
            initial: getInitials(user.name),
            color: 'bg-blue-500', // Blue color for internal users
            designation: designationName || undefined,
          });
        }
      });
    }

    return members;
  };

  // Show empty state with create button when no projects and no filters
  if (shouldShowEmptyState) {
    return (
      <>
        <div className='w-full h-full flex flex-col items-center justify-center min-h-[400px] bg-white rounded-lg border border-gray-200'>
          <div className='flex flex-col items-center justify-center max-w-md text-center px-4'>
            <p className='font-bold text-xl mb-2'>Get Started with Projects</p>
            <p className='text-text-subHeading mb-6 font-medium'>
              It looks like you don't have any projects yet. Let's create your first project to get
              started!
            </p>
            <Button variant='primary' size='lg' radius='full' onClick={openCreateSidebar}>
              Create Project
            </Button>
          </div>
        </div>
        <CreateProjectSidebar isOpen={isOpenCreateSidebar} onClose={closeCreateSidebar} />
        <EditProjectSidebar
          initialData={selectedProject}
          isOpen={isOpenSidebar}
          onClose={closeSidebar}
        />
        <AlertModal
          onConfirm={handleDeleteProject}
          onClose={closeDeleteSidebar}
          opened={isOpenDeleteSidebar}
          isLoading={isDeletingProject || isFetchingLinkedData}
          isDeleting={isDeletingProject}
          title={`Delete ${selectedProject?.name}?`}
        >
          {isFetchingLinkedData ? (
            <div className='mt-4 flex items-center gap-2 text-sm text-gray-500'>
              <div className='size-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin' />
              Loading...
            </div>
          ) : linkedData?.warnings && linkedData.warnings.length > 0 ? (
            <div className='mt-4 space-y-2'>
              {linkedData.warnings.map((warning, index) => (
                <div
                  key={index}
                  className='flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg'
                >
                  <IconAlertTriangle className='size-4 text-amber-500 shrink-0' />
                  <span className='text-sm text-amber-700'>{warning}</span>
                </div>
              ))}
            </div>
          ) : null}
        </AlertModal>
      </>
    );
  }

  return (
    <>
      <TableWrapper totalCount={projectsData?.totalCount}>
        <Table.Thead>
          <Table.Tr className='h-12 bg-slate-100!'>
            <TextHeader config='srNo'>#</TextHeader>
            <TextHeader config='wider'>Project Name</TextHeader>
            <TextHeader>Client</TextHeader>
            <TextHeader>Team Members</TextHeader>
            <TextHeader config='wider'>Location</TextHeader>
            <TextHeader config='narrow'>Payment</TextHeader>
            <TextHeader config='action'>Due Date</TextHeader>
            <TextHeader config='action'>Last Updated</TextHeader>
            {/* <TextHeader config='action'>Phase</TextHeader> */}
            <TextHeader config='action'>Progress</TextHeader>
            <Table.Th
              className='bg-slate-100! text-center'
              style={{
                position: 'sticky',
                right: '100px',
                zIndex: 10,
                width: '150px',
                minWidth: '150px',
                boxShadow: '-4px 0 8px -4px rgba(0, 0, 0, 0.1)',
              }}
            >
              Status
            </Table.Th>
            <Table.Th
              className='bg-slate-100! text-center'
              style={{
                position: 'sticky',
                right: '0px',
                zIndex: 10,
                width: '100px',
                minWidth: '100px',
              }}
            >
              Actions
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {isFetching ? (
            <TableLoader />
          ) : projectsData?.projects?.length === 0 ? (
            <NotFoundTextTable title='No Projects Found' />
          ) : (
            projectsData?.projects?.map((project) => (
              <Table.Tr
                onClick={() => navigate(`/projects/${project?.id}/summary`)}
                key={project.id}
                className='group h-12 border-b border-gray-200 bg-white hover:bg-linear-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-md hover:scale-[1.005] transition-all duration-300 ease-in-out cursor-pointer'
                style={{ transformOrigin: 'center' }}
              >
                <TableData>{project?.sNo}</TableData>
                <TableData>
                  <Text size='sm' className='font-medium text-gray-900'>
                    {project?.name}
                  </Text>
                </TableData>
                <TableData>
                  <div className='flex items-center space-x-3'>
                    <Avatar
                      name={project?.client?.name}
                      phone={project?.client?.phoneNumber}
                      email={project?.client?.email}
                      size='sm'
                      showTooltip={true}
                    />
                    <Text size='sm' className='font-medium text-gray-900'>
                      {project?.client?.name}
                    </Text>
                  </div>
                </TableData>
                <TableData className='text-center'>
                  <div className='flex justify-center items-center w-full'>
                    {(() => {
                      const teamMembers = convertTeamMembers(project);
                      return teamMembers.length > 0 ? (
                        <TeamMemberAvatar members={teamMembers} />
                      ) : (
                        '—'
                      );
                    })()}
                  </div>
                </TableData>
                <TableData>{project?.address}</TableData>
                <TableData>
                  <PaymentBadge payment={project?.paymentStatus} />
                </TableData>
                <TableData>{project?.endDate && format(project?.endDate, 'yyyy-MM-dd')}</TableData>
                <TableData>
                  {project?.updatedAt && format(project?.updatedAt, 'yyyy-MM-dd')}
                </TableData>
                <TableData>
                  <ProgressBar
                    progress={project?.progress}
                    totalTasks={project?.totalTasks}
                    completedTasks={project?.completedTasks}
                  />
                </TableData>
                <Table.Td
                  className='group-hover:bg-slate-50 bg-white'
                  style={{
                    position: 'sticky',
                    right: '100px',
                    zIndex: 5,
                    width: '150px',
                    minWidth: '150px',
                    boxShadow: '-4px 0 8px -4px rgba(0, 0, 0, 0.1)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ProjectStatusDropdown
                    projectId={project.id}
                    currentStatus={project?.projectStatus}
                  />
                </Table.Td>
                <Table.Td
                  className='group-hover:bg-slate-50 bg-white'
                  style={{
                    position: 'sticky',
                    right: '0px',
                    zIndex: 5,
                    width: '100px',
                    minWidth: '100px',
                  }}
                >
                  <div className='flex gap-2 justify-center'>
                    <EditButton
                      onEdit={() => {
                        setSelectedProject(project);
                        openSidebar();
                      }}
                    />
                    <DeleteButton onDelete={() => handleDeleteClick(project)} />
                  </div>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </TableWrapper>

      <EditProjectSidebar
        initialData={selectedProject}
        isOpen={isOpenSidebar}
        onClose={closeSidebar}
      />
      {/* DELETE MODAL */}
      <AlertModal
        onConfirm={handleDeleteProject}
        onClose={closeDeleteSidebar}
        opened={isOpenDeleteSidebar}
        isLoading={isDeletingProject || isFetchingLinkedData}
        isDeleting={isDeletingProject}
        title={`Delete ${selectedProject?.name}?`}
      >
        {isFetchingLinkedData ? (
          <div className='mt-4 flex items-center gap-2 text-sm text-gray-500'>
            <div className='size-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin' />
            Loading...
          </div>
        ) : linkedData?.warnings && linkedData.warnings.length > 0 ? (
          <div className='mt-4 space-y-2'>
            {linkedData.warnings.map((warning, index) => (
              <div
                key={index}
                className='flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg'
              >
                <IconAlertTriangle className='size-4 text-amber-500 shrink-0' />
                <span className='text-sm text-amber-700'>{warning}</span>
              </div>
            ))}
          </div>
        ) : null}
      </AlertModal>
      <CreateProjectSidebar isOpen={isOpenCreateSidebar} onClose={closeCreateSidebar} />
    </>
  );
};

///////////////////////PaymentBadge
const PaymentBadge = ({ payment }: { payment: string }) => {
  const isPending = payment === 'PENDING';

  return (
    <div
      className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-medium ${
        isPending ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
      }`}
    >
      {isPending ? 'Pending' : 'Paid'}
      <span>
        <IconChevronRight className='size-4' />
      </span>
    </div>
  );
};

///////////////////////ProgressBar
const ProgressBar = ({
  progress,
  totalTasks,
  completedTasks,
}: {
  progress?: number;
  totalTasks?: number;
  completedTasks?: number;
}) => {
  // Calculate progress from tasks if not provided directly
  const calculatedProgress =
    progress !== undefined
      ? progress
      : totalTasks && totalTasks > 0
        ? Math.round(((completedTasks || 0) / totalTasks) * 100)
        : 0;

  const getProgressColor = () => {
    if (calculatedProgress === 0) return 'bg-gray-300';
    if (calculatedProgress < 25) return 'bg-red-500';
    if (calculatedProgress < 50) return 'bg-orange-500';
    if (calculatedProgress < 75) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getTextColor = () => {
    if (calculatedProgress === 0) return 'text-gray-500';
    if (calculatedProgress < 25) return 'text-red-600';
    if (calculatedProgress < 50) return 'text-orange-600';
    if (calculatedProgress < 75) return 'text-blue-600';
    return 'text-green-600';
  };

  return (
    <div className='flex items-center gap-2 min-w-[100px]'>
      <div className='flex-1 h-2 bg-gray-200 rounded-full overflow-hidden'>
        <div
          className={`h-full rounded-full transition-all ${getProgressColor()}`}
          style={{ width: `${calculatedProgress}%` }}
        />
      </div>
      <span className={`text-xs font-semibold ${getTextColor()}`}>{calculatedProgress}%</span>
    </div>
  );
};
