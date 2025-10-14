"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { BlogPost } from "@/types/blog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, Clock, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchPosts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (error) {
        console.error("Error fetching posts:", error);
        setError("Error al cargar los posts del blog");
        return;
      }

      // Fetch author information for each post
      const postsWithAuthors = await Promise.all(
        (data || []).map(async (post) => {
          let authorInfo = null;
          if (post.author_id) {
            // Try to get from professionals first
            const { data: professionalData } = await supabase
              .from('professional_applications')
              .select('id, first_name, last_name, email, profession, profile_photo')
              .eq('id', post.author_id)
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
                .eq('id', post.author_id)
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
          
          return {
            ...post,
            author: authorInfo
          };
        })
      );

      setPosts(postsWithAuthors);
    } catch (err) {
      console.error("Error:", err);
      setError("Error inesperado al cargar los posts");
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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="py-8 sm:py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6">
              Blog de Holistia
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8">
              Descubre consejos, información y recursos sobre bienestar y salud
              mental
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {error && (
          <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm sm:text-base text-destructive">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse p-4">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded mb-4"></div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="h-4 bg-muted rounded w-20"></div>
                    <div className="h-4 bg-muted rounded w-16"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">No hay artículos aún</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              Pronto tendremos contenido interesante para ti
            </p>
          </div>
        ) : (
          <>
            {/* Posts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {posts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <Card className="py-3 sm:py-4 group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                    <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                      {post.featured_image && (
                        <div className="relative w-full h-40 sm:h-48 mb-3 sm:mb-4 rounded-lg overflow-hidden">
                          <Image
                            src={post.featured_image}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <CardTitle className="text-lg sm:text-xl line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </CardTitle>
                      {post.excerpt && (
                        <p className="text-sm sm:text-base text-muted-foreground line-clamp-3 mt-2">
                          {post.excerpt}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6">
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                          <span>{formatDate(post.published_at!)}</span>
                        </div>
   
                        <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                          <span>{getReadingTime(post.content)}</span>
                        </div>

                        {post.author && (
                          <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                            <span>{post.author.name}</span>
                            <span className="ml-1 opacity-75">({post.author.profession})</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
