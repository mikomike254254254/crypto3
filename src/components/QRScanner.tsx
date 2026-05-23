import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { Camera, X } from "lucide-react";

interface QRScannerProps {
  onResult: (value: string) => void;
  onClose: () => void;
}

export function QRScanner({ onResult, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const reader = new BrowserQRCodeReader();
    if (!videoRef.current) {
      setError("Camera preview is not ready.");
      return;
    }

    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result, err, controls) => {
        if (controls && !controlsRef.current) {
          controlsRef.current = controls;
        }

        if (result && isMounted) {
          controlsRef.current?.stop();
          onResult(result.getText());
        }

        if (err && err.name === "NotAllowedError") {
          setError("Camera permission was denied.");
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Camera could not start.");
        }
      });

    return () => {
      isMounted = false;
      controlsRef.current?.stop();
    };
  }, [onResult]);

  return (
    <div className="fixed inset-0 bg-black/80 z-[70] flex items-end">
      <div className="w-full bg-white rounded-t-3xl overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-black" />
            <h2 className="text-base font-bold text-black">Scan QR Code</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-square">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            <div className="absolute inset-8 border-2 border-white rounded-2xl" />
          </div>

          {error ? (
            <p className="text-xs text-red-600 mt-3">{error}</p>
          ) : (
            <p className="text-xs text-gray-500 mt-3">Allow camera access, then point the camera at a Wallex QR code.</p>
          )}
        </div>
      </div>
    </div>
  );
}
