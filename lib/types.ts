export interface User {
  id: string
  email: string
  name: string
  createdAt: string
}

export interface Category {
  id: string
  userId: string
  name: string
  icon: string
  color: string
  type: 'income' | 'expense' | 'both'
  createdAt: string
}

export interface Transaction {
  id: string
  userId: string
  categoryId: string
  amount: number
  type: 'income' | 'expense'
  date: string
  note: string
  createdAt: string
}

export interface Budget {
  id: string
  userId: string
  categoryId: string
  amount: number
  month: string // Format: YYYY-MM
  createdAt: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface FinanceContextType {
  // Auth
  auth: AuthState
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, name: string) => Promise<boolean>
  logout: () => void

  // Categories
  categories: Category[]
  addCategory: (category: Omit<Category, 'id' | 'userId' | 'createdAt'>) => void
  updateCategory: (id: string, category: Partial<Category>) => void
  deleteCategory: (id: string) => void

  // Transactions
  transactions: Transaction[]
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => void
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void

  // Budgets
  budgets: Budget[]
  addBudget: (budget: Omit<Budget, 'id' | 'userId' | 'createdAt'>) => void
  updateBudget: (id: string, budget: Partial<Budget>) => void
  deleteBudget: (id: string) => void

  // Helpers
  getCategoryById: (id: string) => Category | undefined
  getBudgetUsage: (budgetId: string) => number
  getMonthlyStats: (month: string) => { income: number; expense: number; balance: number }
}
