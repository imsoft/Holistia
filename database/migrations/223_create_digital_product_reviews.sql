-- Reseñas de programas digitales (solo compradores verificados)
-- Una reseña por compra (purchase_id único)

CREATE TABLE IF NOT EXISTS public.digital_product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  purchase_id UUID NOT NULL REFERENCES public.digital_product_purchases(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(purchase_id)
);

CREATE INDEX IF NOT EXISTS idx_digital_product_reviews_product_id ON public.digital_product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_digital_product_reviews_buyer_id ON public.digital_product_reviews(buyer_id);
CREATE INDEX IF NOT EXISTS idx_digital_product_reviews_created_at ON public.digital_product_reviews(created_at DESC);

ALTER TABLE public.digital_product_reviews ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ver reseñas
CREATE POLICY "Anyone can view digital product reviews"
  ON public.digital_product_reviews
  FOR SELECT
  USING (true);

-- Solo el comprador puede insertar (la API verificará que purchase sea suyo y esté pagado)
CREATE POLICY "Buyers can insert their own review"
  ON public.digital_product_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- Solo el autor puede actualizar/eliminar su reseña
CREATE POLICY "Buyers can update own review"
  ON public.digital_product_reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can delete own review"
  ON public.digital_product_reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = buyer_id);

CREATE OR REPLACE FUNCTION update_digital_product_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_digital_product_reviews_updated_at_trigger ON public.digital_product_reviews;
CREATE TRIGGER update_digital_product_reviews_updated_at_trigger
  BEFORE UPDATE ON public.digital_product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_digital_product_reviews_updated_at();

-- Vista de estadísticas por producto
CREATE OR REPLACE VIEW public.digital_product_review_stats AS
SELECT
  product_id,
  COUNT(*)::integer AS total_reviews,
  ROUND(AVG(rating)::numeric, 1)::double precision AS average_rating
FROM public.digital_product_reviews
GROUP BY product_id;

GRANT SELECT ON public.digital_product_review_stats TO authenticated;
GRANT SELECT ON public.digital_product_review_stats TO anon;

COMMENT ON TABLE public.digital_product_reviews IS 'Reseñas de programas digitales; solo compradores verificados (una por compra).';
