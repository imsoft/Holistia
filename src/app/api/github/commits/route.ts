import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route para obtener commits de GitHub
 * 
 * GET /api/github/commits
 * Query params:
 *   - owner: Owner del repositorio (default: 'imsoft')
 *   - repo: Nombre del repositorio (default: 'Holistia')
 *   - branch: Rama (default: 'main')
 *   - per_page: Número de commits por página (default: 30)
 *   - page: Página (default: 1)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get('owner') || 'imsoft';
    const repo = searchParams.get('repo') || 'Holistia';
    const branch = searchParams.get('branch') || 'main';
    const perPage = parseInt(searchParams.get('per_page') || '30');
    const page = parseInt(searchParams.get('page') || '1');

    // Usar token de GitHub si está disponible (opcional, para aumentar rate limit)
    const githubToken = process.env.GITHUB_TOKEN;
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Holistia-Admin-Dashboard',
    };

    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }

    // Obtener commits de la API de GitHub
    const url = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&per_page=${perPage}&page=${page}`;
    
    const response = await fetch(url, {
      headers,
      next: { revalidate: 60 }, // Cache por 60 segundos
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API Error:', response.status, errorText);
      
      return NextResponse.json(
        { 
          error: 'Error al obtener commits de GitHub',
          details: response.status === 404 
            ? 'Repositorio no encontrado' 
            : response.status === 403
            ? 'Rate limit excedido o repositorio privado'
            : `Error ${response.status}: ${errorText.substring(0, 200)}`
        },
        { status: response.status }
      );
    }

    const commits = await response.json();

    // Función para limpiar mensajes de commit
    const cleanCommitMessage = (message: string): string => {
      if (!message) return '';
      
      // Remover "🤖 Generated with [Claude Code](https://claude.com/claude-code)"
      let cleaned = message.replace(/🤖\s*Generated\s+with\s+\[Claude\s+Code\]\(https:\/\/claude\.com\/claude-code\)/gi, '');
      
      // Remover "Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
      cleaned = cleaned.replace(/Co-Authored-By:\s*Claude\s+Sonnet\s+4\.5\s+<noreply@anthropic\.com>/gi, '');
      
      // Remover líneas vacías múltiples y espacios al inicio/final
      cleaned = cleaned
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n')
        .trim();
      
      return cleaned || message; // Si quedó vacío, devolver el original
    };

    // Formatear commits para el frontend
    const formattedCommits = commits.map((commit: any) => ({
      sha: commit.sha,
      message: cleanCommitMessage(commit.commit.message),
      author: {
        name: commit.commit.author.name,
        email: commit.commit.author.email,
        date: commit.commit.author.date,
        avatar: commit.author?.avatar_url || null,
        login: commit.author?.login || null,
      },
      committer: {
        name: commit.commit.committer.name,
        email: commit.commit.committer.email,
        date: commit.commit.committer.date,
      },
      url: commit.html_url,
      tree: {
        sha: commit.commit.tree.sha,
        url: commit.commit.tree.url,
      },
      parents: commit.parents.map((p: any) => ({
        sha: p.sha,
        url: p.html_url,
      })),
      stats: commit.stats || null,
      files: commit.files || null,
    }));

    // Obtener información del repositorio
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
      next: { revalidate: 300 }, // Cache por 5 minutos
    });

    let repoInfo = null;
    if (repoResponse.ok) {
      const repoData = await repoResponse.json();
      repoInfo = {
        name: repoData.name,
        full_name: repoData.full_name,
        description: repoData.description,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        language: repoData.language,
        default_branch: repoData.default_branch,
        url: repoData.html_url,
      };
    }

    // Obtener rate limit info
    const rateLimitResponse = await fetch('https://api.github.com/rate_limit', {
      headers,
      next: { revalidate: 60 },
    });
    
    let rateLimit = null;
    if (rateLimitResponse.ok) {
      const rateLimitData = await rateLimitResponse.json();
      rateLimit = {
        remaining: rateLimitData.rate.remaining,
        limit: rateLimitData.rate.limit,
        reset: rateLimitData.rate.reset,
      };
    }

    return NextResponse.json({
      success: true,
      commits: formattedCommits,
      pagination: {
        page,
        per_page: perPage,
        total: commits.length,
      },
      repository: repoInfo,
      rate_limit: rateLimit,
    });

  } catch (error) {
    console.error('Error fetching GitHub commits:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener commits de GitHub',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
