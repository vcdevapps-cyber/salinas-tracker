import React from 'react';

// A simple renderer to handle basic markdown structure returned by Gemini
// without adding heavy dependencies like react-markdown for this demo.
interface Props {
  content: string;
}

export const MarkdownRenderer: React.FC<Props> = ({ content }) => {
  // Split by newlines to handle paragraphs and lists loosely
  const lines = content.split('\n');

  return (
    <div className="space-y-3 text-slate-700 leading-relaxed">
      {lines.map((line, idx) => {
        if (line.startsWith('## ')) {
          return <h3 key={idx} className="text-xl font-bold text-cyan-800 mt-4 mb-2">{line.replace('## ', '')}</h3>;
        }
        if (line.startsWith('### ')) {
          return <h4 key={idx} className="text-lg font-semibold text-cyan-700 mt-3 mb-1">{line.replace('### ', '')}</h4>;
        }
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-2">
              <span className="text-cyan-500 mt-1.5 text-xs">●</span>
              <span>{line.replace(/^[\*\-]\s/, '')}</span>
            </div>
          );
        }
        if (line.trim() === '') return null;
        
        // Bold text handling (simple regex for **text**)
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={idx} className="">
            {parts.map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="text-slate-900 font-semibold">{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
};