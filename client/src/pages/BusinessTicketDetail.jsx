import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import {
    ChevronLeft,
    Send,
    User,
    Clock,
    Tag,
    AlertCircle,
    CheckCircle2,
    CircleDashed,
    Loader2
} from 'lucide-react';

const BusinessTicketDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (user) {
            fetchTicketDetail();
            const subscribe = subscribeToMessages();
            return () => supabase.removeChannel(subscribe);
        }
    }, [id, user]);

    const fetchTicketDetail = async () => {
        try {
            const { data: ticketData, error: ticketError } = await supabase
                .from('support_tickets')
                .select('*')
                .eq('id', id)
                .eq('business_id', user.business_id) // Security check
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
                .eq('is_internal', false) // Never show internal messages to business
                .order('created_at', { ascending: true });

            if (msgError) throw msgError;
            setMessages(messageData || []);
        } catch (err) {
            console.error('Error fetching detail:', err);
            navigate('/isletme/destek/taleplerim');
        } finally {
            setLoading(false);
        }
    };

    const subscribeToMessages = () => {
        return supabase
            .channel(`ticket-business-${id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'support_messages',
                filter: `ticket_id=eq.${id}`
            }, (payload) => {
                // Only add if not internal
                if (!payload.new.is_internal) {
                    setMessages(prev => {
                        if (prev.find(m => m.id === payload.new.id)) return prev;
                        return [...prev, payload.new];
                    });
                }
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
                    is_internal: false,
                    sender_id: user.id
                }]);

            if (error) throw error;

            // Update ticket updated_at
            await supabase.from('support_tickets').update({ updated_at: new Date() }).eq('id', id);

            setNewMessage('');
            fetchTicketDetail(); // Refresh to get the full profile data for the new message
        } catch (err) {
            alert('Mesaj gönderilemedi: ' + err.message);
        } finally {
            setSending(false);
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

    if (loading) return <div className="p-20 text-center text-gray-900 font-bold"><Loader2 className="animate-spin inline-block mr-2 text-orange-500" /> Talep detayları yükleniyor...</div>;
    if (!ticket) return <div className="p-20 text-center">Talep bulunamadı.</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-140px)]">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 p-6 flex justify-between items-center rounded-t-3xl shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/isletme/destek/taleplerim')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <ChevronLeft size={24} className="text-gray-500" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-extrabold uppercase bg-gray-100 text-gray-500 px-2 py-1 rounded">#{ticket.id.substring(0, 8)}</span>
                            <span className="text-[10px] font-extrabold uppercase bg-orange-100 text-orange-600 px-2 py-1 rounded">{ticket.category}</span>
                            <div className={`text-[10px] font-extrabold px-2 py-1 rounded border ${getStatusStyle(ticket.status)}`}>
                                {ticket.status === 'Open' ? 'Açık' : ticket.status === 'In Progress' ? 'İşlemde' : 'Çözüldü'}
                            </div>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-gray-50 p-6 overflow-y-auto space-y-4">
                    {/* Original Issue */}
                    <div className="bg-white border border-gray-100 p-6 rounded-3xl rounded-tl-none max-w-2xl shadow-sm self-start">
                        <div className="text-[10px] font-bold text-orange-500 uppercase mb-2">TALEP DETAYI</div>
                        <p className="text-sm font-medium text-gray-800 leading-relaxed">{ticket.description}</p>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-gray-400">
                            <Clock size={12} />
                            {new Date(ticket.created_at).toLocaleString('tr-TR')}
                        </div>
                    </div>

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex flex-col p-4 rounded-2xl shadow-sm max-w-md ${msg.sender_id === user.id
                                ? 'bg-orange-500 text-white self-end rounded-tr-none'
                                : 'bg-white border border-gray-100 self-start rounded-tl-none'
                                }`}
                        >
                            {!(msg.sender_id === user.id) && (
                                <div className="text-[10px] font-black text-orange-500 uppercase mb-1">DESTEK EKİBİ</div>
                            )}
                            <p className={`text-sm font-medium ${msg.sender_id === user.id ? 'text-white' : 'text-gray-800'}`}>
                                {msg.message}
                            </p>
                            <span className={`text-[10px] mt-2 font-bold ${msg.sender_id === user.id ? 'text-orange-100' : 'text-gray-400'}`}>
                                {new Date(msg.created_at).toLocaleTimeString()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Input Area */}
            {ticket.status !== 'Resolved' ? (
                <div className="bg-white p-6 border-t border-gray-100 rounded-b-3xl shadow-lg">
                    <form onSubmit={handleSendMessage} className="relative">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Cevabınızı buraya yazın..."
                            className="w-full px-6 py-4 pr-16 rounded-2xl bg-gray-50 border-transparent focus:border-orange-500 focus:bg-white border-2 transition-all outline-none font-medium text-gray-900 min-h-[80px] max-h-[200px] resize-none"
                        />
                        <button
                            type="submit"
                            disabled={sending || !newMessage.trim()}
                            className="absolute right-4 bottom-4 p-3 bg-orange-500 text-white rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                        >
                            {sending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="bg-emerald-50 p-4 text-center rounded-b-3xl border-t border-emerald-100">
                    <p className="text-emerald-700 text-sm font-bold flex items-center justify-center gap-2">
                        <CheckCircle2 size={18} />
                        Bu talep çözüldü olarak işaretlendi.
                    </p>
                </div>
            )}
        </div>
    );
};

export default BusinessTicketDetail;
