import { DEFAULT_AM_PARAMETERS, type AMParameters } from '../math/amEngine';

export interface ExplainConcept {
  id: string;
  title: string;
  category: 'Fundamentals' | 'Modulation Depth' | 'Spectrum & Power' | 'Demodulation & Receivers';
  summary: string;
  equation: string;
  symbols: Array<{ symbol: string; meaning: string }>;
  derivation: string[];
  example: string;
  mistakes: string[];
  experimentLabel: string;
  experimentParams: Partial<AMParameters>;
  targetTab?: string;
}

export const EXPLAIN_CONCEPTS: ExplainConcept[] = [
  {
    id: 'what-is-am',
    title: '1. What is Amplitude Modulation?',
    category: 'Fundamentals',
    summary:
      'Amplitude Modulation (AM) is a technique where the instantaneous amplitude of a high-frequency carrier wave is varied linearly in proportion to a low-frequency message signal, while the carrier frequency and phase remain constant.',
    equation: 's(t) = A_c\\left[1 + k_a m(t)\\right]\\cos(2\\pi f_c t)',
    symbols: [
      { symbol: 's(t)', meaning: 'Transmitted conventional AM waveform (V)' },
      { symbol: 'A_c', meaning: 'Unmodulated carrier peak amplitude (V)' },
      { symbol: 'k_a', meaning: 'Amplitude sensitivity of the modulator (V⁻¹)' },
      { symbol: 'm(t)', meaning: 'Baseband message signal (V)' },
      { symbol: 'f_c', meaning: 'Carrier frequency (Hz)' },
    ],
    derivation: [
      'Start with an unmodulated carrier c(t) = Ac cos(2πfct).',
      'Replace its constant amplitude Ac with a time-varying envelope Ac[1 + ka·m(t)].',
      'When m(t) = 0, the envelope equals Ac; positive m(t) expands the envelope and negative m(t) compresses it.',
    ],
    example:
      'An AM radio station at fc = 1000 kHz transmits a 3 kHz voice tone by varying its RF output envelope above and below its unmodulated 10 V carrier level.',
    mistakes: [
      'Confusing AM with changing the carrier frequency—the carrier frequency fc stays constant in AM.',
      'Assuming s(t) equals m(t) + c(t): adding signals only creates linear superposition, not modulation or sidebands.',
    ],
    experimentLabel: 'Load Default 50% AM',
    experimentParams: { ...DEFAULT_AM_PARAMETERS },
    targetTab: 'modulator',
  },
  {
    id: 'why-modulation-necessary',
    title: '2. Why is Modulation Necessary?',
    category: 'Fundamentals',
    summary:
      'Low-frequency baseband signals (speech 300 Hz–3.4 kHz, audio 20 Hz–20 kHz) cannot radiate efficiently through practical antennas and would interfere if broadcast simultaneously. Modulation shifts signals to higher frequency bands.',
    equation: 'L_{\\text{antenna}} \\approx \\frac{\\lambda}{4} = \\frac{c}{4f}',
    symbols: [
      { symbol: 'L', meaning: 'Quarter-wave antenna length (m)' },
      { symbol: '\\lambda', meaning: 'Electromagnetic wavelength (m)' },
      { symbol: 'c', meaning: 'Speed of light ≈ 3 × 10⁸ m/s' },
      { symbol: 'f', meaning: 'Transmission frequency (Hz)' },
    ],
    derivation: [
      'At f = 3 kHz, λ = 3×10⁸ / 3000 = 100 km, requiring a 25 km quarter-wave antenna.',
      'By modulating onto fc = 1 MHz, λ drops to 300 m, making a 75 m tower practical.',
      'Frequency translation also enables Frequency-Division Multiplexing (FDM) so multiple stations coexist without colliding.',
    ],
    example:
      'AM broadcast band stations operate from 535 kHz to 1605 kHz spaced 10 kHz apart so receivers can tune one station at a time.',
    mistakes: [
      'Thinking higher frequency automatically means faster data—it enables practical radiation and channel multiplexing.',
    ],
    experimentLabel: 'Inspect Spectrum Translation',
    experimentParams: { fc: 150_000, fm: 5_000 },
    targetTab: 'spectrum',
  },
  {
    id: 'what-is-carrier',
    title: '3. What is a Carrier Signal?',
    category: 'Fundamentals',
    summary:
      'A carrier signal is a high-frequency sinusoidal wave of constant amplitude, frequency, and phase prior to modulation. It acts as the electromagnetic vehicle that carries baseband information across a channel.',
    equation: 'c(t) = A_c \\cos(2\\pi f_c t + \\phi_c)',
    symbols: [
      { symbol: 'A_c', meaning: 'Carrier peak voltage (V)' },
      { symbol: 'f_c', meaning: 'Carrier frequency (Hz), typically f_c ≫ f_m' },
      { symbol: '\\phi_c', meaning: 'Initial carrier phase (rad)' },
    ],
    derivation: [
      'Because c(t) is purely periodic with no amplitude or phase variation, it contains zero message information.',
      'Its spectrum is a single spectral line at f = fc.',
    ],
    example:
      'With Ac = 10 V and fc = 100 kHz, the carrier oscillates 100,000 times per second between +10 V and −10 V.',
    mistakes: [
      'Believing the carrier component itself carries message information—all message information resides in the sidebands.',
    ],
    experimentLabel: 'View Carrier Generator',
    experimentParams: { Ac: 10, fc: 100_000 },
    targetTab: 'generator',
  },
  {
    id: 'what-is-message',
    title: '4. What is a Message Signal?',
    category: 'Fundamentals',
    summary:
      'The message (modulating) signal m(t) is the low-frequency baseband waveform representing the information to be transmitted, such as voice, music, or sensor telemetry.',
    equation: 'm(t) = A_m \\cos(2\\pi f_m t)',
    symbols: [
      { symbol: 'A_m', meaning: 'Message peak amplitude (V)' },
      { symbol: 'f_m', meaning: 'Message frequency (Hz)' },
    ],
    derivation: [
      'For a single-tone test signal, m(t) is a pure cosine of frequency fm.',
      'Its RMS value is Am / √2 and its period is Tm = 1 / fm.',
    ],
    example:
      'A 5 kHz test tone with Am = 1 V has a period of 200 μs and an RMS voltage of 0.7071 V.',
    mistakes: [
      'Confusing message amplitude Am (in Volts) with dimensionless modulation index μ.',
    ],
    experimentLabel: 'Test Multi-Tone Message',
    experimentParams: { messageWaveform: 'multitone', Am: 1, fm: 5000, Am2: 0.5, fm2: 12000 },
    targetTab: 'generator',
  },
  {
    id: 'carrier-amplitude-change',
    title: '5. How Does the Carrier Amplitude Change?',
    category: 'Fundamentals',
    summary:
      'During modulation, the instantaneous envelope A(t) = Ac[1 + ka·m(t)] scales the carrier peaks symmetrically above and below zero, tracing both an upper and lower boundary.',
    equation: 'E_{\\text{upper}}(t) = A_c[1 + k_a m(t)], \\quad E_{\\text{lower}}(t) = -E_{\\text{upper}}(t)',
    symbols: [
      { symbol: 'E_{\\text{upper}}(t)', meaning: 'Positive envelope boundary (V)' },
      { symbol: 'E_{\\text{lower}}(t)', meaning: 'Negative envelope boundary (V)' },
    ],
    derivation: [
      'Whenever cos(2πfct) = +1, s(t) touches E_upper(t).',
      'Whenever cos(2πfct) = −1, s(t) touches E_lower(t).',
      'Provided 1 + ka·m(t) ≥ 0 for all t, the envelope is an exact scaled copy of m(t) riding on a DC offset Ac.',
    ],
    example:
      'For Ac = 10 V and μ = 0.5, the carrier peaks swing between Emax = 15 V and Emin = 5 V.',
    mistakes: [
      'Thinking only the upper envelope moves—both positive and negative half-cycles expand and contract symmetrically.',
    ],
    experimentLabel: 'Show AM Envelope',
    experimentParams: { Ac: 10, Am: 1, ka: 0.5, messageWaveform: 'sine' },
    targetTab: 'modulator',
  },
  {
    id: 'what-is-conventional-am',
    title: '6. What is Conventional AM (DSB-LC)?',
    category: 'Fundamentals',
    summary:
      'Conventional AM—also called Double-Sideband Large Carrier (DSB-LC)—transmits the full unmodulated carrier alongside both upper and lower sidebands so that inexpensive diode envelope detectors can recover the message.',
    equation: 's(t) = A_c\\cos(2\\pi f_c t) + A_c k_a m(t)\\cos(2\\pi f_c t)',
    symbols: [
      { symbol: 'A_c\\cos(2\\pi f_c t)', meaning: 'Transmitted large carrier term' },
      { symbol: 'A_c k_a m(t)\\cos(2\\pi f_c t)', meaning: 'Information-bearing DSB sideband term' },
    ],
    derivation: [
      'Expanding Ac[1 + ka·m(t)]cos(2πfct) separates the signal into two parts.',
      'The first term is pure carrier (no message); the second is the DSB-SC product term.',
      'Keeping the large carrier guarantees 1 + ka·m(t) ≥ 0 so envelope detection works without a local oscillator.',
    ],
    example:
      'Commercial AM broadcast radio uses conventional AM so millions of simple, low-cost receivers need no carrier synchronization.',
    mistakes: [
      'Thinking conventional AM is the same as DSB-SC (which suppresses the carrier term).',
    ],
    experimentLabel: 'Open AM Modulator',
    experimentParams: { ...DEFAULT_AM_PARAMETERS },
    targetTab: 'modulator',
  },
  {
    id: 'amplitude-sensitivity',
    title: '7. What is Amplitude Sensitivity (kₐ)?',
    category: 'Modulation Depth',
    summary:
      'Amplitude sensitivity ka is a physical hardware parameter of the modulator (measured in V⁻¹) that determines how much fractional change in carrier amplitude occurs per volt of message input.',
    equation: 'k_a = \\frac{\\mu}{A_m} \\quad [\\text{V}^{-1}]',
    symbols: [
      { symbol: 'k_a', meaning: 'Amplitude sensitivity constant (V⁻¹)' },
      { symbol: '\\mu', meaning: 'Dimensionless modulation index' },
      { symbol: 'A_m', meaning: 'Peak message voltage (V)' },
    ],
    derivation: [
      'In s(t) = Ac[1 + ka·m(t)]cos(2πfct), the term ka·m(t) must be dimensionless.',
      'Since m(t) is in Volts, ka must have units of Volts⁻¹ (V⁻¹).',
    ],
    example:
      'If a modulator has ka = 0.5 V⁻¹ and you apply Am = 1 V, μ = 0.5 × 1 = 0.5 (50%). Doubling Am to 2 V raises μ to 1.0 (100%).',
    mistakes: [
      'Treating ka and μ as interchangeable—ka is fixed by the modulator circuit, whereas μ varies with the input message amplitude Am.',
    ],
    experimentLabel: 'Test ka = 0.8 V⁻¹',
    experimentParams: { Am: 1, ka: 0.8 },
    targetTab: 'modulator',
  },
  {
    id: 'modulation-index',
    title: '8. What is Modulation Index (μ)?',
    category: 'Modulation Depth',
    summary:
      'The modulation index μ (dimensionless, often expressed as percentage modulation M = μ × 100%) measures the ratio of peak envelope excursion to the unmodulated carrier amplitude.',
    equation: '\\mu = k_a A_m = \\frac{E_{\\max} - E_{\\min}}{E_{\\max} + E_{\\min}}',
    symbols: [
      { symbol: '\\mu', meaning: 'Modulation index (dimensionless)' },
      { symbol: 'E_{\\max}', meaning: 'Maximum envelope amplitude Ac(1 + μ)' },
      { symbol: 'E_{\\min}', meaning: 'Minimum envelope amplitude Ac(1 − μ)' },
    ],
    derivation: [
      'Add Emax = Ac(1 + μ) and Emin = Ac(1 − μ): Emax + Emin = 2Ac.',
      'Subtract Emin from Emax: Emax − Emin = 2Ac·μ.',
      'Divide the two equations: (Emax − Emin) / (Emax + Emin) = μ.',
    ],
    example:
      'On an oscilloscope, if Emax = 15 V and Emin = 5 V, then μ = (15 − 5)/(15 + 5) = 10/20 = 0.5 (50% modulation).',
    mistakes: [
      'Applying (Emax − Emin)/(Emax + Emin) blindly when overmodulated (μ > 1) using absolute envelope values.',
    ],
    experimentLabel: 'Explore Modulation Index',
    experimentParams: { Am: 1, ka: 0.5 },
    targetTab: 'modulation-index',
  },
  {
    id: 'hundred-percent-mod',
    title: '9. What Does 100% Modulation Mean?',
    category: 'Modulation Depth',
    summary:
      '100% modulation (critical modulation) occurs when μ = 1. At this boundary, the envelope reaches twice the carrier amplitude at its peaks (2Ac) and touches exactly zero at its troughs.',
    equation: '\\mu = 1 \\implies E_{\\max} = 2A_c, \\quad E_{\\min} = 0',
    symbols: [
      { symbol: '\\mu = 1', meaning: 'Critical modulation threshold' },
      { symbol: 'E_{\\min} = 0', meaning: 'Envelope touches zero without crossing' },
    ],
    derivation: [
      'Set μ = 1 in E(t) = Ac[1 + μ cos(2πfmt)].',
      'When cos(2πfmt) = −1, E(t) = Ac(1 − 1) = 0.',
      'This maximizes single-tone sideband power efficiency (33.33%) without causing envelope phase reversal.',
    ],
    example:
      'With Ac = 10 V and μ = 1, the AM signal swings up to ±20 V and pinches cleanly to 0 V at message troughs.',
    mistakes: [
      'Thinking 100% modulation means 100% power efficiency—at μ = 1, only 33.33% of transmitted power is in the sidebands.',
    ],
    experimentLabel: 'Set Critical Modulation (μ = 1)',
    experimentParams: { Am: 2, ka: 0.5 },
    targetTab: 'modulation-index',
  },
  {
    id: 'overmodulation',
    title: '10. What is Overmodulation?',
    category: 'Modulation Depth',
    summary:
      'Overmodulation occurs when μ > 1 (1 + ka·m(t) < 0 during message troughs). The carrier undergoes a 180° phase reversal and the positive envelope folds upward, causing severe distortion in standard envelope detectors.',
    equation: '\\mu > 1 \\implies 1 + k_a m(t) < 0 \\text{ for part of the cycle}',
    symbols: [
      { symbol: '\\mu > 1', meaning: 'Overmodulation condition' },
    ],
    derivation: [
      'When 1 + μ cos(2πfmt) becomes negative, multiplying by cos(2πfct) flips the carrier sign (−cos(2πfct) = cos(2πfct + π)).',
      'A diode envelope detector tracks |Ac[1 + μ cos(2πfmt)]|, rectifying the negative lobe upward and creating harmonic distortion.',
    ],
    example:
      'At μ = 1.5 with Ac = 10 V, the algebraic envelope dips to −5 V, while an envelope detector sees a false +5 V bump.',
    mistakes: [
      'Assuming the transmitter clips at zero—the real AM equation passes smoothly through zero with a 180° carrier phase inversion.',
    ],
    experimentLabel: 'Demonstrate Overmodulation (μ = 1.5)',
    experimentParams: { Am: 3, ka: 0.5 },
    targetTab: 'modulation-index',
  },
  {
    id: 'what-are-sidebands',
    title: '11. What Are Sidebands?',
    category: 'Spectrum & Power',
    summary:
      'Sidebands are new frequency components generated symmetrically above and below the carrier frequency by the nonlinear multiplication of the message and carrier signals.',
    equation: '\\cos A \\cos B = \\frac{1}{2}\\left[\\cos(A + B) + \\cos(A - B)\\right]',
    symbols: [
      { symbol: 'A', meaning: '2π f_c t (carrier phase)' },
      { symbol: 'B', meaning: '2π f_m t (message phase)' },
    ],
    derivation: [
      'Expand s(t) = Ac[1 + μ cos(2πfmt)]cos(2πfct).',
      'Applying the product-to-sum identity gives Ac cos(2πfct) + (μAc/2)cos(2π(fc+fm)t) + (μAc/2)cos(2π(fc−fm)t).',
      'The sum frequency fc + fm is the Upper Sideband (USB) and fc − fm is the Lower Sideband (LSB).',
    ],
    example:
      'For fc = 100 kHz and fm = 5 kHz, the sidebands appear at 95 kHz (LSB) and 105 kHz (USB).',
    mistakes: [
      'Thinking sidebands are already present inside m(t)—they are created strictly by multiplying m(t) with cos(2πfct).',
    ],
    experimentLabel: 'Inspect Sidebands in Spectrum Lab',
    experimentParams: { ...DEFAULT_AM_PARAMETERS },
    targetTab: 'spectrum',
  },
  {
    id: 'carrier-component',
    title: '12. What is the Carrier Component in the Spectrum?',
    category: 'Spectrum & Power',
    summary:
      'In the frequency spectrum of conventional AM, the carrier component is an impulse at f = fc with constant amplitude Ac, completely independent of the message frequency or modulation index.',
    equation: 'S_{\\text{carrier}}(f) = \\frac{A_c}{2}\\left[\\delta(f - f_c) + \\delta(f + f_c)\\right]',
    symbols: [
      { symbol: 'A_c', meaning: 'Single-sided spectral peak amplitude at f_c (V)' },
    ],
    derivation: [
      'Because Ac cos(2πfct) does not depend on m(t), its spectral line at fc stays fixed at amplitude Ac regardless of μ.',
      'Even when m(t) = 0 (silence), the transmitter still radiates full carrier power Pc = Ac²/(2R).',
    ],
    example:
      'In the default experiment (Ac = 10 V, μ = 0.5), the carrier spike at 100 kHz has amplitude 10 V while each sideband is only 2.5 V.',
    mistakes: [
      'Thinking carrier amplitude increases when μ increases—only the sideband amplitudes μAc/2 grow with μ.',
    ],
    experimentLabel: 'View Carrier vs Sidebands',
    experimentParams: { Ac: 10, Am: 1, ka: 0.5 },
    targetTab: 'spectrum',
  },
  {
    id: 'usb-and-lsb',
    title: '13. Upper and Lower Sidebands (USB & LSB)',
    category: 'Spectrum & Power',
    summary:
      'Every baseband frequency component fm produces two mirror-image spectral lines: the Upper Sideband at fc + fm and the Lower Sideband at fc − fm, each with amplitude μAc/2.',
    equation: 'f_{\\text{USB}} = f_c + f_m, \\quad f_{\\text{LSB}} = f_c - f_m, \\quad A_{\\text{sb}} = \\frac{\\mu A_c}{2}',
    symbols: [
      { symbol: 'f_{\\text{USB}}', meaning: 'Upper sideband frequency (Hz)' },
      { symbol: 'f_{\\text{LSB}}', meaning: 'Lower sideband frequency (Hz)' },
      { symbol: 'A_{\\text{sb}}', meaning: 'Amplitude of each sideband (V)' },
    ],
    derivation: [
      'For a multi-tone message m(t) = A1 cos(2πf1t) + A2 cos(2πf2t), linearity produces four sideband lines: fc±f1 and fc±f2.',
      'Both USB and LSB carry identical message information—one is the mirror image of the other.',
    ],
    example:
      'At μ = 1 and Ac = 10 V, each sideband has amplitude 1 × 10 / 2 = 5 V (half the carrier amplitude).',
    mistakes: [
      'Forgetting the factor of 1/2 from cos·cos expansion and setting Asb = μAc.',
    ],
    experimentLabel: 'View Multi-Tone Sidebands',
    experimentParams: { messageWaveform: 'multitone', fm: 5000, fm2: 12000 },
    targetTab: 'spectrum',
  },
  {
    id: 'twice-bandwidth',
    title: '14. Why Does AM Require Twice the Message Bandwidth?',
    category: 'Spectrum & Power',
    summary:
      'Because modulating a baseband spectrum spanning [0, W] shifts it symmetrically both above fc (to [fc, fc+W]) and below fc (to [fc−W, fc]), the total occupied RF bandwidth is 2W.',
    equation: 'B_{\\text{AM}} = f_{\\text{USB,max}} - f_{\\text{LSB,min}} = (f_c + W) - (f_c - W) = 2W',
    symbols: [
      { symbol: 'W', meaning: 'Maximum message frequency f_m(max) (Hz)' },
      { symbol: 'B_{\\text{AM}}', meaning: 'Conventional AM transmission bandwidth (Hz)' },
    ],
    derivation: [
      'Highest frequency transmitted: fc + fm(max).',
      'Lowest frequency transmitted: fc − fm(max).',
      'Bandwidth = Highest − Lowest = 2·fm(max). Note that fc cancels out!',
    ],
    example:
      'A 5 kHz voice/music message requires B_AM = 2 × 5 kHz = 10 kHz of RF spectrum whether fc is 100 kHz or 100 MHz.',
    mistakes: [
      'Including fc in the bandwidth formula or thinking bandwidth is just fm.',
    ],
    experimentLabel: 'Open Bandwidth Lab',
    experimentParams: { fc: 100_000, fm: 5_000 },
    targetTab: 'bandwidth',
  },
  {
    id: 'transmitted-power',
    title: '15. What is Transmitted Power in AM?',
    category: 'Spectrum & Power',
    summary:
      'Total transmitted power Pt is the sum of the unmodulated carrier power Pc and the power in both sidebands (PUSB + PLSB), assuming a resistive load R and sinusoidal message.',
    equation: 'P_t = P_c + P_{\\text{USB}} + P_{\\text{LSB}} = P_c\\left(1 + \\frac{\\mu^2}{2}\\right), \\quad P_c = \\frac{A_c^2}{2R}',
    symbols: [
      { symbol: 'P_c', meaning: 'Carrier power (W)' },
      { symbol: 'P_{\\text{SB}}', meaning: 'Total sideband power = μ²Pc/2 (W)' },
      { symbol: 'P_t', meaning: 'Total transmitted power (W)' },
      { symbol: 'R', meaning: 'Load resistance (Ω)' },
    ],
    derivation: [
      'Carrier RMS voltage is Ac/√2, so Pc = (Ac/√2)²/R = Ac²/(2R).',
      'Each sideband has peak μAc/2, so PUSB = PLSB = (μAc/2)²/(2R) = μ²Pc/4.',
      'Total Pt = Pc + μ²Pc/4 + μ²Pc/4 = Pc(1 + μ²/2).',
    ],
    example:
      'For Ac = 10 V, R = 50 Ω, μ = 0.5: Pc = 100/100 = 1.0 W, PSB = 0.125 W, Pt = 1.125 W.',
    mistakes: [
      'Dividing by R instead of 2R when using peak amplitude Ac instead of RMS voltage.',
    ],
    experimentLabel: 'Inspect Power Breakdown',
    experimentParams: { Ac: 10, Am: 1, ka: 0.5, loadResistance: 50 },
    targetTab: 'power',
  },
  {
    id: 'why-power-inefficient',
    title: '16. Why is Conventional AM Power-Inefficient?',
    category: 'Spectrum & Power',
    summary:
      'Only the sidebands carry message information, yet the large carrier consumes at least two-thirds of total transmitted power even at 100% single-tone modulation.',
    equation: '\\eta = \\frac{P_{\\text{SB}}}{P_t} = \\frac{\\mu^2}{2 + \\mu^2} \\le \\frac{1}{3} = 33.33\\%',
    symbols: [
      { symbol: '\\eta', meaning: 'Power transmission efficiency' },
    ],
    derivation: [
      'Substitute PSB = (μ²/2)Pc and Pt = (1 + μ²/2)Pc.',
      'η = (μ²/2)/(1 + μ²/2) = μ²/(2 + μ²).',
      'At maximum distortion-free single-tone modulation μ = 1, η = 1/(2 + 1) = 33.33%. At μ = 0.5, η is only 11.11%!',
    ],
    example:
      'A 10 kW AM broadcast transmitter operating at μ = 0.5 puts 8.89 kW into the unmodulated carrier and only 1.11 kW into the information sidebands.',
    mistakes: [
      'Assuming η = 50% at μ = 1 (confusing μ²/(2+μ²) with μ/(1+μ)).',
    ],
    experimentLabel: 'Test Efficiency at μ = 1',
    experimentParams: { Am: 2, ka: 0.5 },
    targetTab: 'power',
  },
  {
    id: 'envelope-detection',
    title: '17. What is Envelope Detection?',
    category: 'Demodulation & Receivers',
    summary:
      'An envelope detector uses a diode and an RC low-pass network to trace the positive peaks of the AM signal, followed by a DC-blocking capacitor to recover the baseband message.',
    equation: '\\frac{1}{f_c} \\ll RC \\ll \\frac{1}{f_m}',
    symbols: [
      { symbol: 'RC', meaning: 'Discharge time constant (s)' },
      { symbol: '1/f_c', meaning: 'Carrier period (s)' },
      { symbol: '1/f_m', meaning: 'Message period (s)' },
    ],
    derivation: [
      'When s(t) exceeds capacitor voltage, the diode conducts and charges C to the peak.',
      'Between carrier peaks, the diode turns off and C discharges through R with time constant RC.',
      'If RC is too small, capacitor voltage drops rapidly between carrier peaks (excessive ripple). If RC is too large, it cannot follow steep downward envelope slopes (diagonal clipping).',
    ],
    example:
      'For fc = 100 kHz (1/fc = 10 μs) and fm = 5 kHz (1/fm = 200 μs), geometric mean RC ≈ √(10×200) μs ≈ 44.7 μs gives clean tracking.',
    mistakes: [
      'Using an envelope detector when μ > 1—the rectifier folds negative envelope excursions upward, distorting the audio.',
    ],
    experimentLabel: 'Simulate Envelope Detector',
    experimentParams: { ...DEFAULT_AM_PARAMETERS },
    targetTab: 'demodulation',
  },
  {
    id: 'coherent-detection',
    title: '18. What is Coherent (Synchronous) Detection?',
    category: 'Demodulation & Receivers',
    summary:
      'Coherent detection multiplies the incoming AM signal by a synchronized local oscillator at the exact carrier frequency and phase, then low-pass filters to extract the baseband message.',
    equation: 'v_{\\text{LPF}}(t) = A_c\\left[1 + k_a m(t)\\right]\\cos(\\Delta\\phi)',
    symbols: [
      { symbol: '\\Delta\\phi', meaning: 'Phase mismatch between received carrier and local oscillator (rad)' },
    ],
    derivation: [
      'Multiply s(t) by 2 cos(2πfct + Δφ).',
      'Using 2cos(A)cos(A+Δφ) = cos(Δφ) + cos(2A+Δφ), a high-frequency 2fc term and a baseband term emerge.',
      'The LPF removes the 2fc component, leaving Ac[1 + ka·m(t)]cos(Δφ).',
    ],
    example:
      'If Δφ = 0°, full amplitude is recovered. If Δφ = 60°, recovered amplitude drops by 50%. At Δφ = 90° (quadrature null), the output vanishes completely!',
    mistakes: [
      'Ignoring phase synchronization—a free-running local oscillator with frequency or phase drift causes fading or complete cancellation.',
    ],
    experimentLabel: 'Test Coherent Phase Mismatch',
    experimentParams: { ...DEFAULT_AM_PARAMETERS },
    targetTab: 'demodulation',
  },
  {
    id: 'superheterodyne-receiver',
    title: '19. What is a Superheterodyne Receiver?',
    category: 'Demodulation & Receivers',
    summary:
      'A superheterodyne receiver translates any tuned RF station frequency f_RF down to a fixed Intermediate Frequency (f_IF = 455 kHz for AM radio) using a mixer and tunable local oscillator, allowing high-Q fixed filtering.',
    equation: 'f_{\\text{IF}} = |f_{\\text{LO}} - f_{\\text{RF}}|',
    symbols: [
      { symbol: 'f_{\\text{RF}}', meaning: 'Incoming desired station carrier frequency (Hz)' },
      { symbol: 'f_{\\text{LO}}', meaning: 'Tunable Local Oscillator frequency (Hz)' },
      { symbol: 'f_{\\text{IF}}', meaning: 'Fixed Intermediate Frequency (typically 455 kHz)' },
    ],
    derivation: [
      'High-side injection sets f_LO = f_RF + f_IF.',
      'The mixer outputs sum (f_LO + f_RF) and difference (|f_LO − f_RF| = f_IF) components while preserving modulation sidebands.',
      'A fixed narrowband IF bandpass filter centered at 455 kHz rejects adjacent stations and sum products before envelope detection.',
    ],
    example:
      'To receive an AM station at 1000 kHz with f_IF = 455 kHz, the local oscillator tunes to f_LO = 1455 kHz.',
    mistakes: [
      'Forgetting image frequency interference at f_image = f_RF + 2·f_IF, which the front-end RF preselector must attenuate.',
    ],
    experimentLabel: 'Open Superheterodyne Lab',
    experimentParams: { ...DEFAULT_AM_PARAMETERS },
    targetTab: 'receiver',
  },
  {
    id: 'mod-demod-relationship',
    title: '20. Relationship Between Modulation & Demodulation',
    category: 'Demodulation & Receivers',
    summary:
      'Modulation translates a baseband signal up to a passband carrier frequency fc for wireless transmission; demodulation reverses this translation back to baseband while preserving waveform fidelity.',
    equation: 'm(t) \\xrightarrow{\\text{Modulate }(f_c)} s(t) \\xrightarrow{\\text{Channel + Noise}} r(t) \\xrightarrow{\\text{Demodulate}} \\hat{m}(t)',
    symbols: [
      { symbol: 'm(t)', meaning: 'Original transmitted message (V)' },
      { symbol: '\\hat{m}(t)', meaning: 'Recovered estimate at receiver output (V)' },
    ],
    derivation: [
      'Linearity in the modulation stage (1 + ka·m(t) ≥ 0) guarantees the envelope matches m(t) without distortion.',
      'Receiver bandwidth B_rx ≥ 2·fm(max) guarantees both sidebands survive into the detector.',
      'Channel noise degrades output SNR proportionally to sideband power rather than carrier power.',
    ],
    example:
      'In AMLab, increasing μ from 0.2 to 0.9 increases sideband power by 20×, dramatically improving recovered message SNR against fixed channel noise.',
    mistakes: [
      'Increasing carrier amplitude alone while reducing μ—output message SNR depends on sideband power PSB, not carrier power Pc.',
    ],
    experimentLabel: 'Compare Clean vs Noisy Recovery',
    experimentParams: { ...DEFAULT_AM_PARAMETERS },
    targetTab: 'noise',
  },
];

