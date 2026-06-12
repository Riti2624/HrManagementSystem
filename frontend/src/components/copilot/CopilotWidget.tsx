import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Mic, SendHorizontal, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';

export function CopilotWidget() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('Who is at risk of leaving?');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    { role: 'assistant', text: 'HR Copilot is ready. Ask me about attrition, leave, payroll, or hiring.' }
  ]);
  const [loading, setLoading] = useState(false);

  const canUseVoice = useMemo(() => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window, []);

  async function submitPrompt() {
    if (!prompt.trim()) {
      return;
    }

    const userMessage = { role: 'user' as const, text: prompt };
    setMessages((current) => [...current, userMessage]);
    setPrompt('');
    setLoading(true);

    try {
      const result = await api.copilot(userMessage.text);
      setMessages((current) => [
        ...current,
        { role: 'assistant', text: result.answer },
        ...(result.bullets || []).map((item) => ({ role: 'assistant' as const, text: `• ${item}` })),
        ...(result.recommendations || []).map((item) => ({ role: 'assistant' as const, text: `Suggestion: ${item}` }))
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-5 right-5 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/20 ring-8 ring-blue-600/10"
      >
        <Sparkles />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            className="fixed bottom-24 right-5 z-40 w-[min(92vw,420px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Bot size={20} />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">HR Copilot</div>
                  <div className="text-xs text-slate-500">Gemini + fallback intelligence</div>
                </div>
              </div>
              <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">Live</div>
            </div>

            <div className="max-h-80 space-y-3 overflow-y-auto px-4 py-4 text-sm">
              {messages.map((message, index) => (
                <div key={index} className={message.role === 'user' ? 'ml-auto max-w-[85%] rounded-2xl bg-blue-600 px-4 py-3 text-white' : 'max-w-[85%] rounded-2xl bg-slate-100 px-4 py-3 text-slate-700'}>
                  {message.text}
                </div>
              ))}
              {loading ? <div className="rounded-2xl bg-slate-100 px-4 py-3 text-slate-500">Thinking...</div> : null}
            </div>

            <div className="border-t border-slate-200 p-4">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={3}
                className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                placeholder="Ask HR Copilot anything..."
              />
              <div className="flex items-center gap-2">
                <Button className="flex-1" onClick={submitPrompt} disabled={loading}>
                  <SendHorizontal size={16} className="mr-2" /> Ask Copilot
                </Button>
                <Button variant="secondary" className="px-3" disabled={!canUseVoice} title="Voice input coming soon">
                  <Mic size={16} />
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
