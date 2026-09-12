import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import { isPreview } from '@/app/preview';

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: 'div' | 'section' | 'article' | 'li';
}

/**
 * Fade + rise once when entering the viewport. Renders the final (visible)
 * state directly in preview and under prefers-reduced-motion, so content is
 * never left hidden if the reveal animation cannot run.
 */
export function Reveal({ children, className, delay = 0, as = 'div' }: Props) {
  const reduce = useReducedMotion();
  if (isPreview || reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }
  const M = motion[as];
  return (
    <M
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </M>
  );
}
