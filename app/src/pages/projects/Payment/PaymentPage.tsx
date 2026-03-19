import { useNavigate, useParams } from 'react-router-dom';
import { useMemo, useEffect, useRef } from 'react';
import CreateScreeen from '../../../components/common/CreateScreen';
import Container from '../../../components/common/Container';
import PaymentTabs from './components/PaymentTabs';
import PaymentTable from './components/PaymentTable';
import { useGetPaymentsQuery } from '../../../store/services/payment/paymentSlice';
import { mapPaymentFromApi } from './utils/paymentUtils';
import useUrlSearchParams from '../../../hooks/useUrlSearchParams';

export default function PaymentPage() {
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log('🔄 PaymentPage RENDER #', renderCount.current);

  const { id } = useParams();
  const navigate = useNavigate();
  const { getParam } = useUrlSearchParams();

  // Get query parameters for API
  const search = getParam('search') || undefined;
  const paymentMethod = getParam('method') || undefined;
  const paymentType = getParam('paymentType') || undefined;
  const startDate = getParam('startDate') || undefined;
  const endDate = getParam('endDate') || undefined;

  console.log('📊 PaymentPage - Query params:', {
    search,
    paymentMethod,
    paymentType,
    startDate,
    endDate,
  });

  // Memoize query params to prevent unnecessary re-fetches
  const queryParams = useMemo(() => {
    const params = {
      projectId: id || '',
      pageLimit: '100',
      ...(search && { search }),
      ...(paymentMethod && { paymentMethod }),
      ...(paymentType && { paymentType }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    };
    console.log('🔧 PaymentPage - Memoized queryParams:', params);
    return params;
  }, [id, search, paymentMethod, paymentType, startDate, endDate]);

  // Fetch payments from API
  const { data: paymentsData, isLoading } = useGetPaymentsQuery(queryParams, { skip: !id });

  console.log('📥 PaymentPage - API Response:', { paymentsData, isLoading });

  // Memoize mapped payments to prevent unnecessary re-renders
  const payments = useMemo(() => {
    const mapped = paymentsData?.payments?.map(mapPaymentFromApi) || [];
    console.log('🗺️ PaymentPage - Mapped payments:', mapped);
    return mapped;
  }, [paymentsData?.payments]);

  useEffect(() => {
    console.log('✅ PaymentPage - Payments changed, count:', payments.length);
  }, [payments]);

  // Calculate counts (for now, show same data in both tabs since we don't have the filter param yet)
  const inboxCount = payments.length;
  const draftsCount = payments.length;

  // Only show empty state if there's no search query and no payments (not when searching)
  const hasSearchQuery = search && search.trim().length > 0;
  const shouldShowEmptyState = !isLoading && payments.length === 0 && !hasSearchQuery;

  if (shouldShowEmptyState) {
    return (
      <CreateScreeen
        onClick={() => navigate(`/projects/${id}/payment/create`)}
        createPageData={{
          heading: 'PAYMENT',
          buttonText: 'Create Payment',
          subtitle:
            "It looks like you don't have any payment yet. Let's create your first timeline to get started!",
          title: 'Get Started with Payment',
        }}
      />
    );
  }

  return (
    <Container className='h-full'>
      <h6 className='font-bold text-sm'>PAYMENT</h6>
      <hr className='border border-gray-200 mt-2 mb-4' />
      <div className='mb-4'>
        <PaymentTabs inboxCount={inboxCount} draftsCount={draftsCount} />
      </div>
      <PaymentTable payments={payments} isLoading={isLoading} />
    </Container>
  );
}
