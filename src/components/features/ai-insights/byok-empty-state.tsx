'use client';

import Link from 'next/link';
import { Settings, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BYOKEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <div className="rounded-full bg-muted p-3">
        <Sparkles className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">AI Insights require configuration</p>
        <p className="text-xs text-muted-foreground mt-1">Add your API key in Settings to unlock AI-powered analysis.</p>
      </div>
      <Button variant="outline" size="sm" asChild>
        <Link href="/settings#ai-insights">
          <Settings className="h-4 w-4 mr-1.5" />
          Configure AI
        </Link>
      </Button>
    </div>
  );
}
