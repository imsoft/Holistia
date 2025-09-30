# Dashboard Profesional - Holistia

## Estructura del Dashboard Profesional

El dashboard profesional está construido usando los componentes de sidebar de shadcn/ui y sigue una estructura modular y escalable.

### 🏗️ Estructura de Archivos

```
src/app/(dashboard)/(professional)/
├── layout.tsx                    # Layout principal del dashboard profesional
└── [id]/                         # Rutas dinámicas con ID del profesional
    ├── layout.tsx                # Layout específico para el profesional
    ├── dashboard/
    │   └── page.tsx              # Página principal del dashboard
    ├── appointments/
    │   └── page.tsx              # Gestión de citas
    └── patients/
        └── page.tsx              # Gestión de pacientes

src/components/
└── professional-sidebar.tsx      # Componente del sidebar profesional
```

### 🎯 Características Principales

#### 1. **Sidebar Colapsible**
- Utiliza `SidebarProvider` y `Sidebar` de shadcn/ui
- Se colapsa a iconos en pantallas pequeñas
- Navegación activa dinámica basada en la ruta actual

#### 2. **Navegación Estructurada**
- **Principal**: Dashboard, Citas, Pacientes, Mensajes
- **Analytics**: Estadísticas, Ingresos, Reseñas
- **Configuración**: Perfil, Configuración, Notificaciones

#### 3. **URLs Dinámicas**
- Todas las rutas incluyen el ID del profesional: `/professional/{id}/dashboard`
- Navegación automática basada en el ID del usuario

#### 4. **Componentes Implementados**

##### Dashboard Principal (`/professional/{id}/dashboard`)
- **Estadísticas en tiempo real**: Citas del día, pacientes activos, mensajes pendientes, ingresos
- **Próximas citas**: Lista de citas del día con detalles
- **Reseñas recientes**: Últimas evaluaciones de pacientes
- **Acciones rápidas**: Botones para funciones frecuentes

##### Gestión de Citas (`/professional/{id}/appointments`)
- **Filtros avanzados**: Por paciente, estado, fecha
- **Lista detallada**: Información completa de cada cita
- **Estados de cita**: Confirmada, Pendiente, Cancelada
- **Acciones**: Ver detalles, confirmar citas

##### Gestión de Pacientes (`/professional/{id}/patients`)
- **Vista de tarjetas**: Información visual de cada paciente
- **Estadísticas**: Total de pacientes, activos, sesiones
- **Filtros**: Por estado, tipo de terapia
- **Acciones rápidas**: Ver perfil, enviar mensaje, agendar cita

### 🎨 Diseño y UX

#### **Colores y Temas**
- Utiliza variables CSS personalizadas de shadcn/ui
- Soporte para modo oscuro automático
- Colores consistentes con el resto de la aplicación

#### **Responsive Design**
- Sidebar colapsible en dispositivos móviles
- Grid adaptativo para las tarjetas
- Navegación optimizada para touch

#### **Iconografía**
- Iconos de Lucide React consistentes
- Estados visuales claros (confirmado, pendiente, cancelado)
- Indicadores de estado en tiempo real

### 🔧 Funcionalidades Técnicas

#### **Estado de Navegación**
- Detección automática de ruta activa
- Navegación dinámica basada en ID del profesional
- Persistencia del estado del sidebar

#### **Datos Simulados**
- Datos de ejemplo para demostración
- Estructura preparada para integración con API
- Validación de tipos con TypeScript

#### **Accesibilidad**
- Navegación por teclado
- Etiquetas ARIA apropiadas
- Contraste de colores optimizado

### 🚀 Próximos Pasos

1. **Integración con API**: Conectar con backend real
2. **Autenticación**: Implementar sistema de login profesional
3. **Notificaciones**: Sistema de notificaciones en tiempo real
4. **Calendario**: Vista de calendario integrada
5. **Reportes**: Generación de reportes y analytics avanzados

### 📱 Navegación desde Usuario

El enlace "Dashboard Profesional" en el menú del usuario redirige automáticamente a:
```
/professional/{user_id}/dashboard
```

Esto permite una transición fluida entre la vista de paciente y profesional para usuarios que tienen ambos roles.

### 🛠️ Instalación y Configuración

El dashboard profesional utiliza los siguientes componentes de shadcn/ui:
- `sidebar` - Componente principal del sidebar
- `card` - Tarjetas de información
- `button` - Botones de acción
- `badge` - Etiquetas de estado
- `input` - Campos de búsqueda
- `select` - Filtros desplegables

Todos los componentes están configurados y listos para usar con el sistema de temas de la aplicación.
