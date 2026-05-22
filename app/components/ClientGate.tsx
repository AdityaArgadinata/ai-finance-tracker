"use client";

import { useState, useEffect } from "react";

interface ClientGateProps {
  children: React.ReactNode;
}

export function ClientGate({ children }: ClientGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isMounted, setIsMounted] = useState<boolean>(false);
  useEffect(() => {
    let isAuthed = false;
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("expanse_passcode");
      if (stored === "202051056") {
        isAuthed = true;
      }
    }

    const timer = setTimeout(() => {
      setIsMounted(true);
      if (isAuthed) {
        setIsAuthenticated(true);
      }
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "202051056") {
      sessionStorage.setItem("expanse_passcode", passcode);
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("INVALID");
      setPasscode("");
    }
  };

  // Prevent hydration mismatch
  if (!isMounted) {
    return <div className="min-h-screen bg-black" />;
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col justify-between overflow-x-hidden selection:bg-[#ffb000] selection:text-black">
      {/* Bloomberg Top Title Bar */}


      {/* Terminal Grid Background / Logon Box Container */}
      <div className="flex-1 flex flex-col justify-center items-center p-4">

        {/* Outer Bloomberg-style Login Box */}
        <div className="border-2 border-[#ffb000] bg-[#050505] w-full max-w-lg p-6 relative shadow-[0_0_20px_rgba(255,176,0,0.15)]">
          {/* Accent corners */}
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[#ffb000]"></div>
          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-[#ffb000]"></div>
          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-[#ffb000]"></div>
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-[#ffb000]"></div>

          <div className="text-center mb-6">
            <h2 className="text-sm font-bold text-[#ffb000] tracking-wider uppercase mb-1">
              Jump
            </h2>
            <div className="h-0.5 w-1/3 bg-[#ffb000] mx-auto mb-4"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PIN Input Field */}
            <div className="space-y-2">
              <div className="relative max-w-xs mx-auto">
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="•••••••••"
                  autoFocus
                  className="w-full bg-black border-2 border-[#333] focus:border-[#ffb000] rounded-none py-2 px-3 text-center text-lg font-bold tracking-[0.4em] text-[#ffb000] outline-none transition-all placeholder:text-[#222]"
                />
              </div>
            </div>

            {/* Logon Status / Error message */}
            <div className="min-h-[30px] flex items-center justify-center">
              {error ? (
                <div className="w-full max-w-xs bg-[#3d0f0f] border border-[#ff4444] px-3 py-1.5 text-center text-[10px] text-[#ff4444] font-bold uppercase tracking-wider animate-pulse">
                  {error}
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
                  STATUS: READY FOR LOGON
                </div>
              )}
            </div>

            {/* Bloomberg styled Orange Button */}
            <div className="text-center">
              <button
                type="submit"
                className="bg-[#e67e22] text-black px-6 py-2 text-xs font-black uppercase tracking-widest hover:bg-[#ff9f43] transition-colors cursor-pointer border-0 font-mono"
              >
                Logon &lt;GO&gt;
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
