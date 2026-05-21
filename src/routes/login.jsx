import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import authSide from "@/assets/background_images/hero-serengeti.jpg";
import { Mail, Lock, Eye, ArrowRight } from "lucide-react";
import { toast } from "sonner";
export const Route = createFileRoute("/login")({
    head: () => ({
        meta: [{ title: "Sign In — SafariSmart" }],
    }),
    component: LoginPage,
});
function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  // Google sign-in handler
  const handleGoogleSignIn = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${import.meta.env?.VITE_API_BASE_URL || "http://localhost:5000"}/api/v1/auth/authorize/google`;
  };
  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success("Welcome back to the reserve.");
      navigate({ to: "/explore" });
    }
    catch (err) {
      toast.error(err?.message || "Could not sign in");
    }
    finally {
      setLoading(false);
    }
  };
    return (<div className="relative grid min-h-screen bg-[radial-gradient(circle_at_top,_rgba(201,162,39,0.12),_transparent_48%),linear-gradient(180deg,var(--color-cream),var(--color-background))] lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="relative hidden overflow-hidden lg:block">
        <img src={authSide} alt="Safari landscape" className="absolute inset-0 h-full w-full object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/80"/>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(201,162,39,0.22),transparent_45%)]"/>
        <div className="absolute inset-x-0 bottom-0 p-10 text-[var(--color-cream)]">
          <div className="eyebrow !text-[var(--color-cream)]/75">SafariSmart</div>
          <p className="mt-2 max-w-md font-display text-4xl leading-tight italic">
            Continue your expedition where you left it.
          </p>
          <p className="mt-4 max-w-sm text-sm text-[var(--color-cream)]/80">
            Real-time recommendations, routes, and bookings across Kenya's top attractions.
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center px-6 py-14 sm:px-10">
        <div className="w-full max-w-md rounded-[2rem] border border-[var(--color-gold)]/35 bg-card/85 p-8 shadow-[0_20px_60px_rgba(23,19,13,0.15)] backdrop-blur-sm sm:p-10">
          <Link to="/" className="eyebrow">SafariSmart</Link>
          <h1 className="mt-5 font-display text-4xl leading-tight sm:text-5xl">Kenya<br /><span className="italic">Safari Login</span></h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Sign in to continue planning, booking, and navigating your journey.
          </p>


          <form onSubmit={onSubmit} className="mt-9 space-y-6">
            <Field icon={<Mail className="h-4 w-4"/>} label="Email Address" type="email" value={email} onChange={setEmail} required/>
            <Field icon={<Lock className="h-4 w-4"/>} label="Password" type={show ? "text" : "password"} value={password} onChange={setPassword} required right={<button type="button" onClick={() => setShow((v) => !v)} className="text-muted-foreground" aria-label="Toggle password">
                  <Eye className="h-4 w-4"/>
                </button>}/>

            <button type="submit" disabled={loading} className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-ink)] px-7 py-3.5 text-sm uppercase tracking-widest text-[var(--color-cream)] transition hover:brightness-110 disabled:opacity-60">
              {loading ? "Entering…" : "Enter Expedition"}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5"/>
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--color-gold)] bg-white px-7 py-3.5 text-sm font-semibold text-black shadow hover:bg-gray-50"
            >
              <svg width="20" height="20" viewBox="0 0 48 48" className="mr-2"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C35.82 2.7 30.28 0 24 0 14.61 0 6.44 5.82 2.69 14.09l7.98 6.2C12.33 13.13 17.68 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.59C43.93 37.13 46.1 31.3 46.1 24.55z"/><path fill="#FBBC05" d="M10.67 28.29a14.5 14.5 0 0 1 0-8.58l-7.98-6.2A23.94 23.94 0 0 0 0 24c0 3.77.9 7.34 2.69 10.49l7.98-6.2z"/><path fill="#EA4335" d="M24 48c6.28 0 11.56-2.08 15.41-5.67l-7.19-5.59c-2.01 1.35-4.6 2.15-8.22 2.15-6.32 0-11.67-3.63-13.33-8.79l-7.98 6.2C6.44 42.18 14.61 48 24 48z"/></g></svg>
              Sign in with Google
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            New to the reserve?{" "}
            <Link to="/register" className="text-foreground underline underline-offset-4 decoration-[var(--color-gold)]">
              Create Account
            </Link>
          </p>
        </div>
      </main>
    </div>);
}
export function Field({ label, icon, right, value, onChange, ...rest }) {
    return (<label className="block">
      <span className="eyebrow">{label}</span>
      <div className="mt-2 flex items-center gap-3 rounded-2xl border border-border bg-background/70 px-3 py-2.5 transition focus-within:border-[var(--color-gold)] focus-within:ring-2 focus-within:ring-[var(--color-gold)]/20">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <input type={rest.type || "text"} {...rest} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground/60"/>
        {right}
      </div>
    </label>);
}
