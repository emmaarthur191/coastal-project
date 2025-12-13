import React, { useState, useEffect } from 'react';
import { PlayfulCard, SkeletonLoader, PlayfulButton, PlayfulInput, ErrorBoundary } from './CashierTheme';
import { api } from '../../services/api.ts';
import { formatCurrencyGHS } from '../../utils/formatters';

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
  name: string; // Changed from title to match backend
  description: string;
  discount_percentage?: number;
  bonus_amount?: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
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
      const response = await api.get('products/products/');
      // Handle both paginated response {results: []} and direct array response
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
      const response = await api.get('products/promotions/');
      // Handle both paginated response {results: []} and direct array response
      const data = response.data?.results || response.data || [];
      // Filter for active ones manually since we are using the general endpoint
      const activePromos = (Array.isArray(data) ? data : []).filter((p: any) => p.is_active);
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
      // Determine endpoint based on product type or generic enrollment
      const response = await api.post('banking/account-openings/', {
        user_id: selectedCustomer, // Assuming simplified flow where ID is passed
        product_id: selectedProduct,
        promotion_id: selectedPromotion || null,
        initial_deposit: 0 // Default for now
      });

      setMessage({ type: 'success', text: 'Product enrollment/application submitted successfully!' });
      setSelectedCustomer('');
      setSelectedProduct('');
      setSelectedPromotion('');
    } catch (error: any) {
      console.error('Error enrolling product:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to enroll product/service' });
    } finally {
      setEnrollmentLoading(false);
    }
  };

  if (loading) {
    return (
      <PlayfulCard>
        <h2>🏦 Banking Products & Services</h2>
        <SkeletonLoader height="40px" />
        <SkeletonLoader height="200px" style={{ marginTop: '20px' }} />
      </PlayfulCard>
    );
  }

  return (
    <ErrorBoundary>
      <PlayfulCard>
        <h2>🏦 Banking Products & Services</h2>
        <p>Browse financial products and enroll customers.</p>

        {message.text && (
          <div style={{
            padding: '10px',
            marginBottom: '20px',
            borderRadius: '8px',
            backgroundColor: message.type === 'error' ? '#FFEBEE' : '#E8F5E8',
            color: message.type === 'error' ? '#C62828' : '#2E7D32',
            border: `1px solid ${message.type === 'error' ? '#FFCDD2' : '#C8E6C9'}`
          }}>
            {message.text}
          </div>
        )}

        {/* Product Enrollment Section */}
        <div style={{ marginBottom: '30px', padding: '20px', border: '2px dashed #DFE6E9', borderRadius: '12px' }}>
          <h3>New Details / Enrollment</h3>

          <PlayfulInput
            label="Customer ID / Account Number"
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            placeholder="Enter customer ID"
          />

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#636E72', marginLeft: '4px' }}>
              Select Product
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: `3px solid #DFE6E9`,
                fontSize: '16px',
                outline: 'none',
                background: '#F9F9F9'
              }}
            >
              <option value="">Choose a product...</option>
              {products.filter(p => p.is_active).map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.product_type_display})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#636E72', marginLeft: '4px' }}>
              Apply Promotion (Optional)
            </label>
            <select
              value={selectedPromotion}
              onChange={(e) => setSelectedPromotion(e.target.value)}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: `3px solid #DFE6E9`,
                fontSize: '16px',
                outline: 'none',
                background: '#F9F9F9'
              }}
            >
              <option value="">No promotion</option>
              {promotions.map((promo) => (
                <option key={promo.id} value={promo.id}>
                  {promo.name} - {promo.discount_percentage ? `${promo.discount_percentage}% Rate Disc.` : `GHS ${promo.bonus_amount} Bonus`}
                </option>
              ))}
            </select>
          </div>

          <PlayfulButton
            onClick={handleProductEnrollment}
            disabled={enrollmentLoading || !selectedCustomer || !selectedProduct}
            variant="success"
          >
            {enrollmentLoading ? 'Processing...' : 'Start Enrollment 📝'}
          </PlayfulButton>
        </div>

        {/* Products List */}
        <div style={{ marginBottom: '30px' }}>
          <h3>Available Financial Products ({products.filter(p => p.is_active).length})</h3>
          <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {products.filter(p => p.is_active).map((product) => (
              <div key={product.id} style={{
                border: '1px solid #DFE6E9',
                borderRadius: '8px',
                padding: '15px',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                  <h4 style={{ margin: '0', color: '#2D3436' }}>{product.name}</h4>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: 'white',
                    backgroundColor: '#0984e3'
                  }}>
                    {product.product_type_display}
                  </span>
                </div>

                <p style={{ margin: '0 0 10px 0', color: '#636E72', fontSize: '14px' }}>{product.description}</p>

                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                  {product.interest_rate && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#636E72', fontSize: '13px' }}>Interest Rate:</span>
                      <span style={{ fontWeight: 'bold', color: '#27ae60' }}>{product.interest_rate}%</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#636E72', fontSize: '13px' }}>Min Balance:</span>
                    <span style={{ fontWeight: 'bold' }}>{formatCurrencyGHS(Number(product.minimum_balance))}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Promotions */}
        <div>
          <h3>Active Promotions ({promotions.length})</h3>
          {promotions.length === 0 ? (
            <p style={{ color: '#636E72', fontStyle: 'italic' }}>No active promotions</p>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {promotions.map((promo) => (
                <div key={promo.id} style={{
                  border: '1px solid #DFE6E9',
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: '#FFF8E1'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#F57C00' }}>{promo.name}</h4>
                  <p style={{ margin: '0 0 10px 0', color: '#636E72' }}>{promo.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: '#F57C00' }}>
                      {promo.discount_percentage ? `${promo.discount_percentage}% Rate Disc.` : `GHS ${promo.bonus_amount} Bonus`}
                    </span>
                    <span style={{ color: '#636E72', fontSize: '14px' }}>
                      Valid Until {new Date(promo.end_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PlayfulCard>
    </ErrorBoundary>
  );
};

export default ProductsPromotionsTab;