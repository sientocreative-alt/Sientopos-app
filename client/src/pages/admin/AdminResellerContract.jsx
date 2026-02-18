import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import {
    FileText,
    Save,
    Loader2,
    RotateCcw,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminResellerContract = () => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [originalContent, setOriginalContent] = useState('');

    useEffect(() => {
        fetchContract();
    }, []);

    const fetchContract = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('platform_settings')
                .select('value')
                .eq('key', 'reseller_contract')
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data?.value?.content) {
                setContent(data.value.content);
                setOriginalContent(data.value.content);
            }
        } catch (err) {
            console.error('Error fetching contract:', err);
            toast.error('Sözleşme yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!content) return toast.error('Lütfen sözleşme içeriği girin.');

        try {
            setSaving(true);
            const { error } = await supabase
                .from('platform_settings')
                .upsert({
                    key: 'reseller_contract',
                    value: { content },
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            toast.success('Sözleşme başarıyla güncellendi!');
            setOriginalContent(content);
        } catch (err) {
            console.error('Error saving contract:', err);
            toast.error('Kayıt hatası: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (confirm('Değişiklikleri geri almak istediğinize emin misiniz?')) {
            setContent(originalContent);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    const hasChanges = content !== originalContent;

    return (
        <div className="max-w-5xl mx-auto space-y-6 text-left font-sans">
            <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3 tracking-tight">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100">
                            <FileText size={24} />
                        </div>
                        Bayi Sözleşme Yönetimi
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">Bayi portalındaki "Sözleşme" sekmesinde görünen resmi metni buradan düzenleyin.</p>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <form onSubmit={handleSave} className="flex flex-col">
                    <div className="p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sözleşme Metni (Markdown/Düz Metin)</span>
                                {hasChanges && (
                                    <span className="text-[8px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
                                        <AlertCircle size={10} /> Kaydedilmemiş Değişiklikler
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    disabled={!hasChanges || saving}
                                    className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all disabled:opacity-30"
                                    title="Geri Al"
                                >
                                    <RotateCcw size={18} />
                                </button>
                                <button
                                    type="submit"
                                    disabled={!hasChanges || saving}
                                    className="px-8 py-3 bg-indigo-600 hover:bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 disabled:opacity-50 active:scale-95"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    DEĞİŞİKLİKLERİ KAYDET
                                </button>
                            </div>
                        </div>

                        <div className="relative group">
                            <textarea
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                className="w-full h-[600px] p-8 bg-gray-50/50 border border-gray-100 rounded-3xl text-sm font-medium text-gray-700 leading-relaxed focus:bg-white focus:ring-8 focus:ring-indigo-600/5 transition-all outline-none resize-none custom-scrollbar italic"
                                placeholder="Sözleşme maddelerini buraya yazın..."
                            />
                            <div className="absolute top-4 right-4 opacity-10 group-focus-within:opacity-20 transition-opacity pointer-events-none">
                                <FileText size={100} />
                            </div>
                        </div>

                        <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                                <CheckCircle2 size={20} />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-1">Bilgilendirme</h4>
                                <p className="text-[11px] text-indigo-800 font-bold leading-relaxed opacity-80">
                                    Burada yaptığınız değişiklikler "Bayi Portalı"ndaki tüm bayiler için anında geçerli olacaktır.
                                    Sözleşme metninde maddeleri net ve okunaklı bir şekilde belirtmeniz önerilir.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <span>Platform Güvenli Alan</span>
                        <div className="flex items-center gap-4">
                            <span>Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}</span>
                            <span>UTF-8 Kodlama</span>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminResellerContract;
