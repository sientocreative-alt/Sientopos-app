import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const NewOperationAuditQuestion = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [formData, setFormData] = useState({
        question_text: '',
        weight: 1
    });

    useEffect(() => {
        if (isEdit && user) {
            fetchQuestion();
        }
    }, [id, user]);

    const fetchQuestion = async () => {
        try {
            setFetching(true);
            const { data, error } = await supabase
                .from('operation_audit_questions')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    question_text: data.question_text,
                    weight: data.weight
                });
            }
        } catch (error) {
            console.error('Error fetching question:', error);
            alert('Soru yüklenirken bir hata oluştu');
            navigate('/isletme/operasyon-anket-sorulari');
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);

            const payload = {
                ...formData,
                business_id: user.business_id,
                updated_at: new Date().toISOString()
            };

            let error;
            if (isEdit) {
                const { error: updateError } = await supabase
                    .from('operation_audit_questions')
                    .update(payload)
                    .eq('id', id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('operation_audit_questions')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            navigate('/isletme/operasyon-anket-sorulari');
        } catch (error) {
            console.error('Error saving question:', error);
            alert('Soru kaydedilirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="p-6 bg-[#F8F9FC] min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-[#F8F9FC] min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/isletme/operasyon-anket-sorulari')}
                    className="p-2 bg-white rounded-lg shadow-sm text-gray-400 hover:text-gray-600 transition-all"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-800">{isEdit ? 'Duzenle' : 'Yeni'}</h1>
                    <nav className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="hover:text-gray-600 transition-all cursor-pointer">Pano</span>
                        <span>•</span>
                        <span className="hover:text-gray-600 transition-all cursor-pointer">Operasyon Denetim Soruları</span>
                        <span>•</span>
                        <span className="text-gray-600 font-medium">{isEdit ? 'Duzenle' : 'Yeni'}</span>
                    </nav>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 max-w-4xl mx-auto overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/30 font-bold text-gray-800">
                    Operasyon Denetim Soruları Ekle
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            * Soru
                        </label>
                        <textarea
                            required
                            rows={4}
                            value={formData.question_text}
                            onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm resize-none text-gray-800"
                            placeholder="Soru"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            * Ağırlık
                        </label>
                        <input
                            type="number"
                            required
                            min="1"
                            value={formData.weight}
                            onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-gray-800"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                        <button
                            type="button"
                            onClick={() => navigate('/isletme/operasyon-anket-sorulari')}
                            className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-200 transition-all"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-bold text-sm hover:bg-blue-600 transition-all shadow-sm disabled:opacity-50"
                        >
                            {loading ? 'Kaydediliyor...' : 'Operasyon Denetim Soruları Ekle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewOperationAuditQuestion;
