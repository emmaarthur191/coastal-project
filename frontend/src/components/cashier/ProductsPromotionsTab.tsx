import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { formatCurrencyGHS } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import GlassCard from '../ui/modern/GlassCard';

interface Product {
  id: string;
  name: string;
  product_type: string;
  product_type_display: string;
  description: string;
  interest_rate?: string | number;
  minimum_balance: string | number;
  maximum_balance?: string | number;
  features?: string[];
  is_active: boolean;
}

interface Promotion {
  id: string;
  name: string;
  description: string;
  discount_percentage?: number;
  bonus_amount?: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface ProductsResponse {
  results?: Product[];
  data?: Product[];
}

interface PromotionsResponse {
  results?: Promotion[];
  data?: Promotion[];
}

interface EnrollmentResponse {
  message?: string;
}

const ProductsPromotionsTab: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedPromotion, setSelectedPromotion] = useState('');
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProducts();
    fetchPromotions();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get<ProductsResponse>('products/products/');
      const data = response.data?.results || response.data || [];
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setMessage({ type: 'error', text: 'Failed to load products' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPromotions = async () => {
    try {
      const response = await api.get<PromotionsResponse>('products/promotions/');
      const data = response.data?.results || response.data || [];
      const activePromos = (Array.isArray(data) ? data : []).filter((p: Promotion) => p.is_active);
      setPromotions(activePromos);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      setPromotions([]);
    }
  };

  const handleProductEnrollment = async () => {
    if (!selectedCustomer || !selectedProduct) {
      setMessage({ type: 'error', text: 'Please select a customer and product' });
      return;
    }

    try {
      setEnrollmentLoading(true);
      await api.post<EnrollmentResponse>('banking/account-openings/', {
        user_id: selectedCustomer,
        product_id: selectedProduct,
        promotion_id: selectedPromotion || null,
        initial_deposit: 0
      });

      setMessage({ type: 'success', text: 'Product enrollment/application submitted successfully!' });
      setSelectedCustomer('');
      setSelectedProduct('');
      setSelectedPromotion('');
    } catch (error: unknown) {
      console.error('Error enrolling product:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setMessage({ type: 'error', text: errorMessage || 'Failed to enroll product/service' });
    } finally {
      setEnrollmentLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-400"><div className="animate-spin text-4xl mb-4">⏳</div>Loading Products...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span>🏦</span> Banking Products & Services
        </h2>
        <p className="text-gray-500">Browse financial products and enroll customers.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl border ${message.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
          {message.text}
        </div>
      )}

      {/* Product Enrollment Section */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-2">New Enrollment</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <Input
              label="Customer ID / Account Number"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              placeholder="Enter customer ID"
            />
          </div>
          <div>
            <label htmlFor="product-select" className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
              Select Product
            </label>
            <select
              id="product-select"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10 transition-all outline-none bg-gray-50"
            >
              <option value="">Choose a product...</option>
              {products.filter(p => p.is_active).map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.product_type_display})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="promotion-select" className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
              Promotion (Optional)
            </label>
            <select
              id="promotion-select"
              value={selectedPromotion}
              onChange={(e) => setSelectedPromotion(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10 transition-all outline-none bg-gray-50"
            >
              <option value="">No promotion</option>
              {promotions.map((promo) => (
                <option key={promo.id} value={promo.id}>
                  {promo.name} - {promo.discount_percentage ? `${promo.discount_percentage}% Off` : `GHS ${promo.bonus_amount} Bonus`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleProductEnrollment}
            disabled={enrollmentLoading || !selectedCustomer || !selectedProduct}
            variant="success"
            className="w-full md:w-auto px-8"
          >
            {enrollmentLoading ? 'Processing...' : 'Start Enrollment 📝'}
          </Button>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products List */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            Available Financial Products
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">{products.filter(p => p.is_active).length}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.filter(p => p.is_active).map((product) => (
              <GlassCard key={product.id} className="p-5 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-800 text-lg">{product.name}</h4>
                  <span className="text-[10px] uppercase font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-full border border-blue-100">
                    {product.product_type_display}
                  </span>
                </div>

                <p className="text-gray-500 text-sm mb-4 line-clamp-2 min-h-[40px]">{product.description}</p>

                <div className="pt-4 border-t border-gray-50 flex justify-between items-center bg-gray-50 -mx-5 -mb-5 p-4 rounded-b-2xl mt-auto">
                  <div className="text-center">
                    <div className="text-xs text-gray-400 font-bold uppercase">Interest</div>
                    <div className="font-bold text-emerald-600 text-lg">{product.interest_rate || '0'}%</div>
                  </div>
                  <div className="w-px h-8 bg-gray-200"></div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400 font-bold uppercase">Min Balance</div>
                    <div className="font-bold text-gray-700">{formatCurrencyGHS(Number(product.minimum_balance))}</div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Active Promotions */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            Active Promotions
            <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">{promotions.length}</span>
          </h3>
          {promotions.length === 0 ? (
            <div className="text-center py-10 text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-200">No active promotions</div>
          ) : (
            <div className="space-y-4">
              {promotions.map((promo) => (
                <div key={promo.id} className="bg-orange-50 border border-orange-100 rounded-xl p-5 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 bg-orange-100 w-16 h-16 rounded-full opacity-50"></div>
                  <h4 className="font-bold text-orange-800 mb-1 relative z-10">{promo.name}</h4>
                  <p className="text-orange-900/70 text-sm mb-3 relative z-10">{promo.description}</p>
                  <div className="flex justify-between items-center relative z-10">
                    <span className="font-bold text-white bg-orange-400 px-2 py-1 rounded text-xs shadow-sm">
                      {promo.discount_percentage ? `${promo.discount_percentage}% OFF` : `GHS ${promo.bonus_amount} BONUS`}
                    </span>
                    <span className="text-xs font-medium text-orange-700/60">
                      Ends {new Date(promo.end_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPromotionsTab;
