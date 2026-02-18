import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Plus,
    FileText,
    Archive,
    Eye,
    Edit2,
    Trash2,
    X,
    Building2,
    Phone,
    User,
    Wallet,
    Download
} from 'lucide-react';
import * as XLSX from 'xlsx';

const Suppliers = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [suppliers, setSuppliers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [formData, setFormData] = useState({
        company_name: '',
        authorized_person: '',
        email: '',
        phone: '',
        address: '',
        fax: '',
        city: '',
        tax_no: '',
        tax_office: '',
        tag: ''
    });

    useEffect(() => {
        if (user?.business_id) {
            fetchSuppliers();
        }
    }, [user?.business_id]);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('suppliers')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .order('company_name', { ascending: true });

            if (error) throw error;
            setSuppliers(data || []);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                business_id: user.business_id,
                ...formData
            };

            if (editingSupplier) {
                const { error } = await supabase
                    .from('suppliers')
                    .update(payload)
                    .eq('id', editingSupplier.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('suppliers')
                    .insert([payload]);
                if (error) throw error;
            }

            setShowModal(false);
            resetForm();
            fetchSuppliers();
        } catch (error) {
            console.error('Error saving supplier:', error);
            alert('Hata oluştu: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu tedarikçiyi silmek istediğinize emin misiniz?')) return;
        try {
            const { error } = await supabase
                .from('suppliers')
                .update({ is_deleted: true })
                .eq('id', id);
            if (error) throw error;
            fetchSuppliers();
        } catch (error) {
            console.error('Error deleting supplier:', error);
        }
    };

    const resetForm = () => {
        setEditingSupplier(null);
        setFormData({
            company_name: '',
            authorized_person: '',
            email: '',
            phone: '',
            address: '',
            fax: '',
            city: '',
            tax_no: '',
            tax_office: '',
            tag: ''
        });
    };

    const openEdit = (supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            company_name: supplier.company_name,
            authorized_person: supplier.authorized_person,
            email: supplier.email,
            phone: supplier.phone,
            address: supplier.address,
            fax: supplier.fax,
            city: supplier.city,
            tax_no: supplier.tax_no,
            tax_office: supplier.tax_office,
            tag: supplier.tag
        });
        setShowModal(true);
    };

    const exportToExcel = () => {
        const data = suppliers.map(s => ({
            'Firma Adı': s.company_name,
            'Yetkili': s.authorized_person,
            'Telefon': s.phone,
            'Borç': s.current_debt,
            'Şehir': s.city,
            'Vergi No': s.tax_no
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Tedarikçiler");
        XLSX.writeFile(wb, "tedarikciler.xlsx");
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.authorized_person?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 bg-[#F8FAFC] min-h-screen font-sans text-left">
            <div className="max-w-[98%] mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <Building2 size={24} />
                            </span>
                            Tedarikçiler
                        </h1>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                            <span>Pano</span>
                            <span>•</span>
                            <span>Faturalar</span>
                            <span>•</span>
                            <span className="text-gray-500">Tedarikçiler</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-6 py-3 rounded-xl font-black text-xs transition-all shadow-sm active:scale-95 uppercase tracking-wider"
                        >
                            <Plus size={18} />
                            Yeni Tedarikçi
                        </button>
                        <button
                            onClick={exportToExcel}
                            className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-600 px-6 py-3 rounded-xl font-black text-xs transition-all shadow-sm active:scale-95 uppercase tracking-wider"
                        >
                            <Download size={18} />
                            Excele aktar
                        </button>
                        <button
                            className="flex items-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-600 px-6 py-3 rounded-xl font-black text-xs transition-all shadow-sm active:scale-95 uppercase tracking-wider"
                        >
                            <Archive size={18} />
                            Arşiv
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                    {/* Search Bar */}
                    <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex justify-end">
                        <div className="relative w-full max-w-xs">
                            <input
                                type="text"
                                placeholder="Hızlı Arama..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-6 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-400"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-center border-collapse">
                            <thead>
                                <tr className="bg-white">
                                    <th className="px-8 py-10 text-[13px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-50">Firma Adı</th>
                                    <th className="px-8 py-10 text-[13px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-50">Telefon Numarası</th>
                                    <th className="px-8 py-10 text-[13px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-50">Yetkili Ad Soyad</th>
                                    <th className="px-8 py-10 text-[13px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-50">Güncel Borç</th>
                                    <th className="px-8 py-10 text-[13px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-50">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Yükleniyor...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredSuppliers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-gray-400 font-bold uppercase tracking-widest text-xs">
                                            Kayıt bulunamadı.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSuppliers.map((supplier) => (
                                        <tr key={supplier.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-8 py-6 text-sm font-black text-gray-700">{supplier.company_name}</td>
                                            <td className="px-8 py-6 text-sm font-bold text-gray-500">{supplier.phone || '-'}</td>
                                            <td className="px-8 py-6 text-sm font-bold text-gray-500">{supplier.authorized_person || '-'}</td>
                                            <td className="px-8 py-6 text-sm font-black text-red-600">
                                                {parseFloat(supplier.current_debt || 0).toFixed(2).replace('.', ',')} ₺
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => navigate(`/isletme/tedarikciler/${supplier.id}`)}
                                                        className="p-2.5 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-100 transition-all"
                                                        title="Görüntüle"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => openEdit(supplier)}
                                                        className="p-2.5 bg-gray-50 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                                                        title="Düzenle"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(supplier.id)}
                                                        className="p-2.5 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
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
                    <div className="bg-white rounded-[40px] w-full max-w-5xl shadow-2xl overflow-y-auto max-h-[90vh] text-left custom-scrollbar">
                        <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
                                {editingSupplier ? 'Tedarikçi Düzenle' : 'Tedarikçi Ekle'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-12 h-12 rounded-2xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                                <X size={28} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                                {/* Left Column */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">* Firma Adı</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.company_name}
                                            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-700 shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">E Mail</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-700 shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Adres</label>
                                        <textarea
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            rows="4"
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-700 shadow-sm resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Şehir</label>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            placeholder="Şehir giriniz"
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-700 shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Etiket</label>
                                        <input
                                            type="text"
                                            value={formData.tag}
                                            onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-700 shadow-sm"
                                        />
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Yetkili Ad Soyad</label>
                                        <input
                                            type="text"
                                            value={formData.authorized_person}
                                            onChange={(e) => setFormData({ ...formData, authorized_person: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-700 shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Telefon Numarası</label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-700 shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Faks Numarası</label>
                                        <input
                                            type="text"
                                            value={formData.fax}
                                            onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-700 shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Vergi No</label>
                                        <input
                                            type="text"
                                            value={formData.tax_no}
                                            onChange={(e) => setFormData({ ...formData, tax_no: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-700 shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Vergi Dairesi</label>
                                        <input
                                            type="text"
                                            value={formData.tax_office}
                                            onChange={(e) => setFormData({ ...formData, tax_office: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-700 shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-10 border-t border-gray-50 mt-10">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-10 py-4 bg-gray-200 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-300 transition-all active:scale-95 shadow-sm"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-10 py-4 bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-blue-100"
                                >
                                    {editingSupplier ? 'Tedarikçi Güncelle' : 'Tedarikçi Ekle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Suppliers;
