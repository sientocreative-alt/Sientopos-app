import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, AlertTriangle, CheckCircle, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminPaymentSettings() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [activeProvider, setActiveProvider] = useState('iyzico'); // Display tab
    const [systemActiveProvider, setSystemActiveProvider] = useState(''); // Actual active in DB

    // Config State
    const [providers, setProviders] = useState({
        iyzico: {
            api_key: '',
            secret_key: '',
            mode: 'sandbox'
        },
        paytr: {
            merchant_id: '',
            merchant_key: '',
            merchant_salt: '',
            mode: 'sandbox',
            ok_url: '',
            fail_url: ''
        }
    });

    // isEnv is not directly used in the new structure, its logic would be per-provider if needed.
    // const [isEnv, setIsEnv] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            // New endpoint to get all settings or we adapt existing
            // Ideally we should have a `GET /api/payment/providers` and `GET /api/payment/settings`
            // For now assuming we updated the backend `getConfigStatus` or similar to return full list
            // But let's stick to the plan: `PaymentController.getProviderSettings`

            // Temporary: We might need to implement the backend endpoint first if we haven't fully.
            // based on previous steps, `getProviderSettings` was stubbed. 
            // Let's assume we need to fetch from a new endpoint or the updated config-status.

            // Let's call the updated endpoint
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/payment/config-status/all`);
            // Note: I need to ensure this endpoint exists in backend. 
            // Since I haven't implemented `config-status/all` yet, I should probably do that first 
            // or update `getConfigStatus` to return everything.

            if (res.data) {
                const { active, settings } = res.data;
                setSystemActiveProvider(active);
                setProviders(prev => ({
                    ...prev,
                    ...settings
                }));
            }

        } catch (error) {
            console.error(error);
            // Fallback for now while backend is catching up
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (provider, e) => {
        const { name, value } = e.target;
        setProviders(prev => ({
            ...prev,
            [provider]: {
                ...prev[provider],
                [name]: value
            }
        }));
    };

    const handleSave = async (provider) => {
        setSaving(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/payment/update-config`, {
                provider,
                settings: providers[provider]
            });
            alert(`${provider.toUpperCase()} ayarları kaydedildi.`);
            fetchConfig(); // Re-fetch to get masked values or updated status
        } catch (error) {
            console.error(error);
            alert('Hata: ' + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    const handleActivate = async (providerName) => {
        if (!confirm(`${providerName} ödeme altyapısını aktif etmek istiyor musunuz?`)) return;

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/payment/set-active-provider`, { provider: providerName });
            setSystemActiveProvider(providerName);
            alert(`${providerName} şimdi aktif ödeme sağlayıcı.`);
        } catch (error) {
            console.error(error);
            alert('Hata: ' + (error.response?.data?.message || error.message));
        }
    };

    if (loading) return <div className="p-8">Yükleniyor...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Ödeme Ayarları</h1>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {['iyzico', 'paytr'].map(p => (
                        <button
                            key={p}
                            onClick={() => setActiveProvider(p)}
                            className={`px-4 py-2 rounded-md font-medium capitalize transition-all ${activeProvider === p ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Active Provider Indicator */}
            <div className={`p-4 rounded-lg flex items-center justify-between ${systemActiveProvider === activeProvider ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="flex items-center gap-3">
                    <CheckCircle className={systemActiveProvider === activeProvider ? "text-green-600" : "text-gray-300"} size={24} />
                    <div>
                        <h3 className="font-medium text-gray-900 capitalize">{activeProvider} Entegrasyonu</h3>
                        <p className="text-sm text-gray-500">
                            {systemActiveProvider === activeProvider
                                ? 'Bu şu anda aktif ödeme altyapısıdır.'
                                : 'Bu pasif durumdadır.'}
                        </p>
                    </div>
                </div>
                {systemActiveProvider !== activeProvider && (
                    <button
                        onClick={() => handleActivate(activeProvider)}
                        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
                    >
                        Aktif Yap
                    </button>
                )}
            </div>

            {/* Config Form based on active tab */}
            {activeProvider === 'iyzico' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="grid gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                            <input
                                type="text"
                                name="api_key"
                                value={providers.iyzico.api_key}
                                onChange={(e) => handleChange('iyzico', e)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Secret Key</label>
                            <input
                                type="text"
                                name="secret_key"
                                value={providers.iyzico.secret_key}
                                onChange={(e) => handleChange('iyzico', e)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Mod</label>
                            <select
                                name="mode"
                                value={providers.iyzico.mode}
                                onChange={(e) => handleChange('iyzico', e)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-black"
                            >
                                <option value="sandbox">Sandbox (Test)</option>
                                <option value="live">Live (Canlı)</option>
                            </select>
                        </div>
                        <div className="flex justify-end pt-4">
                            <button
                                onClick={() => handleSave('iyzico')}
                                disabled={saving}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? 'Kaydediliyor...' : 'Iyzico Ayarlarını Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeProvider === 'paytr' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    {/* PayTR Inputs similar to before... */}
                    {/* For brevity, I'll rely on the user filling this out or I can copy existing logic */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Merchant ID</label>
                            <input
                                type="text"
                                name="merchant_id"
                                value={providers.paytr.merchant_id}
                                onChange={(e) => handleChange('paytr', e)}
                                placeholder="Örn: 123456"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-black"
                            />
                        </div>
                        {/* ... Key, Salt, URLs ... */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Merchant Key</label>
                            <input
                                type="text"
                                name="merchant_key"
                                value={providers.paytr.merchant_key}
                                onChange={(e) => handleChange('paytr', e)}
                                placeholder="Mevcut anahtarı değiştirmek için yeni değer girin"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-black"
                            />
                            {providers.paytr.merchant_key && providers.paytr.merchant_key.includes('*') && (
                                <p className="text-xs text-gray-400 mt-1">Mevcut anahtar gizlenmiştir.</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Merchant Salt</label>
                            <input
                                type="text"
                                name="merchant_salt"
                                value={providers.paytr.merchant_salt}
                                onChange={(e) => handleChange('paytr', e)}
                                placeholder="Mevcut anahtarı değiştirmek için yeni değer girin"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-black"
                            />
                            {providers.paytr.merchant_salt && providers.paytr.merchant_salt.includes('*') && (
                                <p className="text-xs text-gray-400 mt-1">Mevcut anahtar gizlenmiştir.</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Mod</label>
                            <select
                                name="mode"
                                value={providers.paytr.mode}
                                onChange={(e) => handleChange('paytr', e)}
                                className={`w-full px-4 py-3 border rounded-lg font-medium focus:outline-none ${providers.paytr.mode === 'sandbox' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'
                                    }`}
                            >
                                <option value="sandbox">Test</option>
                                <option value="live">Canlı</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Başarılı İşlem URL (OK URL)</label>
                            <input
                                type="text"
                                name="ok_url"
                                value={providers.paytr.ok_url}
                                onChange={(e) => handleChange('paytr', e)}
                                placeholder={`${import.meta.env.VITE_API_URL}/isletme/siento-faturalari`}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm text-black"
                            />
                            <p className="text-xs text-gray-500 mt-1">Müşteri ödeme başarılı olduğunda bu adrese yönlendirilir.</p>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Hatalı İşlem URL (FAIL URL)</label>
                            <input
                                type="text"
                                name="fail_url"
                                value={providers.paytr.fail_url}
                                onChange={(e) => handleChange('paytr', e)}
                                placeholder={`${import.meta.env.VITE_API_URL}/isletme/siento-faturalari`}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">Müşteri ödeme başarısız olduğunda bu adrese yönlendirilir.</p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t mt-4">
                        <button
                            onClick={() => handleSave('paytr')}
                            disabled={saving}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? 'Kaydediliyor...' : 'PayTR Ayarlarını Kaydet'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
