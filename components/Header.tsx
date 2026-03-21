"use client";

import Link from "next/link";
import { UserButton, SignInButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function CartBadge() {
  const { isSignedIn } = useUser();
  const cartItems = useQuery(api.cart.getCart, isSignedIn ? {} : "skip");

  const itemCount = cartItems
    ? cartItems.reduce((sum, item) => sum + item.quantity, 0)
    : 0;

  return (
    <Link href="/cart" className="relative inline-flex items-center p-2 hover:bg-gray-100 rounded-lg transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Link>
  );
}

export default function Header() {
  const { isSignedIn } = useUser();
  const currentUser = useQuery(api.users.current, isSignedIn ? {} : "skip");
  const isAdmin = currentUser?.role === "admin";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-gray-900 hover:text-gray-700">
          FullStack Shop
        </Link>

        <nav className="flex items-center gap-1">
          {isAdmin && (
            <Link
              href="/admin/products"
              className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors font-medium"
            >
              관리자
            </Link>
          )}
          {isSignedIn && (
            <Link
              href="/orders"
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              주문내역
            </Link>
          )}
          <CartBadge />
          <div className="ml-2">
            {isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <SignInButton mode="modal">
                <button className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  로그인
                </button>
              </SignInButton>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
