import { useState } from "react";
import { Link, NavLink, Navigate, Outlet } from "react-router-dom";
import { LayoutDashboard, TrendingUp, Package, Tag, Users, MapPin, Mail, LogOut, Menu, X, CreditCard, ShoppingBag, ArrowUpRight } from "@/components/icons";
import { useHQ } from "@/hq/HQContext";
import { LogoMark } from "@/components/Logo";
import { cn } from "@/lib/utils";

const HQLayout = () => {
  const { loading, me, isOwner, signOut, stores } = useHQ();
  const [open, setOpen] = useState(false);
  if (loading) return <div className="min-h-screen bg-stone-100" />;
  if (!me) return <Navigate to="/admin/login" replace />;

  const groups = [
    {
      label: "Business",
      items: [
        { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
        { to: "/admin/sales", label: "Sales", icon: TrendingUp },
        { to: "/admin/inventory", label: "Inventory", icon: Package },
        { to: "/admin/products", label: "Products", icon: Tag },
      ],
    },
    {
      label: "Team & setup",
      items: [
        { to: "/admin/staff", label: "Staff", icon: Users },
        ...(isOwner ? [{ to: "/admin/stores", label: "Stores", icon: MapPin }, { to: "/admin/alerts", label: "WhatsApp alerts", icon: Mail }] : []),
      ],
    },
  ];
  const myStore = stores.find((s) => s.id === me.store_id)?.name;

  const nav = (
    <div className="flex h-full flex-col">
      <Link to="/admin" className="flex items-center gap-2.5 px-5 pb-6 pt-5">
        <LogoMark className="h-8 w-8" />
        <span className="text-[17px] font-extrabold tracking-tight text-ink">Toyes<span className="text-primary">Tech</span></span>
        <span className="ml-auto rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink/55">HQ</span>
      </Link>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="px-3 pb-2 text-[11px] font-medium text-ink/40">{g.label}</p>
            <div className="space-y-0.5">
              {g.items.map((i) => (
                <NavLink
                  key={i.to}
                  to={i.to}
                  end={i.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition",
                      isActive ? "bg-stone-100 text-ink" : "text-ink/60 hover:bg-stone-50 hover:text-ink",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-primary" />}
                      <i.icon className={cn("h-[18px] w-[18px]", isActive ? "text-primary" : "text-ink/40 group-hover:text-ink/70")} />
                      {i.label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
        <div className="space-y-0.5">
          <Link to="/pos" className="flex items-center gap-3 rounded-lg bg-primary px-3 py-2.5 text-[14px] font-semibold text-white transition hover:brightness-110">
            <CreditCard className="h-[18px] w-[18px]" /> Point of Sale (POS) <ArrowUpRight className="ml-auto h-4 w-4 opacity-70" />
          </Link>
          {isOwner && (
            <Link to="/admin/orders" className="flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium text-ink/60 transition hover:bg-stone-50 hover:text-ink">
              <ShoppingBag className="h-[18px] w-[18px] text-ink/40" /> Website orders
            </Link>
          )}
        </div>
      </nav>
      <div className="m-3 flex items-center gap-3 rounded-xl border border-line bg-stone-50 p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-red-700 text-sm font-bold text-white">{me.full_name[0]}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{me.full_name}</p>
          <p className="truncate text-xs text-ink/50">{isOwner ? "Owner · all stores" : `Manager · ${myStore ?? "store"}`}</p>
        </div>
        <button onClick={() => void signOut()} aria-label="Sign out" title="Sign out" className="rounded-lg p-1.5 text-ink/50 transition hover:bg-stone-200 hover:text-ink">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-stone-100 text-ink">
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 border-r border-line bg-white md:block">{nav}</aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-white px-4 py-3 md:hidden">
          <button aria-label="Open menu" onClick={() => setOpen(true)} className="text-ink"><Menu className="h-6 w-6" /></button>
          <span className="font-extrabold text-ink">Toyes<span className="text-primary">Tech</span> <span className="text-xs font-semibold text-ink/50">HQ</span></span>
        </header>
        {open && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-[272px] bg-white">
              <button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute right-3 top-5 text-ink/60"><X className="h-5 w-5" /></button>
              {nav}
            </div>
          </div>
        )}
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 md:px-8 md:py-8"><Outlet /></main>
      </div>
    </div>
  );
};

export default HQLayout;
