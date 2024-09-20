import { Button } from "../ui/button";
import { useState } from "react";

interface NewOrderBtnProps {
  price: number;
}

const newOrderBtn: React.FC<NewOrderBtnProps> = ({ price }) => {
  const [available, setAvailable] = useState(false);
  const handleClick = () => {
    // Handle button click logic here
  };

  return (
    <div className="flex gap-4 justify-center">
      return (
      <div className="flex gap-4 justify-center">
        <Button disabled={price <= 0} onClick={handleClick}>
          {price > 0 ? "Place Order" : "Price Unavailable"}
        </Button>
      </div>
      );
    </div>
  );
};

export default newOrderBtn;
