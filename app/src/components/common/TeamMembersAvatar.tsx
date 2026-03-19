import { Tooltip } from '@mantine/core';
import type { TeamMemberAvatarProps } from '../../types/common.types';

export default function TeamMemberAvatar({ members }: TeamMemberAvatarProps) {
  const displayMembers = members.slice(0, 3);
  const remainingCount = members.length - 3;

  // Build tooltip content with all members
  const tooltipContent = (
    <div className='flex flex-col gap-1 py-1'>
      {members.map((member, index) => (
        <div key={index} className='text-sm'>
          <span className='font-medium'>{member.name}</span>
          {member.designation && <span className='text-gray-300 ml-1'>- {member.designation}</span>}
        </div>
      ))}
    </div>
  );

  return (
    <Tooltip label={tooltipContent} position='top' withArrow multiline w={250}>
      <div className='flex items-center -space-x-2 cursor-pointer'>
        {displayMembers.map((member, index) => (
          <div
            key={index}
            className={`w-8 h-8 rounded-full ${member.color} flex items-center justify-center text-white text-xs font-medium border-2 border-white`}
          >
            {member.initial}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className='w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-medium border-2 border-white'>
            +{remainingCount}
          </div>
        )}
      </div>
    </Tooltip>
  );
}
