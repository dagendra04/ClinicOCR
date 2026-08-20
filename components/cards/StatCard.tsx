import { cn } from '@/lib/utils';

interface StatCardProps {
  title:     string;
  value:     number | string;
  icon:      React.ReactNode;
  trend?:    string;
  colorClass?: string;
}

export default function StatCard({ title, value, icon, trend, colorClass = 'bg-brand-50 text-brand-600' }: StatCardProps) {
  return (
    <div className="card card-hover p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-muted mb-1">{title}</p>
          <p className="text-3xl font-bold text-text-primary">{value}</p>
          {trend && (
            <p className="text-xs text-text-muted mt-1">{trend}</p>
          )}
        </div>
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', colorClass)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
