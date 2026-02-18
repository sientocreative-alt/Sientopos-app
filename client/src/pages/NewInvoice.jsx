import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Save, Loader2, UploadCloud, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const NewInvoice = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(false);

    // Dynamic Data
    const [recordTypesOptions, setRecordTypesOptions] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [customerBusinesses, setCustomerBusinesses] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);

    // Invoice Items State
    const [showStockedProductForm, setShowStockedProductForm] = useState(false);
    const [invoiceItems, setInvoiceItems] = useState([]);

    const [formData, setFormData] = useState({
        invoice_type: '',
        record_type: '',
        receiver_type: 'Müşteri',
        customer_business_id: '',
        supplier_id: '',
        invoice_no: '',
        issue_date: format(new Date(), 'yyyy-MM-dd'),
        otv_amount: 0,
        discount_amount: 0,
        description: '',
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        kdv_amount: 0,
        amount: 0,
        total_amount: 0,
        file_url: ''
    });

    // Invoice Types
    const invoiceTypes = [
        'Gelir Faturası',
        'Gider Faturası',
        'Ödeme',
        'İrsaliye',
        'Tahsilat'
    ];

    // Record Types Mapping
    const recordTypesMapping = {
        'Gelir Faturası': ['Satış', 'Hizmet Geliri', 'Diğer Gelirler'],
        'Gider Faturası': ['Satın Alma', 'Masraf', 'Personel Gideri', 'Kira', 'Elektrik/Su/Doğalgaz'],
        'Ödeme': ['Nakit', 'Kredi Kartı', 'Havale/EFT'],
        'İrsaliye': ['Giden İrsaliye', 'Gelen İrsaliye'],
        'Tahsilat': ['Nakit', 'Kredi Kartı', 'Havale/EFT']
    };

    // Receiver Types
    const receiverTypes = ['Müşteri', 'Şube', 'Tedarikçi'];

    useEffect(() => {
        const typeParam = searchParams.get('type');
        if (typeParam && invoiceTypes.includes(typeParam)) {
            setFormData(prev => ({ ...prev, invoice_type: typeParam }));
        }
        fetchRelations();
        if (id) {
            fetchInvoice();
        }
    }, [id, searchParams]);

    useEffect(() => {
        if (formData.invoice_type) {
            setRecordTypesOptions(recordTypesMapping[formData.invoice_type] || []);
        } else {
            setRecordTypesOptions([]);
        }
    }, [formData.invoice_type]);

    // Calculate totals automatically from items if present
    useEffect(() => {
        if (invoiceItems.length > 0) {
            const total = invoiceItems.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0);
            const totalKdv = invoiceItems.reduce((sum, item) => sum + (parseFloat(item.tax_kdv_amount) || 0), 0);
            const totalOtv = invoiceItems.reduce((sum, item) => sum + (parseFloat(item.tax_otv_amount) || 0), 0);
            const totalDiscount = invoiceItems.reduce((sum, item) => sum + (parseFloat(item.discount_amount) || 0), 0);

            setFormData(prev => ({
                ...prev,
                total_amount: total,
                kdv_amount: totalKdv,
                otv_amount: totalOtv,
                discount_amount: totalDiscount
                // amount/subtotal logic could be added here
            }));
        }
    }, [invoiceItems]);

    const fetchRelations = async () => {
        try {
            const { data: suppliersData } = await supabase.from('suppliers').select('id, company_name').eq('is_deleted', false);
            setSuppliers(suppliersData || []);

            const { data: cbData } = await supabase.from('customer_businesses').select('id, name').eq('is_deleted', false);
            setCustomerBusinesses(cbData || []);

            const { data: pData } = await supabase.from('products').select('id, name, price').eq('is_deleted', false).eq('is_active', true);
            setProducts(pData || []);

        } catch (error) {
            console.error('Error fetching relations:', error);
        }
    };

    const fetchInvoice = async () => {
        try {
            setInitialLoading(true);
            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    invoice_type: data.invoice_type || '',
                    record_type: data.record_type || '',
                    receiver_type: data.receiver_type || 'Müşteri',
                    customer_business_id: data.customer_business_id || '',
                    supplier_id: data.supplier_id || '',
                    invoice_no: data.invoice_no || '',
                    issue_date: data.issue_date || format(new Date(), 'yyyy-MM-dd'),
                    otv_amount: data.tax_otv_amount || 0,
                    discount_amount: data.discount_amount || 0,
                    description: data.description || '',
                    payment_date: data.payment_date || format(new Date(), 'yyyy-MM-dd'),
                    kdv_amount: data.tax_kdv_amount || 0,
                    amount: data.amount || 0,
                    total_amount: data.total_amount || 0,
                    file_url: data.file_url || ''
                });

                // Fetch items
                const { data: itemsData } = await supabase
                    .from('invoice_items')
                    .select('*')
                    .eq('invoice_id', id);

                if (itemsData && itemsData.length > 0) {
                    setInvoiceItems(itemsData);
                    setShowStockedProductForm(true);
                }
            }
        } catch (error) {
            console.error('Error fetching invoice:', error);
            toast.error('Fatura bilgileri yüklenirken hata oluştu');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        toast.success(`Dosya seçildi: ${file.name}`);
    };

    const addInvoiceItem = () => {
        setInvoiceItems([
            ...invoiceItems,
            {
                id: `temp-${Date.now()}`, // Temporary ID
                product_id: '',
                quantity: 1,
                unit: 'Adet',
                otv_amount: 0,
                otv_rate: 0,
                kdv_rate: 18, // Default KDV
                discount_amount: 0,
                discount_rate: 0,
                unit_price_excl_vat: 0,
                tax_kdv_amount: 0, // Calculated
                total_amount: 0 // Calculated
            }
        ]);
        setShowStockedProductForm(true);
    };

    const removeInvoiceItem = (index) => {
        const newItems = [...invoiceItems];
        newItems.splice(index, 1);
        setInvoiceItems(newItems);
        if (newItems.length === 0) setShowStockedProductForm(false);
    };

    const updateInvoiceItem = (index, field, value) => {
        const newItems = [...invoiceItems];
        const item = { ...newItems[index], [field]: value };

        // Calculations
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unit_price_excl_vat) || 0;
        const discountAmt = parseFloat(item.discount_amount) || 0;
        // Or calculate discount from rate if needed, but assuming direct input for now or simpler logic.

        // Basic calculation logic:
        // Base = Qty * Price
        // After Discount = Base - DiscountAmt
        // Tax Base = After Discount + OTV (if OTV affects VAT base? usually yes)

        // Let's keep it simple as per screenshot fields
        // user inputs amounts directly or rates. 
        // Let's implement auto-calc if rates change, or amounts change.

        // For now, simple state update. Complex calc logic can be added if needed.
        // But we need total_amount for the invoice total.

        if (field === 'quantity' || field === 'unit_price_excl_vat' || field === 'kdv_rate' || field === 'otv_amount' || field === 'discount_amount') {
            // Re-calculate row total
            const basePrice = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price_excl_vat) || 0);
            const otv = parseFloat(item.otv_amount) || 0;
            const discount = parseFloat(item.discount_amount) || 0;
            const kdvRate = parseFloat(item.kdv_rate) || 0;

            // KDV usually calculated on (Base - Discount + OTV)
            const kdvBase = Math.max(0, basePrice - discount + otv);
            const kdvAmt = kdvBase * (kdvRate / 100);

            item.tax_kdv_amount = kdvAmt;
            item.total_amount = kdvBase + kdvAmt;
        }

        newItems[index] = item;
        setInvoiceItems(newItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                business_id: user.business_id,
                invoice_type: formData.invoice_type,
                record_type: formData.record_type,
                receiver_type: formData.receiver_type,
                customer_business_id: formData.receiver_type === 'Müşteri İşletme' ? formData.customer_business_id : (formData.receiver_type === 'Müşteri' ? formData.customer_business_id : null),
                supplier_id: formData.receiver_type === 'Tedarikçi' ? formData.supplier_id : null,
                invoice_no: formData.invoice_no,
                issue_date: formData.issue_date,
                payment_date: formData.payment_date,
                tax_otv_amount: formData.otv_amount,
                tax_kdv_amount: formData.kdv_amount,
                discount_amount: formData.discount_amount,
                total_amount: formData.total_amount,
                description: formData.description,
                file_url: formData.file_url,
                updated_at: new Date().toISOString()
            };

            let invoiceId = id;
            if (id) {
                const { error: updateError } = await supabase
                    .from('invoices')
                    .update(payload)
                    .eq('id', id);
                if (updateError) throw updateError;
            } else {
                const { data: insertData, error: insertError } = await supabase
                    .from('invoices')
                    .insert([payload])
                    .select()
                    .single();
                if (insertError) throw insertError;
                invoiceId = insertData.id;
            }

            // Handle Invoice Items
            if (invoiceItems.length > 0) {
                // Delete existing items if any (simple replacement strategy)
                if (id) {
                    await supabase.from('invoice_items').delete().eq('invoice_id', id);
                }

                const itemsPayload = invoiceItems.map(item => ({
                    invoice_id: invoiceId,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit: item.unit,
                    unit_price_excl_vat: item.unit_price_excl_vat,
                    tax_otv_rate: item.otv_rate,
                    tax_otv_amount: item.otv_amount,
                    tax_kdv_rate: item.kdv_rate,
                    tax_kdv_amount: item.tax_kdv_amount,
                    discount_rate: item.discount_rate,
                    discount_amount: item.discount_amount,
                    total_amount: item.total_amount
                }));

                const { error: itemsError } = await supabase
                    .from('invoice_items')
                    .insert(itemsPayload);

                if (itemsError) throw itemsError;
            }

            toast.success(id ? 'Fatura güncellendi' : 'Fatura başarıyla oluşturuldu');
            navigate('/isletme/faturalar');
        } catch (error) {
            console.error('Error saving invoice:', error);
            toast.error('Kaydetme işlemi sırasında bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#F8FAFC]">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="p-6 bg-[#F8FAFC] min-h-screen">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/isletme/faturalar')}
                        className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                            {id ? 'Fatura Düzenle' : 'Fatura Ekle'}
                        </h1>
                        <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                            <span>Pano</span>
                            <span className="text-gray-300">•</span>
                            <span>Muhasebe Kayıtları</span>
                            <span className="text-gray-300">•</span>
                            <span>Faturalar</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-blue-600 font-medium">{id ? 'Düzenle' : 'Yeni'}</span>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30">
                        <h2 className="text-lg font-bold text-gray-900">Fatura Bilgileri</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-8">

                        {/* Type Selection Section */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                    Fatura Türü
                                </label>
                                <select
                                    value={formData.invoice_type}
                                    onChange={(e) => setFormData({ ...formData, invoice_type: e.target.value, record_type: '' })}
                                    className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700 shadow-sm appearance-none cursor-pointer"
                                >
                                    <option value="">Seçilmedi</option>
                                    {invoiceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                    * Kayıt Türü
                                </label>
                                <select
                                    value={formData.record_type}
                                    onChange={(e) => setFormData({ ...formData, record_type: e.target.value })}
                                    className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700 shadow-sm appearance-none cursor-pointer"
                                    disabled={!formData.invoice_type}
                                >
                                    <option value="">Seçilmedi</option>
                                    {recordTypesOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                    Alıcı Tipi
                                </label>
                                <select
                                    value={formData.receiver_type}
                                    onChange={(e) => setFormData({ ...formData, receiver_type: e.target.value })}
                                    className="w-full px-5 py-4 bg-blue-50/50 border border-blue-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-blue-900 shadow-sm appearance-none cursor-pointer"
                                >
                                    {receiverTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            {/* Dynamic Receiver Selection */}
                            {(formData.receiver_type === 'Müşteri' || formData.receiver_type === 'Müşteri İşletme') && (
                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                        Müşteri İşletme
                                    </label>
                                    <select
                                        value={formData.customer_business_id}
                                        onChange={(e) => setFormData({ ...formData, customer_business_id: e.target.value })}
                                        className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700 shadow-sm appearance-none cursor-pointer"
                                    >
                                        <option value="">Seçilmedi</option>
                                        {customerBusinesses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            )}

                            {formData.receiver_type === 'Tedarikçi' && (
                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                        Tedarikçi
                                    </label>
                                    <select
                                        value={formData.supplier_id}
                                        onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                                        className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700 shadow-sm appearance-none cursor-pointer"
                                    >
                                        <option value="">Seçilmedi</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-100 my-6"></div>

                        {/* Invoice Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">

                            <div>
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                    * Fatura No
                                </label>
                                <input
                                    type="text"
                                    value={formData.invoice_no}
                                    onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })}
                                    className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700 shadow-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                    Tarih
                                </label>
                                <input
                                    type="date"
                                    value={formData.issue_date}
                                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                                    className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700 shadow-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                    Açıklama
                                </label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700 shadow-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                    Ödeme Tarihi
                                </label>
                                <input
                                    type="date"
                                    value={formData.payment_date}
                                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                                    className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700 shadow-sm"
                                />
                            </div>

                            {/* Totals - Read Only or Editable if no items */}
                            <div>
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                    KDV Tutar
                                </label>
                                <input
                                    type="number"
                                    value={formData.kdv_amount}
                                    readOnly={invoiceItems.length > 0}
                                    onChange={(e) => setFormData({ ...formData, kdv_amount: parseFloat(e.target.value) || 0 })}
                                    className={`w-full px-5 py-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700 shadow-sm ${invoiceItems.length > 0 ? 'bg-gray-50' : 'bg-white'}`}
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                    * Vergiler Dahil Toplam Tutar
                                </label>
                                <input
                                    type="number"
                                    value={formData.total_amount}
                                    readOnly={invoiceItems.length > 0}
                                    onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                                    className={`w-full px-5 py-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700 shadow-sm ${invoiceItems.length > 0 ? 'bg-gray-50' : 'bg-white'}`}
                                />
                            </div>
                        </div>

                        {/* File Upload */}
                        <div className="flex flex-col md:flex-row gap-4 mt-4">
                            <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-200 flex items-center gap-2">
                                <UploadCloud size={20} />
                                Dosya Seçin
                                <input type="file" className="hidden" onChange={handleFileUpload} />
                            </label>

                            <button
                                type="button"
                                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md flex items-center gap-2 ${showStockedProductForm ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                                onClick={addInvoiceItem}
                            >
                                <Plus size={20} />
                                Stoklu Ürün Ekle
                            </button>
                        </div>

                        {/* Stocked Items Form */}
                        {showStockedProductForm && (
                            <div className="space-y-4 pt-4">
                                {invoiceItems.map((item, index) => (
                                    <div key={item.id || index} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative group">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                            <div className="md:col-span-1">
                                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                                    * Stoklu Ürün
                                                </label>
                                                <select
                                                    value={item.product_id}
                                                    onChange={(e) => updateInvoiceItem(index, 'product_id', e.target.value)}
                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700"
                                                >
                                                    <option value="">Seçilmedi</option>
                                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                                    * Miktar
                                                </label>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateInvoiceItem(index, 'quantity', e.target.value)}
                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                                    * Ölçü Birimi
                                                </label>
                                                <select
                                                    value={item.unit}
                                                    onChange={(e) => updateInvoiceItem(index, 'unit', e.target.value)}
                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700"
                                                >
                                                    <option value="Adet">Adet</option>
                                                    <option value="Kg">Kg</option>
                                                    <option value="Lt">Lt</option>
                                                    <option value="Porsiyon">Porsiyon</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                                    ÖTV Miktarı
                                                </label>
                                                <input
                                                    type="number"
                                                    value={item.otv_amount}
                                                    onChange={(e) => updateInvoiceItem(index, 'otv_amount', e.target.value)}
                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                            <div>
                                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                                    ÖTV Oranı
                                                </label>
                                                <input
                                                    type="number"
                                                    value={item.otv_rate}
                                                    onChange={(e) => updateInvoiceItem(index, 'otv_rate', e.target.value)}
                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                                    KDV Oranı
                                                </label>
                                                <select
                                                    value={item.kdv_rate}
                                                    onChange={(e) => updateInvoiceItem(index, 'kdv_rate', e.target.value)}
                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700"
                                                >
                                                    <option value="0">0</option>
                                                    <option value="1">1</option>
                                                    <option value="8">8</option>
                                                    <option value="10">10</option>
                                                    <option value="18">18</option>
                                                    <option value="20">20</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                                    İndirim Tutarı
                                                </label>
                                                <input
                                                    type="number"
                                                    value={item.discount_amount}
                                                    onChange={(e) => updateInvoiceItem(index, 'discount_amount', e.target.value)}
                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                                    İndirim Oranı
                                                </label>
                                                <input
                                                    type="number"
                                                    value={item.discount_rate}
                                                    onChange={(e) => updateInvoiceItem(index, 'discount_rate', e.target.value)}
                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700"
                                                />
                                            </div>

                                            <div className="flex gap-2 items-end">
                                                <div className="w-full">
                                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                                        KDV Hariç Birim Fiyat
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={item.unit_price_excl_vat}
                                                        onChange={(e) => updateInvoiceItem(index, 'unit_price_excl_vat', e.target.value)}
                                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeInvoiceItem(index)}
                                                    className="p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-md mb-[2px]"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Footer Actions */}
                        <div className="flex justify-end gap-4 mt-8 pt-8 border-t border-gray-50">
                            <button
                                type="button"
                                onClick={() => navigate('/isletme/faturalar')}
                                className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 bg-[#14b8a6] text-white rounded-xl font-bold text-sm hover:bg-[#0d9488] transition-all shadow-lg shadow-teal-100 flex items-center gap-2 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : null}
                                {id ? 'Değişiklikleri Kaydet' : 'Fatura Ekle'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default NewInvoice;
