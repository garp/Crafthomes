import { PageTransition } from '../../components';
import { VendorAnalytics, VendorHeader, VendorTable } from './components';

export const Vendors = () => {
  return (
    <PageTransition>
      <VendorAnalytics />
      <VendorHeader />
      <VendorTable />
    </PageTransition>
  );
};
