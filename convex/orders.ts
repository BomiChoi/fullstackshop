import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrThrow } from "./users";

export const createOrder = mutation({
  args: {
    userId: v.id("users"),
    paymentKey: v.string(),
    orderId: v.string(),
    totalAmount: v.number(),
    items: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
        price: v.number(),
      })
    ),
    shippingInfo: v.optional(v.object({
      recipientName: v.string(),
      phone: v.string(),
      zipcode: v.string(),
      address: v.string(),
      detailAddress: v.string(),
    })),
  },
  handler: async (ctx, { userId, paymentKey, orderId, totalAmount, items, shippingInfo }) => {
    const newOrderId = await ctx.db.insert("orders", {
      userId,
      paymentKey,
      orderId,
      status: "paid",
      totalAmount,
      shippingInfo,
    });

    // 재고 검증
    for (const item of items) {
      const product = await ctx.db.get(item.productId);
      if (!product) throw new Error(`상품을 찾을 수 없습니다.`);
      if (product.stock < item.quantity) {
        throw new Error(`'${product.name}' 재고가 부족합니다. (현재 재고: ${product.stock}개)`);
      }
    }

    await Promise.all(
      items.map(async (item) => {
        await ctx.db.insert("orderItems", {
          orderId: newOrderId,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        });

        const product = await ctx.db.get(item.productId);
        if (product) {
          await ctx.db.patch(item.productId, { stock: product.stock - item.quantity });
        }
      })
    );

    return newOrderId;
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
