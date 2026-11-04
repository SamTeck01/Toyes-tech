import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from "@/components/icons";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { STORE } from "@/config/store";
import { useState } from "react";

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Message dispatched successfully. We'll be in touch.");
      (e.target as HTMLFormElement).reset();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="container py-20 px-4">
        <div className="max-w-6xl mx-auto">
          
          <header className="mb-20">
            
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight max-w-2xl">
              Talk to Toyes Tech.
            </h1>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
            
            {/* Contact Info */}
            <div className="lg:col-span-5 space-y-12">
              <section className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-black/50 mb-1">Email</p>
                    <p className="text-sm font-bold">{STORE.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-black/50 mb-1">Phone</p>
                    <p className="text-sm font-bold">{STORE.phoneDisplay}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-black/50 mb-1">Visit us</p>
                    <p className="text-sm font-bold leading-relaxed">
                      Lekki Phase 1, Victoria Island,<br />
                      Lagos, Nigeria.
                    </p>
                  </div>
                </div>
              </section>

              <div className="bg-primary text-primary-foreground p-8 rounded-[40px] relative overflow-hidden shadow-2xl shadow-primary/20">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                   <Clock className="w-24 h-24" />
                </div>
                <div className="relative z-10">
                   <h3 className="text-xs font-bold mb-4">Opening hours</h3>
                   <div className="space-y-3 opacity-70">
                      <div className="flex justify-between text-[11px] font-bold">
                         <span>Mon — Fri</span>
                         <span>9:00 — 18:00</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-bold">
                         <span>Saturday</span>
                         <span>10:00 — 15:00</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-bold">
                         <span>Sunday</span>
                         <span>Online only</span>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-7">
              <div className="bg-gray-50 p-8 md:p-12 rounded-[40px] border border-gray-100">
                <div className="flex items-center gap-3 mb-8">
                   <MessageSquare className="w-4 h-4 text-black/40" />
                   <h2 className="text-xs font-bold">Send us a message</h2>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-black/40">Full Name</label>
                      <input required type="text" className="w-full border-b border-gray-200 bg-transparent py-3 text-xs focus:outline-none focus:border-black transition-colors" placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-black/40">Email Address</label>
                      <input required type="email" className="w-full border-b border-gray-200 bg-transparent py-3 text-xs focus:outline-none focus:border-black transition-colors" placeholder="john@example.com" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-black/40">Subject</label>
                    <select className="w-full border-b border-gray-200 bg-transparent py-3 text-xs focus:outline-none focus:border-black transition-colors appearance-none">
                       <option>Product Inquiry</option>
                       <option>Order Tracking Help</option>
                       <option>Returns & Exchanges</option>
                       <option>Business Collaboration</option>
                       <option>Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-black/40">Message</label>
                    <textarea required rows={5} className="w-full border-b border-gray-200 bg-transparent py-3 text-xs focus:outline-none focus:border-black resize-none transition-colors" placeholder="Tell us what you need help with"></textarea>
                  </div>

                  <button 
                    disabled={isSubmitting}
                    className="w-full bg-primary text-primary-foreground py-5 rounded-2xl text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/10"
                  >
                    {isSubmitting ? "Dispatching..." : "Send Message"} <Send className="w-3 h-3" />
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
