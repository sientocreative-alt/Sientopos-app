import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, AlertCircle, Loader2, Paperclip } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const SupportTicket = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        category: '',
        priority: 'Normal',
        title: '',
        description: ''
    });

    const categories = [
        "Abonelik & Ödeme",
        "Fatura / İade",
        "Teknik Sorun",
        "Hesap Problemi",
        "Özellik Talebi",
        "Reklam Problemi",
        "Diğer"
    ];

    const priorities = ["Düşük", "Normal", "Acil", "Kritik"];

    const getSystemInfo = () => {
        return {
            platform: 'Web',
            userAgent: navigator.userAgent,
            language: navigator.language,
            screenSize: `${window.innerWidth}x${window.innerHeight}`,
            version: '1.0.0',
            userId: user?.id,
            plan: user?.subscription_plan || 'free',
            lastPayment: user?.last_payment_date || null
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.description.length < 30) {
            alert('Lütfen en az 30 karakterlik bir açıklama yazın.');
            return;
        }

        try {
            setSending(true);

            const { error: ticketError } = await supabase
                .from('support_tickets')
                .insert([{
                    business_id: user?.business_id,
                    profile_id: user?.id,
                    category: formData.category,
                    priority: formData.priority,
                    title: formData.title,
                    description: formData.description,
                    system_info: getSystemInfo()
                }]);

            if (ticketError) throw ticketError;

            setSuccess(true);
            setFormData({ category: '', priority: 'Normal', title: '', description: '' });
        } catch (error) {
            console.error('Error creating ticket:', error);
            alert('Talep oluşturulurken bir hata oluştu: ' + error.message);
        } finally {
            setSending(false);
        }
    };

    if (success) {
        return (
            <div className="max-w-xl mx-auto pt-20 text-center animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Send size={32} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Talebiniz Alındı!</h1>
                <p className="text-gray-500 mb-8">Destek ekibimiz en kısa sürede size dönüş yapacaktır.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => setSuccess(false)}
                        className="w-full sm:w-auto px-8 py-3 border-2 border-gray-100 text-gray-400 rounded-2xl font-bold hover:bg-gray-50 transition-all"
                    >
                        Yeni Talep Oluştur
                    </button>
                    <button
                        onClick={() => navigate('/isletme/destek/taleplerim')}
                        className="w-full sm:w-auto px-8 py-3 bg-orange-500 text-white rounded-2xl font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all"
                    >
                        Taleplerimi Gör
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto pb-20">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-orange-100 rounded-2xl text-orange-600 font-bold">
                    <MessageSquare size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Destek Talep Oluştur</h1>
                    <p className="text-gray-500 text-sm font-medium">Uzman ekibimiz size yardımcı olmak için burada.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-gray-700 block ml-1">Konu Başlığı</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Talebinizi kısaca özetleyin"
                                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium text-gray-900"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-bold text-gray-700">Detaylı Açıklama</label>
                                <span className={`text-[10px] font-bold ${formData.description.length < 30 ? 'text-orange-500' : 'text-emerald-500'}`}>
                                    {formData.description.length}/30 Min
                                </span>
                            </div>
                            <textarea
                                required
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Sorununuzu detaylıca açıklayın..."
                                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium text-gray-900 min-h-[200px] resize-none"
                            />
                        </div>

                        <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                            <button type="button" className="flex items-center gap-2 text-gray-400 font-bold text-sm">
                                <Paperclip size={18} />
                                Dosya Ekle
                            </button>
                            <button
                                type="submit"
                                disabled={sending}
                                className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-orange-500 transition-all flex items-center gap-3 disabled:opacity-50"
                            >
                                {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                                Talep Oluştur
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-gray-700 block ml-1">Kategori</label>
                            <select
                                required
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold text-gray-700"
                            >
                                <option value="">Kategori Seçin</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div className="space-y-4">
                            <label className="text-sm font-bold text-gray-700 block ml-1">Öncelik Seviyesi</label>
                            <div className="grid grid-cols-2 gap-2">
                                {priorities.map(p => (
                                    <button
                                        key={p}
                                        type="button"
                                        disabled={p === 'Kritik' && user?.subscription_plan !== 'pro'}
                                        onClick={() => setFormData({ ...formData, priority: p })}
                                        className={`py-3 rounded-xl text-xs font-bold border-2 transition-all ${formData.priority === p
                                            ? 'border-orange-500 bg-orange-50 text-orange-600'
                                            : 'border-transparent bg-gray-50 text-gray-400 hover:bg-gray-100'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default SupportTicket;
