import React, { useState, useEffect } from 'react';
import { SubmitForm } from './components/SubmitForm';
import { TrackingView } from './components/TrackingView';
import { AdminPanel } from './components/AdminPanel';
import { initStorage } from './store';
import { ShieldCheck, MessageSquarePlus, Activity, Shield, Globe, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LanguageProvider, useLanguage, Language } from './i18n';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'submit' | 'track' | 'admin'>('submit');
  const [trackRef, setTrackRef] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ username: string; email: string; name: string } | null>(null);
  const { t, language, setLanguage } = useLanguage();

  useEffect(() => {
    initStorage();
  }, []);

  const navigateToTrack = (id: string) => {
    setTrackRef(id);
    setActiveTab('track');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col print:bg-white">
      {/* Header */}
      <header className="bg-slate-900 border-b-4 border-emerald-600 sticky top-0 z-50 print:hidden">
        <div className="max-w-[1600px] xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight uppercase">{t('app.title')}</h1>
                <p className="text-xs text-slate-400 font-medium">{t('app.subtitle')}</p>
              </div>
            </div>

            {/* Navigation Desktop */}
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
                <button 
                  onClick={() => setActiveTab('submit')}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 
                    ${activeTab === 'submit' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                >
                  <MessageSquarePlus className="w-4 h-4" /> {t('nav.log')}
                </button>
                <button 
                  onClick={() => setActiveTab('track')}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 
                    ${activeTab === 'track' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                >
                  <Activity className="w-4 h-4" /> {t('nav.track')}
                </button>
                <div className="w-px h-6 bg-slate-700 mx-1 border-none" />
                {isAuthenticated ? (
                  <button 
                    onClick={() => {
                      setIsAuthenticated(false);
                      setCurrentUser(null);
                      setActiveTab('submit');
                    }}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 bg-rose-600/25 hover:bg-rose-600 text-rose-200 hover:text-white shadow border border-rose-500/30 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> {t('nav.logout')}
                  </button>
                ) : (
                  <button 
                    onClick={() => setActiveTab('admin')}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 
                      ${activeTab === 'admin' ? 'bg-emerald-600 text-white shadow' : 'text-emerald-500 hover:bg-emerald-900/30'}`}
                  >
                    <Shield className="w-4 h-4" /> {t('nav.admin')}
                  </button>
                )}
              </nav>

              {/* Language Switcher */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-700 hover:text-white transition-colors">
                  <Globe className="w-4 h-4" />
                  <span className="uppercase">{language}</span>
                </button>
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-50">
                  <button 
                    onClick={() => setLanguage('en')}
                    className={`block w-full text-left px-4 py-2 text-sm ${language === 'en' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    English (EN)
                  </button>
                  <button 
                    onClick={() => setLanguage('sw')}
                    className={`block w-full text-left px-4 py-2 text-sm ${language === 'sw' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    Swahili (SW)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1600px] xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full print:p-0 print:block">
        <AnimatePresence mode="wait">
          {activeTab === 'submit' && (
            <motion.div key="submit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} >
               <SubmitForm onDivertTracker={navigateToTrack} />
            </motion.div>
          )}

          {activeTab === 'track' && (
            <motion.div key="track" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} >
               <TrackingView initialTrackingId={trackRef} />
            </motion.div>
          )}

          {activeTab === 'admin' && (
            <motion.div key="admin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-[calc(100vh-140px)] min-h-[600px]">
               <AdminPanel 
                 isAuthenticated={isAuthenticated}
                 setIsAuthenticated={setIsAuthenticated}
                 currentUser={currentUser}
                 setCurrentUser={setCurrentUser}
               />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
