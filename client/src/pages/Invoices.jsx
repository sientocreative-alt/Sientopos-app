import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import {
    Plus,
    Search,
    FileText,
    Download,
    Filter,
    X,
    Calendar,
    Eye,
    Trash2,
    Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const Invoices = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        invoice_type: '',
        startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd')
    });

    useEffect(() => {
        if (user?.business_id) {
            fetchInvoices();
        }
    }, [user?.business_id, filters]);

    const fetchInvoices = async () => {
        try {
            setIsLoading(true);
            let query = supabase
                .from('invoices')
                .select(`
                    *,
                    customer_businesses(name),
                    suppliers(company_name)
                `)
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .gte('issue_date', filters.startDate)
                .lte('issue_date', filters.endDate)
                .order('issue_date', { ascending: false });

            if (filters.invoice_type) {
                query = query.eq('invoice_type', filters.invoice_type);
            }

            const { data, error } = await query;

            if (error) throw error;
            setInvoices(data || []);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu faturayı silmek istediğinize emin misiniz?')) return;

        try {
            const { error } = await supabase
                .from('invoices')
                .update({ is_deleted: true })
                .eq('id', id);

            if (error) throw error;
            fetchInvoices();
        } catch (error) {
            console.error('Error deleting invoice:', error);
        }
    };

    const exportToExcel = () => {
        const data = invoices.map(inv => ({
            'Tarih': format(new Date(inv.issue_date), 'dd.MM.yyyy'),
            'Fatura No': inv.invoice_no,
            'Tür': inv.invoice_type,
            'Taraf': inv.customer_businesses?.name || inv.suppliers?.company_name || '-',
            'Tutar': inv.total_amount,
            'Açıklama': inv.description
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Faturalar");
        XLSX.writeFile(wb, "Faturalar.xlsx");
    };

    const invoiceTypes = ['Gelir Faturası', 'Gider Faturası', 'Ödeme', 'İrsaliye', 'Tahsilat'];

    const resetFilters = () => {
        setFilters({
            invoice_type: '',
            startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
            endDate: format(new Date(), 'yyyy-MM-dd')
        });
        setSearchTerm('');
    };

    const filteredInvoices = invoices.filter(inv =>
        inv.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customer_businesses?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.suppliers?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 bg-[#F8FAFC] min-h-screen">
            <div className="max-w-[98%] mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                            Faturalar
                            <span className="text-sm font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{invoices.length}</span>
                        </h1>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                            <span>Pano</span>
                            <span>•</span>
                            <span>Muhasebe Kayıtları</span>
                            <span>•</span>
                            <span className="text-blue-600">Faturalar</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/isletme/faturalar/yeni')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Yeni Fatura
                        </button>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => navigate('/isletme/faturalar/yeni?type=Ödeme')}
                        className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-md transition-all group text-left"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-100 transition-colors">
                                <Download size={20} />
                            </div>
                            <h3 className="font-bold text-gray-800">Yeni Ödeme</h3>
                        </div>
                        <p className="text-xs text-gray-400 font-medium">Hızlıca ödeme kaydı oluştur</p>
                    </button>

                    <button
                        onClick={() => navigate('/isletme/faturalar/yeni?type=Gider Faturası')}
                        className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-md transition-all group text-left"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 group-hover:bg-red-100 transition-colors">
                                <FileText size={20} />
                            </div>
                            <h3 className="font-bold text-gray-800">Yeni Gider Faturası</h3>
                        </div>
                        <p className="text-xs text-gray-400 font-medium">Gider faturası işlemleri</p>
                    </button>

                    <button
                        onClick={() => navigate('/isletme/faturalar/yeni?type=İrsaliye')}
                        className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-md transition-all group text-left"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-orange-100 transition-colors">
                                <FileText size={20} />
                            </div>
                            <h3 className="font-bold text-gray-800">Yeni İrsaliye</h3>
                        </div>
                        <p className="text-xs text-gray-400 font-medium">İrsaliye kayıtları oluştur</p>
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <input
                                type="text"
                                placeholder="Hızlı Arama..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600"
                            />
                        </div>
                        <div>
                            <select
                                value={filters.invoice_type}
                                onChange={(e) => setFilters({ ...filters, invoice_type: e.target.value })}
                                className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600 appearance-none cursor-pointer"
                            >
                                <option value="">İşlem Türü Seçin</option>
                                {invoiceTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3">
                            <Calendar size={18} className="text-gray-400" />
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                className="w-full bg-transparent text-sm font-medium text-gray-600 focus:outline-none"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                className="w-full bg-transparent text-sm font-medium text-gray-600 focus:outline-none"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={fetchInvoices}
                                className="w-full px-4 py-3 bg-blue-100 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-200 transition-all flex items-center justify-center gap-2"
                            >
                                <Search size={16} />
                                Filtrele
                            </button>
                            <button
                                onClick={resetFilters}
                                className="w-full px-4 py-3 bg-red-100 text-red-600 rounded-xl font-bold text-sm hover:bg-red-200 transition-all flex items-center justify-center gap-2"
                            >
                                <X size={16} />
                                Filtreyi Temizle
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-center border-collapse">
                            <thead>
                                <tr className="bg-white">
                                    <th className="px-6 py-5 text-[13px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-100 border-r border-gray-50">Tarih</th>
                                    <th className="px-6 py-5 text-[13px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-100 border-r border-gray-50">Fatura No</th>
                                    <th className="px-6 py-5 text-[13px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-100 border-r border-gray-50">Tutar</th>
                                    <th className="px-6 py-5 text-[13px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-100 border-r border-gray-50">Açıklama</th>
                                    <th className="px-6 py-5 text-[13px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-100">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="animate-spin text-blue-600" size={32} />
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Yükleniyor...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-gray-400 font-bold uppercase tracking-widest text-xs">
                                            Tabloda herhangi bir veri mevcut değil
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInvoices.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-5 text-sm font-bold text-gray-600 border-r border-gray-50">
                                                {format(new Date(inv.issue_date), 'dd/MM/yyyy')}
                                            </td>
                                            <td className="px-6 py-5 text-sm font-black text-gray-700 border-r border-gray-50">
                                                {inv.invoice_no}
                                            </td>
                                            <td className="px-6 py-5 text-sm font-black text-gray-800 border-r border-gray-50">
                                                {parseFloat(inv.total_amount).toFixed(2).replace('.', ',')} ₺
                                            </td>
                                            <td className="px-6 py-5 text-sm font-medium text-gray-500 border-r border-gray-50 max-w-xs truncate" title={inv.description}>
                                                {inv.description || '-'}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => navigate(`/isletme/faturalar/duzenle/${inv.id}`)}
                                                        className="p-2 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-100 transition-all"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(inv.id)}
                                                        className="p-2 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
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
        </div>
    );
};

export default Invoices;
