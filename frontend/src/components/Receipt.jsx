import { money, fmtDate } from "@/lib/utils-format";

export default function Receipt({ data }) {
  if (!data) return null;
  const { sale, items, store } = data;
  return (
    <div id="print-receipt" className="px-6 pb-2 text-sm">
      <div className="text-center mb-3">
        <div className="font-display text-xl font-extrabold">{store?.storeName || "Receipt"}</div>
        {store?.storeAddress && <div className="text-xs text-stone-500">{store.storeAddress}</div>}
        {store?.mobileNumber && <div className="text-xs text-stone-500">{store.mobileNumber}</div>}
        {store?.gstNumber && <div className="text-xs text-stone-500">GST: {store.gstNumber}</div>}
      </div>
      <div className="border-t border-dashed border-stone-300 pt-2 text-xs space-y-0.5">
        <div className="flex justify-between"><span>Invoice:</span><span className="font-mono">{sale.invoiceNumber}</span></div>
        <div className="flex justify-between"><span>Date:</span><span>{fmtDate(sale.saleDate)}</span></div>
        <div className="flex justify-between"><span>Cashier:</span><span>{sale.cashierName}</span></div>
        {sale.customerName && (<div className="flex justify-between"><span>Customer:</span><span>{sale.customerName}</span></div>)}
      </div>
      <table className="w-full mt-3 text-xs">
        <thead>
          <tr className="border-y border-dashed border-stone-300">
            <th className="text-left py-1">Item</th>
            <th className="text-right py-1">Qty</th>
            <th className="text-right py-1">Amt</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id} className="align-top">
              <td className="py-1.5">
                <div>{i.productName}</div>
                <div className="text-stone-500">{money(i.unitPrice)} × {i.quantity}</div>
              </td>
              <td className="text-right tabular-nums">{i.quantity}</td>
              <td className="text-right tabular-nums">{money(i.totalAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-dashed border-stone-300 mt-2 pt-2 space-y-1 text-xs">
        <Row label="Subtotal" value={money(sale.subtotal)} />
        <Row label="Discount" value={`- ${money(sale.discountAmount)}`} />
        <Row label="Tax" value={money(sale.taxAmount)} />
        <div className="flex justify-between font-display font-bold text-base pt-1 border-t border-stone-400">
          <span>Total</span>
          <span className="tabular-nums">{money(sale.grandTotal)}</span>
        </div>
        <div className="text-xs uppercase tracking-wider pt-2">Paid by {sale.paymentMethod}</div>
      </div>
      {store?.receiptFooter && (
        <div className="text-center text-xs text-stone-500 mt-3 pt-3 border-t border-dashed border-stone-300">
          {store.receiptFooter}
        </div>
      )}
    </div>
  );
}

const Row = ({ label, value }) => (
  <div className="flex justify-between">
    <span>{label}</span><span className="tabular-nums">{value}</span>
  </div>
);
