import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Field } from "./login";
import { Mail, Lock, User, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import authSide from "@/assets/background_images/hero-serengeti.jpg";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
    head: () => ({ meta: [{ title: "Create Account — SafariSmart" }] }),
    component: RegisterPage,
});

const PW_RULES = [
    { label: "At least 8 characters", test: (p) => p.length >= 8 },
    { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
    { label: "One number", test: (p) => /\d/.test(p) },
    { label: "One special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function RegisterPage() {
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [pwFocused, setPwFocused] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    const pwValid = PW_RULES.every((r) => r.test(password));

    const submit = async (e) => {
        e.preventDefault();
        setFieldErrors({});
        if (!pwValid) {
            setFieldErrors({ password: "Password does not meet the requirements below." });
            return;
        }
        setLoading(true);
        try {
            await signUp(email, password, name);
            toast.success("Your expedition begins.");
            navigate({ to: "/explore" });
        }
        catch (err) {
            const apiFields = err?.details?.details?.password;
            if (apiFields) {
                setFieldErrors({ password: apiFields.join(" ") });
            } else {
                toast.error(err?.message || "Registration failed");
            }
        }
        finally {
            setLoading(false);
        }
    };

    return (<div className="relative grid min-h-screen bg-[radial-gradient(circle_at_top,_rgba(201,162,39,0.12),_transparent_48%),linear-gradient(180deg,var(--color-cream),var(--color-background))] lg:grid-cols-[0.95fr_1.05fr]">
      <main className="order-2 flex items-center justify-center px-6 py-14 sm:px-10 lg:order-1">
        <div className="w-full max-w-md rounded-[2rem] border border-[var(--color-gold)]/35 bg-card/85 p-8 shadow-[0_20px_60px_rgba(23,19,13,0.15)] backdrop-blur-sm sm:p-10">
          <Link to="/" className="eyebrow">SafariSmart</Link>
          <h1 className="mt-5 font-display text-4xl leading-tight sm:text-5xl">Begin Your<br /><span className="italic">Expedition</span></h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Create an account to plan itineraries, book lodges, and access the field guide.
          </p>

          <form onSubmit={submit} className="mt-9 space-y-6">
            <Field icon={<User className="h-4 w-4"/>} label="Full Name" value={name} onChange={setName} required/>
            <Field icon={<Mail className="h-4 w-4"/>} label="Email Address" type="email" value={email} onChange={setEmail} required/>

            <div className="space-y-2">
              <Field
                icon={<Lock className="h-4 w-4"/>}
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                required
                onFocus={() => setPwFocused(true)}
              />
              {fieldErrors.password && (
                <p className="text-xs text-red-600">{fieldErrors.password}</p>
              )}
              {(pwFocused || password.length > 0) && (
                <ul className="space-y-1 rounded-xl border border-border bg-muted/40 px-4 py-3">
                  {PW_RULES.map((r) => {
                    const ok = r.test(password);
                    return (
                      <li key={r.label} className={`flex items-center gap-2 text-xs ${ok ? "text-emerald-600" : "text-muted-foreground"}`}>
                        {ok
                          ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0"/>
                          : <Circle className="h-3.5 w-3.5 shrink-0"/>
                        }
                        {r.label}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <button type="submit" disabled={loading} className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-ink)] px-7 py-3.5 text-sm uppercase tracking-widest text-[var(--color-cream)] transition hover:brightness-110 disabled:opacity-60">
              {loading ? "Creating…" : "Create Account"}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5"/>
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already a member?{" "}
            <Link to="/login" className="text-foreground underline underline-offset-4 decoration-[var(--color-gold)]">
              Sign In
            </Link>
          </p>
        </div>
      </main>

      <aside className="relative order-1 hidden overflow-hidden lg:block lg:order-2">
        <img src={authSide} alt="Safari wildlife" className="absolute inset-0 h-full w-full object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/80"/>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(201,162,39,0.22),transparent_45%)]"/>
        <div className="absolute inset-x-0 bottom-0 p-10 text-[var(--color-cream)]">
          <div className="eyebrow !text-[var(--color-cream)]/75">Welcome</div>
          <p className="mt-2 max-w-md font-display text-4xl leading-tight italic">
            Your safari profile unlocks personalized routes, stays, and memories.
          </p>
        </div>
      </aside>
    </div>);
}
