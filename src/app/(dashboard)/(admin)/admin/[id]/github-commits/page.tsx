"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
  Github,
  Star,
  GitFork,
  Code,
  Clock,
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
  const params = useParams();
  const userId = params.id as string;

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

  const formatCommitMessage = (message: string) => {
    // Separar título y cuerpo del commit
    const lines = message.split('\n');
    const title = lines[0];
    const body = lines.slice(1).filter(line => line.trim()).join('\n');
    
    return { title, body };
  };

  const getShortSha = (sha: string) => sha.substring(0, 7);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex flex-col sm:flex-row sm:h-16 sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-0 gap-4 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <Github className="h-5 w-5 text-foreground" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  Commits de GitHub
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Historial de commits del repositorio
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
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
        {/* Configuración del Repositorio */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración del Repositorio</CardTitle>
            <CardDescription>
              Configura el repositorio de GitHub que deseas visualizar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner">Owner/Organización</Label>
                <Input
                  id="owner"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="imsoft"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repo">Repositorio</Label>
                <Input
                  id="repo"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder="Holistia"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch">Rama</Label>
                <Input
                  id="branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="perPage">Commits por página</Label>
                <Select
                  value={perPage.toString()}
                  onValueChange={(value) => {
                    setPerPage(parseInt(value));
                    setPage(1); // Reset a página 1
                  }}
                >
                  <SelectTrigger>
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
          </CardContent>
        </Card>

        {/* Información del Repositorio */}
        {repository && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                {repository.full_name}
              </CardTitle>
              {repository.description && (
                <CardDescription>{repository.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">{repository.stars}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GitFork className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">{repository.forks}</span>
                </div>
                {repository.language && (
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">{repository.language}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">{repository.default_branch}</span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={repository.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver en GitHub
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rate Limit Info */}
        {rateLimit && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">
                    Rate Limit: {rateLimit.remaining} / {rateLimit.limit} requests restantes
                  </span>
                </div>
                {rateLimit.remaining < 10 && (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Límite bajo
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

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
                <span className="ml-2 text-muted-foreground">Cargando commits...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Commits List */}
        {!loading && !error && commits.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {commits.length} {commits.length === 1 ? 'commit' : 'commits'}
              </h2>
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
                  disabled={commits.length < perPage}
                >
                  Siguiente
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {commits.map((commit) => {
                const { title, body } = formatCommitMessage(commit.message);
                const commitDate = new Date(commit.author.date);
                
                return (
                  <Card key={commit.sha} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
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
                              <h3 className="font-semibold text-foreground mb-1 break-words">
                                {title}
                              </h3>
                              {body && (
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words mb-2">
                                  {body}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="flex-shrink-0"
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
                              {commit.author.login && (
                                <span className="text-muted-foreground">
                                  (@{commit.author.login})
                                </span>
                              )}
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
                disabled={commits.length < perPage || loading}
              >
                Siguiente
              </Button>
            </div>
          </>
        )}

        {/* Empty State */}
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
