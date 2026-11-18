import React from 'react';

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  accentColor?: string;
  onChange: (value: number) => void;
  formatDisplay?: (val: number) => string;
  hint?: string;
}

export const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  accentColor,
  onChange,
  formatDisplay,
  hint,
}) => {
  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(e.target.value);
    if (!Number.isNaN(parsed)) {
      onChange(Math.min(max, Math.max(min, parsed)));
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-[#0F172A] dark:text-[#E6EDF7] truncate flex items-center gap-1.5">
          {accentColor && (
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: accentColor }}
            />
          )}
          <span className="truncate">{label}</span>
        </label>
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="number"
            value={Number(value.toFixed(4))}
            min={min}
            max={max}
            step={step}
            onChange={handleNumericChange}
            aria-label={`${label} numeric input`}
            className="w-20 px-2 py-0.5 text-right font-mono tabular-nums text-xs rounded border border-[#DDE3EE] dark:border-[#24324F] bg-[#F5F7FB] dark:bg-[#0B1220] text-[#0F172A] dark:text-[#E6EDF7] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
          />
          {unit && (
            <span className="text-[11px] font-mono text-[#5B6B86] dark:text-[#8FA3C2] w-8">
              {unit}
            </span>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.min(max, Math.max(min, value))}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-label={label}
        className="w-full"
      />
      {hint && (
        <div className="flex items-center justify-between text-[11px] text-[#5B6B86] dark:text-[#8FA3C2] font-mono tabular-nums">
          <span>{hint}</span>
          {formatDisplay && <span>{formatDisplay(value)}</span>}
        </div>
      )}
    </div>
  );
};

interface MetricReadoutProps {
  label: string;
  value: string;
  unit?: string;
  subtext?: string;
  accentHex?: string;
}

export const MetricReadout: React.FC<MetricReadoutProps> = ({
  label,
  value,
  unit,
  subtext,
  accentHex,
}) => {
  return (
    <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] px-4 py-3">
      <div className="text-xs font-medium text-[#5B6B86] dark:text-[#8FA3C2] truncate">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span
          className="text-xl font-semibold font-mono tabular-nums tracking-tight text-[#0F172A] dark:text-[#E6EDF7]"
          style={accentHex ? { color: accentHex } : undefined}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs font-mono text-[#5B6B86] dark:text-[#8FA3C2]">{unit}</span>
        )}
      </div>
      {subtext && (
        <div className="mt-0.5 text-[11px] text-[#5B6B86] dark:text-[#8FA3C2] truncate font-mono tabular-nums">
          {subtext}
        </div>
      )}
    </div>
  );
};
