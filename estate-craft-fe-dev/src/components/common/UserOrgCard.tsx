import type { TOrgUser } from '../../store/types/user.types';

type UserOrgCardProps = {
  user: TOrgUser;
  onClick?: (userId: string) => void;
};

const getInitials = (name: string) => {
  if (!name) return '';
  const parts = name.split(' ');
  return parts[0].charAt(0).toUpperCase() + (parts[1]?.charAt(0)?.toUpperCase() || '');
};

const bgColors = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
];

const getColorForName = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return bgColors[Math.abs(hash) % bgColors.length];
};

export const UserOrgCard = ({ user, onClick }: UserOrgCardProps) => {
  const designationLabel = user.designation?.displayName || user.designation?.name || '';

  const isInteractive = typeof onClick === 'function';

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 transition-colors ${
        isInteractive ? 'cursor-pointer hover:bg-gray-50' : ''
      }`}
      onClick={() => (isInteractive ? onClick?.(user.id) : undefined)}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : -1}
      onKeyDown={(e) => {
        if (!isInteractive) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(user.id);
        }
      }}
    >
      {/* Avatar */}
      <div className='relative shrink-0'>
        {user.profilePhoto ? (
          <img
            src={user.profilePhoto}
            alt={user.name}
            className='w-10 h-10 rounded-full object-cover border border-gray-200'
          />
        ) : (
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border border-gray-200 ${getColorForName(user.name)}`}
          >
            {getInitials(user.name)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className='min-w-0'>
        <p className='text-sm font-semibold text-gray-900 truncate'>{user.name}</p>
        {designationLabel && <p className='text-xs text-gray-500 truncate'>{designationLabel}</p>}
      </div>
    </div>
  );
};

export default UserOrgCard;
