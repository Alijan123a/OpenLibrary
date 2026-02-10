"use client";

import { useState } from "react";
import Modal from "./Modal";
import { FaUpload, FaCalendar } from "react-icons/fa";
import { booksApi, type CreateBookData } from "@/lib/books";

interface CreateBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateBookModal({ isOpen, onClose, onSuccess }: CreateBookModalProps) {
  const [formData, setFormData] = useState<CreateBookData>({
    title: "",
    author: "",
    publishedDate: "",
    isbn: "",
    description: "",
    publisher: "",
    language: "Persian",
    coverImage: null,
    totalCopies: 1,
    price: 0
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof CreateBookData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, coverImage: file }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "عنوان کتاب الزامی است";
    }

    if (!formData.author.trim()) {
      newErrors.author = "نام نویسنده الزامی است";
    }

    if (!formData.description.trim()) {
      newErrors.description = "توضیحات کتاب الزامی است";
    }

    if (formData.totalCopies < 1) {
      newErrors.totalCopies = "تعداد کل نسخه‌ها باید حداقل 1 باشد";
    }

    if (formData.price < 0) {
      newErrors.price = "قیمت نمی‌تواند منفی باشد";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await booksApi.createBook(formData);
      
      // Reset form
      setFormData({
        title: "",
        author: "",
        publishedDate: "",
        isbn: "",
        description: "",
        publisher: "",
        language: "Persian",
        coverImage: null,
        totalCopies: 1,
        price: 0
      });
      setErrors({});
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error("خطا در ایجاد کتاب:", error);
      // You can set a general error state here if needed
      setErrors(prev => ({ 
        ...prev, 
        general: error instanceof Error ? error.message : "خطای ناشناخته رخ داد" 
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="ایجاد کتاب جدید" maxWidth="max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Error Message */}
        {errors.general && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            عنوان کتاب <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-500 ${
              errors.title ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="عنوان کتاب را وارد کنید"
            disabled={isSubmitting}
          />
          {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
        </div>

        {/* Author */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            نویسنده <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.author}
            onChange={(e) => handleInputChange("author", e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-500 ${
              errors.author ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="نام نویسنده را وارد کنید"
            disabled={isSubmitting}
          />
          {errors.author && <p className="mt-1 text-sm text-red-500">{errors.author}</p>}
        </div>

        {/* Published Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            تاریخ انتشار
          </label>
          <div className="relative">
            <input
              type="date"
              value={formData.publishedDate}
              onChange={(e) => handleInputChange("publishedDate", e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              disabled={isSubmitting}
            />
            <FaCalendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>
        </div>

        {/* ISBN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            شابک (ISBN)
          </label>
          <input
            type="text"
            value={formData.isbn}
            onChange={(e) => handleInputChange("isbn", e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-500"
            placeholder="شابک کتاب را وارد کنید"
            disabled={isSubmitting}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            توضیحات <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            rows={4}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-vertical placeholder-gray-500 ${
              errors.description ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="خلاصه یا توضیحات کتاب"
            disabled={isSubmitting}
          />
          {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
        </div>

        {/* Publisher */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ناشر
          </label>
          <input
            type="text"
            value={formData.publisher}
            onChange={(e) => handleInputChange("publisher", e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-500"
            placeholder="نام ناشر را وارد کنید"
            disabled={isSubmitting}
          />
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            زبان
          </label>
          <select
            value={formData.language}
            onChange={(e) => handleInputChange("language", e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            disabled={isSubmitting}
          >
            <option value="Persian">فارسی</option>
            <option value="English">انگلیسی</option>
            <option value="Arabic">عربی</option>
            <option value="French">فرانسوی</option>
            <option value="German">آلمانی</option>
            <option value="Other">سایر</option>
          </select>
        </div>

        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            تصویر جلد
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={isSubmitting}
          />
        </div>

        {/* Total Copies and Price Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Copies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تعداد کل نسخه‌ها
            </label>
            <input
              type="number"
              min="1"
              value={formData.totalCopies}
              onChange={(e) => handleInputChange("totalCopies", parseInt(e.target.value) || 0)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.totalCopies ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500">تعداد کل نسخه‌ها در تمام قفسه‌ها + انبار</p>
            {errors.totalCopies && <p className="mt-1 text-sm text-red-500">{errors.totalCopies}</p>}
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              قیمت
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.price ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500">قیمت کتاب به ریال ایران</p>
            {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            disabled={isSubmitting}
          >
            انصراف
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                در حال ایجاد...
              </>
            ) : (
              "ایجاد کتاب"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}