import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { isAdminSubdomain, isResellerSubdomain } from '../utils/subdomain';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const [connectionStatus, setConnectionStatus] = useState('Kontrol Ediliyor...');

    useEffect(() => {
        if (user) {
            if (isAdminSubdomain()) {
                navigate('/');
            } else if (isResellerSubdomain()) {
                navigate('/');
            } else {
                navigate('/isletme');
            }
        }

        fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`)
            .then(res => {
                if (res.status !== 404) setConnectionStatus('Çevrimiçi');
                else setConnectionStatus('Çevrimiçi (Erişilebilir)');
            })
            .catch(err => setConnectionStatus(`Çevrimdışı: ${err.message}`));
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);

        if (result.success) {
            // Navigation handled by useEffect when user state updates
        } else {
            setError(result.message);
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-orange-500">
                        {isAdminSubdomain() ? 'Admin Giriş' : isResellerSubdomain() ? 'Bayi Giriş' : 'POS Giriş'}
                    </h1>
                    <p className="text-gray-400 mt-2">Kontrol paneline erişmek için oturum açın.</p>
                    <p className="text-xs text-gray-600 mt-2">Durum: {connectionStatus}</p>
                </div>

                {error && (
                    <div className={`p-3 border rounded text-sm text-center ${error.includes('başarılı') || error.includes('successful') ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-red-500/10 border-red-500 text-red-500'}`}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">E-Posta Adresiniz</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full mt-1 p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-white transition"
                            placeholder="E-Posta Adresinizi Giriniz"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300">Şifre</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full mt-1 p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-white transition"
                            placeholder="••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full p-3 font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-500 transition shadow-lg hover:shadow-orange-500/20 disabled:opacity-50"
                    >
                        {loading ? 'Lütfen bekleyin...' : 'Giriş Yap'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
