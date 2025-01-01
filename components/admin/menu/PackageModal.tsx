import React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";

type Package = {
  id: string;
  name: string;
  description: string;
  price: number;
  is_available: boolean;
};

type PackageModalProps = {
  packages: Package[]; // Pass the packages data as a prop
  onEdit: (pkg: Package) => void; // Function to handle editing
  onDelete: (id: string) => void; // Function to handle deletion
};

const PackageModal: React.FC<PackageModalProps> = ({
  packages,
  onEdit,
  onDelete,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Manage Packages</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Packages</DialogTitle>
            <DialogDescription>
              View, edit, or delete existing packages. Changes will be applied
              immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="border-b p-2">Name</th>
                  <th className="border-b p-2">Description</th>
                  <th className="border-b p-2">Price</th>
                  <th className="border-b p-2">Status</th>
                  <th className="border-b p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr key={pkg.id}>
                    <td className="p-2">{pkg.name}</td>
                    <td className="p-2">{pkg.description}</td>
                    <td className="p-2">₱{pkg.price.toFixed(2)}</td>
                    <td className="p-2">
                      {pkg.is_available ? "Available" : "Unavailable"}
                    </td>
                    <td className="p-2 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mr-2"
                        onClick={() => onEdit(pkg)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(pkg.id)}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PackageModal;
