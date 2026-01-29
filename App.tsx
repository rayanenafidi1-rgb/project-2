
import React, { useState, useRef } from 'react';
import { AppState, WasteAnalysis } from './types';
import { analyzeWaste } from './services/geminiService';
import { CameraIcon, UploadIcon, RefreshIcon, CheckIcon, XIcon } from './components/Icons';

const TrashIllustration = () => (
  <svg viewBox="0 0 200 200" className="w-48 h-48 drop-shadow-md">
    <circle cx="100" cy="100" r="90" fill="#ecfdf5" />
    <path d="M70 70h60l-5 80H75L70 70z" fill="#10b981" />
    <path d="M65 60h70a5 5 0 0 1 5 5v5H60v-5a5 5 0 0 1 5-5z" fill="#059669" />
    <rect x="90" y="50" width="20" height="10" rx="2" fill="#065f46" />
    <path d="M90 90l10 10 10-10" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M85 110h30" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
    <path d="M85 125h30" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
  </svg>
);

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('idle');
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<WasteAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      setState('capturing');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Unable to access camera. Please check permissions.");
      setState('error');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Use actual video dimensions for capture
      const vWidth = video.videoWidth;
      const vHeight = video.videoHeight;
      canvas.width = vWidth;
      canvas.height = vHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, vWidth, vHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setImage(dataUrl);
        stopCamera();
        processAnalysis(dataUrl);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setImage(dataUrl);
        processAnalysis(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const processAnalysis = async (base64: string) => {
    setState('analyzing');
    setError(null);
    try {
      const result = await analyzeWaste(base64);
      setAnalysis(result);
      setState('result');
    } catch (err) {
      setError("AI analysis failed. Please try a different photo.");
      setState('error');
    }
  };

  const reset = () => {
    stopCamera();
    setImage(null);
    setAnalysis(null);
    setError(null);
    setState('idle');
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col bg-slate-50 shadow-2xl overflow-hidden font-sans">
      {/* Header */}
      <header className="p-8 bg-emerald-600 text-white text-center rounded-b-[2.5rem] shadow-lg relative z-10">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full border-8 border-white"></div>
          <div className="absolute -bottom-10 -right-10 w-60 h-60 rounded-full border-8 border-white"></div>
        </div>
        <h1 className="text-3xl font-extrabold flex items-center justify-center gap-3">
          <span className="text-4xl filter drop-shadow-md">♻️</span> 
          <span className="tracking-tight">EcoScan</span>
        </h1>
        <p className="text-emerald-100 text-sm mt-2 font-medium tracking-wide uppercase">Waste Classifier AI</p>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow p-6 flex flex-col items-center justify-center relative">
        {state === 'idle' && (
          <div className="text-center space-y-10 animate-fade-in w-full">
            <div className="flex justify-center">
              <TrashIllustration />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-800">Scan Your Trash</h2>
              <p className="text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                Wondering if it's glass, plastic, or paper? Snap a photo to find out instantly.
              </p>
            </div>
            <div className="flex flex-col gap-4 w-full max-w-[300px] mx-auto">
              <button 
                onClick={startCamera}
                className="group flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-5 px-8 rounded-2xl transition-all active:scale-95 shadow-[0_8px_30px_rgb(16,185,129,0.3)]"
              >
                <CameraIcon /> 
                <span>Open Camera</span>
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-emerald-500 text-slate-600 font-bold py-4 px-8 rounded-2xl transition-all shadow-sm"
              >
                <UploadIcon /> 
                <span>Upload Gallery</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept="image/*"
              />
            </div>
          </div>
        )}

        {state === 'capturing' && (
          <div className="relative w-full aspect-[3/4] rounded-[2.5rem] overflow-hidden bg-black shadow-2xl border-4 border-white">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 pointer-events-none">
               <div className="absolute inset-0 border-[40px] border-black/20"></div>
               <div className="absolute inset-[40px] border border-white/30 rounded-3xl"></div>
            </div>
            <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-8 px-6">
              <button 
                onClick={reset}
                className="bg-white/20 backdrop-blur-xl p-4 rounded-full text-white hover:bg-white/30 transition-colors"
              >
                <XIcon />
              </button>
              <button 
                onClick={capturePhoto}
                className="w-24 h-24 bg-white rounded-full border-8 border-emerald-500/20 flex items-center justify-center transition-all active:scale-90 shadow-2xl"
              >
                <div className="w-16 h-16 bg-emerald-500 rounded-full shadow-inner"></div>
              </button>
              <div className="w-12 h-12"></div> {/* Spacer for balance */}
            </div>
          </div>
        )}

        {(state === 'analyzing' || state === 'result' || state === 'error') && image && (
          <div className="w-full space-y-8 animate-fade-in">
            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl h-72 border-4 border-white group">
              <img src={image} alt="Analyzed Trash" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              {state === 'analyzing' && (
                <div className="absolute inset-0 bg-emerald-900/60 backdrop-blur-md flex flex-col items-center justify-center text-white p-8 text-center">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl">♻️</span>
                    </div>
                  </div>
                  <h4 className="font-bold text-xl mt-6 tracking-tight">Analyzing Material</h4>
                  <p className="text-sm text-emerald-200 mt-2 opacity-80">Consulting AI for waste classification...</p>
                </div>
              )}
            </div>

            {state === 'result' && analysis && (
              <div className="space-y-6 animate-slide-up">
                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    <div className={`p-4 rounded-full shadow-sm ${analysis.isRecyclable ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {analysis.isRecyclable ? <CheckIcon /> : <XIcon />}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Primary Detection</span>
                    <h3 className="text-4xl font-black text-slate-800 tracking-tighter">{analysis.mainMaterial}</h3>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Confidence Scores</p>
                       <span className="text-[10px] text-slate-300 font-medium">REAL-TIME DATA</span>
                    </div>
                    {Object.entries(analysis.confidences).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-tight">
                          <span className={key.toLowerCase() === analysis.mainMaterial.toLowerCase() ? 'text-emerald-600' : ''}>{key}</span>
                          <span>{Math.round(value as number)}%</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className={`h-full transition-all duration-1000 ease-out rounded-full ${
                              key.toLowerCase() === analysis.mainMaterial.toLowerCase() 
                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                                : 'bg-slate-200'
                            }`}
                            style={{ width: `${value as number}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex gap-4 items-start shadow-sm">
                    <div className="bg-emerald-100 p-2 rounded-lg text-xl">💡</div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Recycling Advice</p>
                      <p className="text-sm text-emerald-700 leading-relaxed font-medium">{analysis.recyclingTip}</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={reset}
                  className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-900 text-white font-bold py-5 rounded-[1.5rem] shadow-2xl transition-all active:scale-95 group"
                >
                  <RefreshIcon /> 
                  <span>Scan New Item</span>
                </button>
              </div>
            )}

            {state === 'error' && (
              <div className="bg-white border-2 border-rose-100 rounded-[2rem] p-10 text-center space-y-6 shadow-xl animate-fade-in">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500 shadow-inner">
                  <XIcon />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-800">Scan Failed</h3>
                  <p className="text-slate-500 leading-relaxed">{error}</p>
                </div>
                <button 
                  onClick={reset}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 rounded-2xl transition-all"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-slate-400">
        <div className="flex justify-center gap-4 mb-3 opacity-30">
           <span className="text-xl">♻️</span>
           <span className="text-xl">🌍</span>
           <span className="text-xl">🌱</span>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Built with Gemini AI</p>
        <p className="text-[10px] mt-1 opacity-50">© 2024 EcoScan • Smart Environment Tech</p>
      </footer>

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />
      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-up { animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default App;
