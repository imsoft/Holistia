import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfessionalBioProps {
  name: string;
  bio: string;
}

const ProfessionalBio = ({ name, bio }: ProfessionalBioProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sobre {name.split(' ')[1] || name.split(' ')[0]}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed">{bio}</p>
      </CardContent>
    </Card>
  );
};

export default ProfessionalBio;
