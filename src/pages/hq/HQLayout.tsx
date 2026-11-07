import { useState } from "react";
import { Link, NavLink, Navigate, Outlet } from "react-router-dom";
import { LayoutDashboard, TrendingUp, Package, Tag, Users, MapPin, Mail, LogOut, Menu, X, CreditCard, ShoppingBag } from "@/components/icons";
import { useHQ } from "@/hq/HQContext";
import { LogoMark } from "@/components/Logo";

const HQLayout = () => {
  const { loading, me, isOwner, signOut } = useHQ();
  const [open, setOpen] = useState(false);
  if (loading) return <div className="min-h-screen bg-[#F4F4F5]" />;
  if (!me) return <Navigate to="/admin/login" replace />;

  const items = [
    { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/admin/sales", label: "Sales", icon: TrendingUp },
    { to: "/admin/inventory", label: "Inventory", icon: Package },
    ...(isOwner ? [{ to: "/admin/products", label: "Products", icon: Tag }] : []),
    { to: "/admin/staff", label: "Staff", icon: Users },
    ...(isOwner ? [{ to: "/admin/stores", label: "Stores", icon: MapPin }, { to: "/admin/alerts", label: "WhatsApp alerts", icon: Mail }] : []),
  ];

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {items.map((i) => (
        <NavLink
          key={i.to}
          to={i.to}
          end={i.end}
          onClick={() => setOpen(false)}
          className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${isActive ? "bg-primary text-white" : "text-black/65 hover:bg-gray-100"}`}
        >
          <i.icon className="h-5 w-5" /> {i.label}
        </NavLink>
      ))}
      <div className="my-3 border-t border-gray-100" />
      <Link to="/pos" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-black/65 hover:bg-gray-100"><CreditCard className="h-5 w-5" /> Open POS</Link>
      {isOwner && <Link to="/admin/orders" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-black/65 hover:bg-gray-100"><ShoppingBag className="h-5 w-5" /> Website orders</Link>}
      <button onClick={() => void signOut()} className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"><LogOut className="h-5 w-5" /> Sign out</button>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-[#F4F4F5]">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
        <div className="flex items-center gap-2.5 px-5 py-5"><LogoMark /><span className="text-lg font-extrabold">Toyes<span className="text-primary">Tech</span> <span className="text-xs font-semibold text-black/45">HQ</span></span></div>
        <div className="mx-3 rounded-xl bg-gray-50 px-3 py-2.5 text-sm">
          <p className="font-bold">{me.full_name}</p>
          <p className="text-xs capitalize text-black/50">{me.role.replace("_", " ")}</p>
        </div>
        {nav}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 md:hidden">
          <button aria-label="Menu" onClick={() => setOpen(true)}><Menu className="h-6 w-6" /></button>
          <span className="font-extrabold">Toyes<span className="text-primary">Tech</span> HQ</span>
        </header>
        {open && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white">
              <div className="flex items-center justify-between px-5 py-4"><span className="font-extrabold">{me.full_name}</span><button aria-label="Close" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button></div>
              {nav}
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
};

export default HQLayout;
