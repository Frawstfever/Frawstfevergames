import mongoose, { Schema, Model, models } from "mongoose";

export interface SettingsDoc {
  _id: mongoose.Types.ObjectId;
  // Store identity
  storeName: string;
  storeTagline: string;
  storeDescription: string;
  contactEmail: string;
  contactPhone: string;
  // Location / pickup (also used as shipping origin for live rate calculation)
  pickupCity: string;
  pickupAddress: string;
  pickupLine1: string;
  pickupLine2: string;
  pickupPostalCode: string;
  pickupProvince: string;
  pickupCountry: string;
  pickupAvailable: boolean;
  // Commerce
  currency: string;
  taxRate: number; // percentage (e.g. 8.5)
  freeShippingThreshold: number; // in dollars; 0 = disabled
  // Homepage content
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroButtonLink: string;
  announcementBar: string; // text shown at top of site
  announcementBarEnabled: boolean;
  // Social / footer
  socialInstagram: string;
  socialTwitter: string;
  socialFacebook: string;
  socialTiktok: string;
  // Policies / legal links
  returnPolicy: string;
  shippingPolicy: string;
  privacyPolicy: string;
  termsOfService: string;
  // Features / toggles
  maintenanceMode: boolean;
  allowGuestCheckout: boolean;
  showSoldOutProducts: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<SettingsDoc>(
  {
    storeName: { type: String, default: "Frawst Fever Games" },
    storeTagline: { type: String, default: "Pre-owned and new video games" },
    storeDescription: { type: String, default: "" },
    contactEmail: { type: String, default: "contact@frawstfevergames.ca" },
    contactPhone: { type: String, default: "" },

    pickupCity: { type: String, default: "" },
    pickupAddress: { type: String, default: "" },
    pickupLine1: { type: String, default: "" },
    pickupLine2: { type: String, default: "" },
    pickupPostalCode: { type: String, default: "" },
    pickupProvince: { type: String, default: "" },
    pickupCountry: { type: String, default: "CA" },
    pickupAvailable: { type: Boolean, default: true },

    currency: { type: String, default: "USD" },
    taxRate: { type: Number, default: 0 },
    freeShippingThreshold: { type: Number, default: 0 },

    heroTitle: { type: String, default: "Retro games. Sharp prices." },
    heroSubtitle: { type: String, default: "Shop pre-owned classics or grab something new." },
    heroButtonText: { type: String, default: "Shop now" },
    heroButtonLink: { type: String, default: "/shop" },
    announcementBar: { type: String, default: "" },
    announcementBarEnabled: { type: Boolean, default: false },

    socialInstagram: { type: String, default: "https://www.instagram.com/frawstfevergames" },
    socialTwitter: { type: String, default: "" },
    socialFacebook: { type: String, default: "https://www.facebook.com/frawstfevergames" },
    socialTiktok: { type: String, default: "" },

    returnPolicy: { type: String, default: "" },
    shippingPolicy: { type: String, default: "" },
    privacyPolicy: { type: String, default: "" },
    termsOfService: { type: String, default: "" },

    maintenanceMode: { type: Boolean, default: false },
    allowGuestCheckout: { type: Boolean, default: true },
    showSoldOutProducts: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Settings: Model<SettingsDoc> =
  (models.Settings as Model<SettingsDoc>) ||
  mongoose.model<SettingsDoc>("Settings", SettingsSchema);

/** Get the single settings document, creating it with defaults if missing. */
export async function getSettings() {
  let doc = await Settings.findOne({});
  if (!doc) doc = await Settings.create({});
  return doc;
}
