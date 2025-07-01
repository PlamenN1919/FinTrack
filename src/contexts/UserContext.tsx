import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from './AuthContext';

export interface UserData {
  id: string;
  email: string;
  name: string;
  initialBalance: number;
  avatar?: string;
  // Други потребителски данни могат да се добавят тук
}

interface UserContextType {
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  updateUserData: (data: Partial<Omit<UserData, 'id' | 'email'>>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { authState } = useAuth();
  const { user } = authState;

  useEffect(() => {
    if (!user) {
      setUserData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const subscriber = firestore()
      .collection('users')
      .doc(user.uid)
      .onSnapshot(documentSnapshot => {
        if (documentSnapshot.exists) {
          const data = documentSnapshot.data();
          setUserData({
            id: user.uid,
            email: user.email || '',
            name: data?.displayName || 'Потребител',
            initialBalance: data?.initialBalance || 0,
            avatar: data?.avatar || undefined,
          });
        } else {
          // Това се случва, ако документът още не е създаден от auth тригера
          console.warn(`Потребителски документ за ${user.uid} все още не съществува.`);
          setError('Не успяхме да заредим потребителските данни.');
        }
        setLoading(false);
      }, (err) => {
        console.error("UserContext Firestore Error:", err);
        setError("Грешка при зареждане на потребителски данни.");
        setLoading(false);
      });

    return () => subscriber();
  }, [user]);

  const updateUserData = useCallback(async (data: Partial<Omit<UserData, 'id' | 'email'>>) => {
    if (!user) {
      throw new Error("Потребителят не е автентикиран, за да обнови данни.");
    }
    await firestore().collection('users').doc(user.uid).set(data, { merge: true });
  }, [user]);

  const value = {
    userData,
    loading,
    error,
    updateUserData,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser трябва да се използва в UserProvider');
  }
  return context;
}; 