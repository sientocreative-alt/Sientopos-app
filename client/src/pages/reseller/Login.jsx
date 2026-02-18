import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Hash, User, Lock, ArrowRight, ShieldCheck, Building2 } from 'lucide-react';

const ResellerLogin = () => {
    const [resellerCode, setResellerCode] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { loginReseller, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && user.is_reseller) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await loginReseller(resellerCode, username, password);
            if (!result.success) throw new Error(result.message);
            toast.success('Başarıyla giriş yapıldı!');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 selection:bg-indigo-600/10 font-sans">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full"></div>
            </div>

            <div className="max-w-md w-full space-y-10 relative">
                {/* Logo & Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-white border border-slate-200 shadow-xl shadow-slate-200 mb-2 group hover:scale-110 transition-transform duration-500">
                        <Building2 size={44} className="text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
                            Siento<span className="text-indigo-600 text-3xl font-black italic">POS</span>
                        </h2>
                        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] mt-2 opacity-70">
                            Bayi Yetkilendirme Merkezi
                        </p>
                    </div>
                </div>

                {/* Login Card */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl shadow-indigo-100/50 space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>

                    <div className="text-center">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Kurumsal Giriş</h3>
                        <p className="text-slate-400 text-[10px] font-bold mt-2 uppercase tracking-widest italic leading-relaxed">Güvenli erişim için kimlik verilerinizi doğrulayın.</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div className="space-y-5">
                            {/* Bayi Kodu */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sistem Bayi Kodu</label>
                                <div className="relative group">
                                    <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/30 transition-all font-black text-sm uppercase tracking-wider"
                                        placeholder="Örn: BY-1001"
                                        value={resellerCode}
                                        onChange={(e) => setResellerCode(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Kullanıcı Adı */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Yetkili Kullanıcı Adı</label>
                                <div className="relative group">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/30 transition-all font-black text-sm"
                                        placeholder="Yetkili adınız"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Şifre */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Erişim Şifresi</label>
                                <div className="relative group">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/30 transition-all font-black text-sm"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 group active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 uppercase text-xs tracking-[0.2em]"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    OTURUMU BAŞLAT
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-60">
                    <span>© 2026 SientoPOS</span>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span>SSL GÜVENLİK AKTİF</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResellerLogin;
