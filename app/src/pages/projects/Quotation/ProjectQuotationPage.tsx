import { useNavigate, useParams } from 'react-router-dom';
import CreateScreeen from '../../../components/common/CreateScreen';
import { useGetProjectQuotationsQuery } from '../../../store/services/projectQuotation/projectQuotationSlice';
import QuotationTable from './components/QuotationTable';

export default function ProjectQuotationPage() {
  const { id } = useParams();
  const { data: quotationData } = useGetProjectQuotationsQuery({ projectId: id });
  const navigate = useNavigate();
  if (quotationData?.totalCount === 0)
    return (
      <>
        <CreateScreeen
          onClick={() => navigate(`/projects/${id}/quotation/add`)}
          createPageData={{
            heading: 'QUOTATION',
            buttonText: 'Create Quote',
            subtitle:
              'It looks like you don’t have any quotation yet. Let’s create your first folder to get started!',
            title: 'Get Started with Quotation',
          }}
        />
      </>
    );
  return (
    <>
      <QuotationTable />
    </>
  );
}
