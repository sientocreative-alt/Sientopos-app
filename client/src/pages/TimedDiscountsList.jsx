import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const TimedDiscountsList = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.business_id) {
            fetchDiscounts();
        }
    }, [user]);

    const fetchDiscounts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('timed_discounts')
                .select('*')
                .eq('business_id', user.business_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDiscounts(data || []);
        } catch (error) {
            console.error('Error fetching timed discounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bu süreli indirimi silmek istediğinize emin misiniz?')) {
            try {
                const { error } = await supabase
                    .from('timed_discounts')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                fetchDiscounts();
            } catch (error) {
                console.error("Error deleting discount:", error);
                alert("Silme işlemi başarısız.");
            }
        }
    };

    const getStatus = (item) => {
        const now = new Date();
        const start = new Date(item.start_date);
        const end = new Date(item.end_date);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        if (now < start) return { label: 'Gelecek', class: 'bg-blue-100 text-blue-600' };
        if (now > end) return { label: 'Süresi Doldu', class: 'bg-gray-100 text-gray-500' };
        return { label: 'Aktif', class: 'bg-green-100 text-green-600' };
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20">
                        <Plus className="text-white" size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 tracking-tight">Süreli İndirimler</h1>
                        <div className="text-xs font-medium text-gray-400 mt-0.5">
                            Menü Yönetimi • İndirimler
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/isletme/sureli-indirimler/yeni')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
                >
                    <Plus size={18} /> Yeni İndirim Ekle
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100/50 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest pl-8">İndirim Tanımı</th>
                            <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Kapsam</th>
                            <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tarih Aralığı</th>
                            <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Durum</th>
                            <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center pr-8">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan="5" className="p-20 text-center text-gray-400 font-medium">Yükleniyor...</td></tr>
                        ) : discounts.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-20 text-center">
                                    <div className="flex flex-col items-center gap-3 max-w-xs mx-auto">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                                            <Edit2 size={32} />
                                        </div>
                                        <p className="text-gray-400 text-sm font-medium">Henüz süreli bir indirim tanımlanmamış.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            discounts.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition border-b border-gray-50 last:border-0">
                                    <td className="p-5 pl-8">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-800">{item.title}</span>
                                            <span className="text-[11px] font-black text-blue-500 mt-0.5">
                                                {item.discount_type === 'percentage' ? `%${item.discount_amount} İNDİRİM` : `${item.discount_amount}₺ İNDİRİM`}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded uppercase tracking-tighter">
                                                {item.target_type === 'category' ? 'Kategori' : 'Ürün'}
                                            </span>
                                            <span className="text-xs font-bold text-gray-600">
                                                {item.target_ids?.length || 0} Öğe
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs font-bold text-gray-700">{item.start_date}</span>
                                            <span className="text-[10px] font-bold text-gray-400">{item.end_date}</span>
                                        </div>
                                    </td>
                                    <td className="p-5 text-center">
                                        <span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider ${getStatus(item).class}`}>
                                            {getStatus(item).label}
                                        </span>
                                    </td>
                                    <td className="p-5 pr-8 text-center">
                                        <div className="flex justify-center gap-1">
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
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
    );
};

export default TimedDiscountsList;
