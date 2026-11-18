import React, { useEffect, useMemo, useState } from 'react';
import type { Data } from 'plotly.js';
import { Activity, AlertTriangle, CheckCircle2, Download, Pause, Play, RotateCcw } from 'lucide-react';
import {
  performAMModulation,
  type AMModulationResult,
  type AMParameters,
} from '../math/amEngine';
import { PlotlyChart } from '../components/PlotlyChart';
import { MathTex } from '../components/MathTex';
import { MetricReadout, SliderControl } from '../components/LabControls';
import { exportSignalCSV } from '../utils/exportUtils';

interface ModulatorProps {
  params: AMParameters;
  setParams: React.Dispatch<React.SetStateAction<AMParameters>>;
  mod: AMModulationResult;
  isDark: boolean;
}

export const AMModulatorView: React.FC<ModulatorProps> = ({
  params,
  setParams,
  mod,
  isDark,
}) => {
  const [showMessage, setShowMessage] = useState(true);
  const [showCarrier, setShowCarrier] = useState(false);
  const [showModulated, setShowModulated] = useState(true);
  const [showUpperEnv, setShowUpperEnv] = useState(true);
  const [showLowerEnv, setShowLowerEnv] = useState(true);

  const tMs = mod.t.map((v) => v * 1000);

  const updateMu = (newMu: number) => {
    const safeAm = Math.max(0.05, params.Am);
    setParams((p) => ({ ...p, ka: Number((newMu / safeAm).toFixed(4)) }));
  };

  const mainTraces: Data[] = [];
  if (showModulated) {
    mainTraces.push({
      x: tMs,
      y: mod.s,
      type: 'scatter',
      mode: 'lines',
      name: 'AM s(t)',
      line: { color: '#34D399', width: 1.5 },
    });
  }
  if (showUpperEnv) {
    mainTraces.push({
      x: tMs,
      y: mod.upperEnvelope,
      type: 'scatter',
      mode: 'lines',
      name: 'Upper Envelope E_upper(t)',
      line: { color: '#FBBF24', width: 2.2, dash: 'dash' },
    });
  }
  if (showLowerEnv) {
    mainTraces.push({
      x: tMs,
      y: mod.lowerEnvelope,
      type: 'scatter',
      mode: 'lines',
      name: 'Lower Envelope E_lower(t)',
      line: { color: '#FBBF24', width: 2, dash: 'dot' },
    });
  }
  if (showMessage) {
    mainTraces.push({
      x: tMs,
      y: mod.m.samples,
      type: 'scatter',
      mode: 'lines',
      name: 'Message m(t)',
      line: { color: '#22D3EE', width: 2 },
    });
  }
  if (showCarrier) {
    mainTraces.push({
      x: tMs,
      y: mod.c.samples,
      type: 'scatter',
      mode: 'lines',
      name: 'Carrier c(t)',
      line: { color: '#A78BFA', width: 1.2 },
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
              Conventional AM Modulator Laboratory
            </h2>
            <p className="text-xs text-[#5B6B86] dark:text-[#8FA3C2]">
              Distinguishes hardware amplitude sensitivity kₐ (V⁻¹) from dimensionless modulation index μ = kₐ·Aₘ.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              exportSignalCSV(
                'am-modulated-waveform.csv',
                mod.t,
                ['time_s', 'message_V', 'carrier_V', 'am_s_V', 'upper_env_V', 'lower_env_V'],
                [mod.m.samples, mod.c.samples, mod.s, mod.upperEnvelope, mod.lowerEnvelope]
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#6366F1] text-white hover:bg-[#4F46E5] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export AM Waveform CSV</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
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
          <SliderControl
            label="Amplitude Sensitivity kₐ"
            value={params.ka}
            min={0.05}
            max={2.0}
            step={0.05}
            unit="V⁻¹"
            accentColor="#FBBF24"
            onChange={(v) => setParams((p) => ({ ...p, ka: v }))}
          />
          <SliderControl
            label="Modulation Index μ (= kₐ·A_m)"
            value={mod.mu}
            min={0}
            max={2.0}
            step={0.05}
            accentColor="#34D399"
            onChange={updateMu}
          />
        </div>

        {/* Trace Visibility Toggles */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-[#DDE3EE] dark:border-[#24324F] text-xs">
          <span className="font-semibold text-[#0F172A] dark:text-[#E6EDF7]">Display Layers:</span>
          {[
            { label: 'Modulated AM s(t)', checked: showModulated, set: setShowModulated, color: '#34D399' },
            { label: 'Upper Envelope', checked: showUpperEnv, set: setShowUpperEnv, color: '#FBBF24' },
            { label: 'Lower Envelope', checked: showLowerEnv, set: setShowLowerEnv, color: '#FBBF24' },
            { label: 'Message m(t)', checked: showMessage, set: setShowMessage, color: '#22D3EE' },
            { label: 'Carrier c(t)', checked: showCarrier, set: setShowCarrier, color: '#A78BFA' },
          ].map((item) => (
            <label key={item.label} className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={(e) => item.set(e.target.checked)}
                className="accent-[#6366F1]"
              />
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[#5B6B86] dark:text-[#8FA3C2]">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Synchronized Plots */}
      <PlotlyChart
        title="Modulated AM Waveform & Envelope Visualization"
        subtitle={`s(t) = ${params.Ac.toFixed(1)}[1 + ${params.ka.toFixed(2)}·m(t)]cos(2π·${(params.fc / 1000).toFixed(1)}kHz·t)`}
        data={mainTraces}
        height={350}
        isDark={isDark}
        exportFileName="amlab-modulator-composite"
        layout={{
          xaxis: { title: { text: 'Time (ms)' } },
          yaxis: { title: { text: 'Voltage (V)' } },
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PlotlyChart
          title="Synchronized Message Signal m(t)"
          data={[
            {
              x: tMs,
              y: mod.m.samples,
              type: 'scatter',
              mode: 'lines',
              name: 'm(t)',
              line: { color: '#22D3EE', width: 2 },
            },
          ]}
          height={220}
          isDark={isDark}
          exportFileName="amlab-modulator-message"
          layout={{
            xaxis: { title: { text: 'Time (ms)' } },
            yaxis: { title: { text: 'm(t) [V]' } },
          }}
        />
        <PlotlyChart
          title="Synchronized Carrier Signal c(t)"
          data={[
            {
              x: tMs,
              y: mod.c.samples,
              type: 'scatter',
              mode: 'lines',
              name: 'c(t)',
              line: { color: '#A78BFA', width: 1.3 },
            },
          ]}
          height={220}
          isDark={isDark}
          exportFileName="amlab-modulator-carrier"
          layout={{
            xaxis: { title: { text: 'Time (ms)' } },
            yaxis: { title: { text: 'c(t) [V]' } },
          }}
        />
      </div>

      {/* Envelope Measurement Demonstration */}
      <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
          C. Envelope Measurement Formula Verification
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricReadout label="Max Envelope E_max" value={mod.eMax.toFixed(3)} unit="V" accentHex="#FBBF24" />
          <MetricReadout label="Min Envelope E_min" value={mod.eMin.toFixed(3)} unit="V" accentHex="#FBBF24" />
          <MetricReadout
            label="Envelope μ = (Emax−Emin)/(Emax+Emin)"
            value={mod.muFromEnvelope.toFixed(4)}
            accentHex="#34D399"
          />
          <MetricReadout
            label="Percentage Modulation M"
            value={mod.percentModulation.toFixed(2)}
            unit="%"
            subtext={`kₐ·A_m = ${mod.mu.toFixed(4)}`}
            accentHex="#6366F1"
          />
        </div>
        <div className="p-4 rounded-lg bg-[#F5F7FB] dark:bg-[#0B1220] border border-[#DDE3EE] dark:border-[#24324F] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <MathTex
            block
            latex={`\\mu = \\frac{E_{\\max} - E_{\\min}}{E_{\\max} + E_{\\min}} = \\frac{${mod.eMax.toFixed(2)} - (${mod.eMin.toFixed(2)})}{${mod.eMax.toFixed(2)} + (${mod.eMin.toFixed(2)})} = ${mod.muFromEnvelope.toFixed(4)} \\implies M = ${mod.percentModulation.toFixed(1)}\\%`}
          />
          <p className="text-xs text-[#5B6B86] dark:text-[#8FA3C2] max-w-md">
            When μ &lt; 1, E_min &gt; 0 and the envelope never reaches zero. At μ = 1 (100%), E_min = 0 and E_max = 2A_c. When μ &gt; 1, E_min becomes negative in the algebraic envelope, meaning the carrier reverses phase by 180°.
          </p>
        </div>
      </div>
    </div>
  );
};

export const ModulationIndexView: React.FC<ModulatorProps> = ({
  params,
  setParams,
  mod,
  isDark,
}) => {
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!animating) return;
    const timer = window.setInterval(() => {
      setParams((prev) => {
        const currentMu = prev.ka * prev.Am;
        const nextMu = currentMu >= 1.6 ? 0.1 : Number((currentMu + 0.05).toFixed(2));
        return {
          ...prev,
          messageWaveform: 'sine',
          ka: Number((nextMu / Math.max(0.05, prev.Am)).toFixed(4)),
        };
      });
    }, 180);
    return () => window.clearInterval(timer);
  }, [animating, setParams]);

  const setPresetMu = (targetMu: number) => {
    setAnimating(false);
    setParams((prev) => ({
      ...prev,
      messageWaveform: 'sine',
      ka: Number((targetMu / Math.max(0.05, prev.Am)).toFixed(4)),
    }));
  };

  // Three exact comparison simulations using conventional AM equation
  const comparison = useMemo(() => {
    const base: AMParameters = { ...params, messageWaveform: 'sine', numSamples: 1024 };
    const safeAm = Math.max(0.05, base.Am);
    return {
      under: performAMModulation({ ...base, ka: 0.5 / safeAm }),
      critical: performAMModulation({ ...base, ka: 1.0 / safeAm }),
      over: performAMModulation({ ...base, ka: 1.5 / safeAm }),
    };
  }, [params]);

  const tMsLive = mod.t.map((v) => v * 1000);
  const tMsCmp = comparison.under.t.map((v) => v * 1000);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
              Modulation Depth Laboratory: Under, Critical & Overmodulation
            </h2>
            <p className="text-xs text-[#5B6B86] dark:text-[#8FA3C2]">
              Sweep μ continuously from 0 to 1.60 using the exact conventional AM equation s(t) = A_c[1 + μ cos(2πf_m t)]cos(2πf_c t).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAnimating((a) => !a)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#6366F1] text-white hover:bg-[#4F46E5] cursor-pointer whitespace-nowrap shrink-0"
            >
              {animating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{animating ? 'Pause Sweep' : 'Animate μ (0 → 1.6)'}</span>
            </button>
            <button
              type="button"
              onClick={() => setPresetMu(0.5)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#DDE3EE] dark:border-[#24324F] hover:border-[#34D399] cursor-pointer whitespace-nowrap shrink-0"
            >
              Undermod (μ = 0.5)
            </button>
            <button
              type="button"
              onClick={() => setPresetMu(1.0)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#DDE3EE] dark:border-[#24324F] hover:border-[#FBBF24] cursor-pointer whitespace-nowrap shrink-0"
            >
              Critical (μ = 1.0)
            </button>
            <button
              type="button"
              onClick={() => setPresetMu(1.5)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#DDE3EE] dark:border-[#24324F] hover:border-[#F87171] cursor-pointer whitespace-nowrap shrink-0"
            >
              Overmod (μ = 1.5)
            </button>
            <button
              type="button"
              onClick={() => setPresetMu(0.5)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-[#5B6B86] dark:text-[#8FA3C2] hover:text-[#0F172A] dark:hover:text-[#E6EDF7] cursor-pointer"
              title="Reset to μ = 0.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          <div className="lg:col-span-6">
            <SliderControl
              label="Continuous Modulation Index μ"
              value={mod.mu}
              min={0}
              max={1.8}
              step={0.02}
              accentColor={mod.mu > 1 ? '#F87171' : Math.abs(mod.mu - 1) < 0.02 ? '#FBBF24' : '#34D399'}
              onChange={(newMu) => {
                setAnimating(false);
                setPresetMu(newMu);
              }}
              hint="Critical threshold at μ = 1.00 (100%)"
            />
          </div>
          <div className="lg:col-span-6 flex items-start gap-3 p-3.5 rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-[#F5F7FB] dark:bg-[#0B1220]">
            {mod.condition === 'undermodulated' && (
              <CheckCircle2 className="w-5 h-5 text-[#34D399] shrink-0 mt-0.5" />
            )}
            {mod.condition === 'critical' && (
              <Activity className="w-5 h-5 text-[#FBBF24] shrink-0 mt-0.5" />
            )}
            {mod.condition === 'overmodulated' && (
              <AlertTriangle className="w-5 h-5 text-[#F87171] shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
              <div className="font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
                {mod.condition === 'undermodulated' &&
                  `Undermodulation: μ = ${mod.mu.toFixed(2)} (${mod.percentModulation.toFixed(0)}%)`}
                {mod.condition === 'critical' &&
                  `Critical Threshold Reached: μ = ${mod.mu.toFixed(2)} (100% Modulation)`}
                {mod.condition === 'overmodulated' &&
                  `Overmodulation Distortion: μ = ${mod.mu.toFixed(2)} (${mod.percentModulation.toFixed(0)}%)`}
              </div>
              <p className="text-[#5B6B86] dark:text-[#8FA3C2]">
                {mod.condition === 'undermodulated' &&
                  `Envelope swings between ${mod.eMax.toFixed(2)} V and ${mod.eMin.toFixed(2)} V (> 0 V). Envelope never reaches zero; ideal for diode envelope detection.`}
                {mod.condition === 'critical' &&
                  `Envelope peaks at 2A_c = ${(2 * params.Ac).toFixed(1)} V and touches exactly 0 V at message troughs without crossing zero.`}
                {mod.condition === 'overmodulated' &&
                  `Because 1 + μ cos(2πf_m t) drops below zero (E_min = ${mod.eMin.toFixed(2)} V), the carrier undergoes a 180° phase inversion and the rectified envelope folds upward, making standard envelope detection fail.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Waveform */}
      <PlotlyChart
        title={`Live Modulation Depth Waveform (μ = ${mod.mu.toFixed(2)})`}
        subtitle="Notice the algebraic envelope (amber) crossing zero when μ > 1 while |envelope| folds upward"
        data={[
          {
            x: tMsLive,
            y: mod.s,
            type: 'scatter',
            mode: 'lines',
            name: 'AM s(t)',
            line: { color: mod.mu > 1 ? '#F87171' : '#34D399', width: 1.5 },
          },
          {
            x: tMsLive,
            y: mod.upperEnvelope,
            type: 'scatter',
            mode: 'lines',
            name: 'Algebraic Envelope Ac(1+ka·m)',
            line: { color: '#FBBF24', width: 2.2, dash: 'dash' },
          },
          {
            x: tMsLive,
            y: mod.lowerEnvelope,
            type: 'scatter',
            mode: 'lines',
            name: 'Lower Envelope',
            line: { color: '#FBBF24', width: 1.8, dash: 'dot' },
          },
        ]}
        height={310}
        isDark={isDark}
        exportFileName="amlab-modulation-index-live"
        layout={{
          xaxis: { title: { text: 'Time (ms)' } },
          yaxis: { title: { text: 'Amplitude (V)' } },
        }}
      />

      {/* 3-Case Side-by-Side Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PlotlyChart
          title="A. Undermodulation (μ = 0.5)"
          subtitle="Envelope stays strictly positive (E_min > 0)"
          data={[
            {
              x: tMsCmp,
              y: comparison.under.s,
              type: 'scatter',
              mode: 'lines',
              name: 's(t)',
              line: { color: '#34D399', width: 1.2 },
            },
            {
              x: tMsCmp,
              y: comparison.under.upperEnvelope,
              type: 'scatter',
              mode: 'lines',
              name: 'Envelope',
              line: { color: '#FBBF24', width: 2, dash: 'dash' },
            },
          ]}
          height={230}
          isDark={isDark}
          exportFileName="amlab-compare-undermod"
          layout={{
            xaxis: { title: { text: 'Time (ms)' } },
            yaxis: { title: { text: 'V' }, range: [-2.6 * params.Ac, 2.6 * params.Ac] },
          }}
        />
        <PlotlyChart
          title="B. Critical Modulation (μ = 1.0)"
          subtitle="100% modulation; envelope touches 0 V"
          data={[
            {
              x: tMsCmp,
              y: comparison.critical.s,
              type: 'scatter',
              mode: 'lines',
              name: 's(t)',
              line: { color: '#FBBF24', width: 1.2 },
            },
            {
              x: tMsCmp,
              y: comparison.critical.upperEnvelope,
              type: 'scatter',
              mode: 'lines',
              name: 'Envelope',
              line: { color: '#22D3EE', width: 2, dash: 'dash' },
            },
          ]}
          height={230}
          isDark={isDark}
          exportFileName="amlab-compare-critical"
          layout={{
            xaxis: { title: { text: 'Time (ms)' } },
            yaxis: { title: { text: 'V' }, range: [-2.6 * params.Ac, 2.6 * params.Ac] },
          }}
        />
        <PlotlyChart
          title="C. Overmodulation (μ = 1.5)"
          subtitle="Envelope crosses zero; 180° phase flip"
          data={[
            {
              x: tMsCmp,
              y: comparison.over.s,
              type: 'scatter',
              mode: 'lines',
              name: 's(t)',
              line: { color: '#F87171', width: 1.2 },
            },
            {
              x: tMsCmp,
              y: comparison.over.upperEnvelope,
              type: 'scatter',
              mode: 'lines',
              name: 'Algebraic Env.',
              line: { color: '#FBBF24', width: 2, dash: 'dash' },
            },
          ]}
          height={230}
          isDark={isDark}
          exportFileName="amlab-compare-overmod"
          layout={{
            xaxis: { title: { text: 'Time (ms)' } },
            yaxis: { title: { text: 'V' }, range: [-2.6 * params.Ac, 2.6 * params.Ac] },
          }}
        />
      </div>
    </div>
  );
};
