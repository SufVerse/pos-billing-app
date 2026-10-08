import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function Settings() {
  const [form, setForm] = useState(null);

  useEffect(() => { api.get("/settings").then((r) => setForm(r.data)); }, []);

  const save = async () => {
    try { await api.put("/settings", form); toast.success("Settings saved"); }
    catch (e) { toast.error(e?.response?.data?.detail || "Save failed"); }
  };

  if (!form) return <div className="p-8 text-stone-500">Loading…</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto w-full" data-testid="settings-page">
      <header className="mb-6">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-stone-500 mt-1">Configure your store details and receipt.</p>
      </header>
      <Card className="border-stone-200">
        <CardContent className="p-6 space-y-4">
          <div><Label>Store name</Label><Input value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} data-testid="store-name-input" /></div>
          <div><Label>Address</Label><Textarea value={form.storeAddress || ""} onChange={(e) => setForm({ ...form, storeAddress: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Phone</Label><Input value={form.mobileNumber || ""} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>GST number</Label><Input value={form.gstNumber || ""} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} /></div>
            <div><Label>Invoice prefix</Label><Input value={form.invoicePrefix || ""} onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })} /></div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={!!form.taxEnabled} onCheckedChange={(v) => setForm({ ...form, taxEnabled: v })} data-testid="tax-enabled-switch" />
            <Label>Apply tax on sales</Label>
          </div>
          <div><Label>Receipt footer</Label><Textarea value={form.receiptFooter || ""} onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })} /></div>
          <Button onClick={save} className="bg-orange-600 hover:bg-orange-700" data-testid="save-settings-button">Save settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
