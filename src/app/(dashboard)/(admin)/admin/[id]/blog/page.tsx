"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { BlogPost } from "@/types/blog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  User,
  FileText
} from "lucide-react";
import Link from "next/link";

export default function AdminBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching posts:", error);
        setError("Error al cargar los posts del blog");
        return;
      }

      setPosts(data || []);
    } catch (err) {
      console.error("Error:", err);
      setError("Error inesperado al cargar los posts");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este post?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", postId);

      if (error) {
        console.error("Error deleting post:", error);
        toast.error("Error al eliminar el post");
        return;
      }

      // Refresh posts list
      fetchPosts();
      toast.success("Post eliminado exitosamente");
    } catch (err) {
      console.error("Error:", err);
      toast.error("Error inesperado al eliminar el post");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Gestión del Blog</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Administra los posts del blog de Holistia
          </p>
        </div>
        <Button asChild size="sm" className="sm:size-default w-full sm:w-auto">
          <Link href={`/admin/${id}/blog/new`}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Post
          </Link>
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse p-4">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card className="p-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay posts aún</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comienza creando tu primer post del blog para Holistia
            </p>
            <Button asChild>
              <Link href={`/admin/${id}/blog/new`}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Post
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow p-4">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">
                    {post.title}
                  </CardTitle>
                  <Badge 
                    variant={post.status === "published" ? "default" : "secondary"}
                  >
                    {post.status === "published" ? "Publicado" : "Borrador"}
                  </Badge>
                </div>
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {post.excerpt}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <User className="w-4 h-4 mr-2" />
                    <span>Autor: {post.author_id}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      {post.status === "published" && post.published_at
                        ? `Publicado: ${formatDate(post.published_at)}`
                        : `Creado: ${formatDate(post.created_at)}`}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="flex-1"
                    >
                      <Link href={`/admin/${id}/blog/${post.id}`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePost(post.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
