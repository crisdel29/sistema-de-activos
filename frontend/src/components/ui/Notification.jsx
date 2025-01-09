// src/components/ui/Notification.jsx
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Notification = ({ message, type = 'info', onClose }) => {
  if (!message) return null;

  // Determinar la clase de color según el tipo
  const getAlertClass = () => {
    switch (type) {
      case 'error':
        return 'bg-red-50 text-red-700';
      case 'success':
        return 'bg-green-50 text-green-700';
      case 'warning':
        return 'bg-yellow-50 text-yellow-700';
      default:
        return 'bg-blue-50 text-blue-700';
    }
  };

  return (
    <Alert className={`mb-4 ${getAlertClass()}`}>
      <AlertDescription>{message}</AlertDescription>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          aria-label="Cerrar notificación"
        >
          ×
        </button>
      )}
    </Alert>
  );
};

export default Notification;