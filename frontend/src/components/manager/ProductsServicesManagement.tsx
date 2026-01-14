import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { formatCurrencyGHS } from '../../utils/formatters';
import { Plus, Edit2, Trash2, Tag, Loader, X, Save, AlertCircle } from 'lucide-react';
import { AxiosError } from 'axios';

// Interfaces matching backend models
interface Product {
    id: string;
    name: string;
    product_type: string;
    product_type_display: string;
    description: string;
    interest_rate: string | number;
    minimum_balance: string | number;
    maximum_balance?: string | number;
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

const PRODUCT_TYPES = [
    { value: 'savings', label: 'Savings Account' },
    { value: 'loan', label: 'Loan' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'investment', label: 'Investment' },
    { value: 'susu', label: 'Susu Account' }
];

type ManageableItem = Product | Promotion;

interface FormData extends Partial<Product>, Partial<Promotion> { }

const ProductsServicesManagement = () => {
    const [activeTab, setActiveTab] = useState<'products' | 'promotions'>('products');
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [promotions, setPromotions] = useState<Promotion[]>([]);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [editingItem, setEditingItem] = useState<ManageableItem | null>(null);

    // Form State
    const [formData, setFormData] = useState<FormData>({});
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (activeTab === 'products') {
                const res = await api.get<{ results: Product[] }>('products/products/');
                setProducts(res.data?.results || []);
            } else {
                const res = await api.get<{ results: Promotion[] }>('products/promotions/');
                setPromotions(res.data?.results || []);
            }
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateClick = () => {
        setModalMode('create');
        setEditingItem(null);
        setFormData(activeTab === 'products' ? {
            is_active: true,
            product_type: 'savings',
            minimum_balance: 0
        } : {
            is_active: true,
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
        setFormError('');
        setShowModal(true);
    };

    const handleEditClick = (item: ManageableItem) => {
        setModalMode('edit');
        setEditingItem(item);
        setFormData({ ...item });
        setFormError('');
        setShowModal(true);
    };

    const handleDeleteClick = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            const endpoint = activeTab === 'products' ? `products/products/${id}/` : `products/promotions/${id}/`;
            await api.delete(endpoint);
            fetchData(); // Refresh
        } catch (err) {
            console.error('Delete failed', err);
            alert('Failed to delete item. It may be in use.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError('');

        try {
            const endpoint = activeTab === 'products' ? 'products/products/' : 'products/promotions/';
            const url = modalMode === 'edit' && editingItem ? `${endpoint}${editingItem.id}/` : endpoint;
            const method = modalMode === 'edit' ? 'patch' : 'post';

            // Clean payload
            const payload = { ...formData };

            // Numeric conversions
            if (activeTab === 'products') {
                if (payload.interest_rate) payload.interest_rate = parseFloat(String(payload.interest_rate));
                if (payload.minimum_balance) payload.minimum_balance = parseFloat(String(payload.minimum_balance));
                if (payload.maximum_balance) payload.maximum_balance = parseFloat(String(payload.maximum_balance));
            } else {
                if (payload.discount_percentage) payload.discount_percentage = parseFloat(String(payload.discount_percentage));
                if (payload.bonus_amount) payload.bonus_amount = parseFloat(String(payload.bonus_amount));
            }

            await api[method](url, payload);
            setShowModal(false);
            fetchData();
        } catch (err) {
            console.error('Submit failed', err);
            // Type-safe error handling for Axios errors
            if (err instanceof AxiosError) {
                setFormError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to save.');
            } else {
                setFormError('Failed to save.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const renderProductForm = () => (
        <>
            <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                    <label htmlFor="product-name" className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                        id="product-name"
                        type="text"
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="product-type" className="block text-sm font-medium text-gray-700">Product Type</label>
                    <select
                        id="product-type"
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.product_type || 'savings'}
                        onChange={e => setFormData({ ...formData, product_type: e.target.value })}
                    >
                        {PRODUCT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="mb-4">
                <label htmlFor="product-description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                    id="product-description"
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    rows={3}
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label htmlFor="product-interest-rate" className="block text-sm font-medium text-gray-700">Interest Rate (%)</label>
                    <input id="product-interest-rate" type="number" step="0.01" className="mt-1 block w-full p-2 border rounded"
                        value={formData.interest_rate ?? ''}
                        onChange={e => setFormData({ ...formData, interest_rate: e.target.value as unknown as number })}
                    />
                </div>
                <div>
                    <label htmlFor="product-min-balance" className="block text-sm font-medium text-gray-700">Min Balance</label>
                    <input id="product-min-balance" type="number" step="0.01" className="mt-1 block w-full p-2 border rounded"
                        value={formData.minimum_balance ?? 0}
                        onChange={e => setFormData({ ...formData, minimum_balance: e.target.value as unknown as number })}
                    />
                </div>
                <div>
                    <label htmlFor="product-max-balance" className="block text-sm font-medium text-gray-700">Max Balance (Opt)</label>
                    <input id="product-max-balance" type="number" step="0.01" className="mt-1 block w-full p-2 border rounded"
                        value={formData.maximum_balance ?? ''}
                        onChange={e => setFormData({ ...formData, maximum_balance: e.target.value as unknown as number })}
                    />
                </div>
            </div>

            <div className="mt-4 flex items-center">
                <input type="checkbox" id="isActive" className="mr-2"
                    checked={formData.is_active || false}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">Is Active</label>
            </div>
        </>
    );

    const renderPromotionForm = () => (
        <>
            <div className="mb-4">
                <label htmlFor="promo-name" className="block text-sm font-medium text-gray-700">Promotion Name</label>
                <input
                    id="promo-name"
                    type="text"
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                />
            </div>

            <div className="mb-4">
                <label htmlFor="promo-description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                    id="promo-description"
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    rows={3}
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label htmlFor="promo-discount" className="block text-sm font-medium text-gray-700">Discount Percentage (%)</label>
                    <input id="promo-discount" type="number" step="0.01" className="mt-1 block w-full p-2 border rounded"
                        value={formData.discount_percentage ?? ''}
                        onChange={e => setFormData({ ...formData, discount_percentage: e.target.value as unknown as number })}
                        placeholder="e.g. 5.0"
                    />
                </div>
                <div>
                    <label htmlFor="promo-bonus" className="block text-sm font-medium text-gray-700">Bonus Amount (GHS)</label>
                    <input id="promo-bonus" type="number" step="0.01" className="mt-1 block w-full p-2 border rounded"
                        value={formData.bonus_amount ?? ''}
                        onChange={e => setFormData({ ...formData, bonus_amount: e.target.value as unknown as number })}
                        placeholder="e.g. 50.00"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="promo-start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input id="promo-start-date" type="date" className="mt-1 block w-full p-2 border rounded"
                        value={formData.start_date || ''}
                        onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="promo-end-date" className="block text-sm font-medium text-gray-700">End Date</label>
                    <input id="promo-end-date" type="date" className="mt-1 block w-full p-2 border rounded"
                        value={formData.end_date || ''}
                        onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                        required
                    />
                </div>
            </div>

            <div className="mt-4 flex items-center">
                <input type="checkbox" id="promoActive" className="mr-2"
                    checked={formData.is_active || false}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <label htmlFor="promoActive" className="text-sm text-gray-700">Is Active</label>
            </div>
        </>
    );

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Products & Services Management</h1>
                    <p className="text-gray-500">Create and manage financial products and promotional offers.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('products')}
                    className={`pb-2 px-4 transition-colors ${activeTab === 'products' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    🏦 Financial Products
                </button>
                <button
                    onClick={() => setActiveTab('promotions')}
                    className={`pb-2 px-4 transition-colors ${activeTab === 'promotions' ? 'border-b-2 border-purple-600 text-purple-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    🎟️ Promotions
                </button>
            </div>

            {/* Action Bar */}
            <div className="flex justify-between mb-4">
                <div className="text-gray-600">
                    {activeTab === 'products' ? `${products.length} Products Found` : `${promotions.length} Promotions Found`}
                </div>
                <button onClick={handleCreateClick} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
                    <Plus size={18} />
                    <span>Add {activeTab === 'products' ? 'Product' : 'Promotion'}</span>
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center p-12"><Loader className="animate-spin text-blue-500" size={40} /></div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                    {activeTab === 'products' ? (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="p-4 font-semibold text-gray-600">Name</th>
                                    <th className="p-4 font-semibold text-gray-600">Type</th>
                                    <th className="p-4 font-semibold text-gray-600">Interest</th>
                                    <th className="p-4 font-semibold text-gray-600">Min Balance</th>
                                    <th className="p-4 font-semibold text-gray-600">Status</th>
                                    <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(product => (
                                    <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium text-gray-800">{product.name}</td>
                                        <td className="p-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">{product.product_type_display}</span></td>
                                        <td className="p-4 text-green-600 font-bold">{product.interest_rate ? `${product.interest_rate}%` : '-'}</td>
                                        <td className="p-4 text-gray-600">{formatCurrencyGHS(Number(product.minimum_balance))}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {product.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => handleEditClick(product)} className="text-gray-500 hover:text-blue-600 mr-3" aria-label="Edit product"><Edit2 size={18} /></button>
                                            <button onClick={() => handleDeleteClick(product.id)} className="text-gray-500 hover:text-red-600" aria-label="Delete product"><Trash2 size={18} /></button>
                                        </td>
                                    </tr>
                                ))}
                                {products.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">No products found. Create one!</td></tr>}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="p-4 font-semibold text-gray-600">Name</th>
                                    <th className="p-4 font-semibold text-gray-600">Description</th>
                                    <th className="p-4 font-semibold text-gray-600">Offer</th>
                                    <th className="p-4 font-semibold text-gray-600">Validity</th>
                                    <th className="p-4 font-semibold text-gray-600">Status</th>
                                    <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {promotions.map(promo => (
                                    <tr key={promo.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium text-gray-800">{promo.name}</td>
                                        <td className="p-4 text-sm text-gray-500 max-w-xs truncate">{promo.description}</td>
                                        <td className="p-4 text-purple-600 font-bold">
                                            {promo.discount_percentage ? `-${promo.discount_percentage}% Rate` : `+GHS ${promo.bonus_amount}`}
                                        </td>
                                        <td className="p-4 text-xs text-gray-500">
                                            {new Date(promo.start_date).toLocaleDateString()} - {new Date(promo.end_date).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${promo.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {promo.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => handleEditClick(promo)} className="text-gray-500 hover:text-blue-600 mr-3" aria-label="Edit promotion"><Edit2 size={18} /></button>
                                            <button onClick={() => handleDeleteClick(promo.id)} className="text-gray-500 hover:text-red-600" aria-label="Delete promotion"><Trash2 size={18} /></button>
                                        </td>
                                    </tr>
                                ))}
                                {promotions.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">No promotions found.</td></tr>}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-800">
                                {modalMode === 'create' ? 'Create' : 'Edit'} {activeTab === 'products' ? 'Product' : 'Promotion'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close modal"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
                            {activeTab === 'products' ? renderProductForm() : renderPromotionForm()}

                            {formError && (
                                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded flex items-start text-sm">
                                    <AlertCircle size={16} className="mr-2 mt-0.5" />
                                    {formError}
                                </div>
                            )}

                            <div className="mt-6 flex justify-end space-x-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
                                >
                                    {submitting && <Loader size={16} className="animate-spin mr-2" />}
                                    {modalMode === 'create' ? 'Create' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ProductsServicesManagement;
