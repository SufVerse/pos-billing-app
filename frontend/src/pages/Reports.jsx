import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { money, fmtDate } from "@/lib/utils-format";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Eye, Users } from "lucide-react";

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const PIE_COLORS = ["#ea580c", "#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6", "#ec4899"];

export default function Reports() {
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(today());
  const [sales, setSales] = useState({ sales: [], summary: { total: 0, count: 0, tax: 0, discount: 0 } });
  const [top, setTop] = useState([]);
  const [slow, setSlow] = useState([]);
  const [stock, setStock] = useState({ products: [], summary: {} });
  const [cashiers, setCashiers] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadAll = async () => {
    const params = { fromDate: from, toDate: to };
    setLoading(true);
    try {
      const [s, t, sl, st, c] = await Promise.all([
        api.get("/reports/sales", { params }),
        api.get("/reports/top-products", { params }),
        api.get("/reports/slow-products", { params }),
        api.get("/reports/stock"),
        api.get("/reports/cashiers", { params }),
      ]);
      setSales(s.data);
      setTop(t.data);
      setSlow(sl.data);
      setStock(st.data);
      setCashiers(c.data);
      toast.success(`Showing ${s.data.summary.count} orders from ${from} to ${to}`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAll(); }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto w-full" data-testid="reports-page">
      <header className="mb-6">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Reports</h1>
        <p className="text-stone-500 mt-1">Insights across sales, inventory, and cashiers.</p>
      </header>

      <Card className="border-stone-200 mb-6">
        <CardContent className="p-4 flex flex-wrap items-end gap-3">
          <div><Label>From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} data-testid="report-from" /></div>
          <div><Label>To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} data-testid="report-to" /></div>
          <Button onClick={loadAll} disabled={loading} className="bg-orange-600 hover:bg-orange-700" data-testid="apply-filters">
            {loading ? "Applying…" : "Apply filters"}
          </Button>
          <span className="text-xs text-stone-500 ml-auto">Filters apply to Sales, Top, Slow & Cashiers tabs</span>
        </CardContent>
      </Card>

      <Tabs defaultValue="sales">
        <TabsList className="mb-4">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="cashiers" data-testid="cashiers-tab">Cashiers</TabsTrigger>
          <TabsTrigger value="top">Top products</TabsTrigger>
          <TabsTrigger value="slow">Slow moving</TabsTrigger>
          <TabsTrigger value="stock">Stock & valuation</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Stat label="Revenue" value={money(sales.summary.total)} />
            <Stat label="Orders" value={sales.summary.count} />
            <Stat label="Tax" value={money(sales.summary.tax)} />
            <Stat label="Discounts" value={money(sales.summary.discount)} />
          </div>
          <Card className="border-stone-200">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200">
                  <th className="py-3 px-6">Invoice</th><th className="py-3 pr-6">Date</th><th className="py-3 pr-6">Cashier</th><th className="py-3 pr-6">Method</th><th className="py-3 pr-6 text-right">Total</th>
                </tr></thead>
                <tbody>
                  {sales.sales.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-stone-500">No sales in this period</td></tr>}
                  {sales.sales.map((s) => (
                    <tr key={s.id} className="border-b border-stone-100"><td className="py-3 px-6 font-mono text-xs">{s.invoiceNumber}</td><td className="py-3 pr-6 text-stone-600">{fmtDate(s.saleDate)}</td><td className="py-3 pr-6 text-stone-600">{s.cashierName}</td><td className="py-3 pr-6 capitalize">{s.paymentMethod}</td><td className="py-3 pr-6 text-right font-semibold tabular-nums">{money(s.grandTotal)}</td></tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashiers">
          {cashiers.length === 0 ? (
            <Card className="border-stone-200"><CardContent className="p-8 text-center text-stone-500">No sales by any cashier in this period</CardContent></Card>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                <Card className="border-stone-200">
                  <CardContent className="p-6">
                    <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2"><Users className="h-4 w-4 text-orange-600" /> Revenue per cashier</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={cashiers}>
                          <CartesianGrid stroke="#f5f5f4" vertical={false} />
                          <XAxis dataKey="cashierName" stroke="#a8a29e" fontSize={11} />
                          <YAxis stroke="#a8a29e" fontSize={11} />
                          <Tooltip formatter={(v) => money(v)} contentStyle={{ borderRadius: 10, border: "1px solid #e7e5e4", fontSize: 12 }} />
                          <Bar dataKey="revenue" fill="#ea580c" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-stone-200">
                  <CardContent className="p-6">
                    <h3 className="font-display text-lg font-bold mb-4">Revenue share</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={cashiers} dataKey="revenue" nameKey="cashierName" outerRadius={90} innerRadius={50} paddingAngle={2}>
                            {cashiers.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v) => money(v)} contentStyle={{ borderRadius: 10, border: "1px solid #e7e5e4", fontSize: 12 }} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-stone-200">
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200">
                      <th className="py-3 px-6">Cashier</th><th className="py-3 pr-6 text-right">Orders</th><th className="py-3 pr-6 text-right">Discount</th><th className="py-3 pr-6 text-right">Tax</th><th className="py-3 pr-6 text-right">Revenue</th><th className="py-3 pr-6"></th>
                    </tr></thead>
                    <tbody>
                      {cashiers.map((c) => (
                        <tr key={c.cashierId} className="border-b border-stone-100 hover:bg-stone-50/70" data-testid={`cashier-row-${c.cashierId}`}>
                          <td className="py-3 px-6 font-semibold">{c.cashierName}</td>
                          <td className="py-3 pr-6 text-right tabular-nums">{c.orders}</td>
                          <td className="py-3 pr-6 text-right tabular-nums text-stone-600">{money(c.discount)}</td>
                          <td className="py-3 pr-6 text-right tabular-nums text-stone-600">{money(c.tax)}</td>
                          <td className="py-3 pr-6 text-right tabular-nums font-display font-bold">{money(c.revenue)}</td>
                          <td className="py-3 pr-6 text-right">
                            <Button size="sm" variant="outline" onClick={() => setDetail(c)} data-testid={`view-cashier-${c.cashierId}`}>
                              <Eye className="h-3 w-3 mr-1" /> Items
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="top">
          <Card className="border-stone-200">
            <CardContent className="p-6">
              <div className="h-72 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top}>
                    <CartesianGrid stroke="#f5f5f4" vertical={false} />
                    <XAxis dataKey="productName" stroke="#a8a29e" fontSize={11} interval={0} angle={-20} textAnchor="end" height={70} />
                    <YAxis stroke="#a8a29e" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="qty" fill="#ea580c" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200"><th className="py-3">Product</th><th className="py-3 text-right">Qty sold</th><th className="py-3 text-right">Revenue</th></tr></thead>
                <tbody>
                  {top.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-stone-500">No data</td></tr>}
                  {top.map((t) => <tr key={t.productId} className="border-b border-stone-100"><td className="py-3 font-semibold">{t.productName}</td><td className="py-3 text-right tabular-nums">{t.qty}</td><td className="py-3 text-right tabular-nums">{money(t.revenue)}</td></tr>)}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slow">
          <Card className="border-stone-200"><CardContent className="p-6">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200"><th className="py-3">Product</th><th className="py-3 text-right">Qty sold</th></tr></thead>
              <tbody>
                {slow.length === 0 && <tr><td colSpan={2} className="py-8 text-center text-stone-500">No data</td></tr>}
                {slow.map((t) => <tr key={t.productId} className="border-b border-stone-100"><td className="py-3 font-semibold">{t.productName}</td><td className="py-3 text-right tabular-nums">{t.qty}</td></tr>)}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="stock">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Stat label="Products" value={stock.summary.totalProducts || 0} />
            <Stat label="Cost valuation" value={money(stock.summary.costValuation)} />
            <Stat label="Selling valuation" value={money(stock.summary.sellingValuation)} />
          </div>
          <Card className="border-stone-200"><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200">
                <th className="py-3 px-6">Product</th><th className="py-3 text-right">Stock</th><th className="py-3 text-right">Cost</th><th className="py-3 pr-6 text-right">Value</th>
              </tr></thead>
              <tbody>
                {stock.products.map((p) => (
                  <tr key={p.id} className="border-b border-stone-100">
                    <td className="py-3 px-6 font-semibold">{p.productName}</td>
                    <td className="py-3 text-right tabular-nums">{p.stockQuantity}</td>
                    <td className="py-3 text-right tabular-nums">{money(p.costPrice)}</td>
                    <td className="py-3 pr-6 text-right tabular-nums font-semibold">{money(p.costPrice * p.stockQuantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">{detail?.cashierName} · items sold</DialogTitle>
            <DialogDescription>
              {detail?.orders} orders · {money(detail?.revenue)} revenue
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white"><tr className="text-left text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200">
                <th className="py-3">Product</th><th className="py-3 text-right">Qty</th><th className="py-3 text-right">Revenue</th>
              </tr></thead>
              <tbody>
                {detail?.products?.map((p) => (
                  <tr key={p.productId} className="border-b border-stone-100">
                    <td className="py-2 font-semibold">{p.productName}</td>
                    <td className="py-2 text-right tabular-nums">{p.qty}</td>
                    <td className="py-2 text-right tabular-nums">{money(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Stat = ({ label, value }) => (
  <Card className="border-stone-200"><CardContent className="p-5">
    <div className="text-xs uppercase tracking-widest font-semibold text-stone-500">{label}</div>
    <div className="font-display text-2xl font-extrabold mt-2 tabular-nums">{value}</div>
  </CardContent></Card>
);
