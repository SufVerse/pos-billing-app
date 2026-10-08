import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  Package,
  Tags,
  Truck,
  Boxes,
  Receipt,
  BarChart3,
  Users,
  Settings as SettingsIcon,
  LogOut,
  Store,
  ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const nav = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/billing", icon: ScanLine, label: "Billing" },
  { to: "/products", icon: Package, label: "Products" },
  { to: "/categories", icon: Tags, label: "Categories" },
  { to: "/suppliers", icon: Truck, label: "Suppliers" },
  { to: "/inventory", icon: Boxes, label: "Inventory" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
  { to: "/users", icon: Users, label: "Users" },
  { to: "/settings", icon: SettingsIcon, label: "Settings" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-screen bg-stone-50">
      <aside data-testid="admin-sidebar" className="w-64 border-r border-stone-200 bg-white flex-shrink-0 flex flex-col">
        <div className="px-6 py-6 border-b border-stone-200 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-600 grid place-items-center text-white">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display font-bold text-stone-900 leading-none">Sunrise POS</div>
            <div className="text-[10px] uppercase tracking-widest text-stone-500 mt-1">Admin Console</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              data-testid={`nav-${label.toLowerCase()}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-orange-50 text-orange-700"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-stone-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                data-testid="user-menu-trigger"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-stone-100 transition-all text-left"
              >
                <div className="h-9 w-9 rounded-full bg-stone-900 text-white grid place-items-center font-bold text-sm">
                  {user?.fullName?.[0] || "A"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{user?.fullName}</div>
                  <div className="text-xs text-stone-500 truncate capitalize">{user?.role}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{user?.username}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem data-testid="logout-button" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
