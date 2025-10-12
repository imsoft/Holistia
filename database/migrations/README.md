# Migraciones de Base de Datos - Holistia

Esta carpeta contiene todas las migraciones SQL organizadas y numeradas para la base de datos de Holistia.

## 📋 Índice de Migraciones

### 🏥 Aplicaciones de Profesionales (01-06, 20-24)
| # | Archivo | Descripción |
|---|---------|-------------|
| 01 | `create_professional_applications_table.sql` | Tabla principal de solicitudes de profesionales |
| 02 | `fix_auth_users_permissions.sql` | Permisos de auth.users para rol authenticated |
| 03 | `complete_professional_applications_setup.sql` | Setup completo (recrea tabla) |
| 22 | `add_terms_privacy_accepted_columns.sql` | Campos de aceptación de términos |
| 23 | `add_review_fields_to_professional_applications.sql` | Campos de revisión admin |
| 24 | `setup_complete_professional_applications.sql` | Setup final completo |
| 35 | `extend_phone_field_length.sql` | Ampliar campo phone a TEXT |
| 36 | `add_instagram_to_professional_applications.sql` | Agregar campo Instagram |
| 37 | `add_image_position_to_professional_applications.sql` | Posición de imagen en cards |

### 👤 Usuarios y Favoritos (04-06)
| # | Archivo | Descripción |
|---|---------|-------------|
| 04 | `create_user_favorites_table.sql` | Tabla de favoritos de usuarios |
| 06 | `add_admin_policies_for_profiles.sql` | Políticas admin para perfiles |

### 📅 Citas y Disponibilidad (05, 18-19, 25)
| # | Archivo | Descripción |
|---|---------|-------------|
| 05 | `create_appointments_table.sql` | Tabla de citas (appointments) |
| 18 | `create_availability_blocks_table.sql` | Bloqueos de disponibilidad |
| 19 | `add_professional_working_hours.sql` | Horarios de trabajo |
| 25 | `add_rls_policies_to_availability_blocks.sql` | Políticas RLS para bloqueos |

### 🖼️ Galería y Storage (07-10, 12-13, 29-30)
| # | Archivo | Descripción |
|---|---------|-------------|
| 07 | `setup_professional_gallery_storage.sql` | Bucket professional-gallery |
| 10 | `setup_blog_storage.sql` | Bucket blog-images |
| 12 | `fix_blog_storage_policies.sql` | Políticas de blog storage |
| 13 | `add_consultorios_upload_policies.sql` | Políticas consultorios storage |
| 29 | `setup_event_gallery_storage.sql` | Bucket event-gallery |
| 30 | `fix_storage_eventos.sql` | Corrección de storage eventos |

### 📝 Blog (09-14)
| # | Archivo | Descripción |
|---|---------|-------------|
| 09 | `create_blog_posts_table.sql` | Tabla de blog posts |
| 14 | `create_blog_posts_flexible.sql` | Versión flexible de blog posts |

### 💼 Servicios Profesionales (16-17, 26)
| # | Archivo | Descripción |
|---|---------|-------------|
| 16 | `create_professional_services_table.sql` | Tabla de servicios |
| 17 | `update_professional_services_single_cost.sql` | Actualizar estructura de costos |
| 26 | `add_program_duration_to_services.sql` | Duración de programas |

### 🎉 Eventos y Talleres (27-33, 38)
| # | Archivo | Descripción |
|---|---------|-------------|
| 27 | `create_events_workshops_table.sql` | Tabla de eventos y talleres |
| 28 | `setup_events_workshops_rls.sql` | Políticas RLS para eventos |
| 31 | `create_event_registrations_table.sql` | Tabla de registros a eventos |
| 32 | `update_payments_for_events.sql` | Pagos para eventos |
| 33 | `add_confirmation_code_to_event_registrations.sql` | Código de confirmación |
| 38 | `add_image_position_to_events_workshops.sql` | Posición de imagen en cards |

### 💳 Pagos (15, 32)
| # | Archivo | Descripción |
|---|---------|-------------|
| 15 | `create_payments_table.sql` | Tabla de pagos |
| 32 | `update_payments_for_events.sql` | Actualizar pagos para eventos |

### 👥 Gestión de Cuentas (39)
| # | Archivo | Descripción |
|---|---------|-------------|
| 39 | `add_account_deactivation_fields.sql` | Sistema de desactivación (usa metadata) |

