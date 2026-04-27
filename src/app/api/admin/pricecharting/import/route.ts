import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { parseCSV } from "@/lib/csv";
import {
  pcDownloadCustomCSV,
  mapConsoleToPlatform,
  parseFlexPrice,
  pcFetchCoverImage,
} from "@/lib/pricecharting";
import { slugify, randomSuffix } from "@/lib/slug";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/admin/pricecharting/import
 * Streams progress via SSE (Server-Sent Events).
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    dryRun?: boolean;
    limit?: number;
    defaultStock?: number;
    overwrite?: boolean;
  };
  const dryRun = !!body.dryRun;
  const limit = Math.max(1, Math.min(5000, Number(body.limit) || 250));
  const defaultStock = Math.max(0, Math.floor(Number(body.defaultStock) || 0));
  const overwrite = !!body.overwrite;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send({ type: "status", message: "Downloading CSV…" });

        const csv = await pcDownloadCustomCSV();
        const rows = parseCSV(csv);
        if (rows.length === 0) {
          send({ type: "error", message: "CSV is empty" });
          controller.close();
          return;
        }

        await connectDB();

        const total = Math.min(rows.length, limit);
        send({ type: "init", total, csvRows: rows.length, dryRun });

        let processed = 0, created = 0, updated = 0, skipped = 0;
        const errors: string[] = [];

        const slice = rows.slice(0, limit);
        for (const r of slice) {
          const id = (r.id || r["product-id"] || "").trim();
          const title = (r["product-name"] || r.name || "").trim();
          const consoleName = (r["console-name"] || r.console || "").trim();
          if (!id || !title) {
            skipped++;
            processed++;
            send({ type: "progress", processed, total, created, updated, skipped, errors: errors.length, log: `Row skipped — missing id or title` });
            continue;
          }
          const platform = mapConsoleToPlatform(consoleName);
          const loose = parseFlexPrice(r["loose-price"]);
          const cib = parseFlexPrice(r["cib-price"]);
          const neu = parseFlexPrice(r["new-price"]);
          const boxOnly = parseFlexPrice(r["box-only-price"]);
          const manualOnly = parseFlexPrice(r["manual-only-price"]);

          const variants: any[] = [];
          if (neu !== undefined)
            variants.push({
              conditionCode: "NEW",
              sku: `${slugify(title).slice(0, 20)}-NEW-${randomSuffix(3)}`.toUpperCase(),
              price: neu, stock: defaultStock,
              hasBox: true, hasManual: true, hasDisc: true,
            });
          if (cib !== undefined)
            variants.push({
              conditionCode: "CIB",
              sku: `${slugify(title).slice(0, 20)}-CIB-${randomSuffix(3)}`.toUpperCase(),
              price: cib, stock: defaultStock,
              hasBox: true, hasManual: true, hasDisc: true,
            });
          if (loose !== undefined)
            variants.push({
              conditionCode: "DO",
              sku: `${slugify(title).slice(0, 20)}-DO-${randomSuffix(3)}`.toUpperCase(),
              price: loose, stock: defaultStock,
              notes: "Disc/cart only (loose)",
              hasBox: false, hasManual: false, hasDisc: true,
            });
          if (boxOnly !== undefined)
            variants.push({
              conditionCode: "BOX",
              sku: `${slugify(title).slice(0, 20)}-BOX-${randomSuffix(3)}`.toUpperCase(),
              price: boxOnly, stock: defaultStock,
              hasBox: true, hasManual: false, hasDisc: false,
            });
          if (manualOnly !== undefined)
            variants.push({
              conditionCode: "MAN",
              sku: `${slugify(title).slice(0, 20)}-MAN-${randomSuffix(3)}`.toUpperCase(),
              price: manualOnly, stock: defaultStock,
              hasBox: false, hasManual: true, hasDisc: false,
            });

          if (variants.length === 0) {
            skipped++;
            processed++;
            send({ type: "progress", processed, total, created, updated, skipped, errors: errors.length, log: `Skipped "${title}" (${id}) — no valid prices` });
            continue;
          }

          const referencePrice = loose ?? cib ?? neu;

          if (dryRun) {
            processed++;
            send({ type: "progress", processed, total, created, updated, skipped, errors: errors.length, log: `[Dry run] Would import "${title}" (${platform}) — ${variants.length} variant(s)` });
            continue;
          }

          try {
            const existing = await Product.findOne({ priceChartingId: id });
            if (existing) {
              if (!overwrite) {
                skipped++;
                processed++;
                send({ type: "progress", processed, total, created, updated, skipped, errors: errors.length, log: `Skipped "${title}" — already exists` });
                continue;
              }
              existing.title = title;
              existing.platform = platform;
              existing.pcLoose = loose;
              existing.pcCIB = cib;
              existing.pcNew = neu;
              existing.referencePrice = referencePrice ?? existing.referencePrice;
              existing.lastPriceSyncAt = new Date();

              // Fetch cover image if missing
              let imgAdded = false;
              if (!existing.coverImage) {
                try {
                  const img = await pcFetchCoverImage(id);
                  await new Promise((r) => setTimeout(r, 200));
                  if (img) {
                    existing.coverImage = img;
                    if (!existing.images.includes(img)) existing.images.push(img);
                    imgAdded = true;
                  }
                } catch { /* best-effort */ }
              }

              await existing.save();
              updated++;
              processed++;
              send({ type: "progress", processed, total, created, updated, skipped, errors: errors.length, log: `Updated "${title}" (${platform})${imgAdded ? " + cover image" : ""}` });
            } else {
              let base = slugify(`${title}-${platform}`);
              let slug = base;
              while (await Product.exists({ slug })) slug = `${base}-${randomSuffix(3)}`;

              // Fetch cover image from PriceCharting (best-effort, small delay to avoid rate-limit)
              let coverImage = "";
              try {
                coverImage = await pcFetchCoverImage(id);
                await new Promise((r) => setTimeout(r, 200));
              } catch { /* image fetch is best-effort */ }

              await Product.create({
                slug, title, platform,
                priceChartingId: id,
                coverImage, images: coverImage ? [coverImage] : [], description: "",
                genre: r.genre ? [r.genre] : [],
                releaseYear: r["release-date"]
                  ? Number(String(r["release-date"]).slice(0, 4)) || undefined
                  : undefined,
                weightGrams: 180, localPickupAvailable: true,
                variants,
                pcLoose: loose, pcCIB: cib, pcNew: neu,
                referencePrice,
                lastPriceSyncAt: new Date(),
                featured: false,
              });
              created++;
              processed++;
              send({ type: "progress", processed, total, created, updated, skipped, errors: errors.length, log: `Created "${title}" (${platform})${coverImage ? " + cover image" : " — no image found"}` });
            }
          } catch (e: unknown) {
            const errMsg = `${title} (${id}): ${e instanceof Error ? e.message : "save failed"}`;
            errors.push(errMsg);
            processed++;
            send({ type: "progress", processed, total, created, updated, skipped, errors: errors.length, log: `ERROR: ${errMsg}` });
          }
        }

        send({ type: "done", processed, total, created, updated, skipped, errors: errors.length });
      } catch (e: unknown) {
        send({ type: "error", message: e instanceof Error ? e.message : "Import failed" });
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
