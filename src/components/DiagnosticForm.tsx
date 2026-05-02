import React, { useState, useRef } from 'react';
import { DeviceCategory } from '../types';
import { runForensicAudit } from '../services/geminiService';
import { supabaseService } from '../services/supabaseService';
import { cacheService } from '../services/cacheService';
import { useApp } from '../providers/AppProvider';
import { TitanError, logError } from '../utils/errors';
import ToastNotification from './ToastNotification';

/**
 * DiagnosticForm — The main scan intake screen.
 *
 * HCI Design Rationale (mapped to lecture principles):
 *
 * VISIBILITY (Norman #3, Nielsen #1):
 *   - A 3-step progress indicator shows the user exactly where they are
 *     in the process at all times (Intake → Capture → Analyze).
 *
 * FEEDBACK (Shneiderman #3, Nielsen #1):
 *   - Status text updates live during the analysis ("Analyzing device...",
 *     "Saving results...").
 *   - Errors display as inline ToastNotification banners — not disruptive
 *     browser alert() dialogs.
 *
 * CONSTRAINTS (Norman #5, Shneiderman #5):
 *   - "Start Diagnosis" button is disabled until at least one photo is added.
 *   - A visible helper text message explains WHY it is disabled.
 *
 * CONSISTENCY (Shneiderman #1, Nielsen #4):
 *   - "Cancel" replaces jargon like "Abort" across the entire form.
 *   - "Start Diagnosis" replaces "Execute Audit" for plain English clarity.
 *
 * LEARNABILITY (Nielsen #6, SRS NFR-02):
 *   - Each section has a tooltip/hint explaining what is needed and why.
 */

const STEPS = ['Intake', 'Capture', 'Analyze'] as const;
type Step = 'intake' | 'camera' | 'synthesis';

const stepIndex: Record<Step, number> = {
  intake: 0,
  camera: 1,
  synthesis: 2,
};

