"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CategorySchema, CategoryInput } from "@/lib/validations/category";
import { X } from "lucide-react";

interface Props {
  initialData?: CategoryInput & { id: string };
  onClose: () => void;
  onRefresh: () => void;
}

export const CategoryForm = ({ initialData, onClose, onRefresh }: Props) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CategoryInput>({
    resolver: zodResolver(CategorySchema),
    defaultValues: initialData || {
      code: "",
      name: "",
      minLot: null,
      maxLot: null,
      minMrGpNo: null,
      maxMrGpNo: null,
    }
  });

  const onSubmit = async (data: CategoryInput) => {
    try {
      const url = initialData ? `/api/masters/category/${initialData.id}` : "/api/masters/category";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        onRefresh();
        onClose();
      }
    } catch (error) {
      alert("Something went wrong!");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
        {/* Header - Image 16 Color Style */}
        <div className="bg-[#a29bfe] p-4 flex justify-between items-center">
          <h3 className="text-white font-bold uppercase">
            {initialData ? "Category Master | Update" : "Category Master | Entry"}
          </h3>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 uppercase">Category Code</label>
            <input {...register("code")} className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" />
            {errors.code && <p className="text-red-500 text-[10px]">{errors.code.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 uppercase">Category Name</label>
            <input {...register("name")} className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" />
            {errors.name && <p className="text-red-500 text-[10px]">{errors.name.message}</p>}
          </div>

          {/* Numeric Fields Logic */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 uppercase">Min Lot</label>
            <input type="number" {...register("minLot", { valueAsNumber: true })} placeholder="any" className="w-full border rounded p-2 text-sm" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 uppercase">Max Lot</label>
            <input type="number" {...register("maxLot", { valueAsNumber: true })} placeholder="any" className="w-full border rounded p-2 text-sm" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 uppercase">Min MR/GP No</label>
            <input type="number" {...register("minMrGpNo", { valueAsNumber: true })} className="w-full border rounded p-2 text-sm" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 uppercase">Max MR/GP No</label>
            <input type="number" {...register("maxMrGpNo", { valueAsNumber: true })} className="w-full border rounded p-2 text-sm" />
          </div>

          <div className="md:col-span-2 mt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-700 rounded font-bold text-sm">Back</button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded font-bold text-sm shadow-md"
            >
              {isSubmitting ? "Processing..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};