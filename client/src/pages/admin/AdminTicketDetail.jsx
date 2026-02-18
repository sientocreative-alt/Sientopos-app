import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
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
    Lock
} from 'lucide-react';

const AdminTicketDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchTicketDetail();
        const subscribe = subscribeToMessages();
        return () => supabase.removeChannel(subscribe);
    }, [id]);

    const fetchTicketDetail = async () => {
        try {
            const { data: ticketData, error: ticketError } = await supabase
                .from('support_tickets')
                .select(`
                    *,
                    businesses (*),
                    resellers (*),
                    profiles (*)
                `)
                .eq('id', id)
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
                setMessages(prev => [...prev, payload.new]);
            })
            .subscribe();
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
                    is_internal: isInternal,
                    sender_id: (await supabase.auth.getUser()).data.user?.id
                }]);

            if (error) throw error;

            // Update ticket updated_at
            await supabase.from('support_tickets').update({ updated_at: new Date() }).eq('id', id);

            setNewMessage('');
        } catch (err) {
            alert('Mesaj gönderilemedi: ' + err.message);
        } finally {
            setSending(false);
        }
    };

    const updateStatus = async (status) => {
        try {
            const { error } = await supabase
                .from('support_tickets')
                .update({ status, updated_at: new Date() })
                .eq('id', id);
            if (error) throw error;
            setTicket({ ...ticket, status });
        } catch (err) {
            alert('Durum güncellenemedi');
        }
    };

    if (loading) return <div className="p-20 text-center text-gray-900 font-bold"><Loader2 className="animate-spin inline-block mr-2 text-blue-600" /> Talepler yükleniyor...</div>;
    if (!ticket) return <div>Talep bulunamadı.</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-140px)]">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 rounded-t-3xl">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-extrabold uppercase bg-gray-100 text-gray-500 px-2 py-1 rounded">#{ticket.id.substring(0, 8)}</span>
                            <span className="text-[10px] font-extrabold uppercase bg-orange-100 text-orange-600 px-2 py-1 rounded">{ticket.category}</span>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {['Open', 'In Progress', 'Resolved'].map((s) => (
                        <button
                            key={s}
                            onClick={() => updateStatus(s)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${ticket.status === s ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                        >
                            {s === 'Open' ? 'Açık' : s === 'In Progress' ? 'İşlemde' : 'Çözüldü'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-gray-50 p-6 overflow-y-auto space-y-4">
                    {/* User's Original Issue */}
                    <div className="bg-blue-600 text-white p-6 rounded-3xl rounded-tl-none max-w-2xl shadow-lg self-start break-all">
                        <div className="text-[10px] font-bold uppercase opacity-80 mb-2">TALEP AÇIKLAMASI</div>
                        <p className="font-medium">{ticket.description}</p>
                    </div>

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex flex-col ${msg.is_internal ? 'bg-amber-50 border border-amber-200' : 'bg-white'} p-4 rounded-2xl shadow-sm max-w-2xl break-all ${msg.sender_id === ticket.profiles?.id ? 'self-start' : 'self-end'
                                }`}
                        >
                            {msg.is_internal && (
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 uppercase mb-2">
                                    <Lock size={12} /> DAHİLİ NOT
                                </div>
                            )}
                            <p className="text-sm font-medium text-gray-800">{msg.message}</p>
                            <span className="text-[10px] text-gray-400 mt-2 font-bold">{new Date(msg.created_at).toLocaleTimeString()}</span>
                        </div>
                    ))}
                </div>

                {/* Sidebar - Metadata */}
                <div className="w-80 bg-white border-l border-gray-100 p-6 overflow-y-auto hidden xl:block space-y-8">
                    <section>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">MÜŞTERİ BİLGİSİ</h4>
                        <div className="bg-gray-50 p-4 rounded-2xl space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                    <User size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{ticket.profiles?.full_name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {ticket.resellers ? (
                                    <>
                                        <div className="w-4 h-4 rounded bg-indigo-100 flex items-center justify-center text-indigo-600">
                                            <ShieldCheck size={10} />
                                        </div>
                                        <p className="text-xs font-bold text-indigo-700">BAYİ: {ticket.resellers.company_name}</p>
                                    </>
                                ) : (
                                    <>
                                        <Building2 size={16} className="text-gray-400" />
                                        <p className="text-xs font-bold text-gray-700">{ticket.businesses?.name}</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </section>

                    <section>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">SİSTEM BİLGİSİ</h4>
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                            <div className="bg-gray-50 p-2 rounded-lg">
                                <p className="text-gray-400">PLAN</p>
                                <p className="text-gray-900 uppercase font-black">{ticket.system_info?.plan}</p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-lg">
                                <p className="text-gray-400">VERSİYON</p>
                                <p className="text-gray-900">{ticket.system_info?.version}</p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-lg col-span-2">
                                <p className="text-gray-400">TARAYICI BİLGİSİ</p>
                                <p className="text-gray-900 truncate">{ticket.system_info?.userAgent}</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">SLA DURUMU</h4>
                        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl flex items-center gap-3 border border-emerald-100">
                            <ShieldCheck size={20} />
                            <div>
                                <p className="text-[10px] font-black uppercase">SLA OK</p>
                                <p className="text-xs font-bold">İlk yanıt süresi içerisinde</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-white p-6 border-t border-gray-100 rounded-b-3xl">
                <form onSubmit={handleSendMessage} className="relative">
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={isInternal ? "Ekip içi not ekle..." : "Cevabınızı buraya yazın..."}
                        className={`w-full px-6 py-4 pr-32 rounded-2xl border-2 transition-all outline-none font-medium min-h-[100px] resize-none ${isInternal ? 'bg-amber-50 border-amber-200 focus:border-amber-400 text-amber-900' : 'bg-gray-50 border-transparent focus:border-blue-500 text-gray-900'
                            }`}
                    />
                    <div className="absolute right-4 bottom-4 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsInternal(!isInternal)}
                            className={`p-2 rounded-lg transition-colors ${isInternal ? 'bg-amber-100 text-amber-600' : 'text-gray-400 hover:bg-gray-100'}`}
                            title="Ekip içi not"
                        >
                            <Lock size={20} />
                        </button>
                        <button
                            type="submit"
                            disabled={sending}
                            className={`p-3 rounded-xl transition-all shadow-lg active:scale-95 ${isInternal ? 'bg-amber-600 text-white shadow-amber-600/20 hover:bg-amber-700' : 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700'
                                }`}
                        >
                            {sending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminTicketDetail;
