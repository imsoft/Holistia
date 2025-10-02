"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { BlogPost } from "@/types/blog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";

export default function EditBlogPostPage({ 
  params 
}: { 
  params: { id: string; postId: string } 
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<BlogPost | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    status: "draft" as "draft" | "published",
  });

  const supabase = createClient();

  useEffect(() => {
    if (user && params.postId) {
      fetchPost();
    }
  }, [user, params.postId]);

  const fetchPost = async () => {
    try {
      setFetchLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", params.postId)
        .single();

      if (error) {
        console.error("Error fetching post:", error);
        setError("Error al cargar el post");
        return;
      }

      if (!data) {
        setError("Post no encontrado");
        return;
      }

      setPost(data);
      setFormData({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || "",
        content: data.content,
        status: data.status,
      });
    } catch (err) {
      console.error("Error:", err);
      setError("Error inesperado al cargar el post");
    } finally {
      setFetchLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !post) {
      setError("No estás autenticado o el post no existe");
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      setError("El título y contenido son obligatorios");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const updateData = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        excerpt: formData.excerpt.trim() || null,
        content: formData.content.trim(),
        status: formData.status,
        published_at: formData.status === "published" && post.status === "draft" 
          ? new Date().toISOString() 
          : post.published_at,
      };

      const { error } = await supabase
        .from("blog_posts")
        .update(updateData)
        .eq("id", params.postId);

      if (error) {
        console.error("Error updating post:", error);
        if (error.code === "23505") {
          setError("Ya existe un post con este slug. Cambia el título o slug.");
        } else {
          setError("Error al actualizar el post: " + error.message);
        }
        return;
      }

      // Refresh post data
      fetchPost();
      alert("Post actualizado exitosamente");
    } catch (err) {
      console.error("Error:", err);
      setError("Error inesperado al actualizar el post");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar este post? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", params.postId);

      if (error) {
        console.error("Error deleting post:", error);
        alert("Error al eliminar el post");
        return;
      }

      router.push(`/admin/${params.id}/blog`);
    } catch (err) {
      console.error("Error:", err);
      alert("Error inesperado al eliminar el post");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando...</p>
      </div>
    );
  }

  if (fetchLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="space-y-4">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Post no encontrado</h1>
          <Button asChild>
            <Link href={`/admin/${params.id}/blog`}>
              Volver al Blog
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/admin/${params.id}/blog`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Blog
          </Link>
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Editar Post</h1>
            <p className="text-muted-foreground mt-2">
              Modifica el contenido del post del blog
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Escribe el título del post..."
                required
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="url-del-post"
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                URL: /blog/{formData.slug}
              </p>
            </div>

            <div>
              <Label htmlFor="excerpt">Resumen</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Breve descripción del post..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "draft" | "published") => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contenido</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="content">Contenido del Post *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Escribe aquí el contenido de tu post..."
                rows={15}
                required
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? (
              "Guardando..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
          
          <Button type="button" variant="outline" asChild>
            <Link href={`/admin/${params.id}/blog`}>
              Cancelar
            </Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
