interface ProjectStatsCardProps {
  title: string;
  value: number | undefined;
  icon: React.ReactNode;
  variants?: any;
}

export const ProjectStatsCard = ({ title, value, icon }: ProjectStatsCardProps) => {
  return (
    <div
      className='bg-white rounded p-4 shadow-sm border border-border-light flex items-center justify-between'
      // variants={variants}
      // whileHover={{
      //   scale: 1.02,
      //   boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      // }}
      // transition={{ duration: 0.2 }}
    >
      <div className='flex flex-col'>
        <p className='text-sm font-semibold text-[#515151] font-inter tracking-wide mb-2'>
          {title}
        </p>
        <p className='text-5xl font-semibold text-black'>
          {value}
          {title === 'AVERAGE PROGRESS' ? '%' : ''}
        </p>
      </div>

      <div className='text-[#474747] flex items-center justify-center'>{icon}</div>
    </div>
  );
};