export interface EquationBreakdownItem {
  id: string;
  name: string;
  latex: string;
  description: string;
  steps: string[];
}

export const EQUATION_BREAKDOWNS: EquationBreakdownItem[] = [
  {
    id: 'eq-am-general',
    name: 'General Conventional AM Signal',
    latex: 's(t) = A_c\\left[1 + k_a m(t)\\right]\\cos(2\\pi f_c t)',
    description: 'Defines conventional AM for any arbitrary baseband waveform m(t).',
    steps: [
      '1. Start with the unmodulated carrier wave Ac cos(2πfct).',
      '2. Scale the message m(t) by hardware sensitivity ka (units V⁻¹) so ka·m(t) is dimensionless.',
      '3. Add 1 to keep the total envelope factor [1 + ka·m(t)] positive when |ka·m(t)| ≤ 1.',
      '4. Multiply the envelope Ac[1 + ka·m(t)] by cos(2πfct) to modulate carrier amplitude.',
    ],
  },
  {
    id: 'eq-am-tone',
    name: 'Single-Tone Spectrum Expansion',
    latex: 's(t) = A_c\\cos(2\\pi f_c t) + \\frac{\\mu A_c}{2}\\cos\\!\\big(2\\pi(f_c+f_m)t\\big) + \\frac{\\mu A_c}{2}\\cos\\!\\big(2\\pi(f_c-f_m)t\\big)',
    description: 'Reveals why conventional AM generates a carrier line plus two sidebands.',
    steps: [
      '1. Substitute m(t) = Am cos(2πfmt) and μ = ka·Am into s(t).',
      '2. Distribute Ac cos(2πfct) over [1 + μ cos(2πfmt)].',
      '3. Apply cos(A)cos(B) = ½[cos(A+B) + cos(A−B)] to the product term.',
      '4. Identify Carrier (fc, amp Ac), USB (fc + fm, amp μAc/2), and LSB (fc − fm, amp μAc/2).',
    ],
  },
  {
    id: 'eq-power',
    name: 'Total Power & Efficiency',
    latex: 'P_t = P_c\\left(1 + \\frac{\\mu^2}{2}\\right), \\qquad \\eta = \\frac{P_{\\text{SB}}}{P_t} = \\frac{\\mu^2}{2 + \\mu^2}',
    description: 'Quantifies power distribution across carrier and sidebands on resistive load R.',
    steps: [
      '1. Carrier power: Pc = Ac²/(2R) (average power of Ac cos(2πfct) across R).',
      '2. Each sideband has peak μAc/2, giving PUSB = PLSB = (μAc/2)²/(2R) = μ²Pc/4.',
      '3. Total sideband power: PSB = PUSB + PLSB = μ²Pc/2.',
      '4. Efficiency η = PSB / (Pc + PSB) = (μ²/2) / (1 + μ²/2) = μ² / (2 + μ²).',
    ],
  },
  {
    id: 'eq-env-mu',
    name: 'Oscilloscope Envelope Formula',
    latex: '\\mu = \\frac{E_{\\max} - E_{\\min}}{E_{\\max} + E_{\\min}}',
    description: 'Extracts modulation index directly from upper envelope extrema when μ ≤ 1.',
    steps: [
      '1. Measure maximum envelope peak Emax = Ac(1 + μ).',
      '2. Measure minimum envelope trough Emin = Ac(1 − μ).',
      '3. Numerator Emax − Emin = 2Acμ; Denominator Emax + Emin = 2Ac.',
      '4. Ratio eliminates unknown Ac and yields μ directly.',
    ],
  },
];

