import { Link } from "react-router-dom";
import { Location01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

/** In-person shopping: the campus store and other branches. */
const StoreStrip = () => (
  <section className="container pb-14 md:pb-20">
    <div className="grid items-center gap-6 overflow-hidden rounded-[28px] bg-[#F4F3F1] md:grid-cols-[1.2fr_1fr]">
      <div className="p-7 md:p-12">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white">
          <HugeiconsIcon icon={Location01Icon} size={20} />
        </span>
        <h2 className="mt-5 text-3xl font-extrabold md:text-4xl">Prefer to see it first?</h2>
        <p className="mt-3 max-w-md text-black/65">
          Visit our campus store or any Toyes Tech branch to try gadgets, compare phones and laptops, and get set up before you leave.
        </p>
        <Link to="/contact" className="mt-6 inline-block rounded-full bg-black px-6 py-3.5 text-sm font-bold text-white hover:bg-black/85">
          Find a store
        </Link>
      </div>
      <img src="/images/products/hero-laptops.jpg" alt="" loading="lazy" className="h-64 w-full object-cover md:h-full md:min-h-[360px]" />
    </div>
  </section>
);

export default StoreStrip;
