-- Create blog_posts table with flexible policies for any authenticated user
-- This allows any authenticated user to create and manage blog posts

-- Create the table if it doesn't exist
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

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read published blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admin can read all blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admin can create blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admin can update blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admin can delete blog posts" ON public.blog_posts;

-- RLS Policies (flexible - any authenticated user can manage blog posts)

-- Policy: Anyone can read published posts
CREATE POLICY "Anyone can read published blog posts"
  ON public.blog_posts
  FOR SELECT
  TO authenticated, anon
  USING (status = 'published');

-- Policy: Authenticated users can read all posts (including drafts)
CREATE POLICY "Authenticated users can read all blog posts"
  ON public.blog_posts
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can create blog posts
CREATE POLICY "Authenticated users can create blog posts"
  ON public.blog_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- Policy: Authenticated users can update their own blog posts
CREATE POLICY "Users can update their own blog posts"
  ON public.blog_posts
  FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Policy: Authenticated users can delete their own blog posts
CREATE POLICY "Users can delete their own blog posts"
  ON public.blog_posts
  FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());
