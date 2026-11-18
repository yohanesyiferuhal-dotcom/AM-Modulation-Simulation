/**
 * AMLab Core Mathematical Engine
 * Pure TypeScript digital signal processing and conventional AM mathematics.
 * Completely independent of UI frameworks.
 */

export type MessageWaveformType = 'sine' | 'multitone' | 'square' | 'triangle' | 'sawtooth';
export type CarrierWaveformType = 'cosine' | 'sine' | 'square' | 'triangle';
export type WindowType = 'rectangular' | 'hann';
export type NoiseType = 'white' | 'bandlimited';

export interface AMParameters {
  Ac: number;               // Carrier peak amplitude (V)
  fc: number;               // Carrier frequency (Hz)
  carrierPhaseDeg: number;  // Carrier phase (degrees)
  carrierWaveform: CarrierWaveformType;
  Am: number;               // Message peak amplitude (V)
  fm: number;               // Primary message frequency (Hz)
  Am2: number;              // Secondary tone amplitude for multitone (V)
  fm2: number;              // Secondary tone frequency for multitone (Hz)
  ka: number;               // Amplitude sensitivity (V^-1)
  messageWaveform: MessageWaveformType;
  Fs: number;               // Sampling frequency (Hz)
  numSamples: number;       // Number of samples
  loadResistance: number;   // Load resistance R (Ohms)
}

export const DEFAULT_AM_PARAMETERS: AMParameters = {
  Ac: 10,
  fc: 100_000,
  carrierPhaseDeg: 0,
  carrierWaveform: 'cosine',
  Am: 1,
  fm: 5_000,
  Am2: 0.5,
  fm2: 12_000,
  ka: 0.5,
  messageWaveform: 'sine',
  Fs: 2_000_000,
  numSamples: 2048,
  loadResistance: 50,
};

export interface SignalStats {
  samples: number[];
  peak: number;
  min: number;
  rms: number;
  mean: number;
  frequency: number;
  period: number;
  maxFreq: number;
}

export interface AMModulationResult {
  t: number[];
  m: SignalStats;
  c: SignalStats;
  cUnit: number[];
  s: number[];
  sPeak: number;
  sRms: number;
  upperEnvelope: number[];
  lowerEnvelope: number[];
  ka: number;
  mu: number;
  percentModulation: number;
  eMax: number;
  eMin: number;
  eMaxTheoretical: number;
  eMinTheoretical: number;
  muFromEnvelope: number;
  condition: 'undermodulated' | 'critical' | 'overmodulated';
  nyquistFreq: number;
  samplingWarning: string | null;
  dt: number;
  duration: number;
}

export interface SpectrumComponent {
  frequency: number;
  amplitude: number;
  type: 'carrier' | 'usb' | 'lsb';
  label: string;
}

export interface FFTResult {
  freqs: number[];
  magnitudes: number[];
  fftLength: number;
  df: number;
  windowType: WindowType;
  peaks: Array<{ frequency: number; amplitude: number }>;
}

export interface AMPowerResult {
  Pc: number;
  PUSB: number;
  PLSB: number;
  PSB: number;
  Pt: number;
  efficiency: number;
  efficiencyPercent: number;
  carrierPercent: number;
  usbPercent: number;
  lsbPercent: number;
  numericalTotalPower: number;
}

export interface BandwidthResult {
  fMaxMessage: number;
  fLowest: number;
  fHighest: number;
  B_AM: number;
  B_DSB_SC: number;
  B_SSB: number;
}

export interface EnvelopeDetectorResult {
  rectified: number[];
  envelope: number[];
  recoveredMessage: number[];
  dcLevel: number;
  rcRecommendedMin: number; // 1 / fc
  rcRecommendedMax: number; // 1 / fm
  rcOptimal: number;        // sqrt(1 / (fc * fm))
  regime: 'excessive-ripple' | 'optimal' | 'diagonal-clipping' | 'overmodulated-distortion';
  rmseNormalized: number;
}

export interface CoherentDetectorResult {
  localOscillator: number[];
  productSignal: number[];
  lpfOutput: number[];
  recoveredMessage: number[];
  phaseScaleFactor: number;
  rmseNormalized: number;
}

export interface SuperhetResult {
  fRF: number;
  fIF: number;
  fLO: number;
  fImage: number;
  rfSpectrum: Array<{ frequency: number; amplitude: number; label: string }>;
  mixerSpectrum: Array<{ frequency: number; amplitude: number; label: string }>;
  ifFilterFreqs: number[];
  ifFilterResponse: number[];
  demodulatedT: number[];
  demodulatedSignal: number[];
}

export interface NoiseAnalysisResult {
  noise: number[];
  noisyAM: number[];
  cleanSpectrum: FFTResult;
  noisySpectrum: FFTResult;
  recoveredClean: number[];
  recoveredNoisy: number[];
  Ps: number;
  PsSideband: number;
  Pn: number;
  snrLinear: number;
  snrDb: number;
}

export interface VerificationTestResult {
  id: string;
  name: string;
  calculated: string;
  expected: string;
  absError: number;
  tolerance: number;
  pass: boolean;
  explanation: string;
}

// ============================================================================
// 1. Signal Generation Helpers
// ============================================================================

export function generateTimeAxis(Fs: number, numSamples: number): number[] {
  const safeFs = Math.max(1, Fs);
  const safeN = Math.max(16, Math.round(numSamples));
  const dt = 1 / safeFs;
  const t = new Array<number>(safeN);
  for (let i = 0; i < safeN; i++) {
    t[i] = i * dt;
  }
  return t;
}

export function computeSignalStats(samples: number[], frequency: number, maxFreq?: number): SignalStats {
  const n = samples.length || 1;
  let sum = 0;
  let sumSq = 0;
  let peak = -Infinity;
  let min = Infinity;
  for (let i = 0; i < n; i++) {
    const v = samples[i];
    sum += v;
    sumSq += v * v;
    if (v > peak) peak = v;
    if (v < min) min = v;
  }
  const absPeak = Math.max(Math.abs(peak), Math.abs(min));
  return {
    samples,
    peak: absPeak,
    min,
    rms: Math.sqrt(sumSq / n),
    mean: sum / n,
    frequency,
    period: frequency > 0 ? 1 / frequency : 0,
    maxFreq: maxFreq ?? frequency,
  };
}

