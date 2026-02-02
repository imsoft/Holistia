"use client";

import { useState } from "react";
import { Clock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface DaySchedule {
  day: string;
  enabled: boolean;
  hours: { open: string; close: string }[];
}

interface ScheduleEditorProps {
  schedule: DaySchedule[];
  onChange: (schedule: DaySchedule[]) => void;
}

const DAYS = [
  { value: "monday", label: "Lunes" },
  { value: "tuesday", label: "Martes" },
  { value: "wednesday", label: "Miércoles" },
  { value: "thursday", label: "Jueves" },
  { value: "friday", label: "Viernes" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return { value: `${hour}:00`, label: `${hour}:00` };
});

const MINUTES = ["00", "15", "30", "45"];

// Generar todas las combinaciones de horas y minutos
const TIME_OPTIONS = HOURS.flatMap((hour) =>
  MINUTES.map((minute) => ({
    value: `${hour.value.split(":")[0]}:${minute}`,
    label: `${hour.value.split(":")[0]}:${minute}`,
  }))
);

export function ScheduleEditor({ schedule, onChange }: ScheduleEditorProps) {
  const handleDayToggle = (dayIndex: number) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].enabled = !newSchedule[dayIndex].enabled;

    // Si se habilita y no tiene horarios, agregar uno por defecto
    if (newSchedule[dayIndex].enabled && newSchedule[dayIndex].hours.length === 0) {
      newSchedule[dayIndex].hours = [{ open: "09:00", close: "18:00" }];
    }

    onChange(newSchedule);
  };

  const handleAddTimeSlot = (dayIndex: number) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].hours.push({ open: "09:00", close: "18:00" });
    onChange(newSchedule);
  };

  const handleRemoveTimeSlot = (dayIndex: number, slotIndex: number) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].hours.splice(slotIndex, 1);
    onChange(newSchedule);
  };

  const handleTimeChange = (
    dayIndex: number,
    slotIndex: number,
    type: "open" | "close",
    value: string
  ) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].hours[slotIndex][type] = value;
    onChange(newSchedule);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span>Configure los horarios de atención por día</span>
      </div>

      {schedule.map((daySchedule, dayIndex) => (
        <Card key={daySchedule.day} className="p-4">
          <div className="space-y-3">
            {/* Checkbox del día */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`day-${daySchedule.day}`}
                  checked={daySchedule.enabled}
                  onCheckedChange={() => handleDayToggle(dayIndex)}
                />
                <Label
                  htmlFor={`day-${daySchedule.day}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {DAYS.find((d) => d.value === daySchedule.day)?.label}
                </Label>
              </div>

              {daySchedule.enabled && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddTimeSlot(dayIndex)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Agregar horario
                </Button>
              )}
            </div>

            {/* Horarios del día */}
            {daySchedule.enabled && (
              <div className="ml-6 space-y-2">
                {daySchedule.hours.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay horarios configurados
                  </p>
                ) : (
                  daySchedule.hours.map((timeSlot, slotIndex) => (
                    <div key={slotIndex} className="flex items-center gap-2">
                      <Select
                        value={timeSlot.open}
                        onValueChange={(value) =>
                          handleTimeChange(dayIndex, slotIndex, "open", value)
                        }
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((time) => (
                            <SelectItem key={time.value} value={time.value}>
                              {time.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <span className="text-sm text-muted-foreground">a</span>

                      <Select
                        value={timeSlot.close}
                        onValueChange={(value) =>
                          handleTimeChange(dayIndex, slotIndex, "close", value)
                        }
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((time) => (
                            <SelectItem key={time.value} value={time.value}>
                              {time.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveTimeSlot(dayIndex, slotIndex)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

// Función helper para inicializar schedule vacío
export function createEmptySchedule(): DaySchedule[] {
  return DAYS.map((day) => ({
    day: day.value,
    enabled: false,
    hours: [],
  }));
}

// Función helper para parsear schedule desde JSON string o objeto JSONB
export function parseScheduleFromString(scheduleData: string | DaySchedule[] | null | undefined): DaySchedule[] {
  if (!scheduleData) return createEmptySchedule();

  // Si ya es un array (objeto JSONB desde la base de datos), retornarlo directamente
  if (Array.isArray(scheduleData)) return scheduleData;

  // Si es un string, intentar parsearlo
  if (typeof scheduleData === 'string') {
    try {
      const parsed = JSON.parse(scheduleData);
      if (Array.isArray(parsed)) return parsed;
      return createEmptySchedule();
    } catch {
      return createEmptySchedule();
    }
  }

  return createEmptySchedule();
}

// Función helper para formatear schedule para mostrar
export function formatScheduleForDisplay(schedule: DaySchedule[]): string {
  const enabledDays = schedule.filter((d) => d.enabled && d.hours.length > 0);

  if (enabledDays.length === 0) return "No hay horarios configurados";

  return enabledDays
    .map((day) => {
      const dayLabel = DAYS.find((d) => d.value === day.day)?.label;
      const hours = day.hours.map((h) => `${h.open} - ${h.close}`).join(", ");
      return `${dayLabel}: ${hours}`;
    })
    .join("\n");
}
