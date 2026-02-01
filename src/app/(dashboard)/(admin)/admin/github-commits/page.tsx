"use client";

import { useState, useEffect } from "react";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GitBranch,
  GitCommit,
  Calendar,
  User,
  ExternalLink,
  RefreshCw,
  AlertCircle,
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

  // Filtrar commits por prefijo
  const filteredCommits = commits.filter((commit) => {
    if (selectedPrefix === "all") return true;
    const prefix = extractPrefix(commit.message);
    return prefix === selectedPrefix;
  });

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex flex-col sm:flex-row sm:h-16 sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-0 gap-4 sm:gap-0">
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
      <div className="p-4 sm:p-6 space-y-6">

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

        {/* Loading */}
        {loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 inline-block h-4 w-32 bg-muted rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Commits List */}
        {!loading && !error && commits.length > 0 && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <h2 className="text-xl font-semibold">
                  {filteredCommits.length} {filteredCommits.length === 1 ? 'commit' : 'commits'}
                  {selectedPrefix !== "all" && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      (de {commits.length} total)
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-2">
                  <Label htmlFor="prefixFilter" className="text-sm text-muted-foreground whitespace-nowrap">
                    Filtrar por:
                  </Label>
                  <Select
                    value={selectedPrefix}
                    onValueChange={(value) => {
                      setSelectedPrefix(value);
                      setPage(1); // Reset a página 1
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {availablePrefixes.map((prefix) => (
                        <SelectItem key={prefix} value={prefix}>
                          {prefix}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="perPage" className="text-sm text-muted-foreground whitespace-nowrap">
                    Por página:
                  </Label>
                  <Select
                    value={perPage.toString()}
                    onValueChange={(value) => {
                      setPerPage(parseInt(value));
                      setPage(1); // Reset a página 1
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={filteredCommits.length < perPage}
                >
                  Siguiente
                </Button>
              </div>
            </div>

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

            {/* Paginación */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1 || loading}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground px-4">
                Página {page}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={filteredCommits.length < perPage || loading}
              >
                Siguiente
              </Button>
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && !error && filteredCommits.length === 0 && commits.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <GitCommit className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">
                  No se encontraron commits con el prefijo "{selectedPrefix}"
                </p>
                <p className="text-sm text-muted-foreground">
                  Intenta seleccionar otro prefijo o "Todos" para ver todos los commits
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State - No commits at all */}
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
      </div>
    </div>
  );
}
