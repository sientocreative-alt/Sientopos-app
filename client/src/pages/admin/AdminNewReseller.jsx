import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, User, Mail, Phone, Lock, Building2, MapPin, Globe, Users, Briefcase, Calendar, FileText, Key, Hash } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { toast } from 'react-hot-toast';
import { geographicData } from '../../utils/geographicData';

// Section Component
const Section = ({ title, children, number }) => (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                {number}
            </span>
            <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {children}
        </div>
    </div>
);

// Input Component
const Input = ({ label, name, value, onChange, type = "text", required = false, placeholder = "", icon: Icon, options = null }) => (
    <div className="space-y-2 text-left">
        <label className="text-sm font-semibold text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />}
            {type === "select" ? (
                <select
                    required={required}
                    className={`w-full ${Icon ? 'pl-10' : 'px-4'} pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 appearance-none`}
                    value={value}
                    onChange={(e) => onChange(name, e.target.value)}
                >
                    <option value="">Seçiniz</option>
                    {options && options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            ) : type === "textarea" ? (
                <textarea
                    required={required}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-400 min-h-[100px]"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(name, e.target.value)}
                />
            ) : (
                <input
                    type={type}
                    required={required}
                    className={`w-full ${Icon ? 'pl-10' : 'px-4'} pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-400`}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(name, e.target.value)}
                />
            )}
        </div>
    </div>
);

// PieChart icon
const PieChart = ({ size, className }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
        <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
);

