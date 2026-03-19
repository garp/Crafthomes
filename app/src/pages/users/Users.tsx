import { PageTransition } from '../../components';
import { UserHeader, UserTable } from './components';

export const Users = () => {
  return (
    <PageTransition>
      <UserHeader />
      <UserTable />
    </PageTransition>
  );
};
