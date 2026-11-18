import React, { useState } from 'react';
import type { Data } from 'plotly.js';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Play,
  RotateCcw,
  Sliders,
  Zap,
} from 'lucide-react';
import {
  DEFAULT_AM_PARAMETERS,
  type AMModulationResult,
  type AMParameters,
  type AMPowerResult,
  type BandwidthResult,
  type MessageWaveformType,
  type SpectrumComponent,
} from '../math/amEngine';
import { PlotlyChart } from '../components/PlotlyChart';
import { MathTex } from '../components/MathTex';
import { MetricReadout, SliderControl } from '../components/LabControls';
import { WHAT_IF_EXPERIMENTS } from '../data/educationalContent';

interface OverviewViewProps {
  params: AMParameters;
  setParams: React.Dispatch<React.SetStateAction<AMParameters>>;
  mod: AMModulationResult;
  pwr: AMPowerResult;
  bw: BandwidthResult;
  spectrum: SpectrumComponent[];
  isDark: boolean;
  onNavigate: (tab: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  params,
  setParams,
  mod,
  pwr,
  bw,
  spectrum,
  isDark,
  onNavigate,
}) => {
  const [graphLayout, setGraphLayout] = useState<'stacked' | 'side-by-side' | 'single'>('stacked');
  const [showMessage, setShowMessage] = useState(true);
  const [showCarrier, setShowCarrier] = useState(true);
  const [showModulated, setShowModulated] = useState(true);
  const [showUpperEnv, setShowUpperEnv] = useState(true);
  const [showLowerEnv, setShowLowerEnv] = useState(true);

  const tMs = mod.t.map((v) => v * 1000);

  const updateMu = (newMu: number) => {
    const safeAm = Math.max(0.05, params.Am);
    setParams((prev) => ({
      ...prev,
      ka: Number((newMu / safeAm).toFixed(4)),
    }));
  };

  const statusBadge =
    mod.condition === 'undermodulated'
      ? {
          icon: <CheckCircle2 className="w-4 h-4 text-[#34D399]" />,
          label: 'Undermodulated (μ < 1)',
          detail: 'Envelope remains positive; suitable for diode envelope detection.',
          colorClass: 'text-[#059669] dark:text-[#34D399]',
        }
      : mod.condition === 'critical'
        ? {
            icon: <Activity className="w-4 h-4 text-[#FBBF24]" />,
            label: 'Critical Modulation (μ = 1)',
            detail: '100% modulation; envelope touches 0 V at message troughs.',
            colorClass: 'text-[#D97706] dark:text-[#FBBF24]',
          }
        : {
            icon: <AlertTriangle className="w-4 h-4 text-[#F87171]" />,
            label: 'Overmodulated (μ > 1)',
            detail: 'Envelope crosses zero; 180° carrier phase inversion occurs.',
            colorClass: 'text-[#DC2626] dark:text-[#F87171]',
          };

  const msgTrace: Data = {
    x: tMs,
    y: mod.m.samples,
    type: 'scatter',
    mode: 'lines',
    name: 'Message m(t)',
    line: { color: '#22D3EE', width: 2 },
  };

  const carrierTrace: Data = {
    x: tMs,
    y: mod.c.samples,
    type: 'scatter',
    mode: 'lines',
    name: 'Carrier c(t)',
    line: { color: '#A78BFA', width: 1.3 },
  };

  const amTraces: Data[] = [];
  if (showModulated) {
    amTraces.push({
      x: tMs,
      y: mod.s,
      type: 'scatter',
      mode: 'lines',
      name: 'AM s(t)',
      line: { color: '#34D399', width: 1.4 },
    });
  }
  if (showUpperEnv) {
    amTraces.push({
      x: tMs,
      y: mod.upperEnvelope,
      type: 'scatter',
      mode: 'lines',
      name: 'Upper Envelope',
      line: { color: '#FBBF24', width: 2, dash: 'dash' },
    });
  }
  if (showLowerEnv) {
    amTraces.push({
      x: tMs,
      y: mod.lowerEnvelope,
      type: 'scatter',
      mode: 'lines',
      name: 'Lower Envelope',
      line: { color: '#FBBF24', width: 1.8, dash: 'dot' },
    });
  }

  // Spectrum stem plot traces
  const specTraces: Data[] = [];
  const types: Array<{ key: SpectrumComponent['type']; name: string; color: string }> = [
    { key: 'lsb', name: 'LSB', color: '#22D3EE' },
    { key: 'carrier', name: 'Carrier', color: '#A78BFA' },
    { key: 'usb', name: 'USB', color: '#F472B6' },
  ];
  for (const tp of types) {
    const comps = spectrum.filter((c) => c.type === tp.key);
    const sx: (number | null)[] = [];
    const sy: (number | null)[] = [];
    const mx: number[] = [];
    const my: number[] = [];
    const text: string[] = [];
    for (const c of comps) {
      const fKhz = c.frequency / 1000;
      sx.push(fKhz, fKhz, null);
      sy.push(0, c.amplitude, null);
      mx.push(fKhz);
      my.push(c.amplitude);
      text.push(`${c.label}: ${fKhz.toFixed(1)} kHz (${c.amplitude.toFixed(2)} V)`);
    }
    if (mx.length > 0) {
      specTraces.push({
        x: sx,
        y: sy,
        type: 'scatter',
        mode: 'lines',
        showlegend: false,
        hoverinfo: 'skip',
        line: { color: tp.color, width: 2.5 },
      });
      specTraces.push({
        x: mx,
        y: my,
        type: 'scatter',
        mode: 'markers',
        name: tp.name,
        text,
        hovertemplate: '%{text}<extra></extra>',
        marker: { color: tp.color, size: 9 },
      });
    }
  }

  // Single-graph overlay traces
  const overlayTraces: Data[] = [
    ...(showMessage ? [msgTrace] : []),
    ...(showCarrier ? [carrierTrace] : []),
    ...amTraces,
  ];

  return (
    <div className="space-y-6">
      {/* Top 8 Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        <MetricReadout
          label="Carrier Freq f_c"
          value={(params.fc / 1000).toFixed(1)}
          unit="kHz"
          accentHex="#A78BFA"
        />
        <MetricReadout
          label="Message Freq f_m"
          value={(params.fm / 1000).toFixed(2)}
          unit="kHz"
          accentHex="#22D3EE"
        />
        <MetricReadout
          label="Carrier Amp A_c"
          value={params.Ac.toFixed(1)}
          unit="V"
          accentHex="#A78BFA"
        />
        <MetricReadout
          label="Message Amp A_m"
          value={params.Am.toFixed(2)}
          unit="V"
          accentHex="#22D3EE"
        />
        <MetricReadout
          label="Mod. Index μ"
          value={mod.mu.toFixed(3)}
          subtext={`kₐ = ${params.ka.toFixed(2)} V⁻¹`}
          accentHex="#FBBF24"
        />
        <MetricReadout
          label="Modulation %"
          value={mod.percentModulation.toFixed(1)}
          unit="%"
          subtext={mod.condition}
          accentHex={mod.mu > 1 ? '#F87171' : '#34D399'}
        />
        <MetricReadout
          label="AM Bandwidth"
          value={(bw.B_AM / 1000).toFixed(1)}
          unit="kHz"
          subtext="2 × f_m(max)"
          accentHex="#F472B6"
        />
        <MetricReadout
          label="Total Power P_t"
          value={pwr.Pt.toFixed(3)}
          unit="W"
          subtext={`η = ${pwr.efficiencyPercent.toFixed(1)}%`}
          accentHex="#34D399"
        />
      </div>

      {mod.samplingWarning && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-[#F87171]/40 bg-[#F87171]/10 text-xs text-[#B91C1C] dark:text-[#FCA5A5]">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{mod.samplingWarning}</span>
        </div>
      )}

      {/* Main 3-Column Laboratory Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* LEFT PANEL: Signal & Modulation Controls */}
        <div className="xl:col-span-3 space-y-4 rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-4">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#DDE3EE] dark:border-[#24324F]">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#6366F1]" />
              <h2 className="text-sm font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
                Lab Parameters
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setParams({ ...DEFAULT_AM_PARAMETERS })}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border border-[#DDE3EE] dark:border-[#24324F] text-[#5B6B86] dark:text-[#8FA3C2] hover:text-[#0F172A] dark:hover:text-[#E6EDF7] cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-semibold text-[#22D3EE]">Message Signal m(t)</div>
            <div>
              <label className="block text-xs text-[#5B6B86] dark:text-[#8FA3C2] mb-1">
                Waveform Shape
              </label>
              <select
                value={params.messageWaveform}
                onChange={(e) =>
                  setParams((p) => ({
                    ...p,
                    messageWaveform: e.target.value as MessageWaveformType,
                  }))
                }
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#DDE3EE] dark:border-[#24324F] bg-[#F5F7FB] dark:bg-[#0B1220] text-[#0F172A] dark:text-[#E6EDF7]"
              >
                <option value="sine">Single-Tone Cosine</option>
                <option value="multitone">Multi-Tone (2 Frequencies)</option>
                <option value="square">Square Wave</option>
                <option value="triangle">Triangle Wave</option>
                <option value="sawtooth">Sawtooth Wave</option>
              </select>
            </div>
            <SliderControl
              label="Message Amplitude A_m"
              value={params.Am}
              min={0.1}
              max={4}
              step={0.05}
              unit="V"
              accentColor="#22D3EE"
              onChange={(v) => setParams((p) => ({ ...p, Am: v }))}
            />
            <SliderControl
              label="Message Frequency f_m"
              value={params.fm / 1000}
              min={1}
              max={25}
              step={0.5}
              unit="kHz"
              accentColor="#22D3EE"
              onChange={(v) => setParams((p) => ({ ...p, fm: v * 1000 }))}
            />
          </div>

          <div className="pt-3 border-t border-[#DDE3EE] dark:border-[#24324F] space-y-3">
            <div className="text-xs font-semibold text-[#A78BFA]">Carrier Signal c(t)</div>
            <SliderControl
              label="Carrier Amplitude A_c"
              value={params.Ac}
              min={1}
              max={25}
              step={0.5}
              unit="V"
              accentColor="#A78BFA"
              onChange={(v) => setParams((p) => ({ ...p, Ac: v }))}
            />
            <SliderControl
              label="Carrier Frequency f_c"
              value={params.fc / 1000}
              min={30}
              max={300}
              step={5}
              unit="kHz"
              accentColor="#A78BFA"
              onChange={(v) => setParams((p) => ({ ...p, fc: v * 1000 }))}
            />
          </div>

          <div className="pt-3 border-t border-[#DDE3EE] dark:border-[#24324F] space-y-3">
            <div className="text-xs font-semibold text-[#FBBF24]">Modulation & Load</div>
            <SliderControl
              label="Sensitivity kₐ"
              value={params.ka}
              min={0.05}
              max={2.0}
              step={0.05}
              unit="V⁻¹"
              accentColor="#FBBF24"
              onChange={(v) => setParams((p) => ({ ...p, ka: v }))}
            />
            <SliderControl
              label="Modulation Index μ"
              value={mod.mu}
              min={0}
              max={2.0}
              step={0.05}
              accentColor="#34D399"
              onChange={updateMu}
              hint="Updates kₐ = μ / A_m"
            />
            <SliderControl
              label="Load Resistance R"
              value={params.loadResistance}
              min={10}
              max={200}
              step={5}
              unit="Ω"
              onChange={(v) => setParams((p) => ({ ...p, loadResistance: v }))}
            />
          </div>

          <div className="pt-3 border-t border-[#DDE3EE] dark:border-[#24324F] space-y-2">
            <div className="text-xs font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
              Waveform Visibility
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {[
                { label: 'Message', checked: showMessage, set: setShowMessage },
                { label: 'Carrier', checked: showCarrier, set: setShowCarrier },
                { label: 'AM Signal', checked: showModulated, set: setShowModulated },
                { label: 'Upper Env.', checked: showUpperEnv, set: setShowUpperEnv },
                { label: 'Lower Env.', checked: showLowerEnv, set: setShowLowerEnv },
              ].map((item) => (
                <label
                  key={item.label}
                  className="flex items-center gap-1.5 cursor-pointer text-[#5B6B86] dark:text-[#8FA3C2] hover:text-[#0F172A] dark:hover:text-[#E6EDF7]"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => item.set(e.target.checked)}
                    className="accent-[#6366F1] rounded"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER PANEL: Synchronized Time-Domain Graphs */}
        <div className="xl:col-span-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] px-4 py-2.5">
            <div className="text-xs text-[#5B6B86] dark:text-[#8FA3C2]">
              <MathTex latex="s(t) = A_c\left[1 + k_a m(t)\right]\cos(2\pi f_c t)" />
            </div>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#F5F7FB] dark:bg-[#0B1220] border border-[#DDE3EE] dark:border-[#24324F]">
              {(
                [
                  { id: 'stacked', label: 'Stacked' },
                  { id: 'side-by-side', label: 'Side-by-Side' },
                  { id: 'single', label: 'Single' },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setGraphLayout(mode.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    graphLayout === mode.id
                      ? 'bg-[#6366F1] text-white'
                      : 'text-[#5B6B86] dark:text-[#8FA3C2] hover:text-[#0F172A] dark:hover:text-[#E6EDF7]'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {graphLayout === 'single' ? (
            <PlotlyChart
              title="Synchronized Time-Domain Overlay"
              subtitle={`Duration ${(mod.duration * 1000).toFixed(3)} ms · Fs = ${(params.Fs / 1e6).toFixed(2)} MHz`}
              data={overlayTraces}
              height={460}
              isDark={isDark}
              exportFileName="amlab-overlay-waveform"
              layout={{
                xaxis: { title: { text: 'Time (ms)' } },
                yaxis: { title: { text: 'Amplitude (V)' } },
              }}
            />
          ) : (
            <div
              className={
                graphLayout === 'side-by-side'
                  ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                  : 'space-y-4'
              }
            >
              {showMessage && (
                <PlotlyChart
                  title="1. Message Signal m(t)"
                  subtitle={`Peak ${mod.m.peak.toFixed(2)} V · RMS ${mod.m.rms.toFixed(2)} V · ${(params.fm / 1000).toFixed(1)} kHz`}
                  data={[msgTrace]}
                  height={210}
                  isDark={isDark}
                  exportFileName="amlab-message-signal"
                  layout={{
                    xaxis: { title: { text: 'Time (ms)' } },
                    yaxis: { title: { text: 'm(t) [V]' } },
                  }}
                />
              )}
              {showCarrier && (
                <PlotlyChart
                  title="2. Carrier Signal c(t)"
                  subtitle={`Peak ${params.Ac.toFixed(1)} V · ${(params.fc / 1000).toFixed(1)} kHz`}
                  data={[carrierTrace]}
                  height={210}
                  isDark={isDark}
                  exportFileName="amlab-carrier-signal"
                  layout={{
                    xaxis: { title: { text: 'Time (ms)' } },
                    yaxis: { title: { text: 'c(t) [V]' } },
                  }}
                />
              )}
              <div className={graphLayout === 'side-by-side' ? 'md:col-span-2' : ''}>
                <PlotlyChart
                  title="3. Conventional AM Modulated Waveform s(t) & Envelope"
                  subtitle={`Emax = ${mod.eMax.toFixed(2)} V · Emin = ${mod.eMin.toFixed(2)} V · μ = ${mod.mu.toFixed(3)}`}
                  data={amTraces}
                  height={270}
                  isDark={isDark}
                  exportFileName="amlab-modulated-waveform"
                  layout={{
                    xaxis: { title: { text: 'Time (ms)' } },
                    yaxis: { title: { text: 's(t) [V]' } },
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Spectrum, Modulation Index & Power */}
        <div className="xl:col-span-3 space-y-4">
          <PlotlyChart
            title="Frequency Spectrum"
            subtitle={`LSB ${(bw.fLowest / 1000).toFixed(1)} · fc ${(params.fc / 1000).toFixed(1)} · USB ${(bw.fHighest / 1000).toFixed(1)} kHz`}
            data={specTraces}
            height={230}
            isDark={isDark}
            exportFileName="amlab-overview-spectrum"
            layout={{
              xaxis: {
                title: { text: 'Frequency (kHz)' },
                range: [
                  Math.max(0, (params.fc - Math.max(params.fm * 2.5, 15000)) / 1000),
                  (params.fc + Math.max(params.fm * 2.5, 15000)) / 1000,
                ],
              },
              yaxis: { title: { text: 'Peak (V)' }, rangemode: 'tozero' },
            }}
          />

          <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
                Modulation Regime
              </span>
              <span className="font-mono text-xs tabular-nums text-[#5B6B86] dark:text-[#8FA3C2]">
                μ = {mod.mu.toFixed(3)} ({mod.percentModulation.toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#F5F7FB] dark:bg-[#0B1220] border border-[#DDE3EE] dark:border-[#24324F]">
              <div className="mt-0.5 shrink-0">{statusBadge.icon}</div>
              <div>
                <div className={`text-xs font-semibold ${statusBadge.colorClass}`}>
                  {statusBadge.label}
                </div>
                <p className="text-[11px] text-[#5B6B86] dark:text-[#8FA3C2] mt-0.5">
                  {statusBadge.detail}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono tabular-nums">
              <div className="p-2 rounded-lg bg-[#F5F7FB] dark:bg-[#0B1220]">
                <div className="text-[10px] text-[#5B6B86] dark:text-[#8FA3C2]">E_max</div>
                <div className="font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
                  {mod.eMax.toFixed(2)} V
                </div>
              </div>
              <div className="p-2 rounded-lg bg-[#F5F7FB] dark:bg-[#0B1220]">
                <div className="text-[10px] text-[#5B6B86] dark:text-[#8FA3C2]">E_min</div>
                <div className="font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
                  {mod.eMin.toFixed(2)} V
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
                Power Distribution (R = {params.loadResistance} Ω)
              </span>
              <button
                type="button"
                onClick={() => onNavigate('power')}
                className="text-xs text-[#6366F1] hover:underline cursor-pointer"
              >
                Full Lab
              </button>
            </div>
            <div className="space-y-1.5 text-xs font-mono tabular-nums">
              <div className="flex justify-between">
                <span className="text-[#5B6B86] dark:text-[#8FA3C2]">Carrier P_c</span>
                <span>
                  {pwr.Pc.toFixed(3)} W ({pwr.carrierPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5B6B86] dark:text-[#8FA3C2]">USB + LSB P_SB</span>
                <span>
                  {pwr.PSB.toFixed(3)} W ({pwr.efficiencyPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-[#DDE3EE] dark:border-[#24324F] font-semibold">
                <span>Total Power P_t</span>
                <span className="text-[#34D399]">{pwr.Pt.toFixed(3)} W</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick What-If Experiments + Default Experiment Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#6366F1]" />
            <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
              Interactive What-If Experiments
            </h3>
          </div>
          <p className="text-xs text-[#5B6B86] dark:text-[#8FA3C2]">
            Click any action below to modify the live simulator parameters and observe immediate changes across waveforms, spectrum, and power metrics.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {WHAT_IF_EXPERIMENTS.map((exp) => (
              <button
                key={exp.id}
                type="button"
                onClick={() => setParams((prev) => exp.apply(prev))}
                className="text-left p-3 rounded-lg border border-[#DDE3EE] dark:border-[#24324F] bg-[#F5F7FB] dark:bg-[#0B1220] hover:border-[#6366F1] transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#0F172A] dark:text-[#E6EDF7] group-hover:text-[#6366F1]">
                    {exp.label}
                  </span>
                  <Play className="w-3 h-3 text-[#6366F1] shrink-0" />
                </div>
                <p className="mt-1 text-[11px] text-[#5B6B86] dark:text-[#8FA3C2] leading-snug">
                  {exp.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
            Default Experiment Step-by-Step Analysis
          </h3>
          <p className="text-xs text-[#5B6B86] dark:text-[#8FA3C2]">
            Baseline configuration: <span className="font-mono">A_c = 10 V, f_c = 100 kHz, A_m = 1 V, f_m = 5 kHz, kₐ = 0.5 V⁻¹, R = 50 Ω, F_s = 2 MHz</span>.
          </p>
          <ol className="space-y-2 text-xs text-[#5B6B86] dark:text-[#8FA3C2] list-decimal list-inside">
            <li>
              <strong className="text-[#0F172A] dark:text-[#E6EDF7]">Modulation Index:</strong>{' '}
              <MathTex latex="\mu = k_a A_m = 0.5 \times 1 = 0.50\;(50\%)" /> (Undermodulated).
            </li>
            <li>
              <strong className="text-[#0F172A] dark:text-[#E6EDF7]">Envelope Bounds:</strong>{' '}
              <MathTex latex="E_{\max} = 10(1+0.5) = 15\text{ V}" />,{' '}
              <MathTex latex="E_{\min} = 10(1-0.5) = 5\text{ V}" />.
            </li>
            <li>
              <strong className="text-[#0F172A] dark:text-[#E6EDF7]">Spectral Lines:</strong>{' '}
              Carrier at <span className="font-mono">100 kHz (10 V)</span>, LSB at{' '}
              <span className="font-mono">95 kHz (2.5 V)</span>, USB at{' '}
              <span className="font-mono">105 kHz (2.5 V)</span>.
            </li>
            <li>
              <strong className="text-[#0F172A] dark:text-[#E6EDF7]">Bandwidth:</strong>{' '}
              <MathTex latex="B_{\text{AM}} = 2 f_m = 10\text{ kHz}" />.
            </li>
            <li>
              <strong className="text-[#0F172A] dark:text-[#E6EDF7]">Power & Efficiency:</strong>{' '}
              <MathTex latex="P_c = 1.000\text{ W},\; P_{\text{SB}} = 0.125\text{ W},\; P_t = 1.125\text{ W},\; \eta = 11.11\%" />.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};
