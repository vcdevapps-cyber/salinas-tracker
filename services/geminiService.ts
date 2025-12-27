import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Source, SearchResult, NewsItem } from "../types";

// The API key is now injected by Vite via the 'define' config in vite.config.ts
// mapping VITE_API_KEY -> process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to extract sources from grounding metadata
const extractSources = (response: GenerateContentResponse): Source[] => {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources: Source[] = [];
  
  chunks.forEach(chunk => {
    if (chunk.web?.uri && chunk.web?.title) {
      sources.push({
        title: chunk.web.title,
        uri: chunk.web.uri
      });
    }
  });
  
  // Remove duplicates based on URI
  return sources.filter((source, index, self) =>
    index === self.findIndex((t) => (
      t.uri === source.uri
    ))
  );
};

export const fetchSalinasNews = async (): Promise<SearchResult> => {
  const model = 'gemini-3-flash-preview';
  const prompt = `
    Atue como um monitor de mídia local focado em Salinas da Margarida, Bahia.
    
    Realize uma varredura na web buscando informações recentes, priorizando:
    1. **Diário Oficial do Município**.
    2. **Blogs locais e regionais** do Recôncavo Baiano.
    3. **Jornais da Bahia**.
    
    Extraia as 5 notícias mais relevantes.
    Para cada notícia, forneça:
    - Manchete (headline)
    - Data aproximada do evento no formato YYYY-MM-DD (use a data de hoje se não encontrar, mas tente ser preciso).
    - Resumo detalhado citando a fonte no texto (ex: "Segundo o Diário Oficial...").
    - Nome da Fonte Principal.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            date: { type: Type.STRING, description: "Date in YYYY-MM-DD format" },
            summary: { type: Type.STRING, description: "Detailed summary including in-text citation" },
            sourceName: { type: Type.STRING, description: "Name of the primary source (e.g., Blog do Valente)" }
          },
          required: ["headline", "date", "summary", "sourceName"]
        }
      }
    }
  });

  let newsItems: NewsItem[] = [];
  try {
    if (response.text) {
      newsItems = JSON.parse(response.text);
    }
  } catch (e) {
    console.error("Failed to parse news items JSON", e);
  }

  // Create a markdown fallback for compatibility
  const fallbackText = newsItems.length > 0 
    ? newsItems.map(n => `### ${n.headline}\n*${n.date} - ${n.sourceName}*\n\n${n.summary}`).join('\n\n')
    : response.text || "Não foi possível carregar as notícias.";

  return {
    text: fallbackText,
    sources: extractSources(response),
    newsItems: newsItems
  };
};

export const fetchTourismHighlights = async (): Promise<SearchResult> => {
  const model = 'gemini-3-flash-preview';
  const prompt = `
    Realize uma pesquisa em blogs de viagem, portais de turismo, notícias recentes e avaliações de visitantes sobre Salinas da Margarida, Bahia.
    
    Identifique e liste:
    1. Pontos turísticos citados recentemente.
    2. Restaurantes ou barracas de praia bem avaliados em blogs ou sites especializados.
    3. Eventos culturais mencionados na mídia local.
    
    Ao descrever cada item, mencione qual blog ou site recomendou ou noticiou (ex: "O blog de viagens 'X' destaca a moqueca do restaurante Y").
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  return {
    text: response.text || "Informações turísticas indisponíveis.",
    sources: extractSources(response)
  };
};

export const sendChatMessage = async (history: { role: string; parts: { text: string }[] }[], newMessage: string): Promise<SearchResult> => {
  const model = 'gemini-3-flash-preview';
  
  // We create a chat session, but for the specific tracking/search requirement, 
  // we need to ensure the tool is active.
  const chat = ai.chats.create({
    model,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: "Você é o 'Concierge de Salinas'. Responda às dúvidas do usuário buscando fatos na web. Sempre que possível, consulte e cite o Diário Oficial para questões administrativas, e blogs locais para questões culturais ou cotidianas."
    },
    history: history
  });

  const response = await chat.sendMessage({ message: newMessage });

  return {
    text: response.text || "Desculpe, não consegui processar sua resposta.",
    sources: extractSources(response)
  };
};