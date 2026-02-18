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
  /** Si true, incluye opciones :00 y :30 (ej. 12:00, 12:30) para medias horas */
  includeHalfHours?: boolean;
  className?: string;
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
  endHour = 23,
  includeHalfHours = false,
  className
}: HourSelectorProps) {
  const options = includeHalfHours
    ? (() => {
        const list: { value: string; label: string }[] = [];
        for (let h = startHour; h <= endHour; h++) {
          list.push({ value: `${String(h).padStart(2, '0')}:00`, label: `${String(h).padStart(2, '0')}:00` });
          if (h < 24) {
            list.push({ value: `${String(h).padStart(2, '0')}:30`, label: `${String(h).padStart(2, '0')}:30` });
          }
        }
        return list;
      })()
    : Array.from({ length: endHour - startHour + 1 }, (_, i) => {
        const hour = startHour + i;
        return {
          value: hour.toString().padStart(2, '0') + ':00',
          label: `${hour.toString().padStart(2, '0')}:00`,
        };
      });

  const normalizedValue = value?.substring(0, 5);
  const valueInOptions = options.some((o) => o.value === normalizedValue) ? normalizedValue : (options[0]?.value ?? value);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Select
        value={valueInOptions}
        onValueChange={onChange}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
