import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrThrow } from "./users";

export const createOrder = mutation({
  args: {
    userId: v.id("users"),
    stripeSessionId: v.string(),
    totalAmount: v.number(),
    items: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
        price: v.number(),
      })
    ),
  },
  handler: async (ctx, { userId, stripeSessionId, totalAmount, items }) => {
    const orderId = await ctx.db.insert("orders", {
      userId,
      stripeSessionId,
      status: "paid",
      totalAmount,
    });

    await Promise.all(
      items.map((item) =>
        ctx.db.insert("orderItems", {
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })
      )
    );

    return orderId;
  },
});

export const getMyOrders = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    const orders = await ctx.db
      .query("orders")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await ctx.db
          .query("orderItems")
          .withIndex("byOrderId", (q) => q.eq("orderId", order._id))
          .collect();

        const itemsWithProducts = await Promise.all(
          items.map(async (item) => {
            const product = await ctx.db.get(item.productId);
            if (!product) return { ...item, product: null };
            let imageUrl = product.imageUrl ?? "";
            if (product.storageId) {
              imageUrl = (await ctx.storage.getUrl(product.storageId)) ?? imageUrl;
            }
            return { ...item, product: { ...product, imageUrl } };
          })
        );

        return { ...order, items: itemsWithProducts };
      })
    );

    return ordersWithItems;
  },
});

export const updateOrderStatus = mutation({
  args: {
    stripeSessionId: v.string(),
    status: v.union(v.literal("pending"), v.literal("paid"), v.literal("cancelled")),
  },
  handler: async (ctx, { stripeSessionId, status }) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("byStripeSessionId", (q) => q.eq("stripeSessionId", stripeSessionId))
      .unique();

    if (order) {
      await ctx.db.patch(order._id, { status });
    }
  },
});

export const getUserByExternalId = query({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) => {
    return await ctx.db
      .query("users")
      .withIndex("byExternalId", (q) => q.eq("externalId", externalId))
      .unique();
  },
});
