import mongoose, { Schema, Model, models } from "mongoose";

export interface VariantDoc {
  _id?: mongoose.Types.ObjectId;
  conditionCode: string;
  label?: string;
  sku: string;
  price: number;
  stock: number;
  notes?: string;
  hasManual?: boolean;
  hasBox?: boolean;
  hasDisc?: boolean;
}

export interface ProductDoc {
  _id: mongoose.Types.ObjectId;
  slug: string;
  title: string;
  platform: string;
  genre: string[];
  releaseYear?: number;
  publisher?: string;
  coverImage: string;
  images: string[];
  description: string;
  variants: VariantDoc[];
  weightGrams: number;
  localPickupAvailable: boolean;
  externalPriceUrl?: string;
  priceChartingId?: string;
  referencePrice?: number;
  pcLoose?: number;
  pcCIB?: number;
  pcNew?: number;
  lastPriceSyncAt?: Date;
  featured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema<VariantDoc>(
  {
    conditionCode: { type: String, required: true },
    label: String,
    sku: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    notes: String,
    hasManual: { type: Boolean, default: false },
    hasBox: { type: Boolean, default: false },
    hasDisc: { type: Boolean, default: true },
  },
  { _id: true }
);

const ProductSchema = new Schema<ProductDoc>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    platform: { type: String, required: true, index: true },
    genre: { type: [String], default: [] },
    releaseYear: Number,
    publisher: String,
    coverImage: { type: String, default: "" },
    images: { type: [String], default: [] },
    description: { type: String, default: "" },
    variants: { type: [VariantSchema], default: [] },
    weightGrams: { type: Number, default: 180 },
    localPickupAvailable: { type: Boolean, default: true },
    externalPriceUrl: String,
    priceChartingId: { type: String, index: true },
    referencePrice: Number,
    pcLoose: Number,
    pcCIB: Number,
    pcNew: Number,
    lastPriceSyncAt: Date,
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ProductSchema.index({ title: "text", description: "text", publisher: "text" });

export const Product: Model<ProductDoc> =
  (models.Product as Model<ProductDoc>) ||
  mongoose.model<ProductDoc>("Product", ProductSchema);
