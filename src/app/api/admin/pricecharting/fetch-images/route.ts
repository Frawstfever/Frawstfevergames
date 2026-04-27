import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { pcFetchCoverImage } from "@/lib/pricecharting";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/admin/pricecharting/fetch-images
 * Finds all products with a priceChartingId but no coverImage,
 * scrapes cover images from PriceCharting, and updates them.
 * Streams progress via SSE.
 */
export async function POST(_req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send({ type: "status", message: "Finding products missing cover images…" });

        await connectDB();
        const products = await Product.find({
          priceChartingId: { $exists: true, $ne: "" },
          $or: [{ coverImage: "" }, { coverImage: { $exists: false } }],
        });

        const total = products.length;
        send({ type: "init", total });

        if (total === 0) {
          send({ type: "done", processed: 0, total: 0, created: 0, updated: 0, skipped: 0, errors: 0 });
          controller.close();
          return;
        }

        let processed = 0, updated = 0, skipped = 0;
        const errors: string[] = [];

        for (const p of products) {
          try {
            const imgUrl = await pcFetchCoverImage(p.priceChartingId!);
            if (imgUrl) {
              p.coverImage = imgUrl;
              if (!p.images.includes(imgUrl)) p.images.push(imgUrl);
              await p.save();
              updated++;
              processed++;
              send({
                type: "progress", processed, total,
                created: 0, updated, skipped, errors: errors.length,
                log: `Updated "${p.title}" — image found`,
              });
            } else {
              skipped++;
              processed++;
              send({
                type: "progress", processed, total,
                created: 0, updated, skipped, errors: errors.length,
                log: `Skipped "${p.title}" — no image on PriceCharting page`,
              });
            }
          } catch (e: unknown) {
            const errMsg = `${p.title}: ${e instanceof Error ? e.message : "fetch failed"}`;
            errors.push(errMsg);
            processed++;
            send({
              type: "progress", processed, total,
              created: 0, updated, skipped, errors: errors.length,
              log: `ERROR: ${errMsg}`,
            });
          }

          // Small delay to avoid hammering PriceCharting
          await new Promise((r) => setTimeout(r, 300));
        }

        send({ type: "done", processed, total, created: 0, updated, skipped, errors: errors.length });
      } catch (e: unknown) {
        send({ type: "error", message: e instanceof Error ? e.message : "Failed" });
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
