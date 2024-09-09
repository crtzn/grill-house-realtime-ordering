import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "./ui/button";

type Props = {};

function OrderTable({}: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Device</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>View Order</TableHead>
          <TableHead>Items</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>D#01</TableCell>
          <TableCell>7:30 PM</TableCell>
          <TableCell>
            <Button>View Order</Button>
          </TableCell>
          <TableCell>3</TableCell>
          <TableCell>Pending</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

export default OrderTable;
