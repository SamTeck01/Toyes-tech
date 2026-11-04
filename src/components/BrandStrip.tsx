const brands = ["Apple", "Samsung", "JBL", "Bose", "Sony", "Lenovo", "HP", "Dell", "Xiaomi", "Redragon", "Anker", "Oraimo"];

const BrandStrip = () => (
  <section className="container py-12 md:py-16" aria-label="Brands we sell">
    <p className="mb-6 text-center text-sm text-black/55">Brands you'll find at Toyes Tech</p>
    <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 md:gap-x-16">
      {brands.map((b) => (
        <span key={b} className="font-display text-xl font-bold text-black/35 md:text-2xl">{b}</span>
      ))}
    </div>
  </section>
);

export default BrandStrip;
