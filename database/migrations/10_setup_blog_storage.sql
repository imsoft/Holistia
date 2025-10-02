-- Create blog-images bucket for storing blog post featured images
-- Note: This bucket needs to be created manually in Supabase Storage

-- RLS Policies for blog-images bucket

-- Policy: Anyone can read blog images (for public blog posts)
CREATE POLICY "Anyone can read blog images"
  ON storage.objects
  FOR SELECT
  TO authenticated, anon
  USING (bucket_id = 'blog-images');

-- Policy: Only owners can upload blog images
CREATE POLICY "Owners can upload blog images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'blog-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  );

-- Policy: Only owners can update blog images
CREATE POLICY "Owners can update blog images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'blog-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  )
  WITH CHECK (
    bucket_id = 'blog-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  );

-- Policy: Only owners can delete blog images
CREATE POLICY "Owners can delete blog images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'blog-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  );
