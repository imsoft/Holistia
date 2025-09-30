# Types Directory

Este directorio contiene todas las interfaces y tipos TypeScript utilizados en la aplicación Holistia.

## Estructura de Archivos

### `patient.ts`
- **Patient**: Información básica del paciente (usado para todos los usuarios)
- **PatientProfile**: Perfil completo del paciente
- **PatientApplication**: Estado de solicitud del paciente

### `professional.ts`
- **Professional**: Información completa del profesional
- **ProfessionalApplication**: Solicitud de nuevo profesional

### `appointment.ts`
- **Appointment**: Información de citas
- **AppointmentForm**: Formulario para crear citas
- **Availability**: Disponibilidad del profesional

### `dashboard.ts`
- **DashboardStats**: Estadísticas para dashboards
- **RecentActivity**: Actividad reciente del sistema
- **AdminStats**: Estadísticas del administrador
- **ProfessionalStats**: Estadísticas del profesional

### `form.ts`
- **BecomeProfessionalForm**: Formulario para convertirse en profesional
- **ProfileForm**: Formulario de perfil de usuario

### `navigation.ts`
- **NavItem**: Elementos de navegación
- **UserNavigation**: Navegación del usuario
- **AdminNavItem**: Navegación del administrador
- **ProfessionalNavItem**: Navegación del profesional

### `index.ts`
Archivo principal que re-exporta todos los tipos para facilitar las importaciones.

## Uso

```typescript
// Importar tipos específicos
import { Patient, Professional } from '@/types';

// Importar todos los tipos
import * as Types from '@/types';

// Importar desde archivo específico
import { Appointment } from '@/types/appointment';
import { Patient } from '@/types/patient';
```

## Convenciones

- Todas las interfaces usan PascalCase
- Los tipos de estado usan union types con strings literales
- Los campos opcionales se marcan con `?`
- Se usan tipos específicos en lugar de `any` cuando es posible
