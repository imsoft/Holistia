# Componente PhoneInput

## Descripción

El componente `PhoneInput` es un input de teléfono personalizado que permite a los usuarios seleccionar su código de país (lada) y escribir su número de teléfono. Este componente está diseñado para integrarse perfectamente con el resto de la UI de la aplicación y proporciona una experiencia de usuario mejorada.

## Características

- 🌍 **Selector de código de país**: Incluye los códigos de país más comunes de América Latina y otros países
- 🎨 **Diseño consistente**: Se integra con el sistema de diseño existente usando Radix UI
- ✅ **Validación integrada**: Funciones auxiliares para validar números de teléfono
- 🔄 **Sincronización automática**: Detecta y separa automáticamente el código de país del número
- 🎯 **Soporte de errores**: Muestra estados de error visuales cuando es necesario
- ♿ **Accesible**: Cumple con estándares de accesibilidad

## Instalación

El componente ya está incluido en la aplicación en:
```
src/components/ui/phone-input.tsx
```

## Uso Básico

```tsx
import { PhoneInput } from "@/components/ui/phone-input";

function MyForm() {
  const [phone, setPhone] = useState("");

  return (
    <div>
      <Label htmlFor="phone">Teléfono</Label>
      <PhoneInput
        id="phone"
        value={phone}
        onChange={setPhone}
        placeholder="55 1234 5678"
        defaultCountryCode="+52"
      />
    </div>
  );
}
```

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | `string` | `""` | Valor del teléfono completo (código + número) |
| `onChange` | `(value: string) => void` | - | Callback cuando el valor cambia |
| `onBlur` | `(e: React.FocusEvent<HTMLInputElement>) => void` | - | Callback cuando se pierde el foco |
| `placeholder` | `string` | `"1234567890"` | Placeholder para el input del número |
| `className` | `string` | - | Clases CSS adicionales para el contenedor |
| `disabled` | `boolean` | `false` | Deshabilita el input |
| `defaultCountryCode` | `string` | `"+52"` | Código de país por defecto (México) |
| `id` | `string` | - | ID del input |
| `name` | `string` | - | Nombre del input |
| `required` | `boolean` | `false` | Si el campo es requerido |
| `error` | `boolean` | `false` | Muestra el estado de error visual |

## Códigos de País Disponibles

El componente incluye los siguientes códigos de país:

- 🇲🇽 México (+52)
- 🇺🇸 Estados Unidos/Canadá (+1)
- 🇦🇷 Argentina (+54)
- 🇧🇷 Brasil (+55)
- 🇨🇱 Chile (+56)
- 🇨🇴 Colombia (+57)
- 🇨🇷 Costa Rica (+506)
- 🇪🇨 Ecuador (+593)
- 🇸🇻 El Salvador (+503)
- 🇬🇹 Guatemala (+502)
- 🇭🇳 Honduras (+504)
- 🇳🇮 Nicaragua (+505)
- 🇵🇦 Panamá (+507)
- 🇵🇾 Paraguay (+595)
- 🇵🇪 Perú (+51)
- 🇺🇾 Uruguay (+598)
- 🇻🇪 Venezuela (+58)
- 🇪🇸 España (+34)
- 🇬🇧 Reino Unido (+44)
- 🇫🇷 Francia (+33)
- 🇩🇪 Alemania (+49)
- 🇮🇹 Italia (+39)

## Ejemplo con Validación de Errores

```tsx
import { PhoneInput, validatePhoneNumber } from "@/components/ui/phone-input";
import { useState } from "react";

function FormWithValidation() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (value && !validatePhoneNumber(value)) {
      setError("El número de teléfono no es válido");
    } else {
      setError("");
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="phone">Teléfono *</Label>
      <PhoneInput
        id="phone"
        value={phone}
        onChange={handlePhoneChange}
        error={!!error}
        defaultCountryCode="+52"
      />
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
}
```

## Ejemplo con React Hook Form

```tsx
import { PhoneInput } from "@/components/ui/phone-input";
import { useForm, Controller } from "react-hook-form";

function FormWithHookForm() {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      phone: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="phone"
        control={control}
        rules={{ 
          required: "El teléfono es requerido",
          validate: (value) => validatePhoneNumber(value) || "Número inválido"
        }}
        render={({ field, fieldState }) => (
          <div className="space-y-2">
            <Label>Teléfono *</Label>
            <PhoneInput
              {...field}
              error={!!fieldState.error}
              defaultCountryCode="+52"
            />
            {fieldState.error && (
              <p className="text-red-500 text-sm">{fieldState.error.message}</p>
            )}
          </div>
        )}
      />
    </form>
  );
}
```

## Funciones Auxiliares

### validatePhoneNumber(phone: string): boolean

Valida que un número de teléfono tenga un código de país válido y al menos 7 dígitos.

```tsx
import { validatePhoneNumber } from "@/components/ui/phone-input";

const isValid = validatePhoneNumber("+52 55 1234 5678"); // true
const isInvalid = validatePhoneNumber("1234"); // false
```

### formatPhoneNumber(phone: string): string

Formatea un número de teléfono eliminando espacios innecesarios.

```tsx
import { formatPhoneNumber } from "@/components/ui/phone-input";

const formatted = formatPhoneNumber("  +52  55 1234 5678  "); // "+52 55 1234 5678"
```

## Lugares donde se utiliza actualmente

El componente `PhoneInput` está implementado en los siguientes formularios:

1. **Formulario de Convertirse en Profesional** (`src/app/(dashboard)/(patient)/patient/[id]/explore/become-professional/page.tsx`)
2. **Página de Perfil del Paciente** (`src/app/(dashboard)/(patient)/patient/[id]/explore/profile/page.tsx`)
3. **Editor de Perfil Profesional** (`src/components/ui/professional-profile-editor.tsx`)
4. **Página de Contacto** (`src/app/(website)/contact/page.tsx`)

## Personalización

Para agregar más códigos de país, edita el array `COUNTRY_CODES` en `src/components/ui/phone-input.tsx`:

```tsx
export const COUNTRY_CODES = [
  // ... códigos existentes
  { code: "+81", country: "Japón", flag: "🇯🇵" },
  { code: "+86", country: "China", flag: "🇨🇳" },
];
```

## Notas de Implementación

- El componente almacena el número de teléfono completo (código de país + número) en un solo string
- Los números se sanitizan automáticamente para permitir solo dígitos, espacios, guiones y paréntesis
- El código de país se detecta automáticamente si el valor inicial ya incluye uno
- El componente es completamente controlado y requiere manejar el estado externamente

## Soporte y Mejoras Futuras

Posibles mejoras para el futuro:
- Formateo automático según el país seleccionado
- Validación específica por país
- Auto-detección del país basado en la ubicación del usuario
- Soporte para extensiones telefónicas
- Búsqueda de países en el selector

