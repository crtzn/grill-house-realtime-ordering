import React from "react";
import { CardContent } from "./Gallery";

function GetOrder() {
  return (
    <div>
      <div>
        <CardContent>
          <div className="flex">
            <div>Order Name</div>
            <div> Plus and Minus</div>
          </div>
        </CardContent>
      </div>
    </div>
  );
}

export default GetOrder;
