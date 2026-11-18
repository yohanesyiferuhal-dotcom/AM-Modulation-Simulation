import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  Calculator,
  CheckSquare,
  Menu,
  Presentation,
  Radio,
  Settings,
  ShieldCheck,
  Sliders,
  Waves,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import {
  DEFAULT_AM_PARAMETERS,
  computeAMBandwidth,
  computeAMPower,
  computeTheoreticalSpectrum,
  performAMModulation,
  type AMParameters,
} from './math/amEngine';
import { OverviewView } from './views/OverviewView';
import { SignalGeneratorView } from './views/SignalGeneratorView';
import { AMModulatorView, ModulationIndexView } from './views/ModulatorAndIndexViews';
import { BandwidthView, FrequencySpectrumView } from './views/SpectrumAndBandwidthViews';
import { DemodulationView, PowerAnalysisView } from './views/PowerAndDemodViews';
import { AMReceiverView, NoiseAnalysisView } from './views/ReceiverAndNoiseViews';
import {
  ExplainItView,
  PresentationView,
  QuizView,
  SolvedProblemsView,
} from './views/LearningViews';
import { SettingsExportView, VerificationView } from './views/ToolsViews';

type NavId =
  | 'overview'
  | 'generator'
  | 'modulator'
  | 'modulation-index'
  | 'spectrum'
  | 'bandwidth'
  | 'power'
  | 'demodulation'
  | 'receiver'
  | 'noise'
  | 'problems'
  | 'explain'
  | 'quiz'
  | 'presentation'
  | 'verification'
  | 'settings';

interface NavItem {
  id: NavId;
  label: string;
  group: 'Core Laboratory' | 'Spectrum & Power' | 'Systems' | 'Learning & Verification';
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', group: 'Core Laboratory', icon: <Activity className="w-4 h-4" /> },
  { id: 'generator', label: 'Signal Generator', group: 'Core Laboratory', icon: <Waves className="w-4 h-4" /> },
  { id: 'modulator', label: 'AM Modulator', group: 'Core Laboratory', icon: <Sliders className="w-4 h-4" /> },
  { id: 'modulation-index', label: 'Modulation Index', group: 'Core Laboratory', icon: <Zap className="w-4 h-4" /> },
  { id: 'spectrum', label: 'Frequency Spectrum', group: 'Spectrum & Power', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'bandwidth', label: 'Bandwidth', group: 'Spectrum & Power', icon: <Wifi className="w-4 h-4" /> },
  { id: 'power', label: 'Power Analysis', group: 'Spectrum & Power', icon: <Zap className="w-4 h-4" /> },
  { id: 'demodulation', label: 'Demodulation', group: 'Systems', icon: <Radio className="w-4 h-4" /> },
  { id: 'receiver', label: 'AM Receiver', group: 'Systems', icon: <Radio className="w-4 h-4" /> },
  { id: 'noise', label: 'Noise Analysis', group: 'Systems', icon: <Activity className="w-4 h-4" /> },
  { id: 'problems', label: 'Solved Problems', group: 'Learning & Verification', icon: <Calculator className="w-4 h-4" /> },
  { id: 'explain', label: 'Explain It', group: 'Learning & Verification', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'quiz', label: 'Quiz', group: 'Learning & Verification', icon: <Award className="w-4 h-4" /> },
  { id: 'presentation', label: 'Presentation Mode', group: 'Learning & Verification', icon: <Presentation className="w-4 h-4" /> },
  { id: 'verification', label: 'Math Verification', group: 'Learning & Verification', icon: <ShieldCheck className="w-4 h-4" /> },
  { id: 'settings', label: 'Settings', group: 'Learning & Verification', icon: <Settings className="w-4 h-4" /> },
];

const NAV_GROUPS: Array<NavItem['group']> = [
  'Core Laboratory',
  'Spectrum & Power',
  'Systems',
  'Learning & Verification',
];

