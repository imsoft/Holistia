-- Add upload policies for consultorios bucket to support blog images
-- This allows authenticated users to upload, update, and delete images in the consultorios bucket

-- Policy: Authenticated users can upload images to consultorios bucket
CREATE POLICY "Authenticated users can upload to consultorios"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'consultorios');

-- Policy: Authenticated users can update images in consultorios bucket
CREATE POLICY "Authenticated users can update consultorios images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'consultorios')
  WITH CHECK (bucket_id = 'consultorios');

-- Policy: Authenticated users can delete images from consultorios bucket
CREATE POLICY "Authenticated users can delete consultorios images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'consultorios');
