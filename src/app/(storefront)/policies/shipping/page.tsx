import { connectDB } from "@/lib/mongodb";
import { getSettings } from "@/models/Settings";
import PolicyPageLayout from "../_components/PolicyPageLayout";

const DEFAULT = `We currently ship within Canada only.

Processing time
Orders are processed within 5 business days after payment is confirmed. You'll get an email with tracking when your order ships.

Carrier
Most orders ship via Canada Post. For larger or high-value items we may use UPS or Purolator at our discretion.

Delivery estimates
- Regional / same province: 2-5 business days
- Cross-country (BC ↔ NL): 5-10 business days
- Remote or northern destinations may take longer

Shipping fees
Calculated at checkout based on the package weight and destination. The rate is shown before you pay — there are no hidden fees.

Local pickup
Available for select items. If a product shows "Local pickup available", you can choose pickup at checkout and skip shipping entirely. We'll email you when your order is ready with the pickup address and time window.

Tracking
Once your order ships, you'll receive an email with the tracking number. You can also see tracking in your order history at My Account → My Orders.

Lost or damaged packages
If your package doesn't arrive or arrives damaged, contact us within 7 days of the expected delivery date and we'll work with the carrier to resolve it.

Last updated: 2026-04-23`;

export const dynamic = "force-dynamic";

export default async function ShippingPage() {
  let content = DEFAULT;
  try {
    await connectDB();
    const s = await getSettings();
    if (s.shippingPolicy?.trim()) content = s.shippingPolicy;
  } catch {}
  return <PolicyPageLayout title="Shipping Policy" active="shipping">{content}</PolicyPageLayout>;
}
