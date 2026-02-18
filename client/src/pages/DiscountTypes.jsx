import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const DiscountTypes = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(true);

    const fetchDiscounts = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('discount_types')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .order('created_at', { ascending: false });

            if (searchTerm) {
                query = query.ilike('name', `%${searchTerm}%`);
            }

            const { data, error } = await query;

            if (error) throw error;
            setDiscounts(data || []);
        } catch (error) {
            console.error('Error fetching discount types:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchDiscounts();
    }, [user]);

    const handleDelete = async (id) => {
        if (!window.confirm('Bu indirim türünü silmek istediğinize emin misiniz?')) return;

        try {
            const { error } = await supabase
                .from('discount_types')
                .update({ is_deleted: true })
                .eq('id', id);

            if (error) throw error;
            fetchDiscounts();
        } catch (error) {
            console.error('Error deleting discount type:', error);
            alert('Silme işlemi başarısız oldu.');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="font-bold text-gray-900 text-lg">İndirim Türleri</span>
                    <span>Pano</span>
                    <span>•</span>
                    <span>Stok</span>
                    <span>•</span>
                    <span>İndirim Türleri</span>
                </div>
                <button
                    className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg font-medium hover:bg-blue-200 transition-colors"
                    onClick={() => navigate('/isletme/indirim-turleri/yeni')}
                >
                    Yeni İndirim Türü
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
                <div
                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                    <h2 className="text-lg font-bold text-gray-800">Filtreler</h2>
                    {isFilterOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </div>

                {isFilterOpen && (
                    <div className="p-6 pt-0 border-t border-gray-50">
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    className="w-full border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                                    placeholder="Hızlı Arama..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && fetchDiscounts()}
                                />
                                <Search className="absolute right-3 top-3 text-gray-400" size={18} />
                            </div>
                            <button
                                onClick={fetchDiscounts}
                                className="px-6 py-2 bg-blue-100 text-blue-600 rounded-lg font-medium hover:bg-blue-200 transition-colors flex items-center gap-2"
                            >
                                <Search size={18} />
                                Filtrele
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white border-b border-gray-50 text-gray-600 text-sm">
                            <th className="py-4 px-6 font-medium border-r border-gray-50">İndirim Adı</th>
                            <th className="py-4 px-6 font-medium border-r border-gray-50">İndirim Türü</th>
                            <th className="py-4 px-6 font-medium border-r border-gray-50">İndirim Miktarı</th>
                            <th className="py-4 px-6 font-medium text-center">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan="4" className="py-8 text-center text-gray-500">Yükleniyor...</td>
                            </tr>
                        ) : discounts.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="py-8 text-center text-gray-400">
                                    Tabloda herhangi bir veri mevcut değil
                                </td>
                            </tr>
                        ) : (
                            discounts.map((discount) => (
                                <tr key={discount.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="py-4 px-6 font-medium text-gray-900 border-r border-gray-50">{discount.name}</td>
                                    <td className="py-4 px-6 text-gray-600 border-r border-gray-50">{discount.type}</td>
                                    <td className="py-4 px-6 text-gray-600 border-r border-gray-50">
                                        {discount.type === 'Yüzdelik İndirim' ? `%${Number(discount.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : `${Number(discount.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`}
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => navigate(`/isletme/indirim-turleri/duzenle/${discount.id}`)}
                                                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(discount.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
    );
};

export default DiscountTypes;
