"use client"

import { useState, useMemo } from 'react'
import { useFinance } from '@/lib/finance-context'
import { AppLayout } from '@/components/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { CategoryIcon } from '@/components/category-icon'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash2, AlertTriangle, CheckCircle } from 'lucide-react'
import type { Budget } from '@/lib/types'

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
  for (let i = -1; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    options.push({ value, label })
  }
  return options
}

export default function BudgetsPage() {
  const { budgets, categories, addBudget, updateBudget, deleteBudget, getBudgetUsage, getCategoryById } = useFinance()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const [selectedViewMonth, setSelectedViewMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  
  // Form state
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const monthOptions = useMemo(() => getMonthOptions(), [])
  
  const expenseCategories = useMemo(() => {
    return categories.filter(c => c.type === 'expense' || c.type === 'both')
  }, [categories])

  // Filter budgets by selected month
  const filteredBudgets = useMemo(() => {
    return budgets.filter(b => b.month === selectedViewMonth)
  }, [budgets, selectedViewMonth])

  // Categories without a budget for the selected month
  const availableCategories = useMemo(() => {
    const budgetedCategoryIds = new Set(
      budgets
        .filter(b => b.month === month)
        .map(b => b.categoryId)
    )
    
    if (editingBudget) {
      budgetedCategoryIds.delete(editingBudget.categoryId)
    }
    
    return expenseCategories.filter(c => !budgetedCategoryIds.has(c.id))
  }, [budgets, expenseCategories, month, editingBudget])

  // Calculate totals
  const totals = useMemo(() => {
    let totalBudget = 0
    let totalSpent = 0
    
    filteredBudgets.forEach(b => {
      totalBudget += b.amount
      totalSpent += getBudgetUsage(b.id)
    })
    
    return { totalBudget, totalSpent, remaining: totalBudget - totalSpent }
  }, [filteredBudgets, getBudgetUsage])

  const resetForm = () => {
    setCategoryId('')
    setAmount('')
    const now = new Date()
    setMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
    setEditingBudget(null)
  }

  const openAddDialog = () => {
    resetForm()
    setMonth(selectedViewMonth)
    setIsDialogOpen(true)
  }

  const openEditDialog = (budget: Budget) => {
    setEditingBudget(budget)
    setCategoryId(budget.categoryId)
    setAmount(budget.amount.toString())
    setMonth(budget.month)
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const budgetData = {
      categoryId,
      amount: parseFloat(amount),
      month,
    }

    if (editingBudget) {
      updateBudget(editingBudget.id, budgetData)
    } else {
      addBudget(budgetData)
    }

    setIsDialogOpen(false)
    resetForm()
  }

  const handleDelete = () => {
    if (deletingId) {
      deleteBudget(deletingId)
      setDeletingId(null)
      setIsDeleteOpen(false)
    }
  }

  const confirmDelete = (id: string) => {
    setDeletingId(id)
    setIsDeleteOpen(true)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Budgets</h1>
            <p className="text-muted-foreground">Set and track your spending limits</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedViewMonth} onValueChange={setSelectedViewMonth}>
              <SelectTrigger className="w-[180px]">
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
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Budget
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(totals.totalBudget)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(totals.totalSpent)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totals.remaining >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(totals.remaining)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budgets List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Budget Details</CardTitle>
            <CardDescription>
              {monthOptions.find(m => m.value === selectedViewMonth)?.label || 'This month'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredBudgets.length > 0 ? (
              <div className="space-y-4">
                {filteredBudgets.map(budget => {
                  const category = getCategoryById(budget.categoryId)
                  const used = getBudgetUsage(budget.id)
                  const percentage = budget.amount > 0 ? Math.min((used / budget.amount) * 100, 100) : 0
                  const isOverBudget = used > budget.amount
                  const isWarning = percentage >= 80 && percentage < 100

                  return (
                    <div
                      key={budget.id}
                      className="p-4 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center justify-between mb-3">
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
                              {formatCurrency(used)} of {formatCurrency(budget.amount)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isOverBudget && (
                            <div className="flex items-center gap-1 text-destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-sm font-medium">Over budget!</span>
                            </div>
                          )}
                          {isWarning && !isOverBudget && (
                            <div className="flex items-center gap-1 text-warning">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-sm font-medium">Almost there</span>
                            </div>
                          )}
                          {!isWarning && !isOverBudget && percentage > 0 && (
                            <div className="flex items-center gap-1 text-success">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">On track</span>
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(budget)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDelete(budget.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Progress
                          value={percentage}
                          className={`h-2 ${isOverBudget ? '[&>div]:bg-destructive' : isWarning ? '[&>div]:bg-warning' : '[&>div]:bg-success'}`}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{Math.round(percentage)}% used</span>
                          <span>{formatCurrency(budget.amount - used)} remaining</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No budgets set for this month. Click &quot;Add Budget&quot; to get started!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-foreground">{editingBudget ? 'Edit Budget' : 'Add Budget'}</DialogTitle>
              <DialogDescription>
                {editingBudget
                  ? 'Update the budget amount below.'
                  : 'Set a monthly spending limit for a category.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <FieldGroup className="py-4">
                <Field>
                  <FieldLabel htmlFor="month">Month</FieldLabel>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger>
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
                </Field>
                <Field>
                  <FieldLabel htmlFor="category">Category</FieldLabel>
                  <Select
                    value={categoryId}
                    onValueChange={setCategoryId}
                    disabled={editingBudget !== null}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {editingBudget ? (
                        <SelectItem value={editingBudget.categoryId}>
                          {getCategoryById(editingBudget.categoryId)?.name}
                        </SelectItem>
                      ) : (
                        availableCategories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <CategoryIcon iconName={cat.icon} className="h-4 w-4" style={{ color: cat.color }} />
                              {cat.name}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {!editingBudget && availableCategories.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      All expense categories have budgets for this month.
                    </p>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="amount">Budget Amount</FieldLabel>
                  <Input
                    id="amount"
                    type="number"
                    step="1"
                    min="1"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </Field>
              </FieldGroup>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!categoryId || !amount || (!editingBudget && availableCategories.length === 0)}
                >
                  {editingBudget ? 'Update' : 'Add'} Budget
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Budget</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this budget? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  )
}
