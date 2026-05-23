import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface EmailOtpVerificationProps {
  email: string;
  name: string;
  password: string;
  onVerified: () => void;
  onBack: () => void;
}

export function EmailOtpVerification({ email, name, password, onVerified, onBack }: EmailOtpVerificationProps) {
  const { verifySignUpOtp, completeSignUpProfile, sendSignUpOtp } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);

  const verify = async () => {
    if (code.trim().length < 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await verifySignUpOtp(email, code.trim());
      if (password.length >= 6) {
        await completeSignUpProfile(password, name);
      }
      onVerified();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setLoading(true);
    setError("");
    try {
      await sendSignUpOtp(email);
      setResent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-cyan-200 bg-cyan-50/80 p-4 text-sm text-cyan-900">
        <p className="font-semibold flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Check your email
        </p>
        <p className="mt-1 text-cyan-800/90">We sent a 6-digit verification code to <strong>{email}</strong></p>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {resent ? <p className="text-sm text-emerald-600">New code sent.</p> : null}

      <input
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        placeholder="000000"
        className="w-full rounded-[1.25rem] border border-slate-200 px-4 py-3 text-center text-lg tracking-[0.35em] font-semibold"
      />

      <button
        type="button"
        onClick={verify}
        disabled={loading}
        className="w-full rounded-[1.25rem] bg-slate-950 text-white py-3.5 text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? "Verifying..." : "Verify & open wallet"}
      </button>

      <div className="flex gap-2 text-sm">
        <button type="button" onClick={onBack} className="flex-1 text-slate-500 hover:text-slate-950">
          Back
        </button>
        <button type="button" onClick={resend} disabled={loading} className="flex-1 text-cyan-700 font-semibold hover:text-cyan-900">
          Resend code
        </button>
      </div>
    </div>
  );
}
