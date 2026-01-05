# 📖 User Guide

How to use the Drawdown Portfolio Tracker application.

---

## Overview

Drawdown is a daily P&L (Profit & Loss) tracker for traders. Instead of tracking individual trades, it focuses on **daily performance** to help you understand your trading patterns and overall portfolio health.

---

## Getting Started

### 1. Login

- Click **Sign in with Google** or **Sign in with Microsoft**
- Authorize the application to access your profile
- You'll be redirected to the dashboard

### 2. Dashboard Overview

The dashboard displays:
- **Hero Metrics**: Total P&L, Current Equity, Win Rate (top row)
- **Equity Chart**: Visual representation of portfolio growth
- **Performance Stats**: Profit days, loss days, largest gains/losses
- **Daily P&L History**: Table of all recorded days

---

## Tracking Daily P&L

### Add a Daily Entry

1. Click **Add Daily P&L** button
2. Fill in the form:
   - **Date**: Trading day (defaults to today)
   - **P&L Amount**: 
     - Positive number for profit (e.g., `2400`)
     - Negative number for loss (e.g., `-8000`)
   - **Notes**: Optional description (e.g., "Good market conditions")
3. Click **Add P&L**

### Examples

**Profit Day (₹2,400):**
- Date: 2024-12-08
- P&L Amount: `2400`
- Notes: "Captured morning trend"

**Loss Day (₹8,000):**
- Date: 2024-12-09
- P&L Amount: `-8000`
- Notes: "Stopped out on reversal"

### Edit an Entry

1. Find the entry in the Daily P&L History table
2. Click the **Edit** button (pencil icon)
3. Update amount or notes
4. Click **Update**

---

## Understanding Metrics

### Hero Metrics (Top Row)

**Total P&L**
- Cumulative profit/loss across all days
- Shows if you're profitable overall
- Color: Green (profit) or Red (loss)

**Current Equity**
- Initial Capital + Total P&L
- Your current portfolio value
- Example: ₹1,00,000 + ₹5,000 = ₹1,05,000

**Win Rate**
- Percentage of profitable days
- Formula: (Profit Days / Total Days) × 100
- Example: 15 profit days out of 25 = 60% win rate

### Performance Stats (Sidebar)

**Total Days**
- Number of trading days recorded
- Helps track consistency

**Profit Days**
- Days with positive P&L
- Green icon

**Loss Days**
- Days with negative P&L
- Red icon

**Average Profit**
- Average gain on winning days
- Shows typical profit size

**Average Loss**
- Average loss on losing days
- Shows typical loss size

**Largest Profit**
- Best single day performance
- Helps identify peak performance conditions

**Largest Loss**
- Worst single day performance
- Helps identify risk exposure

**Initial Capital**
- Starting portfolio value
- Set when first using the app

---

## Equity Curve

### What It Shows

The equity curve visualizes your portfolio value over time:
- **X-axis**: Trading days (dates)
- **Y-axis**: Portfolio value in ₹
- **Line**: Portfolio growth/decline

### Interpreting the Chart

**Upward Trend** ✅
- Consistent profitability
- Good trading performance

**Downward Trend** ⚠️
- Consistent losses
- Review strategy

**Flat Line** ⏸️
- Break-even trading
- Might need adjustments

**High Volatility**
- Large swings
- Consider risk management

### Chart Time Ranges

- **1W**: Last 7 days
- **1M**: Last 30 days
- **3M**: Last 90 days
- **6M**: Last 180 days
- **1Y**: Last 365 days
- **All**: Complete history

---

## Managing Your Portfolio

### Set Initial Capital

When you first use the app, you'll need to set your starting portfolio value:
1. Click **Add Funds** button
2. Enter your initial capital (e.g., ₹1,00,000)
3. This becomes your baseline for equity calculations

### Add/Withdraw Funds

If you deposit or withdraw money:
1. Click **Add Funds** button
2. Enter amount:
   - Positive for deposits (e.g., `50000`)
   - Negative for withdrawals (e.g., `-25000`)
