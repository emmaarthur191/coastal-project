import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { formatCurrencyGHS } from '../../utils/formatters';
import { Plus, Edit2, Trash2, Tag, Loader, X, Save, AlertCircle } from 'lucide-react';

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
    { value: 'investment', 'label': 'Investment' },
    { value: 'susu', label: 'Susu Account' }
];

const ProductsServicesManagement = () => {
    const [activeTab, setActiveTab] = useState<'products' | 'promotions'>('products');
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [promotions, setPromotions] = useState<Promotion[]>([]);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [editingItem, setEditingItem] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState<any>({});
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'products') {
                const res = await api.get('products/products/');
                setProducts(res.data?.results || res.data || []);
            } else {
                const res = await api.get('products/promotions/');
                setPromotions(res.data?.results || res.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    };

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

    const handleEditClick = (item: any) => {
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
            const url = modalMode === 'edit' ? `${endpoint}${editingItem.id}/` : endpoint;
            const method = modalMode === 'edit' ? 'patch' : 'post';

            // Clean payload
            const payload = { ...formData };

            // Numeric conversions
            if (activeTab === 'products') {
                if (payload.interest_rate) payload.interest_rate = parseFloat(payload.interest_rate);
                if (payload.minimum_balance) payload.minimum_balance = parseFloat(payload.minimum_balance);
                if (payload.maximum_balance) payload.maximum_balance = parseFloat(payload.maximum_balance);
            } else {
                if (payload.discount_percentage) payload.discount_percentage = parseFloat(payload.discount_percentage);
                if (payload.bonus_amount) payload.bonus_amount = parseFloat(payload.bonus_amount);
            }

            await api[method](url, payload);
            setShowModal(false);
            fetchData();
        } catch (err: any) {
            console.error('Submit failed', err);
            setFormError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to save.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderProductForm = () => (
        <>
            <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                        type="text"
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Product Type</label>
                    <select
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.product_type || 'savings'}
                        onChange={e => setFormData({ ...formData, product_type: e.target.value })}
                    >
                        {PRODUCT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    rows={3}
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Interest Rate (%)</label>
                    <input type="number" step="0.01" className="mt-1 block w-full p-2 border rounded"
                        value={formData.interest_rate || ''}
                        onChange={e => setFormData({ ...formData, interest_rate: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Min Balance</label>
                    <input type="number" step="0.01" className="mt-1 block w-full p-2 border rounded"
                        value={formData.minimum_balance || 0}
                        onChange={e => setFormData({ ...formData, minimum_balance: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Max Balance (Opt)</label>
                    <input type="number" step="0.01" className="mt-1 block w-full p-2 border rounded"
                        value={formData.maximum_balance || ''}
                        onChange={e => setFormData({ ...formData, maximum_balance: e.target.value })}
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
                <label className="block text-sm font-medium text-gray-700">Promotion Name</label>
                <input
                    type="text"
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    rows={3}
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Discount Percentage (%)</label>
                    <input type="number" step="0.01" className="mt-1 block w-full p-2 border rounded"
                        value={formData.discount_percentage || ''}
                        onChange={e => setFormData({ ...formData, discount_percentage: e.target.value })}
                        placeholder="e.g. 5.0"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Bonus Amount (GHS)</label>
                    <input type="number" step="0.01" className="mt-1 block w-full p-2 border rounded"
                        value={formData.bonus_amount || ''}
                        onChange={e => setFormData({ ...formData, bonus_amount: e.target.value })}
                        placeholder="e.g. 50.00"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input type="date" className="mt-1 block w-full p-2 border rounded"
                        value={formData.start_date || ''}
                        onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <input type="date" className="mt-1 block w-full p-2 border rounded"
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
                                            <button onClick={() => handleEditClick(product)} className="text-gray-500 hover:text-blue-600 mr-3"><Edit2 size={18} /></button>
                                            <button onClick={() => handleDeleteClick(product.id)} className="text-gray-500 hover:text-red-600"><Trash2 size={18} /></button>
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
                                            <button onClick={() => handleEditClick(promo)} className="text-gray-500 hover:text-blue-600 mr-3"><Edit2 size={18} /></button>
                                            <button onClick={() => handleDeleteClick(promo.id)} className="text-gray-500 hover:text-red-600"><Trash2 size={18} /></button>
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
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
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
