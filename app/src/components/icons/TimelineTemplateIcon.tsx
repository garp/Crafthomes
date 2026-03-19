import type { IconProps } from '.';

export default function TimelineTemplateIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='currentColor'
      xmlns='http://www.w3.org/2000/svg'
    >
      {/* Calendar/Template with timeline bars */}
      <path d='M3.5 1C3.22386 1 3 1.22386 3 1.5V2H2.5C1.67157 2 1 2.67157 1 3.5V13.5C1 14.3284 1.67157 15 2.5 15H13.5C14.3284 15 15 14.3284 15 13.5V3.5C15 2.67157 14.3284 2 13.5 2H13V1.5C13 1.22386 12.7761 1 12.5 1C12.2239 1 12 1.22386 12 1.5V2H4V1.5C4 1.22386 3.77614 1 3.5 1ZM2 5.5V13.5C2 13.7761 2.22386 14 2.5 14H13.5C13.7761 14 14 13.7761 14 13.5V5.5H2Z' />
      {/* Timeline bars inside */}
      <rect x='3' y='7' width='6' height='1.5' rx='0.5' />
      <rect x='3' y='10' width='10' height='1.5' rx='0.5' />
      <rect x='10' y='7' width='3' height='1.5' rx='0.5' />
    </svg>
  );
}
