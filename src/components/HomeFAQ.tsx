import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "How long does delivery take?",
    a: "Orders placed before 2pm are usually delivered the same or next day within the city, and in 2–5 working days to other states. You'll get a tracking link once your order ships.",
  },
  {
    q: "What does UK-used mean?",
    a: "UK-used devices were previously owned in the UK and are imported in near-new condition. We test every one before listing it and show its battery health on the product page.",
  },
  {
    q: "Do your products come with a warranty?",
    a: "Yes. New items carry the manufacturer's warranty, and every device we sell is covered by a Toyes Tech warranty. Keep your order number as proof of purchase.",
  },
  {
    q: "How can I pay?",
    a: "Pay securely with card, bank transfer or USSD through Paystack at checkout.",
  },
  {
    q: "Can I return something?",
    a: "You have 7 days from delivery to return an item that isn't right. Contact us with your order number and we'll arrange a replacement or refund.",
  },
  {
    q: "Can I buy in person?",
    a: "Yes. Visit our campus store or any Toyes Tech branch. Call ahead if you want us to hold a specific item for you.",
  },
];

const HomeFAQ = () => (
  <section className="container grid gap-8 py-14 md:grid-cols-[1fr_1.6fr] md:gap-16 md:py-20" aria-labelledby="faq-heading">
    <div>
      <h2 id="faq-heading" className="text-3xl font-extrabold md:text-4xl">Questions, answered</h2>
      <p className="mt-3 max-w-sm text-black/60">Can't find what you need? Our team replies quickly.</p>
      <Link to="/contact" className="mt-6 inline-block rounded-full border border-black/15 px-6 py-3 text-sm font-bold hover:border-black/40">
        Contact us
      </Link>
    </div>
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((f, i) => (
        <AccordionItem key={f.q} value={`faq-${i}`} className="border-gray-200">
          <AccordionTrigger className="py-5 text-left text-base font-bold hover:no-underline">{f.q}</AccordionTrigger>
          <AccordionContent className="pb-5 text-[15px] leading-relaxed text-black/65">{f.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </section>
);

export default HomeFAQ;