## 🚀 Guía de Instalación

### Para un Proyecto Nuevo:

Ejecuta las migraciones en este orden en el SQL Editor de Supabase:

```sql
-- 1. Profesionales
01_create_professional_applications_table.sql
02_fix_auth_users_permissions.sql
22_add_terms_privacy_accepted_columns.sql
23_add_review_fields_to_professional_applications.sql
35_extend_phone_field_length.sql
36_add_instagram_to_professional_applications.sql
37_add_image_position_to_professional_applications.sql

-- 2. Favoritos
04_create_user_favorites_table.sql

-- 3. Citas
05_create_appointments_table.sql
18_create_availability_blocks_table.sql
19_add_professional_working_hours.sql
25_add_rls_policies_to_availability_blocks.sql

-- 4. Servicios
16_create_professional_services_table.sql
17_update_professional_services_single_cost.sql
26_add_program_duration_to_services.sql

-- 5. Blog
14_create_blog_posts_flexible.sql

-- 6. Storage
07_setup_professional_gallery_storage.sql
10_setup_blog_storage.sql
12_fix_blog_storage_policies.sql
29_setup_event_gallery_storage.sql

-- 7. Eventos
27_create_events_workshops_table.sql
28_setup_events_workshops_rls.sql
31_create_event_registrations_table.sql
32_update_payments_for_events.sql
33_add_confirmation_code_to_event_registrations.sql
38_add_image_position_to_events_workshops.sql

-- 8. Pagos
15_create_payments_table.sql

-- 9. Admin
06_add_admin_policies_for_profiles.sql

-- 10. Desactivación de cuentas (opcional - usa metadata)
39_add_account_deactivation_fields.sql
```

## 📚 Documentación Adicional

- **`README_PHONE_MIGRATION.md`** - Instrucciones para migración de teléfono
- **`README_ACCOUNT_DEACTIVATION.md`** - Sistema de desactivación de cuentas

## ⚠️ Notas Importantes

1. **Orden de ejecución**: El orden es importante debido a dependencias entre tablas
2. **RLS (Row Level Security)**: Todas las migraciones incluyen políticas de seguridad
3. **Storage**: Las migraciones de storage crean buckets y políticas de acceso
4. **Seguridad**: Nunca ejecutes migraciones en producción sin backup previo
5. **Idempotencia**: La mayoría usa `IF NOT EXISTS` para ejecución segura

## 🔧 Solución de Problemas Comunes

### Error: "permission denied for table users"
**Solución**: Ejecutar `02_fix_auth_users_permissions.sql`

### Error: "relation already exists"
**Causa**: Migración ya aplicada
**Solución**: Omitir o usar versión con `IF NOT EXISTS`

### Error: "column already exists"
**Causa**: Campo ya agregado
**Solución**: Verificar si la migración usa `ADD COLUMN IF NOT EXISTS`

### Storage 403 / Bucket no existe
**Solución**: Ejecutar migraciones de storage (07, 10, 29)

## 📊 Estructura de Tablas Principales

### `professional_applications`
Solicitudes de profesionales con toda su información, servicios, y estado de aprobación.

### `appointments`
Citas entre pacientes y profesionales con estado y detalles.

### `professional_services`
Servicios ofrecidos por cada profesional con modalidad y precios.

### `events_workshops`
Eventos y talleres organizados por profesionales.

### `event_registrations`
Registros de usuarios a eventos con código de confirmación.

### `blog_posts`
Posts del blog con contenido rico y metadatos.

### `payments`
Pagos realizados por servicios y eventos.

### `user_favorites`
Profesionales favoritos de cada usuario.

### `availability_blocks`
Bloqueos de disponibilidad de profesionales.

## 🔐 Seguridad

Todas las tablas tienen configuradas:
- ✅ Políticas RLS (Row Level Security)
- ✅ Acceso basado en roles (user, professional, admin)
- ✅ Validaciones a nivel de base de datos
- ✅ Índices para performance

## 🆘 Soporte

Si encuentras problemas con las migraciones, revisa:
1. Los comentarios dentro de cada archivo SQL
2. La documentación en `docs/SETUP_DATABASE.md`
3. Los READMEs específicos (PHONE_MIGRATION, ACCOUNT_DEACTIVATION)
