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
    imageUrl: v.optional(v.string()),        // 외부 URL (seed 데이터용)
    storageId: v.optional(v.id("_storage")), // Convex Storage 업로드 이미지
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
    stripeSessionId: v.optional(v.string()),  // legacy
    paymentKey: v.optional(v.string()),        // Toss paymentKey
    orderId: v.optional(v.string()),           // Toss orderId (merchant-generated)
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("cancelled")
    ),
    totalAmount: v.number(),
    shippingInfo: v.optional(v.object({
      recipientName: v.string(),
      phone: v.string(),
      zipcode: v.string(),
      address: v.string(),
      detailAddress: v.string(),
    })),
  })
    .index("byUserId", ["userId"])
    .index("byStripeSessionId", ["stripeSessionId"])
    .index("byPaymentKey", ["paymentKey"]),

  orderItems: defineTable({
    orderId: v.id("orders"),
    productId: v.id("products"),
    quantity: v.number(),
    price: v.number(),
  }).index("byOrderId", ["orderId"]),
});
