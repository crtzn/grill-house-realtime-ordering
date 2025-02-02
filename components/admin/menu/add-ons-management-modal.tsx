import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import supabase from "@/lib/supabaseClient";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Image from "next/image";

interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.string().min(1, "Price is required"),
  is_available: z.boolean().default(true),
});

const EditAddOnModal = ({
  addOn,
  isOpen,
  onClose,
  onUpdate,
}: {
  addOn: AddOn | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (values: any, imageUrl: string) => Promise<void>;
}) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: addOn?.name || "",
      description: addOn?.description || "",
      price: addOn?.price.toString() || "",
      is_available: addOn?.is_available || true,
    },
  });

  useEffect(() => {
    if (addOn) {
      form.reset({
        name: addOn.name,
        description: addOn.description,
        price: addOn.price.toString(),
        is_available: addOn.is_available,
      });
    }
  }, [addOn, form]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      let imageUrl = addOn?.image_url || "";

      if (selectedImage) {
        const fileExt = selectedImage.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("menu-images")
          .upload(filePath, selectedImage);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("menu-images")
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      await onUpdate(values, imageUrl);
      onClose();
      form.reset();
      setSelectedImage(null);
    } catch (error) {
      console.error("Error updating add-on:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Edit Add-on</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_available"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Available</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <FormLabel>Image</FormLabel>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Add-on"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default function AddOnsManagementModal() {
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [editingAddOn, setEditingAddOn] = useState<AddOn | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      is_available: true,
    },
  });

  useEffect(() => {
    fetchAddOns();

    const subscription = supabase
      .channel("add_ons_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "add_ons",
        },
        () => {
          fetchAddOns();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchAddOns = async () => {
    try {
      const { data, error } = await supabase
        .from("add_ons")
        .select("*")
        .order("name");

      if (error) throw error;
      setAddOns(data || []);
    } catch (error) {
      console.error("Error fetching add-ons:", error);
      toast({
        title: "Error",
        description: "Failed to fetch add-ons. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("menu-images")
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from("menu-images")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      let imageUrl = "";

      if (selectedImage) {
        imageUrl = await handleImageUpload(selectedImage);
      }

      const addOnData = {
        name: values.name,
        description: values.description,
        price: parseFloat(values.price),
        is_available: values.is_available,
        image_url: imageUrl,
      };

      const { data, error } = await supabase
        .from("add_ons")
        .insert([addOnData])
        .select();

      if (error) throw error;

      if (data) {
        setAddOns((prev) => [...prev, data[0]]);
      }

      toast({
        title: "Success",
        description: "Add-on created successfully",
      });

      form.reset();
      setSelectedImage(null);
    } catch (error) {
      console.error("Error saving add-on:", error);
      toast({
        title: "Error",
        description: "Failed to save add-on. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (
    values: z.infer<typeof formSchema>,
    imageUrl: string
  ) => {
    if (!editingAddOn) return;

    try {
      const addOnData = {
        name: values.name,
        description: values.description,
        price: parseFloat(values.price),
        is_available: values.is_available,
        image_url: imageUrl || editingAddOn.image_url,
      };

      const { error } = await supabase
        .from("add_ons")
        .update(addOnData)
        .eq("id", editingAddOn.id);

      if (error) throw error;

      setAddOns((prev) =>
        prev.map((addOn) =>
          addOn.id === editingAddOn.id ? { ...addOn, ...addOnData } : addOn
        )
      );

      toast({
        title: "Success",
        description: "Add-on updated successfully",
      });
    } catch (error) {
      console.error("Error updating add-on:", error);
      toast({
        title: "Error",
        description: "Failed to update add-on. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("add_ons").delete().eq("id", id);

      if (error) throw error;

      setAddOns((prev) => prev.filter((addOn) => addOn.id !== id));

      toast({
        title: "Success",
        description: "Add-on deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting add-on:", error);
      toast({
        title: "Error",
        description: "Failed to delete add-on. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (addOn: AddOn) => {
    setEditingAddOn(addOn);
    setIsEditModalOpen(true);
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="bg-black hover:bg-gray-800 text-white py-7 px-5 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Ons
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Add-ons Management</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-[40rem]">
            <div>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl className="">
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_available"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Available</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <FormLabel>Image</FormLabel>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setSelectedImage(e.target.files?.[0] || null)
                      }
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-black hover:bg-gray-800 text-white py-5 px-5 rounded-xl w-full"
                  >
                    {isLoading ? "Saving..." : "Add"}
                  </Button>
                </form>
              </Form>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Current Add-ons</h3>
              <div className="overflow-y-auto max-h-[60vh] w-[30rem]">
                <table className=" divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase</th> tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray</th>-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {addOns.map((addOn) => (
                      <tr key={addOn.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {addOn.name}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₱{addOn.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              addOn.is_available
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {addOn.is_available ? "Available" : "Not Available"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(addOn)}
                            className="mr-2 bg-black hover:bg-gray-800 text-white hover:text-white"
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(addOn.id)}
                            className="bg-red-500 hover:bg-red-600 "
                          >
                            <Trash2 className="w-4 h-4 mr-2 " />
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <EditAddOnModal
        addOn={editingAddOn}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingAddOn(null);
        }}
        onUpdate={handleUpdate}
      />
    </>
  );
}
