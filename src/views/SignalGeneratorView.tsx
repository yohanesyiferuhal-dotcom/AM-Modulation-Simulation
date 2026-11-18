import React from 'react';
import { AlertTriangle, CheckCircle2, Download } from 'lucide-react';
import type {
  AMModulationResult,
  AMParameters,
  CarrierWaveformType,
  MessageWaveformType,
} from '../math/amEngine';
import { PlotlyChart } from '../components/PlotlyChart';
import { MathTex } from '../components/MathTex';
import { MetricReadout, SliderControl } from '../components/LabControls';
import { exportSignalCSV } from '../utils/exportUtils';

interface SignalGeneratorViewProps {
  params: AMParameters;
  setParams: React.Dispatch<React.SetStateAction<AMParameters>>;
  mod: AMModulationResult;
  isDark: boolean;
}

export const SignalGeneratorView: React.FC<SignalGeneratorViewProps> = ({
  params,
  setParams,
  mod,
  isDark,
}) => {
  const tMs = mod.t.map((v) => v * 1000);

  const messageEq = (() => {
    switch (params.messageWaveform) {
      case 'sine':
        return `m(t) = ${params.Am.toFixed(2)}\\cos(2\\pi \\cdot ${(params.fm / 1000).toFixed(1)}\\text{ kHz}\\cdot t)`;
      case 'multitone':
        return `m(t) = ${params.Am.toFixed(2)}\\cos(2\\pi \\cdot ${(params.fm / 1000).toFixed(1)}\\text{ kHz}\\cdot t) + ${params.Am2.toFixed(2)}\\cos(2\\pi \\cdot ${(params.fm2 / 1000).toFixed(1)}\\text{ kHz}\\cdot t)`;
      case 'square':
        return `m(t) = ${params.Am.toFixed(2)}\\,\\text{sgn}\\!\\big(\\sin(2\\pi \\cdot ${(params.fm / 1000).toFixed(1)}\\text{ kHz}\\cdot t)\\big)`;
      case 'triangle':
        return `m(t) = ${params.Am.toFixed(2)}\\,\\text{tri}\\!\\big(${(params.fm / 1000).toFixed(1)}\\text{ kHz}\\cdot t\\big)`;
      case 'sawtooth':
        return `m(t) = ${params.Am.toFixed(2)}\\,\\text{saw}\\!\\big(${(params.fm / 1000).toFixed(1)}\\text{ kHz}\\cdot t\\big)`;
    }
  })();

  const carrierEq = (() => {
    const phaseStr =
      params.carrierPhaseDeg === 0
        ? ''
        : params.carrierPhaseDeg > 0
          ? ` + ${params.carrierPhaseDeg}^\\circ`
          : ` - ${Math.abs(params.carrierPhaseDeg)}^\\circ`;
    const fn = params.carrierWaveform === 'sine' ? '\\sin' : params.carrierWaveform === 'cosine' ? '\\cos' : `\\text{${params.carrierWaveform}}`;
    return `c(t) = ${params.Ac.toFixed(1)}\\,${fn}\\!\\big(2\\pi \\cdot ${(params.fc / 1000).toFixed(1)}\\text{ kHz}\\cdot t${phaseStr}\\big)`;
  })();

  return (
    <div className="space-y-6">
      {/* Sampling & Time Settings Bar */}
      <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
              C. Sampling & Time-Base Configuration
            </h2>
            <p className="text-xs text-[#5B6B86] dark:text-[#8FA3C2]">
              Ensure sampling frequency F_s is well above the Nyquist limit 2(f_c + f_m) to prevent aliasing.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            {mod.samplingWarning ? (
              <span className="inline-flex items-center gap-1.5 text-[#DC2626] dark:text-[#F87171]">
                <AlertTriangle className="w-4 h-4" />
                <span>Sampling Warning</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[#059669] dark:text-[#34D399]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Nyquist Satisfied ({(params.Fs / (params.fc + mod.m.maxFreq)).toFixed(1)}× f_max)</span>
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SliderControl
            label="Sampling Frequency F_s"
            value={params.Fs / 1e6}
            min={0.2}
            max={5.0}
            step={0.1}
            unit="MHz"
            onChange={(v) => setParams((p) => ({ ...p, Fs: Math.round(v * 1e6) }))}
          />
          <div>
            <label className="block text-xs font-medium text-[#0F172A] dark:text-[#E6EDF7] mb-1.5">
              Number of Samples N
            </label>
            <select
              value={params.numSamples}
              onChange={(e) => setParams((p) => ({ ...p, numSamples: Number(e.target.value) }))}
              className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-[#DDE3EE] dark:border-[#24324F] bg-[#F5F7FB] dark:bg-[#0B1220] text-[#0F172A] dark:text-[#E6EDF7]"
            >
              <option value={512}>512 samples</option>
              <option value={1024}>1024 samples</option>
              <option value={2048}>2048 samples</option>
              <option value={4096}>4096 samples</option>
            </select>
          </div>
          <MetricReadout
            label="Simulation Duration T"
            value={(mod.duration * 1000).toFixed(3)}
            unit="ms"
            subtext={`Δt = ${(mod.dt * 1e6).toFixed(3)} μs`}
          />
          <MetricReadout
            label="Nyquist Limit (F_s / 2)"
            value={(mod.nyquistFreq / 1000).toFixed(1)}
            unit="kHz"
            subtext={`Max Signal: ${((params.fc + mod.m.maxFreq) / 1000).toFixed(1)} kHz`}
          />
        </div>

        {mod.samplingWarning && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#F87171]/10 border border-[#F87171]/40 text-xs text-[#B91C1C] dark:text-[#FCA5A5]">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{mod.samplingWarning}</span>
          </div>
        )}
      </div>

      {/* Dual Column: A. Message Generator & B. Carrier Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* A. Message Signal Generator */}
        <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
                A. Message Signal Generator m(t)
              </h2>
              <p className="text-xs text-[#5B6B86] dark:text-[#8FA3C2]">
                Baseband modulating waveform
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                exportSignalCSV('message-signal.csv', mod.t, ['time_s', 'message_V'], [mod.m.samples])
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#DDE3EE] dark:border-[#24324F] hover:bg-[#F5F7FB] dark:hover:bg-[#17233D] cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#5B6B86] dark:text-[#8FA3C2] mb-1">
                Waveform Type
              </label>
              <select
                value={params.messageWaveform}
                onChange={(e) =>
                  setParams((p) => ({
                    ...p,
                    messageWaveform: e.target.value as MessageWaveformType,
                  }))
                }
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#DDE3EE] dark:border-[#24324F] bg-[#F5F7FB] dark:bg-[#0B1220] text-[#0F172A] dark:text-[#E6EDF7]"
              >
                <option value="sine">Single-Tone Sinusoidal</option>
                <option value="multitone">Multiple-Tone Sinusoidal</option>
                <option value="square">Square Wave</option>
                <option value="triangle">Triangular Wave</option>
                <option value="sawtooth">Sawtooth Wave</option>
              </select>
            </div>
            <div className="p-2.5 rounded-lg bg-[#F5F7FB] dark:bg-[#0B1220] border border-[#DDE3EE] dark:border-[#24324F] flex items-center justify-center overflow-x-auto">
              <MathTex latex={messageEq} className="text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {params.messageWaveform === 'multitone' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#DDE3EE] dark:border-[#24324F]">
              <SliderControl
                label="Tone 2 Amplitude A_m2"
                value={params.Am2}
                min={0.1}
                max={3}
                step={0.05}
                unit="V"
                accentColor="#22D3EE"
                onChange={(v) => setParams((p) => ({ ...p, Am2: v }))}
              />
              <SliderControl
                label="Tone 2 Frequency f_m2"
                value={params.fm2 / 1000}
                min={2}
                max={35}
                step={0.5}
                unit="kHz"
                accentColor="#22D3EE"
                onChange={(v) => setParams((p) => ({ ...p, fm2: v * 1000 }))}
              />
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <MetricReadout label="Peak Amp" value={mod.m.peak.toFixed(3)} unit="V" accentHex="#22D3EE" />
            <MetricReadout label="RMS Amp" value={mod.m.rms.toFixed(3)} unit="V" />
            <MetricReadout label="Freq f_m" value={(params.fm / 1000).toFixed(2)} unit="kHz" />
            <MetricReadout
              label="Period T_m"
              value={(mod.m.period * 1000).toFixed(3)}
              unit="ms"
            />
          </div>

          <PlotlyChart
            title="Message Waveform m(t)"
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
            height={250}
            isDark={isDark}
            exportFileName="amlab-message-generator"
            layout={{
              xaxis: { title: { text: 'Time (ms)' } },
              yaxis: { title: { text: 'Voltage (V)' } },
            }}
          />
        </div>

        {/* B. Carrier Signal Generator */}
        <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
                B. Carrier Signal Generator c(t)
              </h2>
              <p className="text-xs text-[#5B6B86] dark:text-[#8FA3C2]">
                High-frequency RF reference waveform
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                exportSignalCSV('carrier-signal.csv', mod.t, ['time_s', 'carrier_V'], [mod.c.samples])
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#DDE3EE] dark:border-[#24324F] hover:bg-[#F5F7FB] dark:hover:bg-[#17233D] cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#5B6B86] dark:text-[#8FA3C2] mb-1">
                Carrier Waveform
              </label>
              <select
                value={params.carrierWaveform}
                onChange={(e) =>
                  setParams((p) => ({
                    ...p,
                    carrierWaveform: e.target.value as CarrierWaveformType,
                  }))
                }
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#DDE3EE] dark:border-[#24324F] bg-[#F5F7FB] dark:bg-[#0B1220] text-[#0F172A] dark:text-[#E6EDF7]"
              >
                <option value="cosine">Sinusoidal Cosine (Default)</option>
                <option value="sine">Sinusoidal Sine</option>
                <option value="square">Square Carrier</option>
                <option value="triangle">Triangle Carrier</option>
              </select>
            </div>
            <div className="p-2.5 rounded-lg bg-[#F5F7FB] dark:bg-[#0B1220] border border-[#DDE3EE] dark:border-[#24324F] flex items-center justify-center overflow-x-auto">
              <MathTex latex={carrierEq} className="text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              label="Carrier Freq f_c"
              value={params.fc / 1000}
              min={30}
              max={300}
              step={5}
              unit="kHz"
              accentColor="#A78BFA"
              onChange={(v) => setParams((p) => ({ ...p, fc: v * 1000 }))}
            />
            <SliderControl
              label="Phase φ_c"
              value={params.carrierPhaseDeg}
              min={-180}
              max={180}
              step={15}
              unit="deg"
              accentColor="#A78BFA"
              onChange={(v) => setParams((p) => ({ ...p, carrierPhaseDeg: v }))}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <MetricReadout label="Peak Amp" value={mod.c.peak.toFixed(2)} unit="V" accentHex="#A78BFA" />
            <MetricReadout label="RMS Amp" value={mod.c.rms.toFixed(2)} unit="V" />
            <MetricReadout label="Freq f_c" value={(params.fc / 1000).toFixed(1)} unit="kHz" />
            <MetricReadout
              label="Period T_c"
              value={(mod.c.period * 1e6).toFixed(2)}
              unit="μs"
            />
          </div>

          <PlotlyChart
            title="Carrier Waveform c(t)"
            subtitle="Zoomed or full time window (use Plotly box zoom to inspect individual carrier cycles)"
            data={[
              {
                x: tMs,
                y: mod.c.samples,
                type: 'scatter',
                mode: 'lines',
                name: 'c(t)',
                line: { color: '#A78BFA', width: 1.4 },
              },
            ]}
            height={250}
            isDark={isDark}
            exportFileName="amlab-carrier-generator"
            layout={{
              xaxis: { title: { text: 'Time (ms)' } },
              yaxis: { title: { text: 'Voltage (V)' } },
            }}
          />
        </div>
      </div>
    </div>
  );
};
