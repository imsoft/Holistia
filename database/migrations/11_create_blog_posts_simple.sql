-- Create blog_posts table (simplified version without profiles dependency)
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON public.blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON public.blog_posts(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies (simplified - using hardcoded admin email for now)

-- Policy: Anyone can read published posts
CREATE POLICY "Anyone can read published blog posts"
  ON public.blog_posts
  FOR SELECT
  TO authenticated, anon
  USING (status = 'published');

-- Policy: Only specific admin user can read all posts (including drafts)
CREATE POLICY "Admin can read all blog posts"
  ON public.blog_posts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email = 'test@wellpoint.com'
    )
  );

-- Policy: Only specific admin user can insert blog posts
CREATE POLICY "Admin can create blog posts"
  ON public.blog_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email = 'test@wellpoint.com'
    )
  );

-- Policy: Only specific admin user can update blog posts
CREATE POLICY "Admin can update blog posts"
  ON public.blog_posts
  FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email = 'test@wellpoint.com'
    )
  )
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email = 'test@wellpoint.com'
    )
  );

-- Policy: Only specific admin user can delete blog posts
CREATE POLICY "Admin can delete blog posts"
  ON public.blog_posts
  FOR DELETE
  TO authenticated
  USING (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email = 'test@wellpoint.com'
    )
  );
