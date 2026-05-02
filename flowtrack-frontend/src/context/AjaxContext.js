import React, { createContext, useContext, useMemo, useState } from 'react';

const AjaxContext = createContext(null);

export const useAjax = () => {
  const ctx = useContext(AjaxContext);
  if (!ctx) throw new Error('useAjax must be used within AjaxProvider');
  return ctx;
};

export const AjaxProvider = ({ children }) => {
  const [pending, setPending] = useState(0);

  const value = useMemo(() => ({
    pending,
    start: () => setPending((p) => p + 1),
    stop: () => setPending((p) => Math.max(0, p - 1)),
    reset: () => setPending(0),
    isLoading: pending > 0,
  }), [pending]);

  return <AjaxContext.Provider value={value}>{children}</AjaxContext.Provider>;
};