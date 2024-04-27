// UserIDContext.tsx

import React, { createContext, useState } from 'react';

// Define a type for the context value
type UserIDContextType = {
  userID: string | null;
  setUserID: React.Dispatch<React.SetStateAction<string | null>>;
};

type UserIDProviderProps = {
  children: React.ReactNode;
  value: UserIDContextType;
};

// Use the UserIDContextType when creating the UserIDContext
export const UserIDContext = React.createContext<UserIDContextType | null>(null);

export const UserIDProvider: React.FC<UserIDProviderProps> = ({ children, value }: any) => {
  const [userID, setUserID] = useState<string | null>(null);

  return (
    <UserIDContext.Provider value={{ userID, setUserID }}>
      {children}
    </UserIDContext.Provider>
  );
};