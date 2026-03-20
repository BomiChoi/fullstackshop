# FullStack Shop — MVP 프로젝트 기획

## 프로젝트 개요

Next.js + Convex + Clerk + Stripe 기반의 풀스택 쇼핑몰 MVP.
사용자가 상품을 둘러보고, 장바구니에 담아, Stripe로 결제할 수 있는 기본 흐름을 구현한다.

---

## 핵심 기능 (MVP 범위)

### 1. 인증
- Clerk 기반 회원가입 / 로그인 / 로그아웃
- 로그인한 사용자만 주문 및 결제 가능

### 2. 상품
- 상품 목록 페이지 (이미지, 이름, 가격)
- 상품 상세 페이지
- 관리자가 Convex dashboard 또는 seed 스크립트로 상품 등록

### 3. 장바구니
- 상품 담기 / 수량 변경 / 삭제
- 로그인 사용자 기준으로 Convex에 장바구니 저장

### 4. 결제 (Stripe)
- Stripe Checkout을 통한 결제 처리
- 결제 성공 / 실패 페이지
- Stripe Webhook으로 주문 상태 업데이트

### 5. 주문 내역
- 로그인한 사용자의 주문 목록 조회
- 주문별 상태 표시 (결제 완료 / 취소)

---

## 데이터 모델 (Convex)

| 테이블 | 주요 필드 |
|--------|-----------|
| `users` | userId, clerkId, email, name, imageUrl, role, address |
| `products` | productId, name, description, price, imageUrl, stock |
| `cartItems` | cartItemId, userId, productId, quantity, price |
| `orders` | orderId, userId, stripeSessionId, status, totalAmount, createdAt |
| `orderItems` | orderItemId, orderId, productId, quantity, price |

---

## 페이지 구성

| 경로 | 설명 |
|------|------|
| `/` | 상품 목록 (홈) |
| `/products/[id]` | 상품 상세 |
| `/cart` | 장바구니 |
| `/checkout` | Stripe Checkout으로 리다이렉트 |
| `/orders` | 주문 내역 (로그인 필요) |
| `/success` | 결제 성공 안내 |
| `/cancel` | 결제 취소 안내 |

---

## 기술 스택

| 역할 | 기술 |
|------|------|
| Frontend | Next.js (App Router) |
| Backend / DB | Convex |
| 인증 | Clerk |
| 결제 | Stripe Checkout + Webhook |
| 스타일 | Tailwind CSS |

---

## 구현 제외 (MVP 이후)

- 상품 검색 / 필터 / 정렬
- 리뷰 및 평점
- 할인 쿠폰
- 관리자 페이지 UI
- 재고 실시간 관리
