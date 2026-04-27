import { connectDB } from "@/lib/mongodb";
import { getSettings } from "@/models/Settings";
import PolicyPageLayout from "../_components/PolicyPageLayout";

const DEFAULT = `We want you to be happy with your purchase. Returns are accepted within 14 days of delivery for items in their original condition.

How to return an item
1. Email contact@frawstfevergames.ca with your order number and reason for return within 14 days of receiving the item
2. We'll reply with a return address and a return authorization number
3. Ship the item back in its original packaging

Who pays for return shipping
- If the item arrived damaged, defective, or not as described: we cover return shipping
- For change-of-mind returns: buyer is responsible for return shipping
- Original shipping fees are non-refundable unless the error was ours

Refunds
Once we receive and inspect the returned item, we'll issue a refund to your original payment method within 5 business days. Refunds typically appear on your statement within 3-10 business days after that, depending on your bank.

Non-returnable items
- Opened collectibles
- Digital goods / codes
- Items marked "final sale"
- Damage caused by the buyer after delivery

Exchanges
If you'd like to exchange an item for a different condition or title, please contact us. We'll treat it as a return + new order.

Last updated: 2026-04-23`;

export const dynamic = "force-dynamic";

export default async function ReturnsPage() {
  let content = DEFAULT;
  try {
    await connectDB();
    const s = await getSettings();
    if (s.returnPolicy?.trim()) content = s.returnPolicy;
  } catch {}
  return <PolicyPageLayout title="Return Policy" active="returns">{content}</PolicyPageLayout>;
}
