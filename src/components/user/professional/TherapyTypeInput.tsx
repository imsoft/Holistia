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
import { FiEdit } from "react-icons/fi";
import { Professional } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { therapyTypes } from "@/data";
import { useToast } from "@/hooks";
import { setProfessionalInfo } from "@/actions";

interface TherapyTypeInputProps {
  id: string;
  initialData: Professional;
}

const getTherapyTypeLabel = (value: string) => {
  const therapyType = therapyTypes.find((type) => type.value === value);
  return therapyType ? therapyType.label : value;
};

const formSchema = z.object({
  therapyType: z.string().min(1, {
    message: "El Tipo de terapía es requerida",
  }),
});

export const TherapyTypeInput = ({
  id,
  initialData,
}: TherapyTypeInputProps) => {
  const { toast } = useToast();
  const [isEditing, setisEditing] = useState(false);
  const [currentData, setCurrentData] = useState(initialData);

  const therapyType = currentData?.therapyType || "";

  const toggleEdit = () => {
    setisEditing((prev) => !prev);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { therapyType },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Convertir el valor de therapyType al formato esperado por el enum
      const validTherapyTypes = ["TRADITIONAL", "ALTERNATIVE", "BOTH"];
      const therapyType = values.therapyType.toUpperCase();

      if (!validTherapyTypes.includes(therapyType)) {
        throw new Error(
          `Invalid therapyType: ${
            values.therapyType
          }. Valid types are: ${validTherapyTypes.join(", ")}`
        );
      }

      // Llamar a setProfessionalInfo con el tipo convertido
      const updatedProfessional = await setProfessionalInfo(id, {
        therapyType: therapyType as "TRADITIONAL" | "ALTERNATIVE" | "BOTH",
      });

      setCurrentData(updatedProfessional);
      toast({
        variant: "success",
        title: "¡Información Actualizada! 🎉",
        description: "Información actualizada exitosamente.",
      });
      toggleEdit();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Algo salio mal.",
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
            Tipo de terapía
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
                    name="therapyType"
                    render={({ field }) => (
                      <FormItem className="bg-white w-full">
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona tu tipo de terapía" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {therapyTypes.map((types) => (
                              <SelectItem key={types.value} value={types.value}>
                                {types.label}
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
                {getTherapyTypeLabel(therapyType || "")}
              </div>
            )}

            {!isEditing && (
              <Button className="gap-2" type="button" onClick={toggleEdit}>
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