3. Add notes explaining the transaction
4. Click **Add Funds**

This adjusts your Initial Capital without affecting your P&L calculations.

---

## Daily P&L History Table

### Columns

- **Date**: Trading day
- **Amount**: P&L in ₹
- **Status**: PROFIT (green) or LOSS (red) badge
- **Notes**: Optional description
- **Actions**: Edit or delete buttons

### Sorting

Click column headers to sort:
- **Date**: Chronological order
- **Amount**: Highest to lowest (or reverse)

### Mobile View

On mobile devices:
- Table scrolls horizontally
- Cards stack vertically
- Action buttons remain accessible

---

## Best Practices

### Daily Tracking

✅ **Record every trading day**
- Consistency is key
- Even break-even days (₹0) are valuable data

✅ **Add meaningful notes**
- Market conditions
- Strategy used
- Lessons learned

✅ **Review weekly**
- Analyze patterns
- Identify strengths/weaknesses
- Adjust strategy

### Risk Management

⚠️ **Monitor metrics**
- Track win rate (aim for >50%)
- Keep average loss < average profit
- Set maximum daily loss limits

⚠️ **Analyze drawdowns**
- Equity curve shows losing streaks
- Take breaks during drawdowns
- Review strategy after 3+ consecutive losses

---

## Data Management

### Export Data (Upcoming)

Your data is stored in:
- **Google Drive** (if using Google login)
- **OneDrive** (if using Microsoft login)

### Clear All Data

⚠️ **Warning**: This action cannot be undone!

To reset your portfolio:
1. Click **Clear Data** button
2. Confirm the action
3. All entries will be deleted
4. Start fresh with new initial capital

---

## Mobile Experience

The app is fully responsive:

### Mobile Features

- **Sidebar Navigation**: Hamburger menu with portfolio summary
- **Compact Cards**: Optimized for small screens
- **Touch-Friendly**: Large buttons and touch targets
- **Dropdown Menus**: Stats accessible from profile icon
- **Horizontal Scrolling**: Table adapts to screen width

### Desktop Features

- **Two-Column Layout**: Chart and stats side-by-side
- **Larger Visualizations**: More detailed equity curve
- **Hover Effects**: Interactive cards and buttons
- **Expanded Tables**: Full view without scrolling

---

## Keyboard Shortcuts

### Navigation

- `Ctrl/Cmd + K`: Quick command (upcoming)
- `Esc`: Close dialogs/modals

### Forms

- `Enter`: Submit form (when focus is on button)
- `Tab`: Navigate between fields
- `Esc`: Cancel and close form

---

## Troubleshooting

### Data not saving

**Solution:**
1. Check internet connection
2. Ensure you're logged in
3. Try refreshing the page
4. Check browser console for errors

### Chart not displaying

**Solution:**
1. Ensure you have at least 2 days of data
2. Try different time range
3. Refresh the page
4. Check if JavaScript is enabled

### Login issues

**Solution:**
1. Clear browser cookies
2. Try incognito/private mode
3. Verify OAuth setup is correct
4. Check [Security Guide](./SECURITY.md)

---

## Tips for Success

### Performance Tracking

📊 **Focus on process, not just profits**
- Track what you can control (discipline, risk management)
- Document strategy and emotions in notes
- Review patterns monthly, not daily

📊 **Use metrics to improve**
- If win rate < 50%, work on entry timing
- If avg loss > avg profit, improve exits
- If equity curve is flat, analyze strategy

### Portfolio Management

💰 **Set realistic goals**
- Aim for consistent gains (2-3% monthly)
- Avoid revenge trading after losses
- Take profits at predetermined levels

💰 **Manage risk**
- Never risk more than 2% per day
- Use stop losses consistently
- Size positions appropriately

---

## Next Steps

- [Setup Guide](./SETUP.md) - Configure OAuth and environment
- [Deployment Guide](./DEPLOYMENT.md) - Deploy to production
- [Security Overview](./SECURITY.md) - Understand authentication
- [Features](./FEATURES.md) - Advanced integrations (Google Drive)
