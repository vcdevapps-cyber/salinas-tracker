import React, { useState, useEffect } from 'react';
import { AppView } from './types';
import { NewsSection } from './components/NewsSection';
import { ExploreSection } from './components/ExploreSection';
import { ChatSection } from './components/ChatSection';

// Add type for the global window object
declare global {
  interface Window {
    deferredPrompt: any;
  }
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.NEWS);
  const [showInfo, setShowInfo] = useState(false);
  const [installable, setInstallable] = useState(false);

  useEffect(() => {
    // Check if install prompt is available
    if (window.deferredPrompt) {
      setInstallable(true);
    }
    // Also listen for the event in case it fires after mount
    const handleBeforeInstall = () => setInstallable(true);
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = window.deferredPrompt;
    if (!promptEvent) return;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      setInstallable(false);
    }
    window.deferredPrompt = null;
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.NEWS:
        return <NewsSection />;
      case AppView.EXPLORE:
        return <ExploreSection />;
      case AppView.CHAT:
        return <ChatSection />;
      default:
        return <NewsSection />;
    }
  };

  const NavButton: React.FC<{ view: AppView; icon: string; label: string }> = ({ view, icon, label }) => {
    const isActive = currentView === view;
    return (
      <button 
        onClick={() => setCurrentView(view)}
        className={`flex flex-col items-center justify-center w-full py-2 transition-colors duration-200 ${
          isActive ? 'text-cyan-600' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <div className={`text-xl mb-1 transition-transform ${isActive ? 'scale-110' : ''}`}>
          <i className={`fas ${icon}`}></i>
        </div>
        <span className="text-[10px] font-medium">{label}</span>
        {isActive && <div className="absolute top-0 h-0.5 w-8 bg-cyan-600 rounded-b-full"></div>}
      </button>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <header className="flex-none bg-white border-b border-slate-200 px-4 py-3 shadow-sm z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <i className="fas fa-water text-white text-xs"></i>
            </div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">
              Salinas<span className="text-cyan-600">Tracker</span>
            </h1>
          </div>
          <button 
            onClick={() => setShowInfo(true)}
            className="text-slate-400 hover:text-cyan-600 transition-colors p-2"
            aria-label="Sobre o App"
          >
            <i className="fas fa-info-circle text-xl"></i>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative w-full max-w-2xl mx-auto bg-slate-50">
        {renderView()}
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-none bg-white border-t border-slate-200 pb-safe z-20">
        <div className="max-w-2xl mx-auto flex justify-between relative">
          <NavButton view={AppView.NEWS} icon="fa-rss" label="Notícias" />
          <NavButton view={AppView.EXPLORE} icon="fa-map-marked-alt" label="Explorar" />
          <NavButton view={AppView.CHAT} icon="fa-comments" label="Concierge" />
        </div>
      </nav>
      
      {/* Safe area padding for iPhones without home button */}
      <div className="h-safe-bottom bg-white"></div>

      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 relative animate-scale-up border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowInfo(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
            
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                <i className="fas fa-robot"></i>
              </div>
              <h2 className="text-xl font-bold text-slate-800">Como funciona?</h2>
            </div>

            <div className="space-y-4 text-sm text-slate-600 leading-relaxed mb-6">
              <p>
                O <strong>SalinasTracker</strong> é impulsionado por Inteligência Artificial (Google Gemini) em tempo real.
              </p>
              
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <h3 className="font-semibold text-slate-800 mb-1"><i className="fas fa-search text-cyan-500 mr-2"></i>Rastreamento Web</h3>
                <p>Nossa IA varre o Diário Oficial, blogs locais e portais de notícias para trazer informações atualizadas na hora.</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <h3 className="font-semibold text-slate-800 mb-1"><i className="fas fa-save text-cyan-500 mr-2"></i>Modo Offline</h3>
                <p>Quando você acessa sem internet, mostramos as últimas informações salvas na memória do seu dispositivo.</p>
              </div>
            </div>

            {/* Install Button - Only shows if PWA install is ready */}
            {installable && (
              <button 
                onClick={handleInstallClick}
                className="w-full mb-3 bg-gradient-to-r from-slate-800 to-slate-700 text-white font-semibold py-3 rounded-xl hover:from-slate-700 hover:to-slate-600 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <i className="fas fa-download"></i> Instalar App no Celular
              </button>
            )}

            <button 
              onClick={() => setShowInfo(false)}
              className="w-full bg-cyan-600 text-white font-semibold py-3 rounded-xl hover:bg-cyan-700 transition-colors shadow-md shadow-cyan-200"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;