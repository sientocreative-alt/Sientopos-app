import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import {
    Search,
    Filter,
    X,
    Calendar,
    Loader2
} from 'lucide-react';
import { format } from 'date-fns';

const InvoiceItems = () => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        invoice_type: '',
        startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd')
    });

    const invoiceTypes = ['Gelir Faturası', 'Gider Faturası', 'Ödeme', 'İrsaliye', 'Tahsilat'];

    useEffect(() => {
        if (user?.business_id) {
            fetchInvoiceItems();
        }
    }, [user?.business_id, filters]);

    const fetchInvoiceItems = async () => {
        try {
            setIsLoading(true);

            // Build the query
            let query = supabase
                .from('invoice_items')
                .select(`
                    *,
                    invoices!inner (
                        invoice_no,
                        issue_date,
                        invoice_type,
                        business_id,
                        description,
                        receiver_type,
                        suppliers (company_name),
                        customer_businesses (name)
                    ),
                    products (name)
                `)
                .eq('invoices.business_id', user.business_id)
                // Filter by date range on the joined invoice table
                .gte('invoices.issue_date', filters.startDate)
                .lte('invoices.issue_date', filters.endDate)
                .order('created_at', { ascending: false });

            if (filters.invoice_type) {
                query = query.eq('invoices.invoice_type', filters.invoice_type);
            }

            const { data, error } = await query;

            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            console.error('Error fetching invoice items:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const resetFilters = () => {
        setFilters({
            invoice_type: '',
            startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
            endDate: format(new Date(), 'yyyy-MM-dd')
        });
        setSearchTerm('');
    };

    const filteredItems = items.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        return (
            item.invoices?.invoice_no?.toLowerCase().includes(searchLower) ||
            item.products?.name?.toLowerCase().includes(searchLower) ||
            item.invoices?.suppliers?.company_name?.toLowerCase().includes(searchLower) ||
            item.invoices?.customer_businesses?.name?.toLowerCase().includes(searchLower)
        );
    });

    const formatCurrency = (val) => {
        return parseFloat(val || 0).toFixed(2).replace('.', ',') + ' ₺';
    };

    // Calculate columns
    // "KDV Hariç" is usually Unit Price * Quantity if Unit Price is excl VAT.
    // "KDV Dahil" is stored as total_amount in invoice_items.

    return (
        <div className="p-8 bg-[#F8FAFC] min-h-screen">
            <div className="max-w-[98%] mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                            Fatura Kalemleri
                            <span className="text-sm font-bold text-white bg-blue-600 px-3 py-1 rounded-full">{items.length}</span>
                        </h1>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                            <span>Faturalar</span>
                            <span>•</span>
                            <span>Pano</span>
                            <span>•</span>
                            <span>Muhasebe Kayıtları</span>
                            <span>•</span>
                            <span className="text-blue-600">Faturalar</span>
                        </div>
                    </div>
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
                                onClick={fetchInvoiceItems}
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
                                    <th className="px-4 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-100 border-r border-gray-50">Fatura Tarihi</th>
                                    <th className="px-4 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-100 border-r border-gray-50">Fatura No</th>
                                    <th className="px-4 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-100 border-r border-gray-50">Fatura Türü</th>
                                    <th className="px-4 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-100 border-r border-gray-50">Tedarikçi</th>
                                    <th className="px-4 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-100 border-r border-gray-50">Ürün</th>
                                    <th className="px-4 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-100 border-r border-gray-50">Miktar</th>
                                    <th className="px-4 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-100 border-r border-gray-50">Birim</th>
                                    <th className="px-4 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-100 border-r border-gray-50">KDV</th>
                                    <th className="px-4 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-100 border-r border-gray-50">Birim Fiyat</th>
                                    <th className="px-4 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-100 border-r border-gray-50">KDV Hariç</th>
                                    <th className="px-4 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-100 border-r border-gray-50">KDV Tutarı</th>
                                    <th className="px-4 py-4 text-[11px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-100">KDV Dahil</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="12" className="px-8 py-20">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="animate-spin text-blue-600" size={32} />
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Yükleniyor...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="12" className="px-8 py-20 text-gray-400 font-bold uppercase tracking-widest text-xs">
                                            Tabloda herhangi bir veri mevcut değil
                                        </td>
                                    </tr>
                                ) : (
                                    filteredItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-4 py-4 text-xs font-bold text-gray-600 border-r border-gray-50">
                                                {format(new Date(item.invoices?.issue_date), 'dd/MM/yyyy')}
                                            </td>
                                            <td className="px-4 py-4 text-xs font-black text-gray-700 border-r border-gray-50">
                                                {item.invoices?.invoice_no}
                                            </td>
                                            <td className="px-4 py-4 text-xs font-medium text-gray-600 border-r border-gray-50">
                                                {item.invoices?.invoice_type}
                                            </td>
                                            <td className="px-4 py-4 text-xs font-medium text-gray-600 border-r border-gray-50 truncate max-w-[150px]">
                                                {item.invoices?.customer_businesses?.name || item.invoices?.suppliers?.company_name || '-'}
                                            </td>
                                            <td className="px-4 py-4 text-xs font-black text-gray-800 border-r border-gray-50">
                                                {item.products?.name || '-'}
                                            </td>
                                            <td className="px-4 py-4 text-xs font-bold text-gray-700 border-r border-gray-50">
                                                {item.quantity}
                                            </td>
                                            <td className="px-4 py-4 text-xs font-medium text-gray-600 border-r border-gray-50">
                                                {item.unit}
                                            </td>
                                            <td className="px-4 py-4 text-xs font-bold text-gray-700 border-r border-gray-50">
                                                %{item.tax_kdv_rate}
                                            </td>
                                            <td className="px-4 py-4 text-xs font-medium text-gray-600 border-r border-gray-50">
                                                {formatCurrency(item.unit_price_excl_vat)}
                                            </td>
                                            <td className="px-4 py-4 text-xs font-medium text-gray-600 border-r border-gray-50">
                                                {formatCurrency(item.quantity * item.unit_price_excl_vat)}
                                            </td>
                                            <td className="px-4 py-4 text-xs font-medium text-gray-600 border-r border-gray-50">
                                                {formatCurrency(item.tax_kdv_amount)}
                                            </td>
                                            <td className="px-4 py-4 text-xs font-black text-gray-800">
                                                {formatCurrency(item.total_amount)}
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

export default InvoiceItems;
