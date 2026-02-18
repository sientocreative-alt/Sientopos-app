import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';

export default function AdminSubscriptions() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        monthly_price: '',
        yearly_price: '',
        features: '',
        yearly_campaign_active: false
    });

    const API_URL = import.meta.env.VITE_API_URL + '/api/plans';

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        console.log('Fetching Plans from:', API_URL); // DEBUG LOG
        try {
            // Fetch all plans (including inactive ones if we had an admin endpoint for that, 
            // but for now reusing public or we need to add admin specific endpoint)
            const res = await axios.get(`${API_URL}/admin/all`);
            setPlans(res.data.data);
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                features: formData.features.split('\n').filter(f => f.trim() !== '')
            };

            if (editingPlan) {
                await axios.put(`${API_URL}/admin/${editingPlan.id}`, payload);
            } else {
                await axios.post(`${API_URL}/admin`, payload);
            }

            closeModal();
            fetchPlans();
        } catch (error) {
            console.error(error);
            alert('İşlem başarısız: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Planı pasife almak istediğinize emin misiniz?')) return;
        try {
            await axios.delete(`${API_URL}/admin/${id}`);
            fetchPlans();
        } catch (error) {
            alert('Silme başarısız');
        }
    };

    const openModal = (plan = null) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData({
                name: plan.name,
                description: plan.description,
                monthly_price: plan.monthly_price,
                yearly_price: plan.yearly_price,
                features: plan.features ? plan.features.join('\n') : '',
                yearly_campaign_active: plan.yearly_campaign_active || false
            });
        } else {
            setEditingPlan(null);
            setFormData({
                name: '',
                description: '',
                monthly_price: '',
                yearly_price: '',
                features: '',
                yearly_campaign_active: false
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPlan(null);
    };

    if (loading) return <div className="p-8">Yükleniyor...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Abonelik Paketleri Yönetimi</h1>
                <button
                    onClick={() => openModal()}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus size={18} className="mr-2" /> Yeni Paket Ekle
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.isArray(plans) && plans.length > 0 ? plans.map((plan) => (
                    <div key={plan.id} className={`border rounded-xl p-6 bg-white shadow-sm relative ${!plan.is_active ? 'opacity-60 bg-gray-50' : ''}`}>
                        {!plan.is_active && <div className="absolute top-2 right-2 bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold">PASİF</div>}

                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                                <p className="text-sm text-gray-500">{plan.description}</p>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => openModal(plan)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                >
                                    <Edit2 size={16} />
                                </button>
                                {plan.is_active && (
                                    <button
                                        onClick={() => handleDelete(plan.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-gray-50 p-3 rounded-lg text-center">
                                <div className="text-xs text-gray-500 font-bold uppercase">Aylık</div>
                                <div className="text-lg font-bold text-blue-600">{plan.monthly_price} ₺</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg text-center relative">
                                <div className="text-xs text-gray-500 font-bold uppercase">Yıllık</div>
                                <div className="text-lg font-bold text-blue-600">{plan.yearly_price} ₺</div>
                                {plan.yearly_campaign_active && (
                                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                        +3 Ay
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Özellikler</h4>
                            <ul className="space-y-1">
                                {plan.features && plan.features.map((feature, idx) => (
                                    <li key={idx} className="text-sm text-gray-600 flex items-center">
                                        <Check size={14} className="text-green-500 mr-2" /> {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-3 text-center py-12 text-gray-500">
                        Henüz hiç paket bulunmuyor.
                    </div>
                )}
            </div>

            {/* Config Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-bold">{editingPlan ? 'Paketi Düzenle' : 'Yeni Paket Ekle'}</h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Paket Adı</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black placeholder:text-gray-400"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black placeholder:text-gray-400"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Aylık Fiyat (₺)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black placeholder:text-gray-400"
                                        value={formData.monthly_price}
                                        onChange={e => setFormData({ ...formData, monthly_price: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Yıllık Fiyat (₺)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black placeholder:text-gray-400"
                                        value={formData.yearly_price}
                                        onChange={e => setFormData({ ...formData, yearly_price: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                <input
                                    type="checkbox"
                                    id="campaign"
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                    checked={formData.yearly_campaign_active || false}
                                    onChange={e => setFormData({ ...formData, yearly_campaign_active: e.target.checked })}
                                />
                                <label htmlFor="campaign" className="text-sm font-bold text-gray-800 cursor-pointer">
                                    Yıllık Kampanya Aktif (+3 Ay Hediye)
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Özellikler (Her satıra bir tane)</label>
                                <textarea
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 h-32 text-black placeholder:text-gray-400"
                                    value={formData.features}
                                    onChange={e => setFormData({ ...formData, features: e.target.value })}
                                    placeholder="Sınırsız Masa&#10;QR Menü&#10;7/24 Destek"
                                ></textarea>
                            </div>
                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {editingPlan ? 'Güncelle' : 'Oluştur'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
