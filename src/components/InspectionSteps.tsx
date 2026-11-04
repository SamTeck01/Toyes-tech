import { Link } from "react-router-dom";

const steps = [
  { title: "Sourced", body: "UK-used devices come from trusted UK suppliers, never from unknown sellers." },
  { title: "Tested", body: "Screen, cameras, speakers, Face ID or fingerprint, ports and network are each checked." },
  { title: "Battery checked", body: "We list battery health on the product page. Devices below 80% are not sold." },
  { title: "Warrantied", body: "Every device ships with a Toyes Tech warranty and 7 days to return it." },
];

/** Explains the UK-used inspection process, a real sequence, so numbered steps are appropriate. */
const InspectionSteps = () => (
  <section className="bg-[#16161A] text-white">
    <div className="container grid gap-10 py-16 md:grid-cols-[1fr_1.4fr] md:gap-16 md:py-24">
      <div>
        <h2 className="text-3xl font-extrabold leading-tight md:text-5xl">How we check every UK-used device</h2>
        <p className="mt-4 max-w-sm text-white/65">
          UK-used should mean nearly new. Here's what each device goes through before it's listed.
        </p>
        <Link to="/shop?condition=UK%20Used" className="mt-8 inline-block rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground transition hover:brightness-110">
          Shop UK-used
        </Link>
      </div>
      <ol className="grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2">
        {steps.map((s, i) => (
          <li key={s.title} className="bg-[#16161A] p-6 md:p-8">
            <span className="font-display text-4xl font-extrabold text-primary">{i + 1}</span>
            <h3 className="mt-3 text-lg font-bold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/65">{s.body}</p>
          </li>
        ))}
      </ol>
    </div>
  </section>
);

export default InspectionSteps;
