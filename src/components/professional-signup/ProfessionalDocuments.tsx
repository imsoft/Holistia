import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  User,
  Shield,
  GraduationCap,
  CreditCard,
  FileImage
} from "lucide-react";

interface FormData {
  profilePhoto: File | null;
  licenseDocument: File | null;
  degreeDocument: File | null;
  idDocument: File | null;
  cvDocument: File | null;
  [key: string]: unknown;
}

interface ProfessionalDocumentsProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  errors: Record<string, string>;
}

const documentTypes = [
  {
    key: "profilePhoto",
    title: "Foto de Perfil",
    description: "Una foto profesional tuya",
    icon: User,
    required: true,
    acceptedTypes: "image/*",
    maxSize: "5MB"
  },
  {
    key: "licenseDocument",
    title: "Licencia Profesional",
    description: "Cédula profesional o licencia vigente",
    icon: Shield,
    required: true,
    acceptedTypes: ".pdf,.jpg,.jpeg,.png",
    maxSize: "10MB"
  },
  {
    key: "degreeDocument",
    title: "Título Profesional",
    description: "Título o diploma de tu carrera",
    icon: GraduationCap,
    required: false,
    acceptedTypes: ".pdf,.jpg,.jpeg,.png",
    maxSize: "10MB"
  },
  {
    key: "idDocument",
    title: "Identificación Oficial",
    description: "INE, pasaporte o cédula de identidad",
    icon: CreditCard,
    required: true,
    acceptedTypes: ".pdf,.jpg,.jpeg,.png",
    maxSize: "10MB"
  },
  {
    key: "cvDocument",
    title: "Currículum Vitae",
    description: "CV actualizado con tu experiencia",
    icon: FileText,
    required: false,
    acceptedTypes: ".pdf,.doc,.docx",
    maxSize: "10MB"
  }
];

const ProfessionalDocuments = ({ formData, setFormData, errors }: ProfessionalDocumentsProps) => {
  const handleFileUpload = (field: string, file: File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const handleFileChange = (field: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    handleFileUpload(field, file);
  };

  const removeFile = (field: string) => {
    handleFileUpload(field, null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileStatus = (field: string) => {
    const file = formData[field];
    if (!file) return { status: "empty", icon: Upload, color: "text-muted-foreground" };
    if (errors[field]) return { status: "error", icon: AlertCircle, color: "text-red-500" };
    return { status: "success", icon: CheckCircle, color: "text-green-500" };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos Requeridos
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Sube los documentos necesarios para verificar tu perfil profesional
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {documentTypes.map((doc) => {
            const Icon = doc.icon;
            const file = formData[doc.key] as File | null;
            const fileStatus = getFileStatus(doc.key);
            const StatusIcon = fileStatus.icon;
            
            return (
              <div key={doc.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-medium flex items-center gap-2">
                        {doc.title}
                        {doc.required && <Badge variant="destructive" className="text-xs">Requerido</Badge>}
                      </h3>
                      <p className="text-sm text-muted-foreground">{doc.description}</p>
                    </div>
                  </div>
                  <StatusIcon className={`h-5 w-5 ${fileStatus.color}`} />
                </div>

                {!file ? (
                  <div className="border-2 border-dashed border-border rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Arrastra tu archivo aquí o haz clic para seleccionar
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <label htmlFor={doc.key} className="cursor-pointer">
                          <Upload className="h-4 w-4 mr-2" />
                          Seleccionar Archivo
                        </label>
                      </Button>
                      <input
                        id={doc.key}
                        type="file"
                        accept={doc.acceptedTypes}
                        onChange={(e) => handleFileChange(doc.key, e)}
                        className="hidden"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Formatos: {doc.acceptedTypes} • Máximo: {doc.maxSize}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileImage className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{file?.name || 'Archivo'}</p>
                          <p className="text-sm text-muted-foreground">
                            {file?.size ? formatFileSize(file.size) : 'Tamaño desconocido'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-4 w-4 ${fileStatus.color}`} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(doc.key)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {errors[doc.key] && (
                  <p className="text-sm text-red-500 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {errors[doc.key]}
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-2">
                Información Importante
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Todos los documentos deben estar legibles y actualizados</li>
                <li>• Las imágenes deben tener buena calidad y resolución</li>
                <li>• Los PDFs no deben estar protegidos por contraseña</li>
                <li>• El proceso de verificación puede tomar de 2 a 5 días hábiles</li>
                <li>• Te contactaremos si necesitamos documentación adicional</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-900 mb-2">
                Próximos Pasos
              </h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Revisaremos tu solicitud en 24-48 horas</li>
                <li>• Te enviaremos un email de confirmación</li>
                <li>• Nuestro equipo verificará tus credenciales</li>
                <li>• Una vez aprobado, podrás comenzar a recibir pacientes</li>
                <li>• Te proporcionaremos acceso a tu panel de control</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessionalDocuments;
