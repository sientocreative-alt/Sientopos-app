import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Search,
    Filter,
    Download,
    ChevronDown,
    Calendar,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    DollarSign,
    User,
    CheckCircle2,
    XCircle,
    Info
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';

const Payments = () => {
    const { user } = useAuth();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, cash: 0, card: 0 });

    // Filters
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        staff: 'Seçilmedi',
        paymentMethod: 'Seçilmedi',
        status: 'Ödeme Durumu',
        deleted: 'Silindi'
    });

    const [staffList, setStaffList] = useState([]);

    useEffect(() => {
        if (user) {
            fetchStaff();
            fetchPayments();
        }
    }, [user]);

    const fetchStaff = async () => {
        const { data } = await supabase
            .from('staff')
            .select('id, first_name, last_name')
            .eq('business_id', user.business_id)
            .is('is_archived', false);
        setStaffList(data || []);
    };

    const fetchPayments = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('payments')
                .select('*')
                .eq('business_id', user.business_id)
                .order('created_at', { ascending: false });

            // Apply Filters
            if (filters.startDate) query = query.gte('created_at', filters.startDate);
            if (filters.endDate) query = query.lte('created_at', filters.endDate + 'T23:59:59');
            if (filters.staff !== 'Seçilmedi') query = query.eq('staff_name', filters.staff);
            if (filters.paymentMethod !== 'Seçilmedi') query = query.eq('payment_method', filters.paymentMethod);
            if (filters.status !== 'Ödeme Durumu') query = query.eq('status', filters.status);
            // if (filters.deleted !== 'Silindi') query = query.eq('is_deleted', filters.deleted === 'Silinmiş');

            const { data, error } = await query;

            if (error) throw error;
            setPayments(data || []);

            // Calculate stats
            const totals = (data || []).reduce((acc, p) => {
                acc.total += parseFloat(p.amount);
                if (p.payment_method === 'Nakit') acc.cash += parseFloat(p.amount);
                if (p.payment_method === 'Kredi Kartı') acc.card += parseFloat(p.amount);
                return acc;
            }, { total: 0, cash: 0, card: 0 });
            setStats(totals);

        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = () => {
        fetchPayments();
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(payments.map(p => ({
            'Tarih': new Date(p.created_at).toLocaleString('tr-TR'),
            'Ödeme Yöntemi': p.payment_method,
            'Personel': p.staff_name,
            'Tutar': p.amount + ' ₺',
            'Kaynak': p.source,
            'Uniq ID': p.unique_id || '-',
            'Batch No': p.batch_no || '-',
            'Stan': p.stan || '-',
            'BKM ID': p.bkm_id || '-',
            'Banka': p.bank_name || '-',
            'Yetki Kodu': p.auth_code || '-'
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Ödemeler");
        XLSX.writeFile(workbook, "odemeler_raporu.xlsx");
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' +
            date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    };

    return (
        <div className="p-6 bg-gray-50/50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="font-bold text-gray-900 text-lg">Pano</span>
                    <span>Pano</span>
                </div>
                <button
                    onClick={exportToExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-bold hover:bg-indigo-100 transition-all"
                >
                    <Download size={18} />
                    <span>Excel'e Aktar</span>
                </button>
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Filtreler</h3>
                    <ChevronDown className="text-gray-400" size={20} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Date Filters */}
                    <div className="relative">
                        <input
                            type="date"
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Başlangıç Tarihi"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        />
                    </div>
                    <div className="relative">
                        <input
                            type="date"
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Bitiş Tarihi"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>

                    {/* Staff Filter */}
                    <select
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
                        value={filters.staff}
                        onChange={(e) => setFilters({ ...filters, staff: e.target.value })}
                    >
                        <option>Seçilmedi</option>
                        {staffList.map(s => (
                            <option key={s.id} value={`${s.first_name} ${s.last_name}`}>{s.first_name} {s.last_name}</option>
                        ))}
                    </select>

                    {/* Payment Method Filter */}
                    <select
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
                        value={filters.paymentMethod}
                        onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                    >
                        <option>Seçilmedi</option>
                        <option>Nakit</option>
                        <option>Kredi Kartı</option>
                    </select>

                    {/* Status Filter */}
                    <select
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option>Ödeme Durumu</option>
                        <option value="success">Başarılı</option>
                        <option value="failed">Hatalı</option>
                    </select>

                    {/* Deleted Filter */}
                    <select
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
                        value={filters.deleted}
                        onChange={(e) => setFilters({ ...filters, deleted: e.target.value })}
                    >
                        <option>Silindi</option>
                        <option>Silinmemiş</option>
                        <option>Silinmiş</option>
                    </select>

                    {/* All Banks Filter (Placeholder as per design) */}
                    <select className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white">
                        <option>Tüm Bankalar</option>
                    </select>

                    {/* Filter Button */}
                    <button
                        onClick={handleFilter}
                        className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-50 text-blue-500 rounded-lg font-bold hover:bg-blue-100 transition-all border border-blue-100 lg:col-start-4"
                    >
                        <Search size={18} />
                        <span>Filtrele</span>
                    </button>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-50 text-gray-600 text-[13px] font-bold">
                                <th className="py-4 px-6 border-r border-gray-50">Tarih</th>
                                <th className="py-4 px-6 border-r border-gray-50">Ödeme Yöntemi</th>
                                <th className="py-4 px-6 border-r border-gray-50">Personel</th>
                                <th className="py-4 px-6 border-r border-gray-50 text-center">Tutar</th>
                                <th className="py-4 px-6 border-r border-gray-50">Kaynak</th>
                                <th className="py-4 px-6 border-r border-gray-50">Uniq ID</th>
                                <th className="py-4 px-6 border-r border-gray-50">Batch No</th>
                                <th className="py-4 px-6 border-r border-gray-50">Stan</th>
                                <th className="py-4 px-6 border-r border-gray-50">BKM ID</th>
                                <th className="py-4 px-6 border-r border-gray-50">Banka</th>
                                <th className="py-4 px-6 font-bold">Yetki Kodu</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="11" className="py-12 text-center text-gray-400">Yükleniyor...</td>
                                </tr>
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan="11" className="py-12 text-center text-gray-400">Kayıt bulunamadı.</td>
                                </tr>
                            ) : (
                                payments.map((p) => (
                                    <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="py-4 px-6 text-[13px] border-r border-gray-50 truncate">
                                            <Link to={`/isletme/odemeler/${p.id}`} className="text-blue-500 font-medium hover:underline">
                                                {formatDate(p.created_at)}
                                            </Link>
                                        </td>
                                        <td className="py-4 px-6 text-[13px] text-gray-700 font-medium border-r border-gray-50">
                                            {p.payment_method}
                                        </td>
                                        <td className="py-4 px-6 text-[13px] text-gray-700 font-medium border-r border-gray-50">
                                            {p.staff_name}
                                        </td>
                                        <td className="py-4 px-6 text-[13px] text-gray-600 font-bold text-center border-r border-gray-50">
                                            {parseFloat(p.amount).toFixed(2).replace('.', ',')} ₺
                                        </td>
                                        <td className="py-4 px-6 text-[13px] text-gray-700 font-medium border-r border-gray-50">
                                            {p.source}
                                        </td>
                                        <td className="py-4 px-6 text-[13px] text-gray-600 border-r border-gray-50 font-medium">
                                            {p.unique_id || '-'}
                                        </td>
                                        <td className="py-4 px-6 text-[13px] text-gray-600 border-r border-gray-50 font-medium">
                                            {p.batch_no || '-'}
                                        </td>
                                        <td className="py-4 px-6 text-[13px] text-gray-600 border-r border-gray-50 font-medium">
                                            {p.stan || '-'}
                                        </td>
                                        <td className="py-4 px-6 text-[13px] text-gray-600 border-r border-gray-50 font-medium">
                                            {p.bkm_id || '-'}
                                        </td>
                                        <td className="py-4 px-6 text-[13px] text-gray-600 border-r border-gray-50 font-medium">
                                            {p.bank_name || '-'}
                                        </td>
                                        <td className="py-4 px-6 text-[13px] text-gray-600 font-medium">
                                            {p.auth_code || '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Payments;
