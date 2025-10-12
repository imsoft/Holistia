# 🗄️ Base de Datos - Holistia

Documentación completa de la base de datos del proyecto Holistia.

## 📁 Estructura

```
database/
├── README.md                    # Este archivo
├── migrations/                  # Migraciones SQL numeradas (39 migraciones activas)
│   ├── README.md               # Documentación detallada de cada migración
│   ├── 01_*.sql                # Migraciones numeradas en orden
│   ├── ...
│   ├── 39_*.sql
│   ├── README_PHONE_MIGRATION.md           # Docs: Migración de teléfono
│   └── README_ACCOUNT_DEACTIVATION.md      # Docs: Desactivación de cuentas
├── email-templates/            # Plantillas de emails
│   ├── confirm-signup.html
│   ├── reset-password.html
│   └── event-payment-confirmation.html
└── schemas/                    # (Futuro) Esquemas de base de datos
```

## 🎯 Inicio Rápido

### Nuevo Proyecto
Para configurar la base de datos desde cero:

1. **Ve a Supabase Dashboard** → SQL Editor
2. **Ejecuta las migraciones** en el orden indicado en [`migrations/README.md`](./migrations/README.md)
3. **Verifica la instalación**:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

### Proyecto Existente
Si ya tienes algunas migraciones aplicadas:

1. **Verifica qué tienes**:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
2. **Aplica solo las faltantes** según el índice en `migrations/README.md`

## 📊 Tablas Principales

| Tabla | Descripción | Migración |
|-------|-------------|-----------|
| `professional_applications` | Solicitudes de profesionales | 01, 22-24, 35-37 |
| `professional_services` | Servicios ofrecidos | 16-17, 26 |
| `appointments` | Citas entre pacientes y profesionales | 05 |
| `availability_blocks` | Bloqueos de disponibilidad | 18-19, 25 |
| `events_workshops` | Eventos y talleres | 27-28, 38 |
| `event_registrations` | Registros a eventos | 31-33 |
| `blog_posts` | Posts del blog | 14 |
| `payments` | Pagos de servicios | 15, 32 |
| `user_favorites` | Favoritos de usuarios | 04 |

## 🪣 Storage Buckets

| Bucket | Descripción | Migración |
|--------|-------------|-----------|
| `professional-gallery` | Fotos de perfil y galería de profesionales | 07 |
| `blog-images` | Imágenes del blog | 10, 12 |
| `event-gallery` | Imágenes de eventos | 29-30 |
| `consultorios` | Imágenes de consultorios | 13 |

## 🔐 Seguridad (RLS)

Todas las tablas tienen **Row Level Security (RLS)** configurado:

- ✅ **Usuarios**: Solo acceden a sus propios datos
- ✅ **Profesionales**: Acceso a sus servicios, citas y eventos
- ✅ **Administradores**: Acceso completo para gestión
- ✅ **Storage**: Políticas de lectura pública y escritura autenticada

## 📖 Documentación Detallada

### En esta carpeta:
- **[migrations/README.md](./migrations/README.md)** - Índice completo de migraciones
- **[migrations/README_PHONE_MIGRATION.md](./migrations/README_PHONE_MIGRATION.md)** - Migración de campo teléfono
- **[migrations/README_ACCOUNT_DEACTIVATION.md](./migrations/README_ACCOUNT_DEACTIVATION.md)** - Sistema de desactivación

### En docs/:
- **[../docs/SETUP_DATABASE.md](../docs/SETUP_DATABASE.md)** - Guía completa de setup
- **[../docs/INSTRUCCIONES_ADMIN_DASHBOARD.md](../docs/INSTRUCCIONES_ADMIN_DASHBOARD.md)** - Dashboard admin
- **[../docs/INSTRUCCIONES_URGENTES.md](../docs/INSTRUCCIONES_URGENTES.md)** - Solución de problemas

## 🛠️ Herramientas

### SQL Editor en Supabase
1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. Click en **SQL Editor** en el menú lateral
3. Pega el contenido de la migración
4. Click en **Run** (botón verde)

### Verificar Migraciones Aplicadas
```sql
-- Ver todas las tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Ver todas las columnas de una tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'professional_applications'
ORDER BY ordinal_position;

-- Ver políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'professional_applications';

-- Ver buckets de storage
SELECT id, name, public
FROM storage.buckets;
```

## ⚡ Tips y Mejores Prácticas

### ✅ Hacer
- Ejecutar migraciones en orden numérico
- Leer los comentarios en cada archivo
- Hacer backup antes de migraciones destructivas
- Verificar el resultado después de cada migración
- Usar `IF NOT EXISTS` para idempotencia

### ❌ Evitar
- Ejecutar migraciones fuera de orden
- Modificar migraciones ya aplicadas
- Ejecutar migraciones de "recreate" en producción sin backup
- Saltar migraciones necesarias

## 🔄 Historial de Cambios

### Última Limpieza: Octubre 2025
- ✅ Eliminados 16 archivos SQL obsoletos y duplicados
- ✅ Consolidados READMEs redundantes
- ✅ Organizada documentación por categorías
- ✅ Mantenidas solo 39 migraciones activas y necesarias

### Archivos Eliminados:
- Archivos `SOLUCION_*.sql` (temporales)
- Scripts `APLICAR_*.sql` (consolidados)
- Migraciones duplicadas de eventos
- Versiones obsoletas de blog posts
- READMEs temporales de troubleshooting

## 📞 Soporte

¿Problemas con las migraciones?
1. Revisa `migrations/README.md` para el índice completo
2. Consulta la documentación específica en los archivos `README_*.md`
3. Revisa los comentarios dentro de cada migración SQL

---

**Última actualización**: Octubre 12, 2025  
**Total de migraciones activas**: 39  
**Total de tablas**: 9 principales + storage buckets
