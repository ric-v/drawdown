'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InsightChatModal } from './insight-chat-modal';
import type { StoredInsightCard } from '@/lib/ai/insight-list';

interface InsightCardProps {
  card: StoredInsightCard;
  onDelete: (id: string) => void;
}

export function InsightCardView({ card, onDelete }: InsightCardProps) {
  const [open, setOpen] = useState(false);
  const timestamp = new Date(card.createdAt).toLocaleString();

  return (
    <>
      <Card className="border-border bg-card cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setOpen(true)}>
        <CardHeader className="flex flex-row items-center justify-between p-3 pb-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium capitalize">{card.insightType.replace(/-/g, ' ')}</span>
            <span>·</span>
            <span>{card.provider}/{card.model}</span>
            {card.tokenCount != null && <span>· {card.tokenCount} tokens</span>}
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); onDelete(card.id); }} aria-label="Delete insight">
            <Trash2 className="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent className="p-3 pt-1">
          <p className="text-sm text-muted-foreground line-clamp-3">{card.contentMarkdown}</p>
          <p className="text-[10px] text-muted-foreground mt-2">{timestamp}</p>
        </CardContent>
      </Card>
      <InsightChatModal card={card} open={open} onOpenChange={setOpen} />
    </>
  );
}
