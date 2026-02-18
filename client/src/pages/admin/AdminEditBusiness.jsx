import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Calendar, FileText, User, Building, MapPin, Hash, ShieldCheck } from 'lucide-react';

const AdminEditBusiness = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [originalData, setOriginalData] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        status: 'active',
        subscription_plan: 'trial',
        trial_end_date: '',
        subscription_end_date: '',
        // Settings Fields
        ownerName: '',
        taxOffice: '',
        taxNumber: '',
        billingType: 'Kurumsal',
        companyType: 'Şahıs',
        address: '',
        taxPlateUrl: '',
        business_display_name: ''
    });

    useEffect(() => {
        fetchBusiness();
    }, [id]);

    const fetchBusiness = async () => {
        try {
            const { data, error } = await supabase
                .from('businesses')
                .select(`
                    *,
                    pos_settings (*)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            const settings = Array.isArray(data.pos_settings) ? data.pos_settings[0] : data.pos_settings;

            setOriginalData(data);
            setFormData({
                name: data.name,
                status: data.status,
                subscription_plan: data.subscription_plan || 'trial',
                trial_end_date: data.trial_end_date ? data.trial_end_date.split('T')[0] : '',
                subscription_end_date: data.subscription_end_date ? data.subscription_end_date.split('T')[0] : '',
                ownerName: settings?.full_name || '',
                taxOffice: settings?.tax_office || '',
                taxNumber: settings?.tax_number || '',
                billingType: settings?.billing_type || 'Kurumsal',
                companyType: settings?.company_type || 'Şahıs',
                address: settings?.address || '',
                taxPlateUrl: settings?.tax_plate_url || '',
                business_display_name: settings?.business_display_name || data.name
            });
        } catch (err) {
            console.error('Error fetching business:', err);
            alert('İşletme bilgileri alınamadı.');
            navigate('/businesses');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            // 1. Update Business Table
            const businessUpdates = {
                status: formData.status,
                subscription_plan: formData.subscription_plan,
            };

            if (formData.subscription_plan === 'trial') {
                businessUpdates.trial_end_date = formData.trial_end_date || null;
            } else {
                businessUpdates.subscription_end_date = formData.subscription_end_date || null;
            }

            const { error: bError } = await supabase
                .from('businesses')
                .update(businessUpdates)
                .eq('id', id);

            if (bError) throw bError;

            // 2. Update POS Settings Table
            const settingsUpdates = {
                full_name: formData.ownerName,
                tax_office: formData.taxOffice,
                tax_number: formData.taxNumber,
                billing_type: formData.billingType,
                company_type: formData.companyType,
                address: formData.address,
                business_display_name: formData.business_display_name
            };

            const { error: sError } = await supabase
                .from('pos_settings')
                .update(settingsUpdates)
                .eq('business_id', id);

            if (sError) throw sError;

            alert('İşletme bilgileri başarıyla güncellendi.');
            navigate('/businesses');
        } catch (err) {
            console.error('Error updating business:', err);
            alert('Güncelleme hatası: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>;

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <button
                onClick={() => navigate('/businesses')}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 transition"
            >
                <ArrowLeft size={20} />
                <span>Listeye Dön</span>
            </button>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Building className="text-blue-600" size={24} />
                                İşletme Düzenle
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">{originalData?.name}</p>
                        </div>
                        <div className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">
                            ID: {id.substring(0, 18)}...
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Section 1: Subscription & Status */}
                        <div className="space-y-4">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <ShieldCheck size={16} /> Durum ve Abonelik
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Durum</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                                    >
                                        <option value="active">Aktif</option>
                                        <option value="suspended">Askıda (Pasif)</option>
                                        <option value="trial">Deneme</option>
                                    </select>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-semibold text-gray-700">İşletme Adı (POS Ekranda Görünecek İsim)</label>
                                    <input
                                        type="text"
                                        name="business_display_name"
                                        value={formData.business_display_name}
                                        onChange={handleChange}
                                        placeholder="POS ekranında görünecek ismi giriniz"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-blue-50"
                                    />
                                    <p className="text-xs text-blue-600 mt-1">Eğer boş bırakılırsa normal işletme adı kullanılır.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Plan</label>
                                    <select
                                        name="subscription_plan"
                                        value={formData.subscription_plan}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                                    >
                                        <option value="trial">Deneme (Trial)</option>
                                        <option value="monthly">Aylık (Pro)</option>
                                        <option value="yearly">Yıllık (Pro)</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">
                                        {formData.subscription_plan === 'trial' ? 'Bitiş (Deneme)' : 'Bitiş (Abonelik)'}
                                    </label>
                                    <input
                                        type="date"
                                        name={formData.subscription_plan === 'trial' ? 'trial_end_date' : 'subscription_end_date'}
                                        value={formData.subscription_plan === 'trial' ? formData.trial_end_date : formData.subscription_end_date}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                                    />
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Section 2: Authorized Person & Billing */}
                        <div className="space-y-4">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <User size={16} /> Yetkili ve Fatura Bilgileri
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Yetkili Ad Soyad</label>
                                    <input
                                        type="text"
                                        name="ownerName"
                                        value={formData.ownerName}
                                        onChange={handleChange}
                                        placeholder="Yetkili Kişi"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Fatura Tipi</label>
                                    <select
                                        name="billingType"
                                        value={formData.billingType}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                                    >
                                        <option value="Kurumsal">Kurumsal</option>
                                        <option value="Bireysel">Bireysel</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Şirket Tipi</label>
                                    <select
                                        name="companyType"
                                        value={formData.companyType}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                                    >
                                        <option value="Şahıs">Şahıs</option>
                                        <option value="Limited">Limited</option>
                                        <option value="Anonim">Anonim</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Vergi Dairesi</label>
                                        <input
                                            type="text"
                                            name="taxOffice"
                                            value={formData.taxOffice}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Vergi No</label>
                                        <input
                                            type="text"
                                            name="taxNumber"
                                            value={formData.taxNumber}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <MapPin size={16} /> Adres
                                    </label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Section 3: Tax Plate View */}
                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h2 className="text-sm font-bold text-gray-600 flex items-center gap-2">
                                <FileText size={18} /> Vergi Levhası
                            </h2>
                            {formData.taxPlateUrl ? (
                                <a
                                    href={formData.taxPlateUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-semibold hover:bg-blue-100 transition border border-blue-200"
                                >
                                    Mevcut Vergi Levhasını Görüntülemek İçin Tıklayın
                                </a>
                            ) : (
                                <p className="text-sm text-gray-400 italic">Henüz bir vergi levhası yüklenmemiş.</p>
                            )}
                        </div>
                    </div>

                    <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/businesses')}
                            className="px-6 py-2 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save size={18} />
                            {saving ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AdminEditBusiness;