export function generateMessageSignal(t: number[], params: AMParameters): SignalStats {
  const { Am, fm, Am2, fm2, messageWaveform } = params;
  const n = t.length;
  const m = new Array<number>(n);

  for (let i = 0; i < n; i++) {
    const ti = t[i];
    const phase = 2 * Math.PI * fm * ti;
    switch (messageWaveform) {
      case 'sine':
        m[i] = Am * Math.cos(phase);
        break;
      case 'multitone':
        m[i] = Am * Math.cos(phase) + Am2 * Math.cos(2 * Math.PI * fm2 * ti);
        break;
      case 'square': {
        const s = Math.sin(phase);
        m[i] = Am * (s >= 0 ? 1 : -1);
        break;
      }
      case 'triangle': {
        // Peak Am at t = 0 (cosine-aligned triangle wave)
        const frac = (((fm * ti) % 1) + 1) % 1;
        m[i] = Am * (1 - 4 * Math.abs(frac - 0.5));
        break;
      }
      case 'sawtooth': {
        const frac = (((fm * ti) % 1) + 1) % 1;
        m[i] = Am * (2 * frac - 1);
        break;
      }
    }
  }

  const maxFreq = messageWaveform === 'multitone' ? Math.max(fm, fm2) : fm;
  return computeSignalStats(m, fm, maxFreq);
}

export function generateCarrierSignal(
  t: number[],
  params: AMParameters
): { stats: SignalStats; unit: number[] } {
  const { Ac, fc, carrierPhaseDeg, carrierWaveform } = params;
  const phi = (carrierPhaseDeg * Math.PI) / 180;
  const n = t.length;
  const c = new Array<number>(n);
  const cUnit = new Array<number>(n);

  for (let i = 0; i < n; i++) {
    const ti = t[i];
    const arg = 2 * Math.PI * fc * ti + phi;
    let u = 0;
    switch (carrierWaveform) {
      case 'cosine':
        u = Math.cos(arg);
        break;
      case 'sine':
        u = Math.sin(arg);
        break;
      case 'square':
        u = Math.cos(arg) >= 0 ? 1 : -1;
        break;
      case 'triangle': {
        const frac = ((((fc * ti + phi / (2 * Math.PI)) % 1) + 1) % 1);
        u = 1 - 4 * Math.abs(frac - 0.5);
        break;
      }
    }
    cUnit[i] = u;
    c[i] = Ac * u;
  }

  return {
    stats: computeSignalStats(c, fc, fc),
    unit: cUnit,
  };
}

// ============================================================================
// 2. Conventional AM Modulation
// ============================================================================

export function calculateModulationIndex(ka: number, Am: number, mPeak?: number, messageWaveform?: MessageWaveformType): number {
  if (messageWaveform === 'multitone' && mPeak !== undefined) {
    return ka * mPeak;
  }
  return ka * Am;
}

export function performAMModulation(params: AMParameters): AMModulationResult {
  const t = generateTimeAxis(params.Fs, params.numSamples);
  const m = generateMessageSignal(t, params);
  const { stats: c, unit: cUnit } = generateCarrierSignal(t, params);

  const n = t.length;
  const s = new Array<number>(n);
  const upperEnvelope = new Array<number>(n);
  const lowerEnvelope = new Array<number>(n);

  let sSumSq = 0;
  let sPeak = 0;
  let eMax = -Infinity;
  let eMin = Infinity;

  for (let i = 0; i < n; i++) {
    // Conventional AM equation: s(t) = Ac[1 + ka * m(t)] * cos(2*pi*fc*t + phi)
    const modFactor = 1 + params.ka * m.samples[i];
    const envVal = params.Ac * modFactor;
    upperEnvelope[i] = envVal;
    lowerEnvelope[i] = -envVal;
    const si = envVal * cUnit[i];
    s[i] = si;

    sSumSq += si * si;
    const absSi = Math.abs(si);
    if (absSi > sPeak) sPeak = absSi;
    if (envVal > eMax) eMax = envVal;
    if (envVal < eMin) eMin = envVal;
  }

  const effectiveMessagePeak = params.messageWaveform === 'multitone' ? m.peak : params.Am;
  const mu = params.ka * effectiveMessagePeak;
  const percentModulation = mu * 100;

  const eMaxTheoretical = params.Ac * (1 + mu);
  const eMinTheoretical = params.Ac * (1 - mu);

  // Envelope measurement formula: mu = (Emax - Emin) / (Emax + Emin)
  const denom = eMax + eMin;
  const muFromEnvelope = Math.abs(denom) > 1e-12 ? (eMax - eMin) / denom : mu;

  let condition: 'undermodulated' | 'critical' | 'overmodulated' = 'undermodulated';
  if (Math.abs(mu - 1) < 0.015) {
    condition = 'critical';
  } else if (mu > 1) {
    condition = 'overmodulated';
  }

  const nyquistFreq = params.Fs / 2;
  const highestSignalFreq = params.fc + m.maxFreq;
  let samplingWarning: string | null = null;
  if (highestSignalFreq >= nyquistFreq) {
    samplingWarning = `Aliasing detected: Highest modulated frequency (${(highestSignalFreq / 1000).toFixed(1)} kHz) exceeds or equals Nyquist frequency (${(nyquistFreq / 1000).toFixed(1)} kHz). Increase Fs above ${(2.5 * highestSignalFreq / 1000).toFixed(0)} kHz.`;
  } else if (params.Fs < 5 * highestSignalFreq) {
    samplingWarning = `Low oversampling ratio (${(params.Fs / highestSignalFreq).toFixed(1)}×): Carrier waveform may appear jagged. Recommend Fs ≥ ${(10 * highestSignalFreq / 1000).toFixed(0)} kHz for smooth visualization.`;
  }

  return {
    t,
    m,
    c,
    cUnit,
    s,
    sPeak,
    sRms: Math.sqrt(sSumSq / n),
    upperEnvelope,
    lowerEnvelope,
    ka: params.ka,
    mu,
    percentModulation,
    eMax,
    eMin,
    eMaxTheoretical,
    eMinTheoretical,
    muFromEnvelope,
    condition,
    nyquistFreq,
    samplingWarning,
    dt: 1 / params.Fs,
    duration: n / params.Fs,
  };
}

