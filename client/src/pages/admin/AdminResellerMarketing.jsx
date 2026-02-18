import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import {
    FileText,
    Save,
    Loader2,
    FileImage,
    MonitorPlay,
    Upload,
    CheckCircle2,
    AlertCircle,
    X,
    ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminResellerMarketing = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [materials, setMaterials] = useState({
        brochure: { name: 'Siento POS Tanıtım Broşürü', url: '', type: 'PDF', icon: 'FileText' },
        logo: { name: 'Logo Paketi (Vektörel)', url: '', type: 'PAKET', icon: 'FileImage' },
        presentation: { name: 'Sunum Dosyası (Genel)', url: '', type: 'SUNUM', icon: 'MonitorPlay' }
    });
    const [uploading, setUploading] = useState({ brochure: false, logo: false, presentation: false });

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('platform_settings')
                .select('value')
                .eq('key', 'reseller_marketing_materials')
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data?.value) {
                setMaterials(prev => ({
                    ...prev,
                    ...data.value
                }));
            }
        } catch (err) {
            console.error('Error fetching materials:', err);
            toast.error('Veriler yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e, key) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploading(prev => ({ ...prev, [key]: true }));

            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${key}_${Date.now()}.${fileExt}`;
            const filePath = `marketing/${fileName}`;

            // Make sure the bucket 'marketing' exists or use a generic public one
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('details')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('details')
                .getPublicUrl(filePath);

            // 3. Update State
            setMaterials(prev => ({
                ...prev,
                [key]: {
                    ...prev[key],
                    url: publicUrl,
                    type: fileExt.toUpperCase(),
                    icon: ['jpg', 'jpeg', 'png'].includes(fileExt.toLowerCase()) ? 'FileImage' : 'FileText',
                    size: (file.size / (1024 * 1024)).toFixed(1) + ' MB'
                }
            }));

            toast.success('Dosya başarıyla yüklendi');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Dosya yüklenemedi: ' + error.message);
        } finally {
            setUploading(prev => ({ ...prev, [key]: false }));
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const { error } = await supabase
                .from('platform_settings')
                .upsert({
                    key: 'reseller_marketing_materials',
                    value: materials,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            toast.success('Tüm değişiklikler başarıyla kaydedildi!');
        } catch (err) {
            console.error('Save error:', err);
            toast.error('Kayıt edilemedi: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const removeFile = (key) => {
        setMaterials(prev => ({
            ...prev,
            [key]: { ...prev[key], url: '', size: '' }
        }));
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 text-left font-sans">
            <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3 tracking-tight">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100">
                            <Upload size={24} />
                        </div>
                        Pazarlama Materyalleri Yönetimi
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium italic opacity-70">Bayilerin indirebileceği dökümanları ve paketleri buradan yükleyin.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-3 bg-indigo-600 hover:bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 disabled:opacity-50 active:scale-95"
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    DEĞİŞİKLİKLERİ KAYDET
                </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {Object.entries(materials).map(([key, asset]) => {
                    const Icon = key === 'brochure' ? FileText : key === 'logo' ? FileImage : MonitorPlay;
                    const isUploading = uploading[key];

                    return (
                        <div key={key} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-8 flex-1">
                                <div className="flex items-center justify-between mb-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${asset.url ? 'bg-emerald-50 text-emerald-600 overflow-hidden' : 'bg-slate-50 text-slate-400'}`}>
                                        {asset.url && ['JPG', 'JPEG', 'PNG', 'WEBP'].includes(asset.type?.toUpperCase()) ? (
                                            <img src={asset.url} alt="preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <Icon size={28} />
                                        )}
                                    </div>
                                    {asset.url && (
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                                            <CheckCircle2 size={12} /> YÜKLÜ
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2 truncate">{asset.name}</h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-6">FORMAT: {asset.type} {asset.size ? `• ${asset.size}` : ''}</p>

                                {asset.url ? (
                                    <div className="space-y-3">
                                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group">
                                            <span className="text-[10px] font-bold text-slate-500 break-all line-clamp-1 pr-4 italic">Dosya Yayında</span>
                                            <div className="flex items-center gap-2">
                                                <a href={asset.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-600 transition-colors">
                                                    <ExternalLink size={14} />
                                                </a>
                                                <button onClick={() => removeFile(key)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="cursor-pointer block">
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => handleFileUpload(e, key)}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            disabled={isUploading}
                                        />
                                        <div className={`w-full h-32 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-2 transition-all group ${isUploading ? 'bg-slate-50 border-slate-200' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30'}`}>
                                            {isUploading ? (
                                                <Loader2 className="animate-spin text-slate-400" size={24} />
                                            ) : (
                                                <>
                                                    <Upload size={24} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600">DOSYA SEÇ</span>
                                                </>
                                            )}
                                        </div>
                                    </label>
                                )}
                            </div>

                            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{key.toUpperCase()} PANELİ</span>
                                <div className="text-[8px] font-bold text-slate-300 italic">v1.2</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm shrink-0">
                    <AlertCircle size={20} />
                </div>
                <div>
                    <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest mb-1">DİKKAT</h4>
                    <p className="text-[11px] text-amber-800 font-bold leading-relaxed opacity-80">
                        Yüklediğiniz dosyalar anında Bayi Portalı'nda indirilebilir hale gelir. Eski dosyaların üzerine yeni dosya yüklediğinizde,
                        "Değişiklikleri Kaydet" butonuna basmayı unutmayın. Dosyaların herkese açık (public) link olarak oluşturulduğundan emin olun.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminResellerMarketing;
