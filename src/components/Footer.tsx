import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

const footerLinks = [
  {
    title: "Shop",
    links: [
      { label: "Phones", to: "/shop?category=Phones" },
      { label: "Laptops", to: "/shop?category=Laptops" },
      { label: "Accessories", to: "/shop?category=Accessories" },
      { label: "Our Catalog", to: "/shop" },
    ]
  },
  {
    title: "Support",
    links: [
      { label: "Track Order", to: "/orders" },
      { label: "Live Tracking", to: "/orders" },
      { label: "Order History", to: "/orders" },
      { label: "Contact Us", to: "/contact" },
    ]
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms of Service", to: "/terms" },
      { label: "Shipment Rules", to: "/terms" },
      { label: "My Account", to: "/account" },
    ]
  }
];

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="container py-20 px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 lg:gap-24 mb-20">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Logo className="mb-6" />
            <p className="text-sm text-black/60 leading-relaxed max-w-xs">
              Toyes Tech sells verified new and UK-used phones and gadgets, with fast delivery across Nigeria.
            </p>
          </div>

          {/* Links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-xs font-bold text-black mb-6">{section.title}</h4>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-xs font-bold text-black/40 hover:text-primary transition-colors underline-offset-4 hover:underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-10 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] font-medium text-black/50">
          <div className="flex items-center gap-8">
            <span>© {new Date().getFullYear()} Toyes Tech</span>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <span>Payments secured by Paystack</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
