import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { TMenuItem } from '../../types/common.types';
import { cn } from '../../utils/helper';

export const ProjectSidebar = ({ menuItems }: { menuItems: TMenuItem[] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const containerVariants = {
    hidden: {
      opacity: 0,
      x: -50,
      filter: 'blur(6px)',
    },
    visible: {
      opacity: 1,
      x: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.4,
        staggerChildren: 0.04,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      x: -20,
      scale: 0.9,
      rotateY: -25,
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      rotateY: 0,
      transition: {
        duration: 0.25,
      },
    },
  };
  function handleNavigate(path: string) {
    if (path === '/projects') navigate('/projects');
    else navigate(`/projects/${id}${path}`);
  }
  return (
    <>
      <motion.div
        className='fixed left-0 no-scrollbar top-20 w-[68px] bg-white h-[calc(100vh-5rem)] flex flex-col items-center py-3 overflow-y-auto border-r border-[#E0E5EF] z-10'
        initial='hidden'
        animate='visible'
        variants={containerVariants}
      >
        <motion.div className='flex flex-col gap-2' variants={containerVariants}>
          {menuItems.map((item) => {
            // Check if the pathname matches the item path
            // For timeline, we need to match both /timeline and /timeline/:timelineId
            const basePath = `/projects/${id}${item.path}`;
            const isActive =
              location.pathname === basePath ||
              location.pathname.startsWith(`${basePath}/`) ||
              location.pathname.endsWith(item.path);

            return (
              <motion.div
                key={item.id}
                className='flex flex-col items-center cursor-pointer'
                onClick={() => handleNavigate(item.path)}
                variants={itemVariants}
                whileHover={{
                  scale: 1.05,
                  y: -2,
                }}
                whileTap={{
                  scale: 0.95,
                  y: 0,
                }}
                transition={{
                  duration: 0.2,
                  ease: 'easeInOut',
                }}
              >
                <motion.div
                  className='relative w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer group'
                  animate={{
                    backgroundColor: isActive ? '#1F1F1F' : '#F2F4F8',
                  }}
                  whileHover={{
                    backgroundColor: '#1F1F1F',
                    boxShadow: '0 4px 12px rgba(31, 31, 31, 0.15)',
                    scale: 1.1,
                  }}
                  whileTap={{
                    scale: 0.9,
                  }}
                  transition={{
                    duration: 0.2,
                    ease: 'easeInOut',
                  }}
                >
                  <motion.div
                    className='w-4 h-4 flex items-center justify-center'
                    animate={{
                      color: isActive ? '#ffffff' : '#575757',
                    }}
                    whileHover={{
                      color: '#ffffff',
                      scale: 1.1,
                    }}
                    transition={{
                      duration: 0.2,
                    }}
                  >
                    <motion.div
                      className='w-full h-full flex items-center justify-center'
                      whileHover={{
                        rotate: [0, -5, 5, 0],
                        transition: { duration: 0.4 },
                      }}
                    >
                      <item.icon
                        className={cn(
                          `w-full h-full fill-neutral-600`,
                          `${isActive ? 'fill-white' : ''}`,
                          ` group-hover:fill-white`,
                        )}
                      />
                    </motion.div>
                  </motion.div>
                </motion.div>
                <motion.span
                  className='text-[9px] text-[#313131] mt-2 text-center font-semibold'
                  whileHover={{
                    scale: 1.05,
                    color: '#1F1F1F',
                  }}
                  transition={{
                    duration: 0.15,
                  }}
                >
                  {item.label}
                </motion.span>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </>
  );
};
