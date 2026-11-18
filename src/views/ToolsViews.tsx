import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileJson,
  Printer,
  RotateCcw,
  Save,
  Sun,
  Moon,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  DEFAULT_AM_PARAMETERS,
  computeFFT,
  runMathVerificationSuite,
  type AMModulationResult,
  type AMParameters,
  type AMPowerResult,
  type BandwidthResult,
  type SpectrumComponent,
} from '../math/amEngine';
import { MathTex } from '../components/MathTex';
import {
  exportCalculationsJSON,
  exportSignalCSV,
  exportSpectrumCSV,
} from '../utils/exportUtils';

export const VerificationView: React.FC<{ params: AMParameters }> = ({ params }) => {
  const results = useMemo(() => runMathVerificationSuite(params), [params]);
  const passedCount = results.filter((r) => r.pass).length;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
            Automated Mathematical Verification Suite
          </h2>
          <p className="text-xs text-[#5B6B86] dark:text-[#8FA3C2]">
            Live numerical checks verifying AM equations, FFT spectrum, Parseval total power, diode-RC envelope detection, and synchronous quadrature null.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs font-semibold">
          {passedCount === results.length ? (
            <span className="inline-flex items-center gap-1.5 text-[#059669] dark:text-[#34D399]">
              <CheckCircle2 className="w-4 h-4" />
              {passedCount} / {results.length} TESTS PASSED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[#DC2626] dark:text-[#F87171]">
              <XCircle className="w-4 h-4" />
              {passedCount} / {results.length} PASSED
            </span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#DDE3EE] dark:border-[#24324F] bg-[#F5F7FB] dark:bg-[#0B1220] text-[#5B6B86] dark:text-[#8FA3C2]">
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Verification Test</th>
                <th className="py-3 px-4">Calculated Result</th>
                <th className="py-3 px-4">Expected Result</th>
                <th className="py-3 px-4">Abs. Error</th>
                <th className="py-3 px-4">Engineering Explanation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE3EE] dark:divide-[#24324F]">
              {results.map((r) => (
                <tr key={r.id}>
                  <td className="py-3 px-4 font-mono font-bold whitespace-nowrap">
                    {r.pass ? (
                      <span className="inline-flex items-center gap-1 text-[#059669] dark:text-[#34D399]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        PASS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#DC2626] dark:text-[#F87171]">
                        <XCircle className="w-3.5 h-3.5" />
                        FAIL
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
                    {r.name}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums">{r.calculated}</td>
                  <td className="py-3 px-4 font-mono tabular-nums">{r.expected}</td>
                  <td className="py-3 px-4 font-mono tabular-nums text-[#5B6B86] dark:text-[#8FA3C2]">
                    {r.absError.toExponential(2)}
                  </td>
                  <td className="py-3 px-4 text-[#5B6B86] dark:text-[#8FA3C2] max-w-md">
                    {r.explanation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

interface SavedConfig {
  id: string;
  name: string;
  savedAt: string;
  params: AMParameters;
}

const STORAGE_KEY = 'amlab_saved_configs_v1';

function loadSavedConfigs(): SavedConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedConfig[]) : [];
  } catch {
    return [];
  }
}

interface SettingsExportProps {
  params: AMParameters;
  setParams: React.Dispatch<React.SetStateAction<AMParameters>>;
  mod: AMModulationResult;
  pwr: AMPowerResult;
  bw: BandwidthResult;
  spectrum: SpectrumComponent[];
  isDark: boolean;
  setIsDark: (d: boolean) => void;
}

export const SettingsExportView: React.FC<SettingsExportProps> = ({
  params,
  setParams,
  mod,
  pwr,
  bw,
  spectrum,
  isDark,
  setIsDark,
}) => {
  const [configs, setConfigs] = useState<SavedConfig[]>(() => loadSavedConfigs());
  const [configName, setConfigName] = useState('');
  const [showPrintReport, setShowPrintReport] = useState(false);

  const handleSaveConfig = () => {
    const name = configName.trim() || `Experiment ${configs.length + 1}`;
    const updated: SavedConfig[] = [
      { id: `${Date.now()}`, name, savedAt: new Date().toLocaleString(), params },
      ...configs,
    ];
    setConfigs(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setConfigName('');
  };

  const handleDeleteConfig = (id: string) => {
    const updated = configs.filter((c) => c.id !== id);
    setConfigs(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const fft = useMemo(() => computeFFT(mod.s, params.Fs, 'hann'), [mod.s, params.Fs]);

  return (
    <div className="space-y-6">
      {/* Theme & Reset Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 no-print">
        <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 space-y-4">
          <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
            Laboratory Appearance &amp; Reset
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsDark(true)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border cursor-pointer ${
                isDark
                  ? 'border-[#6366F1] bg-[#6366F1]/15 text-[#E6EDF7]'
                  : 'border-[#DDE3EE] text-[#5B6B86]'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Dark Laboratory Theme</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDark(false)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border cursor-pointer ${
                !isDark
                  ? 'border-[#6366F1] bg-[#6366F1]/10 text-[#0F172A]'
                  : 'border-[#24324F] text-[#8FA3C2]'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Light Laboratory Theme</span>
            </button>
            <button
              type="button"
              onClick={() => setParams({ ...DEFAULT_AM_PARAMETERS })}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border border-[#F87171]/50 text-[#F87171] hover:bg-[#F87171]/10 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset to Default Experiment</span>
            </button>
          </div>
        </div>

        {/* Data Exports */}
        <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 space-y-4">
          <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
            Export Data Logs &amp; Printable Report
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() =>
                exportSignalCSV('message-signal.csv', mod.t, ['time_s', 'message_V'], [mod.m.samples])
              }
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-[#DDE3EE] dark:border-[#24324F] hover:border-[#22D3EE] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>Message CSV</span>
            </button>
            <button
              type="button"
              onClick={() =>
                exportSignalCSV('carrier-signal.csv', mod.t, ['time_s', 'carrier_V'], [mod.c.samples])
              }
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-[#DDE3EE] dark:border-[#24324F] hover:border-[#A78BFA] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span>Carrier CSV</span>
            </button>
            <button
              type="button"
              onClick={() =>
                exportSignalCSV(
                  'am-waveform.csv',
                  mod.t,
                  ['time_s', 'am_s_V', 'upper_env_V', 'lower_env_V'],
                  [mod.s, mod.upperEnvelope, mod.lowerEnvelope]
                )
              }
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-[#DDE3EE] dark:border-[#24324F] hover:border-[#34D399] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#34D399]" />
              <span>AM Waveform CSV</span>
            </button>
            <button
              type="button"
              onClick={() => exportSpectrumCSV('frequency-spectrum.csv', spectrum, fft)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-[#DDE3EE] dark:border-[#24324F] hover:border-[#F472B6] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#F472B6]" />
              <span>Spectrum CSV</span>
            </button>
            <button
              type="button"
              onClick={() => exportCalculationsJSON(params, mod, pwr, bw, spectrum)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-[#DDE3EE] dark:border-[#24324F] hover:border-[#FBBF24] cursor-pointer"
            >
              <FileJson className="w-3.5 h-3.5 text-[#FBBF24]" />
              <span>Results JSON</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPrintReport(true);
                window.setTimeout(() => window.print(), 150);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#6366F1] text-white hover:bg-[#4F46E5] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Printable Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Save / Restore Experiment Configurations (localStorage) */}
      <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 space-y-4 no-print">
        <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
          Saved Experiment Configurations (Browser LocalStorage)
        </h2>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
            placeholder="Configuration name (e.g., 100% Modulation Test)"
            className="flex-1 min-w-[220px] px-3 py-2 text-xs rounded-lg border border-[#DDE3EE] dark:border-[#24324F] bg-[#F5F7FB] dark:bg-[#0B1220]"
          />
          <button
            type="button"
            onClick={handleSaveConfig}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-[#6366F1] text-white hover:bg-[#4F46E5] cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Current Setup</span>
          </button>
        </div>

        {configs.length === 0 ? (
          <p className="text-xs text-[#5B6B86] dark:text-[#8FA3C2]">
            No saved experiment configurations yet. Save your current parameters above to restore them later.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {configs.map((cfg) => (
              <div
                key={cfg.id}
                className="p-3 rounded-lg border border-[#DDE3EE] dark:border-[#24324F] bg-[#F5F7FB] dark:bg-[#0B1220] flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{cfg.name}</div>
                  <div className="text-[11px] font-mono text-[#5B6B86] dark:text-[#8FA3C2]">
                    Ac={cfg.params.Ac}V · fc={(cfg.params.fc / 1000).toFixed(0)}kHz · μ=
                    {(cfg.params.ka * cfg.params.Am).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-[#5B6B86] dark:text-[#8FA3C2]">{cfg.savedAt}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setParams(cfg.params)}
                    className="px-2.5 py-1 rounded text-xs font-medium bg-[#6366F1] text-white cursor-pointer"
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteConfig(cfg.id)}
                    className="p-1 rounded text-[#F87171] hover:bg-[#F87171]/10 cursor-pointer"
                    aria-label="Delete saved configuration"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Printable AM Experiment Report */}
      <div
        className={`rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-6 space-y-4 ${
          showPrintReport ? 'block' : 'hidden print-only'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#DDE3EE] dark:border-[#24324F] pb-3">
          <div>
            <h2 className="text-lg font-bold">AMLab Experiment Laboratory Report</h2>
            <p className="text-xs text-[#5B6B86] dark:text-[#8FA3C2]">
              Conventional Amplitude Modulation Summary · Generated {new Date().toLocaleString()}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPrintReport(false)}
            className="text-xs text-[#6366F1] no-print cursor-pointer"
          >
            Close Preview
          </button>
        </div>

        <div className="p-3 rounded-lg bg-[#F5F7FB] dark:bg-[#0B1220]">
          <MathTex
            block
            latex={`s(t) = ${params.Ac.toFixed(1)}\\left[1 + ${params.ka.toFixed(2)}\\cdot m(t)\\right]\\cos(2\\pi\\cdot ${(params.fc / 1000).toFixed(1)}\\text{ kHz}\\cdot t)`}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div>Carrier Ac: {params.Ac} V</div>
          <div>Carrier fc: {(params.fc / 1000).toFixed(1)} kHz</div>
          <div>Message Am: {params.Am} V</div>
          <div>Message fm: {(params.fm / 1000).toFixed(2)} kHz</div>
          <div>Sensitivity ka: {params.ka} V⁻¹</div>
          <div>Mod. Index μ: {mod.mu.toFixed(4)}</div>
          <div>Bandwidth B_AM: {(bw.B_AM / 1000).toFixed(2)} kHz</div>
          <div>Total Power Pt: {pwr.Pt.toFixed(4)} W</div>
          <div>Carrier Power Pc: {pwr.Pc.toFixed(4)} W</div>
          <div>Sideband Power PSB: {pwr.PSB.toFixed(4)} W</div>
          <div>Efficiency η: {pwr.efficiencyPercent.toFixed(2)}%</div>
          <div>Load R: {params.loadResistance} Ω</div>
        </div>
      </div>
    </div>
  );
};
