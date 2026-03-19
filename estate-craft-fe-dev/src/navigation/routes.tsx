import { lazy } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { withSuspenseAndErrorBoundary } from '../hoc/withSuspenseAndErrorBoundary';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { ModuleAccessGuard } from '../components/common/ModuleAccessGuard';
import { MainLayout } from '../components/layout/MainLayout';

import DeliverablePage from '../pages/projects/Deliverable/DeliverablePage';
import PaymentPage from '../pages/projects/Payment/PaymentPage';
import ReportsPage from '../pages/projects/Reports/ReportsPage';
import SiteVisitPage from '../pages/projects/SiteVisit/SiteVisitPage';
import CreateSiteVisitPage from '../pages/projects/SiteVisit/Create/CreateSiteVisitPage';
import EditSiteVisitPage from '../pages/projects/SiteVisit/Edit/EditSiteVisitPage';
import SiteVisitSummaryPage from '../pages/projects/SiteVisit/Summary/SiteVisitSummaryPage';
import ProjectLayout from '../components/layout/ProjectLayout';
import UserSettingsPage from '../pages/settings/UserSettings/UserSettings';
import RoleSettingsPage from '../pages/settings/Roles/RoleSettingsPage';
import SettingsLayout from '../components/layout/SettingsLayout';
import PhaseSettingsPage from '../pages/settings/Phase/PhaseSettingsPage';
import ProjectSettingsPage from '../pages/settings/ProjectSettings/ProjectSettingsPage';
import IntegrationPage from '../pages/settings/Integration/IntegrationPage';
import ProductPage from '../pages/settings/Product/ProductPage';
import OrganizationPage from '../pages/settings/OrganizationPage/OrganizationPage';
import TimelineTemplatePage from '../pages/settings/TimelineTemplate/TimelineTemplatePage';
import TimelineTemplateDetailPage from '../pages/settings/TimelineTemplate/TimelineTemplateDetail/TimelineTemplateDetailPage';

const LoginPage = withSuspenseAndErrorBoundary(lazy(() => import('../pages/login/Login')));

const Summary = withSuspenseAndErrorBoundary(
  lazy(() => import('../pages/summary/Summary').then((module) => ({ default: module.Summary }))),
);

const Projects = withSuspenseAndErrorBoundary(
  lazy(() => import('../pages/projects/Projects').then((module) => ({ default: module.Projects }))),
);

const Tasks = withSuspenseAndErrorBoundary(
  lazy(() => import('../pages/tasks/Tasks').then((module) => ({ default: module.Tasks }))),
);

const CalendarPage = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../pages/calendar/CalendarPage').then((module) => ({ default: module.default })),
  ),
);

const Libraries = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../pages/libraries/Libraries').then((module) => ({ default: module.Libraries })),
  ),
);

const Messages = withSuspenseAndErrorBoundary(
  lazy(() => import('../pages/messages/Messages').then((module) => ({ default: module.Messages }))),
);

const Clients = withSuspenseAndErrorBoundary(
  lazy(() => import('../pages/clients/Clients').then((module) => ({ default: module.Clients }))),
);

const Vendors = withSuspenseAndErrorBoundary(
  lazy(() => import('../pages/vendors/Vendors').then((module) => ({ default: module.Vendors }))),
);

const Users = withSuspenseAndErrorBoundary(
  lazy(() => import('../pages/users/Users').then((module) => ({ default: module.Users }))),
);

// const Settings = withSuspenseAndErrorBoundary(
//   lazy(() => import('../pages/settings/Settings').then((module) => ({ default: module.Settings }))),
// );

const AddProjectTypePage = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../pages/settings/addProjectType/AddProjectTypePage').then((module) => ({
      default: module.default,
    })),
  ),
);

const AddNewRoleContractForm = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../components/library/AddNewRoleContractForm').then((module) => ({
      default: module.default,
    })),
  ),
);

const ProjectQuotationPage = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../pages/projects/Quotation/ProjectQuotationPage').then((module) => ({
      default: module.default,
    })),
  ),
);

