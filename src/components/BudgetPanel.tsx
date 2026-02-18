import { useState } from 'react';
import { BudgetSimulation, Market, MARKET_CONFIG, SceneData } from '@/lib/types';
import { simulateBudget } from '@/lib/budget-engine';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface BudgetPanelProps {
  scenes: SceneData[];
  initialBudget: BudgetSimulation;
}

function formatCurrency(value: number, symbol: string): string {
  if (value >= 1_000_000_000) return `${symbol}${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 10_000_000) return `${symbol}${(value / 10_000_000).toFixed(1)}Cr`;
  if (value >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${symbol}${(value / 1_000).toFixed(0)}K`;
  return `${symbol}${value}`;
}

export default function BudgetPanel({ scenes, initialBudget }: BudgetPanelProps) {
  const [market, setMarket] = useState<Market>(initialBudget.market as Market);
  const budget = market === initialBudget.market ? initialBudget : simulateBudget(scenes, market);
  const config = MARKET_CONFIG[market];

  const tiers = [
    { label: 'Low Budget', total: budget.total_low, color: 'text-intensity-low', bg: 'bg-intensity-low/10 border-intensity-low/30' },
    { label: 'Mid Budget', total: budget.total_mid, color: 'text-primary', bg: 'bg-primary/10 border-primary/30' },
    { label: 'High Budget', total: budget.total_high, color: 'text-intensity-high', bg: 'bg-intensity-high/10 border-intensity-high/30' },
  ];

  const chartData = budget.breakdown.map(b => ({
    category: b.category.split(' ')[0],
    Low: b.low,
    Mid: b.mid,
    High: b.high,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-gradient-gold">Budget Simulation</h2>
        <Select value={market} onValueChange={(v: Market) => setMarket(v)}>
          <SelectTrigger className="w-48 bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(MARKET_CONFIG).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tier Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {tiers.map(({ label, total, color, bg }) => (
          <div key={label} className={`glass-card p-6 border ${bg}`}>
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className={`text-3xl font-display font-bold ${color}`}>
              {formatCurrency(total, config.symbol)}
            </p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-display font-semibold mb-4">Budget Breakdown by Category</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
            <XAxis dataKey="category" stroke="hsl(220 10% 55%)" tick={{ fontSize: 11 }} />
            <YAxis
              stroke="hsl(220 10% 55%)"
              tick={{ fontSize: 11 }}
              tickFormatter={v => formatCurrency(v, config.symbol)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(220 18% 10%)',
                border: '1px solid hsl(220 15% 22%)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => formatCurrency(value, config.symbol)}
            />
            <Legend />
            <Bar dataKey="Low" fill="hsl(142 70% 45%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Mid" fill="hsl(43 60% 53%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="High" fill="hsl(0 75% 55%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cost Drivers */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-display font-semibold mb-3">Key Cost Drivers</h3>
        <ul className="space-y-2">
          {budget.cost_drivers.map((driver, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-primary mt-0.5">▸</span>
              {driver}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
