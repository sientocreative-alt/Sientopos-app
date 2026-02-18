import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Plus, Trash2, Edit2, Save, X, HelpCircle, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminResellerFAQ = () => {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(null);
    const [formData, setFormData] = useState({ question: '', answer: '', sort_order: 0 });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchFaqs();
    }, []);

    const fetchFaqs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('faqs')
                .select('*')
                .eq('type', 'reseller')
                .order('sort_order', { ascending: true });

            if (error) throw error;
            setFaqs(data || []);
        } catch (err) {
            console.error('Error fetching FAQs:', err);
            toast.error('SSS yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isEditing) {
                const { error } = await supabase
                    .from('faqs')
                    .update({
                        question: formData.question,
                        answer: formData.answer,
                        sort_order: formData.sort_order
                    })
                    .eq('id', isEditing);
                if (error) throw error;
                toast.success('Soru güncellendi');
            } else {
                const { error } = await supabase
                    .from('faqs')
                    .insert([{
                        question: formData.question,
                        answer: formData.answer,
                        sort_order: faqs.length,
                        type: 'reseller'
                    }]);
                if (error) throw error;
                toast.success('Yeni soru eklendi');
            }
            setIsEditing(null);
            setFormData({ question: '', answer: '', sort_order: 0 });
            fetchFaqs();
        } catch (err) {
            toast.error('Hata: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Bu soruyu silmek istediğinize emin misiniz?')) return;
        try {
            const { error } = await supabase.from('faqs').delete().eq('id', id);
            if (error) throw error;
            toast.success('Soru silindi');
            fetchFaqs();
        } catch (err) {
            toast.error('Hata: ' + err.message);
        }
    };

    const startEdit = (faq) => {
        setIsEditing(faq.id);
        setFormData({ question: faq.question, answer: faq.answer, sort_order: faq.sort_order });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 text-left font-sans">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100">
                        <HelpCircle size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Bayi S.S.S Yönetimi</h1>
                        <p className="text-gray-500 mt-1 font-medium">Bayi portalındaki "Destek &gt; SSS" bölümündeki içerikleri buradan yönetin.</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest italic flex items-center gap-2">
                            {isEditing ? <Edit2 size={14} /> : <Plus size={14} />}
                            {isEditing ? 'Soruyu Düzenle' : 'Yeni Soru Ekle'}
                        </h2>
                        {isEditing && (
                            <button
                                type="button"
                                onClick={() => { setIsEditing(null); setFormData({ question: '', answer: '', sort_order: 0 }); }}
                                className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                            >
                                Düzenlemeyi İptal Et
                            </button>
                        )}
                    </div>

                    <div className="grid gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Soru Metni</label>
                            <input
                                type="text"
                                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-8 focus:ring-indigo-600/5 transition-all outline-none text-sm font-bold text-gray-900 placeholder:text-gray-300"
                                value={formData.question}
                                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                placeholder="Örn: Komisyon ödemeleri ne zaman yapılır?"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cevap Metni</label>
                            <textarea
                                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-8 focus:ring-indigo-600/5 transition-all outline-none min-h-[150px] text-sm font-medium text-gray-700 leading-relaxed placeholder:text-gray-300 italic"
                                value={formData.answer}
                                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                placeholder="Cevabı buraya detaylıca yazın..."
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2 disabled:opacity-50 active:scale-95"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : (isEditing ? <Save size={16} /> : <Plus size={16} />)}
                            {isEditing ? 'GÜNCELLEMEYİ KAYDET' : 'YENİ SORU EKLE'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Mevcut Sorular ({faqs.length})</span>
                </div>
                <div className="divide-y divide-gray-50">
                    {faqs.length > 0 ? (
                        faqs.map((faq) => (
                            <div key={faq.id} className="p-8 hover:bg-gray-50/50 transition-colors flex justify-between items-start gap-6 group">
                                <div className="space-y-2 flex-1 pt-1">
                                    <h3 className="font-extrabold text-gray-900 leading-tight uppercase tracking-tight text-sm flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                                        {faq.question}
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium leading-relaxed italic opacity-80">{faq.answer}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => startEdit(faq)}
                                        className="p-3 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm"
                                        title="Düzenle"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(faq.id)}
                                        className="p-3 text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm"
                                        title="Sil"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto border border-gray-100">
                                <AlertCircle size={32} className="text-gray-200" />
                            </div>
                            <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest">Henüz bir soru eklenmemiş</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminResellerFAQ;
