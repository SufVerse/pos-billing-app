import { useEffect, useState } from "react";
import api, { API } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { money } from "@/lib/utils-format";
import { Plus, Pencil, Trash2, Search, Upload, Download } from "lucide-react";

const EMPTY = {
  productName: "", barcode: "", sku: "", category: "", brand: "",
  costPrice: 0, sellingPrice: 0, taxPercentage: 0,
  stockQuantity: 0, minimumStockLevel: 0, supplier: "", productImageUrl: "",
  status: "active",
};

export default function Products() {
  const [list, setList] = useState([]);
  const [cats, setCats] = useState([]);
  const [supps, setSupps] = useState([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = (q = "") => api.get("/products", { params: { q, limit: 500 } }).then((r) => setList(r.data));
  useEffect(() => {
    load();
    api.get("/categories").then((r) => setCats(r.data));
    api.get("/suppliers").then((r) => setSupps(r.data));
  }, []);

  useEffect(() => { const t = setTimeout(() => load(query), 250); return () => clearTimeout(t); }, [query]);

  const startNew = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const startEdit = (p) => { setEditing(p.id); setForm({ ...EMPTY, ...p }); setOpen(true); };

  const save = async () => {
    try {
      const payload = {
        ...form,
        costPrice: Number(form.costPrice),
        sellingPrice: Number(form.sellingPrice),
        taxPercentage: Number(form.taxPercentage),
        stockQuantity: Number(form.stockQuantity),
        minimumStockLevel: Number(form.minimumStockLevel),
      };
      if (editing) await api.put(`/products/${editing}`, payload);
      else await api.post("/products", payload);
      toast.success(editing ? "Product updated" : "Product created");
      setOpen(false);
      load(query);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Save failed");
    }
  };

  const del = async (p) => {
    if (!window.confirm(`Delete ${p.productName}?`)) return;
    try { await api.delete(`/products/${p.id}`); toast.success("Deleted"); load(query); }
    catch (e) { toast.error(e?.response?.data?.detail || "Delete failed"); }
  };

  const catName = (id) => cats.find((c) => c.id === id)?.categoryName || "—";

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const token = localStorage.getItem("pos_token");
      const res = await fetch(`${API}/products/bulk-upload`, {
        method: "POST",
        body: fd,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Upload failed");
      setUploadResult(data);
      toast.success(`Imported: ${data.created} created, ${data.updated} updated`);
      load(query);
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    const token = localStorage.getItem("pos_token");
    const res = await fetch(`${API}/products-template`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "products_template.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full" data-testid="products-page">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">Products</h1>
          <p className="text-stone-500 mt-1">Manage your product catalog.</p>
        </div>
        <Button onClick={startNew} data-testid="add-product-button" className="bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4 mr-2" /> New product
        </Button>
      </header>

      <Card className="border-stone-200 mb-5 bg-orange-50/40">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            <div className="font-display font-bold text-stone-900">Bulk import from Excel</div>
            <div className="text-xs text-stone-600 mt-1 max-w-2xl">
              Columns: productName, barcode, sku, category, brand, costPrice, sellingPrice, taxPercentage, stockQuantity, minimumStockLevel, supplier, status.
              Category/supplier match by name or id. Existing products (matched by barcode → sku → name) are updated.
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate} data-testid="download-template-button">
              <Download className="h-4 w-4 mr-1.5" /> Template
            </Button>
            <label className="inline-flex">
              <input
                type="file"
                accept=".xlsx,.xlsm"
                onChange={handleFile}
                className="hidden"
                data-testid="upload-file-input"
                id="bulk-upload-input"
              />
              <Button
                type="button"
                onClick={() => document.getElementById("bulk-upload-input").click()}
                disabled={uploading}
                className="bg-stone-900 hover:bg-stone-800"
                data-testid="upload-excel-button"
              >
                <Upload className="h-4 w-4 mr-1.5" />
                {uploading ? "Uploading…" : "Upload Excel"}
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card className="border-stone-200">
        <CardContent className="p-4">
          <div className="relative mb-4">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <Input placeholder="Search by name, SKU, barcode…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" data-testid="products-search" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200">
                  <th className="py-3 pr-4 font-semibold">Product</th>
                  <th className="py-3 pr-4 font-semibold">SKU / Barcode</th>
                  <th className="py-3 pr-4 font-semibold">Category</th>
                  <th className="py-3 pr-4 font-semibold text-right">Cost</th>
                  <th className="py-3 pr-4 font-semibold text-right">Price</th>
                  <th className="py-3 pr-4 font-semibold text-right">Stock</th>
                  <th className="py-3 pr-4 font-semibold">Status</th>
                  <th className="py-3"></th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-stone-500">No products yet</td></tr>}
                {list.map((p) => (
                  <tr key={p.id} className="border-b border-stone-100 hover:bg-stone-50/70">
                    <td className="py-3 pr-4 font-semibold text-stone-900">{p.productName}<div className="text-xs text-stone-500 font-normal">{p.brand}</div></td>
                    <td className="py-3 pr-4 font-mono text-xs text-stone-600">{p.sku || "—"}<div>{p.barcode || ""}</div></td>
                    <td className="py-3 pr-4 text-stone-600">{catName(p.category)}</td>
                    <td className="py-3 pr-4 text-right tabular-nums text-stone-600">{money(p.costPrice)}</td>
                    <td className="py-3 pr-4 text-right tabular-nums font-semibold">{money(p.sellingPrice)}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      <span className={p.stockQuantity <= p.minimumStockLevel ? "text-amber-600 font-semibold" : ""}>{p.stockQuantity}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline" className={p.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-stone-100"}>{p.status}</Badge>
                    </td>
                    <td className="py-3 text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => startEdit(p)} data-testid={`edit-product-${p.id}`}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => del(p)} data-testid={`delete-product-${p.id}`}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "Edit" : "New"} Product</DialogTitle>
            <DialogDescription>Fill product details below. Required fields are marked with *.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Product name *" col={2}>
              <Input value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} data-testid="product-name-input" />
            </Field>
            <Field label="Barcode"><Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></Field>
            <Field label="SKU"><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></Field>
            <Field label="Category">
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.categoryName}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Supplier">
              <Select value={form.supplier} onValueChange={(v) => setForm({ ...form, supplier: v })}>
                <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>{supps.map((s) => <SelectItem key={s.id} value={s.id}>{s.supplierName}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Brand"><Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></Field>
            <Field label="Cost price"><Input type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} /></Field>
            <Field label="Selling price"><Input type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} data-testid="product-price-input" /></Field>
            <Field label="Tax %"><Input type="number" value={form.taxPercentage} onChange={(e) => setForm({ ...form, taxPercentage: e.target.value })} /></Field>
            <Field label="Stock"><Input type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} data-testid="product-stock-input" /></Field>
            <Field label="Min stock"><Input type="number" value={form.minimumStockLevel} onChange={(e) => setForm({ ...form, minimumStockLevel: e.target.value })} /></Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} className="bg-orange-600 hover:bg-orange-700" data-testid="save-product-button">{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!uploadResult} onOpenChange={(o) => !o && setUploadResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Import complete</DialogTitle>
            <DialogDescription>Summary of your Excel import</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-stone-600">Rows processed</span><span className="font-bold tabular-nums">{uploadResult?.totalRows}</span></div>
            <div className="flex justify-between"><span className="text-stone-600">Created</span><span className="font-bold text-emerald-700 tabular-nums">{uploadResult?.created}</span></div>
            <div className="flex justify-between"><span className="text-stone-600">Updated</span><span className="font-bold text-blue-700 tabular-nums">{uploadResult?.updated}</span></div>
            <div className="flex justify-between"><span className="text-stone-600">Errors</span><span className="font-bold text-red-600 tabular-nums">{uploadResult?.errors?.length || 0}</span></div>
            {uploadResult?.errors?.length > 0 && (
              <div className="mt-3 max-h-40 overflow-y-auto bg-stone-50 border border-stone-200 rounded-lg p-3 text-xs space-y-1">
                {uploadResult.errors.map((e, i) => (
                  <div key={i} className="text-red-700">Row {e.row}: {e.error}</div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setUploadResult(null)} className="bg-orange-600 hover:bg-orange-700">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Field = ({ label, children, col = 1 }) => (
  <div className={col === 2 ? "col-span-2" : ""}>
    <Label className="text-xs uppercase tracking-wider text-stone-500 font-semibold">{label}</Label>
    <div className="mt-1.5">{children}</div>
  </div>
);