export default function App() {
  const [params, setParams] = useState<AMParameters>(DEFAULT_AM_PARAMETERS);
  const [activeTab, setActiveTab] = useState<NavId>('overview');
  const [isDark, setIsDark] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Synchronized mathematical state computed locally in-browser
  const mod = useMemo(() => performAMModulation(params), [params]);
  const spectrum = useMemo(() => computeTheoreticalSpectrum(params), [params]);
  const bw = useMemo(() => computeAMBandwidth(params), [params]);
  const pwr = useMemo(
    () => computeAMPower(params.Ac, mod.mu, params.loadResistance, mod.s),
    [params.Ac, mod.mu, params.loadResistance, mod.s]
  );

  const navigate = (tab: string) => {
    setActiveTab(tab as NavId);
    setMobileMenuOpen(false);
  };

  const handleApplyExperiment = (partial: Partial<AMParameters>, targetTab?: string) => {
    setParams((prev) => ({ ...prev, ...partial }));
    if (targetTab) {
      setActiveTab(targetTab as NavId);
    }
  };

  const activeNavMeta = NAV_ITEMS.find((n) => n.id === activeTab) ?? NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-[#F5F7FB] dark:bg-[#0B1220] text-[#0F172A] dark:text-[#E6EDF7] transition-colors">
      {/* Sticky Single-Row Three-Zone Header */}
      <header className="sticky top-0 z-40 h-14 border-b border-[#DDE3EE] dark:border-[#24324F] bg-white/95 dark:bg-[#0B1220]/95 backdrop-blur px-4 lg:px-6 flex items-center justify-between gap-8 no-print">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="lg:hidden p-1.5 rounded-lg border border-[#DDE3EE] dark:border-[#24324F] text-[#5B6B86] dark:text-[#8FA3C2]"
            aria-label="Toggle laboratory navigation"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <a
            href="#overview"
            onClick={(e) => {
              e.preventDefault();
              navigate('overview');
            }}
            className="font-display text-lg font-bold tracking-tight text-[#0F172A] dark:text-[#E6EDF7] whitespace-nowrap shrink-0"
          >
            AMLab
          </a>
        </div>

        {/* Zone 2: 5 Concise Single-Line Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#5B6B86] dark:text-[#8FA3C2]">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'modulator', label: 'Modulator' },
            { id: 'spectrum', label: 'Spectrum' },
            { id: 'demodulation', label: 'Demodulation' },
            { id: 'problems', label: 'Problems' },
          ].map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => navigate(link.id)}
              className={`whitespace-nowrap shrink-0 hover:text-[#0F172A] dark:hover:text-[#E6EDF7] transition-colors cursor-pointer py-1 border-b-2 ${
                activeTab === link.id
                  ? 'border-[#6366F1] text-[#0F172A] dark:text-[#E6EDF7]'
                  : 'border-transparent'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => navigate('settings')}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#6366F1] text-white hover:bg-[#4F46E5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Export &amp; Report
          </button>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto flex">
        {/* Left Laboratory Navigation Rail (Desktop) */}
        <aside className="hidden lg:block w-60 shrink-0 border-r border-[#DDE3EE] dark:border-[#24324F] bg-white/60 dark:bg-[#111A2E]/60 min-h-[calc(100vh-3.5rem)] p-4 space-y-5 no-print">
          {NAV_GROUPS.map((group) => (
            <div key={group} className="space-y-1">
              <div className="px-2.5 pb-1 text-[11px] font-semibold text-[#5B6B86] dark:text-[#8FA3C2]">
                {group}
              </div>
              {NAV_ITEMS.filter((i) => i.group === group).map((item) => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-[#6366F1] text-white'
                        : 'text-[#5B6B86] dark:text-[#8FA3C2] hover:bg-[#F5F7FB] dark:hover:bg-[#17233D] hover:text-[#0F172A] dark:hover:text-[#E6EDF7]'
                    }`}
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        {/* Mobile Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex no-print">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="relative w-64 max-w-[80vw] bg-white dark:bg-[#111A2E] border-r border-[#DDE3EE] dark:border-[#24324F] h-full overflow-y-auto p-4 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#DDE3EE] dark:border-[#24324F]">
                <span className="font-display font-bold text-base">AMLab Modules</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-[#5B6B86]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {NAV_GROUPS.map((group) => (
                <div key={group} className="space-y-1">
                  <div className="px-2 text-[11px] font-semibold text-[#5B6B86] dark:text-[#8FA3C2]">
                    {group}
                  </div>
                  {NAV_ITEMS.filter((i) => i.group === group).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${
                        activeTab === item.id
                          ? 'bg-[#6366F1] text-white'
                          : 'text-[#5B6B86] dark:text-[#8FA3C2]'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </aside>
          </div>
        )}

        {/* Main Laboratory Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 space-y-5">
          {/* Active Module Breadcrumb Title */}
          <div className="flex flex-wrap items-center justify-between gap-3 no-print">
            <div>
              <div className="text-xs text-[#5B6B86] dark:text-[#8FA3C2]">
                Conventional Amplitude Modulation Simulator · {activeNavMeta.group}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#E6EDF7] text-balance">
                {activeNavMeta.label}
              </h1>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono tabular-nums text-[#5B6B86] dark:text-[#8FA3C2]">
              <span>Ac={params.Ac}V</span>
              <span aria-hidden="true">·</span>
              <span>fc={(params.fc / 1000).toFixed(0)}kHz</span>
              <span aria-hidden="true">·</span>
              <span>fm={(params.fm / 1000).toFixed(1)}kHz</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#34D399] font-semibold">μ={mod.mu.toFixed(2)}</span>
              <button
                type="button"
                onClick={() => navigate('verification')}
                className="hidden sm:inline-flex items-center gap-1 text-[#6366F1] hover:underline cursor-pointer ml-2"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Verify Math</span>
              </button>
            </div>
          </div>

          {activeTab === 'overview' && (
            <OverviewView
              params={params}
              setParams={setParams}
              mod={mod}
              pwr={pwr}
              bw={bw}
              spectrum={spectrum}
              isDark={isDark}
              onNavigate={navigate}
            />
          )}
          {activeTab === 'generator' && (
            <SignalGeneratorView
              params={params}
              setParams={setParams}
              mod={mod}
              isDark={isDark}
            />
          )}
          {activeTab === 'modulator' && (
            <AMModulatorView
              params={params}
              setParams={setParams}
              mod={mod}
              isDark={isDark}
            />
          )}
          {activeTab === 'modulation-index' && (
            <ModulationIndexView
              params={params}
              setParams={setParams}
              mod={mod}
              isDark={isDark}
            />
          )}
          {activeTab === 'spectrum' && (
            <FrequencySpectrumView
              params={params}
              setParams={setParams}
              mod={mod}
              spectrum={spectrum}
              bw={bw}
              isDark={isDark}
            />
          )}
          {activeTab === 'bandwidth' && (
            <BandwidthView
              params={params}
              setParams={setParams}
              bw={bw}
              isDark={isDark}
            />
          )}
          {activeTab === 'power' && (
            <PowerAnalysisView
              params={params}
              setParams={setParams}
              mod={mod}
              pwr={pwr}
              isDark={isDark}
            />
          )}
          {activeTab === 'demodulation' && (
            <DemodulationView
              params={params}
              setParams={setParams}
              mod={mod}
              isDark={isDark}
            />
          )}
          {activeTab === 'receiver' && (
            <AMReceiverView params={params} mod={mod} isDark={isDark} />
          )}
          {activeTab === 'noise' && (
            <NoiseAnalysisView params={params} mod={mod} isDark={isDark} />
          )}
          {activeTab === 'problems' && <SolvedProblemsView />}
          {activeTab === 'explain' && (
            <ExplainItView onApplyExperiment={handleApplyExperiment} />
          )}
          {activeTab === 'quiz' && <QuizView />}
          {activeTab === 'presentation' && <PresentationView isDark={isDark} />}
          {activeTab === 'verification' && <VerificationView params={params} />}
          {activeTab === 'settings' && (
            <SettingsExportView
              params={params}
              setParams={setParams}
              mod={mod}
              pwr={pwr}
              bw={bw}
              spectrum={spectrum}
              isDark={isDark}
              setIsDark={setIsDark}
            />
          )}
        </main>
      </div>
    </div>
  );
}
