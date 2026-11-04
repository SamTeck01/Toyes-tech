import { Star } from "lucide-react";

const reviews = [
  {
    name: "Sarah M.",
    avatar: "SM",
    text: "Amazing quality products. The headphones I ordered have incredible sound and the delivery was super fast!",
    rating: 5,
  },
  {
    name: "James R.",
    avatar: "JR",
    text: "I've been shopping here for a while and always satisfied. Great customer service and fair prices on all gadgets.",
    rating: 5,
  },
  {
    name: "Emily K.",
    avatar: "EK",
    text: "Best gadget store online! Found everything I needed for my home office setup at competitive prices.",
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section className="container py-12">
      <h2 className="text-lg font-semibold text-foreground text-center mb-8">Our Users Feedback</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reviews.map((r) => (
          <div key={r.name} className="bg-background border border-border rounded-xl p-6">
            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: r.rating }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{r.text}</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                {r.avatar}
              </div>
              <span className="text-sm font-medium text-foreground">{r.name}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
