import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const EMPTY = { supplierName: "", contactPerson: "", mobileNumber: "", email: "", address: "", status: "active" };

export default function Suppliers() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = () => api.get("/suppliers").then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      if (editing) await api.put(`/suppliers/${editing}`, form);
      else await api.post("/suppliers", form);
      toast.success("Saved"); setOpen(false); load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  const del = async (s) => {
    if (!window.confirm(`Delete ${s.supplierName}?`)) return;
    await api.delete(`/suppliers/${s.id}`); toast.success("Deleted"); load();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full" data-testid="suppliers-page">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">Suppliers</h1>
          <p className="text-stone-500 mt-1">Manage your vendor contacts.</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm(EMPTY); setOpen(true); }} className="bg-orange-600 hover:bg-orange-700" data-testid="add-supplier-button">
          <Plus className="h-4 w-4 mr-2" /> New supplier
        </Button>
      </header>
      <Card className="border-stone-200">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200">
                <th className="py-3 px-6 font-semibold">Supplier</th>
                <th className="py-3 pr-6 font-semibold">Contact</th>
                <th className="py-3 pr-6 font-semibold">Phone</th>
                <th className="py-3 pr-6 font-semibold">Email</th>
                <th className="py-3 pr-6 font-semibold">Status</th>
                <th className="py-3 px-6"></th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-stone-500">No suppliers</td></tr>}
              {list.map((s) => (
                <tr key={s.id} className="border-b border-stone-100 hover:bg-stone-50/70">
                  <td className="py-3 px-6 font-semibold">{s.supplierName}</td>
                  <td className="py-3 pr-6 text-stone-600">{s.contactPerson}</td>
                  <td className="py-3 pr-6 text-stone-600">{s.mobileNumber}</td>
                  <td className="py-3 pr-6 text-stone-600">{s.email}</td>
                  <td className="py-3 pr-6"><Badge variant="outline" className={s.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-stone-100"}>{s.status}</Badge></td>
                  <td className="py-3 px-6 text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(s.id); setForm({ ...EMPTY, ...s }); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => del(s)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">{editing ? "Edit" : "New"} Supplier</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Supplier name</Label><Input value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} data-testid="supplier-name-input" /></div>
            <div><Label>Contact person</Label><Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={form.mobileNumber} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} /></div>
            <div className="col-span-2"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="col-span-2"><Label>Address</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} className="bg-orange-600 hover:bg-orange-700" data-testid="save-supplier-button">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
