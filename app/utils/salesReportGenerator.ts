import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import supabase from "@/lib/supabaseClient";

interface Package {
  price: number;
}

interface AddOn {
  id: string;
  name: string;
  price: number;
}

interface OrderAddon {
  quantity: number;
  add_ons: AddOn;
}

interface OrderWithPackage {
  id: string;
  customer_count: number;
  payment_status: string;
  created_at: string;
  terminated_at: string | null;
  packages: Package;
  order_addons: OrderAddon[];
}

interface SalesReportData {
  orders: OrderWithPackage[];
  year: number;
  month?: number;
  day?: number;
}

const generateSalesReport = async (data: SalesReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Company Header
  doc.setFontSize(20);
  doc.text("SALES REPORT", pageWidth / 2, 20, { align: "center" });

  // Report Period
  doc.setFontSize(12);
  let periodText = "";
  if (data.day) {
    periodText = format(
      new Date(data.year, data.month! - 1, data.day),
      "MMMM dd, yyyy"
    );
  } else if (data.month) {
    periodText = format(new Date(data.year, data.month - 1), "MMMM yyyy");
  } else {
    periodText = `Year ${data.year}`;
  }
  doc.text(`Period: ${periodText}`, 20, 30);

  // Summary Section
  const summary = calculateSummary(data.orders);
  doc.setFontSize(14);
  doc.text("Summary", 20, 45);

  const summaryData = [
    ["Total Orders:", summary.totalOrders.toString()],
    ["Total Customers:", summary.totalCustomers.toString()],
    ["Gross Sales:", formatCurrency(summary.grossSales)],
  ];

  autoTable(doc, {
    startY: 50,
    head: [],
    body: summaryData,
    theme: "plain",
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 60 },
    },
  });

  // Detailed Orders Section
  doc.setFontSize(14);
  doc.text("Order Details", 20, doc.lastAutoTable.finalY + 20);

  const orderDetails = data.orders.map((order) => {
    const packageTotal = order.customer_count * (order.packages?.price || 0);
    const addonsTotal = calculateAddonsTotal(order.order_addons);

    return [
      format(new Date(order.created_at), "MM/dd/yyyy HH:mm:ss"), // Added time for daily reports
      order.id,
      order.customer_count.toString(),
      formatCurrency(packageTotal),
      formatCurrency(addonsTotal),
      formatCurrency(packageTotal + addonsTotal),
    ];
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 25,
    head: [
      ["Date & Time", "Order ID", "Customers", "Package", "Add-ons", "Total"],
    ],
    body: orderDetails,
    theme: "striped",
    styles: { fontSize: 8 },
    headStyles: { fillColor: [51, 51, 51] },
  });

  // Add-ons Breakdown
  if (summary.addonsBreakdown.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text("Add-ons Breakdown", 20, 20);

    const addonsData = summary.addonsBreakdown.map((addon) => [
      addon.name,
      addon.quantity.toString(),
      formatCurrency(addon.price),
      formatCurrency(addon.total),
    ]);

    autoTable(doc, {
      startY: 25,
      head: [["Add-on Name", "Quantity", "Unit Price", "Total"]],
      body: addonsData,
      theme: "striped",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [51, 51, 51] },
    });
  }

  // Footer with totals
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.text(
    `Total Revenue: ${formatCurrency(summary.grossSales)}`,
    pageWidth - 20,
    finalY,
    { align: "right" }
  );

  // Add timestamp of report generation
  doc.setFontSize(8);
  doc.text(
    `Report generated on: ${format(new Date(), "MM/dd/yyyy HH:mm:ss")}`,
    pageWidth - 20,
    doc.internal.pageSize.height - 10,
    { align: "right" }
  );

  return doc;
};

const calculateSummary = (orders: OrderWithPackage[]) => {
  const summary = {
    totalOrders: orders.length,
    totalCustomers: 0,
    grossSales: 0,
    averageOrderValue: 0,
    addonsBreakdown: [] as any[],
  };

  const addonsMap = new Map();

  orders.forEach((order) => {
    summary.totalCustomers += order.customer_count;
    const packageTotal = order.customer_count * (order.packages?.price || 0);
    const addonsTotal = calculateAddonsTotal(order.order_addons);
    summary.grossSales += packageTotal + addonsTotal;

    // Track add-ons
    order.order_addons?.forEach((addon) => {
      const key = addon.add_ons.id;
      if (!addonsMap.has(key)) {
        addonsMap.set(key, {
          name: addon.add_ons.name,
          quantity: 0,
          price: addon.add_ons.price,
          total: 0,
        });
      }
      const item = addonsMap.get(key);
      item.quantity += addon.quantity;
      item.total += addon.quantity * addon.add_ons.price;
    });
  });

  summary.averageOrderValue =
    orders.length > 0 ? summary.grossSales / summary.totalOrders : 0;
  summary.addonsBreakdown = Array.from(addonsMap.values());

  return summary;
};

const calculateAddonsTotal = (addons: OrderAddon[]) => {
  return (
    addons?.reduce((sum, addon) => {
      return sum + addon.quantity * (addon.add_ons?.price || 0);
    }, 0) || 0
  );
};

const formatCurrency = (amount: number) => {
  return `P${new Intl.NumberFormat("en-PH", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
};

export const handleDownloadPDF = async (
  year: number,
  month?: number,
  day?: number
) => {
  try {
    let startDate: string;
    let endDate: string;

    if (day) {
      // For daily report
      startDate = `${year}-${month!.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`;
      const nextDay = new Date(year, month! - 1, day + 1);
      endDate = format(nextDay, "yyyy-MM-dd");
    } else if (month) {
      // For monthly report
      startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
      endDate =
        month === 12
          ? `${year + 1}-01-01`
          : `${year}-${(month + 1).toString().padStart(2, "0")}-01`;
    } else {
      // For yearly report
      startDate = `${year}-01-01`;
      endDate = `${year + 1}-01-01`;
    }

    const { data: ordersData, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        customer_count,
        payment_status,
        created_at,
        terminated_at,
        packages (
          id,
          name,
          price
        ),
        order_addons (
          quantity,
          add_ons (
            id,
            name,
            price
          )
        )
      `
      )
      .eq("payment_status", "paid")
      .gte("created_at", startDate)
      .lt("created_at", endDate)
      .order("created_at");

    if (error) throw error;

    const doc = await generateSalesReport({
      orders: ordersData as unknown as OrderWithPackage[],
      year,
      month,
      day,
    });

    // Generate filename based on report type
    const filename = day
      ? `sales-report-${year}-${month!.toString().padStart(2, "0")}-${day
          .toString()
          .padStart(2, "0")}.pdf`
      : month
      ? `sales-report-${year}-${month.toString().padStart(2, "0")}.pdf`
      : `sales-report-${year}.pdf`;

    doc.save(filename);
  } catch (error) {
    console.error("Error generating sales report:", error);
  }
};

export default generateSalesReport;
