import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Field } from "./login";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import authSide from "@/assets/background_images/hero-serengeti.jpg";
import { toast } from "sonner";
export const Route = createFileRoute("/register")({
    head: () => ({ meta: [{ title: "Create Account — SafariSmart" }] }),
    component: RegisterPage,
});
function RegisterPage() {
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signUp(email, password, name);
            toast.success("Your expedition begins.");
            navigate({ to: "/explore" });
        }
        catch (err) {
            toast.error(err?.message || "Registration failed");
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
            <Field icon={<Lock className="h-4 w-4"/>} label="Password" type="password" value={password} onChange={setPassword} required minLength={8}/>

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