export type ProblemCategory =
  | 'A. Modulation Index'
  | 'B. Percentage Modulation'
  | 'C. Envelope Max & Min'
  | 'D. Amplitude Sensitivity'
  | 'E. Sideband Frequencies'
  | 'F. AM Bandwidth'
  | 'G. Carrier Power'
  | 'H. Sideband Power'
  | 'I. Total Transmitted Power'
  | 'J. Transmission Efficiency'
  | 'K. Envelope Detector RC'
  | 'L. Superheterodyne IF';

export interface SolvedProblem {
  id: string;
  category: ProblemCategory;
  title: string;
  given: string[];
  required: string;
  formulaLatex: string;
  substitutionLatex: string;
  steps: string[];
  answerNumeric: number;
  answerUnit: string;
  answerFormatted: string;
  physicalMeaning: string;
}

function randRange(min: number, max: number, decimals = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round((min + Math.random() * (max - min)) * factor) / factor;
}

export function generateProblem(category: ProblemCategory): SolvedProblem {
  const id = `${category}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  switch (category) {
    case 'A. Modulation Index': {
      const ka = randRange(0.2, 0.8, 2);
      const Am = randRange(0.5, 1.8, 2);
      const mu = ka * Am;
      return {
        id,
        category,
        title: 'Calculate Modulation Index from Modulator Sensitivity',
        given: [`Amplitude sensitivity kₐ = ${ka} V⁻¹`, `Message peak amplitude Aₘ = ${Am} V`],
        required: 'Modulation index μ (dimensionless)',
        formulaLatex: '\\mu = k_a A_m',
        substitutionLatex: `\\mu = (${ka}\\text{ V}^{-1})(${Am}\\text{ V}) = ${mu.toFixed(4)}`,
        steps: [
          'Identify hardware amplitude sensitivity kₐ and peak message voltage Aₘ.',
          `Multiply kₐ × Aₘ = ${ka} × ${Am} = ${mu.toFixed(4)}.`,
        ],
        answerNumeric: Number(mu.toFixed(4)),
        answerUnit: '',
        answerFormatted: `${mu.toFixed(4)}`,
        physicalMeaning:
          mu < 1
            ? 'Since μ < 1, the signal is undermodulated and safe for distortion-free envelope detection.'
            : mu === 1
              ? 'μ = 1 indicates 100% critical modulation.'
              : 'Since μ > 1, the signal is overmodulated and experiences carrier phase reversal.',
      };
    }
    case 'B. Percentage Modulation': {
      const Emax = randRange(12, 24, 1);
      const Emin = randRange(2, 9, 1);
      const mu = (Emax - Emin) / (Emax + Emin);
      const M = mu * 100;
      return {
        id,
        category,
        title: 'Find Percentage Modulation from Oscilloscope Envelope',
        given: [`Maximum envelope Eₘₐₓ = ${Emax} V`, `Minimum envelope Eₘᵢₙ = ${Emin} V`],
        required: 'Percentage modulation M (%)',
        formulaLatex: 'M = \\frac{E_{\\max} - E_{\\min}}{E_{\\max} + E_{\\min}} \\times 100\\%',
        substitutionLatex: `M = \\frac{${Emax} - ${Emin}}{${Emax} + ${Emin}} \\times 100\\% = ${M.toFixed(2)}\\%`,
        steps: [
          `Compute Emax − Emin = ${Emax} − ${Emin} = ${(Emax - Emin).toFixed(2)} V.`,
          `Compute Emax + Emin = ${Emax} + ${Emin} = ${(Emax + Emin).toFixed(2)} V.`,
          `Divide and multiply by 100%: μ = ${mu.toFixed(4)} → M = ${M.toFixed(2)}%.`,
        ],
        answerNumeric: Number(M.toFixed(2)),
        answerUnit: '%',
        answerFormatted: `${M.toFixed(2)}%`,
        physicalMeaning: `The carrier amplitude varies by ±${M.toFixed(1)}% around its unmodulated level Ac = ${((Emax + Emin) / 2).toFixed(2)} V.`,
      };
    }
    case 'C. Envelope Max & Min': {
      const Ac = randRange(5, 20, 1);
      const mu = randRange(0.25, 0.9, 2);
      const Emax = Ac * (1 + mu);
      const Emin = Ac * (1 - mu);
      return {
        id,
        category,
        title: 'Determine Maximum Envelope Peak Eₘₐₓ',
        given: [`Carrier amplitude A_c = ${Ac} V`, `Modulation index μ = ${mu}`],
        required: 'Maximum envelope amplitude Eₘₐₓ (V) (also find Eₘᵢₙ)',
        formulaLatex: 'E_{\\max} = A_c(1 + \\mu), \\quad E_{\\min} = A_c(1 - \\mu)',
        substitutionLatex: `E_{\\max} = ${Ac}(1 + ${mu}) = ${Emax.toFixed(3)}\\text{ V}, \\quad E_{\\min} = ${Ac}(1 - ${mu}) = ${Emin.toFixed(3)}\\text{ V}`,
        steps: [
          `Compute peak excursion Emax = ${Ac} × (1 + ${mu}) = ${Emax.toFixed(3)} V.`,
          `Compute trough Emin = ${Ac} × (1 − ${mu}) = ${Emin.toFixed(3)} V.`,
        ],
        answerNumeric: Number(Emax.toFixed(3)),
        answerUnit: 'V',
        answerFormatted: `Eₘₐₓ = ${Emax.toFixed(3)} V (Eₘᵢₙ = ${Emin.toFixed(3)} V)`,
        physicalMeaning: 'The upper envelope stays strictly positive and swings symmetrically around Ac.',
      };
    }
    case 'D. Amplitude Sensitivity': {
      const mu = randRange(0.4, 0.95, 2);
      const Am = randRange(0.8, 3.0, 2);
      const ka = mu / Am;
      return {
        id,
        category,
        title: 'Calculate Required Modulator Sensitivity kₐ',
        given: [`Target modulation index μ = ${mu}`, `Message peak amplitude Aₘ = ${Am} V`],
        required: 'Amplitude sensitivity kₐ (V⁻¹)',
        formulaLatex: 'k_a = \\frac{\\mu}{A_m}',
        substitutionLatex: `k_a = \\frac{${mu}}{${Am}\\text{ V}} = ${ka.toFixed(4)}\\text{ V}^{-1}`,
        steps: [
          'Rearrange μ = ka · Am to solve for ka = μ / Am.',
          `Substitute values: ka = ${mu} / ${Am} = ${ka.toFixed(4)} V⁻¹.`,
        ],
        answerNumeric: Number(ka.toFixed(4)),
        answerUnit: 'V⁻¹',
        answerFormatted: `${ka.toFixed(4)} V⁻¹`,
        physicalMeaning: `Each 1 V of message input changes the carrier amplitude by ${(ka * 100).toFixed(1)}% of Ac.`,
      };
    }
    case 'E. Sideband Frequencies': {
      const fc = Math.round(randRange(80, 1200, 0));
      const fm = Math.round(randRange(2, 15, 0));
      const fUSB = fc + fm;
      const fLSB = fc - fm;
      return {
        id,
        category,
        title: 'Calculate Upper Sideband Frequency f_USB',
        given: [`Carrier frequency f_c = ${fc} kHz`, `Single-tone message frequency fₘ = ${fm} kHz`],
        required: 'Upper sideband frequency f_USB (kHz) (and f_LSB)',
        formulaLatex: 'f_{\\text{USB}} = f_c + f_m, \\quad f_{\\text{LSB}} = f_c - f_m',
        substitutionLatex: `f_{\\text{USB}} = ${fc} + ${fm} = ${fUSB}\\text{ kHz}, \\quad f_{\\text{LSB}} = ${fc} - ${fm} = ${fLSB}\\text{ kHz}`,
        steps: [
          `Add fm to fc for Upper Sideband: ${fc} + ${fm} = ${fUSB} kHz.`,
          `Subtract fm from fc for Lower Sideband: ${fc} − ${fm} = ${fLSB} kHz.`,
        ],
        answerNumeric: fUSB,
        answerUnit: 'kHz',
        answerFormatted: `f_USB = ${fUSB} kHz (f_LSB = ${fLSB} kHz)`,
        physicalMeaning: 'Modulation translates the baseband tone symmetrically around the carrier frequency.',
      };
    }
    case 'F. AM Bandwidth': {
      const fc = Math.round(randRange(500, 1500, 0));
      const fmMax = randRange(3, 12, 1);
      const bam = 2 * fmMax;
      return {
        id,
        category,
        title: 'Compute Conventional AM Transmission Bandwidth',
        given: [`Carrier frequency f_c = ${fc} kHz`, `Maximum message frequency fₘ(max) = ${fmMax} kHz`],
        required: 'AM transmission bandwidth B_AM (kHz)',
        formulaLatex: 'B_{\\text{AM}} = 2 f_{m(\\max)}',
        substitutionLatex: `B_{\\text{AM}} = 2 \\times ${fmMax}\\text{ kHz} = ${bam.toFixed(1)}\\text{ kHz}`,
        steps: [
          `Highest sideband frequency = ${fc} + ${fmMax} = ${(fc + fmMax).toFixed(1)} kHz.`,
          `Lowest sideband frequency = ${fc} − ${fmMax} = ${(fc - fmMax).toFixed(1)} kHz.`,
          `Bandwidth = (fc + fm) − (fc − fm) = 2 × ${fmMax} = ${bam.toFixed(1)} kHz.`,
        ],
        answerNumeric: Number(bam.toFixed(1)),
        answerUnit: 'kHz',
        answerFormatted: `${bam.toFixed(1)} kHz`,
        physicalMeaning: 'AM requires twice the baseband message bandwidth regardless of the carrier frequency.',
      };
    }
    case 'G. Carrier Power': {
      const Ac = randRange(8, 30, 1);
      const R = [50, 75, 100][Math.floor(Math.random() * 3)];
      const Pc = (Ac * Ac) / (2 * R);
      return {
        id,
        category,
        title: 'Calculate Unmodulated Carrier Power',
        given: [`Carrier peak voltage A_c = ${Ac} V`, `Load resistance R = ${R} Ω`],
        required: 'Carrier power P_c (W)',
        formulaLatex: 'P_c = \\frac{A_c^2}{2R}',
        substitutionLatex: `P_c = \\frac{(${Ac}\\text{ V})^2}{2(${R}\\,\\Omega)} = ${Pc.toFixed(3)}\\text{ W}`,
        steps: [
          `Convert peak voltage to RMS: Ac_rms = ${Ac}/√2 V.`,
          `Compute Pc = Ac² / (2R) = ${(Ac * Ac).toFixed(2)} / ${2 * R} = ${Pc.toFixed(3)} W.`,
        ],
        answerNumeric: Number(Pc.toFixed(3)),
        answerUnit: 'W',
        answerFormatted: `${Pc.toFixed(3)} W`,
        physicalMeaning: 'This is the baseline power radiated continuously even when no message is present.',
      };
    }
    case 'H. Sideband Power': {
      const Pc = randRange(10, 100, 0);
      const mu = randRange(0.3, 1.0, 2);
      const Psb = (mu * mu * Pc) / 2;
      return {
        id,
        category,
        title: 'Calculate Total Sideband Power',
        given: [`Carrier power P_c = ${Pc} W`, `Single-tone modulation index μ = ${mu}`],
        required: 'Total sideband power P_SB (W)',
        formulaLatex: 'P_{\\text{SB}} = \\frac{\\mu^2}{2} P_c',
        substitutionLatex: `P_{\\text{SB}} = \\frac{(${mu})^2}{2}(${Pc}\\text{ W}) = ${Psb.toFixed(3)}\\text{ W}`,
        steps: [
          `Compute μ² = ${(mu * mu).toFixed(4)}.`,
          `Compute total sideband power PSB = (${(mu * mu).toFixed(4)} / 2) × ${Pc} = ${Psb.toFixed(3)} W.`,
          `Each individual sideband carries PUSB = PLSB = ${(Psb / 2).toFixed(3)} W.`,
        ],
        answerNumeric: Number(Psb.toFixed(3)),
        answerUnit: 'W',
        answerFormatted: `${Psb.toFixed(3)} W`,
        physicalMeaning: 'Only this portion of the transmitted power actually conveys the message waveform.',
      };
    }
    case 'I. Total Transmitted Power': {
      const Pc = randRange(20, 200, 0);
      const mu = randRange(0.4, 0.95, 2);
      const Pt = Pc * (1 + (mu * mu) / 2);
      return {
        id,
        category,
        title: 'Calculate Total Transmitted AM Power',
        given: [`Unmodulated carrier power P_c = ${Pc} W`, `Modulation index μ = ${mu}`],
        required: 'Total transmitted power P_t (W)',
        formulaLatex: 'P_t = P_c\\left(1 + \\frac{\\mu^2}{2}\\right)',
        substitutionLatex: `P_t = ${Pc}\\left(1 + \\frac{${mu}^2}{2}\\right) = ${Pt.toFixed(3)}\\text{ W}`,
        steps: [
          `Compute 1 + μ²/2 = 1 + ${(mu * mu / 2).toFixed(4)} = ${(1 + (mu * mu) / 2).toFixed(4)}.`,
          `Multiply by Pc = ${Pc} W: Pt = ${Pt.toFixed(3)} W.`,
        ],
        answerNumeric: Number(Pt.toFixed(3)),
        answerUnit: 'W',
        answerFormatted: `${Pt.toFixed(3)} W`,
        physicalMeaning: 'Modulation adds sideband power on top of the constant carrier power.',
      };
    }
    case 'J. Transmission Efficiency': {
      const mu = randRange(0.3, 1.0, 2);
      const eta = ((mu * mu) / (2 + mu * mu)) * 100;
      return {
        id,
        category,
        title: 'Compute AM Power Transmission Efficiency',
        given: [`Single-tone modulation index μ = ${mu}`],
        required: 'Transmission efficiency η (%)',
        formulaLatex: '\\eta = \\frac{\\mu^2}{2 + \\mu^2} \\times 100\\%',
        substitutionLatex: `\\eta = \\frac{${mu}^2}{2 + ${mu}^2} \\times 100\\% = ${eta.toFixed(2)}\\%`,
        steps: [
          `Compute μ² = ${(mu * mu).toFixed(4)}.`,
          `Compute 2 + μ² = ${(2 + mu * mu).toFixed(4)}.`,
          `Divide and convert to percentage: η = ${eta.toFixed(2)}%.`,
        ],
        answerNumeric: Number(eta.toFixed(2)),
        answerUnit: '%',
        answerFormatted: `${eta.toFixed(2)}%`,
        physicalMeaning: `Only ${eta.toFixed(2)}% of total radiated power carries useful message information; ${(100 - eta).toFixed(2)}% remains in the carrier.`,
      };
    }
    case 'K. Envelope Detector RC': {
      const fc = Math.round(randRange(100, 500, 0)) * 1000;
      const fm = Math.round(randRange(2, 8, 0)) * 1000;
      const rcOptUs = Math.sqrt((1 / fc) * (1 / fm)) * 1e6;
      return {
        id,
        category,
        title: 'Design Geometric-Mean Envelope Detector RC Constant',
        given: [`Carrier frequency f_c = ${(fc / 1000).toFixed(0)} kHz`, `Message frequency fₘ = ${(fm / 1000).toFixed(0)} kHz`],
        required: 'Recommended geometric-mean RC time constant (μs)',
        formulaLatex: 'RC_{\\text{opt}} = \\sqrt{\\frac{1}{f_c}\\cdot\\frac{1}{f_m}}',
        substitutionLatex: `RC_{\\text{opt}} = \\sqrt{\\frac{1}{${fc}}\\cdot\\frac{1}{${fm}}} = ${rcOptUs.toFixed(2)}\\,\\mu\\text{s}`,
        steps: [
          `Carrier period 1/fc = ${(1e6 / fc).toFixed(2)} μs.`,
          `Message period 1/fm = ${(1e6 / fm).toFixed(2)} μs.`,
          `Geometric mean √(1/fc · 1/fm) = ${rcOptUs.toFixed(2)} μs satisfies 1/fc ≪ RC ≪ 1/fm.`,
        ],
        answerNumeric: Number(rcOptUs.toFixed(2)),
        answerUnit: 'μs',
        answerFormatted: `${rcOptUs.toFixed(2)} μs`,
        physicalMeaning: 'Balances low carrier ripple against avoiding diagonal clipping distortion.',
      };
    }
    case 'L. Superheterodyne IF': {
      const fRF = Math.round(randRange(550, 1550, 0));
      const fIF = 455;
      const fLO = fRF + fIF;
      return {
        id,
        category,
        title: 'Calculate High-Side Local Oscillator Frequency',
        given: [`Tuned AM station f_RF = ${fRF} kHz`, `Standard Intermediate Frequency f_IF = ${fIF} kHz`],
        required: 'High-side Local Oscillator frequency f_LO (kHz)',
        formulaLatex: 'f_{\\text{LO}} = f_{\\text{RF}} + f_{\\text{IF}}',
        substitutionLatex: `f_{\\text{LO}} = ${fRF}\\text{ kHz} + ${fIF}\\text{ kHz} = ${fLO}\\text{ kHz}`,
        steps: [
          'For high-side injection, f_LO > f_RF such that f_LO − f_RF = f_IF.',
          `Compute f_LO = ${fRF} + ${fIF} = ${fLO} kHz.`,
          `Note: Image frequency is at f_LO + f_IF = ${fLO + fIF} kHz.`,
        ],
        answerNumeric: fLO,
        answerUnit: 'kHz',
        answerFormatted: `${fLO} kHz`,
        physicalMeaning: 'Mixing f_LO and f_RF translates the station down to the fixed 455 kHz IF amplifier.',
      };
    }
  }
}

export interface QuizQuestion {
  id: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  type: 'mcq' | 'numeric';
  question: string;
  options?: string[];
  correctOptionIndex?: number;
  correctNumber?: number;
  unit?: string;
  tolerance?: number;
  hint: string;
  explanation: string;
}

export const QUIZ_BANK: QuizQuestion[] = [
  {
    id: 'q1',
    difficulty: 'Beginner',
    type: 'mcq',
    question: 'In conventional AM, what quantity of the carrier wave changes in proportion to the message signal m(t)?',
    options: [
      'Carrier frequency fc',
      'Instantaneous carrier amplitude envelope',
      'Carrier initial phase φc',
      'Sampling frequency Fs',
    ],
    correctOptionIndex: 1,
    hint: 'Look at the AM equation s(t) = Ac[1 + ka·m(t)]cos(2πfct).',
    explanation: 'The factor Ac[1 + ka·m(t)] modulates the carrier amplitude while fc and phase remain constant.',
  },
  {
    id: 'q2',
    difficulty: 'Beginner',
    type: 'numeric',
    question: 'An AM modulator has amplitude sensitivity ka = 0.4 V⁻¹ and is driven by a sinusoidal message of peak amplitude Am = 1.5 V. Calculate the modulation index μ.',
    correctNumber: 0.6,
    unit: '',
    tolerance: 0.02,
    hint: 'Use μ = ka × Am.',
    explanation: 'μ = ka · Am = 0.4 × 1.5 = 0.60 (60% modulation).',
  },
  {
    id: 'q3',
    difficulty: 'Beginner',
    type: 'numeric',
    question: 'A 100 kHz carrier is amplitude modulated by a 5 kHz sinusoidal tone. What is the occupied conventional AM bandwidth in kHz?',
    correctNumber: 10,
    unit: 'kHz',
    tolerance: 0.1,
    hint: 'B_AM = 2 × fm.',
    explanation: 'Sidebands appear at 95 kHz and 105 kHz, giving B_AM = 105 − 95 = 10 kHz = 2 × fm.',
  },
  {
    id: 'q4',
    difficulty: 'Intermediate',
    type: 'numeric',
    question: 'On an oscilloscope, an AM waveform has Emax = 18 V and Emin = 6 V. Calculate the modulation index μ.',
    correctNumber: 0.5,
    unit: '',
    tolerance: 0.02,
    hint: 'Use μ = (Emax − Emin) / (Emax + Emin).',
    explanation: 'μ = (18 − 6) / (18 + 6) = 12 / 24 = 0.50.',
  },
  {
    id: 'q5',
    difficulty: 'Intermediate',
    type: 'mcq',
    question: 'What happens to a conventional AM waveform when μ > 1 (overmodulation)?',
    options: [
      'The carrier frequency doubles',
      'The envelope drops to zero, flips phase by 180°, and distorts envelope detection',
      'Transmission efficiency exceeds 100%',
      'The upper sideband disappears',
    ],
    correctOptionIndex: 1,
    hint: 'Consider what happens to Ac[1 + μ cos(2πfmt)]cos(2πfct) when 1 + μ cos < 0.',
    explanation: 'Negative values of 1 + ka·m(t) invert the carrier by 180°, causing the positive envelope to fold upward.',
  },
  {
    id: 'q6',
    difficulty: 'Intermediate',
    type: 'numeric',
    question: 'What is the maximum theoretical power transmission efficiency η (in %) of conventional single-tone AM without overmodulation (μ = 1)?',
    correctNumber: 33.33,
    unit: '%',
    tolerance: 0.5,
    hint: 'Use η = μ² / (2 + μ²) × 100% at μ = 1.',
    explanation: 'At μ = 1, η = 1² / (2 + 1²) = 1/3 = 33.33%. Two-thirds of power remains in the carrier.',
  },
  {
    id: 'q7',
    difficulty: 'Intermediate',
    type: 'numeric',
    question: 'An AM transmitter radiates a carrier power Pc = 100 W at modulation index μ = 0.5. Calculate the total transmitted power Pt in Watts.',
    correctNumber: 112.5,
    unit: 'W',
    tolerance: 0.5,
    hint: 'Use Pt = Pc(1 + μ²/2).',
    explanation: 'Pt = 100 × (1 + 0.5²/2) = 100 × (1 + 0.125) = 112.5 W.',
  },
  {
    id: 'q8',
    difficulty: 'Advanced',
    type: 'mcq',
    question: 'In an envelope detector, what distortion occurs if the RC time constant is much larger than 1/fm?',
    options: [
      'Excessive carrier ripple',
      'Diagonal clipping (capacitor discharges too slowly to track downward slopes)',
      'Quadrature null effect',
      'Spectral aliasing',
    ],
    correctOptionIndex: 1,
    hint: 'Recall the condition 1/fc ≪ RC ≪ 1/fm.',
    explanation: 'When RC is too large, the capacitor cannot discharge fast enough to follow the falling AM envelope, cutting across troughs (diagonal clipping).',
  },
  {
    id: 'q9',
    difficulty: 'Advanced',
    type: 'mcq',
    question: 'In coherent (synchronous) AM detection, what occurs if the local oscillator has a 90° phase error relative to the received carrier?',
    options: [
      'Recovered message doubles in amplitude',
      'Recovered message becomes completely zero (quadrature null)',
      'Bandwidth halves to SSB',
      'Carrier power increases by 3 dB',
    ],
    correctOptionIndex: 1,
    hint: 'Recall the LPF output scales by cos(Δφ).',
    explanation: 'Because coherent detection output scales by cos(Δφ), Δφ = 90° yields cos(90°) = 0.',
  },
  {
    id: 'q10',
    difficulty: 'Advanced',
    type: 'numeric',
    question: 'A superheterodyne AM receiver with f_IF = 455 kHz tunes to a station at f_RF = 920 kHz using high-side injection (f_LO > f_RF). What is the image frequency in kHz?',
    correctNumber: 1830,
    unit: 'kHz',
    tolerance: 1,
    hint: 'f_LO = f_RF + f_IF, and f_image = f_LO + f_IF = f_RF + 2·f_IF.',
    explanation: 'f_LO = 920 + 455 = 1375 kHz; f_image = 1375 + 455 = 1830 kHz.',
  },
];

export interface WhatIfExperiment {
  id: string;
  label: string;
  description: string;
  apply: (current: AMParameters) => AMParameters;
  targetTab?: string;
}

export const WHAT_IF_EXPERIMENTS: WhatIfExperiment[] = [
  {
    id: 'double-am',
    label: 'Double Message Amplitude (2× Aₘ)',
    description: 'Doubles Aₘ from current value, doubling μ = kₐ·Aₘ and quadrupling sideband power.',
    apply: (p) => ({ ...p, Am: Math.min(4, Number((p.Am * 2).toFixed(2))) }),
    targetTab: 'modulator',
  },
  {
    id: 'halve-fm',
    label: 'Halve Message Frequency (0.5× fₘ)',
    description: 'Halves fₘ, halving AM bandwidth B_AM = 2fₘ and bringing sidebands closer to f_c.',
    apply: (p) => ({ ...p, fm: Math.max(1000, Math.round(p.fm * 0.5)) }),
    targetTab: 'spectrum',
  },
  {
    id: 'double-fc',
    label: 'Double Carrier Frequency (2× f_c)',
    description: 'Shifts carrier & sidebands to 2×f_c while keeping B_AM = 2fₘ unchanged.',
    apply: (p) => ({
      ...p,
      fc: Math.min(400_000, p.fc * 2),
      Fs: Math.max(p.Fs, p.fc * 2 * 10),
    }),
    targetTab: 'spectrum',
  },
  {
    id: 'mu-100',
    label: 'Set 100% Modulation (μ = 1.0)',
    description: 'Adjusts Aₘ so μ = 1.0, reaching maximum 33.33% efficiency without envelope reversal.',
    apply: (p) => ({
      ...p,
      messageWaveform: 'sine',
      Am: Number((1 / Math.max(0.05, p.ka)).toFixed(3)),
    }),
    targetTab: 'modulation-index',
  },
  {
    id: 'mu-over',
    label: 'Trigger Overmodulation (μ = 1.5)',
    description: 'Pushes μ = 1.5 > 1, revealing carrier 180° phase inversion and envelope distortion.',
    apply: (p) => ({
      ...p,
      messageWaveform: 'sine',
      Am: Number((1.5 / Math.max(0.05, p.ka)).toFixed(3)),
    }),
    targetTab: 'modulation-index',
  },
  {
    id: 'double-ac',
    label: 'Double Carrier Amplitude (2× A_c)',
    description: 'Doubles A_c, quadrupling carrier power P_c = A_c²/(2R) and total power P_t.',
    apply: (p) => ({ ...p, Ac: Math.min(30, Number((p.Ac * 2).toFixed(1))) }),
    targetTab: 'power',
  },
  {
    id: 'inc-r',
    label: 'Increase Load Resistance (R = 100 Ω)',
    description: 'Doubles R from 50 Ω to 100 Ω, halving all dissipated powers while efficiency η stays constant.',
    apply: (p) => ({ ...p, loadResistance: 100 }),
    targetTab: 'power',
  },
  {
    id: 'square-msg',
    label: 'Switch to Square-Wave Message',
    description: 'Replaces sinusoidal m(t) with a square wave, generating odd-harmonic sideband pairs.',
    apply: (p) => ({ ...p, messageWaveform: 'square' }),
    targetTab: 'spectrum',
  },
  {
    id: 'reset-default',
    label: 'Reset to Default Lab Experiment',
    description: 'Restores A_c=10V, f_c=100kHz, Aₘ=1V, fₘ=5kHz, kₐ=0.5 V⁻¹, μ=0.5, R=50Ω, F_s=2MHz.',
    apply: () => ({ ...DEFAULT_AM_PARAMETERS }),
    targetTab: 'overview',
  },
];

export interface PresentationSlide {
  id: number;
  title: string;
  subtitle: string;
  equation: string;
  talkingPoints: string[];
  visualPreset: Partial<AMParameters>;
  visualFocus: 'time' | 'index-compare' | 'spectrum' | 'bandwidth' | 'power' | 'demod';
}

export const PRESENTATION_SLIDES: PresentationSlide[] = [
  {
    id: 1,
    title: 'What is Amplitude Modulation?',
    subtitle: 'Imprinting baseband information onto a radio-frequency carrier',
    equation: 'm(t) \\xrightarrow{\\text{Modulator}} s(t) = A_c[1 + k_a m(t)]\\cos(2\\pi f_c t)',
    talkingPoints: [
      'Baseband speech and audio occupy low frequencies (hundreds of Hz to a few kHz) that require impossibly huge antennas.',
      'Amplitude Modulation scales the peak height of a high-frequency carrier cos(2πfct) according to message m(t).',
      'The carrier frequency fc and phase remain unchanged; only its instantaneous amplitude envelope carries information.',
    ],
    visualPreset: { ...DEFAULT_AM_PARAMETERS },
    visualFocus: 'time',
  },
  {
    id: 2,
    title: 'How a Carrier is Modulated',
    subtitle: 'Symmetric upper and lower envelopes track the message waveform',
    equation: 'E_{\\text{upper}}(t) = A_c[1 + k_a m(t)], \\qquad E_{\\text{lower}}(t) = -E_{\\text{upper}}(t)',
    talkingPoints: [
      'When m(t) rises positively, the carrier envelope expands toward Ac(1 + μ).',
      'When m(t) swings negatively, the carrier envelope contracts toward Ac(1 − μ).',
      'Adding the DC constant "1" keeps the envelope strictly non-negative as long as |ka·m(t)| ≤ 1.',
    ],
    visualPreset: { ...DEFAULT_AM_PARAMETERS },
    visualFocus: 'time',
  },
  {
    id: 3,
    title: 'The Conventional AM Equation',
    subtitle: 'Distinguishing hardware sensitivity kₐ from modulation index μ',
    equation: 's(t) = A_c\\left[1 + \\mu\\cos(2\\pi f_m t)\\right]\\cos(2\\pi f_c t), \\qquad \\mu = k_a A_m',
    talkingPoints: [
      'ka (units V⁻¹) is a fixed property of the modulator circuit.',
      'μ = ka·Am (dimensionless) measures the actual modulation depth produced by a specific message peak Am.',
      'Percentage modulation M = μ × 100% expresses this depth on a 0–100% scale.',
    ],
    visualPreset: { Ac: 10, Am: 1, ka: 0.5, fm: 5000, fc: 100000, messageWaveform: 'sine' },
    visualFocus: 'time',
  },
  {
    id: 4,
    title: 'Measuring Modulation Index from the Waveform',
    subtitle: 'Oscilloscope envelope ratio formula',
    equation: '\\mu = \\frac{E_{\\max} - E_{\\min}}{E_{\\max} + E_{\\min}}',
    talkingPoints: [
      'For our default lab setup (Ac = 10 V, μ = 0.5), Emax = 15 V and Emin = 5 V.',
      'Plugging into the oscilloscope formula gives (15 − 5) / (15 + 5) = 10 / 20 = 0.50 (50%).',
      'Notice the unknown carrier amplitude Ac cancels out automatically.',
    ],
    visualPreset: { Ac: 10, Am: 1, ka: 0.5 },
    visualFocus: 'time',
  },
  {
    id: 5,
    title: 'Three Modulation Regimes',
    subtitle: 'Undermodulation (μ < 1), Critical (μ = 1), and Overmodulation (μ > 1)',
    equation: '\\mu < 1 \\text{ (Safe)} \\quad | \\quad \\mu = 1 \\text{ (100\\% Peak)} \\quad | \\quad \\mu > 1 \\text{ (Phase Inversion)}',
    talkingPoints: [
      'Undermodulation (μ < 1): Envelope never touches zero; ideal for simple diode envelope detectors.',
      'Critical Modulation (μ = 1): Envelope touches 0 V at troughs; maximizes efficiency at 33.33%.',
      'Overmodulation (μ > 1): Envelope crosses zero, inverting carrier phase by 180° and distorting envelope detection.',
    ],
    visualPreset: { Ac: 10, Am: 3, ka: 0.5 },
    visualFocus: 'index-compare',
  },
  {
    id: 6,
    title: 'Frequency Spectrum and Sidebands',
    subtitle: 'Trigonometric expansion creates Carrier, USB, and LSB components',
    equation: 's(t) = A_c\\cos(2\\pi f_c t) + \\frac{\\mu A_c}{2}\\cos(2\\pi(f_c+f_m)t) + \\frac{\\mu A_c}{2}\\cos(2\\pi(f_c-f_m)t)',
    talkingPoints: [
      'Multiplying cosines translates each baseband tone fm to fc + fm (USB) and fc − fm (LSB).',
      'The carrier line at fc stays fixed at amplitude Ac and carries zero message information.',
      'Each sideband has amplitude μAc / 2 (at most half the carrier amplitude when μ = 1).',
    ],
    visualPreset: { ...DEFAULT_AM_PARAMETERS },
    visualFocus: 'spectrum',
  },
  {
    id: 7,
    title: 'Transmission Bandwidth',
    subtitle: 'Why conventional AM requires twice the baseband message bandwidth',
    equation: 'B_{\\text{AM}} = (f_c + f_{m(\\max)}) - (f_c - f_{m(\\max)}) = 2 f_{m(\\max)}',
    talkingPoints: [
      'Both upper and lower sidebands span width fm(max) on opposite sides of fc.',
      'Therefore B_AM = 2W, identical to DSB-SC (2W) and double that of Single-Sideband SSB (W).',
      'Example: A 5 kHz audio signal requires 10 kHz of RF spectrum regardless of whether fc is 100 kHz or 1 MHz.',
    ],
    visualPreset: { ...DEFAULT_AM_PARAMETERS },
    visualFocus: 'bandwidth',
  },
  {
    id: 8,
    title: 'Transmitted Power and Efficiency',
    subtitle: 'Power distribution between the carrier and information-bearing sidebands',
    equation: 'P_t = P_c\\left(1 + \\frac{\\mu^2}{2}\\right), \\qquad \\eta = \\frac{\\mu^2}{2 + \\mu^2}',
    talkingPoints: [
      'Carrier power Pc = Ac²/(2R) is constant; total sideband power is PSB = (μ²/2)Pc.',
      'At μ = 0.5, efficiency is only 11.11% (88.89% of power is wasted in the unmodulated carrier).',
      'Even at 100% single-tone modulation (μ = 1), maximum efficiency is only 1/3 = 33.33%.',
    ],
    visualPreset: { ...DEFAULT_AM_PARAMETERS },
    visualFocus: 'power',
  },
  {
    id: 9,
    title: 'Demodulation: Envelope vs Coherent Detection',
    subtitle: 'Recovering the baseband message at the receiver',
    equation: '\\frac{1}{f_c} \\ll RC \\ll \\frac{1}{f_m} \\qquad \\text{vs.} \\qquad v_{\\text{coh}}(t) \\propto m(t)\\cos(\\Delta\\phi)',
    talkingPoints: [
      'Envelope detector (diode + RC): Inexpensive and requires no local oscillator, but requires μ ≤ 1 and proper RC.',
      'Small RC causes carrier ripple; overly large RC causes diagonal clipping on falling slopes.',
      'Coherent detection works even for μ > 1 or DSB-SC, but requires exact phase sync to avoid cos(Δφ) fading.',
    ],
    visualPreset: { ...DEFAULT_AM_PARAMETERS },
    visualFocus: 'demod',
  },
];
