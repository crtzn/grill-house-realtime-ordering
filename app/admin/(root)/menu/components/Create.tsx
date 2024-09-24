import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import InputForm from "@/components/menu/components/InputForm";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

const Create = ({}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("https://placehold.co/600x400");
  const [fetchError, setFetchError] = useState(null);
  const [item, setNewItem] = useState("");

  return (
    <>
      <div className="trigger-section">
        <Dialog>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>{}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label
                  htmlFor="picture"
                  className="flex flex-col justify-center items-center cursor-pointer h-auto border-2 border-dashed border-black rounded-lg p-4"
                >
                  {newItem.imageSrc ? (
                    <img
                      src={newItem.imageSrc}
                      alt={newItem.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      <p>Add picture</p>
                    </>
                  )}
                </Label>
                <Input
                  id="picture"
                  type="file"
                  className="hidden"
                  // onChange={handleImageUpload}
                />
              </div>
              <InputForm
                label="Name"
                id="name"
                name="name"
                value={editingItem ? editingItem.name : newItem.name}
                onChange={handleInputChange}
              />
              {fetchError && (
                <p className="text-red-500">Error: {fetchError}</p>
              )}
              <InputForm
                id="description"
                label="Description"
                name="description"
                value={
                  editingItem ? editingItem.description : newItem.description
                }
                onChange={handleInputChange}
              />
              <Button onClick={handleAddMenuItem}>
                Add Item
                {/* {editingItem ? "Update Items" : "Add Item"} */}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Create;
