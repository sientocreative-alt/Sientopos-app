import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import {
    Search,
    Plus,
    Edit2,
    Trash2,
    X,
    Hash,
    Percent,
    ArrowUpDown,
    CheckCircle2
} from 'lucide-react';

const PosProductTypes = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [types, setTypes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        sort_order: 0,
        tax_rate: 0
    });

    useEffect(() => {
        if (user?.business_id) {
            fetchTypes();
        }
    }, [user?.business_id]);

    const fetchTypes = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('pos_product_types')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .order('sort_order', { ascending: true });

            if (error) throw error;
            setTypes(data || []);
        } catch (error) {
            console.error('Error fetching types:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                business_id: user.business_id,
                name: formData.name,
                sort_order: parseInt(formData.sort_order) || 0,
                tax_rate: parseFloat(formData.tax_rate) || 0
            };

            if (editingType) {
                const { error } = await supabase
                    .from('pos_product_types')
                    .update(payload)
                    .eq('id', editingType.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('pos_product_types')
                    .insert([payload]);
                if (error) throw error;
            }

            setShowModal(false);
            setEditingType(null);
            setFormData({ name: '', sort_order: 0, tax_rate: 0 });
            fetchTypes();
        } catch (error) {
            console.error('Error saving type:', error);
            alert('Hata oluştu: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu KDV grubunu silmek istediğinize emin misiniz?')) return;
        try {
            const { error } = await supabase
                .from('pos_product_types')
                .update({ is_deleted: true })
                .eq('id', id);
            if (error) throw error;
            fetchTypes();
        } catch (error) {
            console.error('Error deleting type:', error);
        }
    };

    const openEdit = (type) => {
        setEditingType(type);
        setFormData({
            name: type.name,
            sort_order: type.sort_order,
            tax_rate: type.tax_rate
        });
        setShowModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const filteredTypes = types.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 bg-[#F8FAFC] min-h-screen font-sans">
            <div className="max-w-[98%] mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="text-left">
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <Percent size={24} />
                            </span>
                            Ürün KDV Oranları
                        </h1>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                            <span>Pano</span>
                            <span>•</span>
                            <span className="text-gray-500">Ürün KDV Oranları</span>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setEditingType(null);
                            setFormData({ name: '', sort_order: 0, tax_rate: 0 });
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-600 px-6 py-3 rounded-xl font-black text-xs transition-all shadow-sm active:scale-95 uppercase tracking-wider"
                    >
                        <Plus size={18} />
                        Yeni Pos Ürünleri
                    </button>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden text-left">
                    {/* Search Bar */}
                    <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                        <div className="relative max-w-md">
                            <input
                                type="text"
                                placeholder="KDV Grubu Ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Ad</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Pos Sırası</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Vergi Oranı</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Yükleniyor...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredTypes.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                                            Kayıt bulunamadı.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTypes.map((type) => (
                                        <tr key={type.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3 text-left">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                                        <CheckCircle2 size={14} />
                                                    </div>
                                                    <span className="text-sm font-black text-gray-700">{type.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
                                                    {type.sort_order}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                                                    %{type.tax_rate}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEdit(type)}
                                                        className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                                                        title="Düzenle"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(type.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Sil"
                                                    >
                                                        <Trash2 size={18} />
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
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden text-left">
                        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">
                                {editingType ? 'KDV Grubu Düzenle' : 'Pos Ürünleri Ekle'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div>
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 text-left">Ad</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        autoFocus
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-700"
                                        placeholder="KDV Grubu Adı"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 text-left">Pos Sırası</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="sort_order"
                                            required
                                            value={formData.sort_order}
                                            onChange={handleInputChange}
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-700"
                                        />
                                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 text-left">Vergi Oranı</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="tax_rate"
                                            required
                                            min="0"
                                            max="100"
                                            value={formData.tax_rate}
                                            onChange={handleInputChange}
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-700"
                                        />
                                        <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-6 py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-100"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-4 bg-[#14b8a6] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#0d9488] transition-all active:scale-95 shadow-lg shadow-[#14b8a6]/10"
                                >
                                    {editingType ? 'Güncelle' : 'Pos Ürünleri Ekle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PosProductTypes;
