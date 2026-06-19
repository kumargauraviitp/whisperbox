import { useState, useEffect, type ReactNode } from 'react';
import { api, API_BASE } from './api';
import { AuthContext } from './authContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function verifySession() {
      try {
        const response = await fetch(`${API_BASE}/api/admin/verify`, {
          credentials: 'include',
        });

        if (!mounted) {
          return;
        }

        setIsAuthenticated(response.ok);
      } catch {
        if (mounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    verifySession();

    return () => {
      mounted = false;
    };
  }, []);

  const login = () => {
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await api.adminLogout();
    } catch (e) {
      console.error(e);
    }
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