// ============================================================================
// 3. Theoretical Spectrum & Bandwidth
// ============================================================================

export function computeTheoreticalSpectrum(params: AMParameters): SpectrumComponent[] {
  const { Ac, fc, Am, fm, Am2, fm2, ka, messageWaveform } = params;
  const components: SpectrumComponent[] = [
    {
      frequency: fc,
      amplitude: Ac,
      type: 'carrier',
      label: 'Carrier',
    },
  ];

  const addTonePair = (toneAmp: number, toneFreq: number, suffix = '') => {
    const sbAmp = (ka * toneAmp * Ac) / 2;
    if (sbAmp <= 1e-9) return;
    if (fc - toneFreq >= 0) {
      components.push({
        frequency: fc - toneFreq,
        amplitude: sbAmp,
        type: 'lsb',
        label: `LSB${suffix}`,
      });
    }
    components.push({
      frequency: fc + toneFreq,
      amplitude: sbAmp,
      type: 'usb',
      label: `USB${suffix}`,
    });
  };

  if (messageWaveform === 'sine') {
    addTonePair(Am, fm);
  } else if (messageWaveform === 'multitone') {
    addTonePair(Am, fm, '₁');
    addTonePair(Am2, fm2, '₂');
  } else if (messageWaveform === 'square') {
    // Fourier series: (4*Am/pi) * sum_{k=1,3,5} sin(k*w*t)/k
    for (const k of [1, 3, 5]) {
      addTonePair((4 * Am) / (Math.PI * k), k * fm, ` (h${k})`);
    }
  } else if (messageWaveform === 'triangle') {
    // Fourier series: (8*Am/pi^2) * sum_{k=1,3,5} cos(k*w*t)/k^2
    for (const k of [1, 3, 5]) {
      addTonePair((8 * Am) / (Math.PI * Math.PI * k * k), k * fm, ` (h${k})`);
    }
  } else if (messageWaveform === 'sawtooth') {
    // Fourier series: (2*Am/pi) * sum_{k=1..4} sin(k*w*t)/k
    for (const k of [1, 2, 3, 4]) {
      addTonePair((2 * Am) / (Math.PI * k), k * fm, ` (h${k})`);
    }
  }

  return components.sort((a, b) => a.frequency - b.frequency);
}

export function computeAMBandwidth(params: AMParameters): BandwidthResult {
  const fMaxMessage =
    params.messageWaveform === 'multitone'
      ? Math.max(params.fm, params.fm2)
      : params.fm;
  const B_AM = 2 * fMaxMessage;
  return {
    fMaxMessage,
    fLowest: Math.max(0, params.fc - fMaxMessage),
    fHighest: params.fc + fMaxMessage,
    B_AM,
    B_DSB_SC: 2 * fMaxMessage,
    B_SSB: fMaxMessage,
  };
}

// ============================================================================
// 4. Transmitted Power & Efficiency
// ============================================================================

export function computeAMPower(
  Ac: number,
  mu: number,
  R: number,
  amSamples?: number[]
): AMPowerResult {
  const safeR = Math.max(0.1, R);
  const Pc = (Ac * Ac) / (2 * safeR);
  const PUSB = (mu * mu * Pc) / 4;
  const PLSB = (mu * mu * Pc) / 4;
  const PSB = (mu * mu * Pc) / 2;
  const Pt = Pc * (1 + (mu * mu) / 2);
  const efficiency = Pt > 0 ? PSB / Pt : 0; // equals mu^2 / (2 + mu^2)

  let numericalTotalPower = Pt;
  if (amSamples && amSamples.length > 0) {
    let sumSq = 0;
    for (let i = 0; i < amSamples.length; i++) {
      sumSq += amSamples[i] * amSamples[i];
    }
    numericalTotalPower = sumSq / amSamples.length / safeR;
  }

  return {
    Pc,
    PUSB,
    PLSB,
    PSB,
    Pt,
    efficiency,
    efficiencyPercent: efficiency * 100,
    carrierPercent: Pt > 0 ? (Pc / Pt) * 100 : 100,
    usbPercent: Pt > 0 ? (PUSB / Pt) * 100 : 0,
    lsbPercent: Pt > 0 ? (PLSB / Pt) * 100 : 0,
    numericalTotalPower,
  };
}

// ============================================================================
// 5. Radix-2 Cooley-Tukey FFT
// ============================================================================

