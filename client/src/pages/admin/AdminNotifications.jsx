import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import {
    Search,
    Bell,
    Send,
    Filter,
    CheckSquare,
    Square,
    MapPin,
    Building,
    User as UserIcon,
    AlertCircle
} from 'lucide-react';

const AdminNotifications = () => {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [cityFilter, setCityFilter] = useState('');
    const [districtFilter, setDistrictFilter] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    const [notification, setNotification] = useState({
        title: '',
        message: ''
    });

    useEffect(() => {
        fetchBusinesses();
    }, []);

    const fetchBusinesses = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('businesses')
                .select(`
                    id, 
                    name, 
                    pos_settings (
                        full_name,
                        city,
                        district
                    ),
                    profiles (
                        id
                    )
                `);

            if (error) throw error;
            setBusinesses(data || []);
        } catch (err) {
            console.error('Error fetching businesses:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredBusinesses = businesses.filter(b => {
        const settings = Array.isArray(b.pos_settings) ? b.pos_settings[0] : b.pos_settings;
        const s = settings || {};
        const matchesSearch = b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCity = !cityFilter || s.city === cityFilter;
        const matchesDistrict = !districtFilter || s.district?.toLowerCase().includes(districtFilter.toLowerCase());

        return matchesSearch && matchesCity && matchesDistrict;
    });

    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredBusinesses.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredBusinesses.map(b => b.id));
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (selectedIds.length === 0) return alert('Lütfen en az bir işletme seçin.');
        if (!notification.title || !notification.message) return alert('Lütfen başlık ve mesaj girin.');

        try {
            setSending(true);

            // 1. Create System Notification
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
            if (authError || !authUser) throw new Error('Oturum bulunamadı, lütfen tekrar giriş yapın.');

            const { data: sysNotif, error: sysError } = await supabase
                .from('system_notifications')
                .insert([{
                    title: notification.title,
                    message: notification.message,
                    sender_id: authUser.id
                }])
                .select()
                .maybeSingle();

            if (sysError || !sysNotif) throw sysError || new Error('Bildirim oluşturulamadı.');

            // 2. Map to selected business profiles
            const profileIds = businesses
                .filter(b => selectedIds.includes(b.id))
                .flatMap(b => {
                    const profs = Array.isArray(b.profiles) ? b.profiles : (b.profiles ? [b.profiles] : []);
                    return profs.filter(p => p && p.id).map(p => p.id);
                });

            if (profileIds.length === 0) throw new Error('Seçilen işletmelerde profil bulunamadı.');

            const profileNotifs = profileIds.map(pid => ({
                profile_id: pid,
                notification_id: sysNotif.id
            }));

            const { error: profError } = await supabase
                .from('profile_notifications')
                .insert(profileNotifs);

            if (profError) throw profError;

            alert('Bildirim başarıyla gönderildi!');
            setNotification({ title: '', message: '' });
            setSelectedIds([]);
        } catch (err) {
            console.error('Error sending notification:', err);
            alert('Gönderim hatası: ' + err.message);
        } finally {
            setSending(false);
        }
    };

    // Get unique cities for filter dropdown
    const cities = [...new Set(businesses.map(b => {
        const s = Array.isArray(b.pos_settings) ? b.pos_settings[0] : b.pos_settings;
        return s?.city;
    }).filter(Boolean))].sort();

    return (
        <div className="max-w-6xl mx-auto space-y-6 text-left">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Bell className="text-blue-600" size={28} />
                        Sistem Bildirimi Gönder
                    </h1>
                    <p className="text-gray-500 mt-1">İşletmelere toplu veya özel mesaj yollayın.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Filters & Selection */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <Filter size={16} /> Filtrele
                        </h2>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="İşletme veya Sahip Adı..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-900"
                            />
                        </div>

                        <select
                            value={cityFilter}
                            onChange={e => setCityFilter(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-900"
                        >
                            <option value="">Tüm İller</option>
                            {cities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>

                        <input
                            type="text"
                            placeholder="İlçe..."
                            value={districtFilter}
                            onChange={e => setDistrictFilter(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-900"
                        />
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[500px]">
                        <div className="p-4 border-b border-gray-50 bg-gray-50 flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-500">
                                {selectedIds.length} / {filteredBusinesses.length} Seçildi
                            </span>
                            <button
                                onClick={toggleSelectAll}
                                className="text-xs font-bold text-blue-600 hover:underline"
                            >
                                {selectedIds.length === filteredBusinesses.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                            {loading ? (
                                <div className="p-4 text-center text-gray-400 text-sm">Yükleniyor...</div>
                            ) : filteredBusinesses.length > 0 ? (
                                filteredBusinesses.map(b => (
                                    <button
                                        key={b.id}
                                        onClick={() => toggleSelect(b.id)}
                                        className={`w-full text-left p-4 hover:bg-blue-50 transition-colors flex items-center justify-between group ${selectedIds.includes(b.id) ? 'bg-blue-50/50' : ''}`}
                                    >
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                            <span className="text-sm font-bold text-gray-800 truncate">{b.name}</span>
                                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                <UserIcon size={10} /> {(() => {
                                                    const s = Array.isArray(b.pos_settings) ? b.pos_settings[0] : b.pos_settings;
                                                    return s?.full_name || 'İsimsiz';
                                                })()}
                                            </span>
                                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                <MapPin size={10} /> {(() => {
                                                    const s = Array.isArray(b.pos_settings) ? b.pos_settings[0] : b.pos_settings;
                                                    return `${s?.city || '-'} / ${s?.district || '-'}`;
                                                })()}
                                            </span>
                                        </div>
                                        <div>
                                            {selectedIds.includes(b.id) ? (
                                                <CheckSquare size={20} className="text-blue-600" />
                                            ) : (
                                                <Square size={20} className="text-gray-200 group-hover:text-blue-300" />
                                            )}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="p-10 text-center text-gray-300">
                                    <Building className="mx-auto mb-2 opacity-20" size={40} />
                                    <p className="text-xs font-medium">İşletme bulunamadı</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Message Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSend} className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm space-y-6 sticky top-24">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Bildirim Başlığı</label>
                            <input
                                type="text"
                                value={notification.title}
                                onChange={e => setNotification({ ...notification, title: e.target.value })}
                                placeholder="Örn: Güncelleme Hakkında"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Mesaj İçeriği</label>
                            <textarea
                                value={notification.message}
                                onChange={e => setNotification({ ...notification, message: e.target.value })}
                                placeholder="Mesajınızı buraya yazınız..."
                                rows={8}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 resize-none font-medium"
                                required
                            ></textarea>
                        </div>

                        {selectedIds.length > 0 && (
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-3">
                                <AlertCircle className="text-blue-500 shrink-0" size={20} />
                                <div className="text-xs text-blue-700 font-medium">
                                    Bu mesaj toplam <span className="font-bold underline">{selectedIds.length} işletmeye</span> bağlı tüm kullanıcılara gönderilecektir.
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={sending || selectedIds.length === 0}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 group"
                        >
                            <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            {sending ? 'Gönderiliyor...' : 'Bildirimi Şimdi Gönder'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminNotifications;
