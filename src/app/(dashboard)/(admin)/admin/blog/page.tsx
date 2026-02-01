"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { BlogPost } from "@/types/blog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  User,
  FileText,
  Search,
  TrendingUp,
  TrendingDown,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { PageSkeleton } from "@/components/ui/layout-skeleton";

interface PostWithAuthor extends BlogPost {
  authorName?: string;
}

export default function AdminBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [authorFilter, setAuthorFilter] = useState("all");
  const [sortFilter, setSortFilter] = useState("newest");

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    thisMonth: 0,
    lastMonth: 0,
  });

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

      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching posts:", error);
        setError("Error al cargar los posts del blog");
        return;
      }

      const postsData = data || [];
      const authorIds = [...new Set(postsData.map((p) => p.author_id).filter(Boolean))];
      const authorNamesMap: Record<string, string> = {};

      if (authorIds.length > 0) {
        const { data: profs } = await supabase
          .from("professional_applications")
          .select("user_id, first_name, last_name")
          .in("user_id", authorIds)
          .eq("status", "approved");

        if (profs) {
          profs.forEach((p) => {
            const name = `${p.first_name || ""} ${p.last_name || ""}`.trim();
            if (name) authorNamesMap[p.user_id] = name;
          });
        }

        const missingIds = authorIds.filter((id) => !authorNamesMap[id]);
        if (missingIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, first_name, last_name")
            .in("id", missingIds);

          if (profiles) {
            profiles.forEach((p) => {
              const name = `${p.first_name || ""} ${p.last_name || ""}`.trim();
              authorNamesMap[p.id] = name || "Sin nombre";
            });
          }
        }
      }

      const postsWithAuthors: PostWithAuthor[] = postsData.map((post) => ({
        ...post,
        authorName: post.author_id ? authorNamesMap[post.author_id] || "Sin asignar" : "Sin asignar",
      }));

      setPosts(postsWithAuthors);

      // Calculate stats
      const published = postsData.filter(p => p.status === 'published').length;
      const drafts = postsData.filter(p => p.status === 'draft').length;
      const thisMonth = postsData.filter(p => new Date(p.created_at) >= currentMonthStart).length;
      const lastMonth = postsData.filter(p => {
        const date = new Date(p.created_at);
        return date >= lastMonthStart && date <= lastMonthEnd;
      }).length;

      setStats({
        total: postsData.length,
        published,
        drafts,
        thisMonth,
        lastMonth,
      });
    } catch (err) {
      console.error("Error:", err);
      setError("Error inesperado al cargar los posts");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = (postId: string) => {
    setPostToDelete(postId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;

    try {
      const { data: post, error: fetchError } = await supabase
        .from("blog_posts")
        .select("featured_image")
        .eq("id", postToDelete)
        .single();

      if (fetchError) throw fetchError;

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

      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", postToDelete);

      if (error) {
        console.error("Error deleting post:", error);
        toast.error("Error al eliminar el post");
        return;
      }

      fetchPosts();
      toast.success("Post e imágenes eliminados exitosamente");
    } catch (err) {
      console.error("Error:", err);
      toast.error("Error inesperado al eliminar el post");
    } finally {
      setPostToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Get unique authors for filter
  const uniqueAuthors = [...new Set(posts.map(p => p.authorName))].filter(Boolean);

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || post.status === statusFilter;
    const matchesAuthor = authorFilter === "all" || post.authorName === authorFilter;
    return matchesSearch && matchesStatus && matchesAuthor;
  }).sort((a, b) => {
    if (sortFilter === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortFilter === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortFilter === "title") return a.title.localeCompare(b.title);
    return 0;
  });

  const monthChange = calculatePercentageChange(stats.thisMonth, stats.lastMonth);

  if (!user) {
    return <PageSkeleton cards={6} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex flex-col sm:flex-row sm:h-16 sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-0 gap-4 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gestión del Blog</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Administra los posts del blog de Holistia
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button asChild size="sm" className="sm:size-default w-full sm:w-auto">
              <Link href={`/admin/blog/new`}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Post
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Posts */}
          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Posts</span>
                <Badge variant="outline" className={`text-xs ${monthChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {monthChange >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {monthChange >= 0 ? '+' : ''}{monthChange}%
                </Badge>
              </div>
              <div className="text-3xl font-bold mb-2">{stats.total}</div>
              <div className="flex items-center text-sm text-muted-foreground">
                <span className="font-medium text-foreground mr-1">{stats.thisMonth} este mes</span>
                {monthChange >= 0 ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Artículos en el blog</p>
            </CardContent>
          </Card>

          {/* Published */}
          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Publicados</span>
                <Badge variant="outline" className="text-xs text-green-600">
                  <Eye className="w-3 h-3 mr-1" />
                  Activos
                </Badge>
              </div>
              <div className="text-3xl font-bold mb-2">{stats.published}</div>
              <div className="flex items-center text-sm text-muted-foreground">
                <span className="font-medium text-foreground mr-1">Visibles al público</span>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stats.total > 0 ? Math.round((stats.published / stats.total) * 100) : 0}% del total</p>
            </CardContent>
          </Card>

          {/* Drafts */}
          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Borradores</span>
                <Badge variant="outline" className="text-xs text-amber-600">
                  <FileText className="w-3 h-3 mr-1" />
                  Pendientes
                </Badge>
              </div>
              <div className="text-3xl font-bold mb-2">{stats.drafts}</div>
              <div className="flex items-center text-sm text-muted-foreground">
                <span className="font-medium text-foreground mr-1">Sin publicar</span>
                <TrendingUp className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Requieren revisión</p>
            </CardContent>
          </Card>

          {/* Authors */}
          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Autores</span>
                <Badge variant="outline" className="text-xs text-blue-600">
                  <User className="w-3 h-3 mr-1" />
                  Activos
                </Badge>
              </div>
              <div className="text-3xl font-bold mb-2">{uniqueAuthors.length}</div>
              <div className="flex items-center text-sm text-muted-foreground">
                <span className="font-medium text-foreground mr-1">Contribuidores</span>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Creando contenido</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="published">Publicados</SelectItem>
              <SelectItem value="draft">Borradores</SelectItem>
            </SelectContent>
          </Select>
          <Select value={authorFilter} onValueChange={setAuthorFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Autor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los autores</SelectItem>
              {uniqueAuthors.map((author) => (
                <SelectItem key={author} value={author || "unknown"}>
                  {author}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortFilter} onValueChange={setSortFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Más recientes</SelectItem>
              <SelectItem value="oldest">Más antiguos</SelectItem>
              <SelectItem value="title">Por título</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm sm:text-base text-destructive">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse p-3 sm:p-4">
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
        ) : filteredPosts.length === 0 ? (
          <Card className="p-3 sm:p-4">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {posts.length === 0 ? "No hay posts aún" : "No se encontraron posts"}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {posts.length === 0 
                  ? "Comienza creando tu primer post del blog para Holistia"
                  : "No hay posts que coincidan con los filtros seleccionados"}
              </p>
              {posts.length === 0 && (
                <Button asChild>
                  <Link href={`/admin/blog/new`}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primer Post
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow overflow-hidden pt-0 pb-4">
                {post.featured_image && (
                  <div className="relative w-full h-40 sm:h-48 overflow-hidden bg-muted">
                    <Image
                      src={post.featured_image}
                      alt={post.title}
                      fill
                      className="object-cover"
                      unoptimized={
                        post.featured_image.includes("supabase") ||
                        post.featured_image.includes("supabase.in")
                      }
                    />
                    <div className="absolute top-3 right-3">
                      <Badge
                        variant={post.status === "published" ? "default" : "secondary"}
                      >
                        {post.status === "published" ? "Publicado" : "Borrador"}
                      </Badge>
                    </div>
                  </div>
                )}
                <CardHeader className={post.featured_image ? "px-4 sm:px-6 pt-4" : "p-3 sm:p-4"}>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2 flex-1 min-w-0">
                      {post.title}
                    </CardTitle>
                    {!post.featured_image && (
                      <Badge
                        variant={post.status === "published" ? "default" : "secondary"}
                        className="shrink-0"
                      >
                        {post.status === "published" ? "Publicado" : "Borrador"}
                      </Badge>
                    )}
                  </div>
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mt-1">
                      {post.excerpt}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <User className="w-4 h-4 mr-2 shrink-0" />
                      <span>Autor: {post.authorName}</span>
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
                        <Link href={`/admin/blog/${post.id}`}>
                          <Edit className="w-4 h-4 mr-1 sm:mr-2" />
                          <span className="text-xs sm:text-sm">Editar</span>
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePost(post.id)}
                        className="text-destructive hover:text-destructive px-2 sm:px-3"
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

      {/* Dialog de confirmación para eliminar */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Eliminar Post"
        description="¿Estás seguro de que quieres eliminar este post? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDeletePost}
        variant="destructive"
      />
    </div>
  );
}
