import IntegrationCard from '../../../components/settings/IntegrationCard';

export default function IntegrationsList() {
  return (
    <div className=' grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2 lg:grid-cols-3 mt-5'>
      <IntegrationCard />
      <IntegrationCard />
      <IntegrationCard />
    </div>
  );
}
