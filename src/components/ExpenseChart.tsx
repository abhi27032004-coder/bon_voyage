'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface CategorySummary {
  category: string
  amount: number
}

interface ExpenseChartProps {
  data: CategorySummary[]
  currency?: string
}

const CATEGORY_COLORS: Record<string, string> = {
  Transportation: '#3b82f6', // blue
  Hotel: '#8b5cf6', // purple
  Food: '#f59e0b', // amber
  Shopping: '#ec4899', // pink
  Entertainment: '#10b981', // emerald
  Miscellaneous: '#64748b', // slate
}

export default function ExpenseChart({ data, currency = 'USD' }: ExpenseChartProps) {
  const formattedData = data.map((d) => ({
    name: d.category,
    amount: Number(d.amount) || 0,
  }))

  const hasData = formattedData.some((d) => d.amount > 0)

  if (!hasData) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">
        <p>No expense data recorded yet.</p>
        <p className="text-xs text-slate-400 mt-1">Add expenses to view category breakdown.</p>
      </div>
    )
  }

  return (
    <div className="w-full h-72 pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formattedData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
            interval={0}
            angle={-15}
            textAnchor="end"
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => `$${val}`}
          />
          <Tooltip
            formatter={(value: number) => [`$${value.toFixed(2)} ${currency}`, 'Spent']}
            contentStyle={{
              backgroundColor: '#1e293b',
              borderColor: '#334155',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
            {formattedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CATEGORY_COLORS[entry.name] || '#0c92eb'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
