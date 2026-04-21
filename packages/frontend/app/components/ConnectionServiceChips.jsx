'use client';

import { CONNECTABLE_SERVICE_LABELS } from '../utils/tier-config';

export default function ConnectionServiceChips({
  label = 'App supports',
  className = '',
  labelClassName = 'text-white/70',
  chipClassName = 'border-white/10 bg-white/5 text-white/70',
}) {
  return (
    <div className={className}>
      <p className={`mb-2 text-xs font-semibold uppercase tracking-[0.14em] ${labelClassName}`}>
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {CONNECTABLE_SERVICE_LABELS.map((service) => (
          <span
            key={service}
            className={`rounded-full border px-2 py-1 text-[11px] leading-tight ${chipClassName}`}
          >
            {service}
          </span>
        ))}
      </div>
    </div>
  );
}
