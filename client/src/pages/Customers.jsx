import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Trash2, Edit2, Archive, Phone, Wallet, X } from 'lucide-react';

const Customers = () => {
    const { user } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        can_credit: false
    });

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('is_deleted', false)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCustomers(data || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data: businessData } = await supabase
                .from('profiles')
                .select('business_id')
                .eq('id', user.id)
                .single();

            if (!businessData) throw new Error('Business not found');

            const payload = {
                ...formData,
                business_id: businessData.business_id,
                is_deleted: false,
                balance: editingCustomer ? editingCustomer.balance : 0
            };

            if (editingCustomer) {
                const { error } = await supabase
                    .from('customers')
                    .update(payload)
                    .eq('id', editingCustomer.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('customers')
                    .insert([payload]);
                if (error) throw error;
            }

            closeModal();
            fetchData();
        } catch (error) {
            alert('İşlem başarısız: ' + error.message);
        }
    };

    const handleSoftDelete = async (id) => {
        if (!window.confirm('Bu müşteriyi arşive göndermek istediğinize emin misiniz?')) return;
        try {
            const { error } = await supabase
                .from('customers')
                .update({ is_deleted: true })
                .eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    const openModal = (customer = null) => {
        if (customer) {
            setEditingCustomer(customer);
            setFormData({
                first_name: customer.first_name,
                last_name: customer.last_name || '',
                phone: customer.phone || '',
                can_credit: customer.can_credit || false
            });
        } else {
            setEditingCustomer(null);
            setFormData({
                first_name: '',
                last_name: '',
                phone: '',
                can_credit: false
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCustomer(null);
    };

    const filteredCustomers = customers.filter(c =>
        c.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.last_name && c.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.phone && c.phone.includes(searchTerm))
    );

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Müşteriler</h1>
                    <p className="text-gray-500 text-sm mt-1">Pano • Müşteriler</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => alert('Arşiv özelliği yakında...')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-xl font-semibold transition-colors border border-yellow-200"
                    >
                        <Archive size={18} />
                        Arşiv
                    </button>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-100/50 hover:bg-blue-100 text-blue-600 rounded-xl font-semibold transition-all shadow-sm"
                    >
                        <Plus size={18} />
                        Yeni Müşteri
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Müşteri ara..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Ad Soyad</th>
                                <th className="px-6 py-4">Telefon</th>
                                <th className="px-6 py-4">Eksiye Düşebilir Mi?</th>
                                <th className="px-6 py-4">Bakiye</th>
                                <th className="px-6 py-4 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">Yükleniyor...</td>
                                </tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-gray-500 text-sm">Tabloda herhangi bir veri mevcut değil</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-gray-700">{customer.first_name} {customer.last_name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {customer.phone || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {customer.can_credit ? (
                                                <span className="inline-flex px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg border border-green-200">EVET</span>
                                            ) : (
                                                <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-lg border border-gray-200">HAYIR</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 font-mono font-medium text-gray-700">
                                                <span>{customer.balance?.toFixed(2)} ₺</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openModal(customer)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleSoftDelete(customer.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal - Using Portal */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left">
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative"
                        style={{ isolation: 'isolate', pointerEvents: 'auto' }}
                    >
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                            <h3 className="font-bold text-gray-800 text-lg">
                                {editingCustomer ? 'Müşteri Düzenle' : 'Müşteri Ekle'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ad <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    type="text"
                                    autoFocus
                                    style={{ userSelect: 'auto', WebkitUserSelect: 'auto', MozUserSelect: 'auto' }}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-gray-800 bg-white"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
                                <input
                                    type="text"
                                    style={{ userSelect: 'auto', WebkitUserSelect: 'auto', MozUserSelect: 'auto' }}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-gray-800 bg-white"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    type="tel"
                                    style={{ userSelect: 'auto', WebkitUserSelect: 'auto', MozUserSelect: 'auto' }}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-gray-800 bg-white"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-3 py-2 cursor-pointer" onClick={() => setFormData({ ...formData, can_credit: !formData.can_credit })}>
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.can_credit ? 'bg-teal-500 border-teal-500' : 'border-gray-300 bg-white'}`}>
                                    {formData.can_credit && <Search size={12} className="text-white" />}
                                </div>
                                <span className="text-gray-700 font-medium select-none">
                                    Eksiye Düşebilir Mi?
                                </span>
                            </div>

                            <div className="pt-4 flex gap-3 border-t border-gray-100 mt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-6 py-3 bg-red-400 text-white font-bold rounded-lg hover:bg-red-500 transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-teal-400 text-white font-bold rounded-lg hover:bg-teal-500 transition-colors shadow-lg shadow-teal-100"
                                >
                                    {editingCustomer ? 'Güncelle' : 'Müşteri Ekle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Customers;
