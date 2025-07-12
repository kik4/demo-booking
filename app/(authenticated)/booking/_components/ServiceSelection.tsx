"use client";

import { useId } from "react";
import type { Service } from "../_actions/types";

interface ServiceSelectionProps {
  selectedService: string;
  notes: string;
  services: Service[];
  onServiceChange: (service: string) => void;
  onNotesChange: (notes: string) => void;
  onNext: () => void;
  disabled?: boolean;
}

export function ServiceSelection({
  selectedService,
  notes,
  services,
  onServiceChange,
  onNotesChange,
  onNext,
  disabled = false,
}: ServiceSelectionProps) {
  const serviceSelectId = useId();
  const notesInputId = useId();

  const selectedServiceData = services.find(
    (s) => s.id.toString() === selectedService,
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 font-bold text-2xl text-gray-800">サービス選択</h2>
        <p className="text-gray-600">ご希望のサービスを選択してください</p>
      </div>

      <div>
        <label
          htmlFor={serviceSelectId}
          className="mb-2 block font-medium text-gray-700 text-sm"
        >
          サービス <span className="text-red-500">*</span>
        </label>
        <select
          id={serviceSelectId}
          value={selectedService}
          onChange={(e) => onServiceChange(e.target.value)}
          className="neumorphism-input block w-full px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={disabled}
        >
          <option value="">サービスを選択してください</option>
          {services.map((service) => (
            <option key={service.id} value={service.id.toString()}>
              {service.name} - {service.duration}分 - ¥
              {service.price.toLocaleString()}
            </option>
          ))}
        </select>
      </div>

      {selectedServiceData && (
        <div className="neumorphism-card bg-blue-50 p-4">
          <h3 className="mb-2 font-semibold text-blue-800">
            選択されたサービス
          </h3>
          <div className="space-y-1 text-blue-700 text-sm">
            <p>
              <span className="font-medium">サービス名:</span>{" "}
              {selectedServiceData.name}
            </p>
            <p>
              <span className="font-medium">所要時間:</span>{" "}
              {selectedServiceData.duration}分
            </p>
            <p>
              <span className="font-medium">料金:</span> ¥
              {selectedServiceData.price.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      <div>
        <label
          htmlFor={notesInputId}
          className="mb-2 block font-medium text-gray-700 text-sm"
        >
          備考・ご要望
        </label>
        <textarea
          id={notesInputId}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="neumorphism-input block w-full resize-none px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={4}
          placeholder="ご要望やお悩みがございましたらお気軽にお書きください"
          disabled={disabled}
        />
        <p className="mt-1 text-gray-500 text-xs">{notes.length}/500文字</p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={!selectedService || disabled}
          className="neumorphism-button-primary px-6 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          次へ
        </button>
      </div>
    </div>
  );
}
