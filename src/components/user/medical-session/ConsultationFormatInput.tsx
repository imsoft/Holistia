"use client";

import { z } from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProfessionalSessionDetail } from "@prisma/client";
import { FiEdit } from "react-icons/fi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { consultationFormats } from "@/data";
import { useToast } from "@/hooks";
import { setProfessionalSessionDetailInfo } from "@/actions";

interface ConsultationFormatInputProps {
  id: string;
  initialData: ProfessionalSessionDetail | null;
}

const getConsultationFormatLabel = (value: string) => {
  const format = consultationFormats.find((f) => f.value === value);
  return format ? format.label : value;
};

const formSchema = z.object({
  consultationFormat: z.enum(["IN_PERSON", "ONLINE", "BOTH"], {
    invalid_type_error: "Formato de consulta inválido",
  }),
});

export const ConsultationFormatInput = ({
  id,
  initialData,
}: ConsultationFormatInputProps) => {
  const { toast } = useToast();
  const [isEditing, setisEditing] = useState(false);
  const [currentData, setCurrentData] = useState(initialData);

  const consultationFormat = currentData?.consultationFormat || undefined;

  const toggleEdit = () => {
    setisEditing((prev) => !prev);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      consultationFormat,
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Enviar el valor directamente al backend
      const updatedContact = await setProfessionalSessionDetailInfo(id, values);
      setCurrentData(updatedContact);
      toast({
        variant: "success",
        title: "¡Información Actualizada! 🎉",
        description: "Información actualizada exitosamente.",
      });
      toggleEdit();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Algo salió mal.",
        description: "Por favor intenta de nuevo.",
      });
      console.log(error);
    }
  };

  return (
    <>
      <dl className="mt-6 space-y-6 divide-y divide-gray-100 border-t border-gray-200 text-sm leading-6">
        <div className="pt-6 sm:flex">
          <dt className="font-medium flex items-center text-gray-900 sm:w-64 sm:flex-none sm:pr-6">
            Formato de la consulta
          </dt>
          <dd className="mt-1 flex justify-between items-center gap-x-6 sm:mt-0 sm:flex-auto">
            {isEditing ? (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="flex items-center w-full"
                >
                  <FormField
                    control={form.control}
                    name="consultationFormat"
                    render={({ field }) => (
                      <FormItem className="bg-white w-full">
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona tu formato de consulta" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {consultationFormats.map((format) => (
                              <SelectItem
                                key={format.value}
                                value={format.value}
                              >
                                {format.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2 ml-4">
                    <Button
                      type="submit"
                      disabled={!isValid || isSubmitting}
                      variant={"accept"}
                    >
                      Aceptar
                    </Button>
                    <Button
                      type="button"
                      variant={"outline"}
                      onClick={toggleEdit}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="text-gray-900">
                {getConsultationFormatLabel(consultationFormat || "") ||
                  "Sin especificar"}
              </div>
            )}

            {!isEditing && (
              <Button className="gap-2 text-white" type="button" onClick={toggleEdit}>
                <FiEdit />
                Editar
              </Button>
            )}
          </dd>
        </div>
      </dl>
    </>
  );
};
