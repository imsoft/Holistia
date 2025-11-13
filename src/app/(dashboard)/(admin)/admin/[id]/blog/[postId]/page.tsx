"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BlogPost, BlogAuthor } from "@/types/blog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { BlogImageUploader } from "@/components/ui/blog-image-uploader";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { generateUniqueSlug, isValidSlug } from "@/lib/slug-utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function EditBlogPostPage({ 
  params 
}: { 
  params: Promise<{ id: string; postId: string }> 
}) {
  const { id, postId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [slugValidation, setSlugValidation] = useState<{
    isValid: boolean;
    message: string;
  }>({ isValid: true, message: "" });
  const [post, setPost] = useState<BlogPost | null>(null);
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [loadingAuthors, setLoadingAuthors] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    status: "draft" as "draft" | "published",
    featured_image: "",
    author_id: "",
  });

  const supabase = createClient();

  useEffect(() => {
    if (user && postId) {
      fetchPost();
      fetchAuthors();
    }
  }, [user, postId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAuthors = async () => {
    try {
      setLoadingAuthors(true);

      const { data: { user: currentUser } } = await supabase.auth.getUser();

      const { data: professionals, error: professionalsError } = await supabase
        .from('professional_applications')
        .select('id, user_id, first_name, last_name, email, profession, profile_photo, status')
        .eq('status', 'approved')
        .not('first_name', 'is', null)
        .not('last_name', 'is', null);

      if (professionalsError) {
        console.error('Error fetching professionals:', professionalsError);
        return;
      }

      const allAuthors: BlogAuthor[] = [];

      // Obtener TODOS los administradores
      const { data: adminProfiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url, type')
        .or('type.eq.admin,type.eq.Admin')
        .not('first_name', 'is', null)
        .not('last_name', 'is', null);

      if (adminProfiles && adminProfiles.length > 0) {
        const adminAuthors = adminProfiles.map(admin => {
          const name = `${admin.first_name} ${admin.last_name}`;
          const isCurrentUser = admin.id === currentUser?.id;

          return {
            id: admin.id,
            name: isCurrentUser ? `${name} (Tú - Admin)` : `${name} (Admin)`,
            email: admin.email || '',
            avatar: admin.avatar_url,
            profession: 'Administrador',
            type: 'user' as const
          };
        });
        allAuthors.push(...adminAuthors);
      }

      // Agregar todos los profesionales aprobados
      if (professionals && professionals.length > 0) {
        const professionalAuthors = professionals.map(professional => ({
          id: professional.user_id, // Usar user_id en lugar de id
          name: `${professional.first_name} ${professional.last_name} (Profesional)`,
          email: professional.email,
          avatar: professional.profile_photo,
          profession: professional.profession,
          type: 'professional' as const
        }));
        allAuthors.push(...professionalAuthors);
      }

      // Ordenar: primero admins, luego profesionales
      allAuthors.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'user' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      setAuthors(allAuthors);
    } catch (error) {
      console.error('Error fetching authors:', error);
    } finally {
      setLoadingAuthors(false);
    }
  };

  const fetchPost = async () => {
    try {
      setFetchLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", postId)
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
        featured_image: data.featured_image || "",
        author_id: data.author_id || "",
      });
    } catch (err) {
      console.error("Error:", err);
      setError("Error inesperado al cargar el post");
    } finally {
      setFetchLoading(false);
    }
  };


  const handleTitleChange = (title: string) => {
    const newSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    setFormData(prev => ({
      ...prev,
      title,
      slug: newSlug
    }));
    
    // Validar el slug
    const isValid = isValidSlug(newSlug);
    setSlugValidation({
      isValid,
      message: isValid ? "Slug válido" : "El slug debe tener entre 3-200 caracteres y solo letras, números y guiones"
    });
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

      // Generar un slug único
      const uniqueSlug = await generateUniqueSlug(
        formData.slug.trim(), 
        postId, 
        supabase
      );

      const updateData = {
        title: formData.title.trim(),
        slug: uniqueSlug,
        excerpt: formData.excerpt.trim() || null,
        content: formData.content.trim(),
        status: formData.status,
        published_at: formData.status === "published" && post.status === "draft"
          ? new Date().toISOString()
          : post.published_at,
        featured_image: formData.featured_image || null,
        author_id: formData.author_id || null,
      };

      const { error } = await supabase
        .from("blog_posts")
        .update(updateData)
        .eq("id", postId);

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
      toast.success("Post actualizado exitosamente");
    } catch (err) {
      console.error("Error:", err);
      setError("Error inesperado al actualizar el post");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);

      // Eliminar imagen destacada del storage si existe
      if (post?.featured_image) {
        try {
          const urlParts = post.featured_image.split('/blog-images/');
          if (urlParts.length > 1) {
            const imagePath = urlParts[1];
            await supabase.storage
              .from('blog-images')
              .remove([imagePath]);
          }
        } catch (imgError) {
          console.error('Error deleting featured image:', imgError);
        }
      }

      // Eliminar el post de la base de datos
      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", postId);

      if (error) {
        console.error("Error deleting post:", error);
        toast.error("Error al eliminar el post");
        return;
      }

      toast.success("Post e imágenes eliminados exitosamente");
      router.push(`/admin/${id}/blog`);
    } catch (err) {
      console.error("Error:", err);
      toast.error("Error inesperado al eliminar el post");
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
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        <div className="animate-pulse space-y-4 sm:space-y-6">
          <div className="h-6 sm:h-8 bg-muted rounded w-1/2 sm:w-1/3"></div>
          <div className="h-3 sm:h-4 bg-muted rounded w-3/4 sm:w-1/2"></div>
          <div className="space-y-3 sm:space-y-4">
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
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold mb-4">Post no encontrado</h1>
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/admin/${id}/blog`}>
              Volver al Blog
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
      <div className="mb-4 sm:mb-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Editar Post</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Modifica el contenido del post del blog
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <Card className="p-3 sm:p-4">
          <CardHeader className="px-0">
            <CardTitle className="text-lg sm:text-xl">Información del Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-0">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Escribe el título del post..."
                required
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {formData.title.length}/200 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL) *</Label>
              <div className="relative">
                <Input
                  id="slug"
                  value={formData.slug}
                  readOnly
                  disabled
                  placeholder="se-genera-automaticamente"
                  className="bg-muted cursor-not-allowed"
                />
                {formData.slug && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {slugValidation.isValid ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground break-all">
                Se genera automáticamente desde el título. URL: /blog/{formData.slug}
              </p>
              {formData.slug && !slugValidation.isValid && (
                <p className="text-xs text-destructive">
                  {slugValidation.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Resumen</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Breve descripción del post..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "draft" | "published") =>
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">Autor *</Label>
              <Select
                value={formData.author_id}
                onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, author_id: value }))
                }
                disabled={loadingAuthors}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingAuthors ? "Cargando autores..." : "Selecciona un autor"} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] w-full">
                  {authors.map((author) => (
                    <SelectItem key={author.id} value={author.id} className="w-full">
                      <div className="flex flex-col gap-0.5 py-1 w-full">
                        <span className="font-medium truncate">{author.name}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {author.profession}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Muestra todos los administradores y profesionales aprobados. El nombre del autor aparecerá en el blog público.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-4">
          <CardHeader className="px-0">
            <CardTitle className="text-lg sm:text-xl">Contenido</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="space-y-2">
              <Label htmlFor="content">Contenido del Post *</Label>
              <RichTextEditor
                content={formData.content}
                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                placeholder="Escribe aquí el contenido de tu post..."
              />
              <p className="text-xs sm:text-sm text-muted-foreground">
                Usa la barra de herramientas para formatear el texto
              </p>
            </div>
          </CardContent>
        </Card>

        <BlogImageUploader
          blogPostId={postId}
          onImageUploaded={(imageUrl) => setFormData(prev => ({ ...prev, featured_image: imageUrl }))}
          currentImageUrl={formData.featured_image}
          onImageRemoved={() => setFormData(prev => ({ ...prev, featured_image: "" }))}
        />

        {error && (
          <div className="p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm sm:text-base text-destructive">{error}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? (
              "Guardando..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
          
          <Button type="button" variant="outline" asChild className="w-full sm:w-auto">
            <Link href={`/admin/${id}/blog`}>
              Cancelar
            </Link>
          </Button>
        </div>
      </form>

      {/* Dialog de confirmación para eliminar */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Eliminar Post"
        description="¿Estás seguro de que quieres eliminar este post? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}
