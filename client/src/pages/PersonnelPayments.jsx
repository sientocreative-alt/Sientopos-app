import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
    Search,
    Filter,
    X,
    Plus,
    FileText,
    Download,
    Loader2,
    Trash2,
    Edit,
    Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const PersonnelPayments = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        transaction_type: '', // Borç, Ödeme
        payment_method: '',
        category: '', // Maaş, Avans, vs.
        staff_id: ''
    });

    useEffect(() => {
        if (user?.business_id) {
            fetchTransactions();
            fetchStaff();
        }
    }, [user?.business_id, filters]);

    const fetchStaff = async () => {
        const { data } = await supabase
            .from('staff')
            .select('id, first_name, last_name')
            .eq('business_id', user.business_id);

        if (data) setStaffList(data);
    };

    const fetchTransactions = async () => {
        try {
            setIsLoading(true);
            let query = supabase
                .from('staff_transactions')
                .select(`
                    *,
                    staff (first_name, last_name)
                `)
                .eq('business_id', user.business_id)
                .order('transaction_date', { ascending: false });

            if (filters.transaction_type) query = query.eq('transaction_type', filters.transaction_type);
            if (filters.payment_method) query = query.eq('payment_method', filters.payment_method);
            if (filters.category) query = query.eq('category', filters.category);
            if (filters.staff_id) query = query.eq('staff_id', filters.staff_id);

            const { data, error } = await query;

            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            toast.error('Veriler yüklenirken hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;

        try {
            const { error } = await supabase
                .from('staff_transactions')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Kayıt silindi');
            fetchTransactions();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            toast.error('Silme işlemi başarısız');
        }
    };

    const formatCurrency = (val) => {
        return parseFloat(val || 0).toFixed(2).replace('.', ',') + ' ₺';
    };

    return (
        <div className="p-8 bg-[#F8FAFC] min-h-screen">
            <div className="max-w-[98%] mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                            Personel Ödemeleri
                        </h1>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                            <span>Pano</span>
                            <span>•</span>
                            <span>Muhasebe Kayıtları</span>
                            <span>•</span>
                            <span className="text-blue-600">Personel Ödemeleri</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            to="/isletme/maas-bilgileri/yeni?type=odeme"
                            className="px-5 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition-all flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Yeni Ödeme
                        </Link>
                        <Link
                            to="/isletme/maas-bilgileri/yeni?type=borc"
                            className="px-5 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-all flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Yeni Alacak
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600 appearance-none"
                        >
                            <option value="">İşlem Türü Seçin</option>
                            <option value="Maaş">Maaş</option>
                            <option value="Avans">Avans</option>
                            <option value="Prim">Prim</option>
                            <option value="Yemek">Yemek</option>
                            <option value="Yol">Yol</option>
                            <option value="Diğer">Diğer</option>
                        </select>

                        <select
                            value={filters.payment_method}
                            onChange={(e) => setFilters({ ...filters, payment_method: e.target.value })}
                            className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600 appearance-none"
                        >
                            <option value="">Ödeme Şekli Seçin</option>
                            <option value="Nakit">Nakit</option>
                            <option value="Havale/EFT">Havale/EFT</option>
                            <option value="Kredi Kartı">Kredi Kartı</option>
                        </select>

                        <select
                            value={filters.transaction_type}
                            onChange={(e) => setFilters({ ...filters, transaction_type: e.target.value })}
                            className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600 appearance-none"
                        >
                            <option value="">Hareket Tipi Seçin</option>
                            <option value="Ödeme">Ödeme</option>
                            <option value="Borç">Borç</option>
                        </select>

                        <select
                            value={filters.staff_id}
                            onChange={(e) => setFilters({ ...filters, staff_id: e.target.value })}
                            className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600 appearance-none"
                        >
                            <option value="">Personel Seçimi</option>
                            {staffList.map(staff => (
                                <option key={staff.id} value={staff.id}>
                                    {staff.first_name} {staff.last_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button
                            onClick={() => fetchTransactions()}
                            className="px-8 py-3 bg-blue-100 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-200 transition-all flex items-center justify-center gap-2"
                        >
                            <Search size={16} />
                            Filtrele
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white border-b border-gray-100">
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-r border-gray-50">Personel Adı</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-r border-gray-50">Hareket Tipi</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-r border-gray-50">Tutar</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-r border-gray-50">İşlem Türü</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-r border-gray-50">Ödeme Şekli</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-r border-gray-50">Oluşturulma Tarihi</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-r border-gray-50">Belge</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="8" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="animate-spin text-blue-600" size={32} />
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Yükleniyor...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-8 py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                                            Tabloda herhangi bir veri mevcut değil
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4 text-sm font-bold text-gray-700 border-r border-gray-50">
                                                {item.staff?.first_name} {item.staff?.last_name}
                                            </td>
                                            <td className="px-6 py-4 border-r border-gray-50">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.transaction_type === 'Ödeme'
                                                    ? 'bg-blue-100 text-blue-600'
                                                    : 'bg-red-100 text-red-600'
                                                    }`}>
                                                    {item.transaction_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-black text-gray-800 border-r border-gray-50">
                                                {formatCurrency(item.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-600 border-r border-gray-50">
                                                {item.category || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-600 border-r border-gray-50">
                                                {item.payment_method || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-600 border-r border-gray-50">
                                                {format(new Date(item.transaction_date), 'dd/MM/yyyy')}
                                            </td>
                                            <td className="px-6 py-4 border-r border-gray-50">
                                                {item.file_url ? (
                                                    <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                                                        <FileText size={18} />
                                                    </a>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {/* Edit button could go here */}
                                                    <Link
                                                        to={`/isletme/maas-bilgileri/${item.id}`}
                                                        className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <Eye size={16} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
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

export default PersonnelPayments;
