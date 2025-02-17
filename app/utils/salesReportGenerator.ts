import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import supabase from "@/lib/supabaseClient";
import { startOfDay, endOfDay, format } from "date-fns";

interface Package {
  id: string;
  name: string;
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
  customStartDate?: Date;
  customEndDate?: Date;
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

  if (data.customStartDate && data.customEndDate) {
    // For both custom date range and weekly reports
    periodText = `${format(data.customStartDate, "MMM d, yyyy")} - ${format(
      data.customEndDate,
      "MMM d, yyyy"
    )}`;
  } else if (data.day) {
    // For daily report
    periodText = format(
      new Date(data.year!, data.month! - 1, data.day),
      "MMMM dd, yyyy"
    );
  } else if (data.month) {
    // For monthly report
    periodText = format(new Date(data.year!, data.month - 1), "MMMM yyyy");
  } else {
    // For yearly report
    periodText = `Year ${data.year}`;
  }

  doc.text(`Period: ${periodText}`, 20, 30);

  // Summary Section
  const summary = calculateSummary(data.orders);
  doc.setFontSize(14);
  doc.text("Summary", 20, 45);

  const summaryData = [
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

  // Package Details Section
  doc.setFontSize(14);
  doc.text("Package Details", 20, doc.lastAutoTable.finalY + 20);

  const packageSummary = calculatePackageSummary(data.orders);
  const packageData = packageSummary.map((pkg) => [
    pkg.name,
    pkg.quantity.toString(),
    formatCurrency(pkg.price),
    formatCurrency(pkg.total),
  ]);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 25,
    head: [["Package Name", "Quantity", "Unit Price", "Total"]],
    body: packageData,
    theme: "striped",
    styles: { fontSize: 8 },
    headStyles: { fillColor: [51, 51, 51] },
  });

  // Detailed Orders Section
  doc.setFontSize(14);
  doc.text("Order Details", 20, doc.lastAutoTable.finalY + 20);

  const orderDetails = data.orders.map((order) => {
    const packageTotal = order.customer_count * (order.packages?.price || 0);
    const addonsTotal = calculateAddonsTotal(order.order_addons);

    return [
      format(new Date(order.created_at), "MM/dd/yyyy HH:mm:ss"),
      order.id,
      order.packages.name,
      order.customer_count.toString(),
      formatCurrency(packageTotal),
      formatCurrency(addonsTotal),
      formatCurrency(packageTotal + addonsTotal),
    ];
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 25,
    head: [
      [
        "Date & Time",
        "Order ID",
        "Package",
        "Customers",
        "Package Total",
        "Add-ons Total",
        "Total",
      ],
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
    orders.length > 0 ? summary.grossSales / orders.length : 0;
  summary.addonsBreakdown = Array.from(addonsMap.values());

  return summary;
};

const calculatePackageSummary = (orders: OrderWithPackage[]) => {
  const packageMap = new Map();

  orders.forEach((order) => {
    const key = order.packages.id;
    if (!packageMap.has(key)) {
      packageMap.set(key, {
        name: order.packages.name,
        quantity: 0,
        price: order.packages.price,
        total: 0,
      });
    }
    const item = packageMap.get(key);
    item.quantity += order.customer_count;
    item.total += order.customer_count * order.packages.price;
  });

  return Array.from(packageMap.values());
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
  year?: number,
  month?: number,
  day?: number,
  customStartDate?: Date,
  customEndDate?: Date
) => {
  try {
    let startDate: string;
    let endDate: string;

    if (customStartDate && customEndDate) {
      // For both custom date range and weekly reports
      startDate = startOfDay(customStartDate).toISOString();
      endDate = endOfDay(customEndDate).toISOString();
    } else if (day) {
      // For daily report
      if (!month) throw new Error("Month is required for daily reports.");
      startDate = startOfDay(new Date(year!, month - 1, day)).toISOString();
      endDate = endOfDay(new Date(year!, month - 1, day)).toISOString();
    } else if (month) {
      // For monthly report
      startDate = startOfDay(new Date(year!, month - 1, 1)).toISOString();
      endDate = endOfDay(new Date(year!, month, 0)).toISOString();
    } else if (year) {
      // For yearly report
      startDate = startOfDay(new Date(year, 0, 1)).toISOString();
      endDate = endOfDay(new Date(year, 11, 31)).toISOString();
    } else {
      throw new Error("Invalid date parameters");
    }

    console.log("Fetching data for date range:", { startDate, endDate });

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
      .lte("created_at", endDate)
      .order("created_at");

    if (error) throw error;

    console.log("Orders data fetched:", ordersData);

    const doc = await generateSalesReport({
      orders: ordersData as unknown as OrderWithPackage[],
      year: year || new Date().getFullYear(),
      month,
      day,
      customStartDate,
      customEndDate,
    });

    // Generate filename based on report type
    let filename;
    if (customStartDate && customEndDate) {
      filename = `sales-report-${format(
        customStartDate,
        "yyyy-MM-dd"
      )}-to-${format(customEndDate, "yyyy-MM-dd")}.pdf`;
    } else if (day) {
      filename = `sales-report-${year}-${month!
        .toString()
        .padStart(2, "0")}-${day.toString().padStart(2, "0")}.pdf`;
    } else if (month) {
      filename = `sales-report-${year}-${month
        .toString()
        .padStart(2, "0")}.pdf`;
    } else {
      filename = `sales-report-${year}.pdf`;
    }

    doc.save(filename);
  } catch (error) {
    console.error("Error generating sales report:", error);
  }
};

export default generateSalesReport;