const DiagnosticForm: React.FC<{ onSuccess: (log: unknown) => void; onCancel: () => void }> = ({
  onSuccess,
  onCancel,
}) => {
  const { refreshState } = useApp();
  const [step, setStep] = useState<Step>('intake');
  const [images, setImages] = useState<string[]>([]);
  const [category, setCategory] = useState<DeviceCategory>(DeviceCategory.PHONE);
  const [desc, setDesc] = useState('');
  const [manualName, setManualName] = useState('');
  const [status, setStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    setStep('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setErrorMsg('Camera is not available. Please upload a photo instead.');
      setStep('intake');
    }
  };

  const capture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      setImages(prev => [...prev, canvas.toDataURL('image/jpeg', 0.8)]);
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      setStep('intake');
    }
  };

  const cancelCamera = () => {
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) stream.getTracks().forEach(t => t.stop());
    }
    setStep('intake');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    }
    e.target.value = '';
  };

  const handleAudit = async () => {
    if (images.length === 0) return;
    setErrorMsg(null);
    setStep('synthesis');
    setStatus('Getting your location...');

    let location = undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 3000,
          enableHighAccuracy: false,
        });
      });
      location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    } catch {
      // Location denied or timed out — proceed with global defaults
    }

    const cachedResult = cacheService.get(category, desc, images, location?.latitude, location?.longitude);

    try {
      let result;
      if (cachedResult) {
        setStatus('Loading saved results...');
        result = cachedResult;
      } else {
        setStatus('Analyzing your device...');
        result = await runForensicAudit(category, desc, images, location, manualName);
        cacheService.set(category, desc, images, result, location?.latitude, location?.longitude);
      }

      setStatus('Saving results...');
      const log = await supabaseService.saveLog(category, desc, images, result);
      await refreshState();
      onSuccess(log);
    } catch (e) {
      logError(e, 'DiagnosticForm.handleAudit');

      let msg = 'Analysis failed. Please try again.';
      if (e instanceof TitanError) {
        msg = e.userMessage;
      } else if (e instanceof Error && e.message.includes('429')) {
        msg = 'System is at capacity. Please try again in 1 minute.';
      } else if (e instanceof Error) {
        msg = 'Something went wrong. Please check your connection and try again.';
      }

      setStep('intake');
      setErrorMsg(msg);
    }
  };

  // ── SYNTHESIS SCREEN ────────────────────────────────────────────────────────
  if (step === 'synthesis') return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-10 text-center">
      <div className="w-16 h-16 border-2 border-primary border-t-transparent animate-spin mb-8" />
      <h2 className="text-2xl font-black uppercase italic tracking-tighter text-black dark:text-white">Analyzing</h2>
      <p className="text-[10px] font-bold text-primary uppercase tracking-[0.5em] mt-2">{status}</p>
    </div>
  );

  // ── CAMERA SCREEN ────────────────────────────────────────────────────────────
  if (step === 'camera') return (
    <div className="fixed inset-0 bg-black z-[300] flex flex-col">
      <div className="relative flex-1 bg-black">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale" />
        <div className="camera-crosshair-h" />
        <div className="camera-crosshair-v" />
      </div>
      <div className="h-48 bg-black border-t border-white/10 flex flex-col items-center justify-center gap-4 px-6">
        <button
          onClick={capture}
          aria-label="Capture photo"
          className="w-20 h-20 rounded-full border-4 border-primary p-1 active:scale-95 transition-all shadow-lg shadow-primary/50"
        >
          <div className="w-full h-full bg-primary rounded-full" />
        </button>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Tap to Capture</p>
        <button
          onClick={cancelCamera}
          className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors mt-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  // ── INTAKE FORM ───────────────────────────────────────────────────────────────
  const currentStepIdx = stepIndex[step];

  return (
    <div className="p-6 pb-40 space-y-8 animate-in slide-in-from-bottom-8">

      {/* ── HCI: VISIBILITY — Step Progress Indicator (Norman #3, Nielsen #1) ── */}
      <nav aria-label="Diagnostic steps" className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <div className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border transition-all ${
                i <= currentStepIdx
                  ? 'bg-primary border-primary text-white'
                  : 'border-border-light dark:border-white/20 text-black/30 dark:text-white/30'
              }`}>
                {i < currentStepIdx
                  ? <span className="material-symbols-outlined text-sm leading-none">check</span>
                  : i + 1}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${
                i === currentStepIdx ? 'text-primary' : 'opacity-30'
              }`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px transition-colors ${i < currentStepIdx ? 'bg-primary' : 'bg-border-light dark:bg-white/10'}`} />
            )}
          </React.Fragment>
        ))}
      </nav>

      <header className="flex justify-between items-end">
        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-black dark:text-white transition-colors">
          Intake<br /><span className="text-primary">Source</span>
        </h2>
        <button onClick={onCancel} className="text-[10px] font-black opacity-30 uppercase italic tracking-widest mb-2">
          Cancel
        </button>
      </header>

      {/* ── HCI: FEEDBACK — Inline error banner replaces alert() (Shneiderman #3, Nielsen #9) ── */}
      {errorMsg && (
        <ToastNotification
          message={errorMsg}
          type="error"
          onDismiss={() => setErrorMsg(null)}
        />
      )}

      {/* ── PHOTO SECTION ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 px-1">Visual Telemetry</p>
          {/* HCI: LEARNABILITY — Hint text (Nielsen #10) */}
          <span
            title="Capture or upload 1–5 clear photos of the device. Good lighting improves accuracy."
            className="material-symbols-outlined text-sm opacity-20 hover:opacity-60 cursor-help transition-opacity"
          >
            help
          </span>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
          {images.map((img, i) => (
            <div
              key={i}
              className="relative w-32 h-44 shrink-0 border border-border-light dark:border-white/10 bg-panel-light dark:bg-white/5 overflow-hidden group"
            >
              <img src={img} className="w-full h-full object-cover grayscale transition-all group-hover:grayscale-0" alt={`Device photo ${i + 1}`} />
              <button
                onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute top-2 right-2 bg-black/80 p-1 text-[10px] uppercase font-black text-white"
              >
                Remove
              </button>
            </div>
          ))}

          <div className="flex gap-3">
            <button
              onClick={startCamera}
              aria-label="Open camera"
              className="w-32 h-44 shrink-0 border border-dashed border-border-light dark:border-white/20 flex flex-col items-center justify-center gap-2 hover:border-primary group transition-all"
            >
              <span className="material-symbols-outlined text-3xl opacity-30 group-hover:opacity-100 group-hover:scale-110">photo_camera</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-center px-2">Use Camera</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload photo from device"
              className="w-32 h-44 shrink-0 border border-dashed border-border-light dark:border-white/20 flex flex-col items-center justify-center gap-2 hover:border-terminal-green group transition-all"
            >
              <span className="material-symbols-outlined text-3xl opacity-30 group-hover:opacity-100 group-hover:scale-110">upload_file</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-center px-2">Upload Photo</span>
            </button>
          </div>

          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
        </div>
      </section>

      {/* ── CATEGORY SECTION ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 px-1">Device Type</p>
          <span
            title="Select the type of device you are scanning. If unsure, the AI will correct a mismatch automatically."
            className="material-symbols-outlined text-sm opacity-20 hover:opacity-60 cursor-help transition-opacity"
          >
            help
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.values(DeviceCategory).map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              aria-pressed={category === cat}
              className={`p-4 text-[10px] font-black uppercase tracking-widest border transition-all ${
                category === cat
                  ? 'bg-primary text-white border-primary shadow-[0_0_20px_rgba(19,127,236,0.3)]'
                  : 'bg-panel-light dark:bg-white/5 text-black dark:text-white/40 border-border-light dark:border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ── DESCRIPTION SECTION ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 px-1">Describe the Issue</p>
          <span
            title="Optional but recommended. Describe what's wrong: e.g. 'screen cracked', 'won't charge', 'overheats'. The more detail, the better the diagnosis."
            className="material-symbols-outlined text-sm opacity-20 hover:opacity-60 cursor-help transition-opacity"
          >
            help
          </span>
        </div>
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="e.g. Screen cracked in the corner, device won't charge..."
          className="w-full h-32 bg-panel-light dark:bg-black border border-border-light dark:border-white/10 p-4 font-mono text-xs outline-none focus:border-primary text-black dark:text-white placeholder:opacity-40"
        />
      </section>

      {/* ── OPTIONAL DEVICE NAME ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 px-1">Device Name (Optional)</p>
          <span
            title="If you already know the model, enter it here (e.g. 'iPhone 13 Pro Max'). This speeds up the AI identification."
            className="material-symbols-outlined text-sm opacity-20 hover:opacity-60 cursor-help transition-opacity"
          >
            help
          </span>
        </div>
        <input
          type="text"
          value={manualName}
          onChange={e => setManualName(e.target.value)}
          placeholder="e.g. iPhone 13 Pro Max (speeds up analysis)"
          className="w-full bg-panel-light dark:bg-black border border-border-light dark:border-white/10 p-4 font-mono text-xs outline-none focus:border-primary text-black dark:text-white placeholder:opacity-40"
        />
      </section>

      {/* ── HCI: CONSTRAINTS — Disabled state with helper text (Norman #5, Shneiderman #5) ── */}
      <div className="space-y-2">
        {images.length === 0 && (
          <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest text-center animate-in fade-in">
            Add at least one photo to continue
          </p>
        )}
        <button
          disabled={images.length === 0}
          onClick={handleAudit}
          className="w-full bg-black dark:bg-white text-white dark:text-black py-6 font-black uppercase tracking-[0.4em] italic shadow-glow disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          Start Diagnosis
        </button>
      </div>
    </div>
  );
};

export default DiagnosticForm;
