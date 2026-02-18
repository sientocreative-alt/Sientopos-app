import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import {
    ShieldAlert,
    Inbox,
    Search,
    Filter,
    ChevronRight,
    Clock,
    User,
    Tag,
    MessageSquare,
    AlertTriangle,
    CheckCircle2,
    CircleDashed,
    Loader2,
    Building2,
    Briefcase
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminResellerSupport = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        fetchTickets();

        // Realtime subscription
        const channel = supabase
            .channel('admin-reseller-tickets')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'support_tickets',
                filter: 'reseller_id=is.not.null'
            }, () => {
                fetchTickets();
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('support_tickets')
                .select(`
                    *,
                    resellers (company_name, reseller_code),
                    profiles (full_name)
                `)
                .not('reseller_id', 'is', null) // Filter for reseller tickets
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTickets(data || []);
        } catch (err) {
            console.error('Error fetching reseller tickets:', err);
            toast.error('Destek talepleri yüklenirken hata oluştu');
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

    const getPriorityStyle = (priority) => {
        switch (priority) {
            case 'Kritik': return 'text-red-600';
            case 'Acil': return 'text-orange-600';
            case 'Normal': return 'text-blue-600';
            default: return 'text-gray-400';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'Open': return 'Açık';
            case 'In Progress': return 'İşlemde';
            case 'Resolved': return 'Çözüldü';
            default: return status;
        }
    };

    const filteredTickets = tickets.filter(t => {
        const matchesSearch =
            t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.resellers?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                        <Briefcase className="text-indigo-600" size={28} />
                        Bayi Destek Talepleri
                    </h1>
                    <p className="text-gray-500 font-medium">Bayilerden gelen teknik ve finansal destek talepleri.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Bayi veya konu ara..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64 text-sm font-bold"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700 cursor-pointer text-sm"
                    >
                        <option value="All">Tüm Durumlar</option>
                        <option value="Open">Açık</option>
                        <option value="In Progress">İşlemde</option>
                        <option value="Resolved">Çözüldü</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-3xl p-20 text-center shadow-sm">
                    <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={40} />
                    <p className="text-gray-900 font-bold uppercase tracking-widest text-[10px] opacity-40">Talepler yükleniyor...</p>
                </div>
            ) : filteredTickets.length > 0 ? (
                <div className="grid gap-4">
                    {filteredTickets.map((ticket) => (
                        <div
                            key={ticket.id}
                            className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden"
                        >
                            <div className="flex flex-col lg:flex-row items-stretch lg:items-center">
                                {/* Ticket Info */}
                                <div className="flex-1 p-6 lg:p-8 flex gap-6 items-start">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shrink-0 ${getStatusStyle(ticket.status)} shadow-sm`}>
                                        {ticket.status === 'Open' ? <ShieldAlert size={28} /> :
                                            ticket.status === 'In Progress' ? <CircleDashed size={28} className="animate-spin" /> :
                                                <CheckCircle2 size={28} />}
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600`}>
                                                {ticket.category}
                                            </span>
                                            <span className={`text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1 ${getPriorityStyle(ticket.priority)}`}>
                                                <AlertTriangle size={10} />
                                                {ticket.priority}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                                            {ticket.title}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-gray-400">
                                            <div className="flex items-center gap-1.5 underline decoration-indigo-100 underline-offset-4 decoration-2">
                                                <Building2 size={14} className="text-indigo-400" />
                                                <span className="text-gray-900">{ticket.resellers?.company_name}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 opacity-60">
                                                <Clock size={14} />
                                                {new Date(ticket.created_at).toLocaleString('tr-TR')}
                                            </div>
                                            <div className="flex items-center gap-1.5 opacity-60">
                                                <Tag size={14} />
                                                KOD: {ticket.resellers?.reseller_code}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="p-6 lg:p-8 bg-gray-50 border-t lg:border-t-0 lg:border-l border-gray-100 flex items-center justify-between lg:justify-end gap-12">
                                    <div className="text-right">
                                        <div className="text-[10px] text-gray-400 font-extrabold uppercase mb-1 tracking-widest">Durum</div>
                                        <div className={`text-xs font-extrabold px-4 py-1.5 rounded-full border shadow-sm ${getStatusStyle(ticket.status)}`}>
                                            {getStatusText(ticket.status)}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => navigate(`/destek/talepler/${ticket.id}`)}
                                        className="w-12 h-12 bg-white text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-95 hover:shadow-indigo-100"
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-3xl p-20 text-center shadow-sm border-2 border-dashed border-gray-100">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Inbox className="text-gray-200" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 tracking-tight">Bekleyen Bayi Talebi Yok</h2>
                    <p className="text-gray-500 mt-2 font-medium">Bayi ağınızda her şey yolunda görünüyor.</p>
                </div>
            )}
        </div>
    );
};

export default AdminResellerSupport;
