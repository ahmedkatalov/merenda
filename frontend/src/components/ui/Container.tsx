import type { ElementType, HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface ContainerProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  narrow?: boolean;
}

export function Container({ as, narrow, className, ...rest }: ContainerProps) {
  const Tag: ElementType = as ?? 'div';
  return <Tag className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', narrow ? 'max-w-3xl' : 'max-w-site', className)} {...rest} />;
}
