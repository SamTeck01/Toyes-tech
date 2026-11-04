import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="container py-32 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tighter mb-8">Privacy Policy</h1>
        <div className="prose prose-sm text-black/60 space-y-6">
          <p>Your privacy is paramount at Toyes Tech. This policy describes how we collect and use your data.</p>
          <h2 className="text-lg font-bold text-black uppercase tracking-widest mt-8">Data Collection</h2>
          <p>We collect only the necessary information to process your orders and provide a premium shopping experience. This includes contact details and shipping addresses.</p>
          <h2 className="text-lg font-bold text-black uppercase tracking-widest mt-8">Secure Payment</h2>
          <p>We do not store credit card information. All transactions are handled by Paystack using industry-standard encryption protocols.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
