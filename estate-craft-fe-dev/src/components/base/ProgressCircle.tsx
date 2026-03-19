import { RingProgress, Text } from '@mantine/core';

interface ProgressCircleProps {
  progress: number;
  size?: number;
  thickness?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  labelSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const ProgressCircle = ({
  progress,
  size = 32,
  thickness = 3,
  color = '#ef4444',
  backgroundColor = '#e5e7eb',
  showLabel = true,
  labelSize = 'xs',
  className = '',
}: ProgressCircleProps) => {
  return (
    <div className={`relative ${className}`}>
      <RingProgress
        size={size}
        thickness={thickness}
        sections={[
          {
            value: progress,
            color: color,
          },
        ]}
        rootColor={backgroundColor}
        label={
          showLabel ? (
            <Text size={labelSize} fw={500} ta='center' c={color}>
              {progress}%
            </Text>
          ) : null
        }
      />
    </div>
  );
};
