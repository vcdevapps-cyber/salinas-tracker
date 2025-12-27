export interface Source {
  title: string;
  uri: string;
}

export interface NewsItem {
  headline: string;
  date: string; // YYYY-MM-DD format
  summary: string;
  sourceName: string;
}

export interface SearchResult {
  text: string;
  sources: Source[];
  newsItems?: NewsItem[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: Source[];
  timestamp: number;
}

export enum AppView {
  NEWS = 'NEWS',
  EXPLORE = 'EXPLORE',
  CHAT = 'CHAT'
}

export interface Place {
  name: string;
  description: string;
  category: string;
}