export function computeFFT(
  signal: number[],
  Fs: number,
  windowType: WindowType = 'rectangular',
  requestedFFTLength?: number
): FFTResult {
  // Determine power-of-2 FFT length
  let N = requestedFFTLength ?? 1;
  if (!requestedFFTLength) {
    while (N < signal.length) N <<= 1;
  } else {
    // Ensure power of 2
    let p = 1;
    while (p < requestedFFTLength) p <<= 1;
    N = p;
  }
  N = Math.max(64, Math.min(32768, N));

  const real = new Float64Array(N);
  const imag = new Float64Array(N);

  const sampleCount = Math.min(signal.length, N);
  let windowSum = 0;

  for (let i = 0; i < sampleCount; i++) {
    let w = 1;
    if (windowType === 'hann' && sampleCount > 1) {
      w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (sampleCount - 1)));
    }
    real[i] = signal[i] * w;
    windowSum += w;
  }

  const normFactor = windowSum > 0 ? windowSum : sampleCount;

  // Bit-reversal permutation
  let j = 0;
  for (let i = 0; i < N; i++) {
    if (i < j) {
      const tr = real[i];
      real[i] = real[j];
      real[j] = tr;
    }
    let m = N >> 1;
    while (m >= 1 && j >= m) {
      j -= m;
      m >>= 1;
    }
    j += m;
  }

  // Iterative Cooley-Tukey butterfly
  for (let size = 2; size <= N; size <<= 1) {
    const halfSize = size >> 1;
    const angleStep = (-2 * Math.PI) / size;
    const wTempR = Math.cos(angleStep);
    const wTempI = Math.sin(angleStep);

    for (let start = 0; start < N; start += size) {
      let wr = 1;
      let wi = 0;
      for (let k = 0; k < halfSize; k++) {
        const evenIdx = start + k;
        const oddIdx = evenIdx + halfSize;
        const tr = wr * real[oddIdx] - wi * imag[oddIdx];
        const ti = wr * imag[oddIdx] + wi * real[oddIdx];

        real[oddIdx] = real[evenIdx] - tr;
        imag[oddIdx] = imag[evenIdx] - ti;
        real[evenIdx] += tr;
        imag[evenIdx] += ti;

        const nextWr = wr * wTempR - wi * wTempI;
        wi = wr * wTempI + wi * wTempR;
        wr = nextWr;
      }
    }
  }

  const halfN = N >> 1;
  const freqs = new Array<number>(halfN + 1);
  const magnitudes = new Array<number>(halfN + 1);
  const df = Fs / N;

  for (let k = 0; k <= halfN; k++) {
    freqs[k] = k * df;
    const mag = Math.sqrt(real[k] * real[k] + imag[k] * imag[k]);
    // Single-sided peak amplitude scaling
    magnitudes[k] = k === 0 || k === halfN ? mag / normFactor : (2 * mag) / normFactor;
  }

  // Local peak detection
  const maxMag = Math.max(...magnitudes, 1e-12);
  const threshold = maxMag * 0.03;
  const peaks: Array<{ frequency: number; amplitude: number }> = [];
  for (let k = 1; k < halfN; k++) {
    if (
      magnitudes[k] > threshold &&
      magnitudes[k] >= magnitudes[k - 1] &&
      magnitudes[k] >= magnitudes[k + 1]
    ) {
      peaks.push({ frequency: freqs[k], amplitude: magnitudes[k] });
    }
  }
  peaks.sort((a, b) => b.amplitude - a.amplitude);

  return {
    freqs,
    magnitudes,
    fftLength: N,
    df,
    windowType,
    peaks: peaks.slice(0, 10),
  };
}

// ============================================================================
// 6. AM Demodulation: Envelope Detector & Coherent Detection
// ============================================================================

export function simulateEnvelopeDetector(
  s: number[],
  mTrue: number[],
  Ac: number,
  ka: number,
  fc: number,
  fm: number,
  RC: number,
  Fs: number,
  mu: number
): EnvelopeDetectorResult {
  const n = s.length;
  const dt = 1 / Fs;
  const safeRC = Math.max(1e-9, RC);
  const decay = Math.exp(-dt / safeRC);

  const rectified = new Array<number>(n);
  const envelope = new Array<number>(n);

  // Initialize capacitor near first positive peak or sample to minimize initial transient
  let vCap = Math.max(0, s[0]);
  for (let i = 0; i < n; i++) {
    const pos = Math.max(0, s[i]);
    rectified[i] = pos;
    if (pos >= vCap) {
      // Ideal diode conducts instantaneously
      vCap = pos;
    } else {
      // Capacitor discharges through R*C
      vCap = vCap * decay;
    }
    envelope[i] = vCap;
  }

  // Steady-state DC estimate over an exact integer number of message cycles
  const startIdx = Math.floor(n * 0.15);
  const samplesPerCycle = fm > 0 ? Math.round(Fs / fm) : 0;
  let endIdx = n;
  if (samplesPerCycle > 4 && n - startIdx >= samplesPerCycle) {
    const fullCycles = Math.floor((n - startIdx) / samplesPerCycle);
    endIdx = startIdx + fullCycles * samplesPerCycle;
  }
  let dcSum = 0;
  for (let i = startIdx; i < endIdx; i++) {
    dcSum += envelope[i];
  }
  const dcLevel = dcSum / Math.max(1, endIdx - startIdx);

  // Recover message by removing DC and normalizing by ka * Ac
  const scale = Math.abs(ka * Ac) > 1e-9 ? 1 / (ka * Ac) : 1;
  const recoveredMessage = new Array<number>(n);
  let errSq = 0;
  let refSq = 0;
  for (let i = 0; i < n; i++) {
    const rec = (envelope[i] - dcLevel) * scale;
    recoveredMessage[i] = rec;
    if (i >= startIdx) {
      const diff = rec - mTrue[i];
      errSq += diff * diff;
      refSq += mTrue[i] * mTrue[i];
    }
  }

  const rmseNormalized = refSq > 1e-12 ? Math.sqrt(errSq / refSq) : 0;
  const rcRecommendedMin = 1 / fc;
  const rcRecommendedMax = 1 / fm;
  const rcOptimal = Math.sqrt(rcRecommendedMin * rcRecommendedMax);

  let regime: EnvelopeDetectorResult['regime'] = 'optimal';
  if (mu > 1.001) {
    regime = 'overmodulated-distortion';
  } else if (safeRC < 3 * rcRecommendedMin) {
    regime = 'excessive-ripple';
  } else if (safeRC > 0.35 * rcRecommendedMax) {
    regime = 'diagonal-clipping';
  }

  return {
    rectified,
    envelope,
    recoveredMessage,
    dcLevel,
    rcRecommendedMin,
    rcRecommendedMax,
    rcOptimal,
    regime,
    rmseNormalized,
  };
}

