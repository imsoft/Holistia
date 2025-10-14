"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { BlogPost } from "@/types/blog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Share2, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);

  const supabase = createClient();

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch the specific post
      const { data: postData, error: postError } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (postError || !postData) {
        console.error("Error fetching post:", postError);
        setError("Artículo no encontrado");
        return;
      }

      // Fetch author information
      let authorInfo = null;
      if (postData.author_id) {
        // Try to get from professionals first
        const { data: professionalData } = await supabase
          .from('professional_applications')
          .select('id, first_name, last_name, email, profession, profile_photo')
          .eq('id', postData.author_id)
          .eq('status', 'approved')
          .single();

        if (professionalData) {
          authorInfo = {
            id: professionalData.id,
            name: `${professionalData.first_name} ${professionalData.last_name}`,
            email: professionalData.email,
            avatar: professionalData.profile_photo,
            profession: professionalData.profession,
          };
        } else {
          // Try to get from profiles (admin users)
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email, avatar_url')
            .eq('id', postData.author_id)
            .eq('role', 'admin')
            .single();

          if (profileData) {
            authorInfo = {
              id: profileData.id,
              name: `${profileData.first_name} ${profileData.last_name}`,
              email: profileData.email,
              avatar: profileData.avatar_url,
              profession: 'Administrador',
            };
          }
        }
      }

      setPost({
        ...postData,
        author: authorInfo
      });

      // Fetch related posts (other published posts)
      const { data: relatedData, error: relatedError } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .neq("id", postData.id)
        .order("published_at", { ascending: false })
        .limit(3);

      if (!relatedError && relatedData) {
        setRelatedPosts(relatedData);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Error inesperado al cargar el artículo");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min de lectura`;
  };

  const handleShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt || "",
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback: copy to clipboard
      if (post) {
        try {
          await navigator.clipboard.writeText(window.location.href);
          toast.success("Enlace copiado al portapapeles");
        } catch (err) {
          console.log("Error copying to clipboard:", err);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-4 sm:space-y-6">
              <div className="h-6 sm:h-8 bg-muted rounded w-1/4"></div>
              <div className="h-10 sm:h-12 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="space-y-3 sm:space-y-4">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl sm:text-2xl font-bold mb-4">Artículo no encontrado</h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-6">
            El artículo que buscas no existe o no está disponible
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/blog">Ver Blog</Link>
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/">Ir al Inicio</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Article Header */}
      <article className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Title and Meta */}
          <header className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground mb-4 sm:mb-6 leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6 text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
              <div className="flex items-center">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                <span>{formatDate(post.published_at!)}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                <span>{getReadingTime(post.content)}</span>
              </div>
              {post.author && (
                <div className="flex items-center">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  <span>{post.author.name}</span>
                  <span className="ml-1 text-xs opacity-75">({post.author.profession})</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="ml-auto"
              >
                <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                <span className="hidden sm:inline">Compartir</span>
                <span className="sm:hidden">Compartir</span>
              </Button>
            </div>

            {post.excerpt && (
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed mb-6 sm:mb-8">
                {post.excerpt}
              </p>
            )}
          </header>

          {/* Featured Image */}
          {post.featured_image && (
            <div className="relative w-full h-48 sm:h-64 lg:h-96 mb-6 sm:mb-8 rounded-lg overflow-hidden">
              <Image
                src={post.featured_image}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Article Content */}
          <div className="prose prose-lg max-w-none">
            <div
              className="text-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* Share Section */}
          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border">
            <div className="text-center">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                ¿Te gustó este artículo?
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md mx-auto">
                Compártelo con otros y ayúdanos a difundir el conocimiento sobre
                bienestar
              </p>
              <Button onClick={handleShare} className="w-full sm:w-auto">
                <Share2 className="w-4 h-4 mr-2" />
                Compartir Artículo
              </Button>
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="bg-muted/30 py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 sm:mb-8">
                Artículos Relacionados
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Card
                    key={relatedPost.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-4 sm:p-6">
                      <h3 className="font-semibold text-base sm:text-lg mb-2 line-clamp-2">
                        {relatedPost.title}
                      </h3>
                      {relatedPost.excerpt && (
                        <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-3">
                          {relatedPost.excerpt}
                        </p>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(relatedPost.published_at!)}
                        </span>
                        <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                          <Link href={`/blog/${relatedPost.slug}`}>
                            Leer más
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
