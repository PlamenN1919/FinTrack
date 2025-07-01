import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../contexts/AuthContext'; // Коригиран път
import gamificationService from '../services/GamificationService';
import storageService from '../services/StorageService';

export interface TransactionItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  date: string;
  merchant: string;
  note?: string;
  emotionalState: string;
  paymentMethod: string;
  createdAt: any; // Firestore Timestamp
  description?: string;
  emotion?: string;
  icon?: string;
  items?: TransactionItem[];
  time?: string;
  location?: string;
}

// Тип за контекста
interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  refetchTransactions: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

// Създаване на контекста
const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

// Примерни данни за транзакции - ПРЕМАХНАТИ
// const mockTransactions: Transaction[] = [
//   // ... mock data removed
// ];

// Provider компонент - преработен за Firestore
export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { authState } = useAuth();
  const { user } = authState;

  // Real-time listener за транзакции от Firestore
  useEffect(() => {
    if (!user) {
      // Ако няма потребител, изчистваме транзакциите и спираме
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const subscriber = firestore()
      .collection('transactions')
      .doc(user.uid)
      .collection('userTransactions')
      .orderBy('date', 'desc')
      .onSnapshot(querySnapshot => {
        const userTransactions: Transaction[] = [];
        querySnapshot.forEach(documentSnapshot => {
          userTransactions.push({
            id: documentSnapshot.id,
            ...documentSnapshot.data(),
          } as Transaction);
        });

        setTransactions(userTransactions);
        setLoading(false);
      }, (err) => {
        console.error("Firestore Error:", err);
        setError("Не успяхме да заредим транзакциите.");
        setLoading(false);
      });

    // Unsubscribe при unmount
    return () => subscriber();
  }, [user]);

  // Презареждане на транзакции (за pull-to-refresh функционалност)
  const refetchTransactions = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const querySnapshot = await firestore()
        .collection('transactions')
        .doc(user.uid)
        .collection('userTransactions')
        .orderBy('date', 'desc')
        .get();
        
      const userTransactions: Transaction[] = [];
      querySnapshot.forEach(documentSnapshot => {
        userTransactions.push({
          id: documentSnapshot.id,
          ...documentSnapshot.data(),
        } as Transaction);
      });
      
      setTransactions(userTransactions);
    } catch (err) {
      console.error("Error refetching transactions:", err);
      setError("Не успяхме да презаредим транзакциите.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Добавяне на нова транзакция
  const addTransaction = useCallback(async (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!user) throw new Error("Потребителят не е автентикиран.");

    const newTransaction = {
      ...transactionData,
      createdAt: firestore.FieldValue.serverTimestamp(),
      userId: user.uid, // Важно е да пазим кой е собственикът
    };
    
    await firestore()
      .collection('transactions')
      .doc(user.uid)
      .collection('userTransactions')
      .add(newTransaction);
      
    // Логиката за геймификация остава, но може да се премести в cloud функция
    // за по-добра сигурност и консистентност
  }, [user]);

  // Обновяване на транзакция
  const updateTransaction = useCallback(async (id: string, transactionData: Partial<Transaction>) => {
    if (!user) throw new Error("Потребителят не е автентикиран.");
    
    await firestore()
      .collection('transactions')
      .doc(user.uid)
      .collection('userTransactions')
      .doc(id)
      .update(transactionData);
  }, [user]);

  // Изтриване на транзакция
  const deleteTransaction = useCallback(async (id: string) => {
    if (!user) throw new Error("Потребителят не е автентикиран.");

    await firestore()
      .collection('transactions')
      .doc(user.uid)
      .collection('userTransactions')
      .doc(id)
      .delete();
  }, [user]);

  const value: TransactionContextType = {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetchTransactions,
    loading,
    error,
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