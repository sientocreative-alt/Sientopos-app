import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    // Start with loading TRUE so we wait for session check
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);

    // Helper to fetch profile and merge with user
    const fetchProfileAndSetUser = async (session) => {
        if (!session) {
            setSession(null);
            setUser(null);
            setLoading(false);
            return;
        }

        // Only set loading to true if we don't have a user yet to avoid full screen flickering on every update
        if (!user) setLoading(true);

        try {
            console.log("Fetching profile for user:", session.user.id);

            // Parallel fetch for Profile and Reseller (optimization)
            const [profileRes, resellerRes] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
                supabase.from('resellers').select('*').eq('id', session.user.id).maybeSingle()
            ]);

            const profile = profileRes.data;
            const resellerInfo = resellerRes.data;

            // Role recognition
            const isSuperAdmin = session.user?.app_metadata?.role === 'super_admin' || session.user?.user_metadata?.role === 'super_admin';
            const isResellerRole = session.user?.app_metadata?.role === 'reseller' || session.user?.user_metadata?.role === 'reseller' || !!resellerInfo;

            if (!profile && !resellerInfo && !isSuperAdmin) {
                console.error("No profile/reseller found. Security logout triggered.");
                await supabase.auth.signOut();
                setSession(null);
                setUser(null);
                setLoading(false);
                return;
            }

            // ... business settings logic ...
            let businessName = '';
            let logoUrl = '';

            if (profile?.business_id) {
                const { data: settings } = await supabase
                    .from('pos_settings')
                    .select('full_name, business_display_name, logo_url')
                    .eq('business_id', profile.business_id)
                    .maybeSingle();

                if (settings) {
                    businessName = settings.business_display_name || settings.full_name;
                    logoUrl = settings.logo_url;
                }
            }

            // Suspension & Expiry Logic (only for business users)
            let businessStatus = 'active';
            let businessPlan = 'monthly';
            let trialEnd = null;
            let subEnd = null;

            if (profile?.business_id) {
                const { data: businessData } = await supabase
                    .from('businesses')
                    .select('status, subscription_plan, trial_end_date, subscription_end_date')
                    .eq('id', profile.business_id)
                    .maybeSingle();

                if (businessData) {
                    businessStatus = businessData.status;
                    businessPlan = businessData.subscription_plan;
                    trialEnd = businessData.trial_end_date;
                    subEnd = businessData.subscription_end_date;
                }
            }

            const now = new Date();
            let isExpired = false;

            if (businessPlan === 'trial' && trialEnd) {
                if (now > new Date(trialEnd)) isExpired = true;
            } else if (subEnd) {
                if (now > new Date(subEnd)) isExpired = true;
            }

            const isAccessRestricted = !isSuperAdmin && !isResellerRole && (businessStatus === 'suspended' || isExpired);

            const enhancedUser = {
                ...session.user,
                ...profile,
                ...resellerInfo,
                full_name: businessName || resellerInfo?.company_name || profile?.full_name || session.user.email?.split('@')[0],
                business_name: businessName,
                logo_url: logoUrl,
                business_status: businessStatus,
                subscription_plan: businessPlan,
                is_super_admin: isSuperAdmin,
                is_reseller: isResellerRole,
                is_access_restricted: isAccessRestricted
            };

            setSession(session);
            setUser(enhancedUser);
        } catch (error) {
            console.error("Auth initialization error:", error);
            setSession(session);
            setUser(session.user);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;

        // 1. Initial Check
        const initAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (mounted) await fetchProfileAndSetUser(session);
        };
        initAuth();

        // 2. Listen for changes (Login, Logout, Auto-refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) fetchProfileAndSetUser(session);
        });

        // 3. Listen for pos_settings changes (Realtime)
        const settingsSubscription = supabase
            .channel('pos_settings_changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'pos_settings',
                },
                (payload) => {
                    if (mounted) {
                        // We check the session directly to see if we should refresh
                        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
                            if (currentSession) fetchProfileAndSetUser(currentSession);
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            mounted = false;
            subscription.unsubscribe();
            settingsSubscription.unsubscribe();
        };
    }, []);

    const login = async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) return { success: false, message: error.message };
            return { success: true, data };
        } catch (err) {
            return { success: false, message: "Bağlantı hatası: " + err.message };
        }
    };

    const loginReseller = async (resellerCode, username, password) => {
        try {
            // 1. Find the reseller's email using code and username
            const { data: reseller, error: fetchError } = await supabase
                .from('resellers')
                .select('email, status')
                .eq('reseller_code', resellerCode)
                .eq('username', username)
                .maybeSingle();

            if (fetchError) throw fetchError;
            if (!reseller) {
                return { success: false, message: "Hatalı Bayi Kodu veya Kullanıcı Adı." };
            }

            if (reseller.status !== 'active') {
                return { success: false, message: "Hesabınız askıya alınmış veya pasif durumda." };
            }

            // 2. Perform regular login with resolved email
            return await login(reseller.email, password);
        } catch (err) {
            console.error("Reseller login error:", err);
            return { success: false, message: "Giriş yapılırken bir hata oluştu: " + err.message };
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        return { success: true };
    };

    const signUp = async (email, password, metadata) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: metadata }
        });
        if (error) return { success: false, message: error.message };
        return { success: true, data };
    }

    return (
        <AuthContext.Provider value={{ session, user, login, loginReseller, logout, signUp, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
