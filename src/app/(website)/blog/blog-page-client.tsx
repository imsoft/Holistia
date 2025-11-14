"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, Clock, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface BlogPageClientProps {
  posts: {
    id: string;
    slug: string;
    title: string;
    content: string;
    excerpt?: string;
    published_at: string;
    updated_at: string;
    created_at: string;
    status: string;
    featured_image?: string;
    author_id?: string;
    author?: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
      profession: string;
    };
  }[];
  error?: string;
}

export function BlogPageClient({ posts, error }: BlogPageClientProps) {
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

        {posts.length === 0 ? (
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
                        <div className="relative w-full h-56 sm:h-48 mb-3 sm:mb-4 rounded-lg overflow-hidden">
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
