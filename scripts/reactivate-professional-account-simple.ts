/**
 * Script para reactivar la cuenta de un profesional desactivado
 * 
 * Uso:
 *   pnpm tsx scripts/reactivate-professional-account-simple.ts <email>
 * 
 * Ejemplo:
 *   pnpm tsx scripts/reactivate-professional-account-simple.ts ryoga.chan.78@gmail.com
 * 
 * NOTA: Este script requiere que tengas acceso a Supabase Dashboard o que uses
 * el SQL Editor para ejecutar la función directamente.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';

// Cargar variables de entorno
config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Variables de entorno faltantes');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:', supabaseAnonKey ? '✅' : '❌');
  process.exit(1);
}

// Crear cliente (sin service role, necesitaremos usar RPC que tenga permisos)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function reactivateProfessionalAccount(email: string) {
  console.log(`\n🔍 Buscando usuario con email: ${email}\n`);

  try {
    // 1. Buscar el usuario por email en profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, account_active, deactivated_at, type')
      .eq('email', email)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Error al buscar perfil:', profileError);
      return;
    }

    if (!profiles) {
      console.error(`❌ No se encontró ningún perfil con el email: ${email}`);
      return;
    }

    const profile = profiles;
    console.log(`✅ Perfil encontrado:`);
    console.log(`   ID: ${profile.id}`);
    console.log(`   Email: ${profile.email}`);
    console.log(`   Type: ${profile.type || 'N/A'}`);
    console.log(`   account_active: ${profile.account_active ? '✅ true' : '❌ false'}`);
    console.log(`   deactivated_at: ${profile.deactivated_at || 'N/A'}`);

    // 2. Verificar si es profesional
    const { data: professional, error: professionalError } = await supabase
      .from('professional_applications')
      .select('id, status, is_active')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (professionalError) {
      console.error('⚠️  Error al verificar aplicación profesional:', professionalError);
    } else if (professional) {
      console.log(`\n👨‍⚕️  Aplicación profesional:`);
      console.log(`   ID: ${professional.id}`);
      console.log(`   Status: ${professional.status}`);
      console.log(`   is_active: ${professional.is_active ? '✅ true' : '❌ false'}`);
    }

    // 3. Si ya está activo, informar y salir
    if (profile.account_active === true) {
      console.log(`\n✅ La cuenta ya está activa. No se requiere acción.`);
      return;
    }

    // 4. Intentar reactivar usando la función RPC
    console.log(`\n🔄 Intentando reactivar cuenta usando función RPC...`);
    
    const { data: reactivateResult, error: reactivateError } = await supabase
      .rpc('reactivate_user_account', {
        user_id_param: profile.id,
      });

    if (reactivateError) {
      console.error('❌ Error al llamar función RPC:', reactivateError);
      console.log('\n⚠️  La función RPC requiere permisos de administrador.');
      console.log('📋 SQL para ejecutar manualmente en Supabase Dashboard:');
      console.log('\n' + '='.repeat(70));
      console.log(`SELECT reactivate_user_account('${profile.id}');`);
      console.log('='.repeat(70));
      console.log('\n💡 Alternativamente, ejecuta este SQL completo:');
      console.log('\n' + '='.repeat(70));
      console.log(`
-- Reactivar cuenta para ${email}
UPDATE profiles
SET
  account_active = true,
  deactivated_at = NULL,
  updated_at = NOW()
WHERE id = '${profile.id}';

UPDATE auth.users
SET
  raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{account_active}',
    'true'::jsonb
  ),
  updated_at = NOW()
WHERE id = '${profile.id}';

${professional ? `UPDATE professional_applications
SET
  is_active = true,
  updated_at = NOW()
WHERE user_id = '${profile.id}'
  AND status = 'approved';` : '-- No hay aplicación profesional para reactivar'}
      `.trim());
      console.log('='.repeat(70));
      return;
    }

    console.log('✅ Resultado de reactivación:', reactivateResult);

    // 5. Verificar estado final
    const { data: finalProfile, error: finalError } = await supabase
      .from('profiles')
      .select('account_active, deactivated_at')
      .eq('id', profile.id)
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
  console.log('   pnpm tsx scripts/reactivate-professional-account-simple.ts <email>');
  console.log('\nEjemplo:');
  console.log('   pnpm tsx scripts/reactivate-professional-account-simple.ts ryoga.chan.78@gmail.com');
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
