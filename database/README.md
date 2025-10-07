# Base de Datos - Holistia

Esta carpeta contiene todos los archivos relacionados con la base de datos del proyecto Holistia.

## Estructura

```
database/
├── README.md                           # Este archivo
├── APLICAR_MIGRACIONES.sql            # Script completo para aplicar todas las migraciones
├── migrations/                         # Migraciones de la base de datos (22 migraciones)
│   ├── README.md                      # Documentación detallada de migraciones
│   ├── 01_create_professional_applications_table.sql
│   ├── 02_fix_auth_users_permissions.sql
│   ├── ...                           # Y muchas más
│   └── 24_setup_complete_professional_applications.sql
└── schemas/                           # (Futuro) Esquemas de base de datos
```

## 📚 Documentación

Para instrucciones detalladas de configuración del dashboard de admin, consulta:
- **[docs/INSTRUCCIONES_URGENTES.md](../docs/INSTRUCCIONES_URGENTES.md)** - Configuración inicial completa
- **[docs/INSTRUCCIONES_ADMIN_DASHBOARD.md](../docs/INSTRUCCIONES_ADMIN_DASHBOARD.md)** - Solución de problemas del dashboard

## Migraciones

### 01_create_professional_applications_table.sql
- **Descripción**: Crea la tabla `professional_applications` con todas las políticas RLS
- **Cuándo usar**: Primera instalación o cuando necesites crear la tabla desde cero
- **Incluye**:
  - Tabla completa con todos los campos
  - Políticas RLS para usuarios y administradores
  - Índices para optimización
  - Triggers para timestamps automáticos

### 02_fix_auth_users_permissions.sql
- **Descripción**: Soluciona el error "permission denied for table users"
- **Cuándo usar**: Cuando obtengas errores de permisos al insertar en `professional_applications`
- **Incluye**:
  - GRANT SELECT en auth.users para rol authenticated
  - Verificación de políticas existentes

### 03_complete_professional_applications_setup.sql
- **Descripción**: Solución completa que recrea la tabla si es necesario
- **Cuándo usar**: Cuando la tabla existe pero no tiene la estructura correcta
- **Incluye**:
  - DROP y CREATE de la tabla
  - Todas las políticas RLS
  - Índices y triggers
  - Permisos necesarios

## Cómo usar

### Para una nueva instalación:
1. Ejecuta `01_create_professional_applications_table.sql`

### Para solucionar errores de permisos:
1. Ejecuta `02_fix_auth_users_permissions.sql`

### Para recrear la tabla completamente:
1. Ejecuta `03_complete_professional_applications_setup.sql`

## Notas importantes

- ⚠️ **CUIDADO**: El archivo 03 recrea la tabla completamente, borrando todos los datos existentes
- ✅ Los archivos están numerados para indicar el orden de ejecución recomendado
- 📝 Todos los archivos incluyen comentarios explicativos
- 🔒 Las políticas RLS están configuradas para seguridad por defecto

## Tablas principales

### professional_applications
Tabla que almacena las solicitudes de profesionales de salud mental.

**Campos principales**:
- `user_id`: Referencia al usuario autenticado
- `first_name`, `last_name`, `email`, `phone`: Información personal
- `profession`, `specializations`, `experience`, `certifications`: Info profesional
- `services`: JSON con servicios y precios
- `address`, `city`, `state`, `country`: Ubicación
- `biography`, `profile_photo`, `gallery`: Información adicional
- `status`: Estado de la solicitud (pending, under_review, approved, rejected)
- `terms_accepted`, `privacy_accepted`: Términos y condiciones

**Políticas RLS**:
- Usuarios solo pueden ver/crear/actualizar sus propias solicitudes
- Administradores pueden ver y actualizar todas las solicitudes
- Solo solicitudes pendientes pueden ser actualizadas por usuarios