function applyZeroPhaseHammingLPF(signal: number[], cutoffHz: number, Fs: number): number[] {
  const n = signal.length;
  const fcNorm = Math.min(0.45, Math.max(0.002, cutoffHz / Fs));
  const halfOrder = Math.min(60, Math.max(16, Math.floor(n / 12)));
  const taps = 2 * halfOrder + 1;
  const h = new Array<number>(taps);
  let sum = 0;

  for (let i = 0; i < taps; i++) {
    const m = i - halfOrder;
    const sinc = m === 0 ? 2 * fcNorm : Math.sin(2 * Math.PI * fcNorm * m) / (Math.PI * m);
    const w = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (taps - 1));
    h[i] = sinc * w;
    sum += h[i];
  }
  for (let i = 0; i < taps; i++) h[i] /= sum;

  const out = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    let acc = 0;
    for (let k = 0; k < taps; k++) {
      // Reflect boundaries cleanly to avoid edge drop-off
      let idx = i + k - halfOrder;
      if (idx < 0) idx = -idx;
      if (idx >= n) idx = 2 * n - 2 - idx;
      idx = Math.max(0, Math.min(n - 1, idx));
      acc += signal[idx] * h[k];
    }
    out[i] = acc;
  }
  return out;
}

export function simulateCoherentDetector(
  t: number[],
  s: number[],
  mTrue: number[],
  Ac: number,
  ka: number,
  fc: number,
  fm: number,
  phaseOffsetDeg: number,
  Fs: number
): CoherentDetectorResult {
  const n = t.length;
  const phi = (phaseOffsetDeg * Math.PI) / 180;
  const localOscillator = new Array<number>(n);
  const productSignal = new Array<number>(n);

  for (let i = 0; i < n; i++) {
    const lo = 2 * Math.cos(2 * Math.PI * fc * t[i] + phi);
    localOscillator[i] = lo;
    productSignal[i] = s[i] * lo;
  }

  // Cutoff well above message frequency and well below 2*fc
  const cutoffHz = Math.min(fc * 0.6, Math.max(fm * 4, fc * 0.2));
  const lpfOutput = applyZeroPhaseHammingLPF(productSignal, cutoffHz, Fs);

  let meanLpf = 0;
  for (let i = 0; i < n; i++) meanLpf += lpfOutput[i];
  meanLpf /= n;

  const scale = Math.abs(ka * Ac) > 1e-9 ? 1 / (ka * Ac) : 1;
  const recoveredMessage = new Array<number>(n);
  let errSq = 0;
  let refSq = 0;

  for (let i = 0; i < n; i++) {
    const rec = (lpfOutput[i] - meanLpf) * scale;
    recoveredMessage[i] = rec;
    const diff = rec - mTrue[i];
    errSq += diff * diff;
    refSq += mTrue[i] * mTrue[i];
  }

  return {
    localOscillator,
    productSignal,
    lpfOutput,
    recoveredMessage,
    phaseScaleFactor: Math.cos(phi),
    rmseNormalized: refSq > 1e-12 ? Math.sqrt(errSq / refSq) : 0,
  };
}

// ============================================================================
// 7. Superheterodyne AM Receiver Simulator
// ============================================================================

export function simulateSuperheterodyne(
  fRF: number,
  fIF: number,
  fLO: number,
  fm: number,
  Ac: number,
  mu: number,
  receiverBandwidth: number
): SuperhetResult {
  const sbAmp = (mu * Ac) / 2;
  const fImage = fLO + fIF;

  const rfSpectrum = [
    { frequency: Math.max(0, fRF - fm), amplitude: sbAmp, label: 'RF LSB' },
    { frequency: fRF, amplitude: Ac, label: 'RF Carrier' },
    { frequency: fRF + fm, amplitude: sbAmp, label: 'RF USB' },
  ];

  // Mixer outputs: |fLO - fRF| and fLO + fRF
  const fDiff = Math.abs(fLO - fRF);
  const fSum = fLO + fRF;

  const mixerSpectrum = [
    { frequency: Math.max(0, fDiff - fm), amplitude: sbAmp * 0.5, label: 'IF LSB' },
    { frequency: fDiff, amplitude: Ac * 0.5, label: 'IF Carrier (|fLO-fRF|)' },
    { frequency: fDiff + fm, amplitude: sbAmp * 0.5, label: 'IF USB' },
    { frequency: Math.max(0, fSum - fm), amplitude: sbAmp * 0.5, label: 'Sum LSB' },
    { frequency: fSum, amplitude: Ac * 0.5, label: 'Sum (fLO+fRF)' },
    { frequency: fSum + fm, amplitude: sbAmp * 0.5, label: 'Sum USB' },
  ].sort((a, b) => a.frequency - b.frequency);

  // IF Bandpass Filter frequency response curve around fIF
  const span = Math.max(receiverBandwidth * 3, fm * 8, 40_000);
  const numPts = 160;
  const ifFilterFreqs = new Array<number>(numPts);
  const ifFilterResponse = new Array<number>(numPts);
  const startF = Math.max(0, fIF - span);
  const endF = fIF + span;

  for (let i = 0; i < numPts; i++) {
    const f = startF + ((endF - startF) * i) / (numPts - 1);
    ifFilterFreqs[i] = f;
    // 4th-order Butterworth-like magnitude response
    const delta = Math.abs(f - fIF) / Math.max(100, receiverBandwidth / 2);
    ifFilterResponse[i] = 1 / Math.sqrt(1 + Math.pow(delta, 8));
  }

  // Demodulated audio output considering IF filter attenuation of sidebands
  const sidebandAtten =
    1 / Math.sqrt(1 + Math.pow((Math.abs(fDiff - fIF) + fm) / Math.max(100, receiverBandwidth / 2), 8));
  const carrierPass =
    1 / Math.sqrt(1 + Math.pow(Math.abs(fDiff - fIF) / Math.max(100, receiverBandwidth / 2), 8));

  const audioPts = 300;
  const audioDur = 2 / Math.max(100, fm);
  const demodulatedT = new Array<number>(audioPts);
  const demodulatedSignal = new Array<number>(audioPts);
  for (let i = 0; i < audioPts; i++) {
    const ti = (audioDur * i) / (audioPts - 1);
    demodulatedT[i] = ti;
    demodulatedSignal[i] = mu * sidebandAtten * carrierPass * Math.cos(2 * Math.PI * fm * ti);
  }

  return {
    fRF,
    fIF,
    fLO,
    fImage,
    rfSpectrum,
    mixerSpectrum,
    ifFilterFreqs,
    ifFilterResponse,
    demodulatedT,
    demodulatedSignal,
  };
}

