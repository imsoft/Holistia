import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function debugProfessionalSchedule() {
  try {
    // Buscar el profesional por nombre
    const { data: professionals, error: searchError } = await supabase
      .from('professional_applications')
      .select('id, first_name, last_name, working_days, working_start_time, working_end_time')
      .ilike('first_name', '%Montserrat%')
      .or('last_name.ilike.%Cosilion%');

    if (searchError) {
      console.error('Error buscando profesional:', searchError);
      return;
    }

    console.log('Profesionales encontrados:', professionals);

    if (professionals && professionals.length > 0) {
      const professional = professionals[0];
      console.log('\n=== DATOS DEL PROFESIONAL ===');
      console.log('ID:', professional.id);
      console.log('Nombre:', `${professional.first_name} ${professional.last_name}`);
      console.log('working_days:', professional.working_days);
      console.log('working_start_time:', professional.working_start_time);
      console.log('working_end_time:', professional.working_end_time);

      // Verificar qué día es lunes en el sistema
      console.log('\n=== VERIFICACIÓN DE DÍAS ===');
      console.log('Lunes debería ser día 1 en el sistema');
      console.log('¿Incluye lunes (1)?', professional.working_days?.includes(1));
      
      // Simular la lógica del calendario
      const testDate = '2024-11-18'; // Lunes
      const selectedDate = new Date(testDate);
      const dayOfWeek = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
      console.log(`\nFecha de prueba: ${testDate}`);
      console.log('Día de la semana (JS):', selectedDate.getDay()); // 1 = lunes
      console.log('Día convertido:', dayOfWeek); // Debería ser 1
      console.log('¿Es día de trabajo?', professional.working_days?.includes(dayOfWeek));
    }
  } catch (error) {
    console.error('Error general:', error);
  }
}

debugProfessionalSchedule();
