import Link from "next/link";

export default async function Success({
  searchParams,
}: {
  searchParams: Promise<{ n?: string; session_id?: string }>;
}) {
  const { n, session_id } = await searchParams;
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
        <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold">
        {session_id ? "Payment successful!" : "Order received!"}
      </h1>
      <p className="text-white/70 mt-3">
        Your order <span className="font-mono text-white font-bold">{n || ""}</span> has been placed.
        {session_id
          ? " Your payment has been processed. We'll ship your items soon!"
          : " We'll email you shortly with updates."}
      </p>
      <div className="flex gap-3 justify-center mt-8">
        <Link href="/account/orders" className="btn btn-ghost">View my orders</Link>
        <Link href="/shop" className="btn btn-primary">Keep shopping</Link>
      </div>
    </div>
  );
}
