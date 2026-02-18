import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import {
    MessageSquare,
    Clock,
    ChevronRight,
    Search,
    Inbox,
    AlertCircle,
    CheckCircle2,
    CircleDashed,
    Loader2
} from 'lucide-react';

const MyTickets = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user) {
            fetchMyTickets();

            const channel = supabase
                .channel('my-tickets')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'support_tickets',
                    filter: `business_id=eq.${user.business_id}`
                }, () => {
                    fetchMyTickets();
                })
                .subscribe();

            return () => supabase.removeChannel(channel);
        }
    }, [user]);

    const fetchMyTickets = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('support_tickets')
                .select('*')
                .eq('business_id', user.business_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTickets(data || []);
        } catch (err) {
            console.error('Error fetching tickets:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Open': return 'bg-red-50 text-red-600 border-red-100';
            case 'In Progress': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'Resolved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    const filteredTickets = tickets.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Destek Taleplerim</h1>
                    <p className="text-gray-500 font-medium text-sm">Açtığınız tüm destek taleplerini buradan takip edebilirsiniz.</p>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Talep veya kategori ara..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium text-gray-900 placeholder:text-gray-300"
                    />
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-3xl p-20 text-center shadow-sm">
                    <Loader2 className="animate-spin text-orange-500 mx-auto mb-4" size={40} />
                    <p className="text-gray-900 font-bold">Talepleriniz yükleniyor...</p>
                </div>
            ) : filteredTickets.length > 0 ? (
                <div className="grid gap-4">
                    {filteredTickets.map((ticket) => (
                        <div
                            key={ticket.id}
                            onClick={() => navigate(`/isletme/destek/taleplerim/${ticket.id}`)}
                            className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden"
                        >
                            <div className="p-6 flex items-center gap-6">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${getStatusStyle(ticket.status)}`}>
                                    {ticket.status === 'Open' ? <AlertCircle size={24} /> :
                                        ticket.status === 'In Progress' ? <CircleDashed size={24} className="animate-spin" /> :
                                            <CheckCircle2 size={24} />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-extrabold uppercase bg-gray-100 text-gray-500 px-2 py-1 rounded">#{ticket.id.substring(0, 8)}</span>
                                        <span className="text-[10px] font-extrabold uppercase bg-orange-100 text-orange-600 px-2 py-1 rounded">{ticket.category}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors truncate">
                                        {ticket.title}
                                    </h3>
                                    <div className="flex items-center gap-4 mt-2 text-xs font-bold text-gray-400">
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={14} />
                                            {new Date(ticket.created_at).toLocaleString('tr-TR')}
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${getStatusStyle(ticket.status)}`}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                            {ticket.status === 'Open' ? 'Açık' : ticket.status === 'In Progress' ? 'İşlemde' : 'Çözüldü'}
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden sm:flex w-10 h-10 bg-gray-50 rounded-xl items-center justify-center text-gray-300 group-hover:bg-orange-50 group-hover:text-orange-500 transition-all">
                                    <ChevronRight size={24} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-3xl p-20 text-center shadow-sm border-2 border-dashed border-gray-100">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Inbox className="text-gray-300" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Henüz Bir Talebiniz Yok</h2>
                    <p className="text-gray-500 mt-2 font-medium">Herhangi bir sorunuz olduğunda yeni bir talep oluşturabilirsiniz.</p>
                </div>
            )}
        </div>
    );
};

export default MyTickets;
