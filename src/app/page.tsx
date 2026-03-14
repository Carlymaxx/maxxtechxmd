"use client";

import { useState } from "react";

type Step = "input" | "connecting" | "success" | "error";

export default function Home() {
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;

    setStep("connecting");
    setMessage("Connecting to WhatsApp...");
    setError("");

    try {
      const res = await fetch('/api/pair/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      const data = await res.json();

      if (data.success) {
        setStep("success");
        setMessage(data.message);
      } else {
        setStep("error");
        setError(data.error || "Connection failed");
      }
    } catch (err) {
      setStep("error");
      setError("Failed to connect to server");
    }
  };

  const reset = () => {
    setStep("input");
    setPhone("");
    setMessage("");
    setError("");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">MaxX Tech</h1>
          <p className="text-gray-400">WhatsApp Bot</p>
        </div>

        {step === "input" && (
          <form onSubmit={handleSubmit} className="flex flex-col items-center">
            <div className="w-full mb-6">
              <label className="text-gray-400 text-sm mb-2 block">Your WhatsApp Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1234567890"
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white text-lg focus:outline-none focus:border-purple-500 text-center"
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition font-medium"
            >
              Connect to WhatsApp
            </button>
          </form>
        )}

        {step === "connecting" && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-white text-lg mb-2">{message}</p>
            <p className="text-gray-400 text-sm">Please wait...</p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">✓</span>
            </div>
            <p className="text-white text-xl font-bold mb-2">Connected!</p>
            <p className="text-gray-400 text-center mb-6">{message}</p>
            <button 
              onClick={reset}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition font-medium"
            >
              Connect Another Number
            </button>
          </div>
        )}

        {step === "error" && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">✕</span>
            </div>
            <p className="text-white text-xl font-bold mb-2">Connection Failed</p>
            <p className="text-red-400 text-center mb-6">{error}</p>
            <button 
              onClick={reset}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition font-medium"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      <footer className="mt-12 text-gray-500 text-sm">
        Powered by MaxX Tech
      </footer>
    </main>
  );
}
