import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import type { Data, Layout, Config } from 'plotly.js';
import { Download } from 'lucide-react';

interface PlotlyChartProps {
  data: Data[];
  layout?: Partial<Layout>;
  title?: string;
  subtitle?: string;
  height?: number;
  isDark: boolean;
  exportFileName?: string;
  className?: string;
  headerRight?: React.ReactNode;
}

export const PlotlyChart: React.FC<PlotlyChartProps> = ({
  data,
  layout = {},
  title,
  subtitle,
  height = 290,
  isDark,
  exportFileName = 'amlab-chart',
  className = '',
  headerRight,
}) => {
  const plotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = plotRef.current;
    if (!el) return;

    const textColor = isDark ? '#E6EDF7' : '#0F172A';
    const mutedColor = isDark ? '#8FA3C2' : '#5B6B86';
    const gridColor = isDark ? '#24324F' : '#DDE3EE';
    const zeroLineColor = isDark ? '#33466B' : '#CBD5E1';

    const mergedLayout: Partial<Layout> = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: {
        family: "'Plus Jakarta Sans', system-ui, sans-serif",
        size: 11,
        color: textColor,
      },
      margin: { l: 54, r: 20, t: 18, b: 44 },
      height,
      autosize: true,
      showlegend: true,
      legend: {
        orientation: 'h',
        yanchor: 'bottom',
        y: 1.02,
        xanchor: 'left',
        x: 0,
        font: { size: 11, color: mutedColor },
        bgcolor: 'rgba(0,0,0,0)',
      },
      hovermode: 'x unified',
      hoverlabel: {
        bgcolor: isDark ? '#17233D' : '#FFFFFF',
        bordercolor: gridColor,
        font: {
          family: "'JetBrains Mono', monospace",
          size: 11,
          color: textColor,
        },
      },
      ...layout,
      xaxis: {
        gridcolor: gridColor,
        zerolinecolor: zeroLineColor,
        tickfont: { family: "'JetBrains Mono', monospace", size: 10, color: mutedColor },
        automargin: true,
        ...(layout.xaxis ?? {}),
        title: {
          font: { size: 11, color: mutedColor },
          ...(typeof layout.xaxis?.title === 'object' ? layout.xaxis.title : {}),
        },
      },
      yaxis: {
        gridcolor: gridColor,
        zerolinecolor: zeroLineColor,
        tickfont: { family: "'JetBrains Mono', monospace", size: 10, color: mutedColor },
        automargin: true,
        ...(layout.yaxis ?? {}),
        title: {
          font: { size: 11, color: mutedColor },
          ...(typeof layout.yaxis?.title === 'object' ? layout.yaxis.title : {}),
        },
      },
    };

    const config: Partial<Config> = {
      responsive: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
    };

    Plotly.react(el, data, mergedLayout, config);

    const observer = new ResizeObserver(() => {
      if (plotRef.current) {
        Plotly.Plots.resize(plotRef.current);
      }
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [data, layout, height, isDark]);

  useEffect(() => {
    const el = plotRef.current;
    return () => {
      if (el) {
        Plotly.purge(el);
      }
    };
  }, []);

  const handleDownloadPNG = async () => {
    if (!plotRef.current) return;
    await Plotly.downloadImage(plotRef.current, {
      format: 'png',
      width: 1200,
      height: Math.max(480, height * 2),
      filename: exportFileName,
    });
  };

  return (
    <div
      className={`rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] overflow-hidden ${className}`}
    >
      {(title || headerRight) && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[#DDE3EE] dark:border-[#24324F]">
          <div className="min-w-0">
            {title && (
              <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#E6EDF7] truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-[#5B6B86] dark:text-[#8FA3C2] truncate">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {headerRight}
            <button
              type="button"
              onClick={handleDownloadPNG}
              title="Download chart as PNG"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-[#DDE3EE] dark:border-[#24324F] text-[#5B6B86] dark:text-[#8FA3C2] hover:text-[#0F172A] dark:hover:text-[#E6EDF7] hover:bg-[#F5F7FB] dark:hover:bg-[#17233D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PNG</span>
            </button>
          </div>
        </div>
      )}
      <div className="p-2">
        <div ref={plotRef} className="w-full" style={{ minHeight: `${height}px` }} />
      </div>
    </div>
  );
};
