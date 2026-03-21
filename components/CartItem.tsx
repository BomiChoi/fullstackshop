"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface CartItemProps {
  _id: Id<"cartItems">;
  quantity: number;
  product: {
    _id: Id<"products">;
    name: string;
    price: number;
    imageUrl: string;
    stock: number;
  } | null;
}

export default function CartItem({ _id, quantity, product }: CartItemProps) {
  const updateQuantity = useMutation(api.cart.updateQuantity);
  const removeFromCart = useMutation(api.cart.removeFromCart);

  if (!product) return null;

  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
        <p className="text-gray-500 text-sm mt-0.5">
          {product.price.toLocaleString("ko-KR")}원
        </p>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => updateQuantity({ cartItemId: _id, quantity: quantity - 1 })}
            className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
          >
            −
          </button>
          <span className="w-6 text-center text-sm font-medium">{quantity}</span>
          <button
            onClick={() => updateQuantity({ cartItemId: _id, quantity: quantity + 1 })}
            disabled={quantity >= product.stock}
            className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-semibold text-gray-900">
          {(product.price * quantity).toLocaleString("ko-KR")}원
        </p>
        <button
          onClick={() => removeFromCart({ cartItemId: _id })}
          className="text-xs text-red-400 hover:text-red-600 mt-1"
        >
          삭제
        </button>
      </div>
    </div>
  );
}
