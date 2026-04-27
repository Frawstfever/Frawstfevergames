import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "retro_rack";

if (!MONGODB_URI) {
  // eslint-disable-next-line no-console
  console.warn("[mongodb] MONGODB_URI is not set — DB calls will fail until you set it.");
}

type Cached = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = global as unknown as { _mongoose?: Cached };
const cached: Cached = globalWithMongoose._mongoose ?? { conn: null, promise: null };
globalWithMongoose._mongoose = cached;

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI as string, {
      dbName: MONGODB_DB,
      bufferCommands: false,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
