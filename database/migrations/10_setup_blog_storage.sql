-- Create blog-images bucket for storing blog post featured images
-- Note: This bucket needs to be created manually in Supabase Storage

-- RLS Policies for blog-images bucket

-- Policy: Anyone can read blog images (for public blog posts)
CREATE POLICY "Anyone can read blog images"
  ON storage.objects
  FOR SELECT
  TO authenticated, anon
  USING (bucket_id = 'blog-images');

-- Policy: Only specific admin user can upload blog images
CREATE POLICY "Admin can upload blog images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'blog-images'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email = 'test@wellpoint.com'
    )
  );

-- Policy: Only specific admin user can update blog images
CREATE POLICY "Admin can update blog images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'blog-images'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email = 'test@wellpoint.com'
    )
  )
  WITH CHECK (
    bucket_id = 'blog-images'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email = 'test@wellpoint.com'
    )
  );

-- Policy: Only specific admin user can delete blog images
CREATE POLICY "Admin can delete blog images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'blog-images'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email = 'test@wellpoint.com'
    )
  );
