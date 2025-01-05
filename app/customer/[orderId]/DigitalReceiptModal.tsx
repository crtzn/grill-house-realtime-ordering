import { X } from "lucide-react";

type ReceiptItem = {
  name: string;
  quantity: number;
  price: number;
};

type DigitalReceiptModalProps = {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: number;
  items: ReceiptItem[];
  total: number;
};

export function DigitalReceiptModal({
  isOpen,
  onClose,
  tableNumber,
  items,
  total,
}: DigitalReceiptModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Digital Receipt</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-4">
          <div className="mb-4">
            <p className="font-bold">Table Number: {tableNumber}</p>
            <p className="text-sm text-gray-600">
              Date: {new Date().toLocaleString()}
            </p>
          </div>
          <div className="mb-4">
            <h3 className="font-bold mb-2">Order Details:</h3>
            {items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>
                  {item.name} x{item.quantity}
                </span>
                <span>₱{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>₱{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="p-4 border-t">
          <p className="text-center text-sm text-gray-600">
            Thank you for your order!
          </p>
        </div>
      </div>
    </div>
  );
}
