import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import {
    Megaphone,
    Link,
    QrCode,
    FileImage,
    PlusCircle,
    Copy,
    Download,
    Share2,
    ExternalLink,
    FileText,
    MonitorPlay,
    CheckCircle2,
    Presentation,
    Image as ImageIcon,
    FileCode
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ResellerMarketing = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [materials, setMaterials] = useState({
        brochure: { name: 'Siento POS Tanıtım Broşürü', url: '', type: 'PDF', icon: 'FileText' },
        logo: { name: 'Logo Paketi (Vektörel)', url: '', type: 'ZIP', icon: 'FileImage' },
        presentation: { name: 'Sunum Dosyası (Genel)', url: '', type: 'PPTX', icon: 'MonitorPlay' }
    });
    const [assets, setAssets] = useState([]);

    useEffect(() => {
        if (user) {
            fetchResellerData();
            fetchMarketingMaterials();
        }
    }, [user]);

    const [activeTab, setActiveTab] = useState('referral'); // referral, qr, assets, demo
    const [resellerCode, setResellerCode] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchMarketingMaterials = async () => {
        try {
            const { data, error } = await supabase
                .from('platform_settings')
                .select('value')
                .eq('key', 'reseller_marketing_materials')
                .single();

            if (error) throw error;
            if (data?.value) {
                setMaterials(data.value);
                // Convert object to array for rendering
                const assetsList = Object.entries(data.value).map(([key, val]) => {
                    let icon = FileText;
                    const ext = val.type?.toLowerCase();
                    if (['jpg', 'jpeg', 'png', 'svg'].includes(ext)) icon = ImageIcon;
                    else if (['pdf'].includes(ext)) icon = FileText;
                    else if (['pptx', 'ppt'].includes(ext)) icon = Presentation;
                    else if (['zip', 'rar'].includes(ext)) icon = FileCode;

                    return {
                        id: key,
                        ...val,
                        icon
                    };
                }).filter(a => a.url); // Only show ones with URLs
                setAssets(assetsList);
            }
        } catch (error) {
            console.error('Error fetching materials:', error);
            // Fallback to defaults if empty but mark as empty if no URLs
            setAssets([]);
        }
    };

    const fetchResellerData = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('resellers')
                .select('reseller_code')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            setResellerCode(data?.reseller_code || 'BELİRLENMEDİ');
        } catch (error) {
            console.error('Error fetching reseller code:', error);
        } finally {
            setLoading(false);
        }
    };

    const referralUrl = `https://sientopos.com/kayit?ref=${resellerCode}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(referralUrl)}&color=4f46e5`;

    const handleCopy = () => {
        navigator.clipboard.writeText(referralUrl);
        toast.success('Bağlantı kopyalandı');
    };

    const tabs = [
        { id: 'referral', label: 'Referans Link', icon: Link },
        { id: 'qr', label: 'QR Kod', icon: QrCode },
        { id: 'assets', label: 'Materyaller', icon: FileImage },
        { id: 'demo', label: 'Demo Oluştur', icon: MonitorPlay }
    ];

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Megaphone size={20} className="text-indigo-600" />
                        PAZARLAMA ARAÇLARI
                    </h1>
                    <p className="text-slate-400 font-bold mt-0.5 uppercase text-[9px] tracking-widest opacity-70 italic">
                        Müşteri ağınızı genişletmeniz için hazırlanan içerikler
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${isActive
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                                }`}
                        >
                            <Icon size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {activeTab === 'referral' && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
                            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mx-auto mb-6">
                                <Link size={32} />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Kişisel Referans Bağlantınız</h3>
                            <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest mb-8">Bu bağlantı üzerinden kayıt olan işletmeler otomatik olarak portföyünüze eklenir</p>

                            <div className="max-w-xl mx-auto flex gap-2 p-2 bg-slate-50 border border-slate-100 rounded-2xl items-center">
                                <span className="flex-1 px-4 text-xs font-bold text-slate-600 truncate">{referralUrl}</span>
                                <button
                                    onClick={handleCopy}
                                    className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-95 shadow-sm"
                                >
                                    <Copy size={16} />
                                </button>
                            </div>

                            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="font-black text-[9px] text-indigo-600 uppercase tracking-widest mb-2">Adım 1</div>
                                    <div className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase">Bağlantınızı kopyalayıp müşterinize gönderin</div>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="font-black text-[9px] text-indigo-600 uppercase tracking-widest mb-2">Adım 2</div>
                                    <div className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase">Müşteri kendi kaydını tamamlasın</div>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="font-black text-[9px] text-indigo-600 uppercase tracking-widest mb-2">Adım 3</div>
                                    <div className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase">İşletme anında panelinize düşsün</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'qr' && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
                            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mx-auto mb-6">
                                <QrCode size={32} />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Referans QR Kodunuz</h3>
                            <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest mb-8 italic opacity-70">Mobil cihazlar için hızlı kayıt deneyimi</p>

                            <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-xl w-64 mx-auto relative group">
                                <img src={qrCodeUrl} alt="Referral QR Code" className="w-full rounded-xl" />
                                <button
                                    onClick={() => window.open(qrCodeUrl, '_blank')}
                                    className="absolute inset-0 bg-indigo-600/90 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all rounded-3xl gap-2 font-black text-[10px] uppercase tracking-widest"
                                >
                                    <Download size={24} />
                                    <span>Görseli İndir</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'assets' && (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {assets.map(asset => {
                                const Icon = asset.icon;
                                const isImage = ['JPG', 'JPEG', 'PNG', 'WEBP'].includes(asset.type?.toUpperCase());

                                return (
                                    <div key={asset.id} className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group overflow-hidden flex flex-col">
                                        {/* Image Preview or Icon Area */}
                                        <div className="h-48 bg-slate-50 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                                            {isImage ? (
                                                <img
                                                    src={asset.url}
                                                    alt={asset.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-3xl bg-white shadow-lg flex items-center justify-center text-indigo-600">
                                                    <Icon size={32} />
                                                </div>
                                            )}

                                            {/* Top Badge */}
                                            <div className="absolute top-4 left-4">
                                                <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-slate-900 uppercase tracking-widest border border-white shadow-sm">
                                                    {asset.type}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-6 flex-1 flex flex-col">
                                            <div className="flex-1">
                                                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-tight mb-1 group-hover:text-indigo-600 transition-colors">
                                                    {asset.name}
                                                </h3>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic opacity-70">
                                                    Boyut: {asset.size || 'Bilgi Yok'}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => asset.url && window.open(asset.url, '_blank')}
                                                className="mt-6 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl group-hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95"
                                            >
                                                <Download size={16} />
                                                Dosyayı İndir
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'demo' && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-12 shadow-sm text-center">
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6">
                                <MonitorPlay size={32} />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Hızlı Demo Hesabı Aç</h3>
                            <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest mb-10 leading-loose max-w-sm mx-auto">
                                Müşteriniz için anında 15 günlük deneme süresi olan bir hesap oluşturun. İşletme detaylarını daha sonra güncelleyebilirsiniz.
                            </p>

                            <button
                                onClick={() => navigate('/isletmeler/yeni')}
                                className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-3 mx-auto"
                            >
                                <PlusCircle size={18} />
                                İşletme Kaydına Git
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ResellerMarketing;
