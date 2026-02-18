import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X as XIcon } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const NewOperationAuditSurvey = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [responses, setResponses] = useState({}); // { question_id: boolean }

    useEffect(() => {
        if (user) {
            fetchQuestions();
        }
    }, [user]);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('operation_audit_questions')
                .select('*')
                .eq('business_id', user.business_id)
                .eq('status', 'active')
                .order('created_at', { ascending: true });

            if (error) throw error;
            setQuestions(data || []);

            // Initialize responses
            const initialResponses = {};
            data?.forEach(q => {
                initialResponses[q.id] = true; // Default to Yes
            });
            setResponses(initialResponses);
        } catch (error) {
            console.error('Error fetching questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleResponse = (questionId, value) => {
        setResponses(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);

            // 1. Create the survey
            const { data: survey, error: surveyError } = await supabase
                .from('operation_audit_surveys')
                .insert([{ business_id: user.business_id }])
                .select()
                .single();

            if (surveyError) throw surveyError;

            // 2. Create the responses
            const responsePayloads = questions.map(q => ({
                survey_id: survey.id,
                question_id: q.id,
                question_text: q.question_text,
                weight: q.weight,
                is_yes: responses[q.id]
            }));

            const { error: responsesError } = await supabase
                .from('operation_audit_responses')
                .insert(responsePayloads);

            if (responsesError) throw responsesError;

            navigate(`/isletme/operasyon-anketi/${survey.id}`);
        } catch (error) {
            console.error('Error saving survey:', error);
            alert('Anket kaydedilirken bir hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
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
                    onClick={() => navigate('/isletme/operasyon-anketi')}
                    className="p-2 bg-white rounded-lg shadow-sm text-gray-400 hover:text-gray-600 transition-all"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Yeni Operasyon Denetim Anketi</h1>
                    <nav className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="hover:text-gray-600 transition-all cursor-pointer">Pano</span>
                        <span>•</span>
                        <span className="hover:text-gray-600 transition-all cursor-pointer">Operasyon Denetim Anketi</span>
                        <span>•</span>
                        <span className="text-gray-600 font-medium">Yeni</span>
                    </nav>
                </div>
            </div>

            {/* Questions Form */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 max-w-4xl mx-auto overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/30 font-bold text-gray-800">
                    Anketi Doldur
                </div>
                {questions.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        Henüz aktif bir denetim sorusu bulunmamaktadır. Lütfen önce soru ekleyiniz.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="space-y-4">
                            {questions.map((q) => (
                                <div key={q.id} className="flex items-center justify-between p-4 border border-gray-50 rounded-xl hover:bg-gray-50 transition-all">
                                    <div className="flex-1 pr-4">
                                        <p className="text-sm font-medium text-gray-800">{q.question_text}</p>
                                        <p className="text-xs text-gray-400 mt-1">Ağırlık: {q.weight}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleResponse(q.id, true)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${responses[q.id] === true
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                }`}
                                        >
                                            <Check size={14} />
                                            Evet
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleResponse(q.id, false)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${responses[q.id] === false
                                                    ? 'bg-red-500 text-white'
                                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                }`}
                                        >
                                            <XIcon size={14} />
                                            Hayır
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
                            <button
                                type="button"
                                onClick={() => navigate('/isletme/operasyon-anketi')}
                                className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-200 transition-all"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50"
                            >
                                {saving ? 'Kaydediliyor...' : 'Anketi Tamamla'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default NewOperationAuditSurvey;
