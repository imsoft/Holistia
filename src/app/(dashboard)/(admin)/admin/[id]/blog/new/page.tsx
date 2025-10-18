"use client";

import React, { useState, use } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { BlogImageUploader } from "@/components/ui/blog-image-uploader";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { generateUniqueSlug, isValidSlug } from "@/lib/slug-utils";
import { BlogAuthor } from "@/types/blog";

export default function NewBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempPostId] = useState(() => crypto.randomUUID()); // ID temporal para el storage
  const [slugValidation, setSlugValidation] = useState<{
    isValid: boolean;
    message: string;
  }>({ isValid: true, message: "" });
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    status: "draft" as "draft" | "published",
    featured_image: "",
    author_id: "",
  });
  
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [loadingAuthors, setLoadingAuthors] = useState(true);

  const supabase = createClient();

  // Obtener lista de autores disponibles
  const fetchAuthors = React.useCallback(async () => {
    try {
      setLoadingAuthors(true);

      // Obtener administradores (usuarios con rol admin)
      const { data: admins, error: adminsError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url, role');

      console.log('Admins query result:', { admins, adminsError });

      if (adminsError) {
        console.error('Error fetching admins:', adminsError);
      }

      // Obtener profesionales
      const { data: professionals, error: professionalsError } = await supabase
        .from('professional_applications')
        .select('id, first_name, last_name, email, profession, profile_photo, status');

      console.log('Professionals query result:', { professionals, professionalsError });

      if (professionalsError) {
        console.error('Error fetching professionals:', professionalsError);
      }

      // Filtrar y combinar autores
      const filteredAdmins = (admins || []).filter(admin =>
        admin.role === 'admin' &&
        admin.first_name &&
        admin.last_name
      );

      const filteredProfessionals = (professionals || []).filter(prof =>
        prof.status === 'approved' &&
        prof.first_name &&
        prof.last_name
      );

      console.log('Filtered results:', {
        filteredAdmins,
        filteredProfessionals,
        totalAdmins: filteredAdmins.length,
        totalProfessionals: filteredProfessionals.length
      });

      // Combinar y formatear autores
      const allAuthors: BlogAuthor[] = [
        ...filteredAdmins.map(admin => ({
          id: admin.id,
          name: `${admin.first_name} ${admin.last_name}`,
          email: admin.email,
          avatar: admin.avatar_url,
          profession: 'Administrador',
          type: 'user' as const
        })),
        ...filteredProfessionals.map(professional => ({
          id: professional.id,
          name: `${professional.first_name} ${professional.last_name}`,
          email: professional.email,
          avatar: professional.profile_photo,
          profession: professional.profession,
          type: 'professional' as const
        }))
      ];

      // Ordenar por nombre
      allAuthors.sort((a, b) => a.name.localeCompare(b.name));

      console.log('Final authors list:', allAuthors);

      setAuthors(allAuthors);
    } catch (error) {
      console.error('Error fetching authors:', error);
      setError('Error al cargar la lista de autores');
    } finally {
      setLoadingAuthors(false);
    }
  }, [supabase]);

  // Cargar autores al montar el componente
  React.useEffect(() => {
    fetchAuthors();
  }, [fetchAuthors]);

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
      message: isValid ? "Slug válido" : "El slug debe tener entre 3-50 caracteres y solo letras, números y guiones"
    });
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

    if (!formData.author_id) {
      setError("Debe seleccionar un autor");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Generar un slug único
      const baseSlug = formData.slug.trim() || formData.title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      const uniqueSlug = await generateUniqueSlug(baseSlug, null, supabase);

      const postData = {
        title: formData.title.trim(),
        slug: uniqueSlug,
        excerpt: formData.excerpt.trim() || null,
        content: formData.content.trim(),
        status: formData.status,
        author_id: formData.author_id,
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
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
      <div className="mb-4 sm:mb-6">
        
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Crear Nuevo Post</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Escribe un nuevo post para el blog de Holistia
        </p>
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <div className="relative">
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="url-del-post"
                  required
                  className={slugValidation.isValid ? "" : "border-destructive"}
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
              {formData.slug && (
                <p className={`text-xs ${slugValidation.isValid ? "text-green-600" : "text-destructive"}`}>
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
              <p className="text-xs sm:text-sm text-muted-foreground">
                Aparecerá en la lista de posts y en las redes sociales
              </p>
            </div>

            <div className="space-y-2">
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

            <div className="space-y-2">
              <Label htmlFor="author">Autor *</Label>
              <Select
                value={formData.author_id}
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, author_id: value }))
                }
                disabled={loadingAuthors}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingAuthors ? "Cargando autores..." : "Selecciona un autor"} />
                </SelectTrigger>
                <SelectContent>
                  {authors.map((author) => (
                    <SelectItem key={author.id} value={author.id}>
                      <div className="flex items-center gap-2">
                        <span>{author.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({author.type === 'professional' ? author.profession : 'Usuario'})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Selecciona el autor que aparecerá en el post
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
          blogPostId={tempPostId}
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
              "Creando..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Crear Post
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
    </div>
  );
}
