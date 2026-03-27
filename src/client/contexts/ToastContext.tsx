import { createContext, useContext, useEffect, useRef, useState } from "react";

type ToastTone = "info" | "success" | "warning" | "danger";

type Toast = {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastInput = Omit<Toast, "id">;

type ToastContextValue = {
  toasts: Toast[];
  addToast: (toast: ToastInput) => string;
  removeToast: (toastId: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutMap = useRef<Map<string, number>>(new Map());

  function removeToast(toastId: string) {
    const timeoutId = timeoutMap.current.get(toastId);

    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutMap.current.delete(toastId);
    }

    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId));
  }

  function addToast(toast: ToastInput) {
    const toastId = crypto.randomUUID();
    setToasts((currentToasts) => [...currentToasts, { ...toast, id: toastId }]);

    const timeoutId = window.setTimeout(() => {
      removeToast(toastId);
    }, 4500);

    timeoutMap.current.set(toastId, timeoutId);
    return toastId;
  }

  useEffect(() => {
    return () => {
      timeoutMap.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return context;
}
