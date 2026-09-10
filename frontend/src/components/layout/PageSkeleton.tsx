import { Container } from '@/components/ui/Container';
import { Skeleton } from '@/components/ui/Skeleton';

/** Mirrors the page layout while the bootstrap loads. */
export function PageSkeleton() {
  return (
    <div className="min-h-dvh" aria-busy="true" aria-label="Загрузка">
      <div className="border-b border-border/70">
        <Container className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="hidden gap-6 md:flex">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="hidden h-8 w-28 rounded-full sm:block" />
            <Skeleton className="size-10 rounded-full" />
          </div>
        </Container>
      </div>
      <Container className="section-py grid gap-10 md:grid-cols-2 md:items-center">
        <div className="flex flex-col gap-5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-12 w-full max-w-md" />
          <Skeleton className="h-12 w-3/4 max-w-sm" />
          <Skeleton className="h-4 w-full max-w-lg" />
          <Skeleton className="h-4 w-2/3 max-w-md" />
          <div className="mt-2 flex gap-3">
            <Skeleton className="h-12 w-40 rounded-button" />
            <Skeleton className="h-12 w-32 rounded-button" />
          </div>
        </div>
        <Skeleton className="aspect-[4/3] w-full rounded-card" />
      </Container>
      <Container className="pb-16">
        <Skeleton className="mb-6 h-9 w-40" />
        <div className="mb-8 flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 shrink-0 rounded-full" />
          ))}
        </div>
        <div className="product-grid" style={{ ['--cols-tablet' as string]: 2, ['--cols-desktop' as string]: 3 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-surface overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="flex flex-col gap-3 p-4">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <div className="flex items-center justify-between pt-1">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="size-10 rounded-button" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
