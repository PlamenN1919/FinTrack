import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Тип за потребителски данни
export interface UserData {
  name: string;
  email: string;
  joinDate: string;
  avatar: string;
}

// Тип за контекста
interface UserContextType {
  userData: UserData;
  updateUserData: (data: Partial<UserData>) => void;
}

// Създаване на контекста
const UserContext = createContext<UserContextType | undefined>(undefined);

// Примерно изображение за профил
const DEFAULT_AVATAR = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

// Генерира Gravatar URL от имейл
const getGravatarUrl = (email: string): string => {
  // Gravatar използва MD5 hash на имейла, но за простота ще използваме default
  // В реално приложение може да се добави crypto-js за MD5 hash
  const cleanEmail = email.trim().toLowerCase();
  // Използваме identicon за уникална генерирана икона базирана на имейла
  return `https://www.gravatar.com/avatar/${cleanEmail}?d=identicon&s=200`;
};

// Форматира датата като "DD.MM.YYYY"
const formatDate = (date: Date | string | undefined): string => {
  if (!date) {
    return 'Неизвестна дата';
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Неизвестна дата';
  }
  
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${day}.${month}.${year}`;
};

// Извлича име от имейл (ако displayName е празно)
const extractNameFromEmail = (email: string): string => {
  if (!email) return 'Потребител';
  
  const localPart = email.split('@')[0];
  // Заменяме точки и долни черти с интервали, капитализираме първите букви
  return localPart
    .replace(/[._-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Provider компонент
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { authState } = useAuth();
  
  // Инициализираме с реални данни от Firebase Auth
  const [userData, setUserData] = useState<UserData>(() => {
    const user = authState.user;
    if (user) {
      return {
        name: user.displayName || extractNameFromEmail(user.email || ''),
        email: user.email || '',
        joinDate: formatDate(user.createdAt),
        avatar: user.photoURL || getGravatarUrl(user.email || ''),
      };
    }
    return {
      name: 'Потребител',
      email: '',
      joinDate: formatDate(new Date()),
      avatar: DEFAULT_AVATAR,
    };
  });

  // Синхронизираме с Firebase Auth когато потребителят се промени
  useEffect(() => {
    const user = authState.user;
    if (user) {
      setUserData({
        name: user.displayName || extractNameFromEmail(user.email || ''),
        email: user.email || '',
        joinDate: formatDate(user.createdAt),
        avatar: user.photoURL || getGravatarUrl(user.email || ''),
      });
    }
  }, [authState.user]);

  const updateUserData = (data: Partial<UserData>) => {
    setUserData(prev => ({ ...prev, ...data }));
  };

  const value: UserContextType = {
    userData,
    updateUserData,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Hook за използване на контекста
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser трябва да се използва в UserProvider');
  }
  return context;
}; 