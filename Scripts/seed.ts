/* eslint-disable no-console */
import mongoose from "mongoose";
import { Product } from "../src/models/Product";
import { slugify, randomSuffix } from "../src/lib/slug";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Set MONGODB_URI in .env.local");
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || "retro_rack" });
  console.log("Connected.");

  const samples = [
    {
      title: "Grand Theft Auto V",
      platform: "PS4",
      publisher: "Rockstar Games",
      releaseYear: 2014,
      genre: ["Action", "Open World"],
      coverImage: "https://upload.wikimedia.org/wikipedia/en/a/a5/Grand_Theft_Auto_V.png",
      description:
        "Enter the lives of three distinct criminals as they risk everything in a series of daring and dangerous heists.",
      weightGrams: 120,
      localPickupAvailable: true,
      featured: true,
      variants: [
        { conditionCode: "NEW", sku: "GTA5-PS4-NEW-01", price: 24.99, stock: 2, hasBox: true, hasManual: true, hasDisc: true },
        { conditionCode: "VG_CM", sku: "GTA5-PS4-VGCM-01", price: 16.99, stock: 5, hasBox: true, hasManual: true, hasDisc: true },
        { conditionCode: "VG_NM", sku: "GTA5-PS4-VGNM-01", price: 13.99, stock: 3, hasBox: true, hasManual: false, hasDisc: true },
        { conditionCode: "DO",    sku: "GTA5-PS4-DO-01",   price: 9.99,  stock: 4, hasBox: false, hasManual: false, hasDisc: true },
      ],
    },
    {
      title: "The Legend of Zelda: Breath of the Wild",
      platform: "Switch",
      publisher: "Nintendo",
      releaseYear: 2017,
      genre: ["Action-Adventure"],
      coverImage: "https://upload.wikimedia.org/wikipedia/en/c/c6/The_Legend_of_Zelda_Breath_of_the_Wild.jpg",
      description: "Step into a world of discovery, exploration and adventure.",
      weightGrams: 90,
      localPickupAvailable: true,
      featured: true,
      variants: [
        { conditionCode: "LN",    sku: "BOTW-SW-LN-01", price: 44.99, stock: 2, hasBox: true, hasManual: true, hasDisc: true },
        { conditionCode: "VG_CM", sku: "BOTW-SW-VGCM-01", price: 38.99, stock: 1, hasBox: true, hasManual: true, hasDisc: true },
      ],
    },
    {
      title: "Super Mario 64",
      platform: "N64",
      publisher: "Nintendo",
      releaseYear: 1996,
      genre: ["Platformer"],
      coverImage: "https://upload.wikimedia.org/wikipedia/en/6/6a/Super_Mario_64_box_cover.jpg",
      description: "The original 3D Mario platformer. Cartridge condition varies — check the variant notes.",
      weightGrams: 150,
      localPickupAvailable: true,
      featured: false,
      variants: [
        { conditionCode: "CIB", sku: `SM64-N64-CIB-${randomSuffix(3)}`, price: 129.99, stock: 1, notes: "Box complete, manual has a small crease", hasBox: true, hasManual: true, hasDisc: true },
        { conditionCode: "DO",  sku: `SM64-N64-DO-${randomSuffix(3)}`,  price: 35.99,  stock: 3, notes: "Cartridge only, cleaned & tested", hasBox: false, hasManual: false, hasDisc: true },
      ],
    },
    {
      title: "Halo: Combat Evolved",
      platform: "Xbox",
      publisher: "Microsoft",
      releaseYear: 2001,
      genre: ["FPS"],
      coverImage: "https://upload.wikimedia.org/wikipedia/en/f/f4/Halo_-_Combat_Evolved_%28XBox_version_-_box_art%29.jpg",
      description: "The game that defined a console. Original Xbox disc.",
      weightGrams: 140,
      localPickupAvailable: true,
      variants: [
        { conditionCode: "VG_NM", sku: "HALO-XB-VGNM-01", price: 14.99, stock: 2, hasBox: true, hasManual: false, hasDisc: true },
        { conditionCode: "WU",    sku: "HALO-XB-WU-01",   price: 8.99,  stock: 2, notes: "Disc has light scratches, plays fine", hasBox: true, hasManual: false, hasDisc: true },
      ],
    },
  ];

  for (const s of samples) {
    let slug = slugify(`${s.title}-${s.platform}`);
    if (await Product.exists({ slug })) slug = `${slug}-${randomSuffix()}`;
    await Product.create({ ...s, slug });
    console.log("  +", s.title);
  }

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
