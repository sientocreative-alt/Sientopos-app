import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
    Search,
    Plus,
    Loader2,
    Trash2,
    Edit,
    Server
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const Warehouses = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [warehouses, setWarehouses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user?.business_id) {
            fetchWarehouses();
        }
    }, [user?.business_id]);

    const fetchWarehouses = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('warehouses')
                .select('*')
                .eq('business_id', user.business_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setWarehouses(data || []);
        } catch (error) {
            console.error('Error fetching warehouses:', error);
            toast.error('Depolar yüklenirken hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu depoyu silmek istediğinize emin misiniz?')) return;

        try {
            const { error } = await supabase
                .from('warehouses')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Depo silindi');
            fetchWarehouses();
        } catch (error) {
            console.error('Error deleting warehouse:', error);
            toast.error('Silme işlemi başarısız');
        }
    };

    const filteredWarehouses = warehouses.filter(w =>
        w.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 bg-[#F8FAFC] min-h-screen">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                            Depolar
                        </h1>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                            <span>Pano</span>
                            <span>•</span>
                            <span>Stok</span>
                            <span>•</span>
                            <span className="text-blue-600">Depolar</span>
                        </div>
                    </div>
                    <Link
                        to="/isletme/depolar/yeni"
                        className="px-5 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition-all flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Yeni Depo
                    </Link>
                </div>

                {/* Search & List */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6">
                    <div className="mb-6 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Depo Ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600"
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white border-b border-gray-100">
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-r border-gray-50 text-center w-2/4">Depo Adı</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-r border-gray-50 text-center w-1/4">Satış Deposu</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight text-center w-1/4">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="3" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="animate-spin text-blue-600" size={32} />
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Yükleniyor...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredWarehouses.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-8 py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                                            Kayıtlı depo bulunamadı
                                        </td>
                                    </tr>
                                ) : (
                                    filteredWarehouses.map((warehouse) => (
                                        <tr key={warehouse.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4 text-sm font-bold text-gray-700 border-r border-gray-50 text-center">
                                                {warehouse.name}
                                            </td>
                                            <td className="px-6 py-4 border-r border-gray-50 text-center">
                                                {warehouse.is_sales_warehouse ? (
                                                    <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs font-bold inline-block">
                                                        Evet
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-gray-100 text-gray-400 rounded-full text-xs font-bold inline-block">
                                                        Hayır
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        to={`/isletme/depolar/duzenle/${warehouse.id}`}
                                                        className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit size={16} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(warehouse.id)}
                                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

export default Warehouses;
