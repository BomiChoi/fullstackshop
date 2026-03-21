import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const clerkUserId = session.metadata?.clerkUserId;
    const cartItemsRaw = session.metadata?.cartItems;

    if (!clerkUserId || !cartItemsRaw) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const cartItems: Array<{ productId: string; quantity: number; price: number }> =
      JSON.parse(cartItemsRaw);

    const user = await fetchQuery(api.orders.getUserByExternalId, {
      externalId: clerkUserId,
    });

    if (!user) {
      console.error("User not found for clerkUserId:", clerkUserId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const totalAmount = session.amount_total ?? 0;

    await fetchMutation(api.orders.createOrder, {
      userId: user._id,
      stripeSessionId: session.id,
      totalAmount,
      items: cartItems.map((item) => ({
        productId: item.productId as Id<"products">,
        quantity: item.quantity,
        price: item.price,
      })),
    });
  }

  return NextResponse.json({ received: true });
}
