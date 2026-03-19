import { Suspense } from 'react';
import { Loader } from '../components/common/loaders';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '../components/common/ErrorFallback';

export const withSuspenseAndErrorBoundary =
  (Component: React.ComponentType<any>) => (props: any) => {
    const content = (
      <Suspense fallback={<Loader variant='component' />}>
        <Component {...props} />
      </Suspense>
    );

    return <ErrorBoundary FallbackComponent={ErrorFallback}>{content}</ErrorBoundary>;
  };
