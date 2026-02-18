import React, { useState, useEffect } from 'react';
import { Check, ChevronDown, Upload } from 'lucide-react';
import { supabase } from '../services/supabase';
import { geographicData } from '../utils/geographicData';
const turkeyData = geographicData["Türkiye"];
import { useAuth } from '../context/AuthContext';

const Settings = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [logoUploading, setLogoUploading] = useState(false);
    const [kioskUploading, setKioskUploading] = useState(false);
    const [settingsId, setSettingsId] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedKioskFile, setSelectedKioskFile] = useState(null);

    const [formData, setFormData] = useState({
        billing_type: 'Kurumsal',
        company_type: 'Şahıs Şirketi',
        business_display_name: '',
        full_name: '',
        tax_number: '',
        tax_office: '',
        address: '',
        country: 'Türkiye',
        city: 'İstanbul',
        district: '',
        zip_code: '',
        opening_time: '09:00',
        closing_time: '00:00',
        language: 'tr',
        currency: 'TRY',
        logo_url: '',
        tax_plate_url: '',
        kiosk_bg_url: '',
        service_charge_type: 'Sabit Tutar',
        service_charge_amount: 0,
        service_charge_auto: false,
        footer_message_1: '',
        footer_message_2: '',
        footer_message_3: '',
        footer_message_4: '',
        system_flags: {
            print_logo_on_receipt: true,
            print_cancel_refund: true,
            close_table_on_payment: true,
            order_redirect: 'Giriş Ekranı',
            enable_quick_sale: false,
            allow_multiple_receipts: true,
            print_on_quick_sale: false,
            post_refund_redirect: 'Masalar',
            check_pos_device: false,
            pas_integration_type: 'İngilizce',
            table_usage_active: true,
            close_receipt_on_payment: true,
            print_on_table_close: false,
            print_cover_on_quick_sale: false,
            define_order_id: false,
            close_payment_verify: false,
            show_notes_on_print: true,
            note_required_on_treat: true,
            note_required_on_waste: false,
            note_required_on_cancel: true,
            note_required_on_discount: false,
            mobile_tip_options: [5, 10, 15],
            current_account_active: false,
            allowed_discount_rates: [],
            no_extra_on_staff: false,
            own_service_required: true,
            only_defined_discounts: false,
            stock_reduction_on_sale: true,
            phone_order_active: true,
            courier_assign_active: false,
            recipe_integration_active: false,
            delivery_confirm_msg: false,
            ask_customer_name_on_open: false,
            show_receipt_on_back_screen: true,
            stay_on_product_detail: false,
            feedback_active: false,
            enable_waiter_call: false
        }
    });

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('pos_settings')
                .select('*')
                .eq('business_id', user.business_id)
                .maybeSingle();

            if (data) {
                setSettingsId(data.id);
                setFormData(prev => ({
                    ...prev,
                    ...data,
                    system_flags: { ...prev.system_flags, ...data.system_flags }
                }));
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchSettings();
    }, [user]);

    const handleSave = async () => {
        try {
            setSaving(true);

            // Clean payload
            const payload = {
                ...formData,
                business_id: user.business_id,
                updated_at: new Date().toISOString(),
                // Ensure numeric conversion for database
                service_charge_amount: typeof formData.service_charge_amount === 'string'
                    ? parseFloat(formData.service_charge_amount.replace(',', '.')) || 0
                    : formData.service_charge_amount || 0
            };

            let error;
            if (settingsId) {
                const { error: err } = await supabase
                    .from('pos_settings')
                    .update(payload)
                    .eq('id', settingsId);
                error = err;
            } else {
                // Try to use match based on business_id to avoid duplication
                const { data: existing } = await supabase
                    .from('pos_settings')
                    .select('id')
                    .eq('business_id', user.business_id)
                    .maybeSingle();

                if (existing) {
                    setSettingsId(existing.id);
                    const { error: err } = await supabase
                        .from('pos_settings')
                        .update(payload)
                        .eq('id', existing.id);
                    error = err;
                } else {
                    const { data: inserted, error: err } = await supabase
                        .from('pos_settings')
                        .insert([payload])
                        .select()
                        .single();
                    if (inserted) setSettingsId(inserted.id);
                    error = err;
                }
            }

            if (error) throw error;

            // HARFİ°YEN: If global waiter call is disabled, disable it for all individual menus too
            if (formData.system_flags.enable_waiter_call === false) {
                await supabase
                    .from('qr_menus')
                    .update({ allow_waiter_call: false })
                    .eq('business_id', user.business_id);
            }

            alert('Ayarlar başarıyla kaydedildi.');
            fetchSettings();
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Ayarlar kaydedilirken bir hata oluştu: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleFlag = (key) => {
        setFormData(prev => ({
            ...prev,
            system_flags: {
                ...prev.system_flags,
                [key]: !prev.system_flags[key]
            }
        }));
    };

    const updateFlag = (key, value) => {
        setFormData(prev => ({
            ...prev,
            system_flags: {
                ...prev.system_flags,
                [key]: value
            }
        }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleLogoUpload = async () => {
        if (!selectedFile) {
            alert('Lütfen önce bir dosya seçin.');
            return;
        }

        try {
            setLogoUploading(true);

            // 1. Create unique filename
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${user.business_id}_logo_${Date.now()}.${fileExt}`;
            const filePath = `logos/${fileName}`;

            // 2. Upload to Supabase Storage (Bucket: business-assets)
            const { data, error: uploadError } = await supabase.storage
                .from('business-assets')
                .upload(filePath, selectedFile);

            if (uploadError) throw uploadError;

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('business-assets')
                .getPublicUrl(filePath);

            // 4. Update state and database
            setFormData(prev => ({ ...prev, logo_url: publicUrl }));

            if (settingsId) {
                await supabase
                    .from('pos_settings')
                    .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
                    .eq('id', settingsId);
            } else {
                // If no settings entry yet, we rely on handleSave to persist the logo_url from state
                console.log('Logo state updated, click Save to persist to database.');
            }

            alert('Logo başarıyla yüklendi.');
            setSelectedFile(null);
        } catch (error) {
            console.error('Error uploading logo:', error);
            alert('Logo yüklenirken hata oluştu: ' + error.message);
        } finally {
            setLogoUploading(false);
        }
    };

    const handleKioskBgUpload = async () => {
        if (!selectedKioskFile) {
            alert('Lütfen önce bir dosya seçin.');
            return;
        }

        try {
            setKioskUploading(true);

            // 1. Create unique filename
            const fileExt = selectedKioskFile.name.split('.').pop();
            const fileName = `${user.business_id}_kiosk_bg_${Date.now()}.${fileExt}`;
            const filePath = `kiosk_bg/${fileName}`;

            // 2. Upload to Supabase Storage (Bucket: business-assets)
            const { data, error: uploadError } = await supabase.storage
                .from('business-assets')
                .upload(filePath, selectedKioskFile);

            if (uploadError) throw uploadError;

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('business-assets')
                .getPublicUrl(filePath);

            // 4. Update state and database
            setFormData(prev => ({ ...prev, kiosk_bg_url: publicUrl }));

            if (settingsId) {
                await supabase
                    .from('pos_settings')
                    .update({ kiosk_bg_url: publicUrl, updated_at: new Date().toISOString() })
                    .eq('id', settingsId);
            } else {
                console.log('Kiosk background state updated, click Save to persist.');
            }

            alert('Kiosk arkaplanı başarıyla yüklendi.');
            setSelectedKioskFile(null);
        } catch (error) {
            console.error('Error uploading kiosk background:', error);
            alert('Kiosk arkaplanı yüklenirken hata oluştu: ' + error.message);
        } finally {
            setKioskUploading(false);
        }
    };

    const TableRow = ({ label, children }) => (
        <div className="grid grid-cols-[1fr_auto] items-center py-3.5 px-5 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
            <span className="text-[13px] font-medium text-gray-700">{label}</span>
            <div className="flex items-center gap-4 justify-end">
                {children}
            </div>
        </div>
    );

    const SettingsToggle = ({ active, onClick }) => (
        <button
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            className="w-12 h-6.5 rounded-full relative transition-all duration-200 bg-[#EEF2F6] border border-gray-100"
        >
            <div
                className={`absolute top-0.5 w-5.5 h-5.5 rounded-full transition-all duration-200 flex items-center justify-center ${active
                    ? 'translate-x-6 bg-[#3B82F6] text-white shadow-[0_2px_5px_rgba(59,130,246,0.3)]'
                    : 'translate-x-0.5 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)]'
                    }`}
            >
                {active && <Check size={11} strokeWidth={4} />}
            </div>
        </button>
    );

    if (loading) return <div className="p-12 text-center text-gray-500 font-medium bg-[#F8FAFC] min-h-screen">Ayarlar yükleniyor...</div>;

    return (
        <div className="p-4 bg-[#F8FAFC] min-h-screen font-sans">
            <div className="max-w-[98%] mx-auto space-y-8 pb-32">

                {/* Logo Section - Moved back to top */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-12 flex flex-col items-center">
                    <div className="relative mb-8 text-center w-full max-w-md px-10">
                        <div className="h-32 flex items-center justify-center mb-6">
                            {formData.logo_url ? (
                                <img src={formData.logo_url} alt="Logo" className="max-h-full object-contain" />
                            ) : (
                                <div className="text-gray-100">
                                    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M17.5 19C18.4283 19 19.3185 18.6312 19.9749 17.9749C20.6312 17.3185 21 16.4283 21 15.5C21 14.73 20.75 14.03 20.31 13.46C20.15 13.25 20.06 12.99 20.06 12.72C20.06 10.45 18.22 8.61 15.95 8.61C15.7 8.61 15.46 8.57 15.22 8.49L15.02 8.42C14.71 8.32 14.41 8.1 14.22 7.82C13.28 6.44 11.69 5.56 9.89 5.56C7 5.56 4.67 7.79 4.47 10.64C4.45 10.96 4.32 11.26 4.09 11.48C3.13 12.44 2.5 13.75 2.5 15.21C2.5 17.81 4.61 19.92 7.21 19.92H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M12 12V19M12 12L9 15M12 12L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <div className="w-full border-t border-gray-200 border-dashed"></div>
                    </div>

                    <div className="flex flex-col items-center gap-6">
                        <div className="flex items-center relative">
                            <div className="border border-gray-300 rounded-l px-3 py-1 bg-gray-50 text-[11px] font-medium text-gray-700">Dosya Seç</div>
                            <div className="border border-gray-300 border-l-0 rounded-r px-4 py-1 text-[11px] text-gray-400 min-w-[140px] bg-white">
                                {selectedFile ? selectedFile.name : 'Dosya seçilmedi'}
                            </div>
                            <input type="file" className="hidden" id="logo-upload-input" onChange={handleFileChange} />
                            <label htmlFor="logo-upload-input" className="absolute inset-0 cursor-pointer"></label>
                        </div>

                        <button
                            onClick={handleLogoUpload}
                            disabled={logoUploading || !selectedFile}
                            className={`bg-[#3B82F6] text-white px-10 py-2.5 rounded flex items-center gap-2 font-bold text-sm transition-all shadow-md active:scale-95 ${(logoUploading || !selectedFile) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
                                }`}
                        >
                            {logoUploading ? 'Yükleniyor...' : 'Yükle!'} <Upload size={18} />
                        </button>
                    </div>
                </div>

                {/* 1. İşletme Bilgileri Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">İşletme Adı (POS Ekranda Görünecek İsim)</label>
                                <input
                                    type="text"
                                    placeholder="POS ekranında görünecek işletme adını giriniz"
                                    className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all font-bold ${!user?.is_super_admin ? 'bg-gray-100 cursor-not-allowed text-gray-400' : 'bg-[#F8FAFC] text-gray-700 focus:ring-2 focus:ring-blue-100'}`}
                                    value={formData.business_display_name || ''}
                                    onChange={e => setFormData({ ...formData, business_display_name: e.target.value })}
                                    disabled={!user?.is_super_admin}
                                    title={!user?.is_super_admin ? "İşletme adı sadece sistem yöneticisi tarafından değiştirilebilir." : ""}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">Fatura Tipi</label>
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 bg-[#F8FAFC] text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                        value={formData.billing_type}
                                        onChange={e => setFormData({ ...formData, billing_type: e.target.value })}
                                    >
                                        <option>Kurumsal</option>
                                        <option>Bireysel</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" size={16} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">Şirket Tipi</label>
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 bg-[#F8FAFC] text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                        value={formData.company_type}
                                        onChange={e => setFormData({ ...formData, company_type: e.target.value })}
                                    >
                                        <option>Şahıs Şirketi</option>
                                        <option>Limited Şirketi</option>
                                        <option>Anonim Şirket</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" size={16} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">Ad Soyad</label>
                                <input
                                    type="text"
                                    placeholder="Ad Soyad giriniz"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-[#F8FAFC] text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                    value={formData.full_name || ''}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">Kimlik Numarası</label>
                                <input
                                    type="text"
                                    placeholder="Kimlik numaranızı giriniz"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-[#F8FAFC] text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                    value={formData.tax_number || ''}
                                    onChange={e => setFormData({ ...formData, tax_number: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">Vergi Dairesi</label>
                                <input
                                    type="text"
                                    placeholder="Vergi dairesi giriniz"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-[#F8FAFC] text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                    value={formData.tax_office || ''}
                                    onChange={e => setFormData({ ...formData, tax_office: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700">Adres</label>
                            <textarea
                                rows={3}
                                placeholder="Adresinize giriniz"
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-[#F8FAFC] text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                                value={formData.address || ''}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">Ülke</label>
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 bg-[#F8FAFC] text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                        value={formData.country || 'Türkiye'}
                                        onChange={e => {
                                            const newCountry = e.target.value;
                                            const firstCity = Object.keys(geographicData[newCountry])[0];
                                            const firstDistrict = geographicData[newCountry][firstCity][0];
                                            setFormData({
                                                ...formData,
                                                country: newCountry,
                                                city: firstCity,
                                                district: firstDistrict
                                            });
                                        }}
                                    >
                                        {Object.keys(geographicData).map(country => (
                                            <option key={country} value={country}>{country}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" size={16} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">Şehir</label>
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 bg-[#F8FAFC] text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                        value={formData.city}
                                        onChange={e => {
                                            const newCity = e.target.value;
                                            const country = formData.country || 'Türkiye';
                                            const firstDistrict = geographicData[country][newCity][0];
                                            setFormData({
                                                ...formData,
                                                city: newCity,
                                                district: firstDistrict
                                            });
                                        }}
                                    >
                                        {Object.keys(geographicData[formData.country || 'Türkiye'] || {}).map(city => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" size={16} />
                                </div>
                                <span className="text-[11px] text-gray-400 font-medium">İşletmenizin bulunduğu ili seçin</span>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">İlçe</label>
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 bg-[#F8FAFC] text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                        value={formData.district}
                                        onChange={e => setFormData({ ...formData, district: e.target.value })}
                                    >
                                        {(geographicData[formData.country || 'Türkiye']?.[formData.city] || []).map(district => (
                                            <option key={district} value={district}>{district}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" size={16} />
                                </div>
                                <span className="text-[11px] text-gray-400 font-medium">İşletmenizin bulunduğu ilçe/semti girin</span>
                            </div>
                        </div>

                        <div className="border border-gray-300 bg-white rounded-lg p-4 text-center">
                            {formData.tax_plate_url ? (
                                <a
                                    href={formData.tax_plate_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#3B82F6] text-sm font-medium hover:underline block w-full h-full"
                                >
                                    Mevcut Vergi Levhanızı Görüntülemek İçin Tıklayın
                                </a>
                            ) : (
                                <span className="text-gray-400 text-sm font-medium">
                                    Yüklü Vergi Levhası Bulunmamaktadır
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">Açılış</label>
                                <input type="text" className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-[#F8FAFC] text-sm outline-none focus:ring-2 focus:ring-blue-100 font-medium text-gray-700" value={formData.opening_time} onChange={e => setFormData({ ...formData, opening_time: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">Kapanış</label>
                                <input type="text" className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-[#F8FAFC] text-sm outline-none focus:ring-2 focus:ring-blue-100 font-medium text-gray-700" value={formData.closing_time} onChange={e => setFormData({ ...formData, closing_time: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <button onClick={handleSave} disabled={saving} className="bg-[#3B82F6] text-white px-10 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-600 transition-all shadow-md active:scale-95">
                                {saving ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Settings Table - Exactly like the image */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="grid grid-cols-[1fr_auto] bg-gray-50/50 border-b border-gray-100 items-center">
                        <div className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Ayar</div>
                        <div className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Durum</div>
                    </div>

                    <TableRow label="Varsayılan Dil">
                        <div className="relative">
                            <select className="appearance-none border border-gray-200 rounded-lg px-6 py-1.5 pr-10 text-xs font-bold text-gray-600 bg-white focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer">
                                <option>Türkiye</option>
                                <option>English</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1.5 text-gray-400 pointer-events-none" size={14} />
                        </div>
                    </TableRow>



                    <div className="divide-y divide-gray-50">
                        <TableRow label="Fişte Logo Yazdır"><SettingsToggle active={formData.system_flags.print_logo_on_receipt} onClick={() => toggleFlag('print_logo_on_receipt')} /></TableRow>
                        <TableRow label="İptal / İade Yazdır"><SettingsToggle active={formData.system_flags.print_cancel_refund} onClick={() => toggleFlag('print_cancel_refund')} /></TableRow>
                        <TableRow label="ödeme tamamlanınca masayı kapat"><SettingsToggle active={formData.system_flags.close_table_on_payment} onClick={() => toggleFlag('close_table_on_payment')} /></TableRow>

                        <TableRow label="Sipariş Sonrası Yönlendirme">
                            <div className="flex gap-6">
                                {['Giriş Ekranı', 'Masa Ekranı', 'Adisyon İçerisinde Kal'].map(opt => (
                                    <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="radio"
                                            className="w-3.5 h-3.5 text-[#3B82F6] border-gray-300 focus:ring-blue-100"
                                            checked={formData.system_flags.order_redirect === opt}
                                            onChange={() => updateFlag('order_redirect', opt)}
                                        />
                                        <span className="text-[11px] font-bold text-gray-400 group-hover:text-gray-600 transition-colors uppercase tracking-tight">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </TableRow>
                        <TableRow label="Mutfak Ekranını Aktif Et"><SettingsToggle active={formData.system_flags.kitchen_display_active} onClick={() => toggleFlag('kitchen_display_active')} /></TableRow>

                        <TableRow label="Hızlı Satışı Aç"><SettingsToggle active={formData.system_flags.enable_quick_sale} onClick={() => toggleFlag('enable_quick_sale')} /></TableRow>
                        <TableRow label="Geri Bildirim Aktif"><SettingsToggle active={formData.system_flags.feedback_active} onClick={() => toggleFlag('feedback_active')} /></TableRow>
                        <TableRow label="Garson Çağırma Sistemi"><SettingsToggle active={formData.system_flags.enable_waiter_call} onClick={() => toggleFlag('enable_waiter_call')} /></TableRow>
                        <TableRow label="Garson Çağrı Sesi"><SettingsToggle active={formData.system_flags.enable_waiter_call_sound !== false} onClick={() => toggleFlag('enable_waiter_call_sound')} /></TableRow>
                        <TableRow label="Çoklu Adisyona İzin Ver"><SettingsToggle active={formData.system_flags.allow_multiple_receipts} onClick={() => toggleFlag('allow_multiple_receipts')} /></TableRow>
                        <TableRow label="Hızlı Satışta Ürün Yazdır"><SettingsToggle active={formData.system_flags.print_on_quick_sale} onClick={() => toggleFlag('print_on_quick_sale')} /></TableRow>

                        <TableRow label="Paroladan sonra yönlenecek sayfa">
                            <div className="flex gap-6">
                                {['Masalar', 'Hızlı Satış'].map(opt => (
                                    <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="radio"
                                            className="w-3.5 h-3.5 text-[#3B82F6] border-gray-300 focus:ring-blue-100"
                                            checked={formData.system_flags.post_refund_redirect === opt}
                                            onChange={() => updateFlag('post_refund_redirect', opt)}
                                        />
                                        <span className="text-[11px] font-bold text-gray-400 group-hover:text-gray-600 transition-colors uppercase">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </TableRow>

                        <TableRow label="POS cihazı kontrol et"><SettingsToggle active={formData.system_flags.check_pos_device} onClick={() => toggleFlag('check_pos_device')} /></TableRow>

                        <TableRow label="Pos Entegrasyon Tipi">
                            <div className="relative">
                                <select
                                    className="appearance-none border border-gray-200 rounded-lg px-6 py-1.5 pr-10 text-[11px] font-bold text-gray-600 bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                                    value={formData.system_flags.pas_integration_type}
                                    onChange={e => updateFlag('pas_integration_type', e.target.value)}
                                >
                                    <option>İngilizce</option>
                                    <option>Türkçe</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1.5 text-gray-400 pointer-events-none" size={14} />
                            </div>
                        </TableRow>

                        <TableRow label="Adisyon Yazdırırken Notları Göster"><SettingsToggle active={formData.system_flags.show_notes_on_print} onClick={() => toggleFlag('show_notes_on_print')} /></TableRow>
                        <TableRow label="Mola Kullanımı Aktif mi?"><SettingsToggle active={formData.system_flags.table_usage_active} onClick={() => toggleFlag('table_usage_active')} /></TableRow>
                        <TableRow label="Ödeme Tamamlanınca Adisyonu Kapat"><SettingsToggle active={formData.system_flags.close_receipt_on_payment} onClick={() => toggleFlag('close_receipt_on_payment')} /></TableRow>
                        <TableRow label="Masalı Satışta Masa Kapanışında Yazdır"><SettingsToggle active={formData.system_flags.print_on_table_close} onClick={() => toggleFlag('print_on_table_close')} /></TableRow>
                        <TableRow label="Hızlı Satışta Kuver Kapandığında Yazdır"><SettingsToggle active={formData.system_flags.print_cover_on_quick_sale} onClick={() => toggleFlag('print_cover_on_quick_sale')} /></TableRow>
                        <TableRow label="Sipariş Zil Numarası Tanımla"><SettingsToggle active={formData.system_flags.define_order_id} onClick={() => toggleFlag('define_order_id')} /></TableRow>
                        <TableRow label="Pos Ekranı Ödeme Doğrulamasını Kapat"><SettingsToggle active={formData.system_flags.close_payment_verify} onClick={() => toggleFlag('close_payment_verify')} /></TableRow>
                        <TableRow label="İkramda Not Zorunlu"><SettingsToggle active={formData.system_flags.note_required_on_treat} onClick={() => toggleFlag('note_required_on_treat')} /></TableRow>
                        <TableRow label="Atıkta Not Zorunlu"><SettingsToggle active={formData.system_flags.note_required_on_waste} onClick={() => toggleFlag('note_required_on_waste')} /></TableRow>
                        <TableRow label="İptalde Not Zorunlu"><SettingsToggle active={formData.system_flags.note_required_on_cancel} onClick={() => toggleFlag('note_required_on_cancel')} /></TableRow>
                        <TableRow label="İndirim yaparken Not Zorunlu"><SettingsToggle active={formData.system_flags.note_required_on_discount} onClick={() => toggleFlag('note_required_on_discount')} /></TableRow>

                        <TableRow label="Mobil Uygulama Bahşiş Seçenekleri">
                            <div className="flex gap-2">
                                {[5, 10, 15].map(v => (
                                    <span key={v} className="bg-[#F8FAFC] border border-gray-100 text-gray-400 px-5 py-2 rounded-lg text-[10px] font-bold">{v} ×</span>
                                ))}
                                <button className="text-[10px] font-bold text-[#3B82F6] bg-blue-50/50 px-5 py-2 rounded-lg hover:bg-blue-100 transition-all">Seçiniz</button>
                            </div>
                        </TableRow>

                        <TableRow label="Cari Hesap Aktif"><SettingsToggle active={formData.system_flags.current_account_active} onClick={() => toggleFlag('current_account_active')} /></TableRow>
                        <TableRow label="İzin Verilen İndirim Oranları">
                            <button className="text-[10px] font-bold text-gray-400 border border-gray-200 rounded-lg px-8 py-2 bg-[#F8FAFC] hover:bg-gray-100 transition-all">Seçiniz</button>
                        </TableRow>

                        <TableRow label="Personel Ücretsiz Ekstra Ürün Alamaz"><SettingsToggle active={formData.system_flags.no_extra_on_staff} onClick={() => toggleFlag('no_extra_on_staff')} /></TableRow>
                        <TableRow label="Siento Servisi Gerekli"><SettingsToggle active={formData.system_flags.own_service_required} onClick={() => toggleFlag('own_service_required')} /></TableRow>
                        <TableRow label="Sadece Tanımlı İndirimler Uygulanabilir"><SettingsToggle active={formData.system_flags.only_defined_discounts} onClick={() => toggleFlag('only_defined_discounts')} /></TableRow>
                        <TableRow label="Satışta Stok Düşüşü Aktif"><SettingsToggle active={formData.system_flags.stock_reduction_on_sale} onClick={() => toggleFlag('stock_reduction_on_sale')} /></TableRow>
                        <TableRow label="Telefondan Sipariş Alma Aktif"><SettingsToggle active={formData.system_flags.phone_order_active} onClick={() => toggleFlag('phone_order_active')} /></TableRow>
                        <TableRow label="Siparişe Kurye Atama Aktif"><SettingsToggle active={formData.system_flags.courier_assign_active} onClick={() => toggleFlag('courier_assign_active')} /></TableRow>
                        <TableRow label="Tartı Entegrasyonu Aktif"><SettingsToggle active={formData.system_flags.recipe_integration_active} onClick={() => toggleFlag('recipe_integration_active')} /></TableRow>
                        <TableRow label="Paket servis çıktısı onaylanınca gelsin"><SettingsToggle active={formData.system_flags.delivery_confirm_msg} onClick={() => toggleFlag('delivery_confirm_msg')} /></TableRow>
                        <TableRow label="Masa Açılışında Müşteri Adı ve Sayısı Sor"><SettingsToggle active={formData.system_flags.ask_customer_name_on_open} onClick={() => toggleFlag('ask_customer_name_on_open')} /></TableRow>
                        <TableRow label="Arka Ekranda Adisyon Göster"><SettingsToggle active={formData.system_flags.show_receipt_on_back_screen} onClick={() => toggleFlag('show_receipt_on_back_screen')} /></TableRow>
                        <TableRow label="Ürün Eklendikten Sonra Ürün Detayında Kalma Opsiyonu Göster"><SettingsToggle active={formData.system_flags.stay_on_product_detail} onClick={() => toggleFlag('stay_on_product_detail')} /></TableRow>

                    </div>
                    <div className="p-8 flex justify-end bg-gray-50/10">
                        <button onClick={handleSave} className="bg-[#3B82F6] text-white px-16 py-4 rounded-2xl font-bold text-sm shadow-xl shadow-blue-100 hover:translate-y-[-2px] transition-all active:translate-y-0">Sistem Ayarlarını Kaydet</button>
                    </div>
                </div>

                {/* Service Charge Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
                    <div className="grid grid-cols-2 gap-10">
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Servis Ücreti Tipi</label>
                            <div className="relative">
                                <select
                                    className="w-full appearance-none border border-gray-200 rounded-xl px-5 py-3.5 bg-[#F8FAFC] text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                    value={formData.service_charge_type}
                                    onChange={e => setFormData({ ...formData, service_charge_type: e.target.value })}
                                >
                                    <option>Sabit Tutar</option>
                                    <option>Yüzde</option>
                                    <option>Müşteri Başı Ücret</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-4 text-gray-400 pointer-events-none" size={16} />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Tutar</label>
                            <input type="text" className="w-full border border-gray-200 rounded-xl px-5 py-3.5 bg-[#F8FAFC] text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all" value={formData.service_charge_amount || '0,0'} onChange={e => setFormData({ ...formData, service_charge_amount: e.target.value })} />
                        </div>
                    </div>
                    <div className="flex items-center justify-between bg-[#F8FAFC] p-6 rounded-2xl border border-gray-100">
                        <span className="text-sm font-bold text-gray-600">Otomatik Uygula</span>
                        <SettingsToggle
                            active={formData.service_charge_auto}
                            onClick={() => setFormData({ ...formData, service_charge_auto: !formData.service_charge_auto })}
                        />
                    </div>
                    <p className="text-[11px] text-gray-400 font-bold italic tracking-wide mt-[-10px]">Müşteri başına fiyat seçilirse otomatik uygulanamaz.</p>
                    <div className="flex justify-start">
                        <button onClick={handleSave} className="bg-[#3B82F6] text-white px-16 py-3.5 rounded-xl font-bold text-sm shadow-xl shadow-blue-100 hover:bg-blue-600 transition-all active:scale-95">Servis Ayarını Kaydet</button>
                    </div>
                </div>

                {/* Kiosk Messages Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-10">
                    <div className="space-y-4">
                        <label className="text-[13px] font-medium text-gray-700 block">Kiosk Üst Kısım Arkaplanı</label>
                        <div className="flex items-center gap-6">
                            <label className="border border-gray-300 rounded px-4 py-1.5 bg-gray-50 text-[13px] font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">
                                Dosya Seç
                                <input type="file" className="hidden" onChange={(e) => setSelectedKioskFile(e.target.files[0])} />
                            </label>
                            <span className="text-[13px] text-gray-400 font-medium">
                                {selectedKioskFile ? selectedKioskFile.name : (formData.kiosk_bg_url ? 'Arkaplan yüklü' : 'Dosya seçilmedi')}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {[1, 2, 3, 4].map(num => (
                            <div key={num} className="space-y-2">
                                <label className="text-[13px] font-medium text-gray-700 block">Kiosk Fiş Mesajı Satır {num}</label>
                                <input
                                    type="text"
                                    placeholder={`${num}. satır mesajını buraya yazınız...`}
                                    className="w-full border border-gray-200 rounded-xl px-5 py-3.5 bg-[#F8FAFC] text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300"
                                    value={formData[`footer_message_${num}`] || ''}
                                    onChange={e => setFormData({ ...formData, [`footer_message_${num}`]: e.target.value })}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-start pt-4">
                        <button
                            onClick={handleSave}
                            disabled={saving || kioskUploading}
                            className="bg-[#3B82F6] text-white px-10 py-2.5 rounded-lg font-bold text-sm shadow-md hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {saving ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                        {selectedKioskFile && (
                            <button
                                onClick={handleKioskBgUpload}
                                className="ml-4 bg-green-500 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-md hover:bg-green-600 transition-all active:scale-95"
                            >
                                Görseli Yükle
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Settings;
