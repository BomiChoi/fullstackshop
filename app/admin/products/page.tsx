"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import ImageUpload from "@/components/ImageUpload";
import ConfirmModal from "@/components/ConfirmModal";

type Product = {
  _id: Id<"products">;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  storageId?: Id<"_storage">;
};

type FormState = {
  name: string;
  description: string;
  price: string;
  stock: string;
  storageId?: Id<"_storage">;
  imageUrl: string;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  price: "",
  stock: "",
  storageId: undefined,
  imageUrl: "",
};

export default function AdminProductsPage() {
  const products = useQuery(api.products.listProducts);
  const createProduct = useMutation(api.products.createProduct);
  const updateProduct = useMutation(api.products.updateProduct);
  const deleteProduct = useMutation(api.products.deleteProduct);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"products"> | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<Id<"products"> | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ id: Id<"products">; name: string } | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p._id);
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      stock: String(p.stock),
      storageId: p.storageId,
      imageUrl: p.imageUrl,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        storageId: form.storageId,
        imageUrl: form.storageId ? undefined : form.imageUrl || undefined,
      };

      if (editingId) {
        await updateProduct({ id: editingId, ...payload });
      } else {
        await createProduct(payload);
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmTarget) return;
    setDeletingId(confirmTarget.id);
    try {
      await deleteProduct({ id: confirmTarget.id });
      setConfirmTarget(null);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">상품 관리</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          + 상품 추가
        </button>
      </div>

      {/* 상품 목록 */}
      {products === undefined ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">이미지</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">상품명</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">가격</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">재고</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="text-gray-400 truncate max-w-xs">{p.description}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {p.price.toLocaleString("ko-KR")}원
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={p.stock <= 5 ? "text-red-500 font-medium" : "text-gray-700"}>
                      {p.stock}개
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => openEdit(p)}
                        className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => setConfirmTarget({ id: p._id, name: p.name })}
                        disabled={deletingId === p._id}
                        className="px-3 py-1.5 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {deletingId === p._id ? "삭제 중..." : "삭제"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    등록된 상품이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        open={confirmTarget !== null}
        title="상품 삭제"
        message={`"${confirmTarget?.name}" 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        loading={deletingId !== null}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmTarget(null)}
      />

      {/* 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? "상품 수정" : "상품 추가"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* 이미지 업로드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">상품 이미지</label>
                <ImageUpload
                  currentImageUrl={form.imageUrl || undefined}
                  onUploadComplete={(storageId, previewUrl) => {
                    setForm((f) => ({ ...f, storageId, imageUrl: previewUrl }));
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상품명 *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="상품명을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명 *</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                  placeholder="상품 설명을 입력하세요"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">가격 (원) *</label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">재고 (개) *</label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {saving ? "저장 중..." : editingId ? "수정 완료" : "상품 등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
