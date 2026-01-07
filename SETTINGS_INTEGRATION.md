# Settings Integration Guide

This guide explains how to use the centralized settings system throughout the app.

## Overview

The settings system provides a single source of truth for user preferences like currency, date format, and other display settings. All components should use the provided hooks and utilities instead of hardcoding values.

## Setup

The settings system is already integrated into the root layout (`src/app/layout.tsx`). The `SettingsProvider` wraps the entire app, making settings available to all components.

## Using Settings in Components

### Option 1: Using the `useSettings` Hook (for complex logic)

```tsx
'use client';

import { useSettings } from '@/hooks/use-settings';

export function MyComponent() {
  const { settings, loading, updateSettings } = useSettings();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <p>Current currency: {settings?.currency}</p>
      <p>Date format: {settings?.dateFormat}</p>
    </div>
  );
}
```

### Option 2: Using Formatted Components (recommended for values)

```tsx
import { FormattedCurrency, FormattedDate, FormattedPercentage } from '@/components/common/formatted-values';

export function MyComponent() {
  return (
    <div>
      {/* Automatically formats based on user settings */}
      <FormattedCurrency value={100000} />
      <FormattedDate date={new Date()} />
      <FormattedPercentage value={5.25} />
    </div>
  );
}
```

### Option 3: Using Format Utilities (for direct formatting)

```tsx
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils/format-settings';
import { useSettings } from '@/hooks/use-settings';

export function MyComponent() {
  const { settings } = useSettings();

  return (
    <div>
      <p>{formatCurrency(100000, settings)}</p>
      <p>{formatDate(new Date(), settings)}</p>
      <p>{formatPercentage(5.25, settings)}</p>
    </div>
  );
}
```

## Available Utilities

### `useSettings()` Hook

```typescript
const { settings, loading, updateSettings } = useSettings();

// settings: UserSettings | null
// loading: boolean
// updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>
```

### Format Utilities

All functions in `src/lib/utils/format-settings.ts`:

- `formatCurrency(value, settings, options)` - Format as full currency (e.g., "₹1,000.00")
- `formatCurrencyShort(value, settings)` - Format as short currency (e.g., "₹1k")
- `formatDate(date, settings)` - Format date based on user's preference
- `parseDate(dateString, settings)` - Parse date string based on user's format
- `formatPercentage(value, settings)` - Format percentage (e.g., "+5.25%")
- `getCurrencySymbol(settings)` - Get currency symbol (₹, $, €)

### Formatted Components

All components in `src/components/common/formatted-values.tsx`:

- `<FormattedCurrency value={100000} />` - Displays formatted currency
- `<FormattedCurrency value={100000} short />` - Displays short format (k/M)
- `<FormattedDate date={new Date()} />` - Displays formatted date
- `<FormattedPercentage value={5.25} />` - Displays formatted percentage
- `<CurrencySymbol />` - Displays just the currency symbol

## Migration Guide

If you're updating existing code to use settings:

### Before (Hardcoded):
```tsx
<p>Equity: ₹{(equity / 1000).toFixed(1)}k</p>
<p>P&L: {pnl.toFixed(2)}%</p>
```

### After (Using Settings):
```tsx
import { FormattedCurrency, FormattedPercentage } from '@/components/common/formatted-values';

<p>Equity: <FormattedCurrency value={equity} short /></p>
<p>P&L: <FormattedPercentage value={pnl} /></p>
```

## Settings Available

All settings are defined in `src/types/settings.ts`:

- **theme**: 'light' | 'dark' | 'system'
- **currency**: 'INR' | 'USD' | 'EUR'
- **dateFormat**: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
- **defaultCapital**: number
- **notifications**: { emailNotifications, desktopNotifications, milestoneAlerts, dailySummary }
- **trading**: { defaultPortfolioName, hideClosedTrades, showPnLPercentage, decimalsForPnL }

## Best Practices

1. **Use Formatted Components** for displaying values in the UI (cleaner, no manual formatting)
2. **Use Format Utilities** when you need raw formatted strings (for API calls, exports, etc.)
3. **Use useSettings Hook** only when you need to access raw settings or update them
4. **Never hardcode** currency symbols, date formats, or decimal places
5. **Cache settings** by using the context provider (don't refetch in each component)
