import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Clock, Calendar, LucideIcon } from "lucide-react";
import FavoriteButton from "@/components/shared/FavoriteButton";

interface Professional {
  id: number;
  name: string;
  specialty: string;
  rating: number;
  totalReviews: number;
  location: string;
  price: string;
  availability: string;
  description: string;
  avatar: string;
  badges: string[];
}

interface FavoriteCardProps {
  professional: Professional;
  getSpecialtyIcon: (specialty: string) => LucideIcon;
}

const FavoriteCard = ({ professional, getSpecialtyIcon }: FavoriteCardProps) => {
  const SpecialtyIcon = getSpecialtyIcon(professional.specialty);

  return (
    <Link href={`/professional/${professional.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                <AvatarImage 
                  src={professional.avatar} 
                  alt={professional.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {professional.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{professional.name}</CardTitle>
                <div className="flex items-center gap-1">
                  <SpecialtyIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{professional.specialty}</span>
                </div>
              </div>
            </div>
            <FavoriteButton professionalId={professional.id} />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{professional.description}</p>
          
          {/* Rating */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="ml-1 text-sm font-medium">{professional.rating}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              ({professional.totalReviews} reseñas)
            </span>
          </div>

          {/* Ubicación y precio */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              {professional.location}
            </div>
            <span className="font-semibold text-primary">{professional.price}</span>
          </div>

          {/* Disponibilidad */}
          <div className="flex items-center text-sm text-green-600">
            <Clock className="h-4 w-4 mr-1" />
            {professional.availability}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1">
            {professional.badges.slice(0, 3).map((badge, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {badge}
              </Badge>
            ))}
          </div>

          {/* Botón de acción */}
          <div className="pt-2">
            <Button size="sm" className="w-full">
              <Calendar className="h-4 w-4 mr-2" />
              Ver Perfil
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default FavoriteCard;
