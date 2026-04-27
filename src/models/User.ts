import mongoose, { Schema, Model, models } from "mongoose";

export interface UserDoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  verifyToken?: string;
  verifyTokenExpires?: Date;
  resetToken?: string;
  resetTokenExpires?: Date;
  avatarUrl?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  role: "customer" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    emailVerified: { type: Boolean, default: false },
    verifyToken: String,
    verifyTokenExpires: Date,
    resetToken: String,
    resetTokenExpires: Date,
    avatarUrl: { type: String, default: "" },
    phone: String,
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
  },
  { timestamps: true }
);

export const User: Model<UserDoc> =
  (models.User as Model<UserDoc>) ||
  mongoose.model<UserDoc>("User", UserSchema);
