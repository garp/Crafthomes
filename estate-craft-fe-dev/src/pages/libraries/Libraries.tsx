import { useSearchParams } from 'react-router-dom';
import { PageTransition } from '../../components';
import LibraryHeader from './components/LibraryHeader';
import RateContractsTable from './components/RateContractsTable';
import ElementLibraryTable from './components/ElementLibraryTable';

export const Libraries = () => {
  const [searchParams] = useSearchParams();
  function renderTable() {
    switch (searchParams.get('tab')) {
      case 'elementLibraries':
        return <ElementLibraryTable />;
      case 'rateContracts':
        return <RateContractsTable />;
    }
  }
  return (
    <PageTransition>
      <div className='bg-white rounded-lg p-5 space-y-5'>
        <LibraryHeader />
        {renderTable()}
      </div>
    </PageTransition>
  );
};
