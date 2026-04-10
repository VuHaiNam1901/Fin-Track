"use client"

import { useMemo, useState } from 'react'
import { useFinance } from '@/lib/finance-context'
import { AppLayout } from '@/components/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryIcon } from '@/components/category-icon'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts'

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getMonthOptions() {
  const options = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    options.push({ value, label })
  }
  return options
}

export default function DashboardPage() {
  const { transactions, categories, budgets, getBudgetUsage, getMonthlyStats, getCategoryById } = useFinance()
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const monthOptions = useMemo(() => getMonthOptions(), [])
  const monthStats = useMemo(() => getMonthlyStats(selectedMonth), [selectedMonth, getMonthlyStats])

  // Expense by category for pie chart
  const expenseByCategory = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const categoryTotals = new Map<string, number>()

    transactions
      .filter(t => {
        const tDate = new Date(t.date)
        return t.type === 'expense' && tDate >= startDate && tDate <= endDate
      })
      .forEach(t => {
        const current = categoryTotals.get(t.categoryId) || 0
        categoryTotals.set(t.categoryId, current + t.amount)
      })

    return Array.from(categoryTotals.entries())
      .map(([categoryId, amount], index) => {
        const category = getCategoryById(categoryId)
        return {
          name: category?.name || 'Unknown',
          value: amount,
          color: CHART_COLORS[index % CHART_COLORS.length],
        }
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [transactions, selectedMonth, getCategoryById])

  // Monthly trend data (last 6 months)
  const monthlyTrend = useMemo(() => {
    const data = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const stats = getMonthlyStats(month)
      data.push({
        name: date.toLocaleDateString('en-US', { month: 'short' }),
        income: stats.income,
        expense: stats.expense,
      })
    }
    return data
  }, [getMonthlyStats])

  // Budget warnings
  const budgetWarnings = useMemo(() => {
    return budgets
      .filter(b => b.month === selectedMonth)
      .map(b => {
        const used = getBudgetUsage(b.id)
        const percentage = b.amount > 0 ? (used / b.amount) * 100 : 0
        const category = getCategoryById(b.categoryId)
        return {
          id: b.id,
          category: category?.name || 'Unknown',
          categoryIcon: category?.icon || 'dollar-sign',
          categoryColor: category?.color || '#888',
          budget: b.amount,
          used,
          percentage,
          isOverBudget: percentage >= 100,
          isWarning: percentage >= 80 && percentage < 100,
        }
      })
      .filter(b => b.isOverBudget || b.isWarning)
      .sort((a, b) => b.percentage - a.percentage)
  }, [budgets, selectedMonth, getBudgetUsage, getCategoryById])

  // Recent transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  }, [transactions])

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Your financial overview</p>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
              <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(monthStats.income)}</div>
              <div className="flex items-center text-xs text-success mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                <span>Income this month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
              <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(monthStats.expense)}</div>
              <div className="flex items-center text-xs text-destructive mt-1">
                <ArrowDownRight className="h-3 w-3 mr-1" />
                <span>Spent this month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Balance</CardTitle>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${monthStats.balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(monthStats.balance)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {monthStats.balance >= 0 ? 'You saved money!' : 'Over budget'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Warnings */}
        {budgetWarnings.length > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <CardTitle className="text-lg text-foreground">Budget Alerts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {budgetWarnings.map(warning => (
                  <div key={warning.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${warning.categoryColor}20` }}
                      >
                        <CategoryIcon
                          iconName={warning.categoryIcon}
                          className="h-4 w-4"
                          style={{ color: warning.categoryColor }}
                        />
                      </div>
                      <span className="font-medium text-foreground">{warning.category}</span>
                    </div>
                    <div className="text-right">
                      <span className={warning.isOverBudget ? 'text-destructive font-semibold' : 'text-warning font-semibold'}>
                        {formatCurrency(warning.used)} / {formatCurrency(warning.budget)}
                      </span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({Math.round(warning.percentage)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Income vs Expenses</CardTitle>
              <CardDescription>Last 6 months trend</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-muted-foreground" tick={{ fill: 'currentColor' }} />
                    <YAxis className="text-muted-foreground" tick={{ fill: 'currentColor' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--popover)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--popover-foreground)',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expense" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Expense by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Expenses by Category</CardTitle>
              <CardDescription>Top spending categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {expenseByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {expenseByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--popover)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          color: 'var(--popover-foreground)',
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No expense data for this month
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activities</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.map(transaction => {
                  const category = getCategoryById(transaction.categoryId)
                  return (
                    <div key={transaction.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${category?.color || '#888'}20` }}
                        >
                          <CategoryIcon
                            iconName={category?.icon || 'dollar-sign'}
                            className="h-5 w-5"
                            style={{ color: category?.color || '#888' }}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{category?.name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.note || new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-semibold ${
                          transaction.type === 'income' ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No transactions yet. Add your first transaction to get started!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
