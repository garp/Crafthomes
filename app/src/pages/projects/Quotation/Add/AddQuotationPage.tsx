import { useNavigate, useParams } from 'react-router-dom';
import { type TCreateQuotationFormData } from '../../../../validators/quotation';

import { toast } from 'react-toastify';
import type { TErrorResponse } from '../../../../store/types/common.types';
// import QuotationForm from './components/QuotationForm';
import { useCreateProjectQuotationMutation } from '../../../../store/services/projectQuotation/projectQuotationSlice';
// import ProjectLayout from '../../../../components/layout/ProjectLayout';
import Container from '../../../../components/common/Container';
import BackButton from '../../../../components/base/button/BackButton';
import QuotationForm from '../../../../components/project/quotation/QuotationForm';
import { useGetProjectsQuery } from '../../../../store/services/project/projectSlice';
import { PageLoader } from '../../../../components';

export default function AddQuotationPage() {
  const { id } = useParams();
  // const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [createQuotation, { isLoading: isCreatingQuotation }] = useCreateProjectQuotationMutation();
  const navigate = useNavigate();
  function handleSubmit(values: TCreateQuotationFormData, resetForm: () => void) {
    createQuotation(values)
      .unwrap()
      .then(() => {
        toast.success('Quotation created successfully');
        navigate(`/projects/${id}/quotation`);
        resetForm();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else toast.error('Unable to create Quotation');
        console.log('Error in creating quotation:', error);
      });
  }
  const { data: projects, isLoading: isLoadingProject } = useGetProjectsQuery({ id: id || '' });
  const client = projects?.projects?.[0]?.client;
  const clientId = client?.id;

  if (isLoadingProject) {
    return (
      <Container className='relative px-0 py-0 overflow-y-auto border max-h-[calc(100vh-11rem)]'>
        <BackButton className='px-5 pt-5' backTo={`/projects/${id}/quotation`}>
          QUOTATION
        </BackButton>
        <PageLoader />
      </Container>
    );
  }

  if (!clientId) {
    return (
      <Container className='relative px-0 py-0 overflow-y-auto border max-h-[calc(100vh-11rem)]'>
        <BackButton className='px-5 pt-5' backTo={`/projects/${id}/quotation`}>
          QUOTATION
        </BackButton>
        <div className='p-5'>
          <p className='text-red-500'>Project or client information not found</p>
        </div>
      </Container>
    );
  }

  return (
    // <ProjectLayout>
    <Container className='relative px-0 py-0  overflow-y-auto border max-h-[calc(100vh-11rem)] pb-20'>
      <BackButton className='px-5 pt-5' backTo={`/projects/${id}/quotation`}>
        QUOTATION
      </BackButton>
      <QuotationForm
        initialValues={{
          projectId: id || '',
          clientId: clientId,
          name: '',
          discount: 0,
          paidAmount: 0,
          totalAmount: 0,
          description: '',
          policyId: null,
          items: [],
        }}
        defaultClientName={client?.name}
        onSubmit={(values, { resetForm }) => handleSubmit(values, resetForm)}
        isSubmitting={isCreatingQuotation}
        mode='create'
      />
    </Container>
    // </ProjectLayout>
  );
}
