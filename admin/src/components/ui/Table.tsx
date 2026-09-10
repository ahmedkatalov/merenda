import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './Skeleton';

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headClassName?: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
  /** Hide this column in the automatic mobile card layout. */
  hideOnMobile?: boolean;
}

export interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Custom mobile card; defaults to label/value pairs. */
  renderCard?: (row: T) => ReactNode;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  skeletonRows?: number;
  empty?: ReactNode;
  className?: string;
  rowClassName?: (row: T) => string | undefined;
}

const aligns = { left: 'text-left', right: 'text-right', center: 'text-center' };

export function Table<T>({ columns, rows, rowKey, renderCard, onRowClick, loading, skeletonRows = 5, empty, className, rowClassName }: TableProps<T>) {
  if (loading) {
    return (
      <div className={cn('overflow-hidden rounded-[var(--radius-card)] border border-zinc-200 bg-white', className)}>
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-zinc-100 px-4 py-3.5 last:border-b-0">
            <Skeleton className="size-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-1/5" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    );
  }
  if (rows.length === 0 && empty) {
    return <div className={cn('rounded-[var(--radius-card)] border border-dashed border-zinc-200 bg-white', className)}>{empty}</div>;
  }
  return (
    <div className={cn('rounded-[var(--radius-card)] border border-zinc-200 bg-white shadow-soft', className)}>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-100">
              {columns.map((c) => (
                <th key={c.key} scope="col" style={c.width ? { width: c.width } : undefined} className={cn('whitespace-nowrap px-4 py-2.5 text-[12px] font-medium uppercase tracking-wide text-zinc-500', aligns[c.align ?? 'left'], c.headClassName)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn('border-b border-zinc-100 transition-colors last:border-b-0', onRowClick && 'cursor-pointer hover:bg-zinc-50/80', rowClassName?.(row))}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-4 py-3 align-middle', aligns[c.align ?? 'left'], c.className)}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile cards */}
      <ul className="divide-y divide-zinc-100 md:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined} className={cn('p-4', onRowClick && 'cursor-pointer active:bg-zinc-50', rowClassName?.(row))}>
            {renderCard ? (
              renderCard(row)
            ) : (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                {columns
                  .filter((c) => !c.hideOnMobile)
                  .map((c) => (
                    <div key={c.key} className="contents">
                      <dt className="text-[12px] font-medium uppercase tracking-wide text-zinc-500">{c.header}</dt>
                      <dd className="min-w-0 text-right text-sm text-zinc-800">{c.cell(row)}</dd>
                    </div>
                  ))}
              </dl>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
