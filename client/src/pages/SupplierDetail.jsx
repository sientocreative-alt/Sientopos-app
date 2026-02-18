import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import {
    ChevronLeft,
    Plus,
    FileText,
    Download,
    Eye,
    TrendingUp,
    Wallet,
    CheckCircle2,
    Clock,
    User,
    X,
    Calendar,
    ArrowRightCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';

const SupplierDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [supplier, setSupplier] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [posSettings, setPosSettings] = useState(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [invoiceForm, setInvoiceForm] = useState({
        invoice_type: 'Gider Faturası',
        record_type: '',
        invoice_no: '',
        date: new Date().toISOString().split('T')[0],
        sct_amount: 0,
        discount_amount: 0,
        description: '',
        due_date: '',
        vat_amount: 0,
        total_amount: 0,
        shipping_cost: 0
    });

    useEffect(() => {
        if (user && id) {
            fetchData();
        }
    }, [user, id]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch Supplier
            const { data: sData, error: sError } = await supabase
                .from('suppliers')
                .select('*')
                .eq('id', id)
                .single();
            if (sError) throw sError;
            setSupplier(sData);

            // Fetch Transactions
            const { data: tData, error: tError } = await supabase
                .from('supplier_transactions')
                .select('*')
                .eq('supplier_id', id)
                .is('is_deleted', false)
                .order('date', { ascending: false });

            if (tError) throw tError;

            // Optional: Fetch performer info for each transaction
            // We'll do this simply to avoid join errors if migration isn't run
            const transactionsWithStaff = await Promise.all((tData || []).map(async (t) => {
                if (t.performed_by) {
                    const { data: pData } = await supabase
                        .from('profiles')
                        .select('first_name, last_name, full_name, email')
                        .eq('id', t.performed_by)
                        .single();
                    return { ...t, performed_by_info: pData };
                }
                return t;
            }));

            setTransactions(transactionsWithStaff);

            // Fetch POS Settings for Logo
            const { data: psData } = await supabase
                .from('pos_settings')
                .select('logo_url, full_name')
                .eq('business_id', user.business_id)
                .single();
            if (psData) setPosSettings(psData);

        } catch (error) {
            console.error('Error fetching supplier data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveInvoice = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);

            // 1. Insert Transaction
            const isPayment = invoiceForm.invoice_type === 'Ödeme';
            const isWaybill = invoiceForm.invoice_type === 'İrsaliye';
            const isInWaybill = isWaybill && invoiceForm.record_type === 'Giriş İrsaliyesi';
            const isOutWaybill = isWaybill && invoiceForm.record_type === 'Çıkış İrsaliyesi';

            const totalAmount = parseFloat(invoiceForm.total_amount || 0);
            const shippingCost = parseFloat(invoiceForm.shipping_cost || 0);
            const currentDebt = parseFloat(supplier.current_debt || 0);

            // Logic: 
            // - Invoices increase debt
            // - Payments decrease debt
            // - Giriş İrsaliyesi increases debt
            // - Çıkış İrsaliyesi decreases debt
            let newBalance = currentDebt;
            if (isPayment || isOutWaybill) {
                newBalance -= totalAmount;
            } else {
                newBalance += totalAmount;
            }

            const { data: tData, error: tError } = await supabase
                .from('supplier_transactions')
                .insert([{
                    business_id: user.business_id,
                    supplier_id: id,
                    date: invoiceForm.date,
                    invoice_no: invoiceForm.invoice_no,
                    description: invoiceForm.description,
                    transaction_type: isPayment ? 'payment' : (isWaybill ? 'waybill' : 'purchase_invoice'),
                    record_type: invoiceForm.record_type,
                    debt: (isPayment || isOutWaybill) ? 0 : totalAmount,
                    credit: 0,
                    payment: isPayment ? totalAmount : 0,
                    vat_amount: invoiceForm.vat_amount,
                    sct_amount: invoiceForm.sct_amount,
                    discount_amount: invoiceForm.discount_amount,
                    shipping_cost: shippingCost,
                    due_date: invoiceForm.due_date || null,
                    performed_by: user.id,
                    balance: newBalance
                }])
                .select()
                .single();

            if (tError) throw tError;

            // 2. Update Supplier Balance
            const { error: sError } = await supabase
                .from('suppliers')
                .update({
                    current_debt: newBalance
                })
                .eq('id', id);

            if (sError) throw sError;

            setShowInvoiceModal(false);
            setInvoiceForm({
                invoice_type: 'Gider Faturası',
                record_type: '',
                invoice_no: '',
                date: new Date().toISOString().split('T')[0],
                sct_amount: 0,
                discount_amount: 0,
                description: '',
                due_date: '',
                vat_amount: 0,
                total_amount: 0,
                shipping_cost: 0
            });
            fetchData();
        } catch (error) {
            console.error('Error saving invoice:', error);
            alert('Fatura kaydedilirken hata oluştu: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleApproval = async (transaction) => {
        try {
            const { error } = await supabase
                .from('supplier_transactions')
                .update({ approval_status: !transaction.approval_status })
                .eq('id', transaction.id);

            if (error) throw error;

            // Update local state
            setTransactions(prev => prev.map(t =>
                t.id === transaction.id
                    ? { ...t, approval_status: !t.approval_status }
                    : t
            ));
            if (selectedTransaction?.id === transaction.id) {
                setSelectedTransaction(prev => ({ ...prev, approval_status: !prev.approval_status }));
            }
        } catch (error) {
            console.error('Error toggling approval:', error);
            alert('Durum güncellenirken bir hata oluştu');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const exportToExcel = () => {
        const data = transactions.map(t => ({
            'Tarih': new Date(t.date).toLocaleDateString('tr-TR'),
            'Fatura No': t.invoice_no,
            'Açıklama': t.description,
            'Alacak': t.credit,
            'Borç': t.debt,
            'Ödeme': t.payment,
            'Bakiye': t.balance,
            'İşlem Yapan': t.performed_by_info
                ? (t.performed_by_info.full_name || `${t.performed_by_info.first_name || ''} ${t.performed_by_info.last_name || ''}`.trim() || t.performed_by_info.email)
                : '-'
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Hesap Hareketleri");
        XLSX.writeFile(wb, `${supplier?.company_name}_hareketler.xlsx`);
    };

    if (loading) return <div className="p-10 flex justify-center items-center font-bold text-gray-400">Yükleniyor...</div>;
    if (!supplier) return <div className="p-10 text-center font-bold text-gray-400">Tedarikçi bulunamadı.</div>;

    return (
        <div className="p-8 min-h-screen bg-[#F8FAFC] text-left print:p-0 print:bg-white">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{supplier.company_name}</h1>
                    <div className="flex items-center gap-2 text-[11px] font-black text-gray-400 mt-1 uppercase tracking-widest">
                        <Link to="/isletme" className="hover:text-blue-600 transition-colors">Pano</Link>
                        <span>•</span>
                        <span>Faturalar</span>
                        <span>•</span>
                        <Link to="/isletme/tedarikciler" className="hover:text-blue-600 transition-colors">Tedarikçiler</Link>
                        <span>•</span>
                        <span className="text-gray-500">{supplier.company_name}</span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => {
                            setInvoiceForm(prev => ({ ...prev, invoice_type: 'Gider Faturası' }));
                            setShowInvoiceModal(true);
                        }}
                        className="bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all shadow-sm"
                    >
                        Yeni Gider Faturası
                    </button>
                    <button
                        onClick={() => {
                            setInvoiceForm(prev => ({ ...prev, invoice_type: 'Ödeme' }));
                            setShowInvoiceModal(true);
                        }}
                        className="bg-orange-50 text-orange-600 px-6 py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-orange-100 transition-all shadow-sm"
                    >
                        Yeni Ödeme
                    </button>
                    <button
                        onClick={() => {
                            setInvoiceForm(prev => ({ ...prev, invoice_type: 'İrsaliye', record_type: 'Giriş İrsaliyesi' }));
                            setShowInvoiceModal(true);
                        }}
                        className="bg-gray-100 text-gray-600 px-6 py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all shadow-sm"
                    >
                        Yeni İrsaliye
                    </button>
                    <button onClick={exportToExcel} className="bg-purple-50 text-purple-600 px-6 py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-purple-100 transition-all shadow-sm">
                        Excele aktar
                    </button>
                </div>
            </div>

            {/* Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 print:hidden">
                <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-[14px] font-black text-gray-800 uppercase tracking-tight">Alış Faturası</span>
                        <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-gray-800 tracking-tight">
                        {transactions.reduce((acc, t) => acc + (t.transaction_type === 'purchase_invoice' ? t.debt : 0), 0).toFixed(2).replace('.', ',')} ₺
                    </div>
                </div>

                <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-[14px] font-black text-gray-800 uppercase tracking-tight">Durum</span>
                        <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center">
                            <Wallet size={20} />
                        </div>
                    </div>
                    <div className="text-xl font-bold text-red-500 uppercase tracking-tight">
                        Borç: {parseFloat(supplier.current_debt || 0).toFixed(2).replace('.', ',')} ₺
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden print:hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse">
                        <thead>
                            <tr className="bg-white">
                                <th className="px-6 py-8 text-[12px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-50">Tarih</th>
                                <th className="px-6 py-8 text-[12px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-50">Fatura No</th>
                                <th className="px-6 py-8 text-[12px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-50">Açıklama</th>
                                <th className="px-6 py-8 text-[12px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-50">ALACAK</th>
                                <th className="px-6 py-8 text-[12px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-50">BORÇ</th>
                                <th className="px-6 py-8 text-[12px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-50">ÖDEME</th>
                                <th className="px-6 py-8 text-[12px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-50">BAKİYE</th>
                                <th className="px-6 py-8 text-[12px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-50">İşlem Yapanlar</th>
                                <th className="px-6 py-8 text-[12px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-50">Onay Durumu</th>
                                <th className="px-6 py-8 text-[12px] font-black text-gray-800 uppercase tracking-tight border-b border-gray-50">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="py-20 text-center text-gray-300 font-black uppercase text-xs tracking-widest">
                                        Herhangi bir hesap hareketi bulunamadı
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-5 text-[13px] font-bold text-gray-500">
                                            {new Date(t.date).toLocaleDateString('tr-TR')}
                                        </td>
                                        <td className="px-6 py-5 text-[13px] font-black text-gray-700">{t.invoice_no || '-'}</td>
                                        <td className="px-6 py-5 text-[13px] font-bold text-gray-500">{t.description || '-'}</td>
                                        <td className="px-6 py-5 text-[14px] font-black text-gray-800">
                                            {parseFloat(t.credit || 0).toFixed(2).replace('.', ',')} ₺
                                        </td>
                                        <td className="px-6 py-5 text-[14px] font-black text-orange-600">
                                            {parseFloat(t.debt || 0).toFixed(2).replace('.', ',')} ₺
                                        </td>
                                        <td className="px-6 py-5 text-[14px] font-black text-gray-800">
                                            {parseFloat(t.payment || 0).toFixed(2).replace('.', ',')} ₺
                                        </td>
                                        <td className="px-6 py-5 text-[14px] font-black text-gray-800">
                                            {parseFloat(t.balance || 0).toFixed(2).replace('.', ',')} ₺
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-center">
                                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400"
                                                    title={t.performed_by_info
                                                        ? (t.performed_by_info.full_name || `${t.performed_by_info.first_name || ''} ${t.performed_by_info.last_name || ''}`.trim() || t.performed_by_info.email)
                                                        : 'Sistem'}>
                                                    <User size={14} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-center">
                                                {t.approval_status ? (
                                                    <div className="text-green-500" title="Onaylandı">
                                                        <CheckCircle2 size={18} />
                                                    </div>
                                                ) : (
                                                    <div className="text-red-500" title="Onaylanmadı">
                                                        <X size={18} />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-center">
                                                <button
                                                    onClick={() => {
                                                        setSelectedTransaction(t);
                                                        setShowDetailModal(true);
                                                    }}
                                                    className="p-2 bg-gray-50 text-gray-400 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-500 transition-all"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Expense Invoice Modal */}
            {showInvoiceModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4 text-left">
                    <div className="bg-white rounded-[40px] w-full max-w-6xl shadow-2xl overflow-y-auto max-h-[95vh] custom-scrollbar">
                        <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-[40px]">
                            <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
                                {invoiceForm.invoice_type === 'Ödeme' ? 'Yeni Ödeme' : (invoiceForm.invoice_type === 'İrsaliye' ? 'Yeni İrsaliye' : 'Yeni Gider Faturası')}
                            </h3>
                            <button
                                onClick={() => setShowInvoiceModal(false)}
                                className="w-12 h-12 rounded-2xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                                <X size={28} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveInvoice} className="p-10">
                            <div className="space-y-10">
                                {/* Header Section */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Fatura Türü</label>
                                        <select
                                            value={invoiceForm.invoice_type}
                                            onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_type: e.target.value })}
                                            className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        >
                                            <option value="Gelir Faturası">Gelir Faturası</option>
                                            <option value="Gider Faturası">Gider Faturası</option>
                                            <option value="Ödeme">Ödeme</option>
                                            <option value="İrsaliye">İrsaliye</option>
                                            <option value="Tahsilat">Tahsilat</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">* Kayıt Türü</label>
                                        <select
                                            required
                                            value={invoiceForm.record_type}
                                            onChange={(e) => setInvoiceForm({ ...invoiceForm, record_type: e.target.value })}
                                            className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        >
                                            <option value="">Seçilmedi</option>
                                            {invoiceForm.invoice_type === 'Ödeme' ? (
                                                <>
                                                    <option value="Nakit">Nakit</option>
                                                    <option value="Kredi Kartı">Kredi Kartı</option>
                                                    <option value="Havale / EFT">Havale / EFT</option>
                                                </>
                                            ) : invoiceForm.invoice_type === 'İrsaliye' ? (
                                                <>
                                                    <option value="Giriş İrsaliyesi">Giriş İrsaliyesi</option>
                                                    <option value="Çıkış İrsaliyesi">Çıkış İrsaliyesi</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="Alış Faturası">Alış Faturası</option>
                                                    <option value="Satıştan İade Faturası">Satıştan İade Faturası</option>
                                                    <option value="Devir">Devir</option>
                                                    <option value="Kumbaralı Ürün Faturası">Kumbaralı Ürün Faturası</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Tedarikçi</label>
                                        <div className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-400 shadow-sm cursor-not-allowed">
                                            {supplier.company_name}
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-50 w-full" />

                                {/* Form Fields Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-8">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">* Fatura No</label>
                                        <input
                                            required
                                            type="text"
                                            value={invoiceForm.invoice_no}
                                            onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_no: e.target.value })}
                                            className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Tarih</label>
                                        <input
                                            type="date"
                                            value={invoiceForm.date}
                                            onChange={(e) => setInvoiceForm({ ...invoiceForm, date: e.target.value })}
                                            className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">ÖTV Tutarı</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={invoiceForm.sct_amount}
                                            onChange={(e) => setInvoiceForm({ ...invoiceForm, sct_amount: parseFloat(e.target.value || 0) })}
                                            className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-right"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Toplam İskonto</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={invoiceForm.discount_amount}
                                            onChange={(e) => setInvoiceForm({ ...invoiceForm, discount_amount: parseFloat(e.target.value || 0) })}
                                            className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-right"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Açıklama</label>
                                        <input
                                            type="text"
                                            value={invoiceForm.description}
                                            onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                                            className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Ödeme Tarihi</label>
                                        <input
                                            type="date"
                                            value={invoiceForm.due_date}
                                            onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                                            className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">KDV Tutarı</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={invoiceForm.vat_amount}
                                            onChange={(e) => setInvoiceForm({ ...invoiceForm, vat_amount: parseFloat(e.target.value || 0) })}
                                            className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-right"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">* Vergiler Dahil Toplam Tutar</label>
                                        <input
                                            required
                                            type="number"
                                            step="0.01"
                                            value={invoiceForm.total_amount}
                                            onChange={(e) => setInvoiceForm({ ...invoiceForm, total_amount: parseFloat(e.target.value || 0) })}
                                            className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-black text-blue-600 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-right"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Kargo Ücreti</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={invoiceForm.shipping_cost}
                                            onChange={(e) => setInvoiceForm({ ...invoiceForm, shipping_cost: parseFloat(e.target.value || 0) })}
                                            className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-right"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            className="px-6 py-4 bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-sm"
                                        >
                                            Dosya Seçin
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-center pt-8">
                                        <button
                                            type="button"
                                            className="px-10 py-5 bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-200"
                                        >
                                            Stoklu Ürün Ekle
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-8">
                                    <button
                                        type="button"
                                        onClick={() => setShowInvoiceModal(false)}
                                        className="px-10 py-5 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all shadow-sm"
                                    >
                                        İptal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-blue-500 text-white px-12 py-5 rounded-2xl text-[14px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-blue-100 active:scale-95 disabled:opacity-50"
                                    >
                                        {loading ? 'Kaydediliyor...' : 'Kaydet'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Transaction Detail Modal */}
            {showDetailModal && selectedTransaction && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-start md:items-center justify-center z-[120] p-4 md:p-8 animate-in fade-in duration-300 print:p-0 print:static print:bg-white print:block overflow-y-auto print-modal-overlay">
                    <style>
                        {`
                        @media print {
                            @page {
                                size: A4 portrait;
                                margin: 0;
                            }
                            html, body {
                                height: auto !important;
                                min-height: 100% !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                overflow: hidden !important; /* Hide potential scrollbars that cause extra pages */
                            }
                            
                            /* Make the modal and all its contents visible */
                            .print-modal-overlay,
                            .print-modal-overlay * {
                                visibility: visible !important;
                            }

                            /* Position the modal to cover the whole page */
                            .print-modal-overlay {
                                position: absolute !important;
                                left: 0 !important;
                                top: 0 !important;
                                width: 100% !important;
                                height: auto !important; /* Allow content to dictate height but don't force extra */
                                margin: 0 !important;
                                padding: 0 !important;
                                background-color: white !important;
                                z-index: 9999 !important;
                                display: block !important;
                            }

                            /* The content area formatting */
                            #print-area {
                                width: 100% !important;
                                padding: 10mm !important;
                                margin: 0 !important;
                                background-color: white !important;
                                box-shadow: none !important;
                            }
                            
                            /* Ensure text colors are printed exactly */
                            * {
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                            
                            .print\\:hidden {
                                display: none !important;
                            }
                        }
                        `}
                    </style>
                    <div className="bg-[#fcfdfe] rounded-[32px] md:rounded-[48px] w-full max-w-5xl shadow-2xl overflow-hidden border border-white/20 print:shadow-none print:border-none print:bg-white print:rounded-none print:max-w-none print:w-full flex flex-col my-auto max-h-none md:max-h-[92vh]">
                        {/* Header Actions */}
                        <div className="px-12 py-6 bg-white/60 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between sticky top-0 z-20 print:hidden">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Muhasebe Kaydı / {supplier.company_name}</span>
                                <h4 className="text-lg font-black text-gray-900 tracking-tight">{selectedTransaction.invoice_no || 'Fatura Detayı'}</h4>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={handlePrint} className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200">
                                    <Download size={16} /> Yazdır
                                </button>
                                <button onClick={() => handleToggleApproval(selectedTransaction)} className={`px-6 py-3 ${selectedTransaction.approval_status ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'} rounded-2xl text-[12px] font-black uppercase tracking-widest hover:opacity-80 transition-all border border-current/10`}>
                                    {selectedTransaction.approval_status ? 'Onayı Kaldır' : 'Onayla'}
                                </button>
                                <button onClick={() => setShowDetailModal(false)} className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Print Area Content */}
                        <div id="print-area" className="p-8 md:p-16 bg-white min-h-0 md:min-h-[800px] relative overflow-y-auto custom-scrollbar flex-1">
                            <div className="relative z-10 max-w-none mx-auto w-full">
                                {/* Header Section */}
                                <div className="flex justify-between items-start mb-16">
                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">TEDARİKÇİ ADI</p>
                                            <h2 className="text-4xl font-black text-[#1e293b] tracking-tighter uppercase leading-tight">{supplier.company_name}</h2>
                                        </div>
                                        <div className="grid grid-cols-2 gap-12">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">FATURA NO</p>
                                                <p className="text-lg font-black text-gray-700">{selectedTransaction.invoice_no || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">FATURA TARİHİ</p>
                                                <p className="text-lg font-black text-gray-700">{new Date(selectedTransaction.date).toLocaleDateString('tr-TR')}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="w-20 h-20 bg-gray-900 rounded-2xl flex items-center justify-center mb-6 overflow-hidden shadow-xl">
                                            {posSettings?.logo_url ? (
                                                <img src={posSettings.logo_url} className="w-full h-full object-cover" alt="Logo" />
                                            ) : (
                                                <span className="text-2xl font-black text-white">{posSettings?.full_name?.substring(0, 2).toUpperCase() || 'SC'}</span>
                                            )}
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">MUHASEBE KAYDI</p>
                                            <p className="text-[13px] font-black text-gray-800 uppercase tracking-widest leading-none">
                                                {selectedTransaction.transaction_type === 'purchase_invoice' ? 'ALIŞ FATURASI' : (selectedTransaction.transaction_type === 'payment' ? 'ÖDEME' : 'İRSALİYE')}
                                            </p>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase">Gider Faturası</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Body Content */}
                                <div className="grid grid-cols-12 gap-16 mb-20 pt-12 border-t border-gray-50">
                                    <div className="col-span-12">
                                        <div className="grid grid-cols-2 gap-24">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Açıklama</p>
                                                <p className="text-[15px] font-semibold text-gray-600 leading-relaxed">
                                                    {selectedTransaction.description || 'Bu işlem için ek açıklama girilmemiştir.'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">TOPLAM TUTAR</p>
                                                <p className="text-5xl font-black text-gray-900 tracking-tighter">
                                                    {(selectedTransaction.transaction_type === 'payment' ? selectedTransaction.payment : (selectedTransaction.debt || selectedTransaction.credit) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                    <span className="text-2xl font-black ml-2 text-gray-400">₺</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Summary Section */}
                                <div className="mb-24 pt-12 border-t border-gray-50">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-10 text-right">TEDARİKÇİ HESAP ÖZETİ</p>
                                    <div className="space-y-4 max-w-md ml-auto">
                                        <div className="flex justify-between items-center text-[13px]">
                                            <span className="font-bold text-gray-400 uppercase tracking-widest">Önceki Bakiye</span>
                                            <span className="font-black text-gray-800">{(selectedTransaction.balance - (selectedTransaction.debt - selectedTransaction.payment)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[13px]">
                                            <span className="font-bold text-gray-400 uppercase tracking-widest">Bu Fatura Tutarı</span>
                                            <span className={`font-black ${selectedTransaction.debt > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                {selectedTransaction.debt > 0 ? '+' : '-'} {Math.abs(selectedTransaction.debt - selectedTransaction.payment).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                            </span>
                                        </div>
                                        <div className="h-[1px] bg-gray-50 my-2"></div>
                                        <div className="flex justify-between items-center text-[13px]">
                                            <span className="font-bold text-gray-400 uppercase tracking-widest">Toplam Borç</span>
                                            <span className="font-black text-gray-800">{selectedTransaction.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[13px]">
                                            <span className="font-bold text-gray-400 uppercase tracking-widest">Yapılan Ödeme</span>
                                            <span className="font-black text-red-500">- {(selectedTransaction.payment || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                        </div>
                                        <div className="bg-[#f8fafc] p-6 rounded-2xl flex justify-between items-center mt-6">
                                            <span className="text-[12px] font-black text-gray-900 uppercase tracking-widest">Kalan Bakiye</span>
                                            <span className="text-2xl font-black text-gray-900">{selectedTransaction.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Area */}
                                <div className="grid grid-cols-3 gap-24 pt-16 border-t-2 border-dashed border-gray-100">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1">YAZDIRMA TARİHİ / SAATİ</p>
                                            <p className="text-[11px] font-bold text-gray-500">{new Date().toLocaleString('tr-TR')}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1">REF CODE</p>
                                            <p className="text-[11px] font-bold text-gray-500">INV-{selectedTransaction.id.substring(0, 8).toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <div className="text-center pt-8">
                                        <div className="w-full h-[1px] bg-gray-200 mb-2"></div>
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">YETKİLİ İMZA</p>
                                    </div>
                                    <div className="flex flex-col items-center pt-2">
                                        <div className="w-20 h-20 border-2 border-dashed border-gray-100 rounded-full flex items-center justify-center text-gray-100 mb-2">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">ŞİRKET KAŞESİ</p>
                                    </div>
                                </div>

                                <div className="mt-20 pt-8 border-t border-gray-50 flex justify-between items-center text-[8px] font-black text-gray-300 uppercase tracking-[0.3em]">
                                    <div>SİSTEM TARAFINDAN OLUŞTURULMUŞTUR</div>
                                    <div>SAYFA 1 / 1</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupplierDetail;
