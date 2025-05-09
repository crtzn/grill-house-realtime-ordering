import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import supabase from "@/lib/supabaseClient";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface DigitalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: number;
  packageName: string;
  customerCount: number;
  orderItems: Array<{
    menu_item_id: string;
    quantity: number;
    status: string;
  }>;
  menuItems: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  orderId: string;
}

const DigitalReceiptModal = ({
  isOpen,
  onClose,
  tableNumber,
  packageName,
  customerCount,
  orderItems,
  menuItems,
  orderId,
}: DigitalReceiptModalProps) => {
  const [packagePrice, setPackagePrice] = useState(0);
  const [orderAddOns, setOrderAddOns] = useState<any[]>([]);
  const [addOns, setAddOns] = useState<any[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPackagePrice = async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("price")
        .eq("name", packageName)
        .single();

      if (error) {
        console.error("Error fetching package price:", error);
      } else {
        setPackagePrice(data.price);
      }
    };

    const fetchOrderAddOns = async () => {
      const { data: orderAddOnsData, error: orderAddOnsError } = await supabase
        .from("order_addons")
        .select("*")
        .eq("order_id", orderId);

      if (orderAddOnsError) {
        console.error("Error fetching order add-ons:", orderAddOnsError);
      } else {
        setOrderAddOns(orderAddOnsData || []);
      }

      const { data: addOnsData, error: addOnsError } = await supabase
        .from("add_ons")
        .select("*");

      if (addOnsError) {
        console.error("Error fetching add-ons:", addOnsError);
      } else {
        setAddOns(addOnsData || []);
      }
    };

    if (isOpen) {
      fetchPackagePrice();
      fetchOrderAddOns();
    }
  }, [isOpen, packageName, orderId]);

  useEffect(() => {
    // Calculate total price: (package price × customer count) + sum of (add-on price × quantity)
    const packageTotal = packagePrice * customerCount;

    // Calculate add-ons total
    const addOnsTotal = orderAddOns.reduce((sum, orderAddOn) => {
      const addOn = addOns.find((a) => a.id === orderAddOn.addon_id);
      if (addOn && orderAddOn.status !== "cancelled") {
        return sum + (addOn.price || 0) * orderAddOn.quantity;
      }
      return sum;
    }, 0);

    setTotalPrice(packageTotal + addOnsTotal);
  }, [packagePrice, customerCount, orderAddOns, addOns]);

  const currentDate = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const downloadReceipt = () => {
    if (receiptRef.current) {
      // Use a small delay to ensure the DOM is fully rendered
      setTimeout(() => {
        html2canvas(receiptRef.current!).then((canvas) => {
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF();
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
          pdf.save("receipt.pdf");
        });
      }, 500); // 500ms delay to ensure the content is fully rendered
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Trigger the download after the modal is fully opened
      downloadReceipt();
    }
  }, [isOpen, downloadReceipt]); // Added downloadReceipt to dependencies

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md mx-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Digital Receipt
          </DialogTitle>
        </DialogHeader>

        <div
          ref={receiptRef}
          className="font-mono text-sm whitespace-pre-wrap bg-white p-6 rounded-lg border border-gray-200"
        >
          <div className="text-center mb-4">
            <h2 className="font-bold text-lg">Seoul Meat</h2>
            <p className="text-sm">123 Main Street, City</p>
            <p className="text-sm">0912345678910</p>
          </div>

          <div className="border-t border-b border-black py-2 my-4">
            <p>Date: {currentDate}</p>
            <p>Table Number: {tableNumber}</p>
            <p>Package: {packageName}</p>
            <p>Number of Customers: {customerCount}</p>
          </div>

          <div className="mt-4">
            <p className="font-bold">Package Details:</p>
            <div className="flex justify-between">
              <span>{formatCurrency(packagePrice * customerCount)}</span>
            </div>
          </div>

          {orderAddOns.length > 0 && (
            <div className="mt-4">
              <p className="font-bold">Add-ons:</p>
              {orderAddOns.map((orderAddOn) => {
                const addOn = addOns.find((a) => a.id === orderAddOn.addon_id);
                if (addOn && orderAddOn.status !== "cancelled") {
                  return (
                    <div key={orderAddOn.id} className="flex justify-between">
                      <span>
                        {addOn.name} ({formatCurrency(addOn.price)} ×{" "}
                        {orderAddOn.quantity})
                      </span>
                      <span>
                        {formatCurrency(addOn.price * orderAddOn.quantity)}
                      </span>
                    </div>
                  );
                }
                return null;
              })}
              <div className="border-t border-gray-200 mt-2 pt-2">
                <div className="flex justify-between">
                  <span className="font-semibold">Add-ons Subtotal:</span>
                  <span>
                    {formatCurrency(
                      orderAddOns.reduce((sum, orderAddOn) => {
                        const addOn = addOns.find(
                          (a) => a.id === orderAddOn.addon_id
                        );
                        if (addOn && orderAddOn.status !== "cancelled") {
                          return sum + addOn.price * orderAddOn.quantity;
                        }
                        return sum;
                      }, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-black pt-2 mt-4">
            <div className="flex justify-between font-bold">
              <span>TOTAL AMOUNT:</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
          </div>
          <div className="text-center mt-6">
            <p>Thank you for dining with us!</p>
            <p>Please show this receipt at the counter. Thank you!</p>
            <p className="mt-4 text-xs">This is your digital receipt.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DigitalReceiptModal;
