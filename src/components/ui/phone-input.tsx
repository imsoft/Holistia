"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Lista de códigos de país más comunes en América Latina y otros países
export const COUNTRY_CODES = [
  { code: "+52", country: "México", flag: "🇲🇽" },
  { code: "+1", country: "Estados Unidos/Canadá", flag: "🇺🇸" },
  { code: "+54", country: "Argentina", flag: "🇦🇷" },
  { code: "+55", country: "Brasil", flag: "🇧🇷" },
  { code: "+56", country: "Chile", flag: "🇨🇱" },
  { code: "+57", country: "Colombia", flag: "🇨🇴" },
  { code: "+506", country: "Costa Rica", flag: "🇨🇷" },
  { code: "+593", country: "Ecuador", flag: "🇪🇨" },
  { code: "+503", country: "El Salvador", flag: "🇸🇻" },
  { code: "+502", country: "Guatemala", flag: "🇬🇹" },
  { code: "+504", country: "Honduras", flag: "🇭🇳" },
  { code: "+505", country: "Nicaragua", flag: "🇳🇮" },
  { code: "+507", country: "Panamá", flag: "🇵🇦" },
  { code: "+595", country: "Paraguay", flag: "🇵🇾" },
  { code: "+51", country: "Perú", flag: "🇵🇪" },
  { code: "+598", country: "Uruguay", flag: "🇺🇾" },
  { code: "+58", country: "Venezuela", flag: "🇻🇪" },
  { code: "+34", country: "España", flag: "🇪🇸" },
  { code: "+44", country: "Reino Unido", flag: "🇬🇧" },
  { code: "+33", country: "Francia", flag: "🇫🇷" },
  { code: "+49", country: "Alemania", flag: "🇩🇪" },
  { code: "+39", country: "Italia", flag: "🇮🇹" },
];

export interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  defaultCountryCode?: string;
  id?: string;
  name?: string;
  required?: boolean;
  error?: boolean;
}

export function PhoneInput({
  value = "",
  onChange,
  onBlur,
  placeholder = "1234567890",
  className,
  disabled = false,
  defaultCountryCode = "+52",
  id,
  name,
  required = false,
  error = false,
}: PhoneInputProps) {
  // Separar el código de país del número
  const parsePhoneValue = (phoneValue: string) => {
    if (!phoneValue) {
      return { countryCode: defaultCountryCode, number: "" };
    }

    // Buscar si el valor comienza con algún código de país conocido
    const matchedCode = COUNTRY_CODES.find((c) =>
      phoneValue.startsWith(c.code)
    );

    if (matchedCode) {
      return {
        countryCode: matchedCode.code,
        number: phoneValue.slice(matchedCode.code.length).trim(),
      };
    }

    // Si no hay código, asumir el código por defecto
    return { countryCode: defaultCountryCode, number: phoneValue };
  };

  const { countryCode: initialCountryCode, number: initialNumber } =
    parsePhoneValue(value);

  const [countryCode, setCountryCode] = React.useState(initialCountryCode);
  const [phoneNumber, setPhoneNumber] = React.useState(initialNumber);

  // Actualizar cuando cambia el valor externo
  React.useEffect(() => {
    const { countryCode: newCountryCode, number: newNumber } =
      parsePhoneValue(value);
    setCountryCode(newCountryCode);
    setPhoneNumber(newNumber);
  }, [value]);

  const handleCountryCodeChange = (newCode: string) => {
    setCountryCode(newCode);
    const fullPhone = `${newCode} ${phoneNumber}`.trim();
    onChange?.(fullPhone);
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value;
    // Solo permitir números, espacios y guiones
    const sanitizedNumber = newNumber.replace(/[^\d\s\-()]/g, "");
    setPhoneNumber(sanitizedNumber);
    const fullPhone = `${countryCode} ${sanitizedNumber}`.trim();
    onChange?.(fullPhone);
  };

  return (
    <div className={cn("flex gap-2", className)}>
      <Select
        value={countryCode}
        onValueChange={handleCountryCodeChange}
        disabled={disabled}
      >
        <SelectTrigger
          className={cn(
            "w-[140px] shrink-0",
            error && "border-red-500 focus-visible:ring-red-500"
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COUNTRY_CODES.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <div className="flex items-center gap-2">
                <span>{country.flag}</span>
                <span>{country.code}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        id={id}
        name={name}
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneNumberChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={cn(
          "flex-1",
          error && "border-red-500 focus-visible:ring-red-500"
        )}
      />
    </div>
  );
}

// Función auxiliar para formatear números de teléfono
export function formatPhoneNumber(phone: string): string {
  if (!phone) return "";
  return phone.trim();
}

// Función auxiliar para validar números de teléfono
export function validatePhoneNumber(phone: string): boolean {
  if (!phone) return false;
  // Validar que tenga al menos un código de país y algunos dígitos
  const hasCountryCode = COUNTRY_CODES.some((c) => phone.startsWith(c.code));
  const hasDigits = /\d{7,}/.test(phone); // Al menos 7 dígitos
  return hasCountryCode && hasDigits;
}