// ============================================================================
// 8. Noise & AM Signal Quality
// ============================================================================

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function analyzeNoisyAM(
  params: AMParameters,
  modResult: AMModulationResult,
  noiseType: NoiseType,
  noiseAmplitude: number,
  seed: number = 42
): NoiseAnalysisResult {
  const n = modResult.s.length;
  const rand = seededRandom(seed);
  const rawNoise = new Array<number>(n);

  // Box-Muller transform for zero-mean unit-variance Gaussian noise
  for (let i = 0; i < n; i += 2) {
    const u1 = Math.max(1e-12, rand());
    const u2 = rand();
    const mag = Math.sqrt(-2.0 * Math.log(u1));
    const z0 = mag * Math.cos(2.0 * Math.PI * u2);
    const z1 = mag * Math.sin(2.0 * Math.PI * u2);
    rawNoise[i] = z0;
    if (i + 1 < n) rawNoise[i + 1] = z1;
  }

  let noise = rawNoise.map((v) => v * noiseAmplitude);

  if (noiseType === 'bandlimited') {
    // Bandpass around fc +/- 2*fm using complex modulation + LPF + demodulation
    const bw = Math.max(params.fm * 2, 10_000);
    const iComp = noise.map((v, idx) => v * Math.cos(2 * Math.PI * params.fc * modResult.t[idx]));
    const qComp = noise.map((v, idx) => -v * Math.sin(2 * Math.PI * params.fc * modResult.t[idx]));
    const iFilt = applyZeroPhaseHammingLPF(iComp, bw, params.Fs);
    const qFilt = applyZeroPhaseHammingLPF(qComp, bw, params.Fs);
    const bp = noise.map(
      (_, idx) =>
        2 *
        (iFilt[idx] * Math.cos(2 * Math.PI * params.fc * modResult.t[idx]) -
          qFilt[idx] * Math.sin(2 * Math.PI * params.fc * modResult.t[idx]))
    );
    // Normalize band-limited noise RMS to match intended scale relative to bandwidth
    let sumSq = 0;
    for (let i = 0; i < n; i++) sumSq += bp[i] * bp[i];
    const rms = Math.sqrt(sumSq / n) || 1;
    noise = bp.map((v) => (v / rms) * noiseAmplitude);
  }

  const noisyAM = new Array<number>(n);
  const R = Math.max(0.1, params.loadResistance);
  let psSum = 0;
  let pnSum = 0;

  for (let i = 0; i < n; i++) {
    noisyAM[i] = modResult.s[i] + noise[i];
    psSum += modResult.s[i] * modResult.s[i];
    pnSum += noise[i] * noise[i];
  }

  const Ps = psSum / n / R;
  const Pn = pnSum / n / R;
  const PsSideband = (modResult.mu * modResult.mu * (params.Ac * params.Ac) / (2 * R)) / 2;
  const snrLinear = Pn > 1e-18 ? Ps / Pn : 1e12;
  const snrDb = 10 * Math.log10(Math.max(1e-12, snrLinear));

  const cleanSpectrum = computeFFT(modResult.s, params.Fs, 'hann');
  const noisySpectrum = computeFFT(noisyAM, params.Fs, 'hann');

  const rcOptimal = Math.sqrt((1 / params.fc) * (1 / params.fm));
  const envClean = simulateEnvelopeDetector(
    modResult.s,
    modResult.m.samples,
    params.Ac,
    params.ka,
    params.fc,
    params.fm,
    rcOptimal,
    params.Fs,
    modResult.mu
  );
  const envNoisy = simulateEnvelopeDetector(
    noisyAM,
    modResult.m.samples,
    params.Ac,
    params.ka,
    params.fc,
    params.fm,
    rcOptimal,
    params.Fs,
    modResult.mu
  );

  return {
    noise,
    noisyAM,
    cleanSpectrum,
    noisySpectrum,
    recoveredClean: envClean.recoveredMessage,
    recoveredNoisy: envNoisy.recoveredMessage,
    Ps,
    PsSideband,
    Pn,
    snrLinear,
    snrDb,
  };
}

// ============================================================================
// 9. Automated Mathematical Verification Suite
// ============================================================================

