import Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe";

export type StripePlanSnapshot = {
  name: string;
  description: string | null;
  amount_cents: number | null;
  currency: string;
  interval: string;
  marketing_features: string[];
};

function normalizeMarketingFeatures(product: Stripe.Product | Stripe.DeletedProduct) {
  if ("deleted" in product) {
    return [];
  }

  const features = product.marketing_features || [];
  return features
    .map((feature) => feature.name)
    .filter((name): name is string => Boolean(name && name.trim()));
}

function resolveInterval(price: Stripe.Price) {
  return price.recurring?.interval || "month";
}

export async function fetchStripePlanSnapshot(stripePriceId: string): Promise<StripePlanSnapshot> {
  const stripe = getStripeClient();
  const price = await stripe.prices.retrieve(stripePriceId, {
    expand: ["product"],
  });

  if (!price.active) {
    throw new Error("Stripe price esta inativo");
  }

  if (!price.recurring) {
    throw new Error("Stripe price precisa ser recorrente para assinatura");
  }

  const product =
    typeof price.product === "string" ? await stripe.products.retrieve(price.product) : price.product;

  if ("deleted" in product) {
    throw new Error("Produto Stripe removido");
  }

  if (!product.active) {
    throw new Error("Produto Stripe esta inativo");
  }

  const name = product.name?.trim() || price.nickname?.trim() || stripePriceId;
  const description = product.description?.trim() || null;

  return {
    name,
    description,
    amount_cents: price.unit_amount ?? null,
    currency: (price.currency || "brl").toLowerCase(),
    interval: resolveInterval(price),
    marketing_features: normalizeMarketingFeatures(product),
  };
}
