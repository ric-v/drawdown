'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSession } from 'next-auth/react';
import { getBYOKConfig } from '@/lib/byok/store';
import { decryptApiKey } from '@/lib/byok/crypto';
import type { StoredInsightCard } from '@/lib/ai/insight-list';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface InsightChatModalProps {
  card: StoredInsightCard;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InsightChatModal({ card, open, onOpenChange }: InsightChatModalProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMessages([{ role: 'assistant', content: card.contentMarkdown ?? '' }]);
      setInput('');
    }
  }, [open, card.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const handleCopy = useCallback(async (content: string, idx: number) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const email = session?.user?.email ?? '';
    const cfg = await getBYOKConfig(email);
    if (!cfg) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const key = await decryptApiKey(cfg.apiKey, email);
      const { getAIClient } = await import('@/lib/ai/client');
      const client = await getAIClient(cfg.aiProvider, key, cfg.aiModel);

      const context = messages.map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');
      const prompt = `Previous conversation:\n${context}\n\nUser: ${text}`;

      const result = await client.generate(
        { ...card.snapshot!, insightType: card.insightType, dateRange: card.snapshot?.dateRange ?? { from: '', to: '' }, currency: card.snapshot?.currency ?? 'USD', notes: [prompt] },
        { signal: new AbortController().signal },
      );

      setMessages((prev) => [...prev, { role: 'assistant', content: result.contentMarkdown }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Failed to get response. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 py-3 border-b border-border shrink-0">
          <DialogTitle className="text-sm capitalize">{card.insightType.replace(/-/g, ' ')}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">{card.provider}/{card.model}</DialogDescription>
        </DialogHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.role === 'user' ? (
                <div className="max-w-[80%] rounded-2xl bg-primary text-primary-foreground px-4 py-2 text-sm whitespace-pre-wrap">
                  {msg.content}
                </div>
              ) : (
                <div className="relative group w-full">
                  <div className="ai-markdown text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                  <Button
                    variant="ghost" size="sm"
                    className="absolute right-0 top-0 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleCopy(msg.content, i)}
                    aria-label="Copy"
                  >
                    {copiedId === i ? <Check className="h-3.5 w-3.5 text-positive" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing your data...</span>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-border shrink-0">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a follow-up question..."
              disabled={loading}
              className="flex-1 rounded-full px-4"
            />
            <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
