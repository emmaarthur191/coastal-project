import React, { useState, useEffect } from 'react';
import { api, PaginatedResponse } from '../services/api';
import { BarChart3, Clock, CheckCircle2, ShieldAlert, Award } from 'lucide-react';

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
    ? products.filter((product) => product.category === parseInt(selectedCategory))
    : products;

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-blue-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center transition-colors duration-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-amber-500 mx-auto"></div>
          <p className="mt-4 text-slate-900 dark:text-slate-300 font-black uppercase tracking-[0.2em] text-xs">
            Synchronizing Product Matrix...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6 transition-colors duration-500">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Block */}
        <div className="bg-white/80 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 shadow-lg p-6 backdrop-blur-md relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 dark:bg-amber-500/5 rounded-full blur-2xl" />
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <Award className="w-7 h-7 text-blue-600 dark:text-amber-500" />
            Banking Products & Services
          </h1>
          <p className="text-[9px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest mt-1">
            Corporate-grade financial instruments and operational services
          </p>
        </div>

        {/* Category Filter */}
        <div className="bg-white/80 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 shadow-lg p-6 backdrop-blur-md">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all duration-300 ${
                selectedCategory === ''
                  ? 'bg-blue-600 text-white dark:bg-amber-500 dark:text-slate-950 shadow-md shadow-blue-500/10 dark:shadow-amber-500/10'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800/60 dark:text-slate-350 dark:hover:bg-slate-700/80'
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id.toString())}
                className={`px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all duration-300 ${
                  selectedCategory === category.id.toString()
                    ? 'bg-blue-600 text-white dark:bg-amber-500 dark:text-slate-950 shadow-md shadow-blue-500/10 dark:shadow-amber-500/10'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800/60 dark:text-slate-350 dark:hover:bg-slate-700/80'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white/80 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 shadow-lg p-6 hover:shadow-xl dark:hover:border-amber-500/30 transition-all duration-300 backdrop-blur-md flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between mb-4 gap-2">
                  <h3 className="text-md font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 dark:group-hover:text-amber-500 transition-colors">
                    {product.name}
                  </h3>
                  {product.is_featured && (
                    <span className="bg-blue-50 dark:bg-amber-500/10 text-blue-700 dark:text-amber-400 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-blue-200/50 dark:border-amber-500/20 shrink-0">
                      Featured
                    </span>
                  )}
                </div>

                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight mb-5 leading-relaxed line-clamp-3 min-h-[45px]">
                  {product.description}
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800/60">
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest">
                      Type:
                    </span>
                    <span className="text-[9px] font-black text-blue-600 dark:text-amber-500 uppercase tracking-wider">
                      {product.product_type.replace('_', ' ')}
                    </span>
                  </div>
                  {product.base_price > 0 && (
                    <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800/60">
                      <span className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest">
                        Base Price:
                      </span>
                      <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                        GHS {product.base_price.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {product.interest_rate && (
                    <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800/60">
                      <span className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest">
                        Yield / Rate:
                      </span>
                      <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 font-mono">
                        {product.interest_rate}% APR
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button className="w-full bg-slate-900 hover:bg-slate-950 text-white dark:bg-slate-800 dark:hover:bg-slate-700/80 dark:text-slate-200 py-3 px-4 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all shadow-md group-hover:scale-[1.01]">
                Learn More
              </button>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="bg-white/80 dark:bg-slate-900/40 rounded-2xl shadow-lg p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800/60 backdrop-blur-md">
            <div className="text-slate-300 dark:text-slate-600 mb-4 opacity-50 flex justify-center">
              <ShieldAlert className="w-16 h-16" />
            </div>
            <h3 className="text-md font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">
              No instruments classified
            </h3>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest opacity-60">
              Adjust filter parameters or synchronize with the banking core
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;
