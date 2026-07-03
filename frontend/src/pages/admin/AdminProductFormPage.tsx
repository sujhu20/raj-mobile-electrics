import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiUpload, FiX, FiArrowLeft, FiPlus, FiTrash2 } from 'react-icons/fi';
import api from '../../config/api';
import { APP_NAME, BRANDS, ROUTES } from '../../config/constants';
import { ENDPOINTS } from '../../config/api-endpoints';
import { FormSkeleton } from '../../components/ui/Skeletons';
import toast from 'react-hot-toast';
import type { CategoryBrief, ProductImage } from '../../types';

const productSchema = z.object({
  name: z.string().min(3, 'Product name is required'),
  description: z.string().min(10, 'Description is required'),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().optional(),
  sku: z.string().optional(),
  price: z.coerce.number().positive('Price must be positive'),
  compareAtPrice: z.coerce.number().optional(),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  categoryId: z.string().min(1, 'Category is required'),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  status: z.string().default('ACTIVE'),
  warrantyMonths: z.coerce.number().int().optional(),
  tags: z.string().optional(),
});

interface ProductForm {
  name: string;
  description: string;
  brand: string;
  model?: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
  status: string;
  warrantyMonths?: number;
  tags?: string;
}

export default function AdminProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const [categories, setCategories] = useState<CategoryBrief[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(isEditing); // Block form until product data is loaded
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([{ key: '', value: '' }]);

  useEffect(() => {
    const urls = images.map(img => URL.createObjectURL(img));
    setImageUrls(urls);
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [images]);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProductForm>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: { isActive: true, isFeatured: false, stock: 0, status: 'ACTIVE' },
  });

  useEffect(() => { document.title = `${isEditing ? 'Edit' : 'New'} Product — ${APP_NAME} Admin`; }, [isEditing]);

  useEffect(() => {
    api.get(ENDPOINTS.CATEGORIES.LIST).then(r => setCategories(r.data.data)).catch(() => {});
    if (isEditing && id) {
      setLoading(true);
      api.get(ENDPOINTS.PRODUCTS.ADMIN_DETAIL(id)).then(r => {
        const p = r.data.data;
        reset({
          name: p.name, description: p.description, brand: p.brand, model: p.model,
          sku: p.sku,
          price: Number(p.price), compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
          stock: p.stock, categoryId: p.categoryId, isActive: p.isActive, isFeatured: p.isFeatured,
          status: p.status || 'ACTIVE',
          warrantyMonths: p.warrantyMonths || undefined,
          tags: p.tags?.join(', '),
        });
        setExistingImages(p.images || []);
        // Load specifications
        if (p.specifications && typeof p.specifications === 'object') {
          const entries = Object.entries(p.specifications).map(([k, v]) => ({ key: k, value: String(v) }));
          setSpecs(entries.length > 0 ? entries : [{ key: '', value: '' }]);
        }
      }).catch(() => toast.error('Product not found')).finally(() => setLoading(false));
    }
  }, [id, isEditing, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImages(prev => [...prev, ...files].slice(0, 6));
    }
  };

  const removeImage = (index: number) => setImages(images.filter((_, i) => i !== index));
  const removeExistingImage = async (imgId: string) => {
    if (!id) return;
    try {
      await api.delete(ENDPOINTS.PRODUCTS.ADMIN_DELETE_IMAGE(id, imgId));
      setExistingImages(prev => prev.filter(i => i.id !== imgId));
      toast.success('Image deleted');
    } catch {
      toast.error('Failed to delete image');
    }
  };

  const addSpecRow = () => setSpecs([...specs, { key: '', value: '' }]);
  const removeSpecRow = (index: number) => setSpecs(specs.filter((_, i) => i !== index));
  const updateSpec = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...specs];
    updated[index][field] = val;
    setSpecs(updated);
  };

  const onSubmit = async (data: ProductForm) => {
    setUploading(true);
    try {
      // Build specifications JSON
      const specObj: Record<string, string> = {};
      specs.forEach(s => { if (s.key.trim() && s.value.trim()) specObj[s.key.trim()] = s.value.trim(); });

      // Convert tags string to array
      const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

      const payload: any = {
        name: data.name,
        description: data.description,
        brand: data.brand,
        model: data.model || undefined,
        sku: data.sku || undefined,
        price: data.price,
        compareAtPrice: data.compareAtPrice || undefined,
        stock: data.stock,
        categoryId: data.categoryId,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        specifications: specObj,
        tags: tagsArray,
        status: data.status,
        warrantyMonths: data.warrantyMonths || undefined,
      };

      let productId = id;

      if (isEditing && id) {
        await api.put(ENDPOINTS.PRODUCTS.ADMIN_UPDATE(id), payload);
        toast.success('Product updated');
      } else {
        const { data: created } = await api.post(ENDPOINTS.PRODUCTS.ADMIN_CREATE, payload);
        productId = created.data.id;
        toast.success('Product created');
      }

      // Upload images separately if any
      if (images.length > 0 && productId) {
        const formData = new FormData();
        images.forEach(img => formData.append('images', img));
        await api.post(ENDPOINTS.PRODUCTS.ADMIN_IMAGES(productId), formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      navigate(ROUTES.ADMIN_PRODUCTS);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally { setUploading(false); }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <button onClick={() => navigate(ROUTES.ADMIN_PRODUCTS)} className="flex items-center gap-2 text-sm text-surface-700/60 hover:text-surface-900 mb-4 transition">
          <FiArrowLeft size={16} /> Back to Products
        </button>
        <h1 className="text-2xl font-bold mb-6">Edit Product</h1>
        <FormSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <button onClick={() => navigate(ROUTES.ADMIN_PRODUCTS)} className="flex items-center gap-2 text-sm text-surface-700/60 hover:text-surface-900 mb-4 transition">
        <FiArrowLeft size={16} /> Back to Products
      </button>
      <h1 className="text-2xl font-bold mb-6">{isEditing ? 'Edit Product' : 'Add New Product'}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-surface-200/60 p-6">
          <h2 className="font-bold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Product Name *</label>
              <input {...register('name')} placeholder="e.g. Samsung Galaxy S24 Ultra 256GB" className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-primary-400" />
              {errors.name && <p className="text-danger-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Description *</label>
              <textarea {...register('description')} rows={4} placeholder="Detailed product description..." className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-primary-400 resize-y" />
              {errors.description && <p className="text-danger-500 text-xs mt-1">{errors.description.message}</p>}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Brand *</label>
                <select {...register('brand')} className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-primary-400">
                  <option value="">Select Brand</option>
                  {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  <option value="Other">Other</option>
                </select>
                {errors.brand && <p className="text-danger-500 text-xs mt-1">{errors.brand.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Model</label>
                <input {...register('model')} placeholder="e.g. S24 Ultra" className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-primary-400" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">SKU</label>
                <input {...register('sku')} placeholder="e.g. SM-S24U-256" className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-primary-400 font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Category *</label>
                <select {...register('categoryId')} className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-primary-400">
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.categoryId && <p className="text-danger-500 text-xs mt-1">{errors.categoryId.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Status</label>
                <select {...register('status')} className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-primary-400">
                  <option value="ACTIVE">Active</option>
                  <option value="DRAFT">Draft</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>
              </div>
            </div>
            <div><label className="text-sm font-medium block mb-1">Tags (comma separated)</label><input {...register('tags')} placeholder="flagship, 5g, camera, waterproof" className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-primary-400" /></div>
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="bg-white rounded-2xl border border-surface-200/60 p-6">
          <h2 className="font-bold mb-4">Pricing &amp; Inventory</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div><label className="text-sm font-medium block mb-1">Price (Rs.) *</label><input {...register('price')} type="number" placeholder="89999" className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-primary-400" />{errors.price && <p className="text-danger-500 text-xs mt-1">{errors.price.message}</p>}</div>
            <div><label className="text-sm font-medium block mb-1">Compare Price</label><input {...register('compareAtPrice')} type="number" placeholder="99999" className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-primary-400" /></div>
            <div><label className="text-sm font-medium block mb-1">Stock *</label><input {...register('stock')} type="number" placeholder="50" className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-primary-400" />{errors.stock && <p className="text-danger-500 text-xs mt-1">{errors.stock.message}</p>}</div>
            <div><label className="text-sm font-medium block mb-1">Warranty (months)</label><input {...register('warrantyMonths')} type="number" placeholder="12" className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-primary-400" /></div>
          </div>
          <div className="flex items-center gap-6 mt-4">
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" {...register('isActive')} className="rounded accent-primary-600" /><span className="text-sm font-medium">Active</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" {...register('isFeatured')} className="rounded accent-primary-600" /><span className="text-sm font-medium">Featured</span></label>
          </div>
        </div>

        {/* Specifications Editor */}
        <div className="bg-white rounded-2xl border border-surface-200/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Specifications</h2>
            <button type="button" onClick={addSpecRow} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 text-xs font-medium hover:bg-primary-100 transition">
              <FiPlus size={14} /> Add Field
            </button>
          </div>
          <div className="space-y-2">
            {specs.map((spec, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  value={spec.key}
                  onChange={e => updateSpec(i, 'key', e.target.value)}
                  placeholder="Key (e.g. processor)"
                  className="flex-1 h-10 px-3 rounded-lg border border-surface-200 bg-surface-50 text-sm outline-none focus:border-primary-400"
                />
                <input
                  value={spec.value}
                  onChange={e => updateSpec(i, 'value', e.target.value)}
                  placeholder="Value (e.g. Snapdragon 8 Gen 3)"
                  className="flex-[2] h-10 px-3 rounded-lg border border-surface-200 bg-surface-50 text-sm outline-none focus:border-primary-400"
                />
                <button type="button" onClick={() => removeSpecRow(i)} className="p-2 text-danger-500 hover:bg-danger-50 rounded-lg transition" disabled={specs.length <= 1}>
                  <FiTrash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-surface-700/40 mt-2">Add key-value pairs for product specifications (display, processor, battery, etc.)</p>
        </div>

        {/* Images */}
        <div className="bg-white rounded-2xl border border-surface-200/60 p-6">
          <h2 className="font-bold mb-4">Images</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {existingImages.map(img => (
              <div key={img.id} className="relative aspect-square rounded-xl border border-surface-200 overflow-hidden group">
                <img src={img.url} alt="" className="w-full h-full object-contain p-2" />
                <button type="button" onClick={() => removeExistingImage(img.id)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-danger-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><FiX size={12} /></button>
              </div>
            ))}
            {imageUrls.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-xl border border-surface-200 overflow-hidden group">
                <img src={url} alt="" className="w-full h-full object-contain p-2" />
                <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-danger-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><FiX size={12} /></button>
              </div>
            ))}
            <label className="aspect-square rounded-xl border-2 border-dashed border-surface-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition">
              <FiUpload size={20} className="text-surface-700/40 mb-1" />
              <span className="text-xs text-surface-700/40">Upload</span>
              <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="submit" disabled={uploading} className="px-8 py-3 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition disabled:opacity-50">
            {uploading ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
          </button>
          <button type="button" onClick={() => navigate(ROUTES.ADMIN_PRODUCTS)} className="px-8 py-3 rounded-xl bg-surface-100 font-semibold hover:bg-surface-200 transition">Cancel</button>
        </div>
      </form>
    </div>
  );
}
