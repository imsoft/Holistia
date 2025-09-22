import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, Star } from "lucide-react";

interface ProfessionalLocationProps {
  name: string;
  location: string;
  coordinates: { lat: number; lng: number };
  rating: number;
  totalReviews: number;
}

const ProfessionalLocation = ({ name, location, coordinates, rating, totalReviews }: ProfessionalLocationProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Ubicación
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{location}</span>
          </div>
          <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
            <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.lng-0.01},${coordinates.lat-0.01},${coordinates.lng+0.01},${coordinates.lat+0.01}&layer=mapnik&marker=${coordinates.lat},${coordinates.lng}`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Ubicación de ${name}`}
            />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Respuesta en 2-4 horas</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Star className="h-4 w-4" />
            <span className="text-sm">{rating}/5.0 ({totalReviews} reseñas)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfessionalLocation;
