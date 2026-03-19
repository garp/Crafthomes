import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetProjectQuotationsQuery,
  useUpdateProjectQuotationMutation,
} from '../../../../store/services/projectQuotation/projectQuotationSlice';
import { toast } from 'react-toastify';
import Container from '../../../../components/common/Container';
import BackButton from '../../../../components/base/button/BackButton';
import QuotationForm from '../../../../components/project/quotation/QuotationForm';
import type { TErrorResponse } from '../../../../store/types/common.types';
import type { TCreateQuotationFormData } from '../../../../validators/quotation';
import type { TQuotationItemForm } from '../../../../store/types/projectQuotation.types';
import { PageLoader } from '../../../../components';

export default function EditQuotationPage() {
  const { quotationId, id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading: isLoadingQuotation } = useGetProjectQuotationsQuery({ id: quotationId });
  const [updateQuotation, { isLoading: isUpdating }] = useUpdateProjectQuotationMutation();

  const quotation = data?.quotations?.at(0);

  function handleSubmit(values: TCreateQuotationFormData) {
    if (!quotationId) {
      toast.error('Quotation ID is missing');
      return;
    }

    updateQuotation({ id: quotationId, ...values })
      .unwrap()
      .then(() => {
        toast.success('Quotation updated successfully');
        navigate(`/projects/${id}/quotation`);
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else {
          toast.error('Unable to update quotation');
        }
        console.log('Error in updating quotation:', error);
      });
  }

  if (isLoadingQuotation) {
    return (
      <Container className='relative px-0 py-0 overflow-y-auto border max-h-[calc(100vh-11rem)]'>
        <PageLoader />
      </Container>
    );
  }

  if (!quotation) {
    return (
      <Container className='relative px-0 py-0 overflow-y-auto border max-h-[calc(100vh-11rem)]'>
        <BackButton className='px-5 pt-5' backTo={`/projects/${id}/quotation`}>
          QUOTATION
        </BackButton>
        <div className='p-5'>
          <p className='text-red-500'>Quotation not found</p>
        </div>
      </Container>
    );
  }

  // Map quotation data to form structure
  // The API returns quotationItem array with nested masterItem structure
  const mapQuotationItems = (quotationItems: any[] | undefined): TQuotationItemForm[] => {
    if (!quotationItems || quotationItems.length === 0) return [];

    return quotationItems
      .map((item) => {
        // Extract masterItemId from nested masterItem.id
        const masterItemId = item.masterItem?.id || item.masterItemId || '';

        return {
          masterItemId,
          quantity: item.quantity || 1,
          discount: item.discount || 0,
          total: item.total || 0,
          // Include saved MRP if it exists (editable MRP), else fall back to masterItem.mrp so the field is filled in edit
          mrp:
            item.mrp != null && typeof item.mrp === 'number'
              ? item.mrp
              : (item.masterItem?.mrp ?? undefined),
          area: item.areaRef?.name ?? (item.area != null ? item.area : undefined),
          areaId: item.areaId || item.areaRef?.id || undefined,
          unitId: item.unitId || item.unit?.id || undefined,
          attachmentId: item.attachmentId || undefined,
          attachmentUrl: item.attachment?.url || undefined,
          gst: item.gst ?? 18,
        };
      })
      .filter((item) => item.masterItemId !== ''); // Filter out items without masterItemId
  };

  // Get items from quotationItem (API response) or items (legacy)
  const quotationItems = (quotation as any).quotationItem || quotation.items;
  const mappedItems = mapQuotationItems(quotationItems);

  // Map global discount - check quotation level first, then infer from items if all have same discount
  const getGlobalDiscount = (): number => {
    // First, check if there's a global discount at quotation level
    if (quotation.discount !== undefined && quotation.discount !== null) {
      return quotation.discount;
    }

    // If all items have the same discount, use that as global discount
    if (mappedItems.length > 0) {
      const firstDiscount = mappedItems[0].discount;
      const allSameDiscount = mappedItems.every((item) => item.discount === firstDiscount);
      if (allSameDiscount) {
        return firstDiscount;
      }
    }

    return 0;
  };

  const initialValues: TCreateQuotationFormData = {
    projectId: id || '',
    clientId: quotation.client?.id || null,
    name: quotation.name || '',
    description: quotation.description || '',
    discount: getGlobalDiscount(),
    paidAmount: quotation.paidAmount || 0,
    totalAmount: quotation.totalAmount || 0,
    policyId: (quotation as any).policyId || (quotation as any).policy?.id || null,
    items: mappedItems,
  };

  return (
    <Container className='relative px-0 py-0 overflow-y-auto border max-h-[calc(100vh-11rem)] pb-20'>
      <BackButton className='px-5 pt-5' backTo={`/projects/${id}/quotation`}>
        QUOTATION
      </BackButton>
      <QuotationForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        isSubmitting={isUpdating}
        mode='edit'
        defaultClientName={quotation.client?.name}
      />
    </Container>
  );
}
