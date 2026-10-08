import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { money } from "@/lib/utils-format";
import {
  Search, Plus, Minus, Trash2, Printer, Download, LogOut, History, ScanLine,
  ShoppingBag, X, ArrowLeft, Store,
} from "lucide-react";
import Receipt from "@/components/Receipt";

export default function Billing() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const searchRef = useRef(null);

  const load = (q) => {
    api.get("/products", { params: { q, activeOnly: true, limit: 100 } })
      .then((r) => setProducts(r.data))
      .catch(() => {});
  };

  useEffect(() => { load(""); searchRef.current?.focus(); }, []);

  useEffect(() => {
    const t = setTimeout(() => load(query.trim()), 200);
    return () => clearTimeout(t);
  }, [query]);

  const addToCart = (p) => {
    setCart((c) => {
      const existing = c.find((i) => i.productId === p.id);
      if (existing) {
        if (existing.quantity + 1 > p.stockQuantity) {
          toast.error(`Only ${p.stockQuantity} in stock`);
          return c;
        }
        return c.map((i) => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      if (p.stockQuantity < 1) {
        toast.error("Out of stock");
        return c;
      }
      return [...c, {
        productId: p.id,
        productName: p.productName,
        unitPrice: p.sellingPrice,
        taxPercentage: p.taxPercentage,
        stock: p.stockQuantity,
        quantity: 1,
        discountAmount: 0,
      }];
    });
  };

  const updateQty = (id, delta) => {
    setCart((c) => c.map((i) => {
      if (i.productId !== id) return i;
      const q = i.quantity + delta;
      if (q < 1) return i;
      if (q > i.stock) { toast.error("Stock limit"); return i; }
      return { ...i, quantity: q };
    }));
  };

  const setLineDiscount = (id, val) => {
    setCart((c) => c.map((i) => i.productId === id ? { ...i, discountAmount: Math.max(0, Number(val) || 0) } : i));
  };

  const removeLine = (id) => setCart((c) => c.filter((i) => i.productId !== id));

  // Barcode/enter handling
  const onSearchKey = (e) => {
    if (e.key === "Enter" && query.trim()) {
      const match = products.find(
        (p) => p.barcode === query.trim() || p.sku?.toLowerCase() === query.trim().toLowerCase()
      );
      if (match) {
        addToCart(match);
        setQuery("");
        searchRef.current?.focus();
      } else if (products.length === 1) {
        addToCart(products[0]);
        setQuery("");
      }
    }
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    cart.forEach((i) => {
      const lineSubtotal = Math.max(0, i.unitPrice * i.quantity - (i.discountAmount || 0));
      subtotal += i.unitPrice * i.quantity;
      tax += lineSubtotal * (i.taxPercentage || 0) / 100;
    });
    const lineDiscounts = cart.reduce((s, i) => s + (i.discountAmount || 0), 0);
    const grand = Math.max(0, subtotal - lineDiscounts - Number(discount || 0) + tax);
    return {
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      lineDiscounts: lineDiscounts.toFixed(2),
      grand: grand.toFixed(2),
    };
  }, [cart, discount]);

  const completeSale = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    setLoading(true);
    try {
      const res = await api.post("/sales", {
        customerName: customer,
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, discountAmount: i.discountAmount || 0 })),
        discountAmount: Number(discount) || 0,
        paymentMethod,
      });
      setReceipt(res.data);
      setShowReceipt(true);
      setCart([]); setDiscount(0); setCustomer("");
      load("");
      toast.success("Sale completed");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Sale failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => { await logout(); nav("/login", { replace: true }); };

  return (
    <div className="h-screen flex flex-col bg-stone-50" data-testid="billing-screen">
      {/* Topbar */}
      <header className="h-14 bg-white border-b border-stone-200 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          {user?.role === "admin" && (
            <Button variant="ghost" size="sm" onClick={() => nav("/dashboard")} data-testid="back-to-admin">
              <ArrowLeft className="h-4 w-4 mr-1" /> Admin
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-orange-600" />
            <span className="font-display font-bold">Sunrise POS</span>
            <Badge variant="outline" className="ml-2 capitalize">{user?.role}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => nav("/sales-history")} data-testid="sales-history-link">
            <History className="h-4 w-4 mr-1" /> History
          </Button>
          <span className="text-sm text-stone-600 hidden md:inline">{user?.fullName}</span>
          <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="billing-logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
        {/* LEFT: search + product grid */}
        <div className="lg:col-span-8 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-stone-200 bg-white">
            <div className="relative">
              <ScanLine className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <Input
                ref={searchRef}
                data-testid="product-search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onSearchKey}
                placeholder="Scan barcode or search by name / SKU…"
                className="pl-12 h-14 text-base border-stone-300 focus-visible:ring-orange-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4" data-testid="product-grid">
            {products.length === 0 ? (
              <div className="text-center text-stone-500 py-16">No products found</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {products.map((p) => {
                  const low = p.stockQuantity <= p.minimumStockLevel;
                  const out = p.stockQuantity <= 0;
                  return (
                    <button
                      key={p.id}
                      data-testid={`product-card-${p.id}`}
                      disabled={out}
                      onClick={() => addToCart(p)}
                      className={`text-left p-4 rounded-xl border border-stone-200 bg-white transition-all hover:-translate-y-[2px] hover:shadow-sm active:scale-[0.98] ${
                        out ? "opacity-50 cursor-not-allowed" : "hover:border-orange-300"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-xs uppercase tracking-wider text-stone-400 font-semibold">
                          {p.sku || "—"}
                        </div>
                        {low && !out && <span className="text-[10px] uppercase tracking-wider text-amber-600 font-semibold">Low</span>}
                        {out && <span className="text-[10px] uppercase tracking-wider text-red-600 font-semibold">Out</span>}
                      </div>
                      <div className="font-semibold text-stone-900 leading-tight mb-2 line-clamp-2 min-h-[2.5rem]">
                        {p.productName}
                      </div>
                      <div className="flex items-end justify-between">
                        <div className="font-display text-lg font-bold tabular-nums text-stone-900">{money(p.sellingPrice)}</div>
                        <div className="text-xs text-stone-500 tabular-nums">{p.stockQuantity} left</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: cart */}
        <aside className="lg:col-span-4 bg-white border-l border-stone-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-stone-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-orange-600" />
                <h3 className="font-display font-bold">Current Order</h3>
                <Badge variant="outline" className="text-xs">{cart.length}</Badge>
              </div>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setCart([])} data-testid="clear-cart">
                  Clear
                </Button>
              )}
            </div>
            <Input
              placeholder="Customer name (optional)"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="mt-3"
              data-testid="customer-name-input"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="cart-list">
            {cart.length === 0 && (
              <div className="text-center text-stone-400 py-16 text-sm">
                Tap a product to add it to the cart
              </div>
            )}
            {cart.map((i) => (
              <div key={i.productId} className="p-3 rounded-lg border border-stone-200 bg-stone-50 animate-fadein" data-testid={`cart-item-${i.productId}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="font-semibold text-sm leading-tight">{i.productName}</div>
                  <button onClick={() => removeLine(i.productId)} className="text-stone-400 hover:text-red-600" data-testid={`remove-${i.productId}`}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQty(i.productId, -1)} data-testid={`qty-minus-${i.productId}`}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="font-display font-bold tabular-nums w-8 text-center">{i.quantity}</span>
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQty(i.productId, 1)} data-testid={`qty-plus-${i.productId}`}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="font-display font-bold tabular-nums">
                    {money(i.unitPrice * i.quantity)}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-stone-500 uppercase tracking-wider">Discount</span>
                  <Input
                    type="number"
                    value={i.discountAmount}
                    onChange={(e) => setLineDiscount(i.productId, e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-stone-200 p-4 space-y-3 bg-white">
            <Row label="Subtotal" value={money(totals.subtotal)} />
            <Row label="Line discounts" value={`- ${money(totals.lineDiscounts)}`} />
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-600">Order discount</span>
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="h-8 w-24 text-right"
                data-testid="order-discount-input"
              />
            </div>
            <Row label="Tax" value={money(totals.tax)} />
            <div className="flex items-center justify-between pt-2 border-t border-stone-200">
              <span className="font-display text-lg font-bold">Total</span>
              <span className="font-display text-2xl font-extrabold tabular-nums" data-testid="cart-total">{money(totals.grand)}</span>
            </div>

            <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="cash" data-testid="pay-cash">Cash</TabsTrigger>
                <TabsTrigger value="card" data-testid="pay-card">Card</TabsTrigger>
                <TabsTrigger value="upi" data-testid="pay-upi">UPI</TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-base font-bold tracking-tight transition-all active:scale-[0.98]"
              disabled={loading || cart.length === 0}
              onClick={completeSale}
              data-testid="complete-sale-button"
            >
              {loading ? "Processing…" : `Complete Sale · ${money(totals.grand)}`}
            </Button>
          </div>
        </aside>
      </div>

      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="font-display">Receipt</DialogTitle>
            <DialogDescription>Sale complete. Print or download a receipt for the customer.</DialogDescription>
          </DialogHeader>
          <Receipt data={receipt} />
          <DialogFooter className="px-6 pb-6 gap-2">
            <Button variant="outline" onClick={() => window.print()} data-testid="print-receipt">
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
            <Button variant="outline" onClick={() => downloadPdf(receipt)} data-testid="download-receipt">
              <Download className="h-4 w-4 mr-2" /> PDF
            </Button>
            <Button onClick={() => setShowReceipt(false)} className="bg-orange-600 hover:bg-orange-700">
              New Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-stone-600">{label}</span>
    <span className="tabular-nums font-medium">{value}</span>
  </div>
);

async function downloadPdf(data) {
  if (!data) return;
  const { sale, items, store } = data;
  const win = window.open("", "_blank", "width=400,height=720");
  if (!win) return;
  const rows = items.map(i => `
    <tr>
      <td>${i.productName}<br><span style="color:#888;font-size:10px">${i.quantity} × ${i.unitPrice}</span></td>
      <td style="text-align:right;font-family:monospace">${i.totalAmount.toFixed(2)}</td>
    </tr>`).join("");
  win.document.write(`<!DOCTYPE html><html><head><title>${sale.invoiceNumber}</title>
    <style>
      body{font-family:-apple-system,sans-serif;width:280px;padding:12px;color:#222}
      h2{margin:0;text-align:center}
      table{width:100%;border-collapse:collapse;margin-top:12px;font-size:12px}
      td{padding:6px 0;border-bottom:1px dashed #ccc;vertical-align:top}
      .totals td{border:none;padding:2px 0}
      .grand{font-size:16px;font-weight:bold;border-top:2px solid #000;padding-top:6px}
    </style></head><body>
    <h2>${store.storeName || "Receipt"}</h2>
    <p style="text-align:center;margin:4px 0;font-size:11px;color:#666">${store.storeAddress || ""}</p>
    <hr>
    <p style="font-size:11px;margin:4px 0"><b>Invoice:</b> ${sale.invoiceNumber}<br>
    <b>Date:</b> ${new Date(sale.saleDate).toLocaleString()}<br>
    <b>Cashier:</b> ${sale.cashierName}</p>
    <table>${rows}</table>
    <table class="totals" style="margin-top:8px">
      <tr><td>Subtotal</td><td style="text-align:right">${sale.subtotal.toFixed(2)}</td></tr>
      <tr><td>Discount</td><td style="text-align:right">-${sale.discountAmount.toFixed(2)}</td></tr>
      <tr><td>Tax</td><td style="text-align:right">${sale.taxAmount.toFixed(2)}</td></tr>
      <tr class="grand"><td>Total</td><td style="text-align:right">₹ ${sale.grandTotal.toFixed(2)}</td></tr>
      <tr><td colspan="2" style="padding-top:10px;text-transform:uppercase;font-size:11px">${sale.paymentMethod}</td></tr>
    </table>
    <p style="text-align:center;font-size:11px;color:#666;margin-top:16px">${store.receiptFooter || ""}</p>
    <script>window.onload=()=>{window.print();}</script>
    </body></html>`);
  win.document.close();
}
