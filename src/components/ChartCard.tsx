import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  contentClassName?: string;
}

export function ChartCard({ title, subtitle, children, contentClassName }: ChartCardProps) {
  return (
    <section className="panel">
      <div className="mb-4">
        <h3 className="text-base font-semibold">{title}</h3>
        {subtitle ? <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
      </div>
      <div className={contentClassName ?? 'h-72'}>{children}</div>
    </section>
  );
}
