interface DigitalReceiptProps {
  tableNumber: number;
  packageName: string;
  customerCount: number;
  totalPrice: number;
}

export const generateDigitalReceipt = ({
  tableNumber,
  packageName,
  customerCount,
  totalPrice,
}: DigitalReceiptProps): string => {
  const currentDate = new Date().toLocaleString();

  return `
===================================
DIGITAL RECEIPT
===================================
Date: ${currentDate}

Table Number: ${tableNumber}
Package: ${packageName}
Customer Count: ${customerCount}

-----------------------------------
Total Price: PHP ${totalPrice.toFixed(2)}
===================================

Thank you for your order!
Please come again.
`;
};
