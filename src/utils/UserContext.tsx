import React, { createContext, useContext, useState, ReactNode } from 'react';

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

// Примерни данни за потребителя
const initialUserData: UserData = {
  name: 'Мартин Петров',
  email: 'martin.petrov@example.com',
  joinDate: '01.03.2024',
  avatar: DEFAULT_AVATAR
};

// Provider компонент
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData>(initialUserData);

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