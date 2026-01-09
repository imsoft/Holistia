/**
 * Script para reactivar la cuenta de un profesional desactivado
 * 
 * Uso:
 *   pnpm tsx scripts/reactivate-professional-account.ts <email>
 * 
 * Ejemplo:
 *   pnpm tsx scripts/reactivate-professional-account.ts ryoga.chan.78@gmail.com
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';

// Cargar variables de entorno
config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno faltantes');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SERVICE_KEY:', supabaseServiceKey ? '✅' : '❌');
  console.error('\n💡 Asegúrate de tener las variables en .env.local');
  process.exit(1);
}

// Crear cliente con service role key para tener permisos de admin
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function reactivateProfessionalAccount(email: string) {
  console.log(`\n🔍 Buscando usuario con email: ${email}\n`);

  try {
    // 1. Buscar el usuario por email en auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error al buscar usuarios:', authError);
      return;
    }

    const user = authUsers.users.find(u => u.email === email);

    if (!user) {
      console.error(`❌ No se encontró ningún usuario con el email: ${email}`);
      console.log('\n📋 Usuarios disponibles (primeros 5):');
      authUsers.users.slice(0, 5).forEach(u => {
        console.log(`   - ${u.email} (${u.id})`);
      });
      return;
    }

    console.log(`✅ Usuario encontrado:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Creado: ${new Date(user.created_at).toLocaleString('es-MX')}`);

    // 2. Verificar estado actual en profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, account_active, deactivated_at, type')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Error al obtener perfil:', profileError);
      return;
    }

    if (!profile) {
      console.error('❌ No se encontró perfil para este usuario');
      return;
    }

    console.log(`\n📊 Estado actual del perfil:`);
    console.log(`   account_active: ${profile.account_active ? '✅ true' : '❌ false'}`);
    console.log(`   deactivated_at: ${profile.deactivated_at || 'N/A'}`);
    console.log(`   type: ${profile.type || 'N/A'}`);

    // 3. Verificar si es profesional
    const { data: professional, error: professionalError } = await supabase
      .from('professional_applications')
      .select('id, status, is_active')
      .eq('user_id', user.id)
      .maybeSingle();

    if (professionalError) {
      console.error('⚠️  Error al verificar aplicación profesional:', professionalError);
    } else if (professional) {
      console.log(`\n👨‍⚕️  Aplicación profesional:`);
      console.log(`   ID: ${professional.id}`);
      console.log(`   Status: ${professional.status}`);
      console.log(`   is_active: ${professional.is_active ? '✅ true' : '❌ false'}`);
    }

    // 4. Si ya está activo, informar y salir
    if (profile.account_active === true) {
      console.log(`\n✅ La cuenta ya está activa. No se requiere acción.`);
      return;
    }

    // 5. Reactivar usando la función de la base de datos
    console.log(`\n🔄 Reactivando cuenta...`);
    
    const { data: reactivateResult, error: reactivateError } = await supabase
      .rpc('reactivate_user_account', {
        user_id_param: user.id,
      });

    if (reactivateError) {
      console.error('❌ Error al reactivar cuenta:', reactivateError);
      
      // Si la función RPC falla, intentar reactivar manualmente
      console.log('\n⚠️  Intentando reactivación manual...');
      
      // Actualizar profiles
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({
          account_active: true,
          deactivated_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateProfileError) {
        console.error('❌ Error al actualizar profiles:', updateProfileError);
        return;
      }

      // Actualizar auth.users metadata
      const { error: updateAuthError } = await supabase.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: {
            ...user.user_metadata,
            account_active: true,
          },
        }
      );

      if (updateAuthError) {
        console.error('❌ Error al actualizar auth.users:', updateAuthError);
        return;
      }

      // Actualizar professional_applications si existe
      if (professional) {
        const { error: updateProfessionalError } = await supabase
          .from('professional_applications')
          .update({
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .eq('status', 'approved');

        if (updateProfessionalError) {
          console.error('⚠️  Error al actualizar professional_applications:', updateProfessionalError);
        } else {
          console.log('✅ professional_applications actualizado');
        }
      }

      console.log('✅ Cuenta reactivada manualmente');
    } else {
      console.log('✅ Resultado de reactivación:', reactivateResult);
    }

    // 6. Verificar estado final
    const { data: finalProfile, error: finalError } = await supabase
      .from('profiles')
      .select('account_active, deactivated_at')
      .eq('id', user.id)
      .single();

    if (finalError) {
      console.error('⚠️  Error al verificar estado final:', finalError);
    } else {
      console.log(`\n✅ Estado final:`);
      console.log(`   account_active: ${finalProfile.account_active ? '✅ true' : '❌ false'}`);
      console.log(`   deactivated_at: ${finalProfile.deactivated_at || 'N/A'}`);
    }

    console.log(`\n🎉 ¡Cuenta reactivada exitosamente!`);
    console.log(`   El usuario ${email} ahora puede acceder a la plataforma.`);
    console.log(`\n💡 Nota: El usuario puede necesitar cerrar sesión y volver a iniciar sesión.`);

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    process.exit(1);
  }
}

// Ejecutar script
const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Debes proporcionar un email');
  console.log('\nUso:');
  console.log('   pnpm tsx scripts/reactivate-professional-account.ts <email>');
  console.log('\nEjemplo:');
  console.log('   pnpm tsx scripts/reactivate-professional-account.ts ryoga.chan.78@gmail.com');
  process.exit(1);
}

reactivateProfessionalAccount(email)
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
