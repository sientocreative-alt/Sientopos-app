import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Download } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const OperationAuditSurveyDetail = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [survey, setSurvey] = useState(null);
    const [responses, setResponses] = useState([]);

    useEffect(() => {
        if (user && id) {
            fetchSurveyDetail();
        }
    }, [user, id]);

    const fetchSurveyDetail = async () => {
        try {
            setLoading(true);

            // Fetch survey info
            const { data: surveyData, error: surveyError } = await supabase
                .from('operation_audit_surveys')
                .select('*')
                .eq('id', id)
                .single();

            if (surveyError) throw surveyError;
            setSurvey(surveyData);

            // Fetch responses
            const { data: responseData, error: responseError } = await supabase
                .from('operation_audit_responses')
                .select('*')
                .eq('survey_id', id);

            if (responseError) throw responseError;
            setResponses(responseData || []);

        } catch (error) {
            console.error('Error fetching survey details:', error);
            alert('Anket detayları yüklenirken bir hata oluştu');
            navigate('/isletme/operasyon-anketi');
        } finally {
            setLoading(false);
        }
    };

    // Calculate metrics
    const tamPuan = responses.reduce((acc, curr) => acc + curr.weight, 0);
    const evetToplami = responses.filter(r => r.is_yes).length;
    const hayirToplami = responses.filter(r => !r.is_yes).length;
    const agirlikliPuan = responses.reduce((acc, curr) => acc + (curr.is_yes ? curr.weight : 0), 0);
    const yuzde = tamPuan > 0 ? (agirlikliPuan / tamPuan) * 100 : 0;

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
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/isletme/operasyon-anketi')}
                        className="p-2 bg-white rounded-lg shadow-sm text-gray-400 hover:text-gray-600 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Operasyon Denetim Anketi</h1>
                        <nav className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="hover:text-gray-600 transition-all cursor-pointer">Pano</span>
                            <span>•</span>
                            <span className="hover:text-gray-600 transition-all cursor-pointer">Operasyon Denetim Anketi</span>
                            <span>•</span>
                            <span className="text-gray-600 font-medium">Anket Sonucu</span>
                        </nav>
                    </div>
                </div>
                <button
                    onClick={() => window.print()}
                    className="bg-white text-gray-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all shadow-sm border border-gray-100 flex items-center gap-2 print:hidden"
                >
                    <Download size={18} />
                    Raporu Yazdır
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
                {/* Result Card */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <FileText className="text-blue-500" size={20} />
                            <h2 className="text-lg font-bold text-gray-800">Anket Özet Raporu</h2>
                        </div>
                        <span className="text-sm text-gray-400 font-medium">
                            {new Date(survey?.created_at).toLocaleString('tr-TR')}
                        </span>
                    </div>

                    <div className="divide-y divide-gray-50 text-gray-800">
                        <div className="flex justify-between p-5 hover:bg-gray-50 transition-all">
                            <span className="font-bold">Tam Puan</span>
                            <span className="font-medium">{tamPuan}</span>
                        </div>
                        <div className="flex justify-between p-5 hover:bg-gray-50 transition-all">
                            <span className="font-bold">Evet Toplamı</span>
                            <span className="font-medium text-green-600">{evetToplami}</span>
                        </div>
                        <div className="flex justify-between p-5 hover:bg-gray-50 transition-all">
                            <span className="font-bold">Hayır Toplamı</span>
                            <span className="font-medium text-red-600">{hayirToplami}</span>
                        </div>
                        <div className="flex justify-between p-5 hover:bg-gray-50 transition-all">
                            <span className="font-bold">Ağırlıklı Puan</span>
                            <span className="font-medium text-blue-600">{agirlikliPuan}</span>
                        </div>
                        <div className="flex justify-between p-5 bg-blue-50/30">
                            <span className="font-extrabold text-blue-800 text-lg">Yüzde</span>
                            <span className="font-extrabold text-blue-800 text-lg">
                                %{yuzde.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Question Details List */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 font-bold text-gray-800">
                        Soru Detayları
                    </div>
                    <div className="p-0">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Soru</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Ağırlık</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Cevap</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {responses.map((response) => (
                                    <tr key={response.id} className="hover:bg-gray-50/50 transition-all">
                                        <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                                            {response.question_text}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 text-center">
                                            {response.weight}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${response.is_yes
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                {response.is_yes ? 'Evet' : 'Hayır'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OperationAuditSurveyDetail;
