import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await api.get('products/products/');
      setProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('products/categories/');
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-mauve-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Products & Services</h1>
          <p className="text-gray-600">Explore our range of banking products and services</p>
        </div>

        {/* Category Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === ''
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
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category.id.toString()
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

              <p className="text-gray-600 mb-4">{product.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Type:</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {product.product_type.replace('_', ' ')}
                  </span>
                </div>
                {product.base_price > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Base Price:</span>
                    <span className="text-sm font-medium text-gray-900">
                      ${product.base_price}
                    </span>
                  </div>
                )}
                {product.interest_rate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Interest Rate:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {product.interest_rate}%
                    </span>
                  </div>
                )}
              </div>

              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                Learn More
              </button>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-5.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try selecting a different category or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;