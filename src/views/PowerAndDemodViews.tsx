import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import {
  computeAMPower,
  simulateCoherentDetector,
  simulateEnvelopeDetector,
  type AMModulationResult,
  type AMParameters,
  type AMPowerResult,
} from '../math/amEngine';
import { PlotlyChart } from '../components/PlotlyChart';
import { MathTex } from '../components/MathTex';
import { MetricReadout, SliderControl } from '../components/LabControls';

interface PowerViewProps {
  params: AMParameters;
  setParams: React.Dispatch<React.SetStateAction<AMParameters>>;
  mod: AMModulationResult;
  pwr: AMPowerResult;
  isDark: boolean;
}

export const PowerAnalysisView: React.FC<PowerViewProps> = ({
  params,
  setParams,
  mod,
  pwr,
  isDark,
}) => {
  const sweep = useMemo(() => {
    const muVals: number[] = [];
    const etaVals: number[] = [];
    const ptVals: number[] = [];
    for (let i = 0; i <= 150; i++) {
      const m = i * 0.01;
      const res = computeAMPower(params.Ac, m, params.loadResistance);
      muVals.push(m);
      etaVals.push(res.efficiencyPercent);
      ptVals.push(res.Pt);
    }
    return { muVals, etaVals, ptVals };
  }, [params.Ac, params.loadResistance]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
              AM Transmitted Power &amp; Efficiency Laboratory
            </h2>
            <p className="text-xs text-[#5B6B86] dark:text-[#8FA3C2]">
              Note: These analytical equations assume a single-tone sinusoidal message <MathTex latex="m(t) = A_m \cos(2\pi f_m t)" /> across a purely resistive load <MathTex latex="R" />.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setParams((p) => ({
                ...p,
                messageWaveform: 'sine',
                ka: Number((1.0 / Math.max(0.05, p.Am)).toFixed(4)),
              }))
            }
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#6366F1] text-white hover:bg-[#4F46E5] cursor-pointer whitespace-nowrap shrink-0"
          >
            Set Max Efficiency (μ = 1.0 → 33.33%)
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SliderControl
            label="Carrier Amplitude A_c"
            value={params.Ac}
            min={1}
            max={30}
            step={0.5}
            unit="V"
            accentColor="#A78BFA"
            onChange={(v) => setParams((p) => ({ ...p, Ac: v }))}
          />
          <SliderControl
            label="Modulation Index μ"
            value={mod.mu}
            min={0}
            max={1.5}
            step={0.02}
            accentColor="#34D399"
            onChange={(mu) =>
              setParams((p) => ({
                ...p,
                ka: Number((mu / Math.max(0.05, p.Am)).toFixed(4)),
              }))
            }
          />
          <SliderControl
            label="Load Resistance R"
            value={params.loadResistance}
            min={10}
            max={200}
            step={5}
            unit="Ω"
            accentColor="#FBBF24"
            onChange={(v) => setParams((p) => ({ ...p, loadResistance: v }))}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricReadout
            label="Carrier Power P_c"
            value={pwr.Pc.toFixed(4)}
            unit="W"
            subtext={`${pwr.carrierPercent.toFixed(1)}% of P_t`}
            accentHex="#A78BFA"
          />
          <MetricReadout
            label="Upper Sideband P_USB"
            value={pwr.PUSB.toFixed(4)}
            unit="W"
            subtext={`${pwr.usbPercent.toFixed(1)}% of P_t`}
            accentHex="#F472B6"
          />
          <MetricReadout
            label="Lower Sideband P_LSB"
            value={pwr.PLSB.toFixed(4)}
            unit="W"
            subtext={`${pwr.lsbPercent.toFixed(1)}% of P_t`}
            accentHex="#22D3EE"
          />
          <MetricReadout
            label="Total Sideband P_SB"
            value={pwr.PSB.toFixed(4)}
            unit="W"
            subtext="Information power"
            accentHex="#FBBF24"
          />
          <MetricReadout
            label="Total Power P_t"
            value={pwr.Pt.toFixed(4)}
            unit="W"
            subtext={`Num: ${pwr.numericalTotalPower.toFixed(3)} W`}
            accentHex="#34D399"
          />
          <MetricReadout
            label="Efficiency η"
            value={pwr.efficiencyPercent.toFixed(2)}
            unit="%"
            subtext="Max 33.33% at μ=1"
            accentHex="#6366F1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PlotlyChart
          title="Transmitted Power Breakdown (Pie Chart)"
          subtitle={`P_t = ${pwr.Pt.toFixed(3)} W across R = ${params.loadResistance} Ω`}
          data={[
            {
              labels: ['Carrier Power (Pc)', 'Upper Sideband (PUSB)', 'Lower Sideband (PLSB)'],
              values: [pwr.Pc, pwr.PUSB, pwr.PLSB],
              type: 'pie',
              hole: 0.45,
              textinfo: 'label+percent',
              marker: {
                colors: ['#A78BFA', '#F472B6', '#22D3EE'],
              },
            },
          ]}
          height={310}
          isDark={isDark}
          exportFileName="amlab-power-pie"
          layout={{
            hovermode: 'closest',
            xaxis: { visible: false },
            yaxis: { visible: false },
          }}
        />

        <PlotlyChart
          title="Efficiency η(%) & Total Power P_t vs Modulation Index μ"
          subtitle="Vertical marker indicates current μ; max distortion-free efficiency is 33.33% at μ = 1"
          data={[
            {
              x: sweep.muVals,
              y: sweep.etaVals,
              type: 'scatter',
              mode: 'lines',
              name: 'Efficiency η (%)',
              line: { color: '#34D399', width: 2.5 },
            },
            {
              x: [mod.mu],
              y: [pwr.efficiencyPercent],
              type: 'scatter',
              mode: 'markers',
              name: 'Current Operating Point',
              marker: { color: '#FBBF24', size: 11 },
            },
            {
              x: [1],
              y: [33.333],
              type: 'scatter',
              mode: 'markers',
              name: '100% Mod Limit (33.33%)',
              marker: { color: '#F87171', size: 10, symbol: 'diamond' },
            },
          ]}
          height={310}
          isDark={isDark}
          exportFileName="amlab-efficiency-curve"
          layout={{
            xaxis: { title: { text: 'Modulation Index μ' } },
            yaxis: { title: { text: 'Transmission Efficiency η (%)' }, range: [0, 60] },
          }}
        />
      </div>

      <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 grid grid-cols-1 md:grid-cols-2 gap-5 items-center text-xs text-[#5B6B86] dark:text-[#8FA3C2]">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
            Why Conventional AM Wastes Most Power in the Carrier
          </h3>
          <p>
            The carrier term <MathTex latex="A_c \cos(2\pi f_c t)" /> carries zero message information—it stays identical whether you transmit silence or music. Its sole purpose is maintaining a non-negative envelope so receivers can use a cheap diode envelope detector instead of a phase-locked coherent oscillator.
          </p>
        </div>
        <div className="p-3.5 rounded-lg bg-[#F5F7FB] dark:bg-[#0B1220] border border-[#DDE3EE] dark:border-[#24324F]">
          <MathTex
            block
            latex={`P_c = \\frac{${params.Ac}^2}{2(${params.loadResistance})} = ${pwr.Pc.toFixed(3)}\\text{ W}, \\quad P_t = ${pwr.Pc.toFixed(3)}\\left(1 + \\frac{${mod.mu.toFixed(2)}^2}{2}\\right) = ${pwr.Pt.toFixed(3)}\\text{ W}`}
          />
        </div>
      </div>
    </div>
  );
};

