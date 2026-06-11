'use client';

import { ReactNode } from 'react';

interface AnalyticsPanelProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}

export default function AnalyticsPanel({ title, icon, children }: AnalyticsPanelProps) {
  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon && <div className="text-brand-600 shrink-0">{icon}</div>}
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}
