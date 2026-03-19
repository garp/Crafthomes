export default function RoleIndicator({ role }: { role: string }) {
  function getColor() {
    switch (role) {
      case 'Super Admin':
        return '#FC7C04';
      case 'Admin':
        return '#037847';
      case 'Editor':
        return '#0653ED';
    }
  }
  return (
    <div
      style={{
        color: getColor(),
      }}
      className={`text-sm leading-0 py-1 font-medium flex items-center  gap-2  `}
    >
      {' '}
      <div className='rounded-full border-5 ' /> {role}
    </div>
  );
}
