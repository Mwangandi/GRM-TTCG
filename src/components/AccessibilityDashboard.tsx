import React, { useState } from 'react';
import { Accessibility, Loader2, CheckCircle2, AlertTriangle, ShieldCheck, PlayCircle } from 'lucide-react';
import { motion } from 'motion/react';

export function AccessibilityDashboard() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<null | any>(null);

  const runAudit = () => {
    setIsRunning(true);
    setProgress(0);
    setResults(null);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          setResults({
            score: 98,
            passed: 42,
            warnings: 2,
            failed: 0,
            checks: [
              { label: 'Color Contrast (WCAG AA)', status: 'passed' },
              { label: 'ARIA Attributes & Roles', status: 'passed' },
              { label: 'Keyboard Navigation & Focus', status: 'passed' },
              { label: 'Screen Reader Alt Text', status: 'warning', note: '2 decorative icons missing explicit alt text descriptions in legacy uploads.' },
              { label: 'Form Input Labels & Grouping', status: 'passed' }
            ]
          });
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 300);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8 w-full h-full">
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-slate-100 pb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                <Accessibility className="w-6 h-6 text-indigo-600" />
                WCAG Accessibility Scanner
              </h2>
              <p className="text-slate-500 mt-2 text-sm">Simulated compliance check ensuring the public-facing GRM portal is usable by all citizens.</p>
            </div>
            <button 
              onClick={runAudit}
              disabled={isRunning || progress === 100}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap"
            >
              {isRunning ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
              {isRunning ? 'Running Scan...' : 'Run Accessibility Audit'}
            </button>
          </div>

          {isRunning && (
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-medium text-slate-600 mb-2">
                <span>Scanning application components...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="bg-indigo-600 h-full rounded-full"
                />
              </div>
              <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-emerald-400 mt-6 h-32 overflow-hidden flex flex-col justify-end border border-slate-800">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-1">
                  {progress > 5 && <p className="opacity-80">&gt; Initializing simulated WCAG engine...</p>}
                  {progress > 10 && <p>&gt; Checking SubmitForm.tsx contrast ratios...</p>}
                  {progress > 30 && <p>&gt; Validating ARIA roles in TrackingView.tsx...</p>}
                  {progress > 50 && <p>&gt; Simulating keyboard navigation paths...</p>}
                  {progress > 70 && <p>&gt; Analyzing multi-language context tags (i18n)...</p>}
                  {progress > 90 && <p>&gt; Generating compliance report...</p>}
                </motion.div>
              </div>
            </div>
          )}

          {results && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center shadow-sm">
                  <div className="text-3xl font-bold text-indigo-600 mb-1">{results.score}/100</div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Score</div>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center shadow-sm">
                  <div className="text-3xl font-bold text-emerald-600 mb-1">{results.passed}</div>
                  <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Passed Checks</div>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center shadow-sm">
                  <div className="text-3xl font-bold text-amber-600 mb-1">{results.warnings}</div>
                  <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Warnings</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center shadow-sm">
                  <div className="text-3xl font-bold text-slate-400 mb-1">{results.failed}</div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Failed Checks</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-slate-800 mb-4">Detailed Check Results</h3>
                {results.checks.map((check: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex-col md:flex-row md:items-center">
                    <div className="flex items-center gap-3 w-full">
                      {check.status === 'passed' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-800">{check.label}</h4>
                        {check.note && <p className="text-sm text-slate-500 mt-1">{check.note}</p>}
                      </div>
                      <span className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${check.status === 'passed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {check.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {!isRunning && !results && (
            <div className="text-center py-16 text-slate-400">
              <ShieldCheck className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Click "Run Accessibility Audit" to begin the compliance check</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
