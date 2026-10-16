import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

let toastTrigger = null;

export function showToast(message, type = 'success') {
  if (toastTrigger) {
    toastTrigger(message, type);
  }
}

export default function Toast() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    toastTrigger = (message, type) => {
      setToast({ message, type, id: Date.now() });
    };
    return () => {
      toastTrigger = null;
    };
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className={`toast-notification ${toast.type}`}>
      <div className="toast-icon">
        {isSuccess && <CheckCircle2 size={20} />}
        {isError && <AlertCircle size={20} />}
        {!isSuccess && !isError && <Info size={20} />}
      </div>
      <div className="toast-message">{toast.message}</div>
      <button className="toast-close" onClick={() => setToast(null)}>
        <X size={15} />
      </button>
    </div>
  );
}