interface DemodProps {
  params: AMParameters;
  setParams: React.Dispatch<React.SetStateAction<AMParameters>>;
  mod: AMModulationResult;
  isDark: boolean;
}

export const DemodulationView: React.FC<DemodProps> = ({
  params,
  setParams,
  mod,
  isDark,
}) => {
  const [activeMethod, setActiveMethod] = useState<'envelope' | 'coherent'>('envelope');
  // Default optimal RC = sqrt(1/(fc*fm))
  const defaultRcUs = Math.round(Math.sqrt((1 / params.fc) * (1 / params.fm)) * 1e6);
  const [rcUs, setRcUs] = useState<number>(defaultRcUs || 45);
  const [phaseDeg, setPhaseDeg] = useState<number>(0);

  const envRes = useMemo(
    () =>
      simulateEnvelopeDetector(
        mod.s,
        mod.m.samples,
        params.Ac,
        params.ka,
        params.fc,
        params.fm,
        rcUs * 1e-6,
        params.Fs,
        mod.mu
      ),
    [mod, params, rcUs]
  );

  const cohRes = useMemo(
    () =>
      simulateCoherentDetector(
        mod.t,
        mod.s,
        mod.m.samples,
        params.Ac,
        params.ka,
        params.fc,
        params.fm,
        phaseDeg,
        params.Fs
      ),
    [mod, params, phaseDeg]
  );

  const tMs = mod.t.map((v) => v * 1000);
  const tcUs = envRes.rcRecommendedMin * 1e6;
  const tmUs = envRes.rcRecommendedMax * 1e6;
  const optUs = envRes.rcOptimal * 1e6;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
              AM Demodulation Laboratory
            </h2>
            <p className="text-xs text-[#5B6B86] dark:text-[#8FA3C2]">
              Demodulation recovers the original baseband message m(t) from the modulated carrier s(t).
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#F5F7FB] dark:bg-[#0B1220] border border-[#DDE3EE] dark:border-[#24324F]">
            <button
              type="button"
              onClick={() => setActiveMethod('envelope')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer whitespace-nowrap shrink-0 ${
                activeMethod === 'envelope'
                  ? 'bg-[#6366F1] text-white'
                  : 'text-[#5B6B86] dark:text-[#8FA3C2]'
              }`}
            >
              A. Diode-RC Envelope Detector
            </button>
            <button
              type="button"
              onClick={() => setActiveMethod('coherent')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer whitespace-nowrap shrink-0 ${
                activeMethod === 'coherent'
                  ? 'bg-[#6366F1] text-white'
                  : 'text-[#5B6B86] dark:text-[#8FA3C2]'
              }`}
            >
              B. Coherent Synchronous Detector
            </button>
          </div>
        </div>

        {/* Shared Modulation Index Slider for Testing Overmodulation Impact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <SliderControl
            label="Modulation Index μ"
            value={mod.mu}
            min={0.1}
            max={1.6}
            step={0.05}
            accentColor="#34D399"
            onChange={(mu) =>
              setParams((p) => ({
                ...p,
                ka: Number((mu / Math.max(0.05, p.Am)).toFixed(4)),
              }))
            }
          />
          <SliderControl
            label="Carrier Freq f_c"
            value={params.fc / 1000}
            min={40}
            max={250}
            step={5}
            unit="kHz"
            accentColor="#A78BFA"
            onChange={(v) => setParams((p) => ({ ...p, fc: v * 1000 }))}
          />
          <SliderControl
            label="Message Freq f_m"
            value={params.fm / 1000}
            min={1}
            max={20}
            step={0.5}
            unit="kHz"
            accentColor="#22D3EE"
            onChange={(v) => setParams((p) => ({ ...p, fm: v * 1000 }))}
          />
        </div>
      </div>

      {activeMethod === 'envelope' ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
                  Idealized Diode-RC Envelope Detector Controls
                </h3>
                <p className="text-xs text-[#5B6B86] dark:text-[#8FA3C2]">
                  Design trade-off: <MathTex latex="\frac{1}{f_c} \ll RC \ll \frac{1}{f_m}" /> →{' '}
                  <span className="font-mono">
                    {tcUs.toFixed(1)} μs ≪ {rcUs} μs ≪ {tmUs.toFixed(1)} μs
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRcUs(Math.max(2, Math.round(tcUs * 1.1)))}
                  className="px-2.5 py-1 rounded-md text-xs border border-[#DDE3EE] dark:border-[#24324F] hover:border-[#F87171] cursor-pointer"
                >
                  Very Small RC (Ripple)
                </button>
                <button
                  type="button"
                  onClick={() => setRcUs(Math.round(optUs))}
                  className="px-2.5 py-1 rounded-md text-xs border border-[#DDE3EE] dark:border-[#24324F] hover:border-[#34D399] cursor-pointer"
                >
                  Suitable RC ({Math.round(optUs)} μs)
                </button>
                <button
                  type="button"
                  onClick={() => setRcUs(Math.round(tmUs * 1.5))}
                  className="px-2.5 py-1 rounded-md text-xs border border-[#DDE3EE] dark:border-[#24324F] hover:border-[#FBBF24] cursor-pointer"
                >
                  Very Large RC (Diag. Clipping)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              <div className="lg:col-span-6">
                <SliderControl
                  label="RC Time Constant"
                  value={rcUs}
                  min={2}
                  max={400}
                  step={2}
                  unit="μs"
                  accentColor="#FBBF24"
                  onChange={setRcUs}
                />
              </div>
              <div className="lg:col-span-6 flex items-start gap-2.5 p-3 rounded-lg bg-[#F5F7FB] dark:bg-[#0B1220] border border-[#DDE3EE] dark:border-[#24324F] text-xs">
                {envRes.regime === 'optimal' ? (
                  <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-[#F87171] shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
                    {envRes.regime === 'optimal' &&
                      `Optimal Envelope Tracking (NRMSE ${(envRes.rmseNormalized * 100).toFixed(1)}%)`}
                    {envRes.regime === 'excessive-ripple' &&
                      `Excessive Carrier Ripple (RC too small · NRMSE ${(envRes.rmseNormalized * 100).toFixed(1)}%)`}
                    {envRes.regime === 'diagonal-clipping' &&
                      `Diagonal Clipping Distortion (RC too large · NRMSE ${(envRes.rmseNormalized * 100).toFixed(1)}%)`}
                    {envRes.regime === 'overmodulated-distortion' &&
                      `Overmodulation Distortion (μ = ${mod.mu.toFixed(2)} > 1 · Envelope Folds Upward)`}
                  </div>
                  <p className="text-[#5B6B86] dark:text-[#8FA3C2] mt-0.5">
                    {envRes.regime === 'optimal' &&
                      'RC is long enough to hold charge between carrier cycles yet short enough to follow downward envelope slopes.'}
                    {envRes.regime === 'excessive-ripple' &&
                      'Capacitor discharges too quickly between carrier peaks, leaving high-frequency sawtooth ripple on the recovered signal.'}
                    {envRes.regime === 'diagonal-clipping' &&
                      'Capacitor discharges too slowly to track steep falling slopes of the envelope, clipping the trough.'}
                    {envRes.regime === 'overmodulated-distortion' &&
                      'Because the diode rectifies |envelope|, negative excursions of 1 + ka·m(t) fold upward, introducing severe distortion.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <PlotlyChart
              title="1. Rectified AM & Diode-RC Capacitor Envelope"
              subtitle="Ideal diode conducts on positive peaks; RC discharges exponentially"
              data={[
                {
                  x: tMs,
                  y: mod.s,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'AM Input s(t)',
                  line: { color: '#34D399', width: 1 },
                  opacity: 0.45,
                },
                {
                  x: tMs,
                  y: envRes.rectified,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'Half-Wave Rectified',
                  line: { color: '#A78BFA', width: 1.2 },
                },
                {
                  x: tMs,
                  y: envRes.envelope,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'RC Capacitor Envelope',
                  line: { color: '#FBBF24', width: 2.3 },
                },
              ]}
              height={290}
              isDark={isDark}
              exportFileName="amlab-envelope-detector-rc"
              layout={{
                xaxis: { title: { text: 'Time (ms)' } },
                yaxis: { title: { text: 'Voltage (V)' } },
              }}
            />

            <PlotlyChart
              title="2. Recovered Message (After DC Removal) vs Original m(t)"
              subtitle={`DC Offset Removed: ${envRes.dcLevel.toFixed(2)} V · NRMSE: ${(envRes.rmseNormalized * 100).toFixed(2)}%`}
              data={[
                {
                  x: tMs,
                  y: mod.m.samples,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'Original m(t)',
                  line: { color: '#22D3EE', width: 2.2, dash: 'dash' },
                },
                {
                  x: tMs,
                  y: envRes.recoveredMessage,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'Recovered Message',
                  line: { color: '#34D399', width: 2 },
                },
              ]}
              height={290}
              isDark={isDark}
              exportFileName="amlab-envelope-recovered"
              layout={{
                xaxis: { title: { text: 'Time (ms)' } },
                yaxis: { title: { text: 'Amplitude (V)' } },
              }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
                  Coherent (Synchronous) Detection &amp; Phase Mismatch
                </h3>
                <p className="text-xs text-[#5B6B86] dark:text-[#8FA3C2]">
                  Recovered amplitude scales by <MathTex latex="\cos(\Delta\phi)" />. At <MathTex latex="\Delta\phi = \pm 90^\circ" />, output drops to zero (quadrature null).
                </p>
              </div>
              <div className="flex items-center gap-2">
                {[0, 45, 90, 180].map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => setPhaseDeg(deg)}
                    className="px-2.5 py-1 rounded-md text-xs font-mono border border-[#DDE3EE] dark:border-[#24324F] hover:border-[#6366F1] cursor-pointer"
                  >
                    Δφ = {deg}°
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              <div className="lg:col-span-6">
                <SliderControl
                  label="Local Oscillator Phase Mismatch Δφ"
                  value={phaseDeg}
                  min={-180}
                  max={180}
                  step={5}
                  unit="deg"
                  accentColor="#A78BFA"
                  onChange={setPhaseDeg}
                />
              </div>
              <div className="lg:col-span-6 grid grid-cols-2 gap-3">
                <MetricReadout
                  label="Phase Scale cos(Δφ)"
                  value={cohRes.phaseScaleFactor.toFixed(4)}
                  accentHex={Math.abs(cohRes.phaseScaleFactor) < 0.1 ? '#F87171' : '#34D399'}
                />
                <MetricReadout
                  label="Sync Recovery NRMSE"
                  value={(cohRes.rmseNormalized * 100).toFixed(2)}
                  unit="%"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <PlotlyChart
              title="1. Product Signal s(t) × 2cos(2πf_c t + Δφ) & LPF Output"
              subtitle="Windowed-sinc LPF removes the 2f_c double-frequency component"
              data={[
                {
                  x: tMs,
                  y: cohRes.productSignal,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'Mixer Product',
                  line: { color: '#A78BFA', width: 1 },
                  opacity: 0.5,
                },
                {
                  x: tMs,
                  y: cohRes.lpfOutput,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'LPF Output',
                  line: { color: '#FBBF24', width: 2.3 },
                },
              ]}
              height={290}
              isDark={isDark}
              exportFileName="amlab-coherent-product-lpf"
              layout={{
                xaxis: { title: { text: 'Time (ms)' } },
                yaxis: { title: { text: 'Voltage (V)' } },
              }}
            />

            <PlotlyChart
              title="2. Coherently Recovered Message vs Original m(t)"
              subtitle={`Works even when μ > 1, provided Δφ ≈ 0° (currently Δφ = ${phaseDeg}°)`}
              data={[
                {
                  x: tMs,
                  y: mod.m.samples,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'Original m(t)',
                  line: { color: '#22D3EE', width: 2.2, dash: 'dash' },
                },
                {
                  x: tMs,
                  y: cohRes.recoveredMessage,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'Coherent Output',
                  line: { color: '#34D399', width: 2 },
                },
              ]}
              height={290}
              isDark={isDark}
              exportFileName="amlab-coherent-recovered"
              layout={{
                xaxis: { title: { text: 'Time (ms)' } },
                yaxis: { title: { text: 'Amplitude (V)' } },
              }}
            />
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#6366F1]" />
          <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
            Envelope Detection vs Coherent Detection
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#DDE3EE] dark:border-[#24324F] text-[#5B6B86] dark:text-[#8FA3C2]">
                <th className="py-2 pr-4">Criterion</th>
                <th className="py-2 pr-4">Envelope Detector</th>
                <th className="py-2">Coherent (Synchronous) Detector</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE3EE] dark:divide-[#24324F]">
              <tr>
                <td className="py-2 pr-4 font-semibold">Hardware Complexity</td>
                <td className="py-2 pr-4">Very simple (1 diode + R + C)</td>
                <td className="py-2">Complex (Carrier recovery / PLL + multiplier + LPF)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-semibold">Modulation Depth Limit</td>
                <td className="py-2 pr-4">Requires μ ≤ 1 (distorts on overmodulation)</td>
                <td className="py-2">Works for any μ (even μ &gt; 1 or DSB-SC)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-semibold">Phase Sensitivity</td>
                <td className="py-2 pr-4">Phase-insensitive (no local oscillator needed)</td>
                <td className="py-2">Sensitive to phase error (scales by cos Δφ; null at 90°)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
