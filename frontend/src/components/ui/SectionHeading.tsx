import { cn } from '@/lib/cn';

interface Props {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
}

export function SectionHeading({ title, subtitle, align = 'left', className, as = 'h2' }: Props) {
  if (!title && !subtitle) return null;
  const Tag = as;
  return (
    <div className={cn('mb-8 flex flex-col gap-3 md:mb-10', align === 'center' && 'items-center text-center', className)}>
      {title ? (
        <Tag className="text-[1.75rem] leading-tight md:text-[2.25rem]">
          <span className={cn('inline-flex items-center gap-4', align === 'center' && 'ornament')}>{title}</span>
        </Tag>
      ) : null}
      {subtitle ? <p className="max-w-2xl text-muted md:text-[1.0625rem]">{subtitle}</p> : null}
    </div>
  );
}
