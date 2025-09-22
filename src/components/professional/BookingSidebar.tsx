"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, CheckCircle } from "lucide-react";

interface AvailableSlot {
  date: string;
  time: string;
  available: boolean;
}

interface BookingSidebarProps {
  availableSlots: AvailableSlot[];
  availability: string;
  schedule: string[];
}

const BookingSidebar = ({ availableSlots, availability, schedule }: BookingSidebarProps) => {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isBookingConfirmed, setIsBookingConfirmed] = useState<boolean>(false);

  // Obtener fechas únicas disponibles
  const availableDates = [...new Set(availableSlots.map(slot => slot.date))].sort();

  // Obtener horarios disponibles para la fecha seleccionada
  const availableTimes = selectedDate ?
    availableSlots
      .filter(slot => slot.date === selectedDate && slot.available)
      .map(slot => slot.time)
      .sort() : [];

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(""); // Reset time when date changes
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleConfirmBooking = () => {
    if (selectedDate && selectedTime) {
      // Aquí se implementaría la lógica para confirmar la cita
      setIsBookingConfirmed(true);
      
      // Opcional: Limpiar la selección después de confirmar
      setTimeout(() => {
        setSelectedDate("");
        setSelectedTime("");
        setIsBookingConfirmed(false);
      }, 5000); // El mensaje desaparece después de 5 segundos
    }
  };

  return (
    <div className="space-y-6 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
      {/* Reservar Cita */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Reservar Cita
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selección de fecha */}
          <div>
            <label className="text-sm font-medium mb-2 block">Seleccionar fecha:</label>
            <div className="grid grid-cols-2 gap-2">
              {availableDates.map((date) => {
                const dateObj = new Date(date);
                const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'short' });
                const dayNumber = dateObj.getDate();
                const month = dateObj.toLocaleDateString('es-ES', { month: 'short' });
                
                return (
                  <Button
                    key={date}
                    variant={selectedDate === date ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleDateSelect(date)}
                    className="flex items-center justify-center p-2 h-auto"
                  >
                    <span className="text-xs">{dayName} {dayNumber} {month}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Selección de horario */}
          {selectedDate && (
            <div>
              <label className="text-sm font-medium mb-2 block">Seleccionar horario:</label>
              <div className="grid grid-cols-3 gap-2">
                {availableTimes.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTimeSelect(time)}
                    className="text-sm"
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Botón de confirmación */}
          {selectedDate && selectedTime && !isBookingConfirmed && (
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleConfirmBooking}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Confirmar Cita
            </Button>
          )}

          {/* Mensaje de éxito */}
          {isBookingConfirmed && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-800">¡Cita confirmada!</p>
                <p className="text-sm text-green-600">
                  Tu cita ha sido agendada para el {new Date(selectedDate).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} a las {selectedTime}
                </p>
                <p className="text-xs text-green-500 mt-1">
                  Recibirás un email de confirmación en breve.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disponibilidad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Disponibilidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center text-green-600">
              <Clock className="h-4 w-4 mr-2" />
              <span className="font-medium">{availability}</span>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">Horarios de Atención:</p>
              <ul className="space-y-1">
                {schedule.map((scheduleItem, index) => (
                  <li key={index} className="text-sm text-muted-foreground">{scheduleItem}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingSidebar;
