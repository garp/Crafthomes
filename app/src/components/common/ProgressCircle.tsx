export default function ProgressCircle({ progress }: { progress: number | null }) {
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const progressValue = progress ?? 0;
  const progressPercentage = Math.min(Math.max(progressValue, 0), 100); // Clamp between 0 and 100
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <div className='flex items-center gap-1 justify-end'>
      <p className='flex items-center justify-center text-xs font-medium'>{progressPercentage}%</p>
      <svg className='w-8 h-8 transform -rotate-90' viewBox='0 0 32 32'>
        <circle cx='16' cy='16' r={radius} stroke='#D4F8D3' strokeWidth='4' fill='none' />
        <circle
          cx='16'
          cy='16'
          r={radius}
          stroke='#24DB24'
          strokeWidth='4'
          fill='none'
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap='round'
        />
      </svg>
    </div>
  );
}
