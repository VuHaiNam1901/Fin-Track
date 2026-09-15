"use client"

import { useState, useMemo } from 'react'
import { useFinance } from '@/lib/finance-context'
import { AppLayout } from '@/components/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { CategoryIcon, AVAILABLE_ICONS } from '@/components/category-icon'
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
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react'
import type { Category } from '@/lib/types'

const COLORS = [
  '#4ade80', '#22d3ee', '#60a5fa', '#a78bfa', '#f472b6',
  '#fb923c', '#fbbf24', '#f87171', '#c084fc', '#2dd4bf',
]

export default function CategoriesPage() {
  const { categories, transactions, addCategory, updateCategory, deleteCategory } = useFinance()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  // Form state
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('dollar-sign')
  const [color, setColor] = useState(COLORS[0])
  const [type, setType] = useState<'income' | 'expense' | 'both'>('expense')

  // Calculate transaction count per category
  const categoryStats = useMemo(() => {
    const stats = new Map<string, { count: number; total: number }>()
    transactions.forEach(t => {
      const existing = stats.get(t.categoryId) || { count: 0, total: 0 }
      stats.set(t.categoryId, {
        count: existing.count + 1,
        total: existing.total + t.amount,
      })
    })
    return stats
  }, [transactions])

  const incomeCategories = categories.filter(c => c.type === 'income' || c.type === 'both')
  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both')

  const resetForm = () => {
    setName('')
    setIcon('dollar-sign')
    setColor(COLORS[0])
    setType('expense')
    setEditingCategory(null)
  }

  const openAddDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setName(category.name)
    setIcon(category.icon)
    setColor(category.color)
    setType(category.type)
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const categoryData = {
      name,
      icon,
      color,
      type,
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, categoryData)
    } else {
      addCategory(categoryData)
    }

    setIsDialogOpen(false)
    resetForm()
  }

  const handleDelete = () => {
    if (deletingId) {
      deleteCategory(deletingId)
      setDeletingId(null)
      setIsDeleteOpen(false)
    }
  }

  const confirmDelete = (id: string) => {
    setDeletingId(id)
    setIsDeleteOpen(true)
  }

  const deletingCategory = deletingId ? categories.find(c => c.id === deletingId) : null
  const deletingStats = deletingId ? categoryStats.get(deletingId) : null

  const renderCategoryCard = (category: Category) => {
    const stats = categoryStats.get(category.id) || { count: 0, total: 0 }
    return (
      <div
        key={category.id}
        className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${category.color}20` }}
          >
            <CategoryIcon
              iconName={category.icon}
              className="h-6 w-6"
              style={{ color: category.color }}
            />
          </div>
          <div>
            <p className="font-medium text-foreground">{category.name}</p>
            <p className="text-sm text-muted-foreground">
              {stats.count} transaction{stats.count !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mr-2">
            {category.type === 'income' && <TrendingUp className="h-3 w-3 text-success" />}
            {category.type === 'expense' && <TrendingDown className="h-3 w-3 text-destructive" />}
            {category.type === 'both' && <ArrowLeftRight className="h-3 w-3 text-primary" />}
            <span className="capitalize">{category.type}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditDialog(category)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => confirmDelete(category.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Categories</h1>
            <p className="text-muted-foreground">Organize your transactions</p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Income Categories */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <CardTitle className="text-foreground">Income Categories</CardTitle>
            </div>
            <CardDescription>Categories for tracking income</CardDescription>
          </CardHeader>
          <CardContent>
            {incomeCategories.length > 0 ? (
              <div className="space-y-2">
                {incomeCategories.map(renderCategoryCard)}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No income categories yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              <CardTitle className="text-foreground">Expense Categories</CardTitle>
            </div>
            <CardDescription>Categories for tracking expenses</CardDescription>
          </CardHeader>
          <CardContent>
            {expenseCategories.length > 0 ? (
              <div className="space-y-2">
                {expenseCategories.map(renderCategoryCard)}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No expense categories yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-foreground">{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? 'Update the category details below.'
                  : 'Create a new category for organizing transactions.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <FieldGroup className="py-4">
                <Field>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input
                    id="name"
                    placeholder="e.g., Groceries"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="type">Type</FieldLabel>
                  <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Icon</FieldLabel>
                  <div className="grid grid-cols-8 gap-2">
                    {AVAILABLE_ICONS.map(iconName => (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setIcon(iconName)}
                        className={`p-2 rounded-lg border transition-colors ${
                          icon === iconName
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <CategoryIcon iconName={iconName} className="h-5 w-5 text-foreground" />
                      </button>
                    ))}
                  </div>
                </Field>
                <Field>
                  <FieldLabel>Color</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full transition-transform ${
                          color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </Field>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <CategoryIcon iconName={icon} className="h-6 w-6" style={{ color }} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{name || 'Preview'}</p>
                    <p className="text-sm text-muted-foreground capitalize">{type}</p>
                  </div>
                </div>
              </FieldGroup>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!name}>
                  {editingCategory ? 'Update' : 'Add'} Category
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{deletingCategory?.name}&quot;?
                {deletingStats && deletingStats.count > 0 && (
                  <span className="block mt-2 text-destructive">
                    Warning: This will also delete {deletingStats.count} associated transaction{deletingStats.count !== 1 ? 's' : ''}.
                  </span>
                )}
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
