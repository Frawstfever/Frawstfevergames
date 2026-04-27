import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Settings, getSettings } from "@/models/Settings";

export async function GET() {
  await connectDB();
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  await connectDB();

  // Only allow updating known, safe keys (no _id, timestamps, etc.)
  const allowed = [
    "storeName", "storeTagline", "storeDescription", "contactEmail", "contactPhone",
    "pickupCity", "pickupAddress", "pickupLine1", "pickupLine2",
    "pickupPostalCode", "pickupProvince", "pickupCountry", "pickupAvailable",
    "currency", "taxRate", "freeShippingThreshold",
    "heroTitle", "heroSubtitle", "heroButtonText", "heroButtonLink",
    "announcementBar", "announcementBarEnabled",
    "socialInstagram", "socialTwitter", "socialFacebook", "socialTiktok",
    "returnPolicy", "shippingPolicy", "privacyPolicy", "termsOfService",
    "maintenanceMode", "allowGuestCheckout", "showSoldOutProducts",
  ];

  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const doc = await Settings.findOneAndUpdate({}, { $set: update }, { new: true, upsert: true });
  return NextResponse.json(doc);
}
