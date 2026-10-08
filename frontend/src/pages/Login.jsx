import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Store, ShoppingBag } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(username, password);
      toast.success(`Welcome, ${u.fullName}`);
      const from = loc.state?.from?.pathname;
      if (from && from !== "/login") nav(from, { replace: true });
      else nav(u.role === "cashier" ? "/billing" : "/dashboard", { replace: true });
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-5 bg-stone-50">
      <div
        className="hidden lg:flex lg:col-span-3 relative overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(28,25,23,0.72), rgba(234,88,12,0.45)), url('https://images.pexels.com/photos/347139/pexels-photo-347139.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1400')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="m-auto px-16 text-white max-w-xl">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur grid place-items-center">
              <Store className="h-5 w-5" />
            </div>
            <div className="font-display text-lg font-bold tracking-tight">Sunrise POS</div>
          </div>
          <h1 className="font-display text-5xl font-extrabold leading-tight tracking-tight">
            Sell faster.<br />Track everything.
          </h1>
          <p className="mt-6 text-white/85 text-lg leading-relaxed">
            A modern point of sale & inventory hub built for cafés, retail stores and small businesses.
          </p>
          <div className="mt-12 flex gap-6 text-sm">
            <Stat label="Avg checkout" value="<2s" />
            <Stat label="Products" value="50k+" />
            <Stat label="Reports" value="8 types" />
          </div>
        </div>
      </div>

      <div className="col-span-1 lg:col-span-2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md border-stone-200 shadow-sm">
          <CardContent className="p-8">
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <ShoppingBag className="h-5 w-5 text-orange-600" />
              <span className="font-display font-bold">Sunrise POS</span>
            </div>
            <div className="mb-8">
              <h2 className="font-display text-3xl font-extrabold tracking-tight">Sign in</h2>
              <p className="text-stone-500 text-sm mt-2">
                Welcome back. Enter your credentials to continue.
              </p>
            </div>
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  data-testid="login-username-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  data-testid="login-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button
                type="submit"
                data-testid="login-submit-button"
                disabled={loading}
                className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-base font-semibold transition-all active:scale-[0.98]"
              >
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
            <div className="mt-8 p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600 leading-relaxed">
              <p className="font-semibold tracking-wider uppercase text-stone-500 mb-2 text-[10px]">
                Demo credentials
              </p>
              <p><b className="text-stone-900">Admin:</b> admin / admin123</p>
              <p><b className="text-stone-900">Cashier:</b> cashier / cashier123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const Stat = ({ label, value }) => (
  <div>
    <div className="font-display text-2xl font-bold tabular-nums">{value}</div>
    <div className="text-xs uppercase tracking-wider text-white/70 mt-1">{label}</div>
  </div>
);
