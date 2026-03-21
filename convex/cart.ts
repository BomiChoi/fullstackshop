import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrThrow } from "./users";

export const getCart = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    const items = await ctx.db
      .query("cartItems")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
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

    return itemsWithProducts;
  },
});

export const addToCart = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
  },
  handler: async (ctx, { productId, quantity }) => {
    const user = await getCurrentUserOrThrow(ctx);

    const existing = await ctx.db
      .query("cartItems")
      .withIndex("byUserAndProduct", (q) =>
        q.eq("userId", user._id).eq("productId", productId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { quantity: existing.quantity + quantity });
    } else {
      await ctx.db.insert("cartItems", {
        userId: user._id,
        productId,
        quantity,
      });
    }
  },
});

export const updateQuantity = mutation({
  args: {
    cartItemId: v.id("cartItems"),
    quantity: v.number(),
  },
  handler: async (ctx, { cartItemId, quantity }) => {
    await getCurrentUserOrThrow(ctx);
    if (quantity <= 0) {
      await ctx.db.delete(cartItemId);
    } else {
      await ctx.db.patch(cartItemId, { quantity });
    }
  },
});

export const removeFromCart = mutation({
  args: { cartItemId: v.id("cartItems") },
  handler: async (ctx, { cartItemId }) => {
    await getCurrentUserOrThrow(ctx);
    await ctx.db.delete(cartItemId);
  },
});

export const clearCart = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    const items = await ctx.db
      .query("cartItems")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .collect();

    await Promise.all(items.map((item) => ctx.db.delete(item._id)));
  },
});
