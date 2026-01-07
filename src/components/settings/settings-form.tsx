'use client';

import { useState, useEffect } from 'react';
import { UserSettings, UpdateSettingsPayload } from '@/types/settings';
import { useSettings } from '@/hooks/use-settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { AccountDetailsCard } from './account-details-card';

interface SettingsFormProps {
  onSave?: (settings: UserSettings) => void;
}

export function SettingsForm({ onSave }: SettingsFormProps) {
  const { settings, loading: contextLoading, updateSettings } = useSettings();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState<UpdateSettingsPayload>({});

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
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      
      const payload = {
        ...formData,
        notifications: {
          emailNotifications: formData.notifications?.emailNotifications ?? false,
          desktopNotifications: formData.notifications?.desktopNotifications ?? false,
          milestoneAlerts: formData.notifications?.milestoneAlerts ?? false,
          dailySummary: formData.notifications?.dailySummary ?? false,
        },
        trading: {
          defaultPortfolioName: formData.trading?.defaultPortfolioName ?? '',
          decimalsForPnL: formData.trading?.decimalsForPnL ?? 2,
          showPnLPercentage: formData.trading?.showPnLPercentage ?? false,
          hideClosedTrades: formData.trading?.hideClosedTrades ?? false,
        },
      };
      
      await updateSettings(payload);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      
      if (onSave && settings) {
        onSave(settings);
      }

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
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
    }
  };

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Regional Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Regional Settings</CardTitle>
          <CardDescription>Set your preferred currency and date format</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select 
              value={formData.currency} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value as any }))}
            >
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                <SelectItem value="USD">US Dollar ($)</SelectItem>
                <SelectItem value="EUR">Euro (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select 
              value={formData.dateFormat} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, dateFormat: value as any }))}
            >
              <SelectTrigger id="dateFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (06/01/2026)</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (01/06/2026)</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2026-01-06)</SelectItem>
                <SelectItem value="DD.MM.YYYY">DD.MM.YYYY (06.01.2026)</SelectItem>
                <SelectItem value="DD-MM-YYYY">DD-MM-YYYY (06-01-2026)</SelectItem>
                <SelectItem value="MMM DD, YYYY">MMM DD, YYYY (Jan 06, 2026)</SelectItem>
                <SelectItem value="DD MMM YYYY">DD MMM YYYY (06 Jan 2026)</SelectItem>
                <SelectItem value="MMMM DD, YYYY">MMMM DD, YYYY (January 06, 2026)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numberFormat">Number Format</Label>
            <Select 
              value={formData.numberFormat} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, numberFormat: value as any }))}
            >
              <SelectTrigger id="numberFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="indian">Indian (Lakhs, Crores)</SelectItem>
                <SelectItem value="western">Western (Thousands, Millions, Billions)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              How large numbers are displayed and spoken
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Account Details */}
      <AccountDetailsCard />

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-slate-800">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={saving}
        >
          Reset
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </div>
    </div>
  );
}
