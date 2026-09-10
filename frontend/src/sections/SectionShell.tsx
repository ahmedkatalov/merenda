import type { HTMLAttributes, ReactNode } from 'react';
import type { PageSection } from '@merenda/shared';
import { cn } from '@/lib/cn';

interface Props extends HTMLAttributes<HTMLElement> {
  section: PageSection;
  anchorId: string;
  belowFold?: boolean;
  children: ReactNode;
  /** Skip default section paddings. */
  bare?: boolean;
}

/** Common wrapper: anchor id for nav, data-section-id for the live preview, density-aware paddings. */
export function SectionShell({ section, anchorId, belowFold, bare, className, children, ...rest }: Props) {
  return (
    <section id={anchorId} data-section-id={section.id} data-section-type={section.type} className={cn(!bare && 'section-py', belowFold && 'below-fold', className)} {...rest}>
      {children}
    </section>
  );
}
