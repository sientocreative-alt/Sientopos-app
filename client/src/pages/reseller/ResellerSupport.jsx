import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Routes, Route, Link as RouterLink } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import {
    LifeBuoy,
    MessageSquare,
    Send,
    History,
    HelpCircle,
    PlusCircle,
    ChevronRight,
    Clock,
    CheckCircle2,
    AlertCircle,
    Paperclip,
    ArrowLeft,
    Search,
    Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const TicketBadge = ({ status }) => {
    const styles = {
        'Open': 'bg-indigo-50 text-indigo-700 border-indigo-100',
        'In Progress': 'bg-amber-50 text-amber-700 border-amber-100',
        'Resolved': 'bg-emerald-50 text-emerald-700 border-emerald-100',
        'Closed': 'bg-slate-50 text-slate-700 border-slate-100'
    };
    const labels = {
        'Open': 'AÇIK',
        'In Progress': 'İŞLEMDE',
        'Resolved': 'ÇÖZÜLDÜ',
        'Closed': 'KAPANDI'
    };
    return (
        <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${styles[status] || styles['Open']}`}>
            {labels[status] || status}
        </span>
    );
};

const ResellerSupport = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { tab } = useParams();
    const activeTab = tab || 'talep-olustur';

    const tabs = [
        { id: 'talep-olustur', label: 'Talep Oluştur', icon: PlusCircle },
        { id: 'taleplerim', label: 'Taleplerim', icon: History },
        { id: 'sss', label: 'SSS', icon: HelpCircle }
    ];

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [faqs, setFaqs] = useState([]);

    useEffect(() => {
        if (activeTab === 'taleplerim') fetchTickets();
        if (activeTab === 'sss') fetchFaqs();
    }, [activeTab]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('support_tickets')
                .select('*')
                .eq('reseller_id', user.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setTickets(data || []);
        } catch (error) {
            console.error('Error fetching tickets:', error);
            toast.error('Talepler yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const fetchFaqs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('faqs')
                .select('*')
                .eq('type', 'reseller')
                .order('sort_order', { ascending: true });
            if (error) throw error;
            setFaqs(data || []);
        } catch (error) {
            console.error('Error fetching FAQs:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Sub-components ---

    const CreateTicket = () => {
        const [formData, setFormData] = useState({
            title: '',
            category: 'Genel',
            priority: 'Normal',
            description: ''
        });
        const [submitting, setSubmitting] = useState(false);

        const categories = ["Teknik Destek", "Finansal / Ödeme", "Satış & Pazarlama", "Hata Bildirimi", "Genel"];

        const handleSubmit = async (e) => {
            e.preventDefault();
            if (formData.description.length < 20) {
                toast.error('Lütfen daha detaylı bir açıklama yazın');
                return;
            }

            setSubmitting(true);
            try {
                const { error } = await supabase
                    .from('support_tickets')
                    .insert([{
                        reseller_id: user.id,
                        title: formData.title,
                        category: formData.category,
                        priority: formData.priority,
                        description: formData.description,
                        status: 'Open'
                    }]);

                if (error) throw error;
                toast.success('Destek talebiniz başarıyla oluşturuldu');
                navigate('/destek/taleplerim');
            } catch (error) {
                toast.error('Hata: ' + error.message);
            } finally {
                setSubmitting(false);
            }
        };

        return (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                            <select
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-900 font-bold text-xs focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all appearance-none cursor-pointer"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Öncelik</label>
                            <select
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-900 font-bold text-xs focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all appearance-none cursor-pointer"
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                            >
                                <option value="Düşük">Düşük</option>
                                <option value="Normal">Normal</option>
                                <option value="Acil">Acil</option>
                                <option value="Kritik">Kritik</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Konu Başlığı</label>
                        <input
                            required
                            type="text"
                            placeholder="Talebinizi kısaca özetleyin"
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-900 font-bold text-xs focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                            <span>Açıklama</span>
                            <span className="opacity-50 italic">{formData.description.length} karakter</span>
                        </label>
                        <textarea
                            required
                            rows="6"
                            placeholder="Yaşadığınız sorunu veya talebinizi detaylıca açıklayın..."
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-900 font-bold text-xs focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all resize-none"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                    >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        Destek Talebi Oluştur
                    </button>
                </form>
            </div>
        );
    };

    const MyTickets = () => {
        if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" /></div>;

        return (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100/50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="px-6 py-4 opacity-70">Konu / Kategori</th>
                            <th className="px-6 py-4 opacity-70">Tarih</th>
                            <th className="px-6 py-4 opacity-70">Durum</th>
                            <th className="px-6 py-4 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {tickets.length > 0 ? (
                            tickets.map(ticket => (
                                <tr
                                    key={ticket.id}
                                    onClick={() => navigate(`/destek/talepler/${ticket.id}`)}
                                    className="hover:bg-slate-50/80 transition-all cursor-pointer group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-white transition-all">
                                                <MessageSquare size={18} />
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-black text-slate-900 tracking-tight uppercase group-hover:text-indigo-600 transition-colors">{ticket.title}</div>
                                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{ticket.category} • {ticket.priority}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-[10px] font-bold text-slate-600">{format(new Date(ticket.created_at), 'd MMM yyyy', { locale: tr })}</div>
                                        <div className="text-[8px] text-slate-300 font-black uppercase tracking-widest mt-0.5">Oluşturuldu</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <TicketBadge status={ticket.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all ml-auto shadow-sm">
                                            <ChevronRight size={14} />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="px-6 py-20 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-4 border border-slate-100">
                                        <History size={32} />
                                    </div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Henüz bir talebiniz bulunmuyor</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    const FAQSection = () => {
        const [openIndex, setOpenIndex] = useState(null);

        return (
            <div className="space-y-3 max-w-3xl mx-auto">
                <div className="text-center mb-10">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">Sıkça Sorulan Sorular</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70">En çok merak edilen soruların cevapları</p>
                </div>
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" /></div>
                ) : faqs.length > 0 ? (
                    faqs.map((faq, idx) => (
                        <div key={faq.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all">
                            <button
                                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-all group"
                            >
                                <span className="text-[11px] font-black text-slate-700 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{faq.question}</span>
                                <PlusCircle size={16} className={`text-slate-300 transition-transform duration-300 ${openIndex === idx ? 'rotate-45 text-rose-500' : ''}`} />
                            </button>
                            {openIndex === idx && (
                                <div className="px-6 pb-5 animate-in slide-in-from-top-2 duration-300">
                                    <div className="pt-3 border-t border-slate-50 text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-wide italic">
                                        {faq.answer}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl opacity-50 italic font-black text-[10px] uppercase tracking-widest text-slate-400">
                        Henüz SSS eklenmemiş
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <LifeBuoy size={20} className="text-indigo-600" />
                        DESTEK MERKEZİ
                    </h1>
                    <p className="text-slate-400 font-bold mt-0.5 uppercase text-[9px] tracking-widest opacity-70 italic">
                        Sorunlarınızı çözmek ve sorularınızı yanıtlamak için buradayız
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
                {tabs.map((t) => {
                    const Icon = t.icon;
                    const isActive = activeTab === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => navigate(`/destek/${t.id}`)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${isActive
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                                }`}
                        >
                            <Icon size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="mt-8">
                {activeTab === 'talep-olustur' && <CreateTicket />}
                {activeTab === 'taleplerim' && <MyTickets />}
                {activeTab === 'sss' && <FAQSection />}
            </div>
        </div>
    );
};

export default ResellerSupport;
