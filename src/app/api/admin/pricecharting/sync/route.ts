import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import {
  pcProductById,
  centsToUSD,
  priceForCondition,
} from "@/lib/pricecharting";
import { getUsdToCadRate } from "@/lib/forex";

// Prevent Next.js from caching / statically optimizing this streaming response
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/admin/pricecharting/sync
 * Streams progress via SSE.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    productIds?: string[];
    applyToSellPrice?: boolean;
    markupPct?: number;
    fxRate?: number;       // override — positive number uses this rate
    fxAuto?: boolean;      // when true (default), live rate is fetched
  };
  const applyToSellPrice = !!body.applyToSellPrice;
  const markup = Number(body.markupPct || 0) / 100;
  const manualFx = Number(body.fxRate);
  const useAutoFx = body.fxAuto !== false; // default true

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch { /* controller may be closed */ }
      };
      // Send a comment/heartbeat to flush buffers eagerly
      const heartbeat = () => {
        try { controller.enqueue(encoder.encode(`: ping\n\n`)); } catch {}
      };

      try {
        heartbeat();
        send({ type: "status", message: "Connecting to database…" });

        await connectDB();

        // Resolve FX rate: use manual override if provided & auto is off, else fetch live
        let fxRate = 1;
        if (!useAutoFx && manualFx > 0) {
          fxRate = manualFx;
          send({ type: "status", message: `Using manual FX rate: 1 USD → ${fxRate.toFixed(4)} CAD` });
        } else {
          send({ type: "status", message: "Fetching live USD → CAD rate…" });
          const fx = await getUsdToCadRate();
          fxRate = fx.rate;
          send({ type: "status", message: `Live FX rate: 1 USD → ${fxRate.toFixed(4)} CAD (${fx.source}, as of ${fx.asOf})` });
        }

        send({ type: "status", message: "Loading products…" });

        const filter: Record<string, unknown> = body.productIds?.length
          ? { _id: { $in: body.productIds } }
          : { priceChartingId: { $exists: true, $ne: "" } };
        const products = await Product.find(filter);

        const total = products.length;
        send({ type: "init", total });
        send({ type: "status", message: `Found ${total} product${total === 1 ? "" : "s"} with PriceCharting ID.` });

        if (total === 0) {
          send({
            type: "status",
            message: "No products to sync. Link products to a PriceCharting ID first (edit a product → PriceCharting link), or run the importer.",
          });
          send({ type: "done", processed: 0, total: 0, created: 0, updated: 0, skipped: 0, errors: 0 });
          controller.close();
          return;
        }

        let processed = 0, updated = 0, skipped = 0;
        const errors: string[] = [];

        for (const p of products) {
          if (!p.priceChartingId) {
            skipped++;
            processed++;
            send({ type: "progress", processed, total, created: 0, updated, skipped, errors: errors.length, log: `Skipped "${p.title}" — no PC ID` });
            continue;
          }
          try {
            send({ type: "progress", processed, total, created: 0, updated, skipped, errors: errors.length, log: `Fetching "${p.title}" (${p.priceChartingId})…` });
            const pc = await pcProductById(p.priceChartingId);
            const looseUsd = centsToUSD(pc["loose-price"]);
            const cibUsd = centsToUSD(pc["cib-price"]);
            const neuUsd = centsToUSD(pc["new-price"]);

            // Convert PC USD → store currency (CAD) using fxRate
            const conv = (usd: number | undefined) => usd === undefined ? undefined : Math.round(usd * fxRate * 100) / 100;
            const loose = conv(looseUsd);
            const cib = conv(cibUsd);
            const neu = conv(neuUsd);

            p.pcLoose = loose;
            p.pcCIB = cib;
            p.pcNew = neu;
            p.referencePrice = loose ?? cib ?? neu ?? p.referencePrice;
            p.lastPriceSyncAt = new Date();

            let variantsUpdated = 0;
            if (applyToSellPrice) {
              for (const v of p.variants) {
                const cents = priceForCondition(pc, v.conditionCode);
                const usd = centsToUSD(cents);
                if (usd !== undefined) {
                  v.price = Math.round(usd * fxRate * (1 + markup) * 100) / 100;
                  variantsUpdated++;
                }
              }
            }
            await p.save();
            updated++;
            processed++;
            send({
              type: "progress",
              processed, total, created: 0, updated, skipped, errors: errors.length,
              log: `Updated "${p.title}" — loose C$${loose ?? "?"} / cib C$${cib ?? "?"} / new C$${neu ?? "?"}${variantsUpdated ? ` · ${variantsUpdated} variant price${variantsUpdated === 1 ? "" : "s"} updated` : ""}`,
            });
          } catch (e: unknown) {
            const errMsg = `${p.title}: ${e instanceof Error ? e.message : "failed"}`;
            errors.push(errMsg);
            processed++;
            send({ type: "progress", processed, total, created: 0, updated, skipped, errors: errors.length, log: `ERROR: ${errMsg}` });
          }

          // gentle pacing to avoid PriceCharting rate limiting
          await new Promise((r) => setTimeout(r, 120));
        }

        send({ type: "done", processed, total, created: 0, updated, skipped, errors: errors.length });
      } catch (e: unknown) {
        send({ type: "error", message: e instanceof Error ? e.message : "Sync failed" });
      }
      try { controller.close(); } catch {}
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
