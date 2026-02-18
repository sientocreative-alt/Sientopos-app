import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import {
    Plus,
    Search,
    Building2,
    Phone,
    User,
    MoreVertical,
    FileSpreadsheet,
    Loader2,
    Trash2,
    Edit
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';

const CustomerBusinesses = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [businesses, setBusinesses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeMenu, setActiveMenu] = useState(null);

    useEffect(() => {
        fetchBusinesses();
    }, []);

    const fetchBusinesses = async () => {
        try {
            const { data, error } = await supabase
                .from('customer_businesses')
                .select('*')
                .eq('is_deleted', false)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBusinesses(data || []);
        } catch (error) {
            console.error('Error fetching businesses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu müşteri işletmeyi silmek istediğinize emin misiniz?')) return;

        try {
            const { error } = await supabase
                .from('customer_businesses')
                .update({ is_deleted: true })
                .eq('id', id);

            if (error) throw error;
            setBusinesses(businesses.filter(b => b.id !== id));
        } catch (error) {
            console.error('Error deleting business:', error);
        }
    };

    const exportToExcel = () => {
        const dataToExport = businesses.map(b => ({
            'Müşteri Adı': b.name,
            'Yetkili': b.authorized_person,
            'Telefon': b.phone,
            'E-Posta': b.email,
            'Durum': b.status === 'active' ? 'Aktif' : 'Pasif'
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Müşteri İşletmeler");
        XLSX.writeFile(wb, "Musteri_Isletmeler.xlsx");
    };

    const filteredBusinesses = businesses.filter(b =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.authorized_person && b.authorized_person.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        Müşteri İşletmeler
                        <span className="text-sm font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{businesses.length}</span>
                    </h1>
                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <span>Pano</span>
                        <span className="text-gray-300">•</span>
                        <span>Faturalar</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-blue-600 font-medium">Müşteri İşletmeler</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="İşletme Ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64 shadow-sm"
                        />
                    </div>

                    <button
                        onClick={exportToExcel}
                        className="px-4 py-3 bg-purple-50 text-purple-600 rounded-xl font-bold hover:bg-purple-100 transition-colors flex items-center gap-2"
                    >
                        <FileSpreadsheet size={20} />
                        Excele aktar
                    </button>

                    <button
                        onClick={() => navigate('/isletme/musteri-isletmeler/yeni')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Yeni Müşteri İşletme
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                </div>
            ) : filteredBusinesses.length === 0 ? (
                <div className="bg-white rounded-[24px] border border-gray-100 p-12 text-center shadow-sm">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Building2 size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Kayıt Bulunamadı</h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">
                        Henüz hiç müşteri işletme eklenmemiş. Yeni bir işletme ekleyerek başlayabilirsiniz.
                    </p>
                    <button
                        onClick={() => navigate('/isletme/musteri-isletmeler/yeni')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Yeni Müşteri İşletme Ekle
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="text-left py-4 px-6 text-[11px] font-black text-gray-400 uppercase tracking-wider">Müşteri Adı</th>
                                <th className="text-left py-4 px-6 text-[11px] font-black text-gray-400 uppercase tracking-wider">Telefon Numarası</th>
                                <th className="text-left py-4 px-6 text-[11px] font-black text-gray-400 uppercase tracking-wider">Yetkili Ad Soyad</th>
                                <th className="text-left py-4 px-6 text-[11px] font-black text-gray-400 uppercase tracking-wider">Güncel Durum</th>
                                <th className="text-right py-4 px-6 text-[11px] font-black text-gray-400 uppercase tracking-wider">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredBusinesses.map((business) => (
                                <tr key={business.id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black">
                                                {business.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{business.name}</p>
                                                <p className="text-xs text-gray-400 font-medium">{business.city || '-'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2 text-gray-600 font-medium">
                                            <Phone size={14} className="text-gray-400" />
                                            {business.phone || '-'}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2 text-gray-600 font-medium">
                                            <User size={14} className="text-gray-400" />
                                            {business.authorized_person || '-'}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${business.status === 'active'
                                                ? 'bg-green-50 text-green-600'
                                                : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {business.status === 'active' ? 'Aktif' : 'Pasif'}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <div className="relative inline-block">
                                            <button
                                                onClick={() => setActiveMenu(activeMenu === business.id ? null : business.id)}
                                                className="p-2 hover:bg-white hover:shadow-md rounded-xl text-gray-400 hover:text-gray-600 transition-all"
                                            >
                                                <MoreVertical size={20} />
                                            </button>

                                            {activeMenu === business.id && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-10"
                                                        onClick={() => setActiveMenu(null)}
                                                    ></div>
                                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                                        <button
                                                            onClick={() => navigate(`/isletme/musteri-isletmeler/duzenle/${business.id}`)}
                                                            className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                        >
                                                            <Edit size={16} />
                                                            Düzenle
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(business.id)}
                                                            className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                        >
                                                            <Trash2 size={16} />
                                                            Sil
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default CustomerBusinesses;
