import React, { useState, useEffect } from 'react';
import { PlayfulCard, SkeletonLoader, PlayfulButton, PlayfulInput, ErrorBoundary } from './CashierTheme';
import { api } from '../../services/api.ts';
import { formatCurrencyGHS } from '../../utils/formatters';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock_quantity: number;
  is_active: boolean;
}

interface Promotion {
  id: string;
  title: string;
  description: string;
  discount_percentage: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  applicable_products: string[];
}

const ProductsPromotionsTab: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
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
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setMessage({ type: 'error', text: 'Failed to load products' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPromotions = async () => {
    try {
      const response = await api.get('products/promotions/active/');
      setPromotions(response.data || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    }
  };

  const fetchRecommendations = async (customerId: string) => {
    if (!customerId) return;
    try {
      const response = await api.post('products/recommendations/generate/', { customer_id: customerId });
      setRecommendations(response.data || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const handleProductEnrollment = async () => {
    if (!selectedCustomer || !selectedProduct) {
      setMessage({ type: 'error', text: 'Please select a customer and product' });
      return;
    }

    try {
      setEnrollmentLoading(true);
      const response = await api.post('products/enroll/', {
        product_id: selectedProduct,
        customer_id: selectedCustomer,
        applied_promotion_id: selectedPromotion || null
      });
      setMessage({ type: 'success', text: response.data.message || 'Product enrolled successfully' });
      setSelectedCustomer('');
      setSelectedProduct('');
      setSelectedPromotion('');
      setRecommendations([]);
    } catch (error) {
      console.error('Error enrolling product:', error);
      setMessage({ type: 'error', text: 'Failed to enroll product' });
    } finally {
      setEnrollmentLoading(false);
    }
  };

  if (loading) {
    return (
      <PlayfulCard>
        <h2>🎁 Products & Promotions</h2>
        <SkeletonLoader height="40px" />
        <SkeletonLoader height="200px" style={{ marginTop: '20px' }} />
      </PlayfulCard>
    );
  }

  return (
    <ErrorBoundary>
      <PlayfulCard>
        <h2>🎁 Products & Promotions</h2>
        <p>Manage products, promotions, and customer enrollments.</p>

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
          <h3>Product Enrollment</h3>

          <PlayfulInput
            label="Customer ID"
            value={selectedCustomer}
            onChange={(e) => {
              setSelectedCustomer(e.target.value);
              fetchRecommendations(e.target.value);
            }}
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
                  {product.name} - {formatCurrencyGHS(product.price)} (Stock: {product.stock_quantity})
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
                  {promo.title} - {promo.discount_percentage}% off
                </option>
              ))}
            </select>
          </div>

          <PlayfulButton
            onClick={handleProductEnrollment}
            disabled={enrollmentLoading || !selectedCustomer || !selectedProduct}
            variant="success"
          >
            {enrollmentLoading ? 'Enrolling...' : 'Enroll Product 🎁'}
          </PlayfulButton>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h3>Recommended Products</h3>
            <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
              {recommendations.map((product) => (
                <div key={product.id} style={{
                  border: '1px solid #DFE6E9',
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: '#F8F9FA'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#2D3436' }}>{product.name}</h4>
                  <p style={{ margin: '0 0 10px 0', color: '#636E72', fontSize: '14px' }}>{product.description}</p>
                  <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>{formatCurrencyGHS(product.price)}</p>
                  <p style={{ margin: '0', color: product.stock_quantity > 0 ? '#00B894' : '#FF7675', fontSize: '14px' }}>
                    Stock: {product.stock_quantity}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products List */}
        <div style={{ marginBottom: '30px' }}>
          <h3>Available Products ({products.filter(p => p.is_active).length})</h3>
          <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {products.filter(p => p.is_active).map((product) => (
              <div key={product.id} style={{
                border: '1px solid #DFE6E9',
                borderRadius: '8px',
                padding: '15px',
                backgroundColor: '#FFFFFF'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                  <h4 style={{ margin: '0', color: '#2D3436' }}>{product.name}</h4>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: 'white',
                    backgroundColor: product.stock_quantity > 0 ? '#00B894' : '#FF7675'
                  }}>
                    {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>

                <p style={{ margin: '0 0 10px 0', color: '#636E72', fontSize: '14px' }}>{product.description}</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{formatCurrencyGHS(product.price)}</span>
                  <span style={{ color: '#636E72', fontSize: '14px' }}>Stock: {product.stock_quantity}</span>
                </div>

                <p style={{ margin: '10px 0 0 0', color: '#636E72', fontSize: '12px' }}>
                  Category: {product.category}
                </p>
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
                  <h4 style={{ margin: '0 0 10px 0', color: '#F57C00' }}>{promo.title}</h4>
                  <p style={{ margin: '0 0 10px 0', color: '#636E72' }}>{promo.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: '#F57C00' }}>
                      {promo.discount_percentage}% OFF
                    </span>
                    <span style={{ color: '#636E72', fontSize: '14px' }}>
                      Until {new Date(promo.end_date).toLocaleDateString()}
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