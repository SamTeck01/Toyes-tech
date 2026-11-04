import { toast } from "sonner";
import { motion } from "framer-motion";
import { Facebook, Twitter, Instagram, Youtube, Send } from "lucide-react";

const SocialBar = () => {
  return (
    <div className="bg-primary text-primary-foreground py-12">
      <div className="container flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Left: Socials */}
        <div className="flex items-center gap-8">
          <div className="flex flex-col gap-1">
             <span className="text-xs font-bold uppercase tracking-widest text-primary-foreground/40">Connect with us</span>
             <h3 className="text-xl font-bold tracking-tighter">Follow Toyes Tech for drops &amp; deals.</h3>
          </div>
          <div className="flex items-center gap-4">
            {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
              <motion.a
                key={i}
                href="#"
                whileHover={{ scale: 1.1, color: "hsl(var(--primary-foreground))" }}
                className="w-10 h-10 rounded-full border border-primary-foreground/10 flex items-center justify-center text-primary-foreground/60 hover:border-primary-foreground/40 transition-colors"
              >
                <Icon className="w-4 h-4" />
              </motion.a>
            ))}
          </div>
        </div>

        {/* Right: Quick Newsletter */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="flex flex-col gap-1 text-center lg:text-left">
             <span className="text-xs font-bold uppercase tracking-widest text-primary-foreground/40">Newsletter</span>
             <h3 className="text-xl font-bold tracking-tighter">Get deals in your inbox.</h3>
          </div>
          <form className="flex flex-1 lg:w-80 relative" onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; toast.success("You're subscribed! Watch your inbox for Toyes Tech deals."); f.reset(); }}>
            <input 
              type="email" 
              required
              aria-label="Email address"
              placeholder="Your email address" 
              className="w-full bg-primary-foreground/5 border border-primary-foreground/10 px-6 py-4 text-sm outline-none focus:border-primary-foreground/20 transition-all rounded-full placeholder:text-primary-foreground/30"
            />
            <button type="submit" aria-label="Subscribe" className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary-foreground text-primary p-2 rounded-full hover:opacity-90 transition-opacity">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SocialBar;
