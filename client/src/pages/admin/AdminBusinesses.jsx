import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import {
    Search,
    MoreVertical,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Trash2,
    Calendar,
    RefreshCw,
    Edit
} from 'lucide-react';

const AdminBusinesses = () => {
    const navigate = useNavigate();
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('active'); // all, active, trial, suspended

    useEffect(() => {
        fetchBusinesses();
    }, []);

    const fetchBusinesses = async () => {
        try {
            setLoading(true);
            console.log('Fetching businesses...');
            const { data, error } = await supabase
                .from('businesses')
                .select(`
                    *,
                    pos_settings (
                        full_name,
                        contact_email
                    ),
                    profiles (
                        full_name,
                        role
                    ),
                    resellers (
                        company_name,
                        reseller_code
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            console.log('Businesses fetched:', data);
            if (data && data.length > 0) {
                console.log('First business pos_settings:', data[0].pos_settings);
            }
            setBusinesses(data || []);
        } catch (err) {
            console.error('Error fetching businesses:', err);
            alert('Veri çekilirken hata oluştu: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        if (!confirm('Durumu değiştirmek istediğinize emin misiniz?')) return;

        try {
            const { error } = await supabase
                .from('businesses')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            fetchBusinesses();
        } catch (err) {
            alert('Hata: ' + err.message);
        }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`⚠ DİKKAT: "${name}" işletmesi ve TÜM VERİLERİ (ürünler, raporlar, personeller vb.) kalıcı olarak silinecek!\n\nBu işlem geri alınamaz. Onaylıyor musunuz?`)) return;

        try {
            const { data, error } = await supabase.rpc('delete_business_complete', {
                p_business_id: id
            });

            if (error) throw error;
            if (data && data.success === false) throw new Error(data.error);

            alert('İşletme başarıyla silindi.');
            fetchBusinesses();
        } catch (err) {
            alert('Silme Hatası: ' + err.message);
        }
    };

    const filteredBusinesses = businesses.filter(b => {
        const settings = b.pos_settings?.[0] || {};
        const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            settings.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            settings.contact_email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || b.status === filter;
        return matchesSearch && matchesFilter;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active': return <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">Aktif</span>;
            case 'trial': return <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">Deneme</span>;
            case 'suspended': return <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">Askıda</span>;
            default: return <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">{status}</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">İşletmeler</h1>
                <button
                    onClick={() => navigate('/new-business')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                    + Yeni İşletme
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="İşletme adı, yetkili veya email ara..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">Tüm Durumlar</option>
                        <option value="active">Aktif</option>
                        <option value="trial">Deneme</option>
                        <option value="suspended">Askıda</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-sm font-medium">
                            <tr>
                                <th className="px-6 py-4">İşletme Adı</th>
                                <th className="px-6 py-4">Bayi</th>
                                <th className="px-6 py-4">Yetkili</th>
                                <th className="px-6 py-4">Plan</th>
                                <th className="px-6 py-4">Bitiş Tarihi</th>
                                <th className="px-6 py-4">Durum</th>
                                <th className="px-6 py-4 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredBusinesses.map((business) => (
                                <tr key={business.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-800">{business.name}</div>
                                        <div className="text-xs text-gray-400">ID: {business.id.substring(0, 8)}...</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {business.resellers ? (
                                            <>
                                                <div className="text-sm font-bold text-blue-600">{business.resellers.company_name}</div>
                                                <div className="text-[10px] text-gray-400">Kod: {business.resellers.reseller_code}</div>
                                            </>
                                        ) : (
                                            <div className="text-xs text-gray-400 italic">Merkez (Admin)</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-semibold text-gray-700">
                                            {(() => {
                                                const settings = Array.isArray(business.pos_settings) ? business.pos_settings[0] : business.pos_settings;
                                                return settings?.full_name || '-';
                                            })()}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {(() => {
                                                const settings = Array.isArray(business.pos_settings) ? business.pos_settings[0] : business.pos_settings;
                                                return settings?.contact_email || '-';
                                            })()}
                                        </div>
                                    </td>
                                    <td className={`px-6 py-4 text-sm ${business.subscription_plan === 'trial' ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                                        {
                                            {
                                                'monthly': 'Aylık',
                                                'yearly': 'Yıllık',
                                                'trial': 'Deneme',
                                                'lifetime': 'Ömür Boyu'
                                            }[business.subscription_plan] || business.subscription_plan
                                        }
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {business.subscription_plan === 'trial'
                                            ? new Date(business.trial_end_date).toLocaleDateString()
                                            : new Date(business.subscription_end_date).toLocaleDateString()
                                        }
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(business.status)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {business.status !== 'active' && (
                                                <button
                                                    onClick={() => handleStatusChange(business.id, 'active')}
                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                                                    title="Aktif Et"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                            {business.status !== 'suspended' && (
                                                <button
                                                    onClick={() => handleStatusChange(business.id, 'suspended')}
                                                    className="p-1.5 text-orange-600 hover:bg-orange-50 rounded"
                                                    title="Askıya Al"
                                                >
                                                    <AlertTriangle size={18} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => navigate(`/businesses/edit/${business.id}`)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                title="Düzenle"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(business.id, business.name)}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                                title="Sil"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminBusinesses;
