import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  HelpCircle,
  Play,
  RefreshCw,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import {
  DEFAULT_AM_PARAMETERS,
  computeAMPower,
  computeTheoreticalSpectrum,
  performAMModulation,
  type AMParameters,
} from '../math/amEngine';
import {
  EQUATION_BREAKDOWNS,
  EXPLAIN_CONCEPTS,
  PRESENTATION_SLIDES,
  QUIZ_BANK,
  generateProblem,
  type ProblemCategory,
  type SolvedProblem,
} from '../data/educationalContent';
import { MathTex } from '../components/MathTex';
import { PlotlyChart } from '../components/PlotlyChart';

interface ExplainItViewProps {
  onApplyExperiment: (partial: Partial<AMParameters>, targetTab?: string) => void;
}

export const ExplainItView: React.FC<ExplainItViewProps> = ({ onApplyExperiment }) => {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({ 'what-is-am': true });
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedEqId, setSelectedEqId] = useState<string>(EQUATION_BREAKDOWNS[0].id);

  const categories = ['All', 'Fundamentals', 'Modulation Depth', 'Spectrum & Power', 'Demodulation & Receivers'];
  const filtered =
    categoryFilter === 'All'
      ? EXPLAIN_CONCEPTS
      : EXPLAIN_CONCEPTS.filter((c) => c.category === categoryFilter);

  const toggle = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedEq =
    EQUATION_BREAKDOWNS.find((e) => e.id === selectedEqId) ?? EQUATION_BREAKDOWNS[0];

  return (
    <div className="space-y-6">
      {/* Dedicated Equation Explanation Panel */}
      <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
              Interactive Equation Breakdown Explorer
            </h2>
            <p className="text-xs text-[#5B6B86] dark:text-[#8FA3C2]">
              Select any core conventional AM equation to inspect its step-by-step derivation and physical meaning.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {EQUATION_BREAKDOWNS.map((eq) => (
              <button
                key={eq.id}
                type="button"
                onClick={() => setSelectedEqId(eq.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  selectedEqId === eq.id
                    ? 'bg-[#6366F1] text-white'
                    : 'bg-[#F5F7FB] dark:bg-[#0B1220] text-[#5B6B86] dark:text-[#8FA3C2] hover:text-[#0F172A] dark:hover:text-[#E6EDF7]'
                }`}
              >
                {eq.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          <div className="lg:col-span-6 p-4 rounded-xl bg-[#F5F7FB] dark:bg-[#0B1220] border border-[#DDE3EE] dark:border-[#24324F] space-y-2">
            <div className="text-xs font-semibold text-[#6366F1]">{selectedEq.name}</div>
            <MathTex block latex={selectedEq.latex} />
            <p className="text-xs text-[#5B6B86] dark:text-[#8FA3C2]">{selectedEq.description}</p>
          </div>
          <div className="lg:col-span-6 space-y-2 text-xs">
            <div className="font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
              Step-by-Step Breakdown
            </div>
            <ul className="space-y-1.5 text-[#5B6B86] dark:text-[#8FA3C2]">
              {selectedEq.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Collapsible 20-Concept Encyclopedia */}
      <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#6366F1]" />
            <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
              Explain It: 20 Core AM Engineering Concepts
            </h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#6366F1] text-white'
                    : 'bg-[#F5F7FB] dark:bg-[#0B1220] text-[#5B6B86] dark:text-[#8FA3C2]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          {filtered.map((item) => {
            const isOpen = !!openIds[item.id];
            return (
              <div
                key={item.id}
                className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-[#F5F7FB]/50 dark:bg-[#0B1220]/70 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left cursor-pointer hover:bg-[#F5F7FB] dark:hover:bg-[#17233D]/50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
                      {item.title}
                    </div>
                    <div className="text-xs text-[#5B6B86] dark:text-[#8FA3C2] truncate">
                      {item.category} · {item.summary}
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 shrink-0 text-[#5B6B86]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 shrink-0 text-[#5B6B86]" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-2 border-t border-[#DDE3EE] dark:border-[#24324F] space-y-4 text-xs">
                    <p className="text-[#0F172A] dark:text-[#E6EDF7] leading-relaxed">
                      {item.summary}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-white dark:bg-[#111A2E] border border-[#DDE3EE] dark:border-[#24324F] space-y-2">
                        <div className="font-semibold text-[#6366F1]">Equation &amp; Symbols</div>
                        <MathTex block latex={item.equation} />
                        <ul className="space-y-1 text-[#5B6B86] dark:text-[#8FA3C2]">
                          {item.symbols.map((sym) => (
                            <li key={sym.symbol}>
                              <MathTex latex={sym.symbol} /> : {sym.meaning}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 rounded-lg bg-white dark:bg-[#111A2E] border border-[#DDE3EE] dark:border-[#24324F] space-y-2">
                        <div className="font-semibold text-[#34D399]">Step-by-Step Derivation</div>
                        <ol className="list-decimal list-inside space-y-1 text-[#5B6B86] dark:text-[#8FA3C2]">
                          {item.derivation.map((d) => (
                            <li key={d}>{d}</li>
                          ))}
                        </ol>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-white dark:bg-[#111A2E] border border-[#DDE3EE] dark:border-[#24324F] space-y-1">
                        <div className="font-semibold text-[#22D3EE]">Practical Engineering Example</div>
                        <p className="text-[#5B6B86] dark:text-[#8FA3C2]">{item.example}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white dark:bg-[#111A2E] border border-[#DDE3EE] dark:border-[#24324F] space-y-1">
                        <div className="font-semibold text-[#F87171]">Common Mistakes</div>
                        <ul className="list-disc list-inside space-y-1 text-[#5B6B86] dark:text-[#8FA3C2]">
                          {item.mistakes.map((m) => (
                            <li key={m}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => onApplyExperiment(item.experimentParams, item.targetTab)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6366F1] text-white font-medium hover:bg-[#4F46E5] cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Interactive Experiment: {item.experimentLabel}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const PROBLEM_CATEGORIES: ProblemCategory[] = [
  'A. Modulation Index',
  'B. Percentage Modulation',
  'C. Envelope Max & Min',
  'D. Amplitude Sensitivity',
  'E. Sideband Frequencies',
  'F. AM Bandwidth',
  'G. Carrier Power',
  'H. Sideband Power',
  'I. Total Transmitted Power',
  'J. Transmission Efficiency',
  'K. Envelope Detector RC',
  'L. Superheterodyne IF',
];

export const SolvedProblemsView: React.FC = () => {
  const [category, setCategory] = useState<ProblemCategory>('A. Modulation Index');
  const [problem, setProblem] = useState<SolvedProblem>(() =>
    generateProblem('A. Modulation Index')
  );
  const [userInput, setUserInput] = useState('');
  const [checkResult, setCheckResult] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [showSolution, setShowSolution] = useState(false);

  const loadNewProblem = (cat: ProblemCategory) => {
    setCategory(cat);
    setProblem(generateProblem(cat));
    setUserInput('');
    setCheckResult('idle');
    setShowSolution(false);
  };

  const handleCheck = () => {
    const val = parseFloat(userInput);
    if (Number.isNaN(val)) return;
    const tol = Math.max(0.05, Math.abs(problem.answerNumeric) * 0.03);
    setCheckResult(Math.abs(val - problem.answerNumeric) <= tol ? 'correct' : 'incorrect');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
              Step-by-Step Solved Engineering Problems
            </h2>
            <p className="text-xs text-[#5B6B86] dark:text-[#8FA3C2]">
              Automatically generated numerical examination problems across all 12 conventional AM categories.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadNewProblem(category)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#6366F1] text-white hover:bg-[#4F46E5] cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Generate New Problem</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PROBLEM_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => loadNewProblem(cat)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                category === cat
                  ? 'bg-[#6366F1] text-white'
                  : 'bg-[#F5F7FB] dark:bg-[#0B1220] text-[#5B6B86] dark:text-[#8FA3C2] hover:text-[#0F172A] dark:hover:text-[#E6EDF7]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-6 space-y-5">
        <div className="space-y-2">
          <div className="text-xs font-mono text-[#6366F1]">{problem.category}</div>
          <h3 className="text-lg font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
            {problem.title}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#F5F7FB] dark:bg-[#0B1220] border border-[#DDE3EE] dark:border-[#24324F] space-y-1.5">
            <div className="font-semibold text-[#0F172A] dark:text-[#E6EDF7]">Given Information</div>
            <ul className="list-disc list-inside space-y-1 text-[#5B6B86] dark:text-[#8FA3C2] font-mono">
              {problem.given.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-[#F5F7FB] dark:bg-[#0B1220] border border-[#DDE3EE] dark:border-[#24324F] space-y-1.5">
            <div className="font-semibold text-[#0F172A] dark:text-[#E6EDF7]">Required Quantity</div>
            <p className="text-[#22D3EE] font-medium">{problem.required}</p>
          </div>
        </div>

        {/* Attempt Answer Before Reveal */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <input
            type="number"
            step="any"
            value={userInput}
            onChange={(e) => {
              setUserInput(e.target.value);
              setCheckResult('idle');
            }}
            placeholder={`Enter answer ${problem.answerUnit ? `(${problem.answerUnit})` : ''}`}
            className="w-56 px-3 py-2 text-xs font-mono rounded-lg border border-[#DDE3EE] dark:border-[#24324F] bg-[#F5F7FB] dark:bg-[#0B1220] text-[#0F172A] dark:text-[#E6EDF7]"
          />
          <button
            type="button"
            onClick={handleCheck}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-[#34D399] text-[#0B1220] hover:opacity-90 cursor-pointer"
          >
            Check Answer
          </button>
          <button
            type="button"
            onClick={() => setShowSolution((s) => !s)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border border-[#DDE3EE] dark:border-[#24324F] hover:border-[#6366F1] cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showSolution ? 'Hide Step-by-Step Solution' : 'Reveal Step-by-Step Solution'}</span>
          </button>

          {checkResult === 'correct' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#059669] dark:text-[#34D399]">
              <CheckCircle2 className="w-4 h-4" />
              Correct! ({problem.answerFormatted})
            </span>
          )}
          {checkResult === 'incorrect' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#DC2626] dark:text-[#F87171]">
              <XCircle className="w-4 h-4" />
              Not quite—check your units or reveal the solution steps.
            </span>
          )}
        </div>

        {showSolution && (
          <div className="p-5 rounded-xl bg-[#F5F7FB] dark:bg-[#0B1220] border border-[#DDE3EE] dark:border-[#24324F] space-y-3 text-xs">
            <div>
              <div className="font-semibold text-[#6366F1] mb-1">1. Relevant Formula</div>
              <MathTex block latex={problem.formulaLatex} />
            </div>
            <div>
              <div className="font-semibold text-[#6366F1] mb-1">2. Substitution</div>
              <MathTex block latex={problem.substitutionLatex} />
            </div>
            <div>
              <div className="font-semibold text-[#6366F1] mb-1">3. Step-by-Step Calculation</div>
              <ol className="list-decimal list-inside space-y-1 text-[#5B6B86] dark:text-[#8FA3C2]">
                {problem.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>
            <div className="pt-2 border-t border-[#DDE3EE] dark:border-[#24324F] flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-semibold text-[#0F172A] dark:text-[#E6EDF7]">Final Answer: </span>
                <span className="font-mono font-bold text-sm text-[#34D399]">
                  {problem.answerFormatted}
                </span>
              </div>
              <p className="text-[#5B6B86] dark:text-[#8FA3C2]">{problem.physicalMeaning}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const QuizView: React.FC = () => {
  const [difficulty, setDifficulty] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});

  const questions = useMemo(
    () => (difficulty === 'All' ? QUIZ_BANK : QUIZ_BANK.filter((q) => q.difficulty === difficulty)),
    [difficulty]
  );

  const isCorrect = (q: (typeof QUIZ_BANK)[number]) => {
    if (!submitted[q.id]) return null;
    const ans = answers[q.id];
    if (q.type === 'mcq') {
      return Number(ans) === q.correctOptionIndex;
    }
    const num = parseFloat(String(ans));
    if (Number.isNaN(num)) return false;
    return Math.abs(num - (q.correctNumber ?? 0)) <= (q.tolerance ?? 0.05);
  };

  const totalAttempted = questions.filter((q) => submitted[q.id]).length;
  const totalCorrect = questions.filter((q) => isCorrect(q) === true).length;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
            Interactive Engineering Quiz
          </h2>
          <p className="text-xs text-[#5B6B86] dark:text-[#8FA3C2]">
            Multiple-choice and numerical verification questions with hints and detailed engineering explanations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#F5F7FB] dark:bg-[#0B1220] border border-[#DDE3EE] dark:border-[#24324F]">
            {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setDifficulty(lvl)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                  difficulty === lvl
                    ? 'bg-[#6366F1] text-white'
                    : 'text-[#5B6B86] dark:text-[#8FA3C2]'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="font-mono text-xs font-semibold tabular-nums px-3 py-1.5 rounded-lg bg-[#F5F7FB] dark:bg-[#0B1220] border border-[#DDE3EE] dark:border-[#24324F]">
            Score: {totalCorrect} / {totalAttempted} ({questions.length} total)
          </div>

          <button
            type="button"
            onClick={() => {
              setAnswers({});
              setSubmitted({});
              setShowHints({});
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-[#DDE3EE] dark:border-[#24324F] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Quiz</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => {
          const status = isCorrect(q);
          return (
            <div
              key={q.id}
              className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-5 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-[#6366F1]">
                  Question {idx + 1} · {q.difficulty} · {q.type === 'mcq' ? 'Multiple Choice' : 'Numerical'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowHints((p) => ({ ...p, [q.id]: !p[q.id] }))}
                  className="inline-flex items-center gap-1 text-xs text-[#5B6B86] dark:text-[#8FA3C2] hover:text-[#6366F1] cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{showHints[q.id] ? 'Hide Hint' : 'Show Hint'}</span>
                </button>
              </div>

              <p className="text-sm font-medium text-[#0F172A] dark:text-[#E6EDF7]">{q.question}</p>

              {showHints[q.id] && (
                <div className="p-2.5 rounded-lg bg-[#FBBF24]/10 border border-[#FBBF24]/30 text-xs text-[#D97706] dark:text-[#FBBF24]">
                  Hint: {q.hint}
                </div>
              )}

              {q.type === 'mcq' && q.options ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {q.options.map((opt, optIdx) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setAnswers((a) => ({ ...a, [q.id]: optIdx }));
                        setSubmitted((s) => ({ ...s, [q.id]: true }));
                      }}
                      className={`p-3 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                        answers[q.id] === optIdx
                          ? status === true
                            ? 'border-[#34D399] bg-[#34D399]/10'
                            : 'border-[#F87171] bg-[#F87171]/10'
                          : 'border-[#DDE3EE] dark:border-[#24324F] bg-[#F5F7FB] dark:bg-[#0B1220] hover:border-[#6366F1]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    value={answers[q.id] ?? ''}
                    onChange={(e) => {
                      setAnswers((a) => ({ ...a, [q.id]: e.target.value }));
                      setSubmitted((s) => ({ ...s, [q.id]: false }));
                    }}
                    placeholder={`Enter numeric value ${q.unit ? `(${q.unit})` : ''}`}
                    className="w-52 px-3 py-1.5 text-xs font-mono rounded-lg border border-[#DDE3EE] dark:border-[#24324F] bg-[#F5F7FB] dark:bg-[#0B1220]"
                  />
                  <button
                    type="button"
                    onClick={() => setSubmitted((s) => ({ ...s, [q.id]: true }))}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#6366F1] text-white cursor-pointer"
                  >
                    Submit Answer
                  </button>
                </div>
              )}

              {status !== null && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                    status
                      ? 'bg-[#34D399]/10 border border-[#34D399]/30 text-[#059669] dark:text-[#34D399]'
                      : 'bg-[#F87171]/10 border border-[#F87171]/30 text-[#DC2626] dark:text-[#F87171]'
                  }`}
                >
                  {status ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold">{status ? 'Correct! ' : 'Incorrect. '}</span>
                    <span className="text-[#0F172A] dark:text-[#E6EDF7]">{q.explanation}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const PresentationView: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [started, setStarted] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);

  const slide = PRESENTATION_SLIDES[slideIdx];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!started) return;
      if (e.key === 'ArrowRight') setSlideIdx((i) => Math.min(PRESENTATION_SLIDES.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setSlideIdx((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started]);

  const slideData = useMemo(() => {
    const p: AMParameters = { ...DEFAULT_AM_PARAMETERS, ...slide.visualPreset, numSamples: 1024 };
    const mod = performAMModulation(p);
    const spec = computeTheoreticalSpectrum(p);
    const pwr = computeAMPower(p.Ac, mod.mu, p.loadResistance);
    return { p, mod, spec, pwr };
  }, [slide]);

  if (!started) {
    return (
      <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-8 max-w-3xl mx-auto text-center space-y-5">
        <h2 className="text-2xl font-bold text-[#0F172A] dark:text-[#E6EDF7]">
          Oral Presentation Mode: Conventional AM
        </h2>
        <p className="text-sm text-[#5B6B86] dark:text-[#8FA3C2]">
          A 9-slide structured engineering briefing with live synchronized waveform plots, KaTeX equations, and concise talking points for classroom or seminar delivery.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left text-xs">
          {PRESENTATION_SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSlideIdx(i);
                setStarted(true);
              }}
              className="p-3 rounded-lg border border-[#DDE3EE] dark:border-[#24324F] bg-[#F5F7FB] dark:bg-[#0B1220] hover:border-[#6366F1] cursor-pointer"
            >
              <div className="font-mono text-[#6366F1]">Slide {s.id}</div>
              <div className="font-semibold text-[#0F172A] dark:text-[#E6EDF7] mt-0.5 truncate">
                {s.title}
              </div>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setSlideIdx(0);
            setStarted(true);
          }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#6366F1] text-white font-semibold text-sm hover:bg-[#4F46E5] cursor-pointer"
        >
          <Play className="w-4 h-4" />
          <span>Start Presentation</span>
        </button>
      </div>
    );
  }

  const tMs = slideData.mod.t.map((v) => v * 1000);

  return (
    <div className="rounded-xl border border-[#DDE3EE] dark:border-[#24324F] bg-white dark:bg-[#111A2E] p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#DDE3EE] dark:border-[#24324F]">
        <div>
          <div className="text-xs font-mono text-[#6366F1]">
            Slide {slide.id} of {PRESENTATION_SLIDES.length}
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#E6EDF7]">{slide.title}</h2>
          <p className="text-xs text-[#5B6B86] dark:text-[#8FA3C2]">{slide.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={slideIdx === 0}
            onClick={() => setSlideIdx((i) => Math.max(0, i - 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#DDE3EE] dark:border-[#24324F] disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          <button
            type="button"
            disabled={slideIdx === PRESENTATION_SLIDES.length - 1}
            onClick={() => setSlideIdx((i) => Math.min(PRESENTATION_SLIDES.length - 1, i + 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#6366F1] text-white disabled:opacity-40 cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setStarted(false)}
            className="px-3 py-1.5 rounded-lg text-xs text-[#5B6B86] dark:text-[#8FA3C2] hover:text-[#0F172A] dark:hover:text-[#E6EDF7] cursor-pointer"
          >
            Overview
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-xl bg-[#F5F7FB] dark:bg-[#0B1220] border border-[#DDE3EE] dark:border-[#24324F]">
            <MathTex block latex={slide.equation} />
          </div>
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-[#0F172A] dark:text-[#E6EDF7]">
              Key Talking Points
            </div>
            <ul className="space-y-2.5 text-sm text-[#5B6B86] dark:text-[#8FA3C2]">
              {slide.talkingPoints.map((pt) => (
                <li key={pt} className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#6366F1] shrink-0" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-7">
          {slide.visualFocus === 'spectrum' || slide.visualFocus === 'bandwidth' ? (
            <PlotlyChart
              title="Spectral Representation"
              data={[
                {
                  x: slideData.spec.map((c) => c.frequency / 1000),
                  y: slideData.spec.map((c) => c.amplitude),
                  type: 'bar',
                  width: 1.5,
                  marker: { color: ['#22D3EE', '#A78BFA', '#F472B6'] },
                  name: 'Components',
                },
              ]}
              height={320}
              isDark={isDark}
              exportFileName={`amlab-slide-${slide.id}`}
              layout={{
                xaxis: { title: { text: 'Frequency (kHz)' } },
                yaxis: { title: { text: 'Amplitude (V)' } },
              }}
            />
          ) : slide.visualFocus === 'power' ? (
            <PlotlyChart
              title="Power Allocation (μ = 0.5 vs μ = 1.0)"
              data={[
                {
                  labels: ['Carrier Power', 'Upper Sideband', 'Lower Sideband'],
                  values: [slideData.pwr.Pc, slideData.pwr.PUSB, slideData.pwr.PLSB],
                  type: 'pie',
                  hole: 0.45,
                  marker: { colors: ['#A78BFA', '#F472B6', '#22D3EE'] },
                },
              ]}
              height={320}
              isDark={isDark}
              exportFileName={`amlab-slide-${slide.id}`}
              layout={{ xaxis: { visible: false }, yaxis: { visible: false } }}
            />
          ) : (
            <PlotlyChart
              title={
                slide.visualFocus === 'index-compare'
                  ? 'Overmodulated Waveform (μ = 1.5)'
                  : 'Conventional AM Waveform & Envelope'
              }
              data={[
                {
                  x: tMs,
                  y: slideData.mod.s,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'AM s(t)',
                  line: { color: slide.visualFocus === 'index-compare' ? '#F87171' : '#34D399', width: 1.4 },
                },
                {
                  x: tMs,
                  y: slideData.mod.upperEnvelope,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'Upper Envelope',
                  line: { color: '#FBBF24', width: 2.2, dash: 'dash' },
                },
                {
                  x: tMs,
                  y: slideData.mod.lowerEnvelope,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'Lower Envelope',
                  line: { color: '#FBBF24', width: 1.8, dash: 'dot' },
                },
              ]}
              height={320}
              isDark={isDark}
              exportFileName={`amlab-slide-${slide.id}`}
              layout={{
                xaxis: { title: { text: 'Time (ms)' } },
                yaxis: { title: { text: 'Voltage (V)' } },
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
