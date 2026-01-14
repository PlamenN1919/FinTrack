import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import storageService from '../services/StorageService';
import { useTransactions } from './TransactionContext';

// Тип за контекстуално правило
export interface ContextualRule {
  type: 'seasonal' | 'compensatory' | 'weather' | 'social' | 'emotional';
  description: string;
}

// Тип за бюджет
export interface Budget {
  id: string;
  category: string;
  budget: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'yearly';
  contextualRules: ContextualRule[];
  isActive: boolean;
  color: string;
  icon?: string;
  createdAt: string;
  startDate: string;
  endDate: string;
}

// Тип за контекста
interface BudgetContextType {
  budgets: Budget[];
  addBudget: (budget: Omit<Budget, 'id' | 'createdAt' | 'spent'>) => void;
  updateBudget: (id: string, budget: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  toggleBudgetActive: (id: string) => void;
  updateBudgetSpending: (category: string, amount: number) => void;
}

// Създаване на контекста
const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

// Функция за генериране на дати за текущия месец
const getCurrentMonthDates = () => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    createdAt: startDate.toISOString(),
  };
};

// Примерни данни за бюджети - ДИНАМИЧНИ ДАТИ
const createMockBudgets = (): Budget[] => {
  const dates = getCurrentMonthDates();
  
  return [
    {
      id: '1',
      category: 'Храна',
      budget: 500,
      spent: 0, // Ще се изчислява динамично
      period: 'monthly',
      contextualRules: [
        { type: 'seasonal', description: 'Увеличение с 20% през декември' },
        { type: 'compensatory', description: 'Намаление с 10% при превишаване на забавления' }
      ],
      isActive: true,
      color: '#FF6B6B',
      icon: '🍕',
      createdAt: dates.createdAt,
      startDate: dates.startDate,
      endDate: dates.endDate,
    },
    {
      id: '2',
      category: 'Транспорт',
      budget: 200,
      spent: 0, // Ще се изчислява динамично
      period: 'monthly',
      contextualRules: [
        { type: 'weather', description: 'Увеличение с 15% при лошо време' }
      ],
      isActive: true,
      color: '#4ECDC4',
      icon: '🚗',
      createdAt: dates.createdAt,
      startDate: dates.startDate,
      endDate: dates.endDate,
    },
    {
      id: '3',
      category: 'Забавления',
      budget: 150,
      spent: 0, // Ще се изчислява динамично
      period: 'monthly',
      contextualRules: [
        { type: 'social', description: 'Увеличение с 30% в уикендите' },
        { type: 'emotional', description: 'Намаление с 25% при стрес' }
      ],
      isActive: true,
      color: '#45B7D1',
      icon: '🎬',
      createdAt: dates.createdAt,
      startDate: dates.startDate,
      endDate: dates.endDate,
    },
    {
      id: '4',
      category: 'Битови',
      budget: 350,
      spent: 0, // Ще се изчислява динамично
      period: 'monthly',
      contextualRules: [
        { type: 'seasonal', description: 'Увеличение с 40% през зимата' }
      ],
      isActive: true,
      color: '#96CEB4',
      icon: '🏠',
      createdAt: dates.createdAt,
      startDate: dates.startDate,
      endDate: dates.endDate,
    },
    {
      id: '5',
      category: 'Здраве',
      budget: 100,
      spent: 0, // Ще се изчислява динамично
      period: 'monthly',
      contextualRules: [],
      isActive: true,
      color: '#FFEAA7',
      icon: '🏥',
      createdAt: dates.createdAt,
      startDate: dates.startDate,
      endDate: dates.endDate,
    },
  ];
};

const mockBudgets = createMockBudgets();

