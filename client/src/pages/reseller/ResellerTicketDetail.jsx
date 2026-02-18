import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import {
    ChevronLeft,
    Send,
    User,
    Building2,
    Clock,
    Tag,
    AlertTriangle,
    CheckCircle2,
    MessageSquare,
    Loader2,
    ShieldCheck,
    Lock,
    LifeBuoy
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

const ResellerTicketDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [ticket, setTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (id && user) {
            fetchTicketDetail();
            const subscribe = subscribeToMessages();
            return () => supabase.removeChannel(subscribe);
        }
    }, [id, user]);

    const fetchTicketDetail = async () => {
        try {
            setLoading(true);
            const { data: ticketData, error: ticketError } = await supabase
                .from('support_tickets')
                .select('*')
                .eq('id', id)
                .eq('reseller_id', user.id) // Security check
                .single();

            if (ticketError) throw ticketError;
            setTicket(ticketData);

            const { data: messageData, error: msgError } = await supabase
                .from('support_messages')
                .select(`
                    *,
                    profiles (full_name)
                `)
                .eq('ticket_id', id)
                .order('created_at', { ascending: true });

            if (msgError) throw msgError;
            setMessages(messageData || []);
        } catch (err) {
            console.error('Error fetching detail:', err);
            toast.error('Talep detayları yüklenemedi');
            navigate('/destek/taleplerim');
        } finally {
            setLoading(false);
        }
    };

    const subscribeToMessages = () => {
        return supabase
            .channel(`ticket-${id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'support_messages',
                filter: `ticket_id=eq.${id}`
            }, (payload) => {
                // Fetch full message with profile info
                fetchNewMessage(payload.new.id);
            })
            .subscribe();
    };

    const fetchNewMessage = async (msgId) => {
        const { data } = await supabase
            .from('support_messages')
            .select('*, profiles(full_name)')
            .eq('id', msgId)
            .single();
        if (data) setMessages(prev => [...prev, data]);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        try {
            setSending(true);
            const { error } = await supabase
                .from('support_messages')
                .insert([{
                    ticket_id: id,
                    message: newMessage,
                    sender_id: user.id
                }]);

            if (error) throw error;

            // Update ticket updated_at
            await supabase.from('support_tickets').update({ updated_at: new Date() }).eq('id', id);

            setNewMessage('');
        } catch (err) {
            toast.error('Mesaj gönderilemedi: ' + err.message);
        } finally {
            setSending(false);
        }
    };

    if (loading) return (
        <div className="flex h-[400px] items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
    );

    if (!ticket) return (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 uppercase font-black text-[10px] tracking-widest text-slate-400">
            Talep bulunamadı
        </div>
    );

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Open': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
            case 'In Progress': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'Resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Closed': return 'bg-slate-50 text-slate-700 border-slate-100';
            default: return 'bg-indigo-50 text-indigo-700 border-indigo-100';
        }
    };

    return (
        <div className="space-y-6 flex flex-col h-[calc(100vh-140px)]">
            {/* Header */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/destek/taleplerim')} className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-xl text-slate-400 transition-all active:scale-95 shadow-sm">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[8px] font-black uppercase bg-slate-100 text-slate-400 px-2 py-0.5 rounded-lg border border-slate-200">#{ticket.id.substring(0, 8)}</span>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border ${getStatusStyle(ticket.status)}`}>
                                {ticket.status === 'Open' ? 'Açık' : ticket.status === 'In Progress' ? 'İşlemde' : ticket.status === 'Resolved' ? 'Çözüldü' : 'Kapalı'}
                            </span>
                        </div>
                        <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">{ticket.title}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Öncelik</p>
                        <p className={`text-[10px] font-black mt-1 ${ticket.priority === 'Kritik' ? 'text-rose-500' : ticket.priority === 'Acil' ? 'text-amber-500' : 'text-indigo-500'} uppercase tracking-tighter italic`}>
                            {ticket.priority}
                        </p>
                    </div>
                    <div className="h-8 w-px bg-slate-100 hidden md:block"></div>
                    <div className="text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Kategori</p>
                        <p className="text-[10px] font-black text-slate-900 mt-1 uppercase tracking-tighter italic">{ticket.category}</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-3xl shadow-md overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/30">
                        {/* Initial Description */}
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-[1.2rem] bg-indigo-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-lg shadow-indigo-200 uppercase">
                                {ticket.title.charAt(0)}
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-slate-900 uppercase">SİZ</span>
                                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{format(new Date(ticket.created_at), 'd MMM yyyy, HH:mm', { locale: tr })}</span>
                                </div>
                                <div className="bg-indigo-600 text-white p-6 rounded-3xl rounded-tl-none shadow-xl shadow-indigo-900/10 text-xs font-medium leading-relaxed italic border border-white/10 break-all">
                                    {ticket.description}
                                </div>
                            </div>
                        </div>

                        {messages.map((msg, idx) => {
                            const isMe = msg.sender_id === user.id;
                            const isPublic = !msg.is_internal;

                            if (!isPublic) return null; // Internal notes are for admins only

                            return (
                                <div key={msg.id} className={`flex gap-4 ${isMe ? '' : 'flex-row-reverse'}`}>
                                    <div className={`w-10 h-10 rounded-[1.2rem] flex items-center justify-center font-black text-xs shrink-0 shadow-lg shadow-indigo-200 uppercase border ${isMe ? 'bg-indigo-600 text-white border-white/20' : 'bg-slate-900 text-white border-indigo-500/20'}`}>
                                        {isMe ? 'S' : 'A'}
                                    </div>
                                    <div className={`flex-1 space-y-2 ${isMe ? '' : 'text-right'}`}>
                                        <div className={`flex items-center gap-3 ${isMe ? '' : 'flex-row-reverse'}`}>
                                            <span className="text-[10px] font-black text-slate-900 uppercase">{isMe ? 'SİZ' : 'DESTEK EKİBİ'}</span>
                                            <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{format(new Date(msg.created_at), 'HH:mm', { locale: tr })}</span>
                                        </div>
                                        <div className={`p-6 rounded-3xl shadow-xl text-xs font-medium leading-relaxed italic border break-all ${isMe
                                            ? 'bg-indigo-600 text-white rounded-tl-none shadow-indigo-900/10 border-white/10'
                                            : 'bg-white text-slate-700 rounded-tr-none shadow-slate-200 border-slate-100'
                                            }`}>
                                            {msg.message}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Input Area */}
                    <div className="p-6 bg-white border-t border-slate-100">
                        {ticket.status === 'Closed' || ticket.status === 'Resolved' ? (
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-center gap-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                <Lock size={14} />
                                Bu talep sonuçlandırılmıştır
                            </div>
                        ) : (
                            <form onSubmit={handleSendMessage} className="relative">
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Cevabınızı buraya yazın..."
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-6 pr-20 py-4 text-xs font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all min-h-[100px] resize-none placeholder:opacity-30"
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !newMessage.trim()}
                                    className="absolute right-3 bottom-3 w-12 h-12 bg-indigo-600 hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-2xl flex items-center justify-center transition-all shadow-xl shadow-indigo-900/20 active:scale-95"
                                >
                                    {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Sidebar Info - Compact */}
                <div className="w-80 space-y-4 hidden xl:block">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Talep Bilgisi</h4>
                        <div className="space-y-4">
                            <div>
                                <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1.5 leading-none">Kategori</div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 font-black text-[10px] text-slate-700 uppercase tracking-tighter italic">{ticket.category}</div>
                            </div>
                            <div>
                                <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1.5 leading-none">Son Güncelleme</div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 font-black text-[10px] text-slate-700 uppercase tracking-tighter italic">
                                    {format(new Date(ticket.updated_at || ticket.created_at), 'd MMM yyyy, HH:mm', { locale: tr })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-600/20 blur-3xl rounded-full transition-all group-hover:scale-150"></div>
                        <div className="relative z-10">
                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Destek Durumu</h4>
                            <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${ticket.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20'}`}>
                                    {ticket.status === 'Resolved' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-tighter">
                                        {ticket.status === 'Open' ? 'Bekliyor' : ticket.status === 'In Progress' ? 'İnceleniyor' : 'Çözümlendi'}
                                    </p>
                                    <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Hizmet Seviyesi: Standart</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResellerTicketDetail;
