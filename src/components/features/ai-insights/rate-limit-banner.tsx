'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RateLimitState } from '@/lib/ai/rate-limit';

interface RateLimitBannerProps {
  state: RateLimitState;
  softLimit?: number;
  onAcknowledge: () => void;
}

export function RateLimitBanner({ state, softLimit, onAcknowledge }: RateLimitBannerProps) {
  const now = Date.now();
  const inCooldown = state.cooldownUntil > now;
  const cooldownRemaining = inCooldown ? Math.ceil((state.cooldownUntil - now) / 1000) : 0;

  if (!state.softLimitHit && !inCooldown) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs">
      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
      <div className="flex-1">
        {inCooldown && (
          <p>Rate limited. Retry in {cooldownRemaining}s.</p>
        )}
        {state.softLimitHit && !state.softLimitAcknowledged && (
          <p>Daily limit reached ({state.todayCount}/{softLimit}). Acknowledge to continue.</p>
        )}
      </div>
      {state.softLimitHit && !state.softLimitAcknowledged && (
        <Button variant="outline" size="sm" className="h-6 text-xs" onClick={onAcknowledge}>
          Continue
        </Button>
      )}
    </div>
  );
}
