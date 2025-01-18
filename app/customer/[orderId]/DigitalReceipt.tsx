import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DigitalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: number;
  packageName: string;
  customerCount: number;
  totalPrice: number;
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
}

const DigitalReceiptModal = ({
  isOpen,
  onClose,
  tableNumber,
  packageName,
  customerCount,
  totalPrice,
  orderItems,
  menuItems,
}: DigitalReceiptModalProps) => {
  const currentDate = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const getItemName = (menuItemId: string) => {
    const menuItem = menuItems.find((item) => item.id === menuItemId);
    return menuItem?.name || "Unknown Item";
  };

  // Calculate subtotal for each item
  const calculateSubtotal = (quantity: number, price: number) => {
    return quantity * price;
  };

  // Format number to currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Digital Receipt
          </DialogTitle>
        </DialogHeader>

        <div className="font-mono text-sm whitespace-pre-wrap bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-center mb-4">
            <h2 className="font-bold text-lg">SAMGYUP RESTAURANT</h2>
            <p className="text-sm">123 Main Street, City</p>
            <p className="text-sm">Tel: (123) 456-7890</p>
          </div>

          <div className="border-t border-b border-black py-2 my-4">
            <p>Date: {currentDate}</p>
            <p>Table Number: {tableNumber}</p>
            <p>Package: {packageName}</p>
            <p>Number of Customers: {customerCount}</p>
          </div>

          <div className="my-4">
            <p className="font-bold">ORDER DETAILS:</p>
            <div className="mt-2">
              {orderItems.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span>
                    {getItemName(item.menu_item_id)} x{item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-black pt-2 mt-4">
            <div className="flex justify-between font-bold">
              <span>TOTAL AMOUNT:</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
          </div>

          <div className="text-center mt-6">
            <p>Thank you for dining with us!</p>
            <p>Please come again.</p>
            <p className="mt-4 text-xs">This is your digital receipt</p>
          </div>
        </div>

        <div className="flex justify-between mt-4">
          <Button
            onClick={() => window.print()}
            className="bg-green-500 hover:bg-green-600"
          >
            Print Receipt
          </Button>
          <Button onClick={onClose} className="bg-gray-500 hover:bg-gray-600">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DigitalReceiptModal;
