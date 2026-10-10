import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [activePreview, setActivePreview] = useState(null); // { sms: {...}, email: {...} }

  const showToast = (message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const showSimulatedDispatch = (notifications) => {
    // notifications is array of { type: 'sms'|'email', recipient, subject, message }
    const sms = notifications?.find(n => n.type === 'sms');
    const email = notifications?.find(n => n.type === 'email');
    if (sms || email) {
      setActivePreview({ sms, email });
    }
  };

  const closePreview = () => setActivePreview(null);

  return (
    <NotificationContext.Provider value={{ showToast, showSimulatedDispatch, activePreview, closePreview }}>
      {children}

      {/* Render Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none max-w-md w-full px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 ${
              toast.type === 'success'
                ? 'bg-slate-900/95 border-gold-500/50 text-gold-200'
                : toast.type === 'error'
                ? 'bg-rose-950/95 border-rose-500/50 text-rose-200'
                : 'bg-slate-900/95 border-slate-700 text-slate-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">
                {toast.type === 'success' ? '✨' : toast.type === 'error' ? '⚠️' : 'ℹ️'}
              </span>
              <div className="text-sm font-medium leading-relaxed">{toast.message}</div>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
}
