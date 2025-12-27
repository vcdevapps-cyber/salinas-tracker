import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { Source, SearchResult, NewsItem } from "../types";

// Access API key from Vite environment variables
const apiKey = import.meta.env.VITE_API_KEY;

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(apiKey);
const modelId = 'gemini-2.0-flash-exp'; // Updated model

// Helper to extract sources from grounding metadata - adapted for new SDK response structure if needed
// Note: Browser SDK response structure might differ slightly, but usually follows similar patterns for complex objects if typed as any
// or we inspect the raw response.
const extractSources = (response: any): Source[] => {
  // The SDK structure for grounding might be in response.candidates[0].groundingMetadata
  const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
  const chunks = groundingMetadata?.groundingChunks || [];
  const sources: Source[] = [];

  chunks.forEach((chunk: any) => {
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
  const model = genAI.getGenerativeModel({
    model: modelId,
    tools: [{ googleSearch: {} } as any] // Cast as any if typing is strict on tools for now
  });

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

  const generationConfig = {
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.ARRAY as any,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          headline: { type: SchemaType.STRING as any },
          date: { type: SchemaType.STRING as any, description: "Date in YYYY-MM-DD format" },
          summary: { type: SchemaType.STRING as any, description: "Detailed summary including in-text citation" },
          sourceName: { type: SchemaType.STRING as any, description: "Name of the primary source (e.g., Blog do Valente)" }
        },
        required: ["headline", "date", "summary", "sourceName"]
      }
    }
  };

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig
    });

    const response = result.response;
    const text = response.text();

    let newsItems: NewsItem[] = [];
    try {
      if (text) {
        newsItems = JSON.parse(text);
      }
    } catch (e) {
      console.error("Failed to parse news items JSON", e);
    }

    // Create a markdown fallback for compatibility
    const fallbackText = newsItems.length > 0
      ? newsItems.map(n => `### ${n.headline}\n*${n.date} - ${n.sourceName}*\n\n${n.summary}`).join('\n\n')
      : text || "Não foi possível carregar as notícias.";

    return {
      text: fallbackText,
      sources: extractSources(response), // Pass the response object which has candidates
      newsItems: newsItems
    };
  } catch (error) {
    console.error("Error fetching news:", error);
    return {
      text: "Erro ao buscar notícias. Verifique a chave de API.",
      sources: []
    };
  }
};

export const fetchTourismHighlights = async (): Promise<SearchResult> => {
  const model = genAI.getGenerativeModel({
    model: modelId,
    tools: [{ googleSearch: {} } as any]
  });

  const prompt = `
    Realize uma pesquisa em blogs de viagem, portais de turismo, notícias recentes e avaliações de visitantes sobre Salinas da Margarida, Bahia.
    
    Identifique e liste:
    1. Pontos turísticos citados recentemente.
    2. Restaurantes ou barracas de praia bem avaliados em blogs ou sites especializados.
    3. Eventos culturais mencionados na mídia local.
    
    Ao descrever cada item, mencione qual blog ou site recomendou ou noticiou (ex: "O blog de viagens 'X' destaca a moqueca do restaurante Y").
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;

    return {
      text: response.text() || "Informações turísticas indisponíveis.",
      sources: extractSources(response)
    };
  } catch (error) {
    console.error("Error fetching tourism:", error);
    return {
      text: "Erro ao buscar informações turísticas.",
      sources: []
    };
  }
};

export const sendChatMessage = async (history: { role: string; parts: { text: string }[] }[], newMessage: string): Promise<SearchResult> => {
  const model = genAI.getGenerativeModel({
    model: modelId,
    tools: [{ googleSearch: {} } as any],
    systemInstruction: "Você é o 'Concierge de Salinas'. Responda às dúvidas do usuário buscando fatos na web. Sempre que possível, consulte e cite o Diário Oficial para questões administrativas, e blogs locais para questões culturais ou cotidianas."
  });

  const chat = model.startChat({
    history: history.map(h => ({
      role: h.role,
      parts: h.parts
    }))
  });

  try {
    const result = await chat.sendMessage(newMessage);
    const response = result.response;

    return {
      text: response.text() || "Desculpe, não consegui processar sua resposta.",
      sources: extractSources(response)
    };
  } catch (error) {
    console.error("Error sending message:", error);
    return {
      text: "Erro na comunicação com a IA.",
      sources: []
    };
  }
};