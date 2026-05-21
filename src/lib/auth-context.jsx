import { createContext, useContext, useEffect, useState } from "react";
import { auth, getToken, setToken } from "./api";
const Ctx = createContext(null);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const t = getToken();
        if (!t) {
            setLoading(false);
            return;
        }
        auth
            .me()
            .then((u) => setUser(u?.user ?? u))
            .catch(() => setToken(null))
            .finally(() => setLoading(false));
    }, []);
    const signIn = async (email, password) => {
        const r = await auth.login(email, password);
        if (r?.access_token)
            setToken(r.access_token);
        setUser(r?.user ?? { email });
    };
    const signUp = async (email, password, full_name) => {
        // Derive a base username from the email prefix (alphanumeric only),
        // then append a 4-digit random suffix so it's very unlikely to collide.
        // The backend will still auto-increment if it does.
        const base = email.split("@")[0].replace(/[^A-Za-z0-9]/g, "").toLowerCase() || "user";
        const username = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
        await auth.register({ email, password, username, full_name });
        await signIn(email, password);
    };
    const signOut = () => {
        setToken(null);
        setUser(null);
    };
    return (<Ctx.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </Ctx.Provider>);
}
export function useAuth() {
    const v = useContext(Ctx);
    if (!v)
        throw new Error("useAuth must be used inside AuthProvider");
    return v;
}