const AddQuotationPage = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../pages/projects/Quotation/Add/AddQuotationPage').then((module) => ({
      default: module.default,
    })),
  ),
);

const ProjectsSummary = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../pages/projects/summary/ProjectsSummary').then((module) => ({
      default: module.default,
    })),
  ),
);

const MessageTitle = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../pages/messages/messageTitle/MessageTitle').then((module) => ({
      default: module.default,
    })),
  ),
);

const ViewQuotationPage = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../pages/projects/Quotation/View/ViewQuotationPage').then((module) => ({
      default: module.default,
    })),
  ),
);

const ProjectFilesPage = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../pages/projects/Files/ProjectFilesPage').then((module) => ({
      default: module.default,
    })),
  ),
);

const ProjectTimelinePage = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../pages/projects/Timeline/ProjectTimelinePage').then((module) => ({
      default: module.default,
    })),
  ),
);

const TimelineDetailPage = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../pages/projects/Timeline/TimelineDetail/TimelineDetailPage').then((module) => ({
      default: module.default,
    })),
  ),
);

const ProjectSnagPage = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../pages/projects/Snag/ProjectSnagPage').then((module) => ({
      default: module.default,
    })),
  ),
);

const ProjectTasksPage = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../pages/projects/Task/ProjectTasksPage').then((module) => ({
      default: module.default,
    })),
  ),
);

const ProjectVersionPage = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../pages/projects/Version/ProjectVersionPage').then((module) => ({
      default: module.default,
    })),
  ),
);

const CreateVersionPage = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../pages/projects/Version/CreateVersion/CreateVersionPage').then((module) => ({
      default: module.default,
    })),
  ),
);

const ProjectMomPage = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../pages/projects/Mom/ProjectMomPage').then((module) => ({
      default: module.default,
    })),
  ),
);

const TimesheetPage = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../pages/timesheet/TimesheetPage').then((module) => ({
      default: module.default,
    })),
  ),
);

const TimesheetApprovalsPage = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../pages/timesheet/TimesheetApprovalsPage').then((module) => ({
      default: module.default,
    })),
  ),
);

const CreateInvoicePage = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../pages/projects/Payment/Create/CreateInvoicePage').then((module) => ({
      default: module.default,
    })),
  ),
);

const EditProjectTypePage = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../pages/settings/Phase/EditProjectType/EditProjectTypePage').then((module) => ({
      default: module.default,
    })),
  ),
);

const EditQuotationPage = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../pages/projects/Quotation/Edit/EditQuotationPage').then((module) => ({
      default: module.default,
    })),
  ),
);

const ForgotPasswordPage = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../pages/login/forgot-password/ForgotPasswordPage').then((module) => ({
      default: module.default,
    })),
  ),
);

const OnboardingCheckPage = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../pages/login/onboarding/OnboardingCheck').then((module) => ({
      default: module.default,
    })),
  ),
);

const VerifyOtpPage = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../pages/login/verify-otp/VerifyOtpPage').then((module) => ({
      default: module.default,
    })),
  ),
);

const ResetPasswordPage = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../pages/login/reset-password/ResetPasswordPage').then((module) => ({
      default: module.default,
    })),
  ),
);

const OtpCopyPage = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../pages/login/otp/OtpCopyPage').then((module) => ({
      default: module.default,
    })),
  ),
);

const NotFoundPage = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../components/common/NotFoundPage').then((module) => ({
      default: module.default,
    })),
  ),
);

const ClientDetailPage = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../pages/clients/ClientDetailPage').then((module) => ({
      default: module.default,
    })),
  ),
);

const VendorDetailPage = withSuspenseAndErrorBoundary(
  lazy(() =>
    import('../pages/vendors/VendorDetailPage').then((module) => ({
      default: module.default,
    })),
  ),
);

// import LoginPage from '../pages/login/Login';
// import CreateTaskPage from '../pages/projects/Task/CreateTask/CreateTaskPage';

