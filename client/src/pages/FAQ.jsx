import { useState, useEffect } from 'react';
import { HelpCircle, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';

const FAQ = () => {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openIndex, setOpenIndex] = useState(null);

    useEffect(() => {
        fetchFaqs();
    }, []);

    const toggleFaq = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const fetchFaqs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('faqs')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;
            setFaqs(data || []);
        } catch (err) {
            console.error('Error fetching FAQs:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                    <HelpCircle size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Sıkça Sorulan Sorular</h1>
                    <p className="text-gray-500 text-sm font-medium">Hızlı cevaplar için hazır yanıtlarımıza göz atın.</p>
                </div>
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                        <p className="text-gray-400 font-medium">Cevaplar getiriliyor...</p>
                    </div>
                ) : faqs.length > 0 ? (
                    faqs.map((faq, idx) => (
                        <div
                            key={faq.id}
                            className={`bg-white rounded-2xl border border-gray-100 p-0 overflow-hidden hover:shadow-md transition-all group animate-in fade-in slide-in-from-bottom-2 duration-300`}
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <button
                                onClick={() => toggleFaq(idx)}
                                className="w-full text-left p-6 flex items-start justify-between gap-4 outline-none"
                            >
                                <h3 className={`font-bold transition-colors ${openIndex === idx ? 'text-blue-600' : 'text-gray-800'} group-hover:text-blue-600`}>
                                    {faq.question}
                                </h3>
                                <div className={`mt-1 text-gray-300 group-hover:text-blue-500 transition-all duration-300 ${openIndex === idx ? 'rotate-90 text-blue-500' : ''}`}>
                                    <ChevronRight size={20} />
                                </div>
                            </button>

                            <div className={`transition-all duration-300 ease-in-out ${openIndex === idx ? 'max-h-96 opacity-100 pb-6 px-6' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                <p className="text-gray-500 text-sm leading-relaxed border-t border-gray-50 pt-4">
                                    {faq.answer}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                        <p className="text-gray-400 font-medium">Henüz bir soru eklenmemiş.</p>
                    </div>
                )}
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 text-center border-2 border-dashed border-gray-200">
                <p className="text-gray-500 text-sm font-medium">
                    Aradığınız cevabı bulamadınız mı? <span className="text-blue-600 cursor-pointer hover:underline">Canlı destekle iletişime geçin.</span>
                </p>
            </div>
        </div>
    );
};

export default FAQ;
