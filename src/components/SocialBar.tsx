import { toast } from "sonner";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

const socials = [
  { Icon: Instagram, label: "Instagram" },
  { Icon: Twitter, label: "X (Twitter)" },
  { Icon: Facebook, label: "Facebook" },
  { Icon: Youtube, label: "YouTube" },
];

const SocialBar = () => (
  <section className="bg-primary text-primary-foreground">
    <div className="container grid gap-8 py-12 md:grid-cols-2 md:items-center md:py-14">
      <div>
        <h2 className="text-2xl font-extrabold md:text-3xl">Get new arrivals and deals first</h2>
        <p className="mt-2 text-sm text-white/80">One email a week. Unsubscribe anytime.</p>
        <div className="mt-5 flex gap-3">
          {socials.map(({ Icon, label }) => (
            <a
              key={label}
              href="#"
              aria-label={`Toyes Tech on ${label}`}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white transition hover:bg-white hover:text-primary"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
      <form
        className="flex w-full flex-col gap-3 sm:flex-row md:justify-self-end md:max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Subscribed. Watch your inbox for Toyes Tech deals.");
          e.currentTarget.reset();
        }}
      >
        <label htmlFor="newsletter-email" className="sr-only">Email address</label>
        <input
          id="newsletter-email"
          type="email"
          required
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-full bg-white px-5 py-3.5 text-sm text-black outline-none placeholder:text-black/40 focus:ring-2 focus:ring-white/60"
        />
        <button type="submit" className="rounded-full bg-black px-6 py-3.5 text-sm font-bold text-white transition hover:bg-black/85">
          Subscribe
        </button>
      </form>
    </div>
  </section>
);

export default SocialBar;
