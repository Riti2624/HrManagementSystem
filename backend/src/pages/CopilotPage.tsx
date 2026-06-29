import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, SendHorizontal, Mic } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Card, CardDescription, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';

export function CopilotPage() {
  const [prompt, setPrompt] = useState('Summarize current HR risks and action items.');
  const [history, setHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    { role: 'assistant', text: 'Ask for attrition analysis, performance summaries, leave suggestions, or hiring advice.' }
  ]);

  const mutation = useMutation({
    mutationFn: (value: string) => api.copilot(value),
    onSuccess: (result, value) => {
      setHistory((current) => [
        ...current,
        { role: 'user', text: value },
        { role: 'assistant', text: result.answer },
        ...(result.bullets || []).map((item) => ({ role: 'assistant' as const, text: `• ${item}` })),
        ...(result.recommendations || []).map((item) => ({ role: 'assistant' as const, text: `Suggestion: ${item}` }))
      ]);
    }
  });

  return (
    <AppShell title="AI Copilot Studio">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardTitle>Copilot Capabilities</CardTitle>
          <CardDescription>Built to answer HR questions, summarize teams, and recommend actions.</CardDescription>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            {['Who is at risk of leaving?', 'Summarize team performance', 'Suggest the best time to take leave', 'Generate a daily HR report'].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">{item}</div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white"><Sparkles /></div>
            <div>
              <CardTitle>Chat with HR Copilot</CardTitle>
              <CardDescription>Gemini-first responses with rule-based fallback for reliability.</CardDescription>
            </div>
          </div>

          <div className="mt-5 max-h-[420px] space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {history.map((item, index) => (
              <div key={index} className={item.role === 'user' ? 'ml-auto max-w-[88%] rounded-2xl bg-blue-600 px-4 py-3 text-white' : 'max-w-[88%] rounded-2xl bg-white px-4 py-3 text-slate-700'}>
                {item.text}
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={4} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => mutation.mutate(prompt)} disabled={mutation.isPending}>
                <SendHorizontal size={16} className="mr-2" /> Generate Insight
              </Button>
              <Button variant="secondary" disabled title="Voice input can be added with browser speech APIs">
                <Mic size={16} />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
