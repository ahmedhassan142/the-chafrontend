"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import jwt from 'jsonwebtoken'

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // In AuthContext.tsx
// Updated checkAuth in AuthContext.tsx
const checkAuth = async (): Promise<boolean> => {
  setIsLoading(true);
  try {
    const cookieToken = Cookies.get("authToken");
    if (!cookieToken) return false;

    // Verify token locally first (quick check)
    try {
      jwt.verify(cookieToken, process.env.JWTPRIVATEKEY!);
    } catch (e) {
      Cookies.remove("authToken");
      return false;
    }

    // Verify with backend by making a lightweight request
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4001"}/api/user/profile`,
      {
        headers: { Authorization: `Bearer ${cookieToken}` },
        withCredentials: true
      }
    );

    if (response.data.user) {
      setToken(cookieToken);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  } catch (error) {
    Cookies.remove("authToken");
    return false;
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(config => {
      // Send both cookie and Bearer token for maximum compatibility
      const cookieToken = Cookies.get("authToken");
      if (cookieToken) {
        config.headers.Authorization = `Bearer ${cookieToken}`;
        config.withCredentials = true;
      }
      return config;
    });

    const responseInterceptor = axios.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401) {
          await logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [token]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:4001"}/api/user/login`,
        { email, password },
        { withCredentials: true }
      );
      
      // Store token in both cookie and state
      if (response.data.token) {
        Cookies.set("authToken", response.data.token, { expires: 7, secure: true });
        setToken(response.data.token);
      }
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:4001"}/api/user/logout`,
        {},
        { 
          headers: {
            Authorization: `Bearer ${token}`
          },
          withCredentials: true 
        }
      );
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setToken(null);
      setIsAuthenticated(false);
      Cookies.remove("authToken");
      router.push('/');
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      token, 
      isLoading,
      login, 
      logout, 
      checkAuth 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};