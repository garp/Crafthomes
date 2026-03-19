import { PageTransition } from '../../components';
import { MessagesHeader, MessagesGrid } from './components';

export const Messages = () => {
  return (
    <PageTransition>
      <MessagesHeader />
      <MessagesGrid />
    </PageTransition>
  );
};
