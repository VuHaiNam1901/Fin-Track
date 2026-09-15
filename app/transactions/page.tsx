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
import { Plus, Pencil, Trash2, Search, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import type { Transaction } from '@/lib/types'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export default function TransactionsPage() {
  const { transactions, categories, addTransaction, updateTransaction, deleteTransaction, getCategoryById } = useFinance()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  
  // Form state
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const category = getCategoryById(t.categoryId)
        const matchesSearch = t.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             category?.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesType = filterType === 'all' || t.type === filterType
        const matchesCategory = filterCategory === 'all' || t.categoryId === filterCategory
        return matchesSearch && matchesType && matchesCategory
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactions, searchQuery, filterType, filterCategory, getCategoryById])

  const filteredCategories = useMemo(() => {
    return categories.filter(c => c.type === type || c.type === 'both')
  }, [categories, type])

  const resetForm = () => {
    setAmount('')
    setType('expense')
    setCategoryId('')
    setDate(new Date().toISOString().split('T')[0])
    setNote('')
    setEditingTransaction(null)
  }

  const openAddDialog = () => {
    resetForm()
    setDate(new Date().toISOString().split('T')[0])
    setIsDialogOpen(true)
  }

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setAmount(transaction.amount.toString())
    setType(transaction.type)
    setCategoryId(transaction.categoryId)
    setDate(transaction.date)
    setNote(transaction.note)
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const transactionData = {
      amount: parseFloat(amount),
      type,
      categoryId,
      date,
      note,
    }

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, transactionData)
    } else {
      addTransaction(transactionData)
    }

    setIsDialogOpen(false)
    resetForm()
  }

  const handleDelete = () => {
    if (deletingId) {
      deleteTransaction(deletingId)
      setDeletingId(null)
      setIsDeleteOpen(false)
    }
  }

  const confirmDelete = (id: string) => {
    setDeletingId(id)
    setIsDeleteOpen(true)
  }

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups = new Map<string, Transaction[]>()
    filteredTransactions.forEach(t => {
      const dateKey = new Date(t.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      const existing = groups.get(dateKey) || []
      groups.set(dateKey, [...existing, t])
    })
    return Array.from(groups.entries())
  }, [filteredTransactions])

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Transactions</h1>
            <p className="text-muted-foreground">Manage your income and expenses</p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">All Transactions</CardTitle>
            <CardDescription>{filteredTransactions.length} transactions found</CardDescription>
          </CardHeader>
          <CardContent>
            {groupedTransactions.length > 0 ? (
              <div className="space-y-6">
                {groupedTransactions.map(([dateKey, dateTransactions]) => (
                  <div key={dateKey}>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">{dateKey}</h3>
                    <div className="space-y-2">
                      {dateTransactions.map(transaction => {
                        const category = getCategoryById(transaction.categoryId)
                        return (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
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
                                <p className="text-sm text-muted-foreground">{transaction.note || 'No note'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p
                                  className={`font-semibold flex items-center ${
                                    transaction.type === 'income' ? 'text-success' : 'text-destructive'
                                  }`}
                                >
                                  {transaction.type === 'income' ? (
                                    <ArrowUpRight className="h-4 w-4 mr-1" />
                                  ) : (
                                    <ArrowDownRight className="h-4 w-4 mr-1" />
                                  )}
                                  {formatCurrency(transaction.amount)}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditDialog(transaction)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => confirmDelete(transaction.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery || filterType !== 'all' || filterCategory !== 'all'
                  ? 'No transactions match your filters'
                  : 'No transactions yet. Click "Add Transaction" to get started!'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-foreground">{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
              <DialogDescription>
                {editingTransaction
                  ? 'Update the transaction details below.'
                  : 'Enter the details for your new transaction.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <FieldGroup className="py-4">
                <Field>
                  <FieldLabel htmlFor="type">Type</FieldLabel>
                  <Select value={type} onValueChange={(v) => {
                    setType(v as 'income' | 'expense')
                    setCategoryId('')
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="amount">Amount</FieldLabel>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="category">Category</FieldLabel>
                  <Select value={categoryId} onValueChange={setCategoryId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <CategoryIcon iconName={cat.icon} className="h-4 w-4" style={{ color: cat.color }} />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="date">Date</FieldLabel>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="note">Note (optional)</FieldLabel>
                  <Input
                    id="note"
                    placeholder="Add a note..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </Field>
              </FieldGroup>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!categoryId || !amount}>
                  {editingTransaction ? 'Update' : 'Add'} Transaction
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this transaction? This action cannot be undone.
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
