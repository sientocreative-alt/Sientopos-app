import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Plus, Trash2, Edit2, Save, X, MoveUp, MoveDown } from 'lucide-react';

const AdminFAQ = () => {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(null);
    const [formData, setFormData] = useState({ question: '', answer: '', sort_order: 0 });

    useEffect(() => {
        fetchFaqs();
    }, []);

    const fetchFaqs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('faqs')
                .select('*')
                .eq('type', 'business')
                .order('sort_order', { ascending: true });

            if (error) throw error;
            setFaqs(data || []);
        } catch (err) {
            alert('Hata: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
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
            } else {
                const { error } = await supabase
                    .from('faqs')
                    .insert([{
                        question: formData.question,
                        answer: formData.answer,
                        sort_order: faqs.length
                    }]);
                if (error) throw error;
            }
            setIsEditing(null);
            setFormData({ question: '', answer: '', sort_order: 0 });
            fetchFaqs();
        } catch (err) {
            alert('Hata: ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Bu soruyu silmek istediğinize emin misiniz?')) return;
        try {
            const { error } = await supabase.from('faqs').delete().eq('id', id);
            if (error) throw error;
            fetchFaqs();
        } catch (err) {
            alert('Hata: ' + err.message);
        }
    };

    const startEdit = (faq) => {
        setIsEditing(faq.id);
        setFormData({ question: faq.question, answer: faq.answer, sort_order: faq.sort_order });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">SSS Yönetimi</h1>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <form onSubmit={handleSave} className="space-y-4">
                    <h2 className="text-lg font-bold text-gray-700">{isEditing ? 'Soruyu Düzenle' : 'Yeni Soru Ekle'}</h2>
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-600">Soru</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-900 font-medium"
                                value={formData.question}
                                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                placeholder="Örn: Şifremi nasıl yenilerim?"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-600">Cevap</label>
                            <textarea
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition min-h-[100px] text-gray-900 font-medium"
                                value={formData.answer}
                                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                placeholder="Cevabı buraya yazın..."
                                required
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        {isEditing && (
                            <button
                                type="button"
                                onClick={() => { setIsEditing(null); setFormData({ question: '', answer: '', sort_order: 0 }); }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition"
                            >
                                İptal
                            </button>
                        )}
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition flex items-center gap-2"
                        >
                            {isEditing ? <Save size={18} /> : <Plus size={18} />}
                            {isEditing ? 'Güncelle' : 'Ekle'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700">Mevcut Sorular</div>
                <div className="divide-y divide-gray-100">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Yükleniyor...</div>
                    ) : faqs.length > 0 ? (
                        faqs.map((faq) => (
                            <div key={faq.id} className="p-6 hover:bg-gray-50 transition-colors flex justify-between items-start gap-4">
                                <div className="space-y-1 flex-1">
                                    <h3 className="font-bold text-gray-800">{faq.question}</h3>
                                    <p className="text-sm text-gray-500">{faq.answer}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => startEdit(faq)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                        title="Düzenle"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(faq.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                        title="Sil"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-gray-500 font-medium">Henüz soru eklenmemiş.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminFAQ;
