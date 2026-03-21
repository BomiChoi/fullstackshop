import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listProducts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("products").collect();
  },
});

export const getProduct = query({
  args: { id: v.id("products") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("products").first();
    if (existing) return; // 이미 데이터가 있으면 스킵

    const products = [
      {
        name: "클래식 화이트 티셔츠",
        description: "부드러운 코튼 소재의 베이직 티셔츠. 어떤 스타일에도 잘 어울리는 필수 아이템.",
        price: 29000,
        imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
        stock: 50,
      },
      {
        name: "슬림핏 데님 팬츠",
        description: "고급 원단으로 제작된 슬림핏 청바지. 편안한 착용감과 세련된 실루엣.",
        price: 79000,
        imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500",
        stock: 30,
      },
      {
        name: "오버사이즈 후드 집업",
        description: "루즈한 핏의 후드 집업. 겨울철 레이어링에 완벽한 아이템.",
        price: 89000,
        imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=500",
        stock: 25,
      },
      {
        name: "린넨 블렌드 셔츠",
        description: "통기성이 뛰어난 린넨 혼방 소재 셔츠. 여름철 비즈니스 캐주얼에 적합.",
        price: 59000,
        imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500",
        stock: 40,
      },
      {
        name: "크루넥 니트 스웨터",
        description: "부드러운 울 혼방 소재의 크루넥 스웨터. 클래식한 디자인으로 오래 입을 수 있는 제품.",
        price: 99000,
        imageUrl: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500",
        stock: 20,
      },
      {
        name: "카고 숏 팬츠",
        description: "실용적인 카고 포켓이 특징인 반바지. 액티브한 라이프스타일에 어울리는 디자인.",
        price: 49000,
        imageUrl: "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=500",
        stock: 35,
      },
    ];

    for (const product of products) {
      await ctx.db.insert("products", product);
    }
  },
});
