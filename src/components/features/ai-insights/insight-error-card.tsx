'use client';

import { AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { StoredInsightCard } from '@/lib/ai/insight-list';

interface InsightErrorCardProps {
  card: StoredInsightCard;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
}

export function InsightErrorCard({ card, onRetry, onDelete }: InsightErrorCardProps) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="flex items-center gap-3 p-3">
        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium capitalize">{card.insightType.replace(/-/g, ' ')}</p>
          <p className="text-xs text-muted-foreground truncate">{card.errorMessage}</p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onRetry(card.id)} aria-label="Retry">
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onDelete(card.id)} aria-label="Delete">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
