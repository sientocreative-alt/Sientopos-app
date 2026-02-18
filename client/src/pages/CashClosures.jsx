import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    RefreshCw,
    Eye,
    Edit3,
    Trash2,
    CheckCircle2,
    XCircle,
    Calendar,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const CashClosures = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [closures, setClosures] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchClosures = async () => {
        if (!user?.business_id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('cash_closures')
                .select(`
                    *,
                    profiles:created_by (full_name)
                `)
                .eq('business_id', user.business_id)
                .order('date', { ascending: false });

            if (error) throw error;
            setClosures(data || []);
        } catch (err) {
            console.error('Error fetching cash closures:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchClosures();
    }, [user]);

    const handleDelete = async (id) => {
        if (!window.confirm('Bu kasa kapanış kaydını silmek istediğinize emin misiniz?')) return;
        try {
            const { error } = await supabase
                .from('cash_closures')
                .delete()
                .eq('id', id);
            if (error) throw error;
            setClosures(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            alert('Silme işlemi sırasında bir hata oluştu.');
            console.error(err);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0);
    };

    const filteredClosures = closures.filter(c =>
        format(new Date(c.date), 'dd MMMM yyyy', { locale: tr }).toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 bg-[#F8FAFC] min-h-screen font-sans text-left">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight text-left">Kasa Kapanışları</h1>
                        <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest text-left">
                            Pano • Muhasebe • Kasa Kapanışları
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/isletme/kasa-kapanisi/yeni')}
                        className="flex items-center gap-2 bg-[#5D5FEF] hover:bg-[#4B4DDB] text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-100 active:scale-95"
                    >
                        <Plus size={18} />
                        Yeni Kasa Kapanışı
                    </button>
                </div>

                {/* Filters & Search */}
                <div className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tarih veya oluşturan kişi ile ara..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={fetchClosures}
                        className="p-3 bg-gray-50 text-gray-400 hover:text-indigo-600 rounded-xl transition-all active:scale-95"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto text-left">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-left">Tarih</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-left">Nakit</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-left">Kredi Kartı</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-left">Açılış</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-left">Toplam</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-left">Fark</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-left">Durum</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-left">Sorumlu</th>
                                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="9" className="px-8 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <RefreshCw className="text-indigo-600 animate-spin" size={32} />
                                                <span className="text-xs font-bold text-gray-400">Veriler Yükleniyor...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredClosures.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="px-8 py-12 text-center text-gray-400 font-bold text-sm">
                                            Kayıt bulunamadı.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredClosures.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-8 py-5 text-sm font-bold text-gray-600">
                                                {format(new Date(item.date), 'dd/MM/yyyy')}
                                            </td>
                                            <td className="px-8 py-5 text-sm font-bold text-gray-600">
                                                {formatCurrency(item.cash_entered)}
                                            </td>
                                            <td className="px-8 py-5 text-sm font-bold text-gray-600">
                                                {formatCurrency(item.cc_entered)}
                                            </td>
                                            <td className="px-8 py-5 text-sm font-bold text-gray-600">
                                                {formatCurrency(item.opening_balance)}
                                            </td>
                                            <td className="px-8 py-5 text-sm font-bold text-gray-600">
                                                {formatCurrency(item.cash_entered + item.cc_entered + item.opening_balance)}
                                            </td>
                                            <td className="px-8 py-5 text-sm font-bold text-gray-600">
                                                {formatCurrency(item.difference)}
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#14B8A6] text-white">
                                                    <CheckCircle2 size={16} />
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-bold text-gray-600">
                                                {item.profiles?.full_name || 'Bilinmiyor'}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button
                                                    onClick={() => navigate(`/isletme/kasa-kapanisi/${item.id}`)}
                                                    className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CashClosures;
