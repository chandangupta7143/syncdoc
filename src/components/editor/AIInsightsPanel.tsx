import { useState, useRef, useCallback, useEffect } from 'react';
import { API_BASE_URL } from '../../config';

interface AIInsightsPanelProps {
  documentId: string;
}

type AIAction = 'summarize' | 'fix-grammar';

export default function AIInsightsPanel(_props: AIInsightsPanelProps) {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<AIAction | null>(null);
  const responseRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll response
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response]);

  // Get document text from the editor
  const getDocumentContent = useCallback((): string => {
    const editorEl = document.querySelector('[contenteditable="true"]') as HTMLElement | null;
    return editorEl?.textContent || editorEl?.innerText || '';
  }, []);

  const handleAnalyze = useCallback(async (action: AIAction) => {
    const content = getDocumentContent();
    if (!content.trim()) {
      setResponse('No document content to analyze. Start typing in the editor first.');
      return;
    }

    // Cancel previous request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setActiveAction(action);
    setResponse('');

    try {
      const res = await fetch(`${API_BASE_URL}/ai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, content }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        setResponse(`Error: ${err.error || 'Analysis failed'}`);
        setLoading(false);
        return;
      }

      // Read SSE stream
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        setResponse('Error: Could not read response stream');
        setLoading(false);
        return;
      }

      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.done) {
                setLoading(false);
                return;
              }
              fullText += data.text;
              setResponse(fullText);
            } catch {
              // skip malformed SSE
            }
          }
        }
      }

      setLoading(false);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setResponse('Error: Network request failed. Is the backend running?');
      setLoading(false);
    }
  }, [getDocumentContent]);

  const handleCopy = () => {
    if (response) navigator.clipboard.writeText(response);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-surface-200/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-surface-900">AI Insights</h3>
            <p className="text-[10px] text-surface-700">Powered by Google Gemini</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 py-3 space-y-2 border-b border-surface-200/60">
        <button
          onClick={() => handleAnalyze('summarize')}
          disabled={loading}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all group ${
            activeAction === 'summarize' && loading
              ? 'bg-violet-50 border border-violet-200'
              : 'bg-surface-50 border border-surface-200/60 hover:bg-violet-50 hover:border-violet-200'
          } disabled:opacity-60`}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-900">Summarize Document</p>
            <p className="text-[10px] text-surface-700">Generate a concise summary</p>
          </div>
        </button>

        <button
          onClick={() => handleAnalyze('fix-grammar')}
          disabled={loading}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all group ${
            activeAction === 'fix-grammar' && loading
              ? 'bg-emerald-50 border border-emerald-200'
              : 'bg-surface-50 border border-surface-200/60 hover:bg-emerald-50 hover:border-emerald-200'
          } disabled:opacity-60`}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-900">Fix Grammar & Tone</p>
            <p className="text-[10px] text-surface-700">Check writing quality</p>
          </div>
        </button>
      </div>

      {/* Response area */}
      <div ref={responseRef} className="flex-1 overflow-y-auto px-4 py-4">
        {!response && !loading && (
          <div className="text-center py-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-surface-100 mb-3">
              <svg className="w-6 h-6 text-surface-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <p className="text-sm text-surface-700 font-medium">AI assistant ready</p>
            <p className="text-xs text-surface-700 mt-1">Select an action above to analyze your document</p>
          </div>
        )}

        {(response || loading) && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${
                activeAction === 'summarize'
                  ? 'bg-violet-50 text-violet-700 border-violet-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {activeAction === 'summarize' ? 'Summary' : 'Grammar & Tone'}
              </span>
              {loading && (
                <svg className="animate-spin w-3.5 h-3.5 text-violet-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
            </div>

            <div className="text-sm text-surface-800 leading-relaxed whitespace-pre-wrap">
              {response}
              {loading && <span className="inline-block w-1.5 h-4 bg-violet-500 rounded-sm ml-0.5 animate-pulse" />}
            </div>
          </div>
        )}
      </div>

      {/* Actions footer */}
      {response && !loading && (
        <div className="px-4 py-3 border-t border-surface-200/60 flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-surface-700 bg-surface-100 hover:bg-surface-200 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
            </svg>
            Copy
          </button>
          <button
            onClick={() => activeAction && handleAnalyze(activeAction)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            Regenerate
          </button>
        </div>
      )}
    </div>
  );
}
