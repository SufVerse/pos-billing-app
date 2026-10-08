import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, ArrowDownUp } from "lucide-react";
import { toast } from "sonner";
import { fmtDate } from "@/lib/utils-format";

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [moves, setMoves] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ productId: "", movementType: "inward", quantity: 0, reason: "" });

  const load = () => {
    api.get("/products", { params: { limit: 1000 } }).then((r) => setProducts(r.data));
    api.get("/stock-movements", { params: { limit: 500 } }).then((r) => setMoves(r.data));
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.productId) return toast.error("Pick a product");
    try {
      await api.post("/stock-movements", { ...form, quantity: Number(form.quantity) });
      toast.success("Stock updated"); setOpen(false); load();
      setForm({ productId: "", movementType: "inward", quantity: 0, reason: "" });
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  const lowStock = products.filter((p) => p.stockQuantity <= p.minimumStockLevel);

  return (
    <div className="p-8 max-w-7xl mx-auto w-full" data-testid="inventory-page">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">Inventory</h1>
          <p className="text-stone-500 mt-1">Track stock movements and adjustments.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-orange-600 hover:bg-orange-700" data-testid="add-stock-movement">
          <ArrowDownUp className="h-4 w-4 mr-2" /> New movement
        </Button>
      </header>

      <Tabs defaultValue="movements">
        <TabsList className="mb-6">
          <TabsTrigger value="movements">Movements</TabsTrigger>
          <TabsTrigger value="stock">Current Stock</TabsTrigger>
          <TabsTrigger value="low">Low Stock ({lowStock.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="movements">
          <Card className="border-stone-200">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200">
                    <th className="py-3 px-6 font-semibold">Date</th>
                    <th className="py-3 pr-6 font-semibold">Product</th>
                    <th className="py-3 pr-6 font-semibold">Type</th>
                    <th className="py-3 pr-6 font-semibold text-right">Qty</th>
                    <th className="py-3 pr-6 font-semibold text-right">Prev → New</th>
                    <th className="py-3 pr-6 font-semibold">Reason</th>
                    <th className="py-3 pr-6 font-semibold">By</th>
                  </tr>
                </thead>
                <tbody>
                  {moves.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-stone-500">No stock movements yet</td></tr>}
                  {moves.map((m) => (
                    <tr key={m.id} className="border-b border-stone-100 hover:bg-stone-50/70">
                      <td className="py-3 px-6 text-stone-600">{fmtDate(m.createdAt)}</td>
                      <td className="py-3 pr-6 font-semibold">{m.productName}</td>
                      <td className="py-3 pr-6"><Badge variant="outline" className="capitalize bg-stone-50">{m.movementType}</Badge></td>
                      <td className="py-3 pr-6 text-right tabular-nums font-semibold">{m.quantity}</td>
                      <td className="py-3 pr-6 text-right tabular-nums text-stone-500">{m.previousStock} → {m.newStock}</td>
                      <td className="py-3 pr-6 text-stone-600">{m.reason}</td>
                      <td className="py-3 pr-6 text-stone-600">{m.createdByName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock">
          <Card className="border-stone-200">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200">
                  <th className="py-3 px-6">Product</th><th className="py-3 text-right">Stock</th><th className="py-3 text-right">Min</th><th className="py-3 pr-6 text-right">Status</th>
                </tr></thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-b border-stone-100">
                      <td className="py-3 px-6 font-semibold">{p.productName}</td>
                      <td className="py-3 text-right tabular-nums">{p.stockQuantity}</td>
                      <td className="py-3 text-right tabular-nums text-stone-500">{p.minimumStockLevel}</td>
                      <td className="py-3 pr-6 text-right">
                        {p.stockQuantity <= 0 ? <Badge className="bg-red-50 text-red-700 border-red-200">Out</Badge>
                          : p.stockQuantity <= p.minimumStockLevel ? <Badge className="bg-amber-50 text-amber-700 border-amber-200">Low</Badge>
                          : <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">OK</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low">
          <Card className="border-stone-200">
            <CardContent className="p-6">
              {lowStock.length === 0 ? <p className="text-stone-500">All products well stocked.</p> :
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {lowStock.map((p) => (
                    <div key={p.id} className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                      <div className="font-semibold">{p.productName}</div>
                      <div className="text-sm text-amber-700 tabular-nums">Stock: {p.stockQuantity} · Min: {p.minimumStockLevel}</div>
                    </div>
                  ))}
                </div>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">New Stock Movement</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Product</Label>
              <Select value={form.productId} onValueChange={(v) => setForm({ ...form, productId: v })}>
                <SelectTrigger data-testid="movement-product-select"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.productName} (stock: {p.stockQuantity})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Type</Label>
              <Select value={form.movementType} onValueChange={(v) => setForm({ ...form, movementType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inward">Inward (add)</SelectItem>
                  <SelectItem value="adjustment">Adjustment (set to)</SelectItem>
                  <SelectItem value="damage">Damage (subtract)</SelectItem>
                  <SelectItem value="lost">Lost (subtract)</SelectItem>
                  <SelectItem value="correction">Correction (add)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} data-testid="movement-quantity-input" /></div>
            <div><Label>Reason</Label><Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} className="bg-orange-600 hover:bg-orange-700" data-testid="save-movement-button">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
