import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
    Plus,
    Search,
    Filter,
    Loader2,
    Eye,
    ChevronDown,
    Calendar,
    ArrowRight,
    Edit2,
    Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale/tr';

const StockEntries = () => {
    const { user } = useAuth();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user?.business_id) {
            fetchStockEntries();
        }
    }, [user?.business_id]);

    const fetchStockEntries = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('stock_entries')
                .select(`
                    *,
                    product:product_id(name),
                    unit:unit_id(short_name),
                    warehouse:warehouse_id(name),
                    supplier:supplier_id(company_name)
                `)
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEntries(data || []);
        } catch (error) {
            console.error('Error fetching stock entries:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu stok girişini silmek istediğinize emin misiniz?')) return;

        try {
            const { error } = await supabase
                .from('stock_entries')
                .update({ is_deleted: true })
                .eq('id', id);

            if (error) throw error;
            toast.success('Stok girişi silindi');
            fetchStockEntries();
        } catch (error) {
            console.error('Error deleting stock entry:', error);
            toast.error('Silme işlemi başarısız');
        }
    };

    const filteredEntries = entries.filter(entry =>
        entry.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 bg-[#F8FAFC] min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                            Stok Girişi
                        </h1>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                            <span>Pano</span>
                            <span>•</span>
                            <span>Stok</span>
                            <span>•</span>
                            <span className="text-blue-600">Stok Girişi</span>
                        </div>
                    </div>
                    <Link
                        to="/isletme/stok-girisi/yeni"
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                    >
                        <Plus size={18} />
                        Yeni Stok Girişi
                    </Link>
                </div>

                {/* Filters Panel */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-6 group cursor-pointer">
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                            <Filter size={16} className="text-blue-500" />
                            Filtreler
                        </h3>
                        <ChevronDown size={18} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Hızlı Arama..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                            />
                        </div>
                        <button className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition-all">
                            <Search size={18} />
                            Filtrele
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Ürün</th>
                                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Marka</th>
                                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Miktar</th>
                                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Depo</th>
                                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Birim Fiyat</th>
                                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Tedarikçi</th>
                                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Fatura No</th>
                                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Eklenme Tarihi</th>
                                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Ekleyen</th>
                                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="9" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="animate-spin text-blue-600" size={32} />
                                                <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Yükleniyor...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredEntries.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="px-6 py-20 text-center text-gray-400 font-bold text-xs uppercase tracking-widest">
                                            Kayıt bulunamadı
                                        </td>
                                    </tr>
                                ) : (
                                    filteredEntries.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="font-bold text-gray-800 text-sm">
                                                    {entry.product?.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-sm font-bold text-gray-500">{entry.brand || '-'}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-gray-800">{entry.amount}</span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">{entry.unit?.short_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                    <span className="text-sm font-bold text-gray-700">{entry.warehouse?.name || 'Genel'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-sm font-bold text-gray-700">{Number(entry.buy_price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-sm font-bold text-gray-600">{entry.supplier?.company_name || '-'}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-sm font-bold text-gray-400">#{entry.invoice_no || '-'}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2 text-gray-500 font-bold text-xs">
                                                    <Calendar size={14} />
                                                    {format(new Date(entry.created_at), 'dd MMM yyyy', { locale: tr })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-[11px] font-bold text-gray-400 uppercase">{entry.created_by_user?.email?.split('@')[0]}</span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        to={`/isletme/stok-girisi/duzenle/${entry.id}`}
                                                        className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Düzenle"
                                                    >
                                                        <Edit2 size={16} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(entry.id)}
                                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Sil"
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
            </div>
        </div>
    );
};

export default StockEntries;
