import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { money, fmtDate } from "@/lib/utils-format";
import { ArrowLeft, Eye, Printer } from "lucide-react";
import Receipt from "@/components/Receipt";

export default function SalesHistory() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const { user } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    api.get("/sales", { params: { mine: user?.role === "cashier" } }).then((r) => setList(r.data));
  }, [user]);

  const view = async (id) => {
    const r = await api.get(`/sales/${id}`);
    setDetail(r.data);
    setOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="h-14 bg-white border-b border-stone-200 flex items-center px-4 gap-3">
        <Button variant="ghost" size="sm" onClick={() => nav(user?.role === "admin" ? "/dashboard" : "/billing")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="font-display font-bold">Sales History</h1>
      </header>
      <div className="p-8 max-w-7xl mx-auto" data-testid="sales-history-page">
        <Card className="border-stone-200">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200">
                <th className="py-3 px-6">Invoice</th><th className="py-3 pr-6">Date</th><th className="py-3 pr-6">Cashier</th><th className="py-3 pr-6">Method</th><th className="py-3 pr-6">Status</th><th className="py-3 pr-6 text-right">Total</th><th className="py-3 px-6"></th>
              </tr></thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-stone-500">No sales yet</td></tr>}
                {list.map((s) => (
                  <tr key={s.id} className="border-b border-stone-100 hover:bg-stone-50/70">
                    <td className="py-3 px-6 font-mono text-xs">{s.invoiceNumber}</td>
                    <td className="py-3 pr-6 text-stone-600">{fmtDate(s.saleDate)}</td>
                    <td className="py-3 pr-6 text-stone-600">{s.cashierName}</td>
                    <td className="py-3 pr-6 capitalize">{s.paymentMethod}</td>
                    <td className="py-3 pr-6"><Badge className={s.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}>{s.status}</Badge></td>
                    <td className="py-3 pr-6 text-right font-semibold tabular-nums">{money(s.grandTotal)}</td>
                    <td className="py-3 px-6"><Button size="sm" variant="outline" onClick={() => view(s.id)} data-testid={`view-sale-${s.id}`}><Eye className="h-3 w-3 mr-1" /> View</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="font-display">Receipt</DialogTitle>
            <DialogDescription>Past invoice details and items.</DialogDescription>
          </DialogHeader>
          <Receipt data={detail} />
          <DialogFooter className="px-6 pb-6">
            <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" /> Print</Button>
            <Button onClick={() => setOpen(false)} className="bg-orange-600 hover:bg-orange-700">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
