interface AppointmentIconProps {
  className?: string;
}

export const AppointmentIcon = ({ className = 'w-5 h-5' }: AppointmentIconProps) => {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 20 20'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
    >
      <path
        d='M9.99984 19.3327C4.84518 19.3327 0.666504 15.154 0.666504 9.99935C0.666504 4.84469 4.84518 0.666016 9.99984 0.666016C15.1544 0.666016 19.3332 4.84469 19.3332 9.99935C19.3332 15.154 15.1544 19.3327 9.99984 19.3327ZM10.9332 9.99935V5.33268H9.0665V11.866H14.6665V9.99935H10.9332Z'
        fill='#6662FF'
      />
    </svg>
  );
};
