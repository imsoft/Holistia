"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  User,
  Target,
  Users,
  FileText,
  Crown,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchResults {
  users: Array<{
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    role: string;
  }>;
  challenges: Array<{
    id: string;
    title: string;
    description: string;
    cover_image: string | null;
    category: string;
    difficulty: string;
  }>;
  posts: Array<{
    checkin_id: string;
    user_first_name: string;
    user_last_name: string;
    challenge_title: string;
    notes: string;
  }>;
}

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({
    users: [],
    challenges: [],
    posts: [],
  });
  const [loading, setLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      performSearch(debouncedQuery);
    } else {
      setResults({
        users: [],
        challenges: [],
        posts: [],
      });
    }
  }, [debouncedQuery]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Error en la búsqueda");

      setResults(data.data);
    } catch (error) {
      console.error("Error searching:", error);
      toast.error("Error al realizar la búsqueda");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = useCallback((path: string) => {
    setOpen(false);
    setQuery("");
    router.push(path);
  }, [router]);

  const totalResults =
    results.users.length +
    results.challenges.length +
    results.posts.length;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar usuarios, retos o publicaciones..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && query.length >= 2 && totalResults === 0 && (
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>
        )}

        {!loading && query.length < 2 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Escribe al menos 2 caracteres para buscar...
          </div>
        )}

        {/* Usuarios */}
        {results.users.length > 0 && (
          <>
            <CommandGroup heading="Usuarios">
              {results.users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={`user-${user.id}`}
                  onSelect={() => handleSelect(`/patient/${user.id}/profile/${user.id}`)}
                  className="flex items-center gap-3 py-3"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>
                      {user.first_name?.[0]}{user.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {user.role}
                    </p>
                  </div>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Retos */}
        {results.challenges.length > 0 && (
          <>
            <CommandGroup heading="Retos">
              {results.challenges.map((challenge) => (
                <CommandItem
                  key={challenge.id}
                  value={`challenge-${challenge.id}`}
                  onSelect={() => handleSelect(`/challenges/${challenge.id}`)}
                  className="flex items-center gap-3 py-3"
                >
                  <div className="flex-1">
                    <p className="font-medium">{challenge.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {challenge.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {challenge.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Publicaciones */}
        {results.posts.length > 0 && (
          <CommandGroup heading="Publicaciones">
            {results.posts.map((post) => (
              <CommandItem
                key={post.checkin_id}
                value={`post-${post.checkin_id}`}
                onSelect={() => handleSelect(`/feed/post/${post.checkin_id}`)}
                className="flex items-center gap-3 py-3"
              >
                <div className="flex-1">
                  <p className="font-medium">
                    {post.user_first_name} {post.user_last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {post.challenge_title}
                  </p>
                  {post.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                      {post.notes}
                    </p>
                  )}
                </div>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
