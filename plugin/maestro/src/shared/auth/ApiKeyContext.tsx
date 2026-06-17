import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  clearApiKey,
  loadApiKey,
  saveApiKey,
  StoredApiKey,
} from './ApiKeyStorage';

interface ApiKeyContextValue {
  apiKey: string | null;
  storedKey: StoredApiKey | null;
  hasKey: boolean;
  setApiKey: (key: string, label?: string) => void;
  clearKey: () => void;
  requestKey: (reason?: string) => void;
  isModalOpen: boolean;
  modalReason: string | null;
  closeModal: () => void;
}

const ApiKeyContext = createContext<ApiKeyContextValue | null>(null);

export interface ApiKeyProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that manages API key state across the entire plugin.
 *
 * SECURITY: API keys are stored ONLY in localStorage and must be entered
 * via the UI. Environment variables are intentionally not supported to
 * prevent key leakage via the JavaScript bundle.
 */
export const ApiKeyProvider: React.FC<ApiKeyProviderProps> = ({ children }) => {
  const [storedKey, setStoredKey] = useState<StoredApiKey | null>(() => loadApiKey());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalReason, setModalReason] = useState<string | null>(null);

  // Sync across browser tabs via storage event
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== 'maestro_api_key') return;
      const loaded = loadApiKey();
      setStoredKey(loaded);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setApiKey = useCallback((key: string, label?: string) => {
    const saved = saveApiKey(key, label);
    setStoredKey(saved);
    setIsModalOpen(false);
    setModalReason(null);
  }, []);

  const clearKey = useCallback(() => {
    clearApiKey();
    setStoredKey(null);
  }, []);

  const requestKey = useCallback((reason?: string) => {
    setModalReason(reason ?? null);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalReason(null);
  }, []);

  const value = useMemo<ApiKeyContextValue>(
    () => ({
      apiKey: storedKey?.key ?? null,
      storedKey,
      hasKey: Boolean(storedKey?.key),
      setApiKey,
      clearKey,
      requestKey,
      isModalOpen,
      modalReason,
      closeModal,
    }),
    [storedKey, setApiKey, clearKey, requestKey, isModalOpen, modalReason, closeModal]
  );

  return <ApiKeyContext.Provider value={value}>{children}</ApiKeyContext.Provider>;
};

export function useApiKey(): ApiKeyContextValue {
  const context = useContext(ApiKeyContext);
  if (!context) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
}
