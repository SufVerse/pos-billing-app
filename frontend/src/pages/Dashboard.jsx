import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { money, fmtDate } from "@/lib/utils-format";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area,
} from "recharts";
import { IndianRupee, ShoppingCart, Package, Users, AlertTriangle, ArrowUpRight } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/stats")
      .then((r) => setStats(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="p-8">
        <div className="text-stone-500">Loading dashboard…</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full" data-testid="admin-dashboard">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-stone-900">Dashboard</h1>
        <p className="text-stone-500 mt-1">Overview of your store performance.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard icon={IndianRupee} label="Today's Sales" value={money(stats.todayTotal)} sub={`${stats.todayCount} orders`} />
        <StatCard icon={ShoppingCart} label="This Month" value={money(stats.monthTotal)} sub={`${stats.monthCount} orders`} accent />
        <StatCard icon={Package} label="Active Products" value={stats.productsCount} />
        <StatCard icon={Users} label="Cashiers" value={stats.cashiersCount} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 border-stone-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display text-lg font-bold">Last 7 days</h3>
                <p className="text-xs text-stone-500 mt-1">Daily revenue trend</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chart}>
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ea580c" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#ea580c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f5f5f4" vertical={false} />
                  <XAxis dataKey="date" stroke="#a8a29e" fontSize={11} />
                  <YAxis stroke="#a8a29e" fontSize={11} />
                  <Tooltip formatter={(v) => money(v)} contentStyle={{ borderRadius: 10, border: "1px solid #e7e5e4", fontSize: 12 }} />
                  <Area type="monotone" dataKey="total" stroke="#ea580c" strokeWidth={2} fill="url(#g)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Low stock
              </h3>
              <Badge variant="outline" className="text-xs">{stats.lowStock.length}</Badge>
            </div>
            <div className="space-y-3 max-h-72 overflow-y-auto" data-testid="low-stock-list">
              {stats.lowStock.length === 0 && (
                <p className="text-sm text-stone-500">All products are well stocked.</p>
              )}
              {stats.lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm py-2 border-b border-stone-100 last:border-0">
                  <div className="truncate pr-3">
                    <div className="font-medium text-stone-900 truncate">{p.productName}</div>
                    <div className="text-xs text-stone-500">min: {p.minimumStockLevel}</div>
                  </div>
                  <div className="font-display font-bold tabular-nums text-amber-600">{p.stockQuantity}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-stone-200 mt-5">
        <CardContent className="p-6">
          <h3 className="font-display text-lg font-bold mb-5">Recent Sales</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200">
                  <th className="py-3 pr-4 font-semibold">Invoice</th>
                  <th className="py-3 pr-4 font-semibold">Date</th>
                  <th className="py-3 pr-4 font-semibold">Cashier</th>
                  <th className="py-3 pr-4 font-semibold">Method</th>
                  <th className="py-3 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentSales.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-stone-500">No sales yet.</td></tr>
                )}
                {stats.recentSales.map((s) => (
                  <tr key={s.id} className="border-b border-stone-100 hover:bg-stone-50/70">
                    <td className="py-3 pr-4 font-mono text-xs text-stone-700">{s.invoiceNumber}</td>
                    <td className="py-3 pr-4 text-stone-600">{fmtDate(s.saleDate)}</td>
                    <td className="py-3 pr-4 text-stone-700">{s.cashierName}</td>
                    <td className="py-3 pr-4 capitalize">
                      <Badge variant="outline" className="bg-stone-50 capitalize">{s.paymentMethod}</Badge>
                    </td>
                    <td className="py-3 text-right font-display font-bold tabular-nums">{money(s.grandTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <Card className={`border-stone-200 transition-all hover:-translate-y-[2px] hover:shadow-sm ${accent ? "bg-orange-600 text-white border-orange-600" : ""}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={`text-xs uppercase tracking-widest font-semibold ${accent ? "text-orange-100" : "text-stone-500"}`}>
            {label}
          </div>
          <div className={`h-9 w-9 rounded-xl grid place-items-center ${accent ? "bg-white/15" : "bg-stone-100"}`}>
            <Icon className={`h-4 w-4 ${accent ? "text-white" : "text-stone-700"}`} />
          </div>
        </div>
        <div className="mt-4 font-display text-3xl font-extrabold tabular-nums tracking-tight">
          {value}
        </div>
        {sub && (
          <div className={`mt-1 text-xs flex items-center gap-1 ${accent ? "text-orange-100" : "text-stone-500"}`}>
            <ArrowUpRight className="h-3 w-3" />
            {sub}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
