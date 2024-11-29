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
import { Location } from "@prisma/client";
import { FiEdit } from "react-icons/fi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { locationTypes } from "@/data";
import { useToast } from "@/hooks";
import { setLocationInfo } from "@/actions";

interface LocationTypeInputProps {
  id: string;
  initialData: Location | null;
}

const getLocationTypeLabel = (value: string) => {
  const locationType = locationTypes.find(
    (type) => type.value.toUpperCase() === value.toUpperCase()
  );
  return locationType ? locationType.label : "Sin especificar";
};

const formSchema = z.object({
  locationType: z.string().min(1, {
    message: "La Tipo de locación es requerido",
  }),
});

export const LocationTypeInput = ({
  id,
  initialData,
}: LocationTypeInputProps) => {
  const { toast } = useToast();
  const [isEditing, setisEditing] = useState(false);
  const [currentData, setCurrentData] = useState(initialData);

  // Obtén el label en español para el tipo de locación actual
  const locationType = currentData?.locationType || "";

  const toggleEdit = () => {
    setisEditing((prev) => !prev);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { locationType },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const validLocationTypes = ["HOUSE", "OFFICE", "BUILDING"];
      const locationType = values.locationType.toUpperCase();

      if (!validLocationTypes.includes(locationType)) {
        throw new Error(
          `Invalid locationType: ${
            values.locationType
          }. Valid types are: ${validLocationTypes.join(", ")}`
        );
      }

      const updatedLocation = await setLocationInfo(id, {
        locationType: locationType as "HOUSE" | "OFFICE" | "BUILDING",
      });

      setCurrentData(updatedLocation);
      toast({
        variant: "success",
        title: "¡Información Actualizada! 🎉",
        description: "Información actualizada exitosamente.",
      });
      toggleEdit();
    } catch (error) {
      console.error(error);
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
            Tipo de locación
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
                    name="locationType"
                    render={({ field }) => (
                      <FormItem className="bg-white w-full">
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona tu tipo de locación" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {locationTypes.map((types) => (
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
                {getLocationTypeLabel(locationType) || "Sin especificar"}
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
