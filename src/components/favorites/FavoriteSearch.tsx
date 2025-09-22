import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, HeartOff } from "lucide-react";

interface FavoriteSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  hasFavorites: boolean;
  onClearAll: () => void;
}

const FavoriteSearch = ({ searchTerm, setSearchTerm, hasFavorites, onClearAll }: FavoriteSearchProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Buscar en Favoritos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nombre, especialidad o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          {hasFavorites && (
            <Button 
              variant="outline" 
              onClick={onClearAll}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <HeartOff className="h-4 w-4 mr-2" />
              Limpiar todo
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FavoriteSearch;
