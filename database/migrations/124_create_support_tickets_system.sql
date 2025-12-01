-- Migración para crear el sistema de tickets de soporte técnico
-- Fecha: 2025-01-01
-- Descripción: Crea tablas para tickets técnicos, comentarios y archivos adjuntos

-- =====================================================
-- 1. Crear tabla de tickets de soporte
-- =====================================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Información del ticket
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  priority VARCHAR(50) NOT NULL DEFAULT 'medium',
  category VARCHAR(100) NOT NULL,

  -- Usuario que reporta
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reporter_email VARCHAR(255) NOT NULL,
  reporter_name VARCHAR(255) NOT NULL,

  -- Asignación
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Metadata
  environment TEXT, -- Navegador, dispositivo, etc.
  url TEXT, -- URL donde ocurrió el problema
  steps_to_reproduce TEXT,
  expected_behavior TEXT,
  actual_behavior TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('open', 'in_progress', 'waiting_response', 'resolved', 'closed')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

-- =====================================================
-- 2. Crear tabla de comentarios en tickets
-- =====================================================
CREATE TABLE IF NOT EXISTS support_ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relación con ticket
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,

  -- Autor del comentario
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name VARCHAR(255) NOT NULL,
  author_email VARCHAR(255) NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,

  -- Contenido
  comment TEXT NOT NULL,

  -- Metadata
  is_internal BOOLEAN NOT NULL DEFAULT FALSE, -- Solo visible para admins

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 3. Crear tabla de archivos adjuntos
-- =====================================================
CREATE TABLE IF NOT EXISTS support_ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relación
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES support_ticket_comments(id) ON DELETE CASCADE,

  -- Información del archivo
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER, -- En bytes

  -- Autor
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 4. Crear índices para optimizar consultas
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_reporter ON support_tickets(reporter_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category);

CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON support_ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_author ON support_ticket_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_created ON support_ticket_comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket ON support_ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_comment ON support_ticket_attachments(comment_id);

-- =====================================================
-- 5. Crear función para actualizar updated_at automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_support_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_ticket_updated_at();

DROP TRIGGER IF EXISTS update_support_ticket_comments_updated_at ON support_ticket_comments;
CREATE TRIGGER update_support_ticket_comments_updated_at
  BEFORE UPDATE ON support_ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_support_ticket_updated_at();

-- =====================================================
-- 6. Crear políticas RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_attachments ENABLE ROW LEVEL SECURITY;

-- Políticas para support_tickets

-- Los usuarios pueden ver sus propios tickets
DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;
CREATE POLICY "Users can view their own tickets"
  ON support_tickets
  FOR SELECT
  USING (
    auth.uid() = reporter_id
    OR auth.uid() IN (
      SELECT id FROM profiles WHERE type = 'admin'
    )
  );

-- Los usuarios pueden crear tickets
DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
CREATE POLICY "Users can create tickets"
  ON support_tickets
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Los usuarios pueden actualizar sus propios tickets
DROP POLICY IF EXISTS "Users can update their own tickets" ON support_tickets;
CREATE POLICY "Users can update their own tickets"
  ON support_tickets
  FOR UPDATE
  USING (auth.uid() = reporter_id)
  WITH CHECK (auth.uid() = reporter_id);

-- Los admins pueden ver, actualizar y eliminar todos los tickets
DROP POLICY IF EXISTS "Admins can manage all tickets" ON support_tickets;
CREATE POLICY "Admins can manage all tickets"
  ON support_tickets
  FOR ALL
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

-- Políticas para support_ticket_comments

-- Los usuarios pueden ver comentarios de sus tickets (excepto internos)
DROP POLICY IF EXISTS "Users can view comments on their tickets" ON support_ticket_comments;
CREATE POLICY "Users can view comments on their tickets"
  ON support_ticket_comments
  FOR SELECT
  USING (
    (
      ticket_id IN (
        SELECT id FROM support_tickets WHERE reporter_id = auth.uid()
      )
      AND is_internal = FALSE
    )
    OR auth.uid() IN (
      SELECT id FROM profiles WHERE type = 'admin'
    )
  );

-- Los usuarios pueden crear comentarios en sus tickets
DROP POLICY IF EXISTS "Users can create comments on their tickets" ON support_ticket_comments;
CREATE POLICY "Users can create comments on their tickets"
  ON support_ticket_comments
  FOR INSERT
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM support_tickets WHERE reporter_id = auth.uid()
    )
    AND author_id = auth.uid()
    AND is_internal = FALSE
  );

-- Los admins pueden gestionar todos los comentarios
DROP POLICY IF EXISTS "Admins can manage all comments" ON support_ticket_comments;
CREATE POLICY "Admins can manage all comments"
  ON support_ticket_comments
  FOR ALL
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

-- Políticas para support_ticket_attachments

-- Los usuarios pueden ver adjuntos de sus tickets
DROP POLICY IF EXISTS "Users can view attachments on their tickets" ON support_ticket_attachments;
CREATE POLICY "Users can view attachments on their tickets"
  ON support_ticket_attachments
  FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM support_tickets WHERE reporter_id = auth.uid()
    )
    OR auth.uid() IN (
      SELECT id FROM profiles WHERE type = 'admin'
    )
  );

-- Los usuarios pueden subir adjuntos a sus tickets
DROP POLICY IF EXISTS "Users can upload attachments to their tickets" ON support_ticket_attachments;
CREATE POLICY "Users can upload attachments to their tickets"
  ON support_ticket_attachments
  FOR INSERT
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM support_tickets WHERE reporter_id = auth.uid()
    )
    AND uploaded_by = auth.uid()
  );

-- Los admins pueden gestionar todos los adjuntos
DROP POLICY IF EXISTS "Admins can manage all attachments" ON support_ticket_attachments;
CREATE POLICY "Admins can manage all attachments"
  ON support_ticket_attachments
  FOR ALL
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

-- =====================================================
-- 7. Crear vista para estadísticas de tickets
-- =====================================================
CREATE OR REPLACE VIEW support_ticket_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'open') as open_tickets,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tickets,
  COUNT(*) FILTER (WHERE status = 'waiting_response') as waiting_response_tickets,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_tickets,
  COUNT(*) FILTER (WHERE status = 'closed') as closed_tickets,
  COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_tickets,
  COUNT(*) FILTER (WHERE priority = 'high') as high_priority_tickets,
  AVG(EXTRACT(EPOCH FROM (COALESCE(closed_at, NOW()) - created_at)) / 3600) as avg_resolution_time_hours
FROM support_tickets;

-- =====================================================
-- Finalización
-- =====================================================
COMMENT ON TABLE support_tickets IS 'Tickets de soporte técnico reportados por usuarios';
COMMENT ON TABLE support_ticket_comments IS 'Comentarios en tickets de soporte';
COMMENT ON TABLE support_ticket_attachments IS 'Archivos adjuntos en tickets de soporte';
