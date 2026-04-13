import React, { useState, useEffect } from 'react';
import { api, PaginatedResponse } from '../services/api';

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  category: number;
  is_featured: boolean;
  product_type: string;
  base_price: number;
  interest_rate: number | null;
}

function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await api.get<PaginatedResponse<Product>>('products/products/');
      setProducts(response.data.results || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get<Category[]>('products/categories/');
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const filteredProducts = selectedCategory
    ? products.filter(product => product.category === parseInt(selectedCategory))
    : products;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-mauve-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-900 font-black uppercase tracking-[0.2em]">Synchronizing Product Matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-mauve-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Banking Products & Services</h1>
          <p className="text-[10px] text-slate-900 font-black uppercase tracking-widest opacity-60">Corporate-grade financial instruments and operational services</p>
        </div>

        {/* Category Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedCategory === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              All Categories
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id.toString())}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedCategory === category.id.toString()
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
                {product.is_featured && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Featured
                  </span>
                )}
              </div>

              <p className="text-[10px] font-bold text-slate-900 uppercase tracking-tight mb-4 opacity-80 leading-relaxed">{product.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Type:</span>
                  <span className="text-[10px] font-black text-blue-700 uppercase">
                    {product.product_type.replace('_', ' ')}
                  </span>
                </div>
                {product.base_price > 0 && (
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Base Price:</span>
                    <span className="text-sm font-black text-slate-900">
                      GHS {product.base_price.toLocaleString()}
                    </span>
                  </div>
                )}
                {product.interest_rate && (
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Yield / Rate:</span>
                    <span className="text-sm font-black text-emerald-700">
                      {product.interest_rate}% APR
                    </span>
                  </div>
                )}
              </div>

              <button className="w-full bg-slate-900 text-white py-3 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-lg shadow-black/10">
                Learn More
              </button>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border-2 border-dashed border-slate-300">
            <div className="text-slate-300 mb-4 opacity-50">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-5.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-2">No instruments classified</h3>
            <p className="text-[10px] text-slate-900 font-bold uppercase tracking-widest opacity-60">Adjust filter parameters or synchronize with the banking core</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;
