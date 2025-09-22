import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Clock, Phone, Heart } from "lucide-react";
import Image from "next/image";

const mockFavorites = [
  {
    id: 1,
    name: "Dr. María García",
    specialty: "Psicología Clínica",
    rating: 4.8,
    reviews: 127,
    location: "Calle Principal 123",
    nextAvailable: "Mañana 10:00 AM",
    phone: "+1 234 567 8900",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
  },
  {
    id: 2,
    name: "Dr. Carlos López",
    specialty: "Terapia Familiar",
    rating: 4.9,
    reviews: 89,
    location: "Avenida Central 456",
    nextAvailable: "Viernes 2:00 PM",
    phone: "+1 234 567 8901",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
  },
  {
    id: 3,
    name: "Dra. Ana Martínez",
    specialty: "Psicoterapia",
    rating: 4.7,
    reviews: 156,
    location: "Plaza Mayor 789",
    nextAvailable: "Lunes 11:00 AM",
    phone: "+1 234 567 8902",
    image: "https://images.unsplash.com/photo-1594824863344-398f4b5c3f23?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
  }
];

const UserFavoritesPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mis Favoritos</h1>
          <p className="text-muted-foreground">Profesionales que has marcado como favoritos</p>
        </div>
        <Button variant="outline">
          <Heart className="h-4 w-4 mr-2" />
          Buscar Profesionales
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estadísticas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Favoritos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">3</div>
            <p className="text-sm text-muted-foreground">profesionales favoritos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Disponibles Ahora</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">2</div>
            <p className="text-sm text-muted-foreground">con disponibilidad</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Promedio Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">4.8</div>
            <p className="text-sm text-muted-foreground">de tus favoritos</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de favoritos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockFavorites.map((professional) => (
          <Card key={professional.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-4">
                <Image
                  src={professional.image}
                  alt={professional.name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <CardTitle className="text-lg">{professional.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{professional.specialty}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{professional.rating}</span>
                    <span className="text-sm text-muted-foreground">({professional.reviews} reseñas)</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{professional.location}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Próxima disponibilidad: {professional.nextAvailable}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{professional.phone}</span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button size="sm" className="flex-1">
                  Agendar Cita
                </Button>
                <Button variant="outline" size="sm">
                  <Heart className="h-4 w-4 text-red-500 fill-current" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserFavoritesPage;