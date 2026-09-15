"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { User, Category, Transaction, Budget, AuthState, FinanceContextType } from './types'

const FinanceContext = createContext<FinanceContextType | null>(null)

const STORAGE_KEYS = {
  USERS: 'fintrack_users',
  CURRENT_USER: 'fintrack_current_user',
  CATEGORIES: 'fintrack_categories',
  TRANSACTIONS: 'fintrack_transactions',
  BUDGETS: 'fintrack_budgets',
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function hashPassword(password: string): string {
  // Simple hash for demo purposes - in production, use bcrypt on backend
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(16)
}

const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'userId' | 'createdAt'>[] = [
  { name: 'Salary', icon: 'briefcase', color: '#4ade80', type: 'income' },
  { name: 'Freelance', icon: 'laptop', color: '#22d3ee', type: 'income' },
  { name: 'Investments', icon: 'trending-up', color: '#a78bfa', type: 'income' },
  { name: 'Food & Dining', icon: 'utensils', color: '#f87171', type: 'expense' },
  { name: 'Transportation', icon: 'car', color: '#fbbf24', type: 'expense' },
  { name: 'Shopping', icon: 'shopping-bag', color: '#f472b6', type: 'expense' },
  { name: 'Bills & Utilities', icon: 'zap', color: '#60a5fa', type: 'expense' },
  { name: 'Entertainment', icon: 'film', color: '#c084fc', type: 'expense' },
  { name: 'Healthcare', icon: 'heart', color: '#fb923c', type: 'expense' },
]

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])

  // Load data from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
    if (storedUser) {
      const user = JSON.parse(storedUser) as User
      setAuth({ user, isAuthenticated: true, isLoading: false })
      loadUserData(user.id)
    } else {
      setAuth(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  const loadUserData = useCallback((userId: string) => {
    const storedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES)
    const storedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)
    const storedBudgets = localStorage.getItem(STORAGE_KEYS.BUDGETS)

    if (storedCategories) {
      const allCategories = JSON.parse(storedCategories) as Category[]
      setCategories(allCategories.filter(c => c.userId === userId))
    }
    if (storedTransactions) {
      const allTransactions = JSON.parse(storedTransactions) as Transaction[]
      setTransactions(allTransactions.filter(t => t.userId === userId))
    }
    if (storedBudgets) {
      const allBudgets = JSON.parse(storedBudgets) as Budget[]
      setBudgets(allBudgets.filter(b => b.userId === userId))
    }
  }, [])

  const saveCategories = useCallback((newCategories: Category[]) => {
    const storedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES)
    const allCategories = storedCategories ? JSON.parse(storedCategories) as Category[] : []
    const otherUserCategories = allCategories.filter(c => c.userId !== auth.user?.id)
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify([...otherUserCategories, ...newCategories]))
    setCategories(newCategories)
  }, [auth.user?.id])

  const saveTransactions = useCallback((newTransactions: Transaction[]) => {
    const storedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)
    const allTransactions = storedTransactions ? JSON.parse(storedTransactions) as Transaction[] : []
    const otherUserTransactions = allTransactions.filter(t => t.userId !== auth.user?.id)
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([...otherUserTransactions, ...newTransactions]))
    setTransactions(newTransactions)
  }, [auth.user?.id])

  const saveBudgets = useCallback((newBudgets: Budget[]) => {
    const storedBudgets = localStorage.getItem(STORAGE_KEYS.BUDGETS)
    const allBudgets = storedBudgets ? JSON.parse(storedBudgets) as Budget[] : []
    const otherUserBudgets = allBudgets.filter(b => b.userId !== auth.user?.id)
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify([...otherUserBudgets, ...newBudgets]))
    setBudgets(newBudgets)
  }, [auth.user?.id])

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS)
    if (!storedUsers) return false

    const users = JSON.parse(storedUsers) as (User & { passwordHash: string })[]
    const user = users.find(u => u.email === email && u.passwordHash === hashPassword(password))
    
    if (user) {
      const { passwordHash: _, ...safeUser } = user
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUser))
      setAuth({ user: safeUser, isAuthenticated: true, isLoading: false })
      loadUserData(safeUser.id)
      return true
    }
    return false
  }, [loadUserData])

  const register = useCallback(async (email: string, password: string, name: string): Promise<boolean> => {
    const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS)
    const users = storedUsers ? JSON.parse(storedUsers) as (User & { passwordHash: string })[] : []

    if (users.some(u => u.email === email)) {
      return false
    }

    const newUser: User & { passwordHash: string } = {
      id: generateId(),
      email,
      name,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))

    // Create default categories for new user
    const defaultCats: Category[] = DEFAULT_CATEGORIES.map(cat => ({
      ...cat,
      id: generateId(),
      userId: newUser.id,
      createdAt: new Date().toISOString(),
    }))
    
    const storedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES)
    const allCategories = storedCategories ? JSON.parse(storedCategories) as Category[] : []
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify([...allCategories, ...defaultCats]))

    const { passwordHash: _, ...safeUser } = newUser
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUser))
    setAuth({ user: safeUser, isAuthenticated: true, isLoading: false })
    setCategories(defaultCats)
    setTransactions([])
    setBudgets([])
    
    return true
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
    setAuth({ user: null, isAuthenticated: false, isLoading: false })
    setCategories([])
    setTransactions([])
    setBudgets([])
  }, [])

  // Category operations
  const addCategory = useCallback((category: Omit<Category, 'id' | 'userId' | 'createdAt'>) => {
    if (!auth.user) return
    const newCategory: Category = {
      ...category,
      id: generateId(),
      userId: auth.user.id,
      createdAt: new Date().toISOString(),
    }
    saveCategories([...categories, newCategory])
  }, [auth.user, categories, saveCategories])

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    const newCategories = categories.map(c => c.id === id ? { ...c, ...updates } : c)
    saveCategories(newCategories)
  }, [categories, saveCategories])

  const deleteCategory = useCallback((id: string) => {
    saveCategories(categories.filter(c => c.id !== id))
    // Also delete related transactions and budgets
    saveTransactions(transactions.filter(t => t.categoryId !== id))
    saveBudgets(budgets.filter(b => b.categoryId !== id))
  }, [categories, transactions, budgets, saveCategories, saveTransactions, saveBudgets])

  // Transaction operations
  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => {
    if (!auth.user) return
    const newTransaction: Transaction = {
      ...transaction,
      id: generateId(),
      userId: auth.user.id,
      createdAt: new Date().toISOString(),
    }
    saveTransactions([...transactions, newTransaction])
  }, [auth.user, transactions, saveTransactions])

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    const newTransactions = transactions.map(t => t.id === id ? { ...t, ...updates } : t)
    saveTransactions(newTransactions)
  }, [transactions, saveTransactions])

  const deleteTransaction = useCallback((id: string) => {
    saveTransactions(transactions.filter(t => t.id !== id))
  }, [transactions, saveTransactions])

  // Budget operations
  const addBudget = useCallback((budget: Omit<Budget, 'id' | 'userId' | 'createdAt'>) => {
    if (!auth.user) return
    const newBudget: Budget = {
      ...budget,
      id: generateId(),
      userId: auth.user.id,
      createdAt: new Date().toISOString(),
    }
    saveBudgets([...budgets, newBudget])
  }, [auth.user, budgets, saveBudgets])

  const updateBudget = useCallback((id: string, updates: Partial<Budget>) => {
    const newBudgets = budgets.map(b => b.id === id ? { ...b, ...updates } : b)
    saveBudgets(newBudgets)
  }, [budgets, saveBudgets])

  const deleteBudget = useCallback((id: string) => {
    saveBudgets(budgets.filter(b => b.id !== id))
  }, [budgets, saveBudgets])

  // Helper functions
  const getCategoryById = useCallback((id: string) => {
    return categories.find(c => c.id === id)
  }, [categories])

  const getBudgetUsage = useCallback((budgetId: string) => {
    const budget = budgets.find(b => b.id === budgetId)
    if (!budget) return 0

    const [year, month] = budget.month.split('-').map(Number)
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    return transactions
      .filter(t => {
        const tDate = new Date(t.date)
        return t.categoryId === budget.categoryId && 
               t.type === 'expense' &&
               tDate >= startDate && 
               tDate <= endDate
      })
      .reduce((sum, t) => sum + t.amount, 0)
  }, [budgets, transactions])

  const getMonthlyStats = useCallback((month: string) => {
    const [year, m] = month.split('-').map(Number)
    const startDate = new Date(year, m - 1, 1)
    const endDate = new Date(year, m, 0)

    const monthTransactions = transactions.filter(t => {
      const tDate = new Date(t.date)
      return tDate >= startDate && tDate <= endDate
    })

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const expense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    return { income, expense, balance: income - expense }
  }, [transactions])

  return (
    <FinanceContext.Provider
      value={{
        auth,
        login,
        register,
        logout,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        budgets,
        addBudget,
        updateBudget,
        deleteBudget,
        getCategoryById,
        getBudgetUsage,
        getMonthlyStats,
      }}
    >
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinance() {
  const context = useContext(FinanceContext)
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider')
  }
  return context
}
