import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    externalId: v.string(), // Clerk user ID
    email: v.optional(v.string()),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    role: v.optional(v.union(v.literal("user"), v.literal("admin"))),
  }).index("byExternalId", ["externalId"]),

  products: defineTable({
    name: v.string(),
    description: v.string(),
    price: v.number(),
    imageUrl: v.string(),
    stock: v.number(),
  }),

  cartItems: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    quantity: v.number(),
  })
    .index("byUserId", ["userId"])
    .index("byUserAndProduct", ["userId", "productId"]),

  orders: defineTable({
    userId: v.id("users"),
    stripeSessionId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("cancelled")
    ),
    totalAmount: v.number(),
  })
    .index("byUserId", ["userId"])
    .index("byStripeSessionId", ["stripeSessionId"]),

  orderItems: defineTable({
    orderId: v.id("orders"),
    productId: v.id("products"),
    quantity: v.number(),
    price: v.number(),
  }).index("byOrderId", ["orderId"]),
});
