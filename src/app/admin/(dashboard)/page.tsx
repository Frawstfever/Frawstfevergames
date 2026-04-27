import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { money } from "@/lib/money";
import Link from "next/link";

export const dynamic = "force-dynamic";

type DashboardData = {
  ok: true;
  productCount: number;
  totalUnits: number;
  outOfStock: number;
  inventoryValue: number;
  pendingOrders: number;
  userCount: number;
  recentOrders: any[];
};
type DashboardError = { ok: false; error: string };

async function loadDashboard(): Promise<DashboardData | DashboardError> {
  try {
    await connectDB();
    const [productCount, variantAgg, pendingOrders, userCount, recentOrders] = await Promise.all([
      Product.countDocuments({}),
      Product.aggregate([
        { $unwind: "$variants" },
        {
          $group: {
            _id: null,
            totalUnits: { $sum: "$variants.stock" },
            outOfStock: {
              $sum: { $cond: [{ $eq: ["$variants.stock", 0] }, 1, 0] },
            },
            inventoryValue: {
              $sum: { $multiply: ["$variants.price", "$variants.stock"] },
            },
          },
        },
      ]),
      Order.countDocuments({ status: "pending" }),
      User.countDocuments({}),
      Order.find({}).sort({ createdAt: -1 }).limit(5).lean(),
    ]);
    const agg = variantAgg[0] || { totalUnits: 0, outOfStock: 0, inventoryValue: 0 };
    return {
      ok: true,
      productCount,
      totalUnits: agg.totalUnits,
      outOfStock: agg.outOfStock,
      inventoryValue: agg.inventoryValue,
      pendingOrders,
      userCount,
      recentOrders: JSON.parse(JSON.stringify(recentOrders)),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "DB unreachable" };
  }
}

export default async function AdminDashboard() {
  const data = await loadDashboard();

  if (!data.ok) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <div className="card p-6 border-[#ff3da6]/40">
          <div className="flex items-center gap-2">
            <span className="text-[#ff3da6] text-xl">⚠</span>
            <h2 className="font-semibold">Database unreachable</h2>
          </div>
          <p className="text-white/70 text-sm mt-2">
            The admin shell is up, but MongoDB isn't reachable from this machine.
            You can still navigate around, but product/order data won't load until
            the DB connection is fixed.
          </p>
          <details className="mt-3 text-xs text-white/60">
            <summary className="cursor-pointer">Show driver error</summary>
            <pre className="mt-2 whitespace-pre-wrap">{data.error}</pre>
          </details>
          <ol className="mt-4 list-decimal pl-5 text-sm text-white/80 space-y-1">
            <li>
              Go to{" "}
              <a
                className="underline"
                href="https://cloud.mongodb.com"
                target="_blank"
                rel="noreferrer"
              >
                cloud.mongodb.com
              </a>{" "}
              → your project → <b>Security → Network Access</b>.
            </li>
            <li>
              Click <b>Add IP Address</b> → <b>Allow Access From Anywhere</b> (<code className="font-mono">0.0.0.0/0</code>) → Confirm.
            </li>
            <li>Wait ~30 seconds, then refresh this page.</li>
          </ol>
        </div>

        <div className="card p-5 mt-6 text-sm text-white/80">
          <h2 className="font-semibold mb-2">While you wait, these pages still load:</h2>
          <div className="flex gap-2 flex-wrap">
            <Link href="/admin/products/new" className="btn btn-ghost">+ New product (will fail to save until DB is up)</Link>
            <Link href="/admin/pricing" className="btn btn-ghost">Price sync</Link>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Products", value: data.productCount },
    { label: "Units in stock", value: data.totalUnits },
    { label: "Out-of-stock variants", value: data.outOfStock },
    { label: "Pending orders", value: data.pendingOrders },
    { label: "Users", value: data.userCount },
    { label: "Inventory value", value: money(data.inventoryValue || 0) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <div className="text-xs text-white/60">{s.label}</div>
            <div className="text-xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card p-5 mt-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm nav-link">All orders →</Link>
        </div>
        {data.recentOrders.length === 0 ? (
          <div className="text-white/60 text-sm">No orders yet.</div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Fulfillment</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map((o: any) => (
                <tr key={o._id}>
                  <td className="font-mono text-xs">
                    <Link href={`/admin/orders`} className="hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td>{o.contact?.name}</td>
                  <td>{o.fulfillment === "pickup" ? "📍 Pickup" : "🚚 Ship"}</td>
                  <td>{money(o.total)}</td>
                  <td>
                    <span className="chip">{o.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
