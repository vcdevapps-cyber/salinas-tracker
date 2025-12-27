import React, { useEffect, useState } from 'react';
import { SearchResult, NewsItem } from '../types';
import { fetchSalinasNews } from '../services/geminiService';
import { MarkdownRenderer } from './MarkdownRenderer';

type SortOption = 'relevance' | 'date';

export const NewsSection: React.FC = () => {
  const [data, setData] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');

  const loadNews = async () => {
    setLoading(true);
    setIsOffline(false);
    try {
      const result = await fetchSalinasNews();
      setData(result);
      // Cache the result
      localStorage.setItem('salinas_news_cache', JSON.stringify({
        data: result,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error("Network error, loading cache:", error);
      const cached = localStorage.getItem('salinas_news_cache');
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        setData(cachedData);
        setIsOffline(true);
      } else {
        setData({ text: "Não foi possível carregar as notícias. Verifique sua conexão.", sources: [] });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Try to load from cache first for instant render if available, then refresh
    const cached = localStorage.getItem('salinas_news_cache');
    if (cached) {
      const { data: cachedData } = JSON.parse(cached);
      setData(cachedData);
    }
    loadNews();
  }, []);

  const getSortedItems = (): NewsItem[] => {
    if (!data?.newsItems) return [];
    
    const items = [...data.newsItems];
    if (sortBy === 'date') {
      return items.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    }
    // Relevance is implicitly the order returned by the AI
    return items;
  };

  const sortedItems = getSortedItems();

  return (
    <div className="pb-24 pt-4 px-4 max-w-2xl mx-auto h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          <i className="fas fa-newspaper text-cyan-600 mr-2"></i>
          Notícias
        </h2>
        <button 
          onClick={loadNews}
          disabled={loading}
          className="p-2 bg-white rounded-full shadow text-cyan-600 hover:bg-cyan-50 transition-colors"
        >
          <i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''}`}></i>
        </button>
      </div>

      {isOffline && (
        <div className="mb-4 p-3 bg-amber-50 text-amber-700 rounded-lg text-sm border border-amber-200 flex items-center">
          <i className="fas fa-wifi-slash mr-2"></i>
          <span>Modo Offline: Mostrando notícias salvas.</span>
        </div>
      )}

      {/* Filter/Sort Controls */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSortBy('relevance')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            sortBy === 'relevance' 
              ? 'bg-cyan-600 text-white shadow-md' 
              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <i className="fas fa-star mr-1"></i> Relevância
        </button>
        <button
          onClick={() => setSortBy('date')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            sortBy === 'date' 
              ? 'bg-cyan-600 text-white shadow-md' 
              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <i className="fas fa-calendar-alt mr-1"></i> Data
        </button>
      </div>

      {loading && !data && (
        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-32 bg-slate-200 rounded-lg w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {sortedItems.length > 0 ? (
             <div className="space-y-4">
               {sortedItems.map((item, index) => (
                 <div key={index} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
                   <div className="flex justify-between items-start mb-2">
                     <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 px-2 py-1 rounded-full uppercase tracking-wider">
                       {item.sourceName}
                     </span>
                     <span className="text-xs text-slate-400 flex items-center">
                       <i className="far fa-calendar mr-1"></i>
                       {item.date}
                     </span>
                   </div>
                   <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight">
                     {item.headline}
                   </h3>
                   <p className="text-sm text-slate-600 leading-relaxed mb-0">
                     {item.summary}
                   </p>
                 </div>
               ))}
             </div>
          ) : (
            // Fallback to text rendering if newsItems is missing (legacy cache)
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <MarkdownRenderer content={data.text} />
            </div>
          )}

          {data.sources.length > 0 && (
            <div className="bg-slate-100 p-4 rounded-xl mt-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Links Diretos</h3>
              <div className="flex flex-wrap gap-2">
                {data.sources.map((source, idx) => (
                  <a 
                    key={idx} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs bg-white text-cyan-700 px-3 py-1 rounded-full border border-cyan-100 truncate max-w-[200px] hover:bg-cyan-50"
                  >
                    {source.title} <i className="fas fa-external-link-alt ml-1 opacity-50"></i>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};