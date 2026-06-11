'use client';

import { ReactNode } from 'react';

interface AnalyticsCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: ReactNode;
  tone?: 'brand' | 'green' | 'blue' | 'violet' | 'amber' | 'rose' | 'cyan' | 'slate';
}

const toneClasses: Record<NonNullable<AnalyticsCardProps['tone']>, string> = {
  brand: 'bg-brand-100 text-brand-700',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  violet: 'bg-violet-100 text-violet-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
  cyan: 'bg-cyan-100 text-cyan-700',
  slate: 'bg-slate-100 text-slate-700',
};

export default function AnalyticsCard({
  title,
  value,
  subtitle,
  icon,
  tone = 'brand',
}: AnalyticsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
        <div className={`rounded-lg p-2 shrink-0 ${toneClasses[tone]}`}>{icon}</div>
      </div>
      <p className="mt-3 text-xl sm:text-2xl font-bold text-gray-900">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}
