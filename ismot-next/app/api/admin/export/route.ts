import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listOrders } from "@/lib/orders";

/**
 * GET /api/admin/export — the administrator-only spreadsheet.
 *
 * This is the "Excel integration" the shop actually has: a real .xlsx workbook
 * generated from the order database on demand. No Microsoft/OneDrive
 * credentials are configured, so nothing here pretends to append rows to a live
 * hosted workbook.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const orders = await listOrders(10000);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Ismot Hair Oil";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Orders", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Order ID", key: "orderRef", width: 18 },
    { header: "Customer Name", key: "customerName", width: 26 },
    { header: "Phone Number", key: "phone", width: 18 },
    { header: "Delivery Address", key: "address", width: 52 },
    { header: "Product", key: "product", width: 20 },
    { header: "Size", key: "size", width: 10 },
    { header: "Quantity", key: "quantity", width: 10 },
    { header: "Order Date", key: "createdAt", width: 22 },
    { header: "Status", key: "status", width: 14 },
  ];

  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF24421C" },
  };
  sheet.getRow(1).alignment = { vertical: "middle" };
  sheet.getRow(1).height = 22;

  for (const order of orders) {
    const row = sheet.addRow({
      orderRef: `#${order.orderRef}`,
      customerName: order.customerName,
      phone: order.phone,
      address: order.address,
      product: order.product,
      size: order.size,
      quantity: order.quantity,
      createdAt: new Date(order.createdAt),
      status: order.status,
    });

    row.getCell("createdAt").numFmt = "dd mmm yyyy hh:mm";
    row.getCell("address").alignment = { wrapText: true, vertical: "top" };
  }

  sheet.autoFilter = { from: "A1", to: "I1" };

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `ismot-orders-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(new Uint8Array(buffer as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, private",
    },
  });
}
