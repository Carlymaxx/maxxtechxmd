"use client";

import { useState } from "react";

type Step = "input" | "generating" | "pairing" | "success" | "error";

export default function Home() {
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;

    setStep("generating");
    setMessage("Generating pairing code...");
    setError("");

    try {
      const res = await fetch('/api/pair/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      const data = await res.json();
      console.log('Response:', data);

      if (data.success && data.pairingCode) {
        setPairingCode(data.pairingCode);
        setPhoneNumber(data.phone);
        setStep("pairing");
      } else {
        setStep("error");
        setError(data.error || "Failed to generate pairing code");
      }
    } catch (err) {
      console.error('Error:', err);
      setStep("error");
      setError("Failed to connect to server");
    }
  };

  const reset = () => {
    setStep("input");
    setPhone("");
    setMessage("");
    setError("");
    setPairingCode("");
    setPhoneNumber("");
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a2e_1px,transparent_1px),linear-gradient(to_bottom,#1a1a2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
      
      <div className="relative max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-4 shadow-lg shadow-cyan-500/25">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.045c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982z"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
            MAXX-XMD
          </h1>
          <p className="text-gray-400">Link your WhatsApp to get your own bot</p>
        </div>

        <div className="bg-[#0f0f1a]/80 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-cyan-500/20">
          <div className="flex items-center justify-center gap-2 mb-6">
            {[
              { num: 1, label: "Enter Number", key: "input" },
              { num: 2, label: "Link Device", key: "pairing" },
              { num: 3, label: "Complete", key: "success" }
            ].map((item, i, arr) => (
              <>
                <div key={item.key} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step === item.key || (step === "error" && i === 0) || (step === "generating" && i === 0)
                      ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/50" 
                      : ["input", "pairing", "success"].indexOf(step) > i
                      ? "bg-green-500 text-white"
                      : "bg-gray-700 text-gray-400"
                  }`}>
                    {["input", "pairing", "success"].indexOf(step) > i ? "✓" : item.num}
                  </div>
                  <span className={`text-sm ${step === item.key ? "text-cyan-400" : "text-gray-500"}`}>
                    {item.label}
                  </span>
                </div>
                {i < arr.length - 1 && <div className="h-px w-6 bg-gray-700"></div>}
              </>
            ))}
          </div>

          {step === "input" && (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="text-gray-400 text-sm mb-2 block">Your WhatsApp Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="254725979273"
                  className="w-full px-4 py-3 bg-[#1a1a2e] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-center text-lg transition-all"
                  required
                />
                <p className="text-gray-500 text-xs mt-2 text-center">Country code + number, no + or spaces</p>
              </div>

              <button 
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
              >
                Get Pairing Code
              </button>
            </form>
          )}

          {step === "generating" && (
            <div className="flex flex-col items-center py-8">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-700 border-t-cyan-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              <p className="text-white mt-4">Generating pairing code...</p>
            </div>
          )}

          {step === "pairing" && (
            <div className="text-center">
              <p className="text-gray-400 mb-4">Enter this code on WhatsApp</p>
              
              <div className="bg-[#1a1a2e] rounded-xl p-4 mb-4 border border-cyan-500/30">
                <p className="text-gray-500 text-sm mb-2">{phoneNumber}</p>
                <p className="text-5xl font-mono font-bold text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text tracking-widest">
                  {pairingCode}
                </p>
              </div>

              <button 
                onClick={reset}
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition"
              >
                Cancel
              </button>

              <p className="text-gray-500 text-xs mt-4">
                WhatsApp → Settings → Linked Devices → Link a Device
              </p>
            </div>
          )}

          {step === "success" && (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
                <span className="text-3xl">✓</span>
              </div>
              <p className="text-white text-xl font-bold mb-2">Connected!</p>
              <p className="text-gray-400 mb-4">{message}</p>
              <button 
                onClick={reset}
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition"
              >
                Connect Another
              </button>
            </div>
          )}

          {step === "error" && (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/30">
                <span className="text-3xl">✕</span>
              </div>
              <p className="text-white text-xl font-bold mb-2">Failed</p>
              <p className="text-red-400 text-sm mb-4">{error}</p>
              <button 
                onClick={reset}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg transition shadow-lg shadow-cyan-500/25"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        <div className="text-center mt-6 text-gray-500 text-sm">
          Powered by <span className="text-cyan-400">MAXX-XMD</span> • GitHub
        </div>
      </div>
    </main>
  );
}
