'use client';

interface ProgressListItem {
  label: string;
  value: number;
  note?: string;
}

interface ProgressListProps {
  items: ProgressListItem[];
  emptyTitle: string;
  emptySubtitle: string;
}

export default function ProgressList({
  items,
  emptyTitle,
  emptySubtitle,
}: ProgressListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p>{emptyTitle}</p>
        <p className="text-sm mt-2">{emptySubtitle}</p>
      </div>
    );
  }

  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const percentage = Math.max((item.value / maxValue) * 100, 4);

        return (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-gray-900 truncate">{item.label}</span>
              <span className="text-gray-600 font-semibold whitespace-nowrap">
                {item.value.toLocaleString()}
              </span>
            </div>
            {item.note && <p className="text-xs text-gray-500">{item.note}</p>}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-brand-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
