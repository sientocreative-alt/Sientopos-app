import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Mail, Phone, MapPin, Building2, User, Hash, Globe, Calendar, ExternalLink, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { toast } from 'react-hot-toast';

const AdminResellers = () => {
    const [stats, setStats] = useState({
        resellerCount: 0,
        activeResellers: 0,
        pendingRequests: 0,
        totalTurnover: 0
    });
    const [resellers, setResellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchResellers();
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // 1. Pending Payout Requests
            const { count: pendingCount } = await supabase
                .from('reseller_payout_requests')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            // 2. Total Turnover (Sum of base_amount in commissions)
            const { data: commissions } = await supabase
                .from('reseller_commissions')
                .select('base_amount');

            const turnover = commissions?.reduce((sum, item) => sum + (parseFloat(item.base_amount) || 0), 0) || 0;

            setStats(prev => ({
                ...prev,
                pendingRequests: pendingCount || 0,
                totalTurnover: turnover
            }));

        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchResellers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('resellers')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setResellers(data || []);

            // Update reseller counts from fetched data
            setStats(prev => ({
                ...prev,
                resellerCount: data.length,
                activeResellers: data.filter(r => r.status === 'active').length
            }));

        } catch (error) {
            console.error('Error fetching resellers:', error);
            toast.error('Bayiler yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu bayiyi silmek istediğinize emin misiniz?')) return;

        try {
            const { error } = await supabase
                .from('resellers')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Supabase Delete Error:', error);
                throw new Error(error.message || 'Veritabanı silme izni reddedildi (RLS).');
            }

            toast.success('Bayi başarıyla silindi');
            fetchResellers();
            fetchStats(); // Refresh stats after deletion
        } catch (error) {
            console.error('Error deleting reseller:', error);
            toast.error(`Bayi silinirken hata oluştu: ${error.message}`);
        }
    };

    const filteredResellers = resellers.filter(reseller =>
        reseller.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reseller.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reseller.reseller_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reseller.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reseller.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 pb-12">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Bayi Yönetimi</h1>
                    <p className="text-gray-500 mt-1 font-medium">Sistemdeki tüm çözüm ortaklarını ve performanslarını takip edin.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { fetchResellers(); fetchStats(); }}
                        className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-gray-100 bg-white"
                        title="Yenile"
                    >
                        <Calendar size={20} />
                    </button>
                    <Link
                        to="/resellers/new"
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 font-bold active:scale-95"
                    >
                        <Plus size={20} />
                        Yeni Bayi Ekle
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'TOPLAM BAYİ', value: stats.resellerCount, icon: Users, color: 'blue' },
                    { label: 'AKTİF BAYİLER', value: stats.activeResellers, icon: CheckCircle2, color: 'green' }, // Changed icon to CheckCircle2
                    { label: 'BEKLEYEN TALEPLER', value: stats.pendingRequests, icon: Mail, color: 'amber' },
                    {
                        label: 'TOPLAM CİRO',
                        value: new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.totalTurnover),
                        icon: Building2,
                        color: 'indigo'
                    },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 text-left hover:shadow-md transition-all">
                        <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600`}>
                            <stat.icon size={28} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 opacity-70">{stat.label}</div>
                            <div className="text-2xl font-black text-gray-900 tracking-tight">{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Bayi adı, kodu, kullanıcı adı veya şehir..."
                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-gray-700 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Bayi & Kod</th>
                                <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Giriş Bilgileri</th>
                                <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Konum & Ülke</th>
                                <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">İletişim</th>
                                <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Durum</th>
                                <th className="px-8 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-8 py-4"><div className="h-12 bg-gray-100 rounded-xl"></div></td>
                                    </tr>
                                ))
                            ) : filteredResellers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-8 py-12 text-center text-gray-400 font-medium">Arama kriterlerine uygun bayi bulunamadı.</td>
                                </tr>
                            ) : (
                                filteredResellers.map((reseller) => (
                                    <tr key={reseller.id} className="group hover:bg-blue-50/30 transition-all duration-300">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4 text-left">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                                    {reseller.company_name?.[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors">{reseller.company_name}</div>
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 mt-0.5">
                                                        <Hash size={12} />
                                                        {reseller.reseller_code || 'KODSUZ'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-left space-y-1">
                                                <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                                    <User size={14} className="text-blue-500" />
                                                    {reseller.username || 'Tanımsız'}
                                                </div>
                                                <div className="text-[10px] font-black text-gray-300 uppercase letter tracking-tighter">Sistem Giriş Kimliği</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-left space-y-1">
                                                <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                                    <MapPin size={14} className="text-red-500" />
                                                    {reseller.city || 'Belirtilmedi'}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                                                    <Globe size={12} />
                                                    {reseller.country}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-left space-y-1">
                                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                                                    <Mail size={14} className="text-gray-400" />
                                                    {reseller.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                                                    <Phone size={14} className="text-gray-400" />
                                                    {reseller.phone || 'Telefon Yok'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest ${reseller.status === 'active'
                                                ? 'bg-green-50 text-green-600'
                                                : 'bg-red-50 text-red-600'
                                                }`}>
                                                <span className={`w-2 h-2 rounded-full mr-2 ${reseller.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                {reseller.status === 'active' ? 'Aktif' : 'Pasif'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-3 transition-opacity">
                                                <Link
                                                    to={`/resellers/edit/${reseller.id}`}
                                                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"
                                                >
                                                    <Edit2 size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(reseller.id)}
                                                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                <button className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100">
                                                    <ExternalLink size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )
                            }
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination Mock */}
                <div className="px-8 py-5 bg-gray-50/50 flex items-center justify-between border-t border-gray-100">
                    <div className="text-sm font-bold text-gray-400">
                        Toplam <span className="text-gray-900">{filteredResellers.length}</span> kayıt gösteriliyor
                    </div>
                </div>
            </div>
        </div>
    );
};

// Mock Icon component if using directly or import from lucide-react
const Users = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

export default AdminResellers;
