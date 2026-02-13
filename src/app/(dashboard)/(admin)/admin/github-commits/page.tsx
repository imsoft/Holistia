"use client";

import { useState, useEffect, useMemo } from "react";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GitCommit,
  Calendar,
  User,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Search,
  TrendingUp,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Commit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
    avatar: string | null;
    login: string | null;
  };
  committer: {
    name: string;
    email: string;
    date: string;
  };
  url: string;
  tree: {
    sha: string;
    url: string;
  };
  parents: Array<{
    sha: string;
    url: string;
  }>;
  stats: any;
  files: any;
}

interface RepositoryInfo {
  name: string;
  full_name: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  default_branch: string;
  url: string;
}

interface RateLimit {
  remaining: number;
  limit: number;
  reset: number;
}

export default function GitHubCommitsPage() {
  useUserStoreInit();
  const userId = useUserId();

  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repository, setRepository] = useState<RepositoryInfo | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimit | null>(null);

  // Configuración del repositorio
  const [owner, setOwner] = useState("imsoft");
  const [repo, setRepo] = useState("Holistia");
  const [branch, setBranch] = useState("main");
  const [perPage, setPerPage] = useState(30);
  const [page, setPage] = useState(1);
  const [selectedPrefix, setSelectedPrefix] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [authorFilter, setAuthorFilter] = useState("all");

  const fetchCommits = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        owner,
        repo,
        branch,
        per_page: perPage.toString(),
        page: page.toString(),
      });

      const response = await fetch(`/api/github/commits?${params.toString()}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.details || 'Error al obtener commits');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al obtener commits');
      }

      setCommits(data.commits || []);
      setRepository(data.repository);
      setRateLimit(data.rate_limit);

    } catch (err) {
      console.error('Error fetching commits:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast.error(`Error al cargar commits: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommits();
  }, [owner, repo, branch, perPage, page]);

  // Lista de prefijos disponibles
  const availablePrefixes = [
    'feat', 'fix', 'refactor', 'chore', 'docs', 'style', 'test', 
    'perf', 'build', 'ci', 'revert', 'merge', 'hotfix', 'release',
    'seo', 'ui', 'database', 'add'
  ];

  // Función para extraer el prefijo de un mensaje de commit
  const extractPrefix = (message: string): string | null => {
    if (!message) return null;
    const firstLine = message.split('\n')[0];
    const prefixPattern = new RegExp(`^(${availablePrefixes.join('|')})(\\([^)]+\\))?:`, 'i');
    const match = firstLine.match(prefixPattern);
    return match ? match[1].toLowerCase() : null;
  };

  // Calcular stats
  const stats = useMemo(() => {
    const total = commits.length;
    const featCount = commits.filter(c => extractPrefix(c.message) === 'feat').length;
    const fixCount = commits.filter(c => extractPrefix(c.message) === 'fix').length;
    const otherCount = total - featCount - fixCount;
    return { total, featCount, fixCount, otherCount };
  }, [commits]);

  // Obtener autores únicos
  const authors = useMemo(() => {
    const unique = new Map<string, string>();
    commits.forEach(c => unique.set(c.author.email, c.author.name));
    return Array.from(unique.entries()).map(([email, name]) => ({ email, name }));
  }, [commits]);

  // Filtrar commits por prefijo, búsqueda y autor
  const filteredCommits = useMemo(() => {
    return commits.filter((commit) => {
      if (selectedPrefix !== "all" && extractPrefix(commit.message) !== selectedPrefix) return false;
      if (authorFilter !== "all" && commit.author.email !== authorFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesMessage = commit.message.toLowerCase().includes(term);
        const matchesAuthor = commit.author.name.toLowerCase().includes(term) || 
          commit.author.email.toLowerCase().includes(term);
        if (!matchesMessage && !matchesAuthor) return false;
      }
      return true;
    });
  }, [commits, selectedPrefix, authorFilter, searchTerm]);

  // Función para escapar HTML de forma segura (funciona en cliente y servidor)
  const escapeHtml = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Función para formatear el mensaje del commit con prefijos en negrita
  const formatCommitMessage = (message: string): string => {
    if (!message) return '';
    
    // Dividir el mensaje en líneas y filtrar Co-authored-by
    const lines = message.split('\n').filter(line => 
      !line.trim().toLowerCase().startsWith('co-authored-by:')
    );
    if (lines.length === 0) return '';
    const firstLine = lines[0];
    const restLines = lines.slice(1);
    
    // Crear regex para detectar prefijos al inicio del mensaje
    const prefixPattern = new RegExp(`^(${availablePrefixes.join('|')})(\\([^)]+\\))?:\\s*(.+)`, 'i');
    const match = firstLine.match(prefixPattern);
    
    let formattedFirstLine: string;
    
    if (match) {
      const prefix = match[1];
      const scope = match[2] || '';
      const rest = match[3];
      
      // Escapar el resto del mensaje y formatear con negrita el prefijo y scope
      formattedFirstLine = `<strong>${escapeHtml(prefix)}${escapeHtml(scope)}:</strong> ${escapeHtml(rest)}`;
    } else {
      // Si no hay prefijo, solo escapar HTML
      formattedFirstLine = escapeHtml(firstLine);
    }
    
    // Escapar y formatear las líneas restantes
    const formattedRestLines = restLines
      .map(line => escapeHtml(line))
      .join('<br>');
    
    // Combinar primera línea con el resto
    return restLines.length > 0 
      ? `${formattedFirstLine}<br>${formattedRestLines}`
      : formattedFirstLine;
  };

  const getShortSha = (sha: string) => sha.substring(0, 7);

  return (
    <div className="admin-page-shell">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-inner admin-page-header-inner-row">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                Commits de GitHub
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Historial de commits del repositorio
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={fetchCommits}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        {/* Error */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Error al cargar commits</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="animate-pulse space-y-4 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted rounded-lg" />)}
            </div>
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        {/* Stats Cards + Filters */}
        {!loading && !error && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total Commits</span>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <GitCommit className="h-3 w-3" />
                      Página {page}
                    </Badge>
                  </div>
                  <div className="text-3xl font-bold">{stats.total}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">cargados</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {repository ? `${repository.full_name}` : "Repositorio"}
                  </p>
                </CardContent>
              </Card>

              <Card className="border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">feat</span>
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Nuevas funcionalidades
                    </Badge>
                  </div>
                  <div className="text-3xl font-bold">{stats.featCount}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-blue-600 dark:text-blue-400">Features</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.total > 0 ? ((stats.featCount / stats.total) * 100).toFixed(0) : 0}% del total
                  </p>
                </CardContent>
              </Card>

              <Card className="border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">fix</span>
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                      <Wrench className="h-3 w-3 mr-1" />
                      Correcciones
                    </Badge>
                  </div>
                  <div className="text-3xl font-bold">{stats.fixCount}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Wrench className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-amber-600 dark:text-amber-400">Bug fixes</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.total > 0 ? ((stats.fixCount / stats.total) * 100).toFixed(0) : 0}% del total
                  </p>
                </CardContent>
              </Card>

              <Card className="border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Otros</span>
                    <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                      <Zap className="h-3 w-3 mr-1" />
                      refactor, chore, docs
                    </Badge>
                  </div>
                  <div className="text-3xl font-bold">{stats.otherCount}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Zap className="h-4 w-4 text-purple-500" />
                    <span className="text-sm text-purple-600 dark:text-purple-400">Resto</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {rateLimit ? `${rateLimit.remaining} requests API restantes` : "API GitHub"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por mensaje o autor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <Select
                value={selectedPrefix}
                onValueChange={(value) => {
                  setSelectedPrefix(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tipo de commit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {availablePrefixes.map((prefix) => (
                    <SelectItem key={prefix} value={prefix}>
                      {prefix}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={authorFilter} onValueChange={setAuthorFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Autor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los autores</SelectItem>
                  {authors.map(({ email, name }) => (
                    <SelectItem key={email} value={email}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={perPage.toString()}
                onValueChange={(value) => {
                  setPerPage(parseInt(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Por página" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 por página</SelectItem>
                  <SelectItem value="20">20 por página</SelectItem>
                  <SelectItem value="30">30 por página</SelectItem>
                  <SelectItem value="50">50 por página</SelectItem>
                  <SelectItem value="100">100 por página</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Commits List / Content */}
        {!loading && !error && commits.length > 0 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <span className="text-sm text-muted-foreground">
                {filteredCommits.length} {filteredCommits.length === 1 ? 'commit' : 'commits'} mostrados
                {(searchTerm || selectedPrefix !== "all" || authorFilter !== "all") && (
                  <span className="ml-1">(de {commits.length} en esta página)</span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">Página {page}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={commits.length < perPage}
                >
                  Siguiente
                </Button>
              </div>
            </div>

            {filteredCommits.length > 0 ? (
            <div className="space-y-4">
              {filteredCommits.map((commit) => {
                const commitDate = new Date(commit.author.date);
                
                return (
                  <Card key={commit.sha} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-4">
                        {/* Avatar del autor */}
                        {commit.author.avatar ? (
                          <img
                            src={commit.author.avatar}
                            alt={commit.author.name}
                            className="h-10 w-10 rounded-full border-2 border-border"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}

                        {/* Contenido del commit */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1 min-w-0">
                              <p 
                                className="text-sm text-foreground wrap-break-word"
                                dangerouslySetInnerHTML={{ 
                                  __html: formatCommitMessage(commit.message)
                                }}
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="shrink-0"
                            >
                              <Link
                                href={commit.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span className="font-medium">{commit.author.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {formatDistanceToNow(commitDate, {
                                  addSuffix: true,
                                  locale: es,
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <GitCommit className="h-3 w-3" />
                              <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                                {getShortSha(commit.sha)}
                              </code>
                            </div>
                            {commit.parents.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {commit.parents.length} {commit.parents.length === 1 ? 'parent' : 'parents'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <GitCommit className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-foreground mb-2">
                      No hay commits que coincidan con los filtros
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Prueba con otros filtros o "Todos" para ver los commits
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Empty State - Sin commits */}
        {!loading && !error && commits.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <GitCommit className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">
                  No se encontraron commits
                </p>
                <p className="text-sm text-muted-foreground">
                  Verifica la configuración del repositorio o intenta con otra rama
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
