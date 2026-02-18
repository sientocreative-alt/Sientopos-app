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
    User as UserIcon,
    AlertCircle,
    Building2,
    Briefcase,
    Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminResellerNotifications = () => {
    const [resellers, setResellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [cityFilter, setCityFilter] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    const [notification, setNotification] = useState({
        title: '',
        message: ''
    });

    useEffect(() => {
        fetchResellers();
    }, []);

    const fetchResellers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('resellers')
                .select('id, company_name, main_contact_name, city, district, reseller_code')
                .eq('status', 'active');

            if (error) throw error;
            setResellers(data || []);
        } catch (err) {
            console.error('Error fetching resellers:', err);
            toast.error('Bayi listesi yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const filteredResellers = resellers.filter(r => {
        const matchesSearch =
            r.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.main_contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.reseller_code?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCity = !cityFilter || r.city === cityFilter;

        return matchesSearch && matchesCity;
    });

    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredResellers.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredResellers.map(r => r.id));
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (selectedIds.length === 0) return toast.error('Lütfen en az bir bayi seçin.');
        if (!notification.title || !notification.message) return toast.error('Lütfen başlık ve mesaj girin.');

        try {
            setSending(true);

            // 1. Create System Notification
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
            if (authError || !authUser) throw new Error('Oturum bulunamadı.');

            const { data: sysNotif, error: sysError } = await supabase
                .from('system_notifications')
                .insert([{
                    title: notification.title,
                    message: notification.message,
                    sender_id: authUser.id
                }])
                .select()
                .single();

            if (sysError) throw sysError;

            // 2. Map to selected reseller IDs (which are profile IDs)
            const profileNotifs = selectedIds.map(pid => ({
                profile_id: pid,
                notification_id: sysNotif.id
            }));

            const { error: profError } = await supabase
                .from('profile_notifications')
                .insert(profileNotifs);

            if (profError) throw profError;

            toast.success('Bildirim başarıyla gönderildi!');
            setNotification({ title: '', message: '' });
            setSelectedIds([]);
        } catch (err) {
            console.error('Error sending notification:', err);
            toast.error('Gönderim hatası: ' + err.message);
        } finally {
            setSending(false);
        }
    };

    const cities = [...new Set(resellers.map(r => r.city).filter(Boolean))].sort();

    return (
        <div className="max-w-6xl mx-auto space-y-6 text-left font-sans">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2 tracking-tight">
                        <Bell className="text-indigo-600" size={28} />
                        Bayilere Özel Bildirim
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium">Bayi ağınıza toplu duyurular ve özel mesajlar gönderin.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Filters & Selection */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Filter size={16} /> Filtreleme
                        </h2>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Firma, Yetkili veya Kod..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-indigo-600/5 outline-none text-xs font-bold text-gray-900 transition-all"
                            />
                        </div>

                        <select
                            value={cityFilter}
                            onChange={e => setCityFilter(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-indigo-600/5 outline-none text-xs font-bold text-gray-900 appearance-none cursor-pointer transition-all"
                        >
                            <option value="">Tüm İller</option>
                            {cities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[500px]">
                        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                {selectedIds.length} / {filteredResellers.length} Seçildi
                            </span>
                            <button
                                onClick={toggleSelectAll}
                                className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest"
                            >
                                {selectedIds.length === filteredResellers.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 custom-scrollbar">
                            {loading ? (
                                <div className="p-10 text-center">
                                    <Loader2 className="animate-spin text-indigo-600 mx-auto" size={24} />
                                </div>
                            ) : filteredResellers.length > 0 ? (
                                filteredResellers.map(r => (
                                    <button
                                        key={r.id}
                                        onClick={() => toggleSelect(r.id)}
                                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group ${selectedIds.includes(r.id) ? 'bg-indigo-50/50' : ''}`}
                                    >
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                            <span className="text-xs font-black text-gray-900 uppercase tracking-tight truncate">{r.company_name}</span>
                                            <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5 px-2 py-0.5 bg-gray-100/50 rounded-lg w-fit mt-1">
                                                <UserIcon size={10} /> {r.main_contact_name}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5 mt-1">
                                                <MapPin size={10} /> {r.city} / {r.district}
                                            </span>
                                        </div>
                                        <div>
                                            {selectedIds.includes(r.id) ? (
                                                <CheckSquare size={20} className="text-indigo-600 shadow-lg shadow-indigo-100" />
                                            ) : (
                                                <Square size={20} className="text-gray-200 group-hover:text-indigo-300 transition-colors" />
                                            )}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="p-10 text-center text-gray-300">
                                    <Briefcase className="mx-auto mb-2 opacity-10" size={40} />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Bayi bulunamadı</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Message Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSend} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 sticky top-24">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Bildirim Başlığı</label>
                            <input
                                type="text"
                                value={notification.title}
                                onChange={e => setNotification({ ...notification, title: e.target.value })}
                                placeholder="Örn: Yeni Komisyon Oranları Hakkında"
                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-600/5 outline-none text-gray-900 font-bold text-sm transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Mesaj İçeriği</label>
                            <textarea
                                value={notification.message}
                                onChange={e => setNotification({ ...notification, message: e.target.value })}
                                placeholder="Bayilerinize iletmek istediğiniz mesajı buraya yazın..."
                                rows={10}
                                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-600/5 outline-none text-gray-900 font-bold text-sm resize-none transition-all"
                                required
                            ></textarea>
                        </div>

                        {selectedIds.length > 0 && (
                            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <AlertCircle className="text-indigo-600 shrink-0 mt-0.5" size={18} />
                                <div className="text-[11px] text-indigo-900 font-bold leading-relaxed">
                                    Bu mesaj toplam <span className="text-indigo-600 font-black underline">{selectedIds.length} bayiye</span> anlık olarak iletilecektir.
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={sending || selectedIds.length === 0}
                            className="w-full bg-indigo-600 hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 active:scale-[0.98] uppercase tracking-widest text-[11px]"
                        >
                            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            {sending ? 'GÖNDERİLİYOR...' : 'BİLDİRİMİ SİMDİ GÖNDER'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminResellerNotifications;
