import React, { useState } from 'react';
import { getGrievances, updateGrievance } from '../store';
import { Grievance } from '../types';
import { Search, Loader2, CheckCircle2, ChevronRight, ChevronLeft, AlertCircle, FileText, Download, X, Printer, Paperclip } from 'lucide-react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import { GrievanceMap } from './GrievanceMap';
import { useLanguage } from '../i18n';

export function TrackingView({ initialTrackingId = '' }: { initialTrackingId?: string }) {
  const { t } = useLanguage();
  const [trackId, setTrackId] = useState(initialTrackingId);
  const [result, setResult] = useState<Grievance | null | undefined>(undefined);
  const [searchResults, setSearchResults] = useState<Grievance[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{ level: 'first' | 'appeal' } | null>(null);
  const [feedbackData, setFeedbackData] = useState<{ satisfaction: 'Satisfied' | 'Not Satisfied' | '', comment: string }>({ satisfaction: '', comment: '' });

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!trackId.trim()) return;
    
    setIsSearching(true);
    setResult(undefined);
    setSearchResults(null);

    // Simulate network delay
    setTimeout(() => {
      const query = trackId.trim().toLowerCase();
      const grievances = getGrievances();
      const found = grievances.filter(g => 
        g.id.toLowerCase() === query || 
        (g.name && g.name.toLowerCase().includes(query)) ||
        (g.phone && g.phone.includes(query))
      );

      if (found.length === 1) {
        setResult(found[0]);
      } else if (found.length > 1) {
        setSearchResults(found);
      } else {
        setResult(null);
      }
      setIsSearching(false);
    }, 600);
  };

  React.useEffect(() => {
    if (initialTrackingId) {
      handleSearch();
    }
  }, [initialTrackingId]);

  React.useEffect(() => {
    const handleSync = () => {
      if (trackId.trim()) {
        const query = trackId.trim().toLowerCase();
        const grievances = getGrievances();
        const found = grievances.filter(g => 
          g.id.toLowerCase() === query || 
          (g.name && g.name.toLowerCase().includes(query)) ||
          (g.phone && g.phone.includes(query))
        );
        if (found.length === 1) {
          setResult(found[0]);
        } else if (found.length > 1) {
          setSearchResults(found);
        }
      }
    };
    window.addEventListener('grievances_synced', handleSync);
    return () => {
      window.removeEventListener('grievances_synced', handleSync);
    };
  }, [trackId]);

  React.useEffect(() => {
    if (result) {
      if (result.resolutionSummary && !result.citizenSatisfaction) {
        const timer = setTimeout(() => openFeedback('first'), 800);
        return () => clearTimeout(timer);
      } else if (result.appealResolutionSummary && result.citizenSatisfaction === 'Not Satisfied' && !result.appealSatisfaction) {
        const timer = setTimeout(() => openFeedback('appeal'), 800);
        return () => clearTimeout(timer);
      }
    }
  }, [result?.id, result?.resolutionSummary, result?.citizenSatisfaction, result?.appealResolutionSummary, result?.appealSatisfaction]);

  const openFeedback = (level: 'first' | 'appeal') => {
    setFeedbackData({ satisfaction: '', comment: '' });
    setFeedbackModal({ level });
  };

  const submitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!result || !feedbackData.satisfaction || !feedbackModal) return;

    const level = feedbackModal.level;
    const satisfaction = feedbackData.satisfaction as 'Satisfied' | 'Not Satisfied';

    if (level === 'first') {
      const nextStatus = satisfaction === 'Satisfied' ? 'Case Closed' : 'Appeal to County GRM';
      updateGrievance(result.id, { 
        citizenSatisfaction: satisfaction,
        citizenComment: feedbackData.comment,
        status: nextStatus,
        resolutionSummary: feedbackData.comment ? `Citizen feedback: ${feedbackData.comment}` : undefined // Ensure a note is passed down 
      });
    } else {
      const nextStatus = satisfaction === 'Satisfied' ? 'Case Closed' : 'External Referral';
      updateGrievance(result.id, { 
        appealSatisfaction: satisfaction,
        citizenComment: feedbackData.comment,
        status: nextStatus,
        resolutionSummary: feedbackData.comment ? `Citizen feedback: ${feedbackData.comment}` : undefined
      });
    }

    const updatedGrid = getGrievances();
    const updatedModel = updatedGrid.find(g => g.id === result.id);
    if (updatedModel) {
      setResult(updatedModel);
    }
    
    setFeedbackModal(null);
  };

  const handleDownloadPDF = () => {
    if (!result) return;
    
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(16);
    doc.text('Taita Taveta County GRM - Grievance Report', 14, 22);
    
    // Details
    doc.setFontSize(12);
    doc.text(`Tracking Number: ${result.id}`, 14, 32);
    doc.text(`Status: ${result.status}`, 14, 40);
    doc.text(`Date Submitted: ${new Date(result.dateSubmitted).toLocaleString()}`, 14, 48);
    
    doc.text(`Category: ${result.category}`, 14, 60);
    doc.text(`Department: ${result.assignedDepartment || 'Pending Assignment'}`, 14, 68);
    if (result.assignedStaff) {
      doc.text(`Staff: ${result.assignedStaff}`, 14, 76);
    }
    
    doc.text('Description:', 14, 86);
    const splitDesc = doc.splitTextToSize(result.description, 180);
    doc.text(splitDesc, 14, 94);
    
    let y = 94 + (splitDesc.length * 6);
    
    if (result.resolutionSummary) {
      y += 10;
      doc.text('Resolution Progress (Action & Resolution):', 14, y);
      y += 8;
      const splitRes = doc.splitTextToSize(result.resolutionSummary, 180);
      doc.text(splitRes, 14, y);
      y += (splitRes.length * 6);
    }
    
    if (result.appealResolutionSummary) {
      y += 10;
      doc.text('Appeal Resolution:', 14, y);
      y += 8;
      const splitApp = doc.splitTextToSize(result.appealResolutionSummary, 180);
      doc.text(splitApp, 14, y);
      y += (splitApp.length * 6);
    }
    
    if (result.citizenSatisfaction) {
      y += 10;
      doc.text(`Citizen Satisfaction: ${result.citizenSatisfaction}`, 14, y);
    }
    
    if (result.appealSatisfaction) {
      y += 8;
      doc.text(`Appeal Satisfaction: ${result.appealSatisfaction}`, 14, y);
    }
    
    doc.save(`${result.id}_Report.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Search Header */}
      <div className="bg-slate-900 rounded-2xl p-8 shadow-sm text-center print:hidden">
        <h2 className="text-2xl font-bold text-white mb-2">{t('track.title')}</h2>
        <p className="text-slate-400 mb-8 max-w-lg mx-auto">{t('track.subtitle')}</p>
        
        <form onSubmit={handleSearch} className="max-w-xl mx-auto relative flex items-center">
          <Search className="w-5 h-5 absolute left-4 text-slate-400" />
          <input 
            type="text" 
            placeholder={t('track.placeholder')}
            className="w-full pl-12 pr-32 py-4 rounded-xl border-none ring-2 ring-transparent focus:ring-emerald-500 bg-white/10 text-white placeholder-slate-400 outline-none text-base tracking-wide"
            value={trackId}
            onChange={e => setTrackId(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={isSearching || !trackId}
            className="absolute right-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-white rounded-lg font-medium transition-colors"
          >
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : t('track.button')}
          </button>
        </form>
      </div>

      {/* Result Area */}
      {result === null && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 text-center bg-white rounded-xl border border-rose-100">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800">{t('track.no_records')}</h3>
          <p className="text-slate-500 mt-2">{t('track.no_records_desc')}</p>
        </motion.div>
      )}

      {/* Multiple Results List */}
      {searchResults && !result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 px-2">Multiple grievances found. Please select one:</h3>
          {searchResults.map(g => (
            <div 
              key={g.id} 
              onClick={() => setResult(g)}
              className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-300 hover:shadow-md cursor-pointer transition-all flex flex-col md:flex-row justify-between md:items-center gap-4"
            >
              <div>
                <span className="font-mono font-bold text-slate-800">{g.id}</span>
                <p className="text-slate-600 font-medium text-sm mt-1">{g.category}</p>
                {g.name && <p className="text-slate-500 text-xs mt-1">Submitted by: {g.name}</p>}
              </div>
              <div className="text-left md:text-right">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold
                  ${['Case Closed'].includes(g.status) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {g.status}
                </span>
                <p className="text-xs text-slate-400 mt-2">{new Date(g.dateSubmitted).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Single Result Viewer */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-none print:bg-white print:m-0 print:p-0">
          
          {searchResults && searchResults.length > 1 && (
            <button 
              onClick={() => setResult(undefined)} 
              className="flex items-center gap-2 px-6 py-4 text-sm font-medium text-slate-500 hover:text-emerald-700 bg-slate-50 border-b border-slate-100 w-full text-left transition-colors print:hidden"
            >
               <ChevronLeft className="w-4 h-4" /> Back to Search Results
            </button>
          )}

          <div className="p-6 md:p-8 bg-slate-50 border-b border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-sm font-medium text-emerald-600 mb-1">Grievance Record</p>
                <div className="flex items-center gap-4 print:hidden">
                  <h3 className="text-2xl font-mono font-bold text-slate-800">{result.id}</h3>
                  <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200">
                    <Download className="w-4 h-4" /> Export PDF
                  </button>
                  <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">
                    <Printer className="w-4 h-4" /> Print View
                  </button>
                </div>
                {/* Print Title */}
                <h3 className="text-2xl font-mono font-bold text-slate-800 hidden print:block mb-4">
                  County Grievance Record: {result.id}
                </h3>
              </div>
              <div className="text-left md:text-right">
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium border border-emerald-200 bg-emerald-100 text-emerald-800">
                  Current Status: {result.status}
                </span>
                <p className="text-sm text-slate-500 mt-2">Submitted on {new Date(result.dateSubmitted).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div>
              {(() => {
                const getProgressPercentage = (status: string) => {
                  switch (status) {
                    case 'Logged': return 10;
                    case 'Acknowledged & Sorted': return 25;
                    case 'Under Investigation': return 50;
                    case 'Immediate Resolution':
                    case 'Action & Resolution': return 75;
                    case 'Appeal to County GRM': return 80;
                    case 'Appeal Resolution': return 90;
                    case 'Case Closed':
                    case 'External Referral': return 100;
                    default: return 0;
                  }
                };
                const progress = getProgressPercentage(result.status);
                return (
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                      <span>Resolution Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8 print:block print:space-y-8">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold tracking-wider text-slate-400 uppercase mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Details (TT-GRM-02)
                </h4>
                <div className="bg-slate-50 p-5 rounded-lg space-y-4 border border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500">Category</p>
                    <p className="font-medium text-slate-800">{result.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Department</p>
                    <p className="font-medium text-slate-800">{result.assignedDepartment || 'Pending Assignment'}</p>
                  </div>
                  {result.assignedStaff && (
                    <div>
                      <p className="text-xs text-slate-500">Assigned Staff</p>
                      <p className="font-medium text-slate-800">{result.assignedStaff}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-500">Description Summary</p>
                    <p className="text-sm text-slate-700 mt-1 line-clamp-3">{result.description}</p>
                  </div>
                  {result.attachments && result.attachments.length > 0 && (
                    <div className="pt-2 border-t border-slate-200">
                      <p className="text-xs text-slate-500 mb-2">Attached Evidence</p>
                      <div className="flex flex-wrap gap-2">
                        {result.attachments.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-white border border-slate-200 p-2 rounded max-w-full">
                            {file.type.startsWith('image/') ? (
                                <img src={file.url} alt={file.name} className="w-8 h-8 object-cover rounded" />
                            ) : (
                                <Paperclip className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            )}
                            <span className="text-xs text-slate-600 truncate max-w-[150px]" title={file.name}>{file.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* County Map Visualization */}
              <div className="print:hidden">
                <GrievanceMap activeWard={result.ward} />
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-semibold tracking-wider text-slate-400 uppercase mb-3">Resolution Timeline</h4>
              
              <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pb-4">
                {result.history && result.history.length > 0 ? (
                  result.history.map((event, idx) => (
                    <div key={idx} className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-1 gap-1">
                        <p className="font-medium text-slate-800">{event.status}</p>
                        <span className="text-xs text-slate-400 font-mono">
                          {new Date(event.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{event.note || 'Status updated automatically.'}</p>
                    </div>
                  ))
                ) : (
                  <div className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-300 ring-4 ring-slate-50" />
                    <p className="font-medium text-slate-800">Current Status: {result.status}</p>
                    <p className="text-sm text-slate-500">Detailed historical timeline is not available for this legacy record.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form TT-GRM-04 Loop 1 */}
          {result.resolutionSummary && !result.citizenSatisfaction && (
            <div className="bg-amber-50 p-6 md:p-8 border-t border-amber-100 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
              <div className="max-w-xl">
                <h4 className="text-lg font-semibold text-amber-900 mb-2">Resolution Provided - Action Required (TT-GRM-04)</h4>
                <p className="text-sm text-amber-700">The department has provided a resolution. Please review and provide your feedback to close the case or appeal the decision.</p>
              </div>
              <button 
                onClick={() => openFeedback('first')}
                className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors whitespace-nowrap shadow-sm"
              >
                Provide Feedback
              </button>
            </div>
          )}

          {/* Citizen Feedback View 1 */}
          {result.citizenSatisfaction && (
            <div className="bg-slate-50 p-6 md:p-8 border-t border-slate-100">
                <p className="font-medium text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Initial resolution feedback: 
                  <span className={result.citizenSatisfaction === 'Satisfied' ? 'text-emerald-600' : 'text-rose-600'}>
                    {result.citizenSatisfaction}
                  </span>
                </p>
                {result.citizenComment && (
                  <p className="text-sm text-slate-600 mt-3 p-4 bg-white border border-slate-200 rounded-lg italic text-slate-700 shadow-sm leading-relaxed">"{result.citizenComment}"</p>
                )}
            </div>
          )}

          {/* Form TT-GRM-04 Loop 2 (Appeal Satisfaction) */}
          {result.appealResolutionSummary && result.citizenSatisfaction === 'Not Satisfied' && !result.appealSatisfaction && (
            <div className="bg-rose-50 p-6 md:p-8 border-t border-rose-100 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
              <div className="max-w-xl">
                <h4 className="text-lg font-semibold text-rose-900 mb-2">Appeal Resolution Provided - Action Required</h4>
                <p className="text-sm text-rose-700">The County Main Committee has reviewed your appeal. Please provide your final feedback to complete the process.</p>
              </div>
              <button 
                onClick={() => openFeedback('appeal')}
                className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors whitespace-nowrap shadow-sm"
              >
                Provide Final Feedback
              </button>
            </div>
          )}

          {/* Citizen Feedback View 2 */}
          {result.appealSatisfaction && (
            <div className="bg-slate-50 p-6 md:p-8 border-t border-slate-100">
                <p className="font-medium text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-amber-500" />
                  Appeal resolution feedback: 
                  <span className={result.appealSatisfaction === 'Satisfied' ? 'text-emerald-600' : 'text-rose-600'}>
                    {result.appealSatisfaction}
                  </span>
                </p>
                {result.citizenComment && (
                  <p className="text-sm text-slate-600 mt-3 p-4 bg-white border border-slate-200 rounded-lg italic text-slate-700 shadow-sm leading-relaxed">"{result.citizenComment}"</p>
                )}
            </div>
          )}

        </motion.div>
      )}

      {/* Feedback Modal */}
      {feedbackModal && result && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xl font-semibold text-slate-800">
                {feedbackModal.level === 'first' ? 'Resolution Feedback (TT-GRM-04)' : 'Appeal Feedback'}
              </h3>
              <button onClick={() => setFeedbackModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitFeedback} className="p-6 md:p-8 space-y-8">
              <div>
                <label className="block text-base font-medium text-slate-800 mb-4">Are you satisfied with the provided outcome?</label>
                <div className="flex gap-4">
                  <label className={`flex-1 border-2 rounded-xl p-5 cursor-pointer transition-all ${feedbackData.satisfaction === 'Satisfied' ? 'border-emerald-500 bg-emerald-50 ring-4 ring-emerald-50' : 'border-slate-200 hover:border-emerald-300'}`}>
                    <input type="radio" name="satisfaction" value="Satisfied" className="sr-only" onChange={() => setFeedbackData({...feedbackData, satisfaction: 'Satisfied'})} checked={feedbackData.satisfaction === 'Satisfied'} />
                    <div className="flex flex-col items-center gap-3 text-center">
                      <CheckCircle2 className={`w-10 h-10 ${feedbackData.satisfaction === 'Satisfied' ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className={`font-semibold ${feedbackData.satisfaction === 'Satisfied' ? 'text-emerald-800' : 'text-slate-600'}`}>Yes, I am satisfied</span>
                    </div>
                  </label>
                  <label className={`flex-1 border-2 rounded-xl p-5 cursor-pointer transition-all ${feedbackData.satisfaction === 'Not Satisfied' ? 'border-rose-500 bg-rose-50 ring-4 ring-rose-50' : 'border-slate-200 hover:border-rose-300'}`}>
                    <input type="radio" name="satisfaction" value="Not Satisfied" className="sr-only" onChange={() => setFeedbackData({...feedbackData, satisfaction: 'Not Satisfied'})} checked={feedbackData.satisfaction === 'Not Satisfied'} />
                    <div className="flex flex-col items-center gap-3 text-center">
                      <AlertCircle className={`w-10 h-10 ${feedbackData.satisfaction === 'Not Satisfied' ? 'text-rose-600' : 'text-slate-400'}`} />
                      <span className={`font-semibold ${feedbackData.satisfaction === 'Not Satisfied' ? 'text-rose-800' : 'text-slate-600'}`}>No, I am not satisfied</span>
                    </div>
                  </label>
                </div>
              </div>

              {feedbackData.satisfaction && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                  <label className="block text-sm font-medium text-slate-800">
                    Additional Comments <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    {feedbackData.satisfaction === 'Not Satisfied' && feedbackModal.level === 'first' ? 'Please explain why you are not satisfied so the County GRM Committee can review your appeal.' : 'Leave any additional feedback for our records.'}
                  </p>
                  <textarea 
                    rows={4} 
                    className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-y text-slate-700 bg-slate-50"
                    placeholder="Type your feedback here..."
                    value={feedbackData.comment}
                    onChange={e => setFeedbackData({...feedbackData, comment: e.target.value})}
                  ></textarea>
                </motion.div>
              )}

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setFeedbackModal(null)} className="px-6 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={!feedbackData.satisfaction} className="px-8 py-3 bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm text-lg">
                  Submit Feedback
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  )
}
