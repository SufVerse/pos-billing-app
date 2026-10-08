import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Categories() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ categoryName: "", description: "", status: "active" });

  const load = () => api.get("/categories").then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      if (editing) await api.put(`/categories/${editing}`, form);
      else await api.post("/categories", form);
      toast.success("Saved"); setOpen(false); load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Save failed"); }
  };

  const del = async (c) => {
    if (!window.confirm(`Delete ${c.categoryName}?`)) return;
    try { await api.delete(`/categories/${c.id}`); toast.success("Deleted"); load(); }
    catch (e) { toast.error(e?.response?.data?.detail || "Delete failed"); }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto w-full" data-testid="categories-page">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">Categories</h1>
          <p className="text-stone-500 mt-1">Organize your products into categories.</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ categoryName: "", description: "", status: "active" }); setOpen(true); }} className="bg-orange-600 hover:bg-orange-700" data-testid="add-category-button">
          <Plus className="h-4 w-4 mr-2" /> New category
        </Button>
      </header>
      <Card className="border-stone-200">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200">
                <th className="py-3 px-6 font-semibold">Name</th>
                <th className="py-3 pr-6 font-semibold">Description</th>
                <th className="py-3 pr-6 font-semibold">Status</th>
                <th className="py-3 px-6"></th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-stone-500">No categories</td></tr>}
              {list.map((c) => (
                <tr key={c.id} className="border-b border-stone-100 hover:bg-stone-50/70">
                  <td className="py-3 px-6 font-semibold">{c.categoryName}</td>
                  <td className="py-3 pr-6 text-stone-600">{c.description}</td>
                  <td className="py-3 pr-6"><Badge variant="outline" className={c.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-stone-100"}>{c.status}</Badge></td>
                  <td className="py-3 px-6 text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(c.id); setForm({ categoryName: c.categoryName, description: c.description || "", status: c.status }); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => del(c)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">{editing ? "Edit" : "New"} Category</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.categoryName} onChange={(e) => setForm({ ...form, categoryName: e.target.value })} data-testid="category-name-input" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} className="bg-orange-600 hover:bg-orange-700" data-testid="save-category-button">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
