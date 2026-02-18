import { useState } from 'react';
import { supabase } from '../../services/supabase';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { createClient } from '@supabase/supabase-js';

const AdminNewBusiness = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        businessName: '',
        ownerName: '',
        email: '',
        phone: '',
        taxOffice: '',
        taxNumber: '',
        password: '',
        billingType: 'Kurumsal', // Default
        companyType: 'Şahıs', // Default
        address: '',
        city: '',
        district: ''
    });

    const [taxPlateFile, setTaxPlateFile] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
            // 1. Upload Tax Plate PDF/Image first if it exists
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

                const fileName = `temp_tax_plate_${Date.now()}.${fileExt}`;
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

            // 2. Call the MEGA BYPASS RPC to handle User, Business, Profile, and Settings in one shot
            // This bypasses BOTH Rate Limits and RLS policies
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
                p_city: formData.city,
                p_district: formData.district
            });

            if (rpcError) throw rpcError;
            if (data && data.success === false) throw new Error(data.error);

            alert('İşletme başarıyla oluşturuldu! Tüm limitler ve engeller aşıldı.');
            navigate('/businesses');

        } catch (err) {
            console.error('Final Creation Error:', err);
            alert('Hata: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <button
                onClick={() => navigate('/businesses')}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 transition"
            >
                <ArrowLeft size={20} />
                <span>Listeye Dön</span>
            </button>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50">
                    <h1 className="text-xl font-bold text-gray-800">Yeni İşletme Kaydı</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Yeni işletme oluşturulduğunda otomatik olarak 15 günlük deneme süresi başlar.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">İşletme Adı (POS Ekranda Görünecek İsim)</label>
                            <input
                                type="text"
                                name="businessName"
                                required
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                                placeholder="Örn: Siento Cafe"
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Yetkili Adı Soyadı</label>
                            <input
                                type="text"
                                name="ownerName"
                                required
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                                placeholder="Örn: Ahmet Yılmaz"
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">E-posta Adresi</label>
                            <input
                                type="email"
                                name="email"
                                required
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                                placeholder="ornek@siento.com"
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Telefon</label>
                            <input
                                type="tel"
                                name="phone"
                                required
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                                placeholder="0555 123 45 67"
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Vergi Dairesi</label>
                            <input
                                type="text"
                                name="taxOffice"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                                placeholder="Vergi Dairesi"
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Vergi Numarası</label>
                            <input
                                type="text"
                                name="taxNumber"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                                placeholder="Vergi No"
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Fatura Tipi</label>
                            <select
                                name="billingType"
                                value={formData.billingType}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                                onChange={handleChange}
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
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                                onChange={handleChange}
                            >
                                <option value="Şahıs">Şahıs</option>
                                <option value="Limited">Limited</option>
                                <option value="Anonim">Anonim</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Şehir</label>
                            <select
                                name="city"
                                value={formData.city}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                                onChange={handleChange}
                                required
                            >
                                <option value="">Şehir Seçin</option>
                                <option value="İstanbul">İstanbul</option>
                                <option value="Ankara">Ankara</option>
                                <option value="İzmir">İzmir</option>
                                <option value="Bursa">Bursa</option>
                                <option value="Antalya">Antalya</option>
                                <option value="Adana">Adana</option>
                                <option value="Konya">Konya</option>
                                <option value="Gaziantep">Gaziantep</option>
                                <option value="Mersin">Mersin</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">İlçe</label>
                            <input
                                type="text"
                                name="district"
                                value={formData.district}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                                placeholder="İlçe girin"
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-gray-700">Adres</label>
                            <textarea
                                name="address"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 h-24 resize-none"
                                placeholder="İşletme Adresi"
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-gray-700">Vergi Levhası (PDF, JPG, PNG)</label>
                            <input
                                type="file"
                                accept=".pdf, .jpg, .jpeg, .png"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                onChange={handleFileChange}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-gray-700">Geçici Şifre</label>
                            <input
                                type="text"
                                name="password"
                                required
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-yellow-50 text-gray-900"
                                placeholder="Kullanıcı için başlangıç şifresi belirleyin"
                                onChange={handleChange}
                            />
                            <p className="text-xs text-orange-600 mt-1">Bu şifreyi işletme sahibine iletmelisiniz.</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/businesses')}
                            className="px-6 py-2 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'Kaydediliyor...' : (
                                <>
                                    <Save size={18} />
                                    Kaydet ve Başlat
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminNewBusiness;
