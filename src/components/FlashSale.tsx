import { Link } from "react-router-dom";
import { ChevronRight } from "@/components/icons";

const FlashSale = () => {
  return (
    <section className="container py-10">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary via-[hsl(260,70%,55%)] to-primary p-8 md:p-12">
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-2">FLASH SALE</h2>
          <p className="text-primary-foreground/90 text-sm mb-5">UPTO 70% DISCOUNT</p>
          <Link
            to="/"
            className="inline-flex items-center gap-1 bg-primary-foreground text-foreground text-sm font-medium px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            Shop Now <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {/* Decorative circles */}
        <div className="absolute top-1/2 right-[20%] -translate-y-1/2 w-48 h-48 rounded-full bg-primary-foreground/5" />
        <div className="absolute top-1/2 right-[10%] -translate-y-1/2 w-32 h-32 rounded-full bg-primary-foreground/5" />
      </div>
    </section>
  );
};

export default FlashSale;
