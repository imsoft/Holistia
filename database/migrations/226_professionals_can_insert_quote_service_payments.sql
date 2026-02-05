-- ============================================================================
-- MIGRACIÓN 226: Profesionales pueden insertar pagos de tipo quote_service
-- ============================================================================
-- Propósito:
--   La API /api/stripe/quote-payment-link la llama el profesional (auth.uid() =
--   profesional). La política "Users can insert own payments" exige
--   auth.uid() = patient_id, por lo que el INSERT fallaba con RLS.
--   Esta política permite al profesional insertar solo pagos quote_service
--   donde él es el profesional (professional_id = su professional_application).
-- ============================================================================

CREATE POLICY "Professionals can insert quote_service payments"
ON public.payments
FOR INSERT
WITH CHECK (
  payment_type = 'quote_service'
  AND EXISTS (
    SELECT 1 FROM public.professional_applications pa
    WHERE pa.id = payments.professional_id
      AND pa.user_id = auth.uid()
      AND pa.status = 'approved'
  )
  AND patient_id IS NOT NULL
);

COMMENT ON POLICY "Professionals can insert quote_service payments" ON public.payments IS
  'Permite al profesional crear el registro de pago cuando genera un enlace de cotización (quote_service); el pago lo completa el paciente en Stripe.';

-- El profesional debe poder actualizar su propio pago quote_service (session_id, status) tras crear la sesión de Stripe
CREATE POLICY "Professionals can update their quote_service payments"
ON public.payments
FOR UPDATE
USING (
  payment_type = 'quote_service'
  AND EXISTS (
    SELECT 1 FROM public.professional_applications pa
    WHERE pa.id = payments.professional_id
      AND pa.user_id = auth.uid()
      AND pa.status = 'approved'
  )
)
WITH CHECK (
  payment_type = 'quote_service'
  AND EXISTS (
    SELECT 1 FROM public.professional_applications pa
    WHERE pa.id = payments.professional_id
      AND pa.user_id = auth.uid()
      AND pa.status = 'approved'
  )
);

COMMENT ON POLICY "Professionals can update their quote_service payments" ON public.payments IS
  'Permite al profesional actualizar el pago de cotización (session_id, status) tras crear la sesión de Checkout.';
