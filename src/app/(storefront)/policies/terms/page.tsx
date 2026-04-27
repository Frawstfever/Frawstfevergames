import { connectDB } from "@/lib/mongodb";
import { getSettings } from "@/models/Settings";
import PolicyPageLayout from "../_components/PolicyPageLayout";

const DEFAULT = `Welcome to Frawst Fever Games. By creating an account or using our services, you agree to the following terms:

1. Account & Use
You are responsible for maintaining the confidentiality of your account and password. You agree to provide accurate, current, and complete information when signing up.

2. Purchases
All sales are subject to product availability. Prices are displayed in Canadian Dollars (CAD) and are inclusive of applicable taxes unless stated otherwise. We reserve the right to cancel any order if we detect fraud, pricing errors, or stock issues.

3. Product Condition
We describe pre-owned products as accurately as possible. Minor cosmetic variations may occur. If your item arrives significantly different than described, please contact us within 7 days.

4. Intellectual Property
All site content, including images, text, logos, and the Frawst Fever Games name, are owned by us or our licensors. You may not reproduce or redistribute them without permission.

5. Limitation of Liability
We are not liable for indirect, incidental, or consequential damages arising from your use of our services.

6. Governing Law
These terms are governed by the laws of Canada and the province in which we operate.

7. Changes
We may update these Terms at any time. Continued use of the service after changes take effect means you accept the updated Terms.

Last updated: 2026-04-23`;

export const dynamic = "force-dynamic";

export default async function TermsPage() {
  let content = DEFAULT;
  try {
    await connectDB();
    const s = await getSettings();
    if (s.termsOfService?.trim()) content = s.termsOfService;
  } catch {}
  return <PolicyPageLayout title="Terms of Service" active="terms">{content}</PolicyPageLayout>;
}
