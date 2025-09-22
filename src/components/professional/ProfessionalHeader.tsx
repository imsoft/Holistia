import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, LucideIcon } from "lucide-react";
import FavoriteButton from "@/components/shared/FavoriteButton";

interface Professional {
  id: number;
  name: string;
  specialty: string;
  experience: string;
  rating: number;
  totalReviews: number;
  location: string;
  price: string;
  description: string;
  avatar: string;
  badges: string[];
}

interface ProfessionalHeaderProps {
  professional: Professional;
  SpecialtyIcon: LucideIcon;
}

const ProfessionalHeader = ({ professional, SpecialtyIcon }: ProfessionalHeaderProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-6">
          <Avatar className="h-20 w-20 ring-2 ring-primary/20">
            <AvatarImage 
              src={professional.avatar} 
              alt={professional.name}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
              {professional.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-1">{professional.name}</CardTitle>
                    <div className="flex items-center gap-2 mb-3">
                      <SpecialtyIcon className="h-5 w-5 text-primary" />
                      <CardDescription className="text-lg">{professional.specialty}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm">
                      {professional.experience}
                    </Badge>
                    <FavoriteButton professionalId={professional.id} showText={true} />
                  </div>
                </div>
            
            {/* Rating y reseñas */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="ml-1 text-lg font-semibold">{professional.rating}</span>
                <span className="ml-2 text-muted-foreground">({professional.totalReviews} reseñas)</span>
              </div>
            </div>

            {/* Ubicación y precio */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-4 w-4 mr-1" />
                {professional.location}
              </div>
              <span className="text-xl font-bold text-primary">{professional.price}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{professional.description}</p>
        
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {professional.badges.map((badge, index) => (
            <Badge key={index} variant="outline">
              {badge}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfessionalHeader;
