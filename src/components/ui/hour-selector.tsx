'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface HourSelectorProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  startHour?: number;
  endHour?: number;
}

export function HourSelector({
  id,
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder = "Selecciona una hora",
  startHour = 0,
  endHour = 23
}: HourSelectorProps) {
  // Generar array de horas desde startHour hasta endHour
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => {
    const hour = startHour + i;
    return {
      value: hour.toString().padStart(2, '0') + ':00',
      label: `${hour.toString().padStart(2, '0')}:00`
    };
  });

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {hours.map((hour) => (
            <SelectItem key={hour.value} value={hour.value}>
              {hour.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
