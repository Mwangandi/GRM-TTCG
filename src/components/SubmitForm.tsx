import React, { useState, useEffect } from 'react';
import { addGrievance } from '../store';
import { Category, Attachment } from '../types';
import { motion } from 'motion/react';
import { CheckCircle2, Copy, Sparkles, Loader2, Paperclip, Camera, X } from 'lucide-react';
import { useLanguage } from '../i18n';

export function SubmitForm({ onDivertTracker }: { onDivertTracker: (id: string) => void }) {
  const { t } = useLanguage();
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);

  const [wards, setWards] = useState<string[]>([]);
  const [isLoadingWards, setIsLoadingWards] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchWards = async () => {
      setIsLoadingWards(true);
      try {
        const response = await fetch('/api/wards');
        const data = await response.json();
        if (isMounted && data && Array.isArray(data.wards)) {
          const sorted = [...data.wards].sort((a, b) => a.localeCompare(b));
          setWards(sorted);
        }
      } catch (err) {
        console.error("Failed to load wards:", err);
      } finally {
        if (isMounted) {
          setIsLoadingWards(false);
        }
      }
    };
    fetchWards();
    return () => {
      isMounted = false;
    };
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    gender: '' as any,
    idNumber: '',
    ward: '',
    phone: '',
    category: 'General Complaint' as Category,
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Urgent',
    description: '',
    previousAction: '',
    attachments: [] as Attachment[],
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file: File) => ({
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file), // Using object URL for preview and simulated storage
      }));
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...newFiles]
      }));
    }
  };

  const removeAttachment = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newG = addGrievance({
      ...formData,
      isAnonymous,
      channel: 'Portal'
    });
    setSubmittedId(newG.id);
  };

  const getAdvice = async () => {
    if (!formData.description || formData.description.length < 10) {
      alert("Please enter a longer description first to get relevant advice.");
      return;
    }
    
    setIsLoadingAdvice(true);
    setAiAdvice(null);
    try {
      const res = await fetch("/api/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: formData.category, description: formData.description })
      });
      const data = await res.json();
      if (data.advice) {
        setAiAdvice(data.advice);
      } else {
        setAiAdvice("Could not retrieve advice.");
      }
    } catch (err) {
      setAiAdvice("An error occurred while connecting to the assistant.");
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  if (submittedId) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto p-8 bg-white border border-emerald-100 rounded-xl shadow-sm text-center"
      >
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">{t('submit.success')}</h2>
        <p className="text-slate-600 mb-6">{t('submit.success_desc')}</p>
        
        <div className="bg-slate-50 p-6 rounded-lg mb-8 inline-block w-full max-w-sm border border-slate-200">
          <p className="text-sm text-slate-500 font-medium mb-1 uppercase tracking-wider">{t('submit.tracking_no')}</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-mono font-bold text-emerald-700">{submittedId}</span>
            <button 
              onClick={() => navigator.clipboard.writeText(submittedId)}
              className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
              title="Copy to clipboard"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-8 max-w-md mx-auto">
          {t('submit.save_tracking')}
        </p>

        <button 
          onClick={() => onDivertTracker(submittedId)}
          className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-all shadow-sm"
        >
          {t('submit.track_btn')}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden"
    >
      <div className="bg-slate-50 border-b border-slate-100 p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-slate-800">{t('submit.title')}</h2>
        <p className="text-slate-500 mt-2">{t('submit.subtitle')}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
        {/* Anonymity Toggle */}
        <div className="flex items-start gap-4 p-4 bg-amber-50/50 border border-amber-100 rounded-lg">
          <input 
            type="checkbox" 
            id="anonymous"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
          />
          <div>
            <label htmlFor="anonymous" className="font-medium text-slate-800 block mb-1">{t('submit.anonymous')}</label>
            <p className="text-sm text-slate-600">{t('submit.anonymous_desc')}</p>
          </div>
        </div>

        {/* Complainant Details */}
        {!isAnonymous && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-800 border-b border-slate-100 pb-2">{t('submit.complainant')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('submit.name')}</label>
                <input 
                  type="text" 
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('submit.id')}</label>
                <input 
                  type="text" 
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  value={formData.idNumber}
                  onChange={e => setFormData({...formData, idNumber: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('submit.phone')}</label>
                <input 
                  type="tel" 
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('submit.gender')}</label>
                <select 
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                  value={formData.gender}
                  onChange={e => setFormData({...formData, gender: e.target.value as any})}
                >
                  <option value="">{t('submit.select_gender')}</option>
                  <option value="Male">{t('submit.male')}</option>
                  <option value="Female">{t('submit.female')}</option>
                  <option value="Other">{t('submit.other')}</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Grievance Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-800 border-b border-slate-100 pb-2">{t('submit.details')}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('submit.ward')}</label>
              <select 
                required
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                value={formData.ward}
                onChange={e => setFormData({...formData, ward: e.target.value})}
                disabled={isLoadingWards}
              >
                <option value="">{isLoadingWards ? "Loading Wards from server-side..." : t('submit.select_ward')}</option>
                {wards.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
              {!isLoadingWards && wards.length === 0 && (
                <span className="text-[10px] text-rose-500 mt-1 block">
                  Could not load wards. Ensure the server-side API is fully online and accessible.
                </span>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('submit.nature')}</label>
              <select 
                required
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white font-medium"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value as Category})}
              >
                <option value="General Complaint">{t('submit.general')}</option>
                <option value="Service Delay">{t('submit.service')}</option>
                <option value="Corruption">{t('submit.corruption')}</option>
                <option value="GBV">{t('submit.gbv')}</option>
                <option value="Emergency">{t('submit.emergency')}</option>
                <option value="Compliment">{t('submit.compliment')}</option>
                <option value="Suggestion">{t('submit.suggestion')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority Level</label>
              <select 
                required
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white font-medium"
                value={formData.priority}
                onChange={e => setFormData({...formData, priority: e.target.value as any})}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('submit.desc_label')}</label>
            <p className="text-xs text-slate-500 mb-2">{t('submit.desc_hint')}</p>
            <textarea 
              required
              rows={4}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-y"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Provide as much detail as possible..."
            />
            <div className="mt-3 flex flex-col md:flex-row md:items-start gap-4">
              <button 
                type="button" 
                onClick={getAdvice}
                disabled={isLoadingAdvice}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg font-medium text-sm shadow-sm hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isLoadingAdvice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {t('submit.get_advice')}
              </button>
              {aiAdvice && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-lg w-full">
                  <div className="flex gap-2 items-start text-indigo-900 text-sm">
                    <Sparkles className="w-4 h-4 min-w-[16px] mt-0.5" />
                    <div>
                      <p className="font-semibold mb-1">AI Assistant Feedback</p>
                      <p className="leading-relaxed">{aiAdvice}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('submit.prev_action')}</label>
            <p className="text-xs text-slate-500 mb-2">{t('submit.prev_hint')}</p>
            <textarea 
              rows={2}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-y"
              value={formData.previousAction}
              onChange={e => setFormData({...formData, previousAction: e.target.value})}
            />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="block text-sm font-medium text-slate-700 mb-1">Evidentiary Attachments</label>
            <p className="text-xs text-slate-500 mb-4">Attach photos, documents, or multiple files for evidence.</p>
            
            <div className="flex flex-wrap gap-4 mb-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors text-sm font-medium shadow-sm">
                <Camera className="w-4 h-4 text-slate-500" />
                Capture Photo
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="hidden" 
                  onChange={handleFileUpload}
                  multiple
                />
              </label>

              <label className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors text-sm font-medium shadow-sm">
                <Paperclip className="w-4 h-4 text-slate-500" />
                Attach Files
                <input 
                  type="file" 
                  accept="image/*,application/pdf,.doc,.docx" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  multiple
                />
              </label>
            </div>

            {formData.attachments.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {formData.attachments.map((file, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-50 aspect-square flex flex-col items-center justify-center text-center p-2">
                    {file.type.startsWith('image/') ? (
                      <img src={file.url} alt={file.name} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <Paperclip className="w-8 h-8 mb-2" />
                        <span className="text-xs truncate w-full px-2" title={file.name}>{file.name}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="bg-rose-500 text-white p-2 rounded-full hover:bg-rose-600 transition-colors"
                        title="Remove attachment"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button 
            type="submit"
            className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-all shadow-sm"
          >
            {t('submit.submit_btn')}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
