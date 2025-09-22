import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfessionalServicesProps {
  services: string[];
}

const ProfessionalServices = ({ services }: ProfessionalServicesProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Servicios Ofrecidos</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {services.map((service, index) => (
            <li key={index} className="flex items-start gap-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
              <span className="text-muted-foreground">{service}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default ProfessionalServices;
