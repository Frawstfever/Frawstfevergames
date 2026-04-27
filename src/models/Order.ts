import mongoose, { Schema, Model, models } from "mongoose";

export interface OrderItem {
  productId: mongoose.Types.ObjectId;
  variantId: string;
  title: string;
  platform: string;
  conditionCode: string;
  sku: string;
  price: number;
  qty: number;
  image?: string;
}

export interface AddressDoc {
  name: string;
  email: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export type OrderStatus =
  | "pending"
  | "paid"
  | "ready_pickup"
  | "shipped"
  | "completed"
  | "cancelled";

export type Fulfillment = "ship" | "pickup";

export interface OrderDoc {
  _id: mongoose.Types.ObjectId;
  orderNumber: string;
  userId?: mongoose.Types.ObjectId;
  stripeSessionId?: string;
  stripePaymentId?: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  fulfillment: Fulfillment;
  contact: AddressDoc;
  status: OrderStatus;
  notes?: string;
  trackingNumber?: string;
  trackingCarrier?: string;
  paidEmailSentAt?: Date;
  shippedEmailSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<OrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: String, required: true },
    title: { type: String, required: true },
    platform: { type: String, required: true },
    conditionCode: { type: String, required: true },
    sku: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
    image: String,
  },
  { _id: false }
);

const AddressSchema = new Schema<AddressDoc>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  { _id: false }
);

const OrderSchema = new Schema<OrderDoc>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    stripeSessionId: { type: String, index: true },
    stripePaymentId: String,
    items: { type: [OrderItemSchema], default: [] },
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    fulfillment: { type: String, enum: ["ship", "pickup"], required: true },
    contact: { type: AddressSchema, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "ready_pickup", "shipped", "completed", "cancelled"],
      default: "pending",
    },
    notes: String,
    trackingNumber: String,
    trackingCarrier: String,
    paidEmailSentAt: Date,
    shippedEmailSentAt: Date,
  },
  { timestamps: true }
);

export const Order: Model<OrderDoc> =
  (models.Order as Model<OrderDoc>) || mongoose.model<OrderDoc>("Order", OrderSchema);
