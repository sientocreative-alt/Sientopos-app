import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Download, Plus, Search, Trash2, Edit2, Phone, MapPin, Smartphone } from 'lucide-react';
import * as XLSX from 'xlsx';

const DeliveryAddresses = () => {
    const { user } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        description: '',
        contact_number: ''
    });

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            const { data, error } = await supabase
                .from('delivery_customers')
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

    const handleExport = () => {
        const dataToExport = customers.map(c => ({
            'Müşteri': c.name,
            'Telefon': c.phone,
            'Adres': c.address,
            'Açıklama': c.description,
            'İletişim No': c.contact_number
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Adresler");
        XLSX.writeFile(wb, "Paket_Servis_Adresleri.xlsx");
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
                is_deleted: false
            };

            if (editingCustomer) {
                const { error } = await supabase
                    .from('delivery_customers')
                    .update(payload)
                    .eq('id', editingCustomer.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('delivery_customers')
                    .insert([payload]);
                if (error) throw error;
            }

            closeModal();
            fetchData();
        } catch (error) {
            alert('İşlem başarısız: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
        try {
            const { error } = await supabase
                .from('delivery_customers')
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
                name: customer.name,
                phone: customer.phone || '',
                address: customer.address || '',
                description: customer.description || '',
                contact_number: customer.contact_number || ''
            });
        } else {
            setEditingCustomer(null);
            setFormData({
                name: '',
                phone: '',
                address: '',
                description: '',
                contact_number: ''
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCustomer(null);
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm))
    );

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Paket Servis Adresleri</h1>
                    <p className="text-gray-500 text-sm mt-1">Müşteri ve teslimat adreslerini yönetin</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl font-semibold transition-colors border border-green-200"
                    >
                        <Download size={18} />
                        Excele Aktar
                    </button>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-orange-200"
                    >
                        <Plus size={18} />
                        Yeni Adres Ekle
                    </button>
                </div>
            </div>

            {/* Search and List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Müşteri veya telefon ara..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Müşteri</th>
                                <th className="px-6 py-4">Telefon</th>
                                <th className="px-6 py-4">Adres</th>
                                <th className="px-6 py-4">Açıklama</th>
                                <th className="px-6 py-4">İletişim No</th>
                                <th className="px-6 py-4 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">Yükleniyor...</td>
                                </tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                                                <Search size={24} />
                                            </div>
                                            <span className="text-gray-500 font-medium">Kayıt bulunamadı</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-gray-700">{customer.name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {customer.phone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone size={14} className="text-gray-400" />
                                                    {customer.phone}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={customer.address}>
                                            {customer.address && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={14} className="text-gray-400" />
                                                    {customer.address}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-sm max-w-xs truncate">
                                            {customer.description}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {customer.contact_number && (
                                                <div className="flex items-center gap-2">
                                                    <Smartphone size={14} className="text-gray-400" />
                                                    {customer.contact_number}
                                                </div>
                                            )}
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
                                                    onClick={() => handleDelete(customer.id)}
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-800 text-lg">
                                {editingCustomer ? 'Adres Düzenle' : 'Yeni Adres Ekle'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl font-light">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri Adı <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                                    <input
                                        type="tel"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">İletişim No</label>
                                    <input
                                        type="tel"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all"
                                        value={formData.contact_number}
                                        onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                                <textarea
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all resize-none"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Vazgeç
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200"
                                >
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveryAddresses;
