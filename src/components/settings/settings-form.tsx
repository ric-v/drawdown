'use client';

import { useState, useEffect, useRef } from 'react';
import { UserSettings, UpdateSettingsPayload } from '@/types/settings';
import { useSettings } from '@/hooks/use-settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle, AlertCircle, Eye, EyeOff, Trash2 } from 'lucide-react';
import { AccountDetailsCard } from './account-details-card';
import { getProviderModels, fetchModelsFromAPI } from '@/lib/ai/models';
import { maskApiKey } from '@/lib/byok/mask';
import type { AIProvider } from '@/lib/ai/types';

interface SettingsFormProps {
  onSave?: (settings: UserSettings) => void;
}

export function SettingsForm({ onSave }: SettingsFormProps) {
  const { settings, loading: contextLoading, updateSettings, persistError, clearPersistError } = useSettings();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState<UpdateSettingsPayload>({});

  // AI Insights tab state
  const [aiProvider, setAiProvider] = useState<AIProvider>('openai');
  const [aiModel, setAiModel] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [dailyLimit, setDailyLimit] = useState<number>(100);
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const keyRevealTimeout = useRef<NodeJS.Timeout | null>(null);
  const [fetchedModels, setFetchedModels] = useState<string[] | null>(null);
  const [modelsLoading, setModelsLoading] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        theme: settings.theme,
        currency: settings.currency,
        dateFormat: settings.dateFormat,
        numberFormat: settings.numberFormat,
        defaultCapital: settings.defaultCapital,
        notifications: settings.notifications,
        trading: settings.trading,
      });
      if (settings.ai?.aiProvider) setAiProvider(settings.ai.aiProvider);
      if (settings.ai?.aiModel) setAiModel(settings.ai.aiModel);
      if (settings.ai?.dailyRequestLimit) setDailyLimit(settings.ai.dailyRequestLimit);
    }
  }, [settings]);

  useEffect(() => {
    if (!apiKeyInput || apiKeyInput.length < 20) { setFetchedModels(null); return; }
    let cancelled = false;
    setModelsLoading(true);
    fetchModelsFromAPI(aiProvider, apiKeyInput).then((models) => {
      if (!cancelled) { setFetchedModels(models); setModelsLoading(false); }
    });
    return () => { cancelled = true; };
  }, [apiKeyInput, aiProvider]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      await updateSettings({
        ...formData,
        notifications: { emailNotifications: formData.notifications?.emailNotifications ?? false, desktopNotifications: formData.notifications?.desktopNotifications ?? false, milestoneAlerts: formData.notifications?.milestoneAlerts ?? false, dailySummary: formData.notifications?.dailySummary ?? false },
        trading: { decimalsForPnL: formData.trading?.decimalsForPnL ?? 2, defaultPortfolioName: formData.trading?.defaultPortfolioName ?? '', showPnLPercentage: formData.trading?.showPnLPercentage ?? false, hideClosedTrades: formData.trading?.hideClosedTrades ?? false },
      });
      setMessage({ type: 'success', text: 'Settings saved!' });
      if (onSave && settings) onSave(settings);
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAI = async () => {
    if (apiKeyInput && apiKeyInput.trim().length < 20) {
      setMessage({ type: 'error', text: 'API key must be at least 20 characters' });
      return;
    }
    try {
      setSaving(true);
      setMessage(null);
      const aiUpdate: UpdateSettingsPayload['ai'] = { aiProvider, aiModel, dailyRequestLimit: dailyLimit };
      if (apiKeyInput.trim()) {
        const { encryptApiKey } = await import('@/lib/byok/crypto');
        const email = settings?.userId ?? '';
        const encrypted = await encryptApiKey(apiKeyInput, email);
        aiUpdate!.apiKey = encrypted;
      }
      await updateSettings({ ai: { ...settings?.ai, ...aiUpdate } });
      setApiKeyInput('');
      setMessage({ type: 'success', text: 'AI settings saved!' });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: 'error', text: 'Failed to save AI settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    try {
      const key = apiKeyInput || ''; // Use input key for test, not persisted
      if (!key) { setTestStatus('error'); setTestMessage('Enter an API key first'); return; }
      const { getAIClient } = await import('@/lib/ai/client');
      const client = await getAIClient(aiProvider, key, aiModel);
      const result = await client.testConnection();
      if (result.ok) { setTestStatus('success'); setTestMessage(`Connected: ${result.modelName}`); }
      else { setTestStatus('error'); setTestMessage(result.reason); }
    } catch { setTestStatus('error'); setTestMessage('Connection failed'); }
  };

  const handleRemoveKey = async () => {
    try {
      const { deleteBYOKConfig } = await import('@/lib/byok/store');
      const email = settings?.userId ?? '';
      await deleteBYOKConfig(email);
      await updateSettings({ ai: { ...settings?.ai, apiKey: undefined, aiProvider: undefined, aiModel: undefined } });
      setApiKeyInput('');
      setMessage({ type: 'success', text: 'API key removed' });
      setTimeout(() => setMessage(null), 3000);
    } catch { setMessage({ type: 'error', text: 'Failed to remove key' }); }
  };

  const handleKeyReveal = () => {
    setShowKey(true);
    if (keyRevealTimeout.current) clearTimeout(keyRevealTimeout.current);
  };
  const handleKeyHide = () => {
    keyRevealTimeout.current = setTimeout(() => setShowKey(false), 200);
  };

  if (contextLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const models = fetchedModels ?? getProviderModels(aiProvider);

  return (
    <div className="space-y-6">
      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-positive/10 text-positive' : 'bg-destructive/10 text-destructive'}`}>
          {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {persistError && (
        <div className="flex items-center justify-between gap-2 p-3 rounded-lg text-sm bg-destructive/10 text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{persistError.message}</span>
          </div>
          <button onClick={clearPersistError} className="text-xs underline">Dismiss</button>
        </div>
      )}

      <Tabs defaultValue="display" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="display">Display</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Display Tab */}
        <TabsContent value="display" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Regional Settings</CardTitle>
              <CardDescription>Currency, date format, and number display</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(v) => setFormData((p) => ({ ...p, currency: v as any }))}>
                  <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                    <SelectItem value="USD">US Dollar ($)</SelectItem>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select value={formData.dateFormat} onValueChange={(v) => setFormData((p) => ({ ...p, dateFormat: v as any }))}>
                  <SelectTrigger id="dateFormat"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    <SelectItem value="DD.MM.YYYY">DD.MM.YYYY</SelectItem>
                    <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
                    <SelectItem value="MMM DD, YYYY">MMM DD, YYYY</SelectItem>
                    <SelectItem value="DD MMM YYYY">DD MMM YYYY</SelectItem>
                    <SelectItem value="MMMM DD, YYYY">MMMM DD, YYYY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="numberFormat">Number Format</Label>
                <Select value={formData.numberFormat} onValueChange={(v) => setFormData((p) => ({ ...p, numberFormat: v as any }))}>
                  <SelectTrigger id="numberFormat"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indian">Indian (Lakhs, Crores)</SelectItem>
                    <SelectItem value="western">Western (Thousands, Millions)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="decimals">Decimals for P&L (0–6)</Label>
                <Input
                  id="decimals"
                  type="number"
                  min={0} max={6}
                  value={formData.trading?.decimalsForPnL ?? 2}
                  onChange={(e) => {
                    const v = Math.max(0, Math.min(6, parseInt(e.target.value) || 0));
                    setFormData((p) => ({ ...p, trading: { ...p.trading, decimalsForPnL: v, defaultPortfolioName: p.trading?.defaultPortfolioName ?? '', showPnLPercentage: p.trading?.showPnLPercentage ?? false, hideClosedTrades: p.trading?.hideClosedTrades ?? false } }));
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <AccountDetailsCard />

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => settings && setFormData({ theme: settings.theme, currency: settings.currency, dateFormat: settings.dateFormat, numberFormat: settings.numberFormat, defaultCapital: settings.defaultCapital, notifications: settings.notifications, trading: settings.trading })} disabled={saving}>Reset</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Settings'}
            </Button>
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="ai-insights" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Provider Configuration</CardTitle>
              <CardDescription>Bring your own API key for AI-powered insights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={aiProvider} onValueChange={(v) => { setAiProvider(v as AIProvider); setAiModel(''); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="gemini">Google Gemini</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Model</Label>
                <Select value={aiModel} onValueChange={setAiModel} disabled={modelsLoading}>
                  <SelectTrigger><SelectValue placeholder={modelsLoading ? 'Loading models...' : 'Select model'} /></SelectTrigger>
                  <SelectContent>
                    {models.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showKey ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder={settings?.ai?.apiKey ? maskApiKey('••••••••••••••••••••') : 'Enter API key'}
                    />
                  </div>
                  <Button variant="outline" size="icon" onMouseDown={handleKeyReveal} onMouseUp={handleKeyHide} onMouseLeave={handleKeyHide} aria-label="Reveal key">
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Daily Request Limit (1–10000)</Label>
                <Input
                  type="number" min={1} max={10000}
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(Math.max(1, Math.min(10000, parseInt(e.target.value) || 1)))}
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={testStatus === 'testing'}>
                  {testStatus === 'testing' ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Testing...</> : 'Test Connection'}
                </Button>
                {settings?.ai?.apiKey && (
                  <Button variant="destructive" size="sm" onClick={handleRemoveKey}>
                    <Trash2 className="mr-1 h-3 w-3" />Remove Key
                  </Button>
                )}
              </div>

              {testStatus !== 'idle' && testStatus !== 'testing' && (
                <p className={`text-xs ${testStatus === 'success' ? 'text-positive' : 'text-destructive'}`}>{testMessage}</p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4 border-t border-border">
            <Button onClick={handleSaveAI} disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save AI Settings'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
