import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, KeyRound, UserCog } from "lucide-react";

export default function Users() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ username: "", fullName: "", mobileNumber: "", password: "", role: "cashier" });
  const [pwOpen, setPwOpen] = useState(false);
  const [pwUser, setPwUser] = useState(null);
  const [newPw, setNewPw] = useState("");

  const load = () => api.get("/users").then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      if (editing) await api.put(`/users/${editing}`, { fullName: form.fullName, mobileNumber: form.mobileNumber, role: form.role });
      else await api.post("/users", form);
      toast.success("Saved"); setOpen(false); load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  const toggle = async (u) => {
    await api.put(`/users/${u.id}`, { status: u.status === "active" ? "inactive" : "active" });
    load();
  };

  const resetPw = async () => {
    if (!newPw) return toast.error("Enter a new password");
    await api.post(`/users/${pwUser.id}/reset-password`, { newPassword: newPw });
    toast.success("Password reset"); setPwOpen(false); setNewPw("");
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full" data-testid="users-page">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">User Management</h1>
          <p className="text-stone-500 mt-1">Manage admin and cashier accounts.</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ username: "", fullName: "", mobileNumber: "", password: "", role: "cashier" }); setOpen(true); }} className="bg-orange-600 hover:bg-orange-700" data-testid="add-user-button">
          <Plus className="h-4 w-4 mr-2" /> New user
        </Button>
      </header>
      <Card className="border-stone-200">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <th className="py-3 px-6">Name</th><th className="py-3 pr-6">Username</th><th className="py-3 pr-6">Phone</th><th className="py-3 pr-6">Role</th><th className="py-3 pr-6">Status</th><th className="py-3 px-6"></th>
            </tr></thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} className="border-b border-stone-100 hover:bg-stone-50/70">
                  <td className="py-3 px-6 font-semibold">{u.fullName}</td>
                  <td className="py-3 pr-6 font-mono text-xs">{u.username}</td>
                  <td className="py-3 pr-6 text-stone-600">{u.mobileNumber}</td>
                  <td className="py-3 pr-6"><Badge variant="outline" className="capitalize">{u.role}</Badge></td>
                  <td className="py-3 pr-6">
                    <button onClick={() => toggle(u)} data-testid={`toggle-status-${u.id}`}>
                      <Badge className={u.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-stone-100 text-stone-600"}>{u.status}</Badge>
                    </button>
                  </td>
                  <td className="py-3 px-6 text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(u.id); setForm({ username: u.username, fullName: u.fullName, mobileNumber: u.mobileNumber || "", password: "", role: u.role }); setOpen(true); }}><UserCog className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { setPwUser(u); setPwOpen(true); }} data-testid={`reset-pw-${u.id}`}><KeyRound className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">{editing ? "Edit" : "New"} User</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {!editing && (
              <>
                <div><Label>Username</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} data-testid="user-username-input" /></div>
                <div><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="user-password-input" /></div>
              </>
            )}
            <div><Label>Full name</Label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} data-testid="user-fullname-input" /></div>
            <div><Label>Phone</Label><Input value={form.mobileNumber} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} /></div>
            <div><Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} className="bg-orange-600 hover:bg-orange-700" data-testid="save-user-button">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Reset password for {pwUser?.fullName}</DialogTitle></DialogHeader>
          <div><Label>New password</Label><Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(false)}>Cancel</Button>
            <Button onClick={resetPw} className="bg-orange-600 hover:bg-orange-700" data-testid="confirm-reset-pw">Reset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