const AdminNewReseller = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [form, setForm] = useState({
        company_name: '',
        establishment_year: '',
        tax_office: '',
        tax_number: '',
        main_contact_name: '',
        main_contact_role: '',
        main_contact_phone: '',
        secondary_contact_name: '',
        secondary_contact_role: '',
        secondary_contact_phone: '',
        country: 'Türkiye',
        city: '',
        district: '',
        address: '',
        phone: '',
        email: '',
        reseller_code: '',
        username: '',
        password: '',
        office_size: '',
        employee_count: '',
        branch_info: '',
        website: '',
        other_reseller: '',
        privacy_acknowledgment: false,
        status: 'active',
        commission_rate: 15
    });
    const [loading, setLoading] = useState(false);
    const [availableCities, setAvailableCities] = useState([]);
    const [availableDistricts, setAvailableDistricts] = useState([]);

    const countries = Object.keys(geographicData);

    useEffect(() => {
        if (isEdit) {
            fetchReseller();
        }
    }, [id]);

    // Handle Country Change
    useEffect(() => {
        const countryData = geographicData[form.country] || {};
        setAvailableCities(Object.keys(countryData));
        // Reset city and district when country changes, unless it's initial load for edit
        if (!loading && !isEdit) {
            setForm(prev => ({ ...prev, city: '', district: '' }));
        }
    }, [form.country]);

    // Handle City Change
    useEffect(() => {
        const countryData = geographicData[form.country] || {};
        const districtList = countryData[form.city] || [];
        setAvailableDistricts(districtList);
        // Reset district when city changes, unless it's initial load for edit
        if (!loading && !isEdit) {
            setForm(prev => ({ ...prev, district: '' }));
        }
    }, [form.city, form.country]);

    const fetchReseller = async () => {
        try {
            const { data, error } = await supabase
                .from('resellers')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) setForm({ ...data, password: '' });
        } catch (error) {
            console.error('Error fetching reseller:', error);
            toast.error('Bayi bilgileri yüklenemedi');
        }
    };

    const handleInputChange = (name, value) => {
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        try {
            if (isEdit) {
                const { data, error } = await supabase.rpc('update_reseller_complete', {
                    p_id: id,
                    p_company_name: form.company_name,
                    p_establishment_year: form.establishment_year ? parseInt(form.establishment_year) : null,
                    p_tax_office: form.tax_office,
                    p_tax_number: form.tax_number,
                    p_main_contact_name: form.main_contact_name,
                    p_main_contact_role: form.main_contact_role,
                    p_main_contact_phone: form.main_contact_phone,
                    p_secondary_contact_name: form.secondary_contact_name,
                    p_secondary_contact_role: form.secondary_contact_role,
                    p_secondary_contact_phone: form.secondary_contact_phone,
                    p_country: form.country,
                    p_city: form.city,
                    p_district: form.district,
                    p_address: form.address,
                    p_phone: form.phone,
                    p_email: form.email,
                    p_office_size: form.office_size ? parseInt(form.office_size) : null,
                    p_employee_count: form.employee_count ? parseInt(form.employee_count) : null,
                    p_branch_info: form.branch_info,
                    p_website: form.website,
                    p_other_reseller: form.other_reseller,
                    p_reseller_code: form.reseller_code,
                    p_username: form.username,
                    p_status: form.status,
                    p_commission_rate: form.commission_rate,
                    p_password: form.password || null
                });

                if (error) throw error;
                if (data && data.success === false) throw new Error(data.error);

                toast.success('Bayi güncellendi');
                navigate('/resellers');
            } else {
                const { data, error: rpcError } = await supabase.rpc('create_reseller_complete', {
                    p_company_name: form.company_name,
                    p_email: form.email,
                    p_password: form.password,
                    p_phone: form.phone,
                    p_establishment_year: form.establishment_year ? parseInt(form.establishment_year) : null,
                    p_tax_office: form.tax_office,
                    p_tax_number: form.tax_number,
                    p_main_contact_name: form.main_contact_name,
                    p_main_contact_role: form.main_contact_role,
                    p_main_contact_phone: form.main_contact_phone,
                    p_secondary_contact_name: form.secondary_contact_name,
                    p_secondary_contact_role: form.secondary_contact_role,
                    p_secondary_contact_phone: form.secondary_contact_phone,
                    p_country: form.country,
                    p_city: form.city,
                    p_district: form.district,
                    p_address: form.address,
                    p_office_size: form.office_size ? parseInt(form.office_size) : null,
                    p_employee_count: form.employee_count ? parseInt(form.employee_count) : null,
                    p_branch_info: form.branch_info,
                    p_website: form.website,
                    p_other_reseller: form.other_reseller,
                    p_reseller_code: form.reseller_code,
                    p_username: form.username,
                    p_privacy_acknowledgment: true, // Auto-confirm on admin creation
                    p_commission_rate: form.commission_rate
                });

                if (rpcError) throw rpcError;
                if (data && data.success === false) throw new Error(data.error);

                toast.success('Bayi başarıyla oluşturuldu!');
                navigate('/resellers');
            }
        } catch (error) {
            console.error('Error saving reseller:', error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-left">
                    <Link
                        to="/resellers"
                        className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                    >
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">
                            {isEdit ? 'Bayiyi Düzenle' : 'Yeni Bayi Oluştur'}
                        </h1>
                        <p className="text-gray-500 mt-1">Sisteme yeni bir çözüm ortağı ekleyin.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <Section title="Kurumsal Bilgiler" number="1">
                    <Input label="Bayi Adı / Ünvanı" name="company_name" value={form.company_name} onChange={handleInputChange} required placeholder="Bayinin resmi adı" icon={Building2} />
                    <Input label="Kuruluş Tarihi (Yıl)" name="establishment_year" value={form.establishment_year} onChange={handleInputChange} type="number" required placeholder="Örn. 2015" icon={Calendar} />
                    <Input label="Vergi Dairesi" name="tax_office" value={form.tax_office} onChange={handleInputChange} required placeholder="Vergi dairesini seçiniz" icon={FileText} />
                    <Input label="Vergi No / TC No" name="tax_number" value={form.tax_number} onChange={handleInputChange} required placeholder="1234567890" icon={FileText} />
                    <Input label="Firma Yetkilisi / İsim" name="main_contact_name" value={form.main_contact_name} onChange={handleInputChange} required placeholder="Bayiyi temsil eden kişi" icon={User} />
                    <Input label="Görevi" name="main_contact_role" value={form.main_contact_role} onChange={handleInputChange} required placeholder="Müdür, Yönetici, Sorumlu" icon={Briefcase} />
                    <Input label="Telefon / GSM" name="main_contact_phone" value={form.main_contact_phone} onChange={handleInputChange} type="tel" required placeholder="+90 5XX XXX XX XX" icon={Phone} />

                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <div className="md:col-span-3 text-xs font-bold text-gray-400 uppercase">İkinci Yetkili (Opsiyonel)</div>
                        <Input label="İsim" name="secondary_contact_name" value={form.secondary_contact_name} onChange={handleInputChange} placeholder="İsim" icon={User} />
                        <Input label="Görev" name="secondary_contact_role" value={form.secondary_contact_role} onChange={handleInputChange} placeholder="Görev" icon={Briefcase} />
                        <Input label="Telefon" name="secondary_contact_phone" value={form.secondary_contact_phone} onChange={handleInputChange} type="tel" placeholder="GSM" icon={Phone} />
                    </div>
                </Section>

                <Section title="İletişim Bilgileri" number="2">
                    <Input label="Ülke" name="country" value={form.country} onChange={handleInputChange} type="select" options={countries} required icon={Globe} />
                    <Input label="Şehir" name="city" value={form.city} onChange={handleInputChange} type="select" options={availableCities} required icon={MapPin} />
                    <Input label="İlçe" name="district" value={form.district} onChange={handleInputChange} type="select" options={availableDistricts} required icon={MapPin} />
                    <div className="col-span-1 md:col-span-2">
                        <Input label="Firma Adresi" name="address" value={form.address} onChange={handleInputChange} type="textarea" required placeholder="Sokak, cadde, bina..." />
                    </div>
                    <Input label="Telefon" name="phone" value={form.phone} onChange={handleInputChange} type="tel" required placeholder="+90 2XX XXX XX XX" icon={Phone} />
                    <Input label="E-posta" name="email" value={form.email} onChange={handleInputChange} type="email" required placeholder="info@firmanız.com" icon={Mail} />
                </Section>

                <Section title="Hesap / Giriş Bilgileri" number="3">
                    <Input label="Bayi Kodu" name="reseller_code" value={form.reseller_code} onChange={handleInputChange} required placeholder="Örn. BY-1001" icon={Hash} />
                    <Input label="Kullanıcı Adı" name="username" value={form.username} onChange={handleInputChange} required placeholder="Sisteme giriş için" icon={User} />
                    <Input label="Komisyon Oranı (%)" name="commission_rate" value={form.commission_rate} onChange={handleInputChange} type="number" required placeholder="15" icon={PieChart} />
                    <Input label="Geçici Şifre" name="password" value={form.password} onChange={handleInputChange} type="password" required={!isEdit} placeholder={isEdit ? "Boş bırakılırsa değişmez" : "••••••••"} icon={Lock} />
                </Section>

                <Section title="Diğer Bilgiler (Opsiyonel)" number="4">
                    <Input label="Ofis Büyüklüğü (m²)" name="office_size" value={form.office_size} onChange={handleInputChange} type="number" icon={Building2} />
                    <Input label="Personel Sayısı" name="employee_count" value={form.employee_count} onChange={handleInputChange} type="number" icon={Users} />
                    <div className="col-span-1 md:col-span-2">
                        <Input label="Şube Bilgileri" name="branch_info" value={form.branch_info} onChange={handleInputChange} type="textarea" placeholder="Varsa şubeleriniz hakkında bilgi" />
                    </div>
                    <Input label="Web Sitesi" name="website" value={form.website} onChange={handleInputChange} placeholder="https://firmaniz.com" icon={Globe} />
                    <div className="col-span-1 md:col-span-2">
                        <Input label="Diğer Bayilikler" name="other_reseller" value={form.other_reseller} onChange={handleInputChange} type="textarea" placeholder="Daha önce veya şu an yaptığınız bayilikler" />
                    </div>
                </Section>

                <div className="flex justify-end gap-4 text-right">
                    <button
                        type="button"
                        onClick={() => navigate('/resellers')}
                        className="px-8 py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all active:scale-95"
                    >
                        İptal
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 text-white px-10 py-3 rounded-2xl hover:bg-blue-700 font-bold transition-all shadow-xl shadow-blue-500/25 active:scale-95 disabled:opacity-50 disabled:scale-100"
                    >
                        {loading ? 'Kaydediliyor...' : 'Kaydet'}
                        <Save size={20} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminNewReseller;
