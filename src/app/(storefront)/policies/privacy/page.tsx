import { connectDB } from "@/lib/mongodb";
import { getSettings } from "@/models/Settings";
import PolicyPageLayout from "../_components/PolicyPageLayout";

const DEFAULT = `Your privacy matters to us. This policy describes how we collect, use, and protect your information.

1. Information We Collect
- Account info: name, email, password (encrypted), phone, shipping address
- Order info: items purchased, payment method (processed by Stripe — we never store card numbers), order history
- Usage info: pages visited, browser type (via standard web logs)

2. How We Use It
- To process and ship your orders
- To send order confirmations, shipping updates, and account notifications
- To respond to your support requests
- To improve our service and detect fraud

3. Sharing
We do not sell your personal information. We share data only with:
- Payment processors (Stripe) to complete your purchase
- Shipping carriers (Canada Post and similar) to deliver your orders
- Service providers (email, hosting) under strict confidentiality

4. Your Rights (PIPEDA compliance)
As a Canadian resident you have the right to:
- Access the personal information we hold about you
- Request corrections to inaccurate data
- Withdraw consent and request deletion
- File a complaint with the Office of the Privacy Commissioner of Canada (priv.gc.ca)

5. Cookies
We use essential cookies to keep you signed in and to remember your cart. You can disable cookies in your browser, but some features may not work.

6. Security
We use industry-standard encryption and secure storage. No system is 100% secure, but we take reasonable measures to protect your information.

7. Contact
For privacy-related questions, contact us at contact@frawstfevergames.ca

Last updated: 2026-04-23`;

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  let content = DEFAULT;
  try {
    await connectDB();
    const s = await getSettings();
    if (s.privacyPolicy?.trim()) content = s.privacyPolicy;
  } catch {}
  return <PolicyPageLayout title="Privacy Policy" active="privacy">{content}</PolicyPageLayout>;
}
