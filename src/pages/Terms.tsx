import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="container py-32 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight mb-8">Terms of Service</h1>
        <div className="prose prose-sm text-black/60 space-y-6">
          <p>Welcome to Toyes Tech. By accessing our website, you agree to these terms.</p>
          <h2 className="text-lg font-bold text-black mt-8">Purchase Agreement</h2>
          <p>All tech gadgets sold at Toyes Tech are verified for quality. New items carry manufacturer warranties, while UK Used and certified Used items carry a limited 6-month Toyes Tech certification warranty.</p>
          <h2 className="text-lg font-bold text-black mt-8">Shipping & Delivery</h2>
          <p>We provide global shipping. Specific transit times vary based on location and selection class.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
