import { Smartphone, Watch, Monitor, Headphones, Gamepad2, Home } from "@/components/icons";

const cats = [
  { icon: Smartphone, label: "Mobile &\nAccessories" },
  { icon: Watch, label: "Smart\nDevices" },
  { icon: Monitor, label: "Computer\nAccessories" },
  { icon: Headphones, label: "Audio &\nEntertainment" },
  { icon: Gamepad2, label: "Gaming\nGadgets" },
  { icon: Home, label: "Home & Office\nGadgets" },
];

const FeaturedCategories = () => {
  return (
    <section className="container py-10">
      <h2 className="text-lg font-semibold text-foreground mb-6">Featured Categories</h2>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {cats.map((cat) => (
          <button
            key={cat.label}
            className="flex flex-col items-center gap-3 p-4 rounded-xl border border-border bg-background hover:border-primary hover:shadow-md transition-all group"
          >
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <cat.icon className="w-6 h-6 text-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="text-xs font-medium text-center text-muted-foreground group-hover:text-foreground whitespace-pre-line leading-tight">
              {cat.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default FeaturedCategories;
