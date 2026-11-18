import React, { useEffect, useMemo, useState } from 'react';
import type { Data } from 'plotly.js';
import { Download, Pause, Play } from 'lucide-react';
import {
  computeFFT,
  type AMModulationResult,
  type AMParameters,
  type BandwidthResult,
  type SpectrumComponent,
  type WindowType,
} from '../math/amEngine';
import { PlotlyChart } from '../components/PlotlyChart';
import { MathTex } from '../components/MathTex';
import { MetricReadout, SliderControl } from '../components/LabControls';
import { exportSpectrumCSV } from '../utils/exportUtils';

interface SpectrumViewProps {
  params: AMParameters;
  setParams: React.Dispatch<React.SetStateAction<AMParameters>>;
  mod: AMModulationResult;
  spectrum: SpectrumComponent[];
  bw: BandwidthResult;
  isDark: boolean;
}

export const FrequencySpectrumView: React.FC<SpectrumViewProps> = ({
  params,
  setParams,
  mod,
  spectrum,
  bw,
  isDark,
}) => {
  const [fftLength, setFftLength] = useState<number>(2048);
  const [windowType, setWindowType] = useState<WindowType>('hann');

  const fft = useMemo(
    () => computeFFT(mod.s, params.Fs, windowType, fftLength),
    [mod.s, params.Fs, windowType, fftLength]
  );

  // Build theoretical stem plot traces with distinct colors
  const stemTraces: Data[] = [];
  const groups: Array<{ type: SpectrumComponent['type']; name: string; color: string }> = [
    { type: 'lsb', name: 'Lower Sideband (LSB)', color: '#22D3EE' },
    { type: 'carrier', name: 'Carrier (fc)', color: '#A78BFA' },
    { type: 'usb', name: 'Upper Sideband (USB)', color: '#F472B6' },
  ];

  for (const g of groups) {
    const items = spectrum.filter((c) => c.type === g.type);
    const lx: (number | null)[] = [];
    const ly: (number | null)[] = [];
    const mx: number[] = [];
    const my: number[] = [];
    const txt: string[] = [];
    for (const item of items) {
      const fK = item.frequency / 1000;
      lx.push(fK, fK, null);
      ly.push(0, item.amplitude, null);
      mx.push(fK);
      my.push(item.amplitude);
      txt.push(`${item.label}: ${fK.toFixed(2)} kHz · ${item.amplitude.toFixed(3)} V`);
    }
    if (mx.length > 0) {
      stemTraces.push({
        x: lx,
        y: ly,
        type: 'scatter',
        mode: 'lines',
        showlegend: false,
        hoverinfo: 'skip',
        line: { color: g.color, width: 3 },
      });
      stemTraces.push({
        x: mx,
        y: my,
        type: 'scatter',
        mode: 'text+markers',
        name: g.name,
        text: items.map((i) => `${i.amplitude.toFixed(2)}V`),
        textposition: 'top center',
        hovertext: txt,
        hovertemplate: '%{hovertext}<extra></extra>',
        marker: { color: g.color, size: 10 },
      });
    }
  }

  const maxDisplayFreqKHz = Math.min(
    params.Fs / 2000,
    Math.max(params.fc / 1000 + 60, bw.fHighest / 1000 + 25)
  );
  const minDisplayFreqKHz = Math.max(0, params.fc / 1000 - Math.max(60, bw.fMaxMessage / 1000 * 2.5));

  const fftFreqsKHz = fft.freqs.map((f) => f / 1000);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
              Frequency Spectrum Laboratory (Theoretical & Numerical FFT)
            </h2>
            <p className="text-xs text-[#5B6B86] dark:text-[#8FA3C2]">
              <MathTex latex="s(t) = A_c\cos(2\pi f_c t) + \frac{\mu A_c}{2}\cos(2\pi(f_c+f_m)t) + \frac{\mu A_c}{2}\cos(2\pi(f_c-f_m)t)" />
            </p>
          </div>
          <button
            type="button"
            onClick={() => exportSpectrumCSV('am-frequency-spectrum.csv', spectrum, fft)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#6366F1] text-white hover:bg-[#4F46E5] cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Spectrum CSV</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            label="Message Freq f_m"
            value={params.fm / 1000}
            min={1}
            max={25}
            step={0.5}
            unit="kHz"
            accentColor="#22D3EE"
            onChange={(v) => setParams((p) => ({ ...p, fm: v * 1000 }))}
          />
          <SliderControl
            label="Carrier Amp A_c"
            value={params.Ac}
            min={1}
            max={25}
            step={0.5}
            unit="V"
            accentColor="#A78BFA"
            onChange={(v) => setParams((p) => ({ ...p, Ac: v }))}
          />
          <SliderControl
            label="Modulation Index μ"
            value={mod.mu}
            min={0}
            max={1.8}
            step={0.05}
            accentColor="#F472B6"
            onChange={(mu) =>
              setParams((p) => ({
                ...p,
                ka: Number((mu / Math.max(0.05, p.Am)).toFixed(4)),
              }))
            }
          />
        </div>

        {/* Multi-tone Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#DDE3EE] dark:border-[#24324F]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#5B6B86] dark:text-[#8FA3C2]">
              Tone Mode:
            </span>
            <button
              type="button"
              onClick={() => setParams((p) => ({ ...p, messageWaveform: 'sine' }))}
              className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                params.messageWaveform === 'sine'
                  ? 'bg-[#6366F1] text-white'
                  : 'bg-[#F5F7FB] dark:bg-[#0B1220] text-[#5B6B86] dark:text-[#8FA3C2]'
              }`}
            >
              Single-Tone
            </button>
            <button
              type="button"
              onClick={() => setParams((p) => ({ ...p, messageWaveform: 'multitone' }))}
              className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                params.messageWaveform === 'multitone'
                  ? 'bg-[#6366F1] text-white'
                  : 'bg-[#F5F7FB] dark:bg-[#0B1220] text-[#5B6B86] dark:text-[#8FA3C2]'
              }`}
            >
              Multi-Tone (f₁ + f₂)
            </button>
          </div>

          {params.messageWaveform === 'multitone' && (
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-48">
                <SliderControl
                  label="Tone 2 Amp A_m2"
                  value={params.Am2}
                  min={0.1}
                  max={2.5}
                  step={0.1}
                  unit="V"
                  onChange={(v) => setParams((p) => ({ ...p, Am2: v }))}
                />
              </div>
              <div className="w-48">
                <SliderControl
                  label="Tone 2 Freq f_m2"
                  value={params.fm2 / 1000}
                  min={2}
                  max={35}
                  step={0.5}
                  unit="kHz"
                  onChange={(v) => setParams((p) => ({ ...p, fm2: v * 1000 }))}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Graphs: Theoretical Stem Plot & Numerical FFT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PlotlyChart
          title="Theoretical Two-Sideband Stem Spectrum"
          subtitle="Carrier (#A78BFA), Lower Sideband (#22D3EE), Upper Sideband (#F472B6)"
          data={stemTraces}
          height={320}
          isDark={isDark}
          exportFileName="amlab-theoretical-spectrum"
          layout={{
            xaxis: {
              title: { text: 'Frequency (kHz)' },
              range: [minDisplayFreqKHz, maxDisplayFreqKHz],
            },
            yaxis: {
              title: { text: 'Peak Amplitude (V)' },
              range: [0, Math.max(params.Ac * 1.25, 2)],
            },
          }}
        />

        <PlotlyChart
          title="Numerical Radix-2 FFT Spectrum (Computed from Sampled s(t))"
          subtitle={`N_FFT = ${fft.fftLength} · Δf = ${fft.df.toFixed(1)} Hz · Window: ${windowType}`}
          data={[
            {
              x: fftFreqsKHz,
              y: fft.magnitudes,
              type: 'scatter',
              mode: 'lines',
              name: 'FFT Magnitude',
              line: { color: '#F472B6', width: 1.8 },
              fill: 'tozeroy',
              fillcolor: 'rgba(244, 114, 182, 0.14)',
            },
            {
              x: spectrum.map((s) => s.frequency / 1000),
              y: spectrum.map((s) => s.amplitude),
              type: 'scatter',
              mode: 'markers',
              name: 'Theoretical Peaks',
              marker: { color: '#FBBF24', size: 8, symbol: 'diamond' },
            },
          ]}
          height={320}
          isDark={isDark}
          exportFileName="amlab-fft-spectrum"
          headerRight={
            <div className="flex items-center gap-1.5">
              <select
                value={fftLength}
                onChange={(e) => setFftLength(Number(e.target.value))}
                className="px-2 py-1 text-xs font-mono rounded border border-[#DDE3EE] dark:border-[#24324F] bg-[#F5F7FB] dark:bg-[#0B1220]"
                aria-label="FFT Length"
              >
                <option value={1024}>1024 pt</option>
                <option value={2048}>2048 pt</option>
                <option value={4096}>4096 pt</option>
                <option value={8192}>8192 pt</option>
              </select>
              <select
                value={windowType}
                onChange={(e) => setWindowType(e.target.value as WindowType)}
                className="px-2 py-1 text-xs rounded border border-[#DDE3EE] dark:border-[#24324F] bg-[#F5F7FB] dark:bg-[#0B1220]"
                aria-label="FFT Window"
              >
                <option value="hann">Hann</option>
                <option value="rectangular">Rectangular</option>
              </select>
            </div>
          }
          layout={{
            xaxis: {
              title: { text: 'Frequency (kHz)' },
              range: [minDisplayFreqKHz, maxDisplayFreqKHz],
            },
            yaxis: {
              title: { text: 'Magnitude (V)' },
              range: [0, Math.max(params.Ac * 1.25, 2)],
            },
          }}
        />
      </div>

      {/* Measurements & Leakage Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
            B. Spectrum Measurements & Peak Detection
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono tabular-nums text-left">
              <thead>
                <tr className="border-b border-[#DDE3EE] dark:border-[#24324F] text-[#5B6B86] dark:text-[#8FA3C2]">
                  <th className="py-2 pr-3">Component</th>
                  <th className="py-2 pr-3">Theoretical Freq</th>
                  <th className="py-2 pr-3">Theoretical Amp</th>
                  <th className="py-2">Nearest FFT Peak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE3EE] dark:divide-[#24324F]">
                {spectrum.map((comp, idx) => {
                  const nearest = fft.peaks.reduce(
                    (best, p) =>
                      Math.abs(p.frequency - comp.frequency) < Math.abs(best.frequency - comp.frequency)
                        ? p
                        : best,
                    fft.peaks[0] ?? { frequency: 0, amplitude: 0 }
                  );
                  return (
                    <tr key={`${comp.label}-${idx}`}>
                      <td className="py-2 pr-3 font-semibold">{comp.label}</td>
                      <td className="py-2 pr-3">{(comp.frequency / 1000).toFixed(2)} kHz</td>
                      <td className="py-2 pr-3">{comp.amplitude.toFixed(3)} V</td>
                      <td className="py-2">
                        {(nearest.frequency / 1000).toFixed(2)} kHz ({nearest.amplitude.toFixed(3)} V)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            <MetricReadout label="Separation Δf_sb" value={(params.fm / 1000).toFixed(1)} unit="kHz" />
            <MetricReadout label="Occupied BW" value={(bw.B_AM / 1000).toFixed(1)} unit="kHz" />
            <MetricReadout label="FFT Resolution" value={fft.df.toFixed(1)} unit="Hz" />
            <MetricReadout label="FFT Length" value={String(fft.fftLength)} unit="pts" />
          </div>
        </div>

        <div className="lg:col-span-5 rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 space-y-3 text-xs text-[#5B6B86] dark:text-[#8FA3C2]">
          <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
            Why Each Message Tone Creates Two Sidebands & Spectral Leakage
          </h3>
          <p>
            By Euler&apos;s identity, <MathTex latex="\cos(2\pi f_m t) = \frac{1}{2}(e^{j2\pi f_m t} + e^{-j2\pi f_m t})" /> contains both positive and negative frequencies. Multiplying by the carrier shifts that two-sided baseband spectrum up to <MathTex latex="f_c" />, placing one copy above (<MathTex latex="f_c + f_m" />) and one below (<MathTex latex="f_c - f_m" />).
          </p>
          <p>
            <strong className="text-[#0F172A] dark:text-[#E6EDF7]">Finite Sampling &amp; Spectral Leakage:</strong> Because the FFT evaluates discrete bins spaced by <MathTex latex="\Delta f = F_s / N_{\text{FFT}}" />, any frequency <MathTex latex="f" /> that is not an exact integer multiple of <MathTex latex="\Delta f" /> spreads energy into adjacent bins (scalloping loss). Applying a Hann window suppresses sidelobe leakage while slightly broadening the main lobe; increasing <MathTex latex="N_{\text{FFT}}" /> sharpens bin alignment.
          </p>
        </div>
      </div>
    </div>
  );
};

interface BandwidthViewProps {
  params: AMParameters;
  setParams: React.Dispatch<React.SetStateAction<AMParameters>>;
  bw: BandwidthResult;
  isDark: boolean;
}

export const BandwidthView: React.FC<BandwidthViewProps> = ({
  params,
  setParams,
  bw,
  isDark,
}) => {
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!animating) return;
    const timer = window.setInterval(() => {
      setParams((prev) => {
        const nextFm = prev.fm >= 25_000 ? 2_000 : prev.fm + 1_000;
        return { ...prev, fm: nextFm };
      });
    }, 260);
    return () => window.clearInterval(timer);
  }, [animating, setParams]);

  const fcK = params.fc / 1000;
  const wK = bw.fMaxMessage / 1000;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
              AM Bandwidth Laboratory
            </h2>
            <p className="text-xs text-[#5B6B86] dark:text-[#8FA3C2]">
              Explore how message bandwidth <MathTex latex="W = f_{m(\max)}" /> symmetrically expands the upper and lower sidebands around <MathTex latex="f_c" />.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAnimating((a) => !a)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#6366F1] text-white hover:bg-[#4F46E5] cursor-pointer whitespace-nowrap shrink-0"
            >
              {animating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{animating ? 'Pause Expansion' : 'Animate Bandwidth Sweep'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAnimating(false);
                setParams((p) => ({ ...p, fc: 100_000, fm: 5_000, messageWaveform: 'sine' }));
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#DDE3EE] dark:border-[#24324F] hover:border-[#6366F1] cursor-pointer whitespace-nowrap shrink-0"
            >
              Ex 1: fc=100kHz, fm=5kHz
            </button>
            <button
              type="button"
              onClick={() => {
                setAnimating(false);
                setParams((p) => ({
                  ...p,
                  fc: 1_000_000,
                  fm: 5_000,
                  Fs: 5_000_000,
                  messageWaveform: 'sine',
                }));
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#DDE3EE] dark:border-[#24324F] hover:border-[#6366F1] cursor-pointer whitespace-nowrap shrink-0"
            >
              Ex 2: fc=1MHz, W=5kHz
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SliderControl
            label="Message Bandwidth W = f_m(max)"
            value={bw.fMaxMessage / 1000}
            min={1}
            max={25}
            step={0.5}
            unit="kHz"
            accentColor="#22D3EE"
            onChange={(v) => {
              setAnimating(false);
              setParams((p) => ({ ...p, fm: v * 1000, messageWaveform: 'sine' }));
            }}
          />
          <SliderControl
            label="Carrier Frequency f_c"
            value={params.fc / 1000}
            min={50}
            max={1200}
            step={10}
            unit="kHz"
            accentColor="#A78BFA"
            onChange={(v) =>
              setParams((p) => ({
                ...p,
                fc: v * 1000,
                Fs: Math.max(p.Fs, v * 1000 * 4),
              }))
            }
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricReadout label="Carrier f_c" value={fcK.toFixed(1)} unit="kHz" accentHex="#A78BFA" />
          <MetricReadout
            label="Lowest Sideband"
            value={(bw.fLowest / 1000).toFixed(1)}
            unit="kHz"
            accentHex="#22D3EE"
          />
          <MetricReadout
            label="Highest Sideband"
            value={(bw.fHighest / 1000).toFixed(1)}
            unit="kHz"
            accentHex="#F472B6"
          />
          <MetricReadout
            label="Total AM Bandwidth"
            value={(bw.B_AM / 1000).toFixed(1)}
            unit="kHz"
            subtext="2 × W"
            accentHex="#34D399"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PlotlyChart
          title="Animated Sideband Occupancy Around Carrier"
          subtitle={`LSB [${(fcK - wK).toFixed(1)}, ${fcK.toFixed(1)}] kHz · USB [${fcK.toFixed(1)}, ${(fcK + wK).toFixed(1)}] kHz`}
          data={[
            {
              x: [Math.max(0, fcK - wK), fcK, fcK],
              y: [0.05, 0.5, 0],
              type: 'scatter',
              mode: 'lines',
              fill: 'tozeroy',
              name: 'LSB Band (Width W)',
              line: { color: '#22D3EE', width: 2 },
              fillcolor: 'rgba(34, 211, 238, 0.25)',
            },
            {
              x: [fcK, fcK, fcK + wK],
              y: [0, 0.5, 0.05],
              type: 'scatter',
              mode: 'lines',
              fill: 'tozeroy',
              name: 'USB Band (Width W)',
              line: { color: '#F472B6', width: 2 },
              fillcolor: 'rgba(244, 114, 182, 0.25)',
            },
            {
              x: [fcK, fcK],
              y: [0, 1],
              type: 'scatter',
              mode: 'lines+markers',
              name: 'Carrier Impulse (0 Hz width)',
              line: { color: '#A78BFA', width: 3 },
            },
          ]}
          height={290}
          isDark={isDark}
          exportFileName="amlab-bandwidth-expansion"
          layout={{
            xaxis: {
              title: { text: 'Frequency (kHz)' },
              range: [Math.max(0, fcK - 35), fcK + 35],
            },
            yaxis: { title: { text: 'Normalized Envelope' }, range: [0, 1.15] },
          }}
        />

        <PlotlyChart
          title="Bandwidth Comparison: Conventional AM vs DSB-SC vs SSB"
          subtitle={`For message bandwidth W = ${wK.toFixed(1)} kHz`}
          data={[
            {
              x: ['Conventional AM', 'DSB-SC', 'SSB (Single Sideband)'],
              y: [bw.B_AM / 1000, bw.B_DSB_SC / 1000, bw.B_SSB / 1000],
              type: 'bar',
              text: [
                `2W = ${(bw.B_AM / 1000).toFixed(1)} kHz`,
                `2W = ${(bw.B_DSB_SC / 1000).toFixed(1)} kHz`,
                `W = ${(bw.B_SSB / 1000).toFixed(1)} kHz`,
              ],
              textposition: 'auto',
              marker: { color: ['#34D399', '#6366F1', '#22D3EE'] },
              name: 'Bandwidth (kHz)',
            },
          ]}
          height={290}
          isDark={isDark}
          exportFileName="amlab-bandwidth-comparison"
          layout={{
            showlegend: false,
            xaxis: { title: { text: 'Modulation Technique' } },
            yaxis: { title: { text: 'Required Bandwidth (kHz)' }, rangemode: 'tozero' },
          }}
        />
      </div>

      {/* Worked Examples & Explanations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#5B6B86] dark:text-[#8FA3C2]">
        <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-4 space-y-2">
          <div className="font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
            Example 1: f_c = 100 kHz, f_m = 5 kHz
          </div>
          <MathTex block latex="f_{\text{LSB}} = 95\text{ kHz}, \quad f_{\text{USB}} = 105\text{ kHz}" />
          <MathTex block latex="B_{\text{AM}} = 105 - 95 = 2(5) = 10\text{ kHz}" />
        </div>
        <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-4 space-y-2">
          <div className="font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
            Example 2: f_c = 1 MHz, W = 5 kHz
          </div>
          <MathTex block latex="f_{\text{LSB,min}} = 995\text{ kHz}, \quad f_{\text{USB,max}} = 1005\text{ kHz}" />
          <MathTex block latex="B_{\text{AM}} = 2W = 10\text{ kHz}" />
        </div>
        <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-4 space-y-2">
          <div className="font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
            Why Carrier Adds Zero Bandwidth &amp; AM vs DSB-SC vs SSB
          </div>
          <p>
            The unmodulated carrier is a single impulse at f_c with zero frequency span. Conventional AM and DSB-SC both transmit USB and LSB (bandwidth 2W), differing only in whether the carrier is present. SSB suppresses the carrier and one redundant sideband, halving bandwidth to W.
          </p>
        </div>
      </div>
    </div>
  );
};
