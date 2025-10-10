export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  status: 'draft' | 'published';
  author_id: string;
  author?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    profession?: string;
  };
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBlogPostData {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  status?: 'draft' | 'published';
  author_id?: string;
}

export interface UpdateBlogPostData extends Partial<CreateBlogPostData> {
  id: string;
}

export interface BlogPostFilters {
  status?: 'draft' | 'published';
  author_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface BlogAuthor {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  profession?: string;
  type: 'user' | 'professional';
}
