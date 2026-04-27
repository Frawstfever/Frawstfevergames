export default function AboutPage() {
  const city = process.env.STORE_LOCAL_PICKUP_CITY || "your local area";
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 prose prose-invert">
      <h1 className="text-3xl font-bold">About the shop</h1>
      <p className="text-white/80">
        Hand-picked pre-owned and sealed video games. Every listing shows the
        exact condition (CIB, VG with manual, disc-only, etc.) so you know
        what you're getting.
      </p>
      <h2 className="text-xl font-semibold mt-6">Shipping & pickup</h2>
      <p className="text-white/80">
        We ship nationwide via USPS / Ground. Local pickup is available in {city} —
        choose it at checkout to skip the shipping fee.
      </p>
      <h2 className="text-xl font-semibold mt-6">Condition grading</h2>
      <ul className="text-white/80">
        <li><b>New / Sealed</b> — factory sealed, never opened.</li>
        <li><b>CIB</b> — complete in box with case &amp; manual.</li>
        <li><b>VG w/ Manual</b> — very good, includes manual.</li>
        <li><b>VG no Manual</b> — very good, no manual.</li>
        <li><b>Good / Well Used</b> — playable, cosmetic wear.</li>
        <li><b>Disc / Cart Only</b> — game only, no case or manual.</li>
      </ul>
    </div>
  );
}
