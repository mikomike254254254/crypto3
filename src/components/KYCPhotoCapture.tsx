import { useEffect, useRef, useState } from "react";
import { Camera, Check, Upload, X } from "lucide-react";

interface KYCPhotoCaptureProps {
  label: string;
  value?: string;
  facingMode?: "user" | "environment";
  onCapture: (dataUrl: string) => void;
}

export function KYCPhotoCapture({ label, value, facingMode = "environment", onCapture }: KYCPhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!cameraOpen) {
      return;
    }

    let mounted = true;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode }, audio: false })
      .then((stream) => {
        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Camera permission is required.");
      });

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [cameraOpen, facingMode]);

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    onCapture(canvas.toDataURL("image/jpeg", 0.86));
    setCameraOpen(false);
  };

  const handleFile = (file?: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onCapture(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">{label}</label>
      <div className={`rounded-xl border-2 border-dashed overflow-hidden ${value ? "border-green-500 bg-green-50" : "border-neutral-300 bg-neutral-50"}`}>
        {value ? (
          <div className="p-3">
            <img src={value} alt={label} className="w-full h-36 object-cover rounded-lg mb-3" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700 font-medium flex items-center gap-2">
                <Check className="w-4 h-4" />
                Captured
              </span>
              <button onClick={() => setCameraOpen(true)} className="text-xs font-medium text-black">Retake</button>
            </div>
          </div>
        ) : (
          <div className="p-5 flex flex-col items-center gap-3">
            <Camera className="w-8 h-8 text-gray-400" />
            <div className="flex gap-2">
              <button onClick={() => setCameraOpen(true)} className="bg-black text-white rounded-xl px-4 py-2 text-xs font-semibold">
                Use Camera
              </button>
              <button onClick={() => fileRef.current?.click()} className="bg-white text-black border border-neutral-200 rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                Upload
              </button>
            </div>
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />

      {cameraOpen && (
        <div className="fixed inset-0 bg-black/80 z-[80] flex items-end">
          <div className="w-full bg-white rounded-t-3xl overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-neutral-100">
              <h2 className="text-base font-bold text-black">{label}</h2>
              <button onClick={() => setCameraOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-4">
              <video ref={videoRef} autoPlay muted playsInline className="w-full aspect-[3/4] bg-black object-cover rounded-2xl" />
              {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
              <button onClick={captureFrame} className="w-full mt-4 bg-black text-white rounded-xl py-4 text-sm font-semibold">
                Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
