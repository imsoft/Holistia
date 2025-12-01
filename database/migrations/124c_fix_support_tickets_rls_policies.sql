-- Actualización de políticas RLS para support_tickets
-- Fecha: 2025-01-01
-- Descripción: Corrige las políticas para permitir que admins creen tickets

-- =====================================================
-- 1. Eliminar políticas existentes
-- =====================================================
DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can manage all tickets" ON support_tickets;

-- =====================================================
-- 2. Crear nuevas políticas corregidas
-- =====================================================

-- Los usuarios autenticados pueden crear tickets (incluyendo admins)
CREATE POLICY "Authenticated users can create tickets"
  ON support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reporter_id
  );

-- Los admins pueden ver todos los tickets
CREATE POLICY "Admins can view all tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE type = 'admin'
    )
  );

-- Los admins pueden actualizar todos los tickets
CREATE POLICY "Admins can update all tickets"
  ON support_tickets
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE type = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE type = 'admin'
    )
  );

-- Los admins pueden eliminar todos los tickets
CREATE POLICY "Admins can delete all tickets"
  ON support_tickets
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE type = 'admin'
    )
  );
