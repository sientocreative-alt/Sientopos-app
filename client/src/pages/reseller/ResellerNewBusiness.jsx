import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import {
    ArrowLeft,
    Save,
    Store,
    User,
    Mail,
    Phone,
    FileText,
    MapPin,
    Lock,
    Globe,
    ShieldCheck,
    Briefcase,
    Info,
    Building2,
    Plus
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { geographicData } from '../../utils/geographicData';
import { jsPDF } from 'jspdf';

const InputGroup = ({ label, icon: Icon, children }) => (
    <div className="space-y-1.5">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            {Icon && <Icon size={10} className="text-slate-300" />} {label}
        </label>
        {children}
    </div>
);

const SectionHeader = ({ title, icon: Icon, colorClass }) => (
    <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100">
        <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center`}>
            <Icon size={16} />
        </div>
        <h3 className="text-base font-black text-slate-800 tracking-tight">{title}</h3>
    </div>
);

const ResellerNewBusiness = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        businessName: '',
        ownerName: '',
        email: '',
        phone: '',
        taxOffice: '',
        taxNumber: '',
        password: '',
        billingType: 'Kurumsal',
        companyType: 'Şahıs',
        address: '',
        country: 'Türkiye', // Default country
        city: '',
        district: ''
    });

    const [taxPlateFile, setTaxPlateFile] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Reset city and district if country changes
        if (name === 'country') {
            setFormData(prev => ({ ...prev, city: '', district: '' }));
        }
        // Reset district if city changes
        if (name === 'city') {
            setFormData(prev => ({ ...prev, district: '' }));
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setTaxPlateFile(e.target.files[0]);
        }
    };

    const convertImageToPdf = async (imageFile) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imgData = e.target.result;
                const pdf = new jsPDF();
                const imgProps = pdf.getImageProperties(imgData);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                const pdfBlob = pdf.output('blob');
                resolve(pdfBlob);
            };
            reader.onerror = reject;
            reader.readAsDataURL(imageFile);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let taxPlateUrl = null;
            if (taxPlateFile) {
                let fileToUpload = taxPlateFile;
                let fileExt = taxPlateFile.name.split('.').pop().toLowerCase();

                if (['jpg', 'jpeg', 'png'].includes(fileExt)) {
                    try {
                        const pdfBlob = await convertImageToPdf(taxPlateFile);
                        fileToUpload = pdfBlob;
                        fileExt = 'pdf';
                    } catch (conversionError) {
                        console.error('PDF Conversion failed:', conversionError);
                    }
                }

                const fileName = `reseller_tax_plate_${Date.now()}.${fileExt}`;
                const filePath = `tax_plates/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('business-assets')
                    .upload(filePath, fileToUpload, {
                        contentType: 'application/pdf'
                    });

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('business-assets')
                        .getPublicUrl(filePath);
                    taxPlateUrl = publicUrl;
                }
            }

            const { data, error: rpcError } = await supabase.rpc('create_business_complete', {
                p_email: formData.email,
                p_password: formData.password,
                p_owner_name: formData.ownerName,
                p_business_name: formData.businessName,
                p_phone: formData.phone,
                p_tax_office: formData.taxOffice,
                p_tax_number: formData.taxNumber,
                p_billing_type: formData.billingType,
                p_company_type: formData.companyType,
                p_address: formData.address,
                p_tax_plate_url: taxPlateUrl,
                p_country: formData.country, // Added country
                p_city: formData.city,
                p_district: formData.district,
                p_reseller_id: user.id
            });

            if (rpcError) throw rpcError;
            if (data && data.success === false) throw new Error(data.error);

            await supabase.from('business_logs').insert([{
                business_id: data.business_id,
                actor_id: user.id,
                action: 'CREATED_VIA_RESELLER',
                details: { ...formData, reseller_id: user.id }
            }]);

            toast.success('İşletme başarıyla oluşturuldu!');
            navigate('/isletmeler');

        } catch (error) {
            console.error('Creation Error:', error);
            toast.error('Hata: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const countries = Object.keys(geographicData);
    const cities = Object.keys(geographicData[formData.country] || {});
    const districts = formData.city ? (geographicData[formData.country]?.[formData.city] || []) : [];



    return (
        <div className="max-w-4xl mx-auto pb-10">
            {/* Page Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/isletmeler')}
                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <Plus size={24} className="text-indigo-600" />
                            YENİ İŞLETME KAYDI
                        </h1>
                        <p className="text-slate-400 font-bold mt-1 uppercase text-[10px] tracking-widest opacity-70 italic">Sisteme yeni bir ticari işletme tanımlayın</p>
                    </div>
                </div>
            </div>

            {/* Form Container */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Section 1: Business and Contact Info */}
                    <div className="space-y-6">
                        <SectionHeader title="İşletme ve Yetkili Bilgileri" icon={Store} colorClass="bg-indigo-50 text-indigo-600" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputGroup label="İşletme Ticari Adı" icon={Building2}>
                                <input
                                    required
                                    type="text"
                                    name="businessName"
                                    placeholder="Resmi Ticari Ünvan"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-900 font-bold text-xs focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
                                    value={formData.businessName}
                                    onChange={handleChange}
                                />
                            </InputGroup>
                            <InputGroup label="Yetkili Tam Adı" icon={User}>
                                <input
                                    required
                                    type="text"
                                    name="ownerName"
                                    placeholder="Ad Soyad"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-900 font-bold text-xs focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
                                    value={formData.ownerName}
                                    onChange={handleChange}
                                />
                            </InputGroup>
                            <InputGroup label="Sistem Giriş E-postası" icon={Mail}>
                                <input
                                    required
                                    type="email"
                                    name="email"
                                    placeholder="isletme@sientopos.com"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-indigo-600 font-bold text-xs focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </InputGroup>
                            <InputGroup label="İletişim Numarası" icon={Phone}>
                                <input
                                    required
                                    type="tel"
                                    name="phone"
                                    placeholder="0 (5--) --- -- --"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-900 font-bold text-xs focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </InputGroup>
                        </div>
                    </div>

                    {/* Section 2: Address */}
                    <div className="space-y-6">
                        <SectionHeader title="Lokasyon ve Adres" icon={MapPin} colorClass="bg-emerald-50 text-emerald-600" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InputGroup label="Ülke" icon={Globe}>
                                <select
                                    name="country"
                                    required
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-900 font-bold text-xs focus:outline-none appearance-none cursor-pointer"
                                    onChange={handleChange}
                                    value={formData.country}
                                >
                                    {countries.map(country => <option key={country} value={country}>{country}</option>)}
                                </select>
                            </InputGroup>
                            <InputGroup label="Şehir">
                                <select
                                    name="city"
                                    required
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-900 font-bold text-xs focus:outline-none appearance-none cursor-pointer"
                                    onChange={handleChange}
                                    value={formData.city}
                                >
                                    <option value="">Şehir Seçiniz</option>
                                    {cities.map(city => <option key={city} value={city}>{city}</option>)}
                                </select>
                            </InputGroup>
                            <InputGroup label="İlçe">
                                <select
                                    name="district"
                                    required
                                    disabled={!formData.city}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-900 font-bold text-xs focus:outline-none appearance-none cursor-pointer disabled:opacity-30"
                                    onChange={handleChange}
                                    value={formData.district}
                                >
                                    <option value="">İlçe Seçiniz</option>
                                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </InputGroup>
                        </div>
                        <InputGroup label="Açık Adres">
                            <textarea
                                name="address"
                                rows="2"
                                placeholder="Mahalle, Sokak, No..."
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-900 font-bold text-xs focus:outline-none resize-none"
                                value={formData.address}
                                onChange={handleChange}
                            />
                        </InputGroup>
                    </div>

                    {/* Section 3: Tax and Billing */}
                    <div className="space-y-6">
                        <SectionHeader title="Vergi ve Fatura" icon={FileText} colorClass="bg-orange-50 text-orange-600" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputGroup label="Fatura Türü">
                                <div className="flex gap-2">
                                    {['Kurumsal', 'Bireysel'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, billingType: type })}
                                            className={`flex-1 py-3 rounded-lg font-black text-[10px] transition-all border
                                            ${formData.billingType === type
                                                    ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                                                    : 'bg-slate-50 text-slate-500 border-slate-100'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </InputGroup>
                            <InputGroup label="Şirket Tipi">
                                <select
                                    name="companyType"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-900 font-bold text-xs focus:outline-none appearance-none cursor-pointer"
                                    onChange={handleChange}
                                    value={formData.companyType}
                                >
                                    <option value="Şahıs">Şahıs Şirketi</option>
                                    <option value="Limited">Limited Şirket</option>
                                    <option value="Anonim">Anonim Şirket</option>
                                </select>
                            </InputGroup>
                            <InputGroup label="Vergi Dairesi">
                                <input
                                    type="text"
                                    name="taxOffice"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-900 font-bold text-xs"
                                    value={formData.taxOffice}
                                    onChange={handleChange}
                                />
                            </InputGroup>
                            <InputGroup label="Vergi Numarası">
                                <input
                                    type="text"
                                    name="taxNumber"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-900 font-bold text-xs"
                                    value={formData.taxNumber}
                                    onChange={handleChange}
                                />
                            </InputGroup>
                        </div>
                        <InputGroup label="Vergi Levhası (Dosya)">
                            <div className="relative group/file">
                                <input
                                    type="file"
                                    accept=".pdf, .jpg, .jpeg, .png"
                                    className="hidden"
                                    id="taxPlate"
                                    onChange={handleFileChange}
                                />
                                <label
                                    htmlFor="taxPlate"
                                    className="flex flex-col items-center justify-center w-full h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all"
                                >
                                    {taxPlateFile ? (
                                        <div className="flex items-center gap-2 text-indigo-700 font-black text-[10px] italic">
                                            <ShieldCheck className="text-emerald-500" size={16} />
                                            <span>{taxPlateFile.name} (Eklendi)</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Briefcase size={16} className="text-slate-300 mb-1" />
                                            <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest leading-none">Dosya Seçiniz</span>
                                        </>
                                    )}
                                </label>
                            </div>
                        </InputGroup>
                    </div>

                    {/* Section 4: Security */}
                    <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                <Lock size={16} />
                            </div>
                            <div className="flex-1 space-y-3">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Erişim Şifresi</h3>
                                <InputGroup label="Geçici Sistem Şifresi">
                                    <input
                                        required
                                        type="text"
                                        name="password"
                                        placeholder="Min. 8 Karakter"
                                        className="w-full bg-white border border-indigo-200 rounded-lg px-4 py-2.5 text-indigo-900 font-bold text-xs focus:outline-none shadow-sm"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </InputGroup>
                            </div>
                        </div>
                    </div>

                    {/* Submit Panel */}
                    <div className="flex items-center gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/isletmeler')}
                            className="px-8 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-500 font-black hover:bg-slate-50 transition-all shadow-sm uppercase text-[10px] tracking-widest"
                        >
                            Vazgeç
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-slate-900 text-white font-black py-3.5 rounded-xl shadow-lg shadow-slate-200 flex items-center justify-center gap-2 transition-all hover:bg-indigo-600 group disabled:opacity-50 text-[10px] uppercase tracking-widest"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Save size={14} className="group-hover:scale-110 transition-transform" />
                                    KAYIT İŞLEMİNİ TAMAMLA
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResellerNewBusiness;
