"use client";

import { useState } from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  danger?: boolean;
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isLoading = false,
  danger = false,
}: ConfirmationModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (isLoading || isProcessing) return;

    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  };

  const isDisabled = isLoading || isProcessing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="neumorphism-card w-full max-w-md">
        <div className="p-6">
          <h3 className="mb-4 font-semibold text-gray-800 text-lg">{title}</h3>

          <p className="mb-6 text-gray-600 text-sm">{message}</p>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDisabled}
              className="neumorphism-button-secondary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDisabled}
              className={`px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                danger
                  ? "neumorphism-button-danger focus:ring-red-300"
                  : "neumorphism-button-primary focus:ring-blue-300"
              }`}
            >
              {isProcessing ? "処理中..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
