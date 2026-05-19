function Block({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.06] ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <Block className="h-3 w-28" />
          <Block className="h-9 w-56" />
        </div>
        <Block className="h-10 w-36" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Block key={i} className="h-28" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-12">
        <Block className="h-[360px] xl:col-span-7" />
        <Block className="h-[360px] xl:col-span-2" />
        <Block className="h-[360px] xl:col-span-3" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Block className="h-72" />
        <Block className="h-72" />
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <Block className="h-3 w-24" />
          <Block className="h-9 w-48" />
        </div>
        <Block className="h-10 w-32" />
      </div>
      <Block className="h-12 w-full" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Block key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Block className="h-3 w-20" />
        <Block className="h-9 w-64" />
        <Block className="h-4 w-96 max-w-full" />
      </div>
      <Block className="h-24 w-full" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Block key={i} className="h-24" />
        ))}
      </div>
      <Block className="h-80 w-full" />
    </div>
  );
}

function AssistantSkeleton() {
  return (
    <div className="flex h-[calc(100vh-9rem)] min-h-[680px] flex-col gap-6">
      <div className="space-y-3">
        <Block className="h-3 w-32" />
        <Block className="h-9 w-52" />
        <Block className="h-4 w-80 max-w-full" />
      </div>
      <Block className="min-h-0 flex-1" />
    </div>
  );
}

function DefaultSkeleton() {
  return (
    <div className="space-y-6">
      <Block className="h-9 w-48" />
      <Block className="h-64 w-full" />
    </div>
  );
}

const VARIANTS = {
  dashboard: DashboardSkeleton,
  table: TableSkeleton,
  reports: ReportsSkeleton,
  assistant: AssistantSkeleton,
  default: DefaultSkeleton,
};

export function PageSkeleton({ variant = 'default' }) {
  const Component = VARIANTS[variant] ?? DefaultSkeleton;
  return (
    <div className="page-skeleton" aria-hidden="true">
      <Component />
    </div>
  );
}
