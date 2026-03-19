export type LoaderVariant = 'box' | 'button' | 'component' | 'page';

export interface BoxJumpLoaderProps {
  className?: string;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export interface ButtonLoaderProps {
  text?: string;
}

export interface ComponentLoaderProps {
  text?: string;
  minHeight?: number;
}

export interface PageLoaderProps {
  text?: string;
}

export interface LoaderProps {
  variant?: LoaderVariant;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  minHeight?: number;
}
