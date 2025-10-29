import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function debugMondayIssue() {
  try {
    console.log('🔍 Buscando profesional Montserrat Cosilion...');
    
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

      // Verificar específicamente el lunes
      console.log('\n=== VERIFICACIÓN ESPECÍFICA DEL LUNES ===');
      console.log('¿Incluye lunes (1)?', professional.working_days?.includes(1));
      console.log('¿Incluye lunes (2)?', professional.working_days?.includes(2)); // Por si está mal configurado
      
      // Simular la lógica del calendario para diferentes fechas
      const testDates = [
        '2025-11-03', // Lunes 3 de noviembre
        '2025-11-02', // Domingo 2 de noviembre
        '2025-11-01', // Sábado 1 de noviembre
      ];
      
      testDates.forEach(testDate => {
        const selectedDate = new Date(testDate);
        const dayOfWeek = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
        const isWorkingDay = professional.working_days?.includes(dayOfWeek);
        
        console.log(`\n--- Fecha: ${testDate} ---`);
        console.log('Día de la semana (JS getDay()):', selectedDate.getDay());
        console.log('Día convertido:', dayOfWeek);
        console.log('¿Es día de trabajo?', isWorkingDay);
        console.log('Día nombre:', ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][selectedDate.getDay()]);
      });
      
      // Verificar si hay datos en la tabla de disponibilidad
      console.log('\n=== VERIFICANDO BLOQUEOS DE DISPONIBILIDAD ===');
      const { data: blocks, error: blocksError } = await supabase
        .from('availability_blocks')
        .select('*')
        .eq('professional_id', professional.id);
        
      if (blocksError) {
        console.error('Error obteniendo bloqueos:', blocksError);
      } else {
        console.log('Bloqueos encontrados:', blocks);
      }
    }
  } catch (error) {
    console.error('Error general:', error);
  }
}

debugMondayIssue();
