import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
    Search,
    Plus,
    Loader2,
    Trash2,
    Edit,
    Scale
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const StockUnits = () => {
    const { user } = useAuth();
    const [units, setUnits] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user?.business_id) {
            fetchUnits();
        }
    }, [user?.business_id]);

    const fetchUnits = async () => {
        try {
            setIsLoading(true);
            // Fetch all units. We need all of them to map base_unitnames if we don't do a join or if we just want to process client side.
            // Let's try to join self.
            const { data, error } = await supabase
                .from('stock_units')
                .select(`
                    *,
                    base_unit:base_unit_id (
                        name,
                        short_name
                    )
                `)
                .eq('business_id', user.business_id)
                .is('is_deleted', false) // assuming we filter soft deleted
                .order('created_at', { ascending: true });

            if (error) throw error;
            setUnits(data || []);
        } catch (error) {
            console.error('Error fetching stock units:', error);
            toast.error('Stok birimleri yüklenirken hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu stok birimini silmek istediğinize emin misiniz?')) return;

        try {
            // Soft delete
            const { error } = await supabase
                .from('stock_units')
                .update({ is_deleted: true })
                .eq('id', id);

            if (error) throw error;
            toast.success('Stok birimi silindi');
            fetchUnits();
        } catch (error) {
            console.error('Error deleting stock unit:', error);
            toast.error('Silme işlemi başarısız');
        }
    };

    const filteredUnits = units.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.short_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 bg-[#F8FAFC] min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                            Stok Birimleri
                        </h1>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                            <span>Pano</span>
                            <span>•</span>
                            <span>Stok</span>
                            <span>•</span>
                            <span className="text-blue-600">Stok Birimleri</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            to="/isletme/stok-birimleri/arsiv"
                            className="px-5 py-3 bg-orange-50 text-orange-600 rounded-xl font-bold text-sm hover:bg-orange-100 transition-all"
                        >
                            Arşiv
                        </Link>
                        <Link
                            to="/isletme/stok-birimleri/yeni"
                            className="px-5 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition-all flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Yeni Stok Birimi
                        </Link>
                    </div>
                </div>

                {/* Search & List */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6">
                    <div className="mb-6 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Stok Birimi Ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600"
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white border-b border-gray-100">
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-r border-gray-50 w-1/4">Ad</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-r border-gray-50 w-1/6">Kısaltma</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-r border-gray-50 w-1/4">Oran</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-r border-gray-50 w-1/6">Birim Tipi</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight text-center w-1/6">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="animate-spin text-blue-600" size={32} />
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Yükleniyor...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredUnits.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                                            Kayıtlı stok birimi bulunamadı
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUnits.map((unit) => (
                                        <tr key={unit.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4 text-sm font-bold text-gray-700 border-r border-gray-50">
                                                {unit.name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 border-r border-gray-50">
                                                {unit.short_name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 border-r border-gray-50">
                                                {unit.base_unit ? (
                                                    <span>{unit.ratio} {unit.base_unit.short_name}</span>
                                                ) : (
                                                    <span>1</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 border-r border-gray-50">
                                                {unit.type}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        to={`/isletme/stok-birimleri/duzenle/${unit.id}`}
                                                        className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit size={16} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(unit.id)}
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

export default StockUnits;
