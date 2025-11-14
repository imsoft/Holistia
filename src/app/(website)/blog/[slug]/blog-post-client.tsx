"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Share2, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface BlogPostClientProps {
  post: {
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
    author?: {
      name: string;
      profession: string;
      avatar?: string;
      professionalId?: string;
      professionalSlug?: string;
      isProfessional?: boolean;
    };
  };
  relatedPosts: {
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
    author?: {
      name: string;
      profession: string;
    };
  }[];
}

export function BlogPostClient({ post, relatedPosts }: BlogPostClientProps) {
  const [copied, setCopied] = useState(false);

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
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Enlace copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Error al copiar el enlace");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="py-8 sm:py-12 lg:py-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <nav className="mb-6 sm:mb-8">
              <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/" className="hover:text-foreground transition-colors">
                    Inicio
                  </Link>
                </li>
                <li>/</li>
                <li>
                  <Link href="/blog" className="hover:text-foreground transition-colors">
                    Blog
                  </Link>
                </li>
                <li>/</li>
                <li className="text-foreground font-medium truncate">{post.title}</li>
              </ol>
            </nav>

            {/* Article Header */}
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 sm:mb-6 leading-tight">
                {post.title}
              </h1>
              
              {post.excerpt && (
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed">
                  {post.excerpt}
                </p>
              )}

              {/* Article Meta */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(post.published_at!)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{getReadingTime(post.content)}</span>
                </div>

                {post.author && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {post.author.isProfessional && post.author.professionalId ? (
                      <Link
                        href={`/explore/professional/${post.author.professionalId}`}
                        className="hover:underline hover:text-foreground transition-colors"
                      >
                        <span className="font-medium">{post.author.name}</span>
                        <span className="opacity-75 ml-1">({post.author.profession})</span>
                      </Link>
                    ) : (
                      <>
                        <span>{post.author.name}</span>
                        <span className="opacity-75">({post.author.profession})</span>
                      </>
                    )}
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  {copied ? "Copiado" : "Compartir"}
                </Button>
              </div>
            </div>

            {/* Featured Image */}
            {post.featured_image && (
              <div className="relative w-full h-64 sm:h-80 lg:h-96 mb-8 sm:mb-12 rounded-lg overflow-hidden">
                <Image
                  src={post.featured_image}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none">
            <div 
              className="text-base sm:text-lg leading-relaxed text-foreground"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* Author Bio */}
          {post.author && (
            <div className="mt-12 pt-8 border-t border-border">
              <div className="flex items-start gap-4">
                {post.author.isProfessional && post.author.professionalId ? (
                  <Link href={`/explore/professional/${post.author.professionalId}`}>
                    {post.author.avatar ? (
                      <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer">
                        <Image
                          src={post.author.avatar}
                          alt={post.author.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer">
                        <User className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </Link>
                ) : (
                  <>
                    {post.author.avatar ? (
                      <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src={post.author.avatar}
                          alt={post.author.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </>
                )}
                <div className="flex-1">
                  {post.author.isProfessional && post.author.professionalId ? (
                    <Link
                      href={`/explore/professional/${post.author.professionalId}`}
                      className="block mb-2"
                    >
                      <h3 className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
                        {post.author.name}
                      </h3>
                    </Link>
                  ) : (
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {post.author.name}
                    </h3>
                  )}
                  <p className="text-sm text-muted-foreground mb-2">
                    {post.author.profession}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Profesional certificado en Holistia con amplia experiencia en el campo de la salud mental y bienestar.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="bg-muted/20 py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
                Artículos Relacionados
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {relatedPosts.map((relatedPost) => (
                  <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                    <Card className="h-full group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                      <CardContent className="p-4 sm:p-6">
                        {relatedPost.featured_image && (
                          <div className="relative w-full h-40 sm:h-48 mb-4 rounded-lg overflow-hidden">
                            <Image
                              src={relatedPost.featured_image}
                              alt={relatedPost.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        
                        <h3 className="text-lg sm:text-xl font-semibold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                          {relatedPost.title}
                        </h3>
                        
                        {relatedPost.excerpt && (
                          <p className="text-sm sm:text-base text-muted-foreground mb-4 line-clamp-3">
                            {relatedPost.excerpt}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(relatedPost.published_at!)}</span>
                          </div>
                          
                          {relatedPost.author && (
                            <div className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              <span className="truncate max-w-24">{relatedPost.author.name}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
