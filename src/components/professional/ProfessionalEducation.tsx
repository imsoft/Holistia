import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfessionalEducationProps {
  education: string[];
}

const ProfessionalEducation = ({ education }: ProfessionalEducationProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Formación Académica</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {education.map((edu, index) => (
            <li key={index} className="flex items-start gap-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
              <span className="text-muted-foreground">{edu}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default ProfessionalEducation;