// Provider компонент
export const BudgetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Зареждане на данни при стартиране
  useEffect(() => {
    loadBudgets();
  }, []);

  // Запазване на данни при промяна
  useEffect(() => {
    if (!isLoading && budgets.length > 0) {
      saveBudgets();
    }
  }, [budgets, isLoading]);

  const loadBudgets = async () => {
    try {
      setIsLoading(true);
      const savedBudgets = await storageService.loadBudgets();
      
      // Ако няма запазени данни, използваме mock данните
      if (savedBudgets.length === 0) {
        setBudgets(mockBudgets);
        await storageService.saveBudgets(mockBudgets);
      } else {
        setBudgets(savedBudgets);
      }
    } catch (error) {
      console.error('Error loading budgets:', error);
      // При грешка използваме mock данните
      setBudgets(mockBudgets);
    } finally {
      setIsLoading(false);
    }
  };

  const saveBudgets = async () => {
    try {
      await storageService.saveBudgets(budgets);
    } catch (error) {
      console.error('Error saving budgets:', error);
    }
  };

  // Добавяне на нов бюджет
  const addBudget = (budgetData: Omit<Budget, 'id' | 'createdAt' | 'spent'>) => {
    const newBudget: Budget = {
      ...budgetData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      spent: 0, // Ще се изчислява динамично от транзакциите
    };

    setBudgets(prev => [newBudget, ...prev]);
  };

  // Обновяване на бюджет
  const updateBudget = (id: string, budgetData: Partial<Budget>) => {
    setBudgets(prev => 
      prev.map(budget =>
        budget.id === id ? { ...budget, ...budgetData } : budget
      )
    );
  };

  // Изтриване на бюджет
  const deleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(budget => budget.id !== id));
  };

  // Превключване на активност на бюджет
  const toggleBudgetActive = (id: string) => {
    setBudgets(prev => 
      prev.map(budget =>
        budget.id === id ? { ...budget, isActive: !budget.isActive } : budget
      )
    );
  };

  // ЗАМЕНЕНА ФУНКЦИЯ: Вместо ръчно обновяване, сега се използва в реално време
  // Тази функция се запазва за обратна съвместимост, но не прави нищо
  const updateBudgetSpending = (category: string, amount: number) => {
    // Функцията е заменена с автоматично изчисляване в реално време
    // Запазена е за обратна съвместимост
    console.log(`📊 Изразходването за ${category} ще се обнови автоматично от транзакциите`);
  };

  const value: BudgetContextType = {
    budgets,
    addBudget,
    updateBudget,
    deleteBudget,
    toggleBudgetActive,
    updateBudgetSpending,
  };

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
};

// Нов компонент за изчисляване на spent amounts в реално време
export const BudgetProviderWithCalculations: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <BudgetProvider>
      <BudgetCalculationsWrapper>
        {children}
      </BudgetCalculationsWrapper>
    </BudgetProvider>
  );
};

// Wrapper компонент който изчислява spent amounts от транзакциите
const BudgetCalculationsWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { budgets, updateBudget } = useBudgets();
  const { transactions } = useTransactions();

  // Изчисляване на изразходените средства от транзакциите
  useEffect(() => {
    // Обновяване на всеки бюджет с реални данни
    budgets.forEach(budget => {
      if (budget.isActive) {
        // Начало и край на периода на бюджета
        const budgetStartDate = new Date(budget.startDate);
        const budgetEndDate = new Date(budget.endDate);
        
        // Филтриране на транзакциите по период на бюджета (startDate до endDate)
        const relevantTransactions = transactions.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          const isInPeriod = transactionDate >= budgetStartDate && transactionDate <= budgetEndDate;
          const isExpense = transaction.amount < 0;
          const matchesCategory = transaction.category === budget.category;
          
          return matchesCategory && isExpense && isInPeriod;
        });

        // Изчисляване на изразходваните средства за тази категория
        const categorySpent = relevantTransactions
          .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

        // Обновяване само ако има промяна
        if (budget.spent !== categorySpent) {
          updateBudget(budget.id, { spent: categorySpent });
          
          console.log(`💰 Бюджет "${budget.category}" обновен (за период ${budget.startDate} - ${budget.endDate}):`, {
            period: `${budget.startDate} - ${budget.endDate}`,
            budget: budget.budget,
            spent: categorySpent,
            remaining: budget.budget - categorySpent,
            percentage: ((categorySpent / budget.budget) * 100).toFixed(1) + '%',
            relevantTransactions: relevantTransactions.length
          });
        }
      }
    });
  }, [transactions, budgets, updateBudget]);

  return <>{children}</>;
};

// Hook за използване на контекста
export const useBudgets = (): BudgetContextType => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudgets трябва да се използва в BudgetProvider');
  }
  return context;
}; 