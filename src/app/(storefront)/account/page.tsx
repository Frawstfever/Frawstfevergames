import { getCustomerSession } from "@/lib/customer-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutUserButton from "@/components/LogoutUserButton";

export default async function AccountPage() {
  const session = await getCustomerSession();
  if (!session) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Account</h1>
        <LogoutUserButton />
      </div>

      <div className="card p-6 space-y-4 mb-6">
        <div>
          <div className="text-white/50 text-xs uppercase tracking-wider">Name</div>
          <div className="text-lg font-semibold">{session.name}</div>
        </div>
        <div>
          <div className="text-white/50 text-xs uppercase tracking-wider">Email</div>
          <div className="text-lg">{session.email}</div>
          <div className="text-green-400 text-xs mt-0.5">Verified</div>
        </div>
      </div>

      <div className="grid gap-3">
        <Link href="/account/profile" className="card p-5 hover:border-[#9b5cff]/50 transition flex items-center justify-between">
          <div>
            <div className="font-semibold">Edit Profile</div>
            <div className="text-sm text-white/50">Update name, phone, address, and password</div>
          </div>
          <span className="text-white/30 text-xl">→</span>
        </Link>
        <Link href="/account/orders" className="card p-5 hover:border-[#9b5cff]/50 transition flex items-center justify-between">
          <div>
            <div className="font-semibold">My Orders</div>
            <div className="text-sm text-white/50">View your order history and tracking</div>
          </div>
          <span className="text-white/30 text-xl">→</span>
        </Link>
        <Link href="/account/shipping" className="card p-5 hover:border-[#9b5cff]/50 transition flex items-center justify-between">
          <div>
            <div className="font-semibold">Shipping</div>
            <div className="text-sm text-white/50">Track your shipments and delivery status</div>
          </div>
          <span className="text-white/30 text-xl">→</span>
        </Link>
        <Link href="/account/messages" className="card p-5 hover:border-[#9b5cff]/50 transition flex items-center justify-between">
          <div>
            <div className="font-semibold">My Messages</div>
            <div className="text-sm text-white/50">Contact form messages you've sent</div>
          </div>
          <span className="text-white/30 text-xl">→</span>
        </Link>
        <Link href="/cart" className="card p-5 hover:border-[#9b5cff]/50 transition flex items-center justify-between">
          <div>
            <div className="font-semibold">Cart</div>
            <div className="text-sm text-white/50">View items in your cart</div>
          </div>
          <span className="text-white/30 text-xl">→</span>
        </Link>
        <Link href="/shop" className="card p-5 hover:border-[#9b5cff]/50 transition flex items-center justify-between">
          <div>
            <div className="font-semibold">Browse Games</div>
            <div className="text-sm text-white/50">Continue shopping</div>
          </div>
          <span className="text-white/30 text-xl">→</span>
        </Link>
      </div>
    </div>
  );
}
