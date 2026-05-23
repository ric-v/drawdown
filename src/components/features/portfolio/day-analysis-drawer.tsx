'use client';

import { DailyPnL } from '@/types/trading';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormattedCurrency } from '@/components/common/formatted-values';
import { format } from 'date-fns';
import { useState } from 'react';
import { cn } from '@/lib/utils/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  Zap, 
  Coffee,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface DayAnalysisDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dayData: DailyPnL | null;
  selectedDate: Date | null;
}

export function DayAnalysisDrawer({ isOpen, onClose, dayData, selectedDate }: DayAnalysisDrawerProps) {
  const [notes, setNotes] = useState(dayData?.notes || '');
  const [mistakeTags, setMistakeTags] = useState<string[]>([]);

  const handleToggleMistake = (mistake: string) => {
    setMistakeTags(prev => 
      prev.includes(mistake) 
        ? prev.filter(m => m !== mistake)
        : [...prev, mistake]
    );
  };

  const commonMistakes = [
    { id: 'overtrade', label: 'Overtrading', icon: Brain },
    { id: 'revenge', label: 'Revenge Trading', icon: Zap },
    { id: 'lowfocus', label: 'Low Focus', icon: Coffee },
    { id: 'norules', label: 'Broke Rules', icon: AlertTriangle },
    { id: 'fomo', label: 'FOMO Entry', icon: Target },
    { id: 'badtiming', label: 'Bad Timing', icon: Clock },
  ];

  if (!selectedDate) return null;

  const isWinDay = dayData && dayData.pnl > 0;
  const isLossDay = dayData && dayData.pnl < 0;
  const isNoTradeDay = !dayData;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[500px] overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl">
              {format(selectedDate, 'EEEE, MMM d, yyyy')}
            </SheetTitle>
            <div className={cn(
              "h-3 w-3 rounded-full",
              isWinDay ? "bg-positive" : isLossDay ? "bg-negative" : "bg-gray-400"
            )} />
          </div>
          <SheetDescription>
            Trading day analysis and behavior review
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* P&L Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {isWinDay ? <TrendingUp className="h-4 w-4 text-positive" /> :
                 isLossDay ? <TrendingDown className="h-4 w-4 text-negative" /> :
                 <div className="h-4 w-4" />}
                P&L Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dayData ? (
                <div className="space-y-3">
                  <div className={cn(
                    "text-3xl font-bold",
                    isWinDay ? "text-positive" : "text-negative"
                  )}>
                    {dayData.pnl >= 0 ? '+' : ''}<FormattedCurrency value={Math.abs(dayData.pnl)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <div className="flex items-center gap-1 mt-1">
                        {isWinDay ? <CheckCircle className="h-4 w-4 text-positive" /> :
                         <XCircle className="h-4 w-4 text-negative" />}
                        <span className="font-medium">
                          {isWinDay ? 'Win Day' : 'Loss Day'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Impact</p>
                      <p className="font-medium mt-1">
                        {Math.abs(dayData.pnl) > 5000 ? 'High' :
                         Math.abs(dayData.pnl) > 2000 ? 'Medium' : 'Low'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Coffee className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-muted-foreground">No trading activity</p>
                  <p className="text-sm text-muted-foreground">Rest day or market closed</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Behavior Analysis */}
          {dayData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4 text-blue-500" />
                  Behavior Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Potential Issues</p>
                  <div className="flex flex-wrap gap-2">
                    {commonMistakes.map((mistake) => {
                      const Icon = mistake.icon;
                      const isSelected = mistakeTags.includes(mistake.id);
                      return (
                        <Button
                          key={mistake.id}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleToggleMistake(mistake.id)}
                          className={cn(
                            "h-8 text-xs",
                            isSelected && "bg-amber-500 hover:bg-amber-600 text-white"
                          )}
                        >
                          <Icon className="h-3 w-3 mr-1" />
                          {mistake.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                  <label className="text-sm font-medium text-muted-foreground">
                    Trading Notes & Lessons
                  </label>
                  <Textarea
                    placeholder={
                      isWinDay ? "What went right today? Key decisions that worked..." :
                      isLossDay ? "What went wrong? Lessons learned, rules to reinforce..." :
                      "Market observations, opportunities missed, general thoughts..."
                    }
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-2 min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">
                  📊 View Trades
                </Button>
                <Button variant="outline" size="sm">
                  📈 Compare Similar
                </Button>
                <Button variant="outline" size="sm">
                  🎯 Set Reminder
                </Button>
                <Button variant="outline" size="sm">
                  📋 Export Notes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          {dayData && (
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
                  💡 AI Insight
                </p>
                <p className="text-sm text-muted-foreground">
                  {isWinDay ? 
                    "Strong performance today. Consider what specific conditions led to success and how to replicate them." :
                    "Focus on process improvement. Review your trading plan and identify which rules need reinforcement."
                  }
                </p>
              </CardContent>
            </Card>
          )}

          {/* Save Actions */}
          <div className="flex gap-2">
            <Button className="flex-1">
              Save Analysis
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}