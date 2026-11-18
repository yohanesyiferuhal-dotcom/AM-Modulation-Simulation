import React, { useMemo, useState } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import {
  analyzeNoisyAM,
  simulateSuperheterodyne,
  type AMModulationResult,
  type AMParameters,
  type NoiseType,
} from '../math/amEngine';
import { PlotlyChart } from '../components/PlotlyChart';
import { MathTex } from '../components/MathTex';
import { MetricReadout, SliderControl } from '../components/LabControls';

interface ReceiverProps {
  params: AMParameters;
  mod: AMModulationResult;
  isDark: boolean;
}

export const AMReceiverView: React.FC<ReceiverProps> = ({ params, mod, isDark }) => {
  const [fRFkHz, setFRFkHz] = useState(1000);
  const [fIFkHz, setFIFkHz] = useState(455);
  const [autoLO, setAutoLO] = useState(true);
  const [manualLOkHz, setManualLOkHz] = useState(1455);
  const [rxBwKHz, setRxBwKHz] = useState(12);
  const [activeStage, setActiveStage] = useState<number>(0);

  const effectiveLOkHz = autoLO ? fRFkHz + fIFkHz : manualLOkHz;

  const superhet = useMemo(
    () =>
      simulateSuperheterodyne(
        fRFkHz * 1000,
        fIFkHz * 1000,
        effectiveLOkHz * 1000,
        params.fm,
        params.Ac,
        mod.mu,
        rxBwKHz * 1000
      ),
    [fRFkHz, fIFkHz, effectiveLOkHz, params.fm, params.Ac, mod.mu, rxBwKHz]
  );

  const stages = [
    {
      name: '1. RF Stage',
      detail: `Tuned preselector selects ${fRFkHz} kHz station and rejects image at ${(superhet.fImage / 1000).toFixed(0)} kHz.`,
    },
    {
      name: '2. Local Osc.',
      detail: `Generates unmodulated sinusoid at f_LO = ${effectiveLOkHz} kHz.`,
    },
    {
      name: '3. Mixer',
      detail: `Multiplies RF & LO to produce |f_LO − f_RF| = ${(Math.abs(effectiveLOkHz - fRFkHz)).toFixed(0)} kHz and sum ${(effectiveLOkHz + fRFkHz).toFixed(0)} kHz.`,
    },
    {
      name: '4. IF Stage',
      detail: `Fixed ${rxBwKHz} kHz bandpass filter centered at ${fIFkHz} kHz isolates the desired channel.`,
    },
    {
      name: '5. Detector',
      detail: 'Diode-RC envelope detector extracts baseband message from IF carrier.',
    },
    {
      name: '6. Audio Out',
      detail: `Delivers ${(params.fm / 1000).toFixed(1)} kHz demodulated signal to speaker.`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
              Practical Superheterodyne AM Receiver Simulator
            </h2>
            <p className="text-xs text-[#5B6B86] dark:text-[#8FA3C2]">
              Frequency conversion equation: <MathTex latex="f_{\text{IF}} = |f_{\text{LO}} - f_{\text{RF}}|" /> (standard AM IF = 455 kHz).
            </p>
          </div>
          <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={autoLO}
              onChange={(e) => setAutoLO(e.target.checked)}
              className="accent-[#6366F1]"
            />
            <span className="text-[#0F172A] dark:text-[#E6EDF7] font-medium">
              Auto-Track High-Side LO (f_LO = f_RF + f_IF)
            </span>
          </label>
        </div>

        {/* Interactive Signal Flow Chain */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          {stages.map((st, idx) => (
            <button
              key={st.name}
              type="button"
              onClick={() => setActiveStage(idx)}
              className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                activeStage === idx
                  ? 'border-[#6366F1] bg-[#6366F1]/10'
                  : 'border-[#DDE3EE] dark:border-[#24324F] bg-[#F5F7FB] dark:bg-[#0B1220] hover:border-[#6366F1]/50'
              }`}
            >
              <div className="flex items-center justify-between gap-1 text-xs font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
                <span className="truncate">{st.name}</span>
                {idx < stages.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-[#6366F1] shrink-0" />
                )}
              </div>
              <p className="mt-1 text-[11px] text-[#5B6B86] dark:text-[#8FA3C2] leading-snug">
                {st.detail}
              </p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <SliderControl
            label="RF Carrier Freq f_RF"
            value={fRFkHz}
            min={535}
            max={1605}
            step={10}
            unit="kHz"
            accentColor="#22D3EE"
            onChange={setFRFkHz}
          />
          <SliderControl
            label="Local Oscillator f_LO"
            value={effectiveLOkHz}
            min={600}
            max={2200}
            step={10}
            unit="kHz"
            accentColor="#A78BFA"
            onChange={(v) => {
              setAutoLO(false);
              setManualLOkHz(v);
            }}
          />
          <SliderControl
            label="Intermediate Freq f_IF"
            value={fIFkHz}
            min={200}
            max={600}
            step={5}
            unit="kHz"
            accentColor="#FBBF24"
            onChange={setFIFkHz}
          />
          <SliderControl
            label="IF Receiver Bandwidth"
            value={rxBwKHz}
            min={2}
            max={30}
            step={1}
            unit="kHz"
            accentColor="#34D399"
            onChange={setRxBwKHz}
          />
        </div>
      </div>

      {/* Receiver Stage Plots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PlotlyChart
          title="1. RF Input Spectrum & Local Oscillator"
          subtitle={`Desired RF = ${fRFkHz} kHz · LO = ${effectiveLOkHz} kHz · Image = ${(superhet.fImage / 1000).toFixed(0)} kHz`}
          data={[
            {
              x: superhet.rfSpectrum.map((s) => s.frequency / 1000),
              y: superhet.rfSpectrum.map((s) => s.amplitude),
              type: 'bar',
              width: 12,
              name: 'RF Station Spectrum',
              marker: { color: '#22D3EE' },
            },
            {
              x: [effectiveLOkHz],
              y: [params.Ac * 1.1],
              type: 'bar',
              width: 12,
              name: 'Local Oscillator (f_LO)',
              marker: { color: '#A78BFA' },
            },
          ]}
          height={270}
          isDark={isDark}
          exportFileName="amlab-superhet-rf"
          layout={{
            xaxis: { title: { text: 'Frequency (kHz)' } },
            yaxis: { title: { text: 'Amplitude (V)' } },
          }}
        />

        <PlotlyChart
          title="2. Mixer Output Spectrum (|f_LO − f_RF| & f_LO + f_RF)"
          subtitle={`Difference term at ${Math.abs(effectiveLOkHz - fRFkHz)} kHz · Sum term at ${effectiveLOkHz + fRFkHz} kHz`}
          data={[
            {
              x: superhet.mixerSpectrum.map((s) => s.frequency / 1000),
              y: superhet.mixerSpectrum.map((s) => s.amplitude),
              type: 'bar',
              width: 16,
              name: 'Mixer Products',
              marker: { color: '#F472B6' },
            },
          ]}
          height={270}
          isDark={isDark}
          exportFileName="amlab-superhet-mixer"
          layout={{
            xaxis: { title: { text: 'Frequency (kHz)' } },
            yaxis: { title: { text: 'Amplitude (V)' } },
          }}
        />

        <PlotlyChart
          title={`3. IF Bandpass Filter Response (Centered at ${fIFkHz} kHz)`}
          subtitle={`Passband Width = ${rxBwKHz} kHz vs Signal Bandwidth = ${((2 * params.fm) / 1000).toFixed(1)} kHz`}
          data={[
            {
              x: superhet.ifFilterFreqs.map((f) => f / 1000),
              y: superhet.ifFilterResponse,
              type: 'scatter',
              mode: 'lines',
              name: 'IF Filter |H(f)|',
              line: { color: '#FBBF24', width: 2.3 },
              fill: 'tozeroy',
              fillcolor: 'rgba(251, 191, 36, 0.14)',
            },
            {
              x: [
                Math.abs(effectiveLOkHz - fRFkHz) - params.fm / 1000,
                Math.abs(effectiveLOkHz - fRFkHz),
                Math.abs(effectiveLOkHz - fRFkHz) + params.fm / 1000,
              ],
              y: [0.5 * mod.mu, 1.0, 0.5 * mod.mu],
              type: 'bar',
              width: 1.5,
              name: 'Translated IF Signal',
              marker: { color: '#34D399' },
            },
          ]}
          height={270}
          isDark={isDark}
          exportFileName="amlab-superhet-if-filter"
          layout={{
            xaxis: { title: { text: 'IF Frequency (kHz)' } },
            yaxis: { title: { text: 'Normalized Gain' }, range: [0, 1.15] },
          }}
        />

        <PlotlyChart
          title="4. Demodulated Receiver Audio Output"
          subtitle={
            Math.abs(Math.abs(effectiveLOkHz - fRFkHz) - fIFkHz) > rxBwKHz / 2
              ? 'Station mistuned outside IF passband!'
              : rxBwKHz < (2 * params.fm) / 1000
                ? 'IF bandwidth narrower than 2·fm: sidebands attenuated'
                : 'Cleanly tuned & demodulated'
          }
          data={[
            {
              x: superhet.demodulatedT.map((v) => v * 1000),
              y: superhet.demodulatedSignal,
              type: 'scatter',
              mode: 'lines',
              name: 'Audio Output',
              line: { color: '#34D399', width: 2.2 },
            },
          ]}
          height={270}
          isDark={isDark}
          exportFileName="amlab-superhet-audio"
          layout={{
            xaxis: { title: { text: 'Time (ms)' } },
            yaxis: { title: { text: 'Normalized Amplitude' }, range: [-1.8, 1.8] },
          }}
        />
      </div>
    </div>
  );
};

export const NoiseAnalysisView: React.FC<ReceiverProps> = ({ params, mod, isDark }) => {
  const [noiseType, setNoiseType] = useState<NoiseType>('white');
  const [noiseAmplitude, setNoiseAmplitude] = useState<number>(1.5);
  const [seed, setSeed] = useState<number>(42);

  const noiseRes = useMemo(
    () => analyzeNoisyAM(params, mod, noiseType, noiseAmplitude, seed),
    [params, mod, noiseType, noiseAmplitude, seed]
  );

  const tMs = mod.t.map((v) => v * 1000);
  const freqsKHz = noiseRes.cleanSpectrum.freqs.map((f) => f / 1000);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
              Noise &amp; AM Signal Quality Laboratory
            </h2>
            <p className="text-xs text-[#5B6B86] dark:text-[#8FA3C2]">
              Observe how additive channel noise degrades AM waveforms, spectra, and envelope-detected message quality.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={noiseType}
              onChange={(e) => setNoiseType(e.target.value as NoiseType)}
              className="px-3 py-1.5 text-xs rounded-lg border border-[#DDE3EE] dark:border-[#24324F] bg-[#F5F7FB] dark:bg-[#0B1220]"
            >
              <option value="white">White Gaussian Noise (AWGN)</option>
              <option value="bandlimited">Band-Limited Channel Noise</option>
            </select>
            <button
              type="button"
              onClick={() => setSeed((s) => s + 17)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#DDE3EE] dark:border-[#24324F] hover:border-[#6366F1] cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>New Sample</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="md:col-span-2">
            <SliderControl
              label="Noise RMS Amplitude σ_n"
              value={noiseAmplitude}
              min={0}
              max={8}
              step={0.1}
              unit="V"
              accentColor="#F87171"
              onChange={setNoiseAmplitude}
            />
          </div>
          <MetricReadout
            label="Signal-to-Noise Ratio (SNR)"
            value={noiseAmplitude <= 0.001 ? '∞' : noiseRes.snrDb.toFixed(2)}
            unit="dB"
            subtext={`Linear: ${noiseAmplitude <= 0.001 ? '∞' : noiseRes.snrLinear.toFixed(2)}`}
            accentHex={noiseRes.snrDb < 10 ? '#F87171' : '#34D399'}
          />
          <MetricReadout
            label="Noise Power P_n"
            value={noiseRes.Pn.toFixed(4)}
            unit="W"
            subtext={`Total P_s = ${noiseRes.Ps.toFixed(3)} W`}
            accentHex="#FBBF24"
          />
        </div>

        <div className="p-3.5 rounded-lg bg-[#F5F7FB] dark:bg-[#0B1220] border border-[#DDE3EE] dark:border-[#24324F] text-xs text-[#5B6B86] dark:text-[#8FA3C2] flex flex-wrap items-center justify-between gap-2">
          <span>
            <strong className="text-[#0F172A] dark:text-[#E6EDF7]">Important Distinction:</strong> Total RF power <span className="font-mono">P_s = {noiseRes.Ps.toFixed(3)} W</span> includes carrier power (<span className="font-mono">{(noiseRes.Ps - noiseRes.PsSideband).toFixed(3)} W</span>), whereas message-bearing sideband power is only <span className="font-mono">P_SB = {noiseRes.PsSideband.toFixed(3)} W</span>. The carrier itself contains no message information.
          </span>
          <MathTex latex="\text{SNR}_{\text{dB}} = 10\log_{10}\!\left(\frac{P_s}{P_n}\right)" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PlotlyChart
          title="1. Clean AM vs Noisy AM Waveform"
          data={[
            {
              x: tMs,
              y: noiseRes.noisyAM,
              type: 'scatter',
              mode: 'lines',
              name: 'Noisy AM s(t)+n(t)',
              line: { color: '#F87171', width: 1.2 },
            },
            {
              x: tMs,
              y: mod.s,
              type: 'scatter',
              mode: 'lines',
              name: 'Clean AM s(t)',
              line: { color: '#34D399', width: 1.4 },
            },
          ]}
          height={270}
          isDark={isDark}
          exportFileName="amlab-noisy-waveform"
          layout={{
            xaxis: { title: { text: 'Time (ms)' } },
            yaxis: { title: { text: 'Voltage (V)' } },
          }}
        />

        <PlotlyChart
          title="2. Clean vs Noisy FFT Spectrum"
          data={[
            {
              x: freqsKHz,
              y: noiseRes.noisySpectrum.magnitudes,
              type: 'scatter',
              mode: 'lines',
              name: 'Noisy Spectrum',
              line: { color: '#F87171', width: 1.4 },
            },
            {
              x: freqsKHz,
              y: noiseRes.cleanSpectrum.magnitudes,
              type: 'scatter',
              mode: 'lines',
              name: 'Clean Spectrum',
              line: { color: '#22D3EE', width: 1.6 },
            },
          ]}
          height={270}
          isDark={isDark}
          exportFileName="amlab-noisy-spectrum"
          layout={{
            xaxis: {
              title: { text: 'Frequency (kHz)' },
              range: [0, Math.min(params.Fs / 2000, (params.fc * 2.2) / 1000)],
            },
            yaxis: { title: { text: 'Magnitude (V)' } },
          }}
        />
      </div>

      <PlotlyChart
        title="3. Demodulated Message Recovery: Clean vs Noisy Channel"
        subtitle="Notice noise degrades recovered baseband waveform proportional to noise-to-sideband ratio"
        data={[
          {
            x: tMs,
            y: noiseRes.recoveredNoisy,
            type: 'scatter',
            mode: 'lines',
            name: 'Recovered (Noisy)',
            line: { color: '#F87171', width: 1.6 },
          },
          {
            x: tMs,
            y: noiseRes.recoveredClean,
            type: 'scatter',
            mode: 'lines',
            name: 'Recovered (Clean)',
            line: { color: '#34D399', width: 2 },
          },
          {
            x: tMs,
            y: mod.m.samples,
            type: 'scatter',
            mode: 'lines',
            name: 'Original m(t)',
            line: { color: '#22D3EE', width: 1.8, dash: 'dash' },
          },
        ]}
        height={280}
        isDark={isDark}
        exportFileName="amlab-noisy-demodulated"
        layout={{
          xaxis: { title: { text: 'Time (ms)' } },
          yaxis: { title: { text: 'Amplitude (V)' } },
        }}
      />
    </div>
  );
};
