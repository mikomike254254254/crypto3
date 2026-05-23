import { useState } from "react";
import { AlertCircle, Camera, Check, CreditCard, FileText, Shield, User, X } from "lucide-react";
import { KYCPhotoCapture } from "./KYCPhotoCapture";
import { submitKycToBackend } from "../services/walletBackend";

interface KycModalProps {
  onClose: () => void;
  onComplete?: () => void;
}

const documents = [
  { id: "passport", name: "Passport", description: "International travel document" },
  { id: "id", name: "National ID", description: "Government issued ID card" },
  { id: "license", name: "Driver's License", description: "Valid driving license" },
];

export function KYCModal({ onClose, onComplete }: KycModalProps) {
  const [step, setStep] = useState(1);
  const [documentType, setDocumentType] = useState("id");
  const [legalName, setLegalName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [frontImage, setFrontImage] = useState("");
  const [backImage, setBackImage] = useState("");
  const [selfieImage, setSelfieImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const steps = [
    { id: 1, icon: User },
    { id: 2, icon: FileText },
    { id: 3, icon: Camera },
    { id: 4, icon: Shield },
  ];

  const submitKyc = async () => {
    if (!frontImage || !backImage || !selfieImage) {
      setError("Please capture document front, document back, and selfie.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await submitKycToBackend({
        documentType,
        legalName,
        dateOfBirth,
        country,
        address,
        frontImage,
        backImage,
        selfieImage,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "KYC submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const finish = () => {
    onComplete?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end" style={{ backdropFilter: "blur(4px)" }}>
      <div className="w-full bg-white rounded-t-3xl max-h-[92%] overflow-hidden flex flex-col" style={{ boxShadow: "0 -10px 50px rgba(0, 0, 0, 0.25)" }}>
        <div className="sticky top-0 bg-white border-b border-neutral-100 px-4 py-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-black">Identity Verification</h2>
              <p className="text-xs text-gray-500">Camera capture and secure review</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full active:bg-neutral-200 transition-all active:scale-90">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-100">
          <div className="flex items-center justify-between">
            {steps.map((item, index) => (
              <div key={item.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= item.id ? "bg-black" : "bg-neutral-200"}`}>
                  {step > item.id ? <Check className="w-4 h-4 text-white" /> : <item.icon className={`w-4 h-4 ${step >= item.id ? "text-white" : "text-gray-500"}`} />}
                </div>
                {index < steps.length - 1 && <div className={`w-8 h-0.5 mx-1 ${step > item.id ? "bg-black" : "bg-neutral-200"}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Full Legal Name</label>
                <input value={legalName} onChange={(event) => setLegalName(event.target.value)} type="text" placeholder="Enter your full name" className="w-full bg-neutral-50 rounded-xl py-3.5 px-4 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black border border-neutral-200" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Date of Birth</label>
                <input value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} type="date" className="w-full bg-neutral-50 rounded-xl py-3.5 px-4 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black border border-neutral-200" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Country of Residence</label>
                <input value={country} onChange={(event) => setCountry(event.target.value)} type="text" placeholder="Country" className="w-full bg-neutral-50 rounded-xl py-3.5 px-4 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black border border-neutral-200" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Address</label>
                <textarea value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Enter your full address" rows={3} className="w-full bg-neutral-50 rounded-xl py-3.5 px-4 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black border border-neutral-200 resize-none" />
              </div>
              <button onClick={() => setStep(2)} className="w-full bg-black rounded-2xl py-4 text-white font-semibold text-sm hover:bg-neutral-800 transition-all active:scale-[0.98]">
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">Allow camera access and capture clear document photos. All corners should be visible.</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Select Document Type</label>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <button key={doc.id} onClick={() => setDocumentType(doc.id)} className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${documentType === doc.id ? "border-black bg-neutral-50" : "border-neutral-200"}`}>
                      <div className="text-left">
                        <p className="text-sm font-medium text-black">{doc.name}</p>
                        <p className="text-xs text-gray-500">{doc.description}</p>
                      </div>
                      <CreditCard className="w-5 h-5 text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>

              <KYCPhotoCapture label="Document Front" value={frontImage} onCapture={setFrontImage} />
              <KYCPhotoCapture label="Document Back" value={backImage} onCapture={setBackImage} />

              <button onClick={() => setStep(3)} disabled={!documentType || !frontImage || !backImage} className="w-full bg-black rounded-2xl py-4 text-white font-semibold text-sm hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:bg-neutral-300 disabled:cursor-not-allowed">
                Continue
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <KYCPhotoCapture label="Selfie Verification" value={selfieImage} facingMode="user" onCapture={setSelfieImage} />
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-800 mb-1">Photo Guidelines</p>
                <ul className="text-xs text-amber-700 space-y-1">
                  <li>- Ensure good lighting on your face</li>
                  <li>- Remove glasses and hats</li>
                  <li>- Face the camera directly</li>
                  <li>- Keep a neutral expression</li>
                </ul>
              </div>
              <button onClick={() => setStep(4)} disabled={!selfieImage} className="w-full bg-black rounded-2xl py-4 text-white font-semibold text-sm hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:bg-neutral-300 disabled:cursor-not-allowed">
                Review
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              {submitted ? (
                <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-6 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-black">Verification Submitted</h3>
                  <p className="text-sm text-neutral-600 mt-2 text-center">Your documents are stored securely and queued for review.</p>
                </div>
              ) : (
                <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                  <h3 className="text-sm font-semibold text-black mb-3">Ready to submit</h3>
                  <div className="space-y-2 text-xs text-gray-600">
                    <p>Document: {documents.find((doc) => doc.id === documentType)?.name}</p>
                    <p>Legal name: {legalName || "Not provided"}</p>
                    <p>Country: {country || "Not provided"}</p>
                    <p>Photos: front, back, and selfie captured</p>
                  </div>
                </div>
              )}

              {error && <p className="text-xs text-red-600">{error}</p>}

              <button onClick={submitted ? finish : submitKyc} disabled={isSubmitting} className="w-full bg-black rounded-2xl py-4 text-white font-semibold text-sm hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:bg-neutral-300">
                {submitted ? "Done" : isSubmitting ? "Submitting..." : "Submit for review"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
