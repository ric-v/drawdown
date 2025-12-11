# Daily P&L Tracker - Simplified Version

## Changes Made

Your Trading PnL Tracker has been simplified to track daily profit/loss amounts in INR (₹) instead of individual stock transactions.

### What Changed

#### 1. **Data Structure**
- **Before**: Tracked individual trades with symbol, quantity, price, etc.
- **After**: Tracks daily P&L with just:
  - Date
  - Profit/Loss amount in ₹ (positive for profit, negative for loss)
  - Optional notes

#### 2. **Input Form**
- **Before**: Required symbol, type (BUY/SELL), quantity, price
- **After**: Only requires:
  - Date
  - P&L Amount (e.g., +2400 for profit, -8000 for loss)
  - Optional notes

#### 3. **Currency**
- Changed from USD ($) to INR (₹)
- Using Indian number format (e.g., ₹1,00,000 instead of $100,000)

#### 4. **Terminology**
- **Trades** → **Days**
- **Winning Trades** → **Profit Days**
- **Losing Trades** → **Loss Days**
- **Average Win** → **Average Profit**
- **Largest Win** → **Largest Profit**

### Updated Files

1. **types/trading.ts**
   - Added `DailyPnL` interface
   - Updated `PortfolioStats` to use day-based metrics

2. **app/api/portfolio/route.ts**
   - Changed from `transactions` to `dailyPnL`
   - Simplified calculations for daily entries

3. **components/add-transaction-form.tsx**
   - Simplified form to only ask for date, P&L amount, and notes
   - Shows ₹ symbol and clarifies positive/negative input

4. **components/transaction-table.tsx**
   - Displays daily P&L history
   - Shows PROFIT/LOSS status badges
   - Displays amounts in INR

5. **app/page.tsx**
   - Updated all currency displays to INR
   - Changed terminology from trades to days
   - Updated stats display

6. **components/kpi-card.tsx**
   - Added INR formatting function
   - Uses Indian number format

7. **data/portfolio-data.json**
   - Changed structure from `transactions` to `dailyPnL`

### How to Use

1. **Add Daily P&L**:
   - Click "Add Daily P&L" button
   - Select the date
   - Enter profit (positive) or loss (negative) amount
   - Example: For Dec 8 profit of ₹2,400, enter: `2400`
   - Example: For Dec 9 loss of ₹8,000, enter: `-8000`
   - Add optional notes
   - Click "Add P&L"

2. **View Dashboard**:
   - **Total P&L**: Your cumulative profit/loss
   - **Win Rate**: Percentage of profitable days
   - **Average Profit**: Average profit on winning days
   - **Total Days**: Number of trading days tracked
   - **Equity Curve**: Visual representation of your portfolio growth
   - **Daily P&L History**: Table showing all entries

3. **Clear Data**:
   - Use "Clear Data" button to reset all entries
   - Confirmation required to prevent accidental deletion

### Example Data Entry

**Scenario**: You made ₹2,400 on Dec 8 and lost ₹8,000 on Dec 9

**Dec 8 Entry**:
- Date: 2024-12-08
- P&L Amount: `2400`
- Notes: "Good trading day"

**Dec 9 Entry**:
- Date: 2024-12-09
- P&L Amount: `-8000`
- Notes: "Bad market conditions"

### Dashboard Display

After entering the above data, you'll see:
- **Total P&L**: -₹5,600 (2400 - 8000)
- **Win Rate**: 50% (1 profit day out of 2)
- **Average Profit**: ₹2,400
- **Average Loss**: -₹8,000
- **Total Days**: 2
- **Largest Profit**: ₹2,400
- **Largest Loss**: -₹8,000

### API Endpoints

- `GET /api/portfolio` - Retrieve all data
- `POST /api/portfolio` - Add new daily P&L entry
- `DELETE /api/portfolio` - Clear all data

### Data Storage

- **Local Development**: Data stored in `data/portfolio-data.json`
- **Production (Vercel)**: Requires database setup (see DEPLOYMENT.md)

### Notes

- All amounts are in Indian Rupees (₹)
- Positive numbers = Profit
- Negative numbers = Loss
- Initial capital set to ₹1,00,000 (can be modified in API)

---

**Ready to track your daily trading performance! 📈**
