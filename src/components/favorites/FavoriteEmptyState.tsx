import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

interface FavoriteEmptyStateProps {
  hasSearchTerm: boolean;
}

const FavoriteEmptyState = ({ hasSearchTerm }: FavoriteEmptyStateProps) => {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {hasSearchTerm ? 'No se encontraron favoritos' : 'No tienes favoritos aún'}
        </h3>
        <p className="text-muted-foreground mb-4">
          {hasSearchTerm 
            ? 'Intenta con otros términos de búsqueda.'
            : 'Explora profesionales y marca tus favoritos para verlos aquí.'
          }
        </p>
        {!hasSearchTerm && (
          <Button asChild>
            <Link href="/my-space">
              <Heart className="h-4 w-4 mr-2" />
              Explorar Profesionales
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default FavoriteEmptyState;
