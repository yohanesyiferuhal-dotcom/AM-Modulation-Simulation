import type {
  AMModulationResult,
  AMParameters,
  AMPowerResult,
  BandwidthResult,
  FFTResult,
  SpectrumComponent,
} from '../math/amEngine';

function triggerDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportSignalCSV(
  filename: string,
  t: number[],
  headers: string[],
  columns: number[][]
) {
  const lines = [headers.join(',')];
  for (let i = 0; i < t.length; i++) {
    const row = [t[i].toExponential(6)];
    for (let c = 0; c < columns.length; c++) {
      row.push((columns[c][i] ?? 0).toFixed(6));
    }
    lines.push(row.join(','));
  }
  triggerDownload(filename, lines.join('\n'), 'text/csv;charset=utf-8;');
}

export function exportSpectrumCSV(
  filename: string,
  theoretical: SpectrumComponent[],
  fft: FFTResult
) {
  const lines = ['# Theoretical Spectral Components'];
  lines.push('Type,Label,Frequency_Hz,Amplitude_V');
  for (const comp of theoretical) {
    lines.push(`${comp.type},${comp.label},${comp.frequency.toFixed(3)},${comp.amplitude.toFixed(6)}`);
  }
  lines.push('');
  lines.push('# Numerical FFT Spectrum');
  lines.push('Frequency_Hz,Magnitude_V');
  for (let i = 0; i < fft.freqs.length; i++) {
    lines.push(`${fft.freqs[i].toFixed(3)},${fft.magnitudes[i].toFixed(6)}`);
  }
  triggerDownload(filename, lines.join('\n'), 'text/csv;charset=utf-8;');
}

export function exportCalculationsJSON(
  params: AMParameters,
  mod: AMModulationResult,
  pwr: AMPowerResult,
  bw: BandwidthResult,
  spectrum: SpectrumComponent[]
) {
  const payload = {
    generatedAt: new Date().toISOString(),
    application: 'AMLab: Conventional Amplitude Modulation Simulator',
    parameters: params,
    modulation: {
      ka: mod.ka,
      mu: mod.mu,
      percentModulation: mod.percentModulation,
      condition: mod.condition,
      eMax: mod.eMax,
      eMin: mod.eMin,
      muFromEnvelope: mod.muFromEnvelope,
      messagePeak: mod.m.peak,
      messageRms: mod.m.rms,
      amPeak: mod.sPeak,
      amRms: mod.sRms,
    },
    bandwidth: bw,
    power: pwr,
    theoreticalSpectrum: spectrum,
  };
  triggerDownload(
    'amlab-calculations.json',
    JSON.stringify(payload, null, 2),
    'application/json;charset=utf-8;'
  );
}
