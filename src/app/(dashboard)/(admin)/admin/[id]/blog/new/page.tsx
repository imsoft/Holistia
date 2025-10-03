"use client";

import { useState, use } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { BlogImageUploader } from "@/components/ui/blog-image-uploader";

export default function NewBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempPostId] = useState(() => crypto.randomUUID()); // ID temporal para el storage
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    status: "draft" as "draft" | "published",
    featured_image: "",
  });

  const supabase = createClient();

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
    
    if (!user) {
      setError("No estás autenticado");
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      setError("El título y contenido son obligatorios");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const postData = {
        title: formData.title.trim(),
        slug: formData.slug.trim() || generateSlug(formData.title),
        excerpt: formData.excerpt.trim() || null,
        content: formData.content.trim(),
        status: formData.status,
        author_id: user.id,
        published_at: formData.status === "published" ? new Date().toISOString() : null,
        featured_image: formData.featured_image || null,
      };

      const { data, error } = await supabase
        .from("blog_posts")
        .insert([postData])
        .select()
        .single();

      if (error) {
        console.error("Error creating post:", error);
        if (error.code === "23505") {
          setError("Ya existe un post con este slug. Cambia el título o slug.");
        } else {
          setError("Error al crear el post: " + error.message);
        }
        return;
      }

      // Redirect to edit page for the new post
      router.push(`/admin/${id}/blog/${data.id}`);
    } catch (err) {
      console.error("Error:", err);
      setError("Error inesperado al crear el post");
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/admin/${id}/blog`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Blog
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold text-foreground">Crear Nuevo Post</h1>
        <p className="text-muted-foreground mt-2">
          Escribe un nuevo post para el blog de Holistia
        </p>
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
                Se genera automáticamente desde el título. URL: /blog/{formData.slug}
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
              <p className="text-sm text-muted-foreground mt-1">
                Aparecerá en la lista de posts y en las redes sociales
              </p>
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
              <p className="text-sm text-muted-foreground mt-1">
                Puedes usar Markdown básico para formatear el texto
              </p>
            </div>
          </CardContent>
        </Card>

        <BlogImageUploader
          blogPostId={tempPostId}
          onImageUploaded={(imageUrl) => setFormData(prev => ({ ...prev, featured_image: imageUrl }))}
          currentImageUrl={formData.featured_image}
          onImageRemoved={() => setFormData(prev => ({ ...prev, featured_image: "" }))}
        />

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? (
              "Creando..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Crear Post
              </>
            )}
          </Button>
          
          <Button type="button" variant="outline" asChild>
            <Link href={`/admin/${id}/blog`}>
              Cancelar
            </Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
