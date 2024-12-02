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
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Location } from "@prisma/client";
import { FiEdit } from "react-icons/fi";
import { useToast } from "@/hooks";
import { setLocationInfo } from "@/actions";

interface NeighborhoodInputProps {
  id: string;
  initialData: Location | null;
}

const formSchema = z.object({
  neighborhood: z.string().min(1, {
    message: "La Colonia es requerida",
  }),
});

export const NeighborhoodInput = ({
  id,
  initialData,
}: NeighborhoodInputProps) => {
  const { toast } = useToast();
  const [isEditing, setisEditing] = useState(false);
  const [currentData, setCurrentData] = useState(initialData);

  const neighborhood = currentData?.neighborhood || "";

  const toggleEdit = () => {
    setisEditing((prev) => !prev);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { neighborhood },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const updatedContact = await setLocationInfo(id, values);
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
            Colonia
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
                    name="neighborhood"
                    render={({ field }) => (
                      <FormItem className="bg-white w-full">
                        <FormControl>
                          <Input
                            disabled={isSubmitting}
                            className="w-full border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-primary focus:border-primary"
                            autoFocus
                            placeholder=""
                            {...field}
                          />
                        </FormControl>
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
              <div className="text-gray-900">{neighborhood}</div>
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