export const RoutesSetup = () => {
  return (
    <Routes>
      <Route path='/login' element={<LoginPage />} />
      <Route path='/login/forgot-password' element={<ForgotPasswordPage />} />
      <Route path='/login/verify-otp' element={<VerifyOtpPage />} />
      <Route path='/login/reset-password' element={<ResetPasswordPage />} />
      <Route path='/login/otp' element={<OtpCopyPage />} />
      <Route path='/login/onboarding/:uuid' element={<OnboardingCheckPage />} />
      <Route
        path='/'
        element={
          <ProtectedRoute>
            <ModuleAccessGuard>
              <MainLayout />
            </ModuleAccessGuard>
          </ProtectedRoute>
        }
      >
        <Route index element={<Summary />} />
        <Route path='summary' element={<Summary />} />
        <Route path='projects' element={<Projects />} />
        <Route path='timesheet' element={<TimesheetPage />} />
        <Route path='timesheet/approvals' element={<TimesheetApprovalsPage />} />

        <Route path='projects/:id' element={<ProjectLayout />}>
          <Route index element={<Navigate to='summary' replace />} />
          <Route path='summary' element={<ProjectsSummary />} />
          <Route path='quotation' element={<ProjectQuotationPage />} />
          <Route path='quotation/add' element={<AddQuotationPage />} />
          <Route path='quotation/edit/:quotationId' element={<EditQuotationPage />} />
          <Route path='quotation/view/:quotationId' element={<ViewQuotationPage />} />
          <Route path='files' element={<ProjectFilesPage />} />
          <Route path='timeline' element={<ProjectTimelinePage />} />
          <Route path='timeline/:timelineId' element={<TimelineDetailPage />} />
          <Route path='snag' element={<ProjectSnagPage />} />
          <Route path='task' element={<ProjectTasksPage />} />
          <Route path='version' element={<ProjectVersionPage />} />
          <Route path='version/create-version' element={<CreateVersionPage />} />
          <Route path='mom' element={<ProjectMomPage />} />
          <Route path='deliverable' element={<DeliverablePage />} />
          <Route path='payment' element={<PaymentPage />} />
          <Route path='payment/create' element={<CreateInvoicePage />} />
          <Route path='reports' element={<ReportsPage />} />
          <Route path='site-visit' element={<SiteVisitPage />} />
          <Route path='site-visit/create' element={<CreateSiteVisitPage />} />
          <Route path='site-visit/:siteVisitId/edit' element={<EditSiteVisitPage />} />
          <Route path='site-visit/:siteVisitId/summary' element={<SiteVisitSummaryPage />} />
        </Route>

        {/* <Route path='projects/task/create-task' element={<CreateTaskPage />} /> */}
        <Route path='tasks' element={<Tasks />} />
        <Route path='calendar' element={<CalendarPage />} />
        <Route path='libraries' element={<Libraries />} />
        <Route path='libraries/add-new-role-contract' element={<AddNewRoleContractForm />} />
        <Route path='messages' element={<Messages />} />
        <Route path='messages/message-title' element={<MessageTitle />} />
        <Route path='clients' element={<Clients />} />
        <Route path='clients/:id' element={<ClientDetailPage />} />
        <Route path='vendors' element={<Vendors />} />
        <Route path='vendors/:id' element={<VendorDetailPage />} />
        <Route path='users' element={<Users />} />
        <Route path='settings' element={<SettingsLayout />}>
          <Route path='user' element={<UserSettingsPage />} />
          <Route path='role' element={<RoleSettingsPage />} />
          <Route path='phase' element={<PhaseSettingsPage />} />
          <Route path='phase/edit-project-type/:id' element={<EditProjectTypePage />} />
          <Route path='project-settings' element={<ProjectSettingsPage />} />
          <Route path='integration' element={<IntegrationPage />} />
          <Route path='organization' element={<OrganizationPage />} />
          <Route path='product' element={<ProductPage />} />
          <Route path='add-project-type' element={<AddProjectTypePage />} />
          <Route path='timeline-template' element={<TimelineTemplatePage />} />
          <Route path='timeline-template/:id' element={<TimelineTemplateDetailPage />} />
        </Route>
      </Route>
      <Route path='*' element={<NotFoundPage />} />
    </Routes>
  );
};
