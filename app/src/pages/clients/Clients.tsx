import { PageTransition } from '../../components';
import { ClientAnalytics, ClientHeader, ClientTable } from './components';

export const Clients = () => {
  return (
    <PageTransition>
      <ClientAnalytics />
      <ClientHeader />
      <ClientTable />
    </PageTransition>
  );
};
