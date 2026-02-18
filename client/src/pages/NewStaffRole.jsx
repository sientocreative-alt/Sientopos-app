import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { ChevronDown } from 'lucide-react';

const NewStaffRole = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [openCategories, setOpenCategories] = useState({});

    const [formData, setFormData] = useState({
        role_name: '',
        permissions: {}
    });

    // Define permission categories - EXACT from images
    const permissionCategories = {
        'Anasayfa': [
            'Anasayfa',
            'Ciro',
            'POS Ayarları'
        ],
        'Menü Yönetimi': [
            'Menü Yönetimi',
            'Kampanyalar',
            'Happy Hour',
            'Süreli İndirimler',
            'QR Menü',
            'Bölümler / Masalar',
            'Opsiyonel Ürünler',
            'Zorunlu Seçim Grupları',
            'Ödeme Yöntemleri',
            'Tanımlı Cihazlar',
            'Terminaller',
            'Yazıcılar',
            'Arka Ekran Slider',
            'Masa Renkleri',
            'İndirim Türleri',
            'Ön Tanımlı Notlar',
            'Ayarlar'
        ],
        'Personel Yönetimi': [
            'Personel Yönetimi',
            'Yönetici & Personel',
            'Hedefler',
            'Personel Bildirimleri',
            'Mesai Yönetimi',
            'Mola Süreleri',
            'Personel Takip',
            'Personel Rolleri',
            'Görevler',
            'Operasyon Denetim Soruları',
            'Operasyon Denetim Anketi'
        ],
        'Mesai / Mola QR': [
            'Mesai / Mola QR'
        ],
        'Muhasebe Kayıtları': [
            'Muhasebe Kayıtları',
            'Hesaplar',
            'Adisyon Listesi',
            'Satılan Ürünler',
            'Ödemeler',
            'Ürün KDV Oranları',
            'Tedarikçiler',
            'Tedarikçi KDV Raporları',
            'Müşteri İşletmeler',
            'Müşteri KDV Raporları',
            'Faturalar',
            'Fatura Kalemleri',
            'Birim Maliyetler',
            'Kasa Kapanışları',
            'Sabit Maliyetler',
            'Personel Ödemeleri',
            'Diğer Ödemeler'
        ],
        'Stok': [
            'Stok',
            'Depolar',
            'Depo Transfer',
            'Stok Birimleri',
            'Stoklu Ürün Kategorileri',
            'Stoklu Ürünler',
            'Stok Girişi',
            'Stok Durumu',
            'Stok Kartları',
            'Atık Ürünler'
        ],
        'Raporlar': [
            'Raporlar',
            'Satış Raporları',
            'Ürün Raporları',
            'Stok Raporları',
            'Finans Raporları',
            'Çalışan Raporları'
        ],
        'Entegrasyonlar': [
            'Entegrasyonlar',
            'Paket Siparişler',
            'POS Cihazları'
        ],
        'Abonelik': [
            'Abonelik',
            'MenuBoard',
            'Personel İndirimleri',
            'Destek'
        ],
        'Satış Ekranına Git': [
            'Satış Ekranına Git',
            'Ödemeleri Düzenleyebilir',
            'Fatura Onaylayabilir',
            'Fatura Onayı Kaldırabilir',
            'Stok Sayım Kontrolü Yapabilir',
            'Pano\'yu Görebilir',
            'Kritik Stok Bildirimi',
            'Personel Bilgilerini Düzenleyebilir',
            'Ödeme Alabilir',
            'İkram Yapabilir',
            'İndirim Yapabilir',
            'Ürün İptali Yapabilir',
            'Ödeme İptal Yapabilir',
            'Ödenmez Ödeme Yapabilir',
            'Para Çekmecesini Açabilir',
            'Atık Yapabilir',
            'Destek Mesajlarını Görebilir',
            'Destek Mesajlarını Cevaplayabilir',
            'Pos Ekranında Ödeme Düzenleyebilir mi?',
            'Anasayfada Mesaileri Görebilir mi?',
            'Stok Düzenleyebilir mi?',
            'Kasa Kapanışı silebilir mi?',
            'Kasa Kapanışı düzenleyebilir mi?',
            'Kasa Kapanışı onaylayabilir mi?',
            'POS Ekranında Raporları Görebilir mi?',
            'Kardo Boss\'a Erişebilir mi?',
            'Yeni siparişlerde bildirim gönderilsin mi?',
            'Ürün Teslim / Gönderim Formu Oluşturabilir',
            'Kardo Ödeme Bildirimlerini Alabilir mi?',
            'POS Ekranında Cari Hesapları Yönetebilir mi?'
        ]
    };

    useEffect(() => {
        if (id && user) {
            fetchRole();
        }
    }, [id, user]);

    const fetchRole = async () => {
        const { data, error } = await supabase
            .from('staff_roles')
            .select('*')
            .eq('id', id)
            .single();

        if (data) {
            setFormData({
                role_name: data.role_name,
                permissions: data.permissions || {}
            });
        }
    };

    const toggleCategory = (category) => {
        setOpenCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const handlePermissionToggle = (permission) => {
        setFormData({
            ...formData,
            permissions: {
                ...formData.permissions,
                [permission]: !formData.permissions[permission]
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            business_id: user.business_id,
            role_name: formData.role_name,
            permissions: formData.permissions
        };

        let result;
        if (id) {
            result = await supabase
                .from('staff_roles')
                .update(payload)
                .eq('id', id);
        } else {
            result = await supabase
                .from('staff_roles')
                .insert([payload]);
        }

        if (!result.error) {
            navigate('/isletme/personel-rolleri');
        } else {
            alert('Hata: ' + result.error.message);
        }
        setLoading(false);
    };

    return (
        <div className="p-6 bg-[#F8F9FC] min-h-screen">
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-gray-800">Personel Rolü Ekle</h1>
                    </div>
                </div>
            </div>

            {/* Form Card */}
            <form onSubmit={handleSubmit} className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden max-w-[900px]">
                <div className="p-8">
                    {/* Role Name */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            <span className="text-red-500">*</span> Rol
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.role_name}
                            onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                            placeholder="Rol"
                            className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm focus:outline-none focus:border-blue-500 transition-all text-gray-600"
                        />
                    </div>

                    {/* Permissions */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">İzinler</label>
                        <div className="space-y-2">
                            {Object.entries(permissionCategories).map(([category, permissions]) => (
                                <div key={category} className="border border-gray-200 rounded-xl overflow-hidden">
                                    {/* Category Header - Always visible, no click */}
                                    <div className="w-full px-6 py-4 bg-gray-50">
                                        <span className="text-sm font-bold text-gray-700">{category}</span>
                                    </div>

                                    {/* Category Content - Always visible */}
                                    <div className="p-6 bg-white space-y-4">
                                        {permissions.map((permission) => (
                                            <div key={permission} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                                <span className="text-sm text-gray-700">{permission}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.permissions[permission] || false}
                                                        onChange={() => handlePermissionToggle(permission)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2196F3] peer-checked:after:border-white"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="px-8 py-6 bg-gray-50/50 flex justify-end items-center gap-3 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => navigate('/isletme/personel-rolleri')}
                        className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                    >
                        İptal
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-[#2196F3] text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Kaydediliyor...' : 'Rol Ekle'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewStaffRole;
