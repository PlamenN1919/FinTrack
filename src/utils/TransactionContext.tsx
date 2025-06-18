import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import gamificationService from '../services/GamificationService';
import storageService from '../services/StorageService';

// Тип за транзакция
export interface Transaction {
  id: string;
  amount: number;
  category: string;
  date: string;
  merchant: string;
  note?: string;
  emotionalState: string;
  paymentMethod: string;
  createdAt: string;
  description?: string;
  emotion?: string;
  icon?: string;
}

// Тип за контекста
interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
}

// Създаване на контекста
const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

// Примерни данни за транзакции
const mockTransactions: Transaction[] = [
  {
    id: '1',
    amount: -35.50,
    category: 'Храна',
    date: '2024-05-19',
    merchant: 'Супермаркет Фреш',
    description: 'Седмични покупки',
    emotion: 'neutral',
    emotionalState: 'neutral',
    paymentMethod: 'Карта',
    createdAt: '2024-05-19T14:30:00.000Z',
    note: 'Седмични покупки',
    icon: '🍕',
  },
  {
    id: '2',
    amount: -12.80,
    category: 'Транспорт',
    date: '2024-05-18',
    merchant: 'Бензиностанция OMV',
    description: 'Гориво',
    emotion: 'neutral',
    emotionalState: 'neutral',
    paymentMethod: 'Карта',
    createdAt: '2024-05-18T10:15:00.000Z',
    note: 'Гориво',
    icon: '⛽',
  },
  {
    id: '3',
    amount: 1200.00,
    category: 'Заплата',
    date: '2024-05-15',
    merchant: 'Заплата',
    description: 'Месечна заплата',
    emotion: 'happy',
    emotionalState: 'happy',
    paymentMethod: 'Банков превод',
    createdAt: '2024-05-15T09:00:00.000Z',
    note: 'Месечна заплата',
    icon: '💰',
  },
  {
    id: '4',
    amount: -65.20,
    category: 'Забавления',
    date: '2024-05-14',
    merchant: 'Кино Арена',
    description: 'Филм с приятели',
    emotion: 'happy',
    emotionalState: 'happy',
    paymentMethod: 'Карта',
    createdAt: '2024-05-14T19:30:00.000Z',
    note: 'Филм с приятели',
    icon: '🎬',
  },
  {
    id: '5',
    amount: -120.00,
    category: 'Битови',
    date: '2024-05-13',
    merchant: 'Техномаркет',
    description: 'Домакински уреди',
    emotion: 'stressed',
    emotionalState: 'stressed',
    paymentMethod: 'Карта',
    createdAt: '2024-05-13T16:45:00.000Z',
    note: 'Домакински уреди',
    icon: '💡',
  },
  {
    id: '6',
    amount: -45.30,
    category: 'Храна',
    date: '2024-05-12',
    merchant: 'Ресторант Италия',
    description: 'Обяд',
    emotion: 'happy',
    emotionalState: 'happy',
    paymentMethod: 'Карта',
    createdAt: '2024-05-12T13:20:00.000Z',
    note: 'Обяд',
    icon: '🍔',
  },
];

// Provider компонент
export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Зареждане на данни при стартиране
  useEffect(() => {
    loadTransactions();
  }, []);

  // Запазване на данни при промяна
  useEffect(() => {
    if (!isLoading && transactions.length > 0) {
      saveTransactions();
      // Подаваме данните към гамификацията
      gamificationService.setTransactionsData(transactions);
    }
  }, [transactions, isLoading]);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const savedTransactions = await storageService.loadTransactions();
      
      // Ако няма запазени данни, използваме mock данните
      if (savedTransactions.length === 0) {
        setTransactions(mockTransactions);
        await storageService.saveTransactions(mockTransactions);
      } else {
        setTransactions(savedTransactions);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      // При грешка използваме mock данните
      setTransactions(mockTransactions);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTransactions = async () => {
    try {
      await storageService.saveTransactions(transactions);
      // Автоматично backup
      await storageService.autoBackup();
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  };

  // Добавяне на нова транзакция
  const addTransaction = (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      description: transactionData.note || '',
      emotion: transactionData.emotionalState,
    };

    setTransactions(prev => {
      const updatedTransactions = [newTransaction, ...prev];
      
      // Обновяване на гамификацията
      try {
        // Подготвяме metadata за гамификацията
        const metadata = {
          category: newTransaction.category,
          amount: newTransaction.amount,
          emotionalState: newTransaction.emotionalState,
          isScanned: newTransaction.note?.includes('Сканирана бележка') || 
                    newTransaction.merchant?.includes('Сканир') ||
                    newTransaction.icon === '🧾',
          paymentMethod: newTransaction.paymentMethod,
          hasNote: Boolean(newTransaction.note),
        };

        console.log('🎮 Processing gamification for new transaction:', {
          id: newTransaction.id,
          amount: newTransaction.amount,
          category: newTransaction.category,
          metadata
        });
        
        // Проверяваме постижения и мисии за добавяне на транзакция
        const updatedAchievements = gamificationService.checkAchievementsForAction('add_transaction', metadata);
        const updatedMissions = gamificationService.checkMissionsForAction('add_transaction', metadata);
        
        // Проверяваме дали е завършена дневната активност
        gamificationService.checkDailyActivityCompletion();
        
        // Проверяваме дали няма разходи за забавления (за мисии)
        gamificationService.checkNoEntertainmentToday();
        
        // Даваме базов XP за добавяне на транзакция
        const xpResult = gamificationService.addXP(5);
        
        console.log('✅ Gamification updated:', {
          xpResult,
          updatedAchievements: updatedAchievements.length,
          updatedMissions: updatedMissions.length,
        });
        
      } catch (error) {
        console.error('❌ Грешка при обновяване на гамификацията:', error);
      }
      
      return updatedTransactions;
    });
  };

  // Обновяване на транзакция
  const updateTransaction = (id: string, transactionData: Partial<Transaction>) => {
    setTransactions(prev => 
      prev.map(transaction =>
        transaction.id === id ? { ...transaction, ...transactionData } : transaction
      )
    );
  };

  // Изтриване на транзакция
  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(transaction => transaction.id !== id));
  };

  const value: TransactionContextType = {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

// Hook за използване на контекста
export const useTransactions = (): TransactionContextType => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions трябва да се използва в TransactionProvider');
  }
  return context;
}; 