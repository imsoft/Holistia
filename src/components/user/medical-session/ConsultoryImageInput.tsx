"use client";

import { z } from "zod";
import axios from "axios";
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
import { Input } from "@/components/ui/input";
import { ProfessionalSessionDetail } from "@prisma/client";
import { FiEdit } from "react-icons/fi";
import { ImagesIcon, Trash2 } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks";
import { deleteImage, updateImage } from "@/actions";

interface ConsultoryImageInputProps {
  id: string;
  initialData: ProfessionalSessionDetail | null;
}

// Cloudinary configuration
const cloudinaryUrl = `https://api.cloudinary.com/v1_1/dwibt7nyu/image/upload`;
const uploadPreset = "kkylqqdn";

const formSchema = z.object({
  consultoryImages: z.array(z.string()).max(3, {
    message: "Puedes subir hasta 3 imágenes",
  }),
});

export const ConsultoryImageInput = ({
  id,
  initialData,
}: ConsultoryImageInputProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>(
    initialData?.consultoryImages ? initialData.consultoryImages : []
  );
  const [images, setImages] = useState<File[]>([]);

  const toggleEdit = () => {
    setIsEditing((prev) => !prev);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { consultoryImages: imagePreviews },
  });

  const { isSubmitting, isValid } = form.formState;

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    if (fileArray.length + images.length > 3) {
      toast({
        variant: "destructive",
        title: "Uh oh! Algo salio mal.",
        description: "Puedes subir hasta 3 imágenes",
      });
      return;
    }

    setImages((prevImages) => [...prevImages, ...fileArray]);
    const previewUrls = fileArray.map((file) => URL.createObjectURL(file));
    setImagePreviews((prevPreviews) => [...prevPreviews, ...previewUrls]);
  };

  // const extractPublicIdFromUrl = (url: string) => {
  //   const parts = url.split("/");
  //   const publicIdWithFormat = parts[parts.length - 1];
  //   const publicId = publicIdWithFormat.split(".")[0];
  //   return publicId;
  // };

  const handleDeleteImage = async (imageUrl: string) => {
    try {
      const updatedSession = await deleteImage(id, imageUrl); // Llama al servidor
      setImagePreviews(updatedSession.consultoryImages); // Actualiza las imágenes locales

      toast({
        variant: "success",
        title: "¡Imagen eliminada! 🎉",
        description: "Imagen eliminada exitosamente.",
      });
    } catch (error) {
      console.error("Error al eliminar la imagen:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Algo salió mal.",
        description: "Por favor intenta de nuevo.",
      });
      console.log(error);
    }
  };

  const uploadImageToCloudinary = async (file: File, userId: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    // Definir el 'public_id' para que cada usuario tenga su carpeta
    const publicId = `${userId}/${file.name.split(".")[0]}`; // Carpeta basada en el ID del usuario
    formData.append("public_id", publicId);

    try {
      const response = await axios.post(cloudinaryUrl, formData, {
        params: {
          folder: `users/${userId}`, // Intentar con este parámetro de carpeta
        },
      });
      return response.data.secure_url;
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      throw error;
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      console.log(values);
      // Subir nuevas imágenes a Cloudinary
      const uploadedUrls = await Promise.all(
        images.map((file) => uploadImageToCloudinary(file, id))
      );

      // Combina las imágenes existentes con las nuevas
      const allImages = [...imagePreviews, ...uploadedUrls];

      // Actualizar en el servidor
      const updatedSession = await updateImage(id, allImages);
      setImagePreviews(updatedSession.consultoryImages); // Actualiza localmente

      toast({
        variant: "success",
        title: "¡Información Actualizada! 🎉",
        description: "Imágenes actualizadas exitosamente.",
      });
      toggleEdit();
    } catch (error) {
      console.error("Error al actualizar imágenes:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Algo salió mal.",
        description: "Por favor intenta de nuevo.",
      });
    }
  };

  return (
    <>
      <dl className="mt-6 space-y-6 divide-y divide-gray-100 border-t border-gray-200 text-sm leading-6">
        <div className="pt-6 sm:flex">
          <dt className="font-medium flex items-center text-gray-900 sm:w-64 sm:flex-none sm:pr-6">
            Imagen del consultorio
          </dt>
          <dd className="mt-1 flex justify-between items-center gap-x-6 sm:mt-0 sm:flex-auto">
            {isEditing ? (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="flex flex-col w-full gap-4"
                >
                  <div className="flex w-full">
                    <div className="mt-2 flex justify-center w-full rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                      <div className="text-center w-full">
                        <ImagesIcon
                          aria-hidden="true"
                          className="mx-auto h-12 w-12 text-gray-300"
                        />
                        <div className="mt-4 flex text-sm leading-6 w-full text-gray-600">
                          <FormField
                            control={form.control}
                            name="consultoryImages"
                            render={() => (
                              <FormItem className="bg-white w-full text-center">
                                <FormControl>
                                  <label
                                    htmlFor="file-upload"
                                    className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500"
                                  >
                                    <span>Subir imagenes</span>
                                    <Input
                                      id="file-upload"
                                      name="file-upload"
                                      type="file"
                                      className="sr-only" // Oculta el input real
                                      accept="image/*"
                                      multiple
                                      onChange={onImageChange}
                                      disabled={
                                        isSubmitting ||
                                        imagePreviews.length >= 3
                                      }
                                    />
                                  </label>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <p className="text-xs leading-5 text-gray-600">
                          Puedes subir hasta 3 imagenes en PNG, JPG de un tamaño
                          limite de 10MB
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-2">
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
                  </div>

                  {/* <FormField
                    control={form.control}
                    name="consultoryImages"
                    render={() => (
                      <FormItem className="bg-white w-full">
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={onImageChange}
                            disabled={isSubmitting || imagePreviews.length >= 3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  /> */}

                  <div className="flex flex-wrap gap-4">
                    {imagePreviews.map((image, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={image}
                          alt={`Preview ${index}`}
                          className="h-24 w-24 object-cover rounded-md border"
                          width={96}
                          height={96}
                        />
                        {/* Botón para eliminar la imagen */}
                        <button
                          onClick={() => handleDeleteImage(image)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </form>
              </Form>
            ) : (
              <div className="text-gray-900">
                {imagePreviews.length > 0 ? (
                  <div className="flex gap-4">
                    {imagePreviews.map((img, idx) => (
                      <Image
                        key={idx}
                        src={img}
                        alt="Consultory"
                        className="h-24 w-24 object-cover rounded-md"
                        width={96}
                        height={96}
                      />
                    ))}
                  </div>
                ) : (
                  "No has subido ninguna imagen"
                )}
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
