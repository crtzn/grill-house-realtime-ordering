"use client";

import * as React from "react";
import { Minus, Plus, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import supabase from "@/lib/supabaseClient";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function NewOrderDialog() {
  const [selectedTable, setSelectedTable] = React.useState("");
  const [quantity, setQuantity] = React.useState(1);
  const [selectedPrice, setSelectedPrice] = React.useState<number | null>(null);
  const [qrCodeData, setQrCodeData] = React.useState("");
  const [showQR, setShowQR] = React.useState(false);
  const [availableTables, setAvailableTables] = React.useState<number[]>([]);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>New Customer</Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-white max-w-md">
        <AlertDialogHeader>
          <div className="flex w-full justify-between items-center">
            <AlertDialogTitle>New Order</AlertDialogTitle>
            <AlertDialogCancel className="h-10 w-10 p-0 border-none bg-red-500">
              <X className="h-4 w-4" />
            </AlertDialogCancel>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {!showQR ? (
            <>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Available Table" />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.map((table) => (
                    <SelectItem key={table} value={table.toString()}>
                      Table {table}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center justify-between border rounded-md p-2">
                <Button variant="outline" size="icon" disabled={quantity <= 1}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-medium">Quantity: {quantity}</span>
                <Button variant="outline" size="icon" disabled={quantity >= 5}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[199, 299, 399, 599].map((price) => (
                  <Button
                    key={price}
                    variant={selectedPrice === price ? "default" : "outline"}
                    onClick={() => setSelectedPrice(price)}
                    className="w-full"
                  >
                    ₱{price}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-4 flex flex-col items-center">
              <QRCodeSVG value={qrCodeData} size={200} />
              <p className="text-sm text-gray-500">
                Scan this QR code to access the order
              </p>
              <div className="text-left w-full">
                <p>Table: {selectedTable}</p>
                <p>Quantity: {quantity}</p>
                <p>Price: ₱{selectedPrice}</p>
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          {!showQR ? (
            <AlertDialogAction
              className="bg-green-500 hover:bg-green-600 w-full"
              disabled={!selectedTable || !selectedPrice}
            >
              Generate QR Code
            </AlertDialogAction>
          ) : (
            <AlertDialogAction className="bg-blue-500 hover:bg-blue-600 w-full">
              Create New Order
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
