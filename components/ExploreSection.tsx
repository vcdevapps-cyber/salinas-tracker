import React, { useEffect, useState } from 'react';
import { SearchResult } from '../types';
import { fetchTourismHighlights } from '../services/geminiService';
import { MarkdownRenderer } from './MarkdownRenderer';

export const ExploreSection: React.FC = () => {
  const [data, setData] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const load = async () => {
    setLoading(true);
    setIsOffline(false);
    try {
      const result = await fetchTourismHighlights();
      setData(result);
      localStorage.setItem('salinas_explore_cache', JSON.stringify({
        data: result,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error("Network error, loading cache:", error);
      const cached = localStorage.getItem('salinas_explore_cache');
      if (cached) {
        const { data: cachedData } = JSON.parse(cached);
        setData(cachedData);
        setIsOffline(true);
      } else {
        setData({ text: "Não foi possível carregar o guia. Verifique sua conexão.", sources: [] });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load cache initially
    const cached = localStorage.getItem('salinas_explore_cache');
    if (cached) {
      const { data: cachedData } = JSON.parse(cached);
      setData(cachedData);
    }
    load();
  }, []);

  return (
    <div className="pb-24 pt-4 px-0 max-w-2xl mx-auto h-full overflow-y-auto">
      <div className="relative h-48 mb-6 bg-cyan-800 overflow-hidden shadow-lg mx-4 rounded-2xl">
        <img 
          src="https://picsum.photos/800/400?grayscale&blur=2" 
          alt="Salinas Background" 
          className="w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-cyan-900/90 to-transparent">
          <h1 className="text-3xl font-bold text-white mb-1">Explore Salinas</h1>
          <p className="text-cyan-100 text-sm">O paraíso do recôncavo baiano</p>
        </div>
      </div>

      <div className="px-4">
        {isOffline && (
          <div className="mb-4 p-3 bg-amber-50 text-amber-700 rounded-lg text-sm border border-amber-200 flex items-center">
            <i className="fas fa-wifi-slash mr-2"></i>
            <span>Modo Offline: Guia salvo.</span>
          </div>
        )}

        {loading && !data ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
          </div>
        ) : (
          data && (
            <>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
                <MarkdownRenderer content={data.text} />
              </div>
              
              {data.sources.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs text-slate-400 mb-2 px-2">Informações baseadas na web:</p>
                  <ul className="space-y-2">
                    {data.sources.slice(0, 3).map((s, i) => (
                      <li key={i}>
                        <a href={s.uri} target="_blank" className="block p-3 bg-white rounded-lg border border-slate-100 text-sm text-cyan-700 hover:bg-cyan-50">
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
};