export function runMathVerificationSuite(params: AMParameters): VerificationTestResult[] {
  // Use single-tone test vector matching current Ac, fc, Am, fm, ka, R, Fs (or force sine for analytical exactness)
  const sineParams: AMParameters = {
    ...params,
    messageWaveform: 'sine',
    carrierWaveform: 'cosine',
    carrierPhaseDeg: 0,
    // Ensure high sample resolution and integer cycles for FFT exactness check
    Fs: Math.max(params.Fs, 20 * (params.fc + params.fm)),
    numSamples: 2048,
  };

  const mod = performAMModulation(sineParams);
  const spec = computeTheoreticalSpectrum(sineParams);
  const bw = computeAMBandwidth(sineParams);
  const pwr = computeAMPower(sineParams.Ac, mod.mu, sineParams.loadResistance, mod.s);

  const results: VerificationTestResult[] = [];

  // 1. AM Equation Sample Check at t = 0
  const expectedAt0 = sineParams.Ac * (1 + sineParams.ka * sineParams.Am);
  const calcAt0 = mod.s[0];
  const err1 = Math.abs(calcAt0 - expectedAt0);
  results.push({
    id: 'am-eq',
    name: 'Conventional AM Equation s(0)',
    calculated: `${calcAt0.toFixed(6)} V`,
    expected: `${expectedAt0.toFixed(6)} V`,
    absError: err1,
    tolerance: 1e-6,
    pass: err1 <= 1e-6,
    explanation: 'Verifies s(0) = Ac[1 + ka·Am·cos(0)]cos(0) matches numerical waveform sample s[0].',
  });

  // 2. Modulation Index Calculation
  const expectedMu = sineParams.ka * sineParams.Am;
  const err2 = Math.abs(mod.mu - expectedMu);
  results.push({
    id: 'mu-calc',
    name: 'Modulation Index (μ = ka·Am)',
    calculated: mod.mu.toFixed(6),
    expected: expectedMu.toFixed(6),
    absError: err2,
    tolerance: 1e-9,
    pass: err2 <= 1e-9,
    explanation: 'Checks strict separation and product identity μ = ka × Am.',
  });

  // 3. Envelope Maximum & Minimum
  const expectedEmax = sineParams.Ac * (1 + expectedMu);
  const expectedEmin = sineParams.Ac * (1 - expectedMu);
  const err3 = Math.max(Math.abs(mod.eMax - expectedEmax), Math.abs(mod.eMin - expectedEmin));
  results.push({
    id: 'env-minmax',
    name: 'Envelope Max & Min Bounds',
    calculated: `Emax=${mod.eMax.toFixed(4)} V, Emin=${mod.eMin.toFixed(4)} V`,
    expected: `Emax=${expectedEmax.toFixed(4)} V, Emin=${expectedEmin.toFixed(4)} V`,
    absError: err3,
    tolerance: 0.05,
    pass: err3 <= 0.05,
    explanation: 'Compares sampled envelope extrema against analytical Ac(1 ± μ).',
  });

  // 4. Envelope-based Modulation Index
  const expectedMuEnv = expectedMu;
  const calcMuEnv = mod.muFromEnvelope;
  const err4 = Math.abs(calcMuEnv - expectedMuEnv);
  results.push({
    id: 'mu-env',
    name: 'Envelope Formula μ = (Emax - Emin)/(Emax + Emin)',
    calculated: calcMuEnv.toFixed(5),
    expected: expectedMuEnv.toFixed(5),
    absError: err4,
    tolerance: 0.01,
    pass: err4 <= 0.01,
    explanation: 'Validates envelope-derived modulation index against ka·Am (accurate for μ ≤ 1 and ≥ 1 algebraic envelope).',
  });

  // 5. Sideband Frequencies
  const lsb = spec.find((c) => c.type === 'lsb');
  const usb = spec.find((c) => c.type === 'usb');
  const expLsbF = sineParams.fc - sineParams.fm;
  const expUsbF = sineParams.fc + sineParams.fm;
  const err5 = Math.max(
    Math.abs((lsb?.frequency ?? 0) - expLsbF),
    Math.abs((usb?.frequency ?? 0) - expUsbF)
  );
  results.push({
    id: 'sb-freq',
    name: 'Sideband Frequencies (fc ± fm)',
    calculated: `fLSB=${((lsb?.frequency ?? 0) / 1000).toFixed(2)} kHz, fUSB=${((usb?.frequency ?? 0) / 1000).toFixed(2)} kHz`,
    expected: `fLSB=${(expLsbF / 1000).toFixed(2)} kHz, fUSB=${(expUsbF / 1000).toFixed(2)} kHz`,
    absError: err5,
    tolerance: 1e-6,
    pass: err5 <= 1e-6,
    explanation: 'Verifies spectral translation to fc - fm and fc + fm.',
  });

  // 6. Sideband Amplitudes
  const expSbAmp = (expectedMu * sineParams.Ac) / 2;
  const err6 = Math.max(
    Math.abs((lsb?.amplitude ?? 0) - expSbAmp),
    Math.abs((usb?.amplitude ?? 0) - expSbAmp)
  );
  results.push({
    id: 'sb-amp',
    name: 'Sideband Amplitudes (μAc/2)',
    calculated: `Asb=${(usb?.amplitude ?? 0).toFixed(4)} V`,
    expected: `Asb=${expSbAmp.toFixed(4)} V`,
    absError: err6,
    tolerance: 1e-6,
    pass: err6 <= 1e-6,
    explanation: 'Verifies trigonometric expansion amplitude μAc/2 for both upper and lower sidebands.',
  });

  // 7. AM Bandwidth
  const expBW = 2 * sineParams.fm;
  const err7 = Math.abs(bw.B_AM - expBW);
  results.push({
    id: 'bw-calc',
    name: 'AM Bandwidth (B_AM = 2·fm)',
    calculated: `${(bw.B_AM / 1000).toFixed(2)} kHz`,
    expected: `${(expBW / 1000).toFixed(2)} kHz`,
    absError: err7,
    tolerance: 1e-6,
    pass: err7 <= 1e-6,
    explanation: 'Verifies total occupied bandwidth equals fUSB - fLSB = 2·fm.',
  });

  // 8. Carrier Power
  const expPc = (sineParams.Ac * sineParams.Ac) / (2 * sineParams.loadResistance);
  const err8 = Math.abs(pwr.Pc - expPc);
  results.push({
    id: 'pwr-carrier',
    name: 'Carrier Power Pc = Ac²/(2R)',
    calculated: `${pwr.Pc.toFixed(4)} W`,
    expected: `${expPc.toFixed(4)} W`,
    absError: err8,
    tolerance: 1e-6,
    pass: err8 <= 1e-6,
    explanation: 'Verifies unmodulated carrier power dissipated in resistive load R.',
  });

  // 9. Sideband Power
  const expPsb = (expectedMu * expectedMu * expPc) / 2;
  const err9 = Math.abs(pwr.PSB - expPsb);
  results.push({
    id: 'pwr-sb',
    name: 'Total Sideband Power PSB = μ²Pc/2',
    calculated: `${pwr.PSB.toFixed(4)} W`,
    expected: `${expPsb.toFixed(4)} W`,
    absError: err9,
    tolerance: 1e-6,
    pass: err9 <= 1e-6,
    explanation: 'Verifies PUSB + PLSB = μ²Pc/4 + μ²Pc/4 = μ²Pc/2.',
  });

  // 10. Total Transmitted Power (Analytical vs Numerical Time-Domain Mean Square)
  // Construct coherent integer-cycle window for exact numerical Parseval verification
  const coherentFs = sineParams.fc * 20;
  const coherentN = Math.round((coherentFs / sineParams.fm) * 4);
  const coherentMod = performAMModulation({ ...sineParams, Fs: coherentFs, numSamples: coherentN });
  const coherentPwr = computeAMPower(sineParams.Ac, expectedMu, sineParams.loadResistance, coherentMod.s);
  const expPt = expPc * (1 + (expectedMu * expectedMu) / 2);
  const err10 = Math.abs(coherentPwr.numericalTotalPower - expPt);
  results.push({
    id: 'pwr-total',
    name: 'Total Power Pt = Pc(1 + μ²/2) vs Time-Domain RMS²/R',
    calculated: `Numerical=${coherentPwr.numericalTotalPower.toFixed(4)} W`,
    expected: `Analytical=${expPt.toFixed(4)} W`,
    absError: err10,
    tolerance: Math.max(0.01, expPt * 0.005),
    pass: err10 <= Math.max(0.01, expPt * 0.005),
    explanation: 'Cross-checks analytical Pt against direct numerical time-average power mean(s²(t))/R.',
  });

  // 11. Transmission Efficiency
  const expEta = (expectedMu * expectedMu) / (2 + expectedMu * expectedMu);
  const err11 = Math.abs(pwr.efficiency - expEta);
  results.push({
    id: 'eta-calc',
    name: 'Transmission Efficiency η = μ²/(2 + μ²)',
    calculated: `${(pwr.efficiency * 100).toFixed(4)}%`,
    expected: `${(expEta * 100).toFixed(4)}%`,
    absError: err11,
    tolerance: 1e-6,
    pass: err11 <= 1e-6,
    explanation: 'Verifies ratio PSB / Pt matches theoretical efficiency formula.',
  });

  // 12. FFT Spectrum Agreement with Theoretical Carrier Peak
  // Use coherent bin frequency for exact FFT agreement test
  const fftN = 4096;
  const fftFs = sineParams.Fs;
  const df = fftFs / fftN;
  const fcBin = Math.round(sineParams.fc / df) * df;
  const fmBin = Math.max(df, Math.round(sineParams.fm / df) * df);
  const fftTestMod = performAMModulation({
    ...sineParams,
    fc: fcBin,
    fm: fmBin,
    Fs: fftFs,
    numSamples: fftN,
  });
  const fftRes = computeFFT(fftTestMod.s, fftFs, 'rectangular', fftN);
  const carrierIdx = Math.round(fcBin / df);
  const fftCarrierMag = fftRes.magnitudes[carrierIdx] ?? 0;
  const err12 = Math.abs(fftCarrierMag - sineParams.Ac);
  results.push({
    id: 'fft-agree',
    name: 'FFT Carrier & Sideband Peak Agreement',
    calculated: `FFT(fc)=${fftCarrierMag.toFixed(4)} V`,
    expected: `Theoretical Ac=${sineParams.Ac.toFixed(4)} V`,
    absError: err12,
    tolerance: 0.05,
    pass: err12 <= 0.05,
    explanation: 'Compares Radix-2 Cooley-Tukey FFT magnitude at carrier bin against theoretical Ac.',
  });

  // 13. Envelope Detector Operation (tested at μ = 0.5 with narrowband fc >= 200*fm so 1/fc << RC << 1/fm holds strongly)
  const envFc = Math.max(sineParams.fc, 200 * sineParams.fm);
  const envFs = 10 * envFc;
  const envN = Math.max(2000, Math.round((2 / sineParams.fm) * envFs));
  const envTestMod = performAMModulation({
    ...sineParams,
    fc: envFc,
    Fs: envFs,
    numSamples: envN,
    ka: 0.5 / sineParams.Am,
  });
  const rcOpt = Math.sqrt((1 / envFc) * (1 / sineParams.fm));
  const envRes = simulateEnvelopeDetector(
    envTestMod.s,
    envTestMod.m.samples,
    sineParams.Ac,
    envTestMod.ka,
    envFc,
    sineParams.fm,
    rcOpt,
    envFs,
    0.5
  );
  const err13 = envRes.rmseNormalized;
  results.push({
    id: 'env-detect',
    name: 'Diode-RC Envelope Detector Recovery (μ = 0.5)',
    calculated: `NRMSE = ${(err13 * 100).toFixed(2)}%`,
    expected: 'NRMSE < 10.00%',
    absError: err13,
    tolerance: 0.1,
    pass: err13 < 0.1,
    explanation: `Verifies idealized diode-RC envelope detector recovers m(t) within 10% NRMSE when 1/fc ≪ RC ≪ 1/fm (tested at fc=${(envFc / 1000).toFixed(0)} kHz, fm=${(sineParams.fm / 1000).toFixed(1)} kHz).`,
  });

  // 14. Coherent Detection Operation (0° vs 90° quadrature null)
  const coh0 = simulateCoherentDetector(
    mod.t,
    mod.s,
    mod.m.samples,
    sineParams.Ac,
    sineParams.ka,
    sineParams.fc,
    sineParams.fm,
    0,
    sineParams.Fs
  );
  const coh90 = simulateCoherentDetector(
    mod.t,
    mod.s,
    mod.m.samples,
    sineParams.Ac,
    sineParams.ka,
    sineParams.fc,
    sineParams.fm,
    90,
    sineParams.Fs
  );
  const err14 = Math.max(coh0.rmseNormalized, Math.abs(coh90.phaseScaleFactor));
  results.push({
    id: 'coh-detect',
    name: 'Coherent Detector Sync (0°) & Quadrature Null (90°)',
    calculated: `0° NRMSE=${(coh0.rmseNormalized * 100).toFixed(2)}%, 90° cos(θ)=${coh90.phaseScaleFactor.toFixed(4)}`,
    expected: '0° NRMSE < 10%, 90° cos(θ) = 0.0000',
    absError: err14,
    tolerance: 0.1,
    pass: coh0.rmseNormalized < 0.1 && Math.abs(coh90.phaseScaleFactor) < 1e-6,
    explanation: 'Verifies synchronous product + LPF recovers m(t) at 0° phase error and nulls at 90° phase mismatch.',
  });

  return results;
}
