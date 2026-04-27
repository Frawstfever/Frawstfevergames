import mongoose, { Schema, Model, models } from "mongoose";

export interface ContactMessageDoc {
  _id: mongoose.Types.ObjectId;
  email: string;
  title: string;
  content: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ContactMessageSchema = new Schema<ContactMessageDoc>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    title: { type: String, required: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 5000 },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const ContactMessage: Model<ContactMessageDoc> =
  (models.ContactMessage as Model<ContactMessageDoc>) ||
  mongoose.model<ContactMessageDoc>("ContactMessage", ContactMessageSchema);
