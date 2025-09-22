import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, Star } from "lucide-react";

interface Professional {
  id: number;
  name: string;
  specialty: string;
  rating: number;
}

interface FavoriteStatsProps {
  favoriteProfessionals: Professional[];
}

const FavoriteStats = ({ favoriteProfessionals }: FavoriteStatsProps) => {
  const totalFavorites = favoriteProfessionals.length;
  const totalSpecialties = [...new Set(favoriteProfessionals.map(p => p.specialty))].length;
  const averageRating = favoriteProfessionals.length > 0 
    ? (favoriteProfessionals.reduce((sum, p) => sum + p.rating, 0) / favoriteProfessionals.length).toFixed(1)
    : "0.0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-full">
              <Heart className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalFavorites}</p>
              <p className="text-sm text-muted-foreground">Profesionales favoritos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalSpecialties}</p>
              <p className="text-sm text-muted-foreground">Especialidades</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Star className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{averageRating}</p>
              <p className="text-sm text-muted-foreground">Rating promedio</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FavoriteStats;
