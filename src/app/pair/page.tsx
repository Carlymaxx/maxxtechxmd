'use client';

import { useState } from 'react';

export default function PairPage() {
  const [step, setStep] = useState<'phone' | 'code' | 'success'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/pair/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send code');
      }

      setSuccess(data.message);
      setStep('code');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/pair/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: phoneNumber, code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify code');
      }

      setSessionId(data.sessionId);
      setSuccess(data.message);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('phone');
    setPhoneNumber('');
    setVerificationCode('');
    setSessionId('');
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">MAXX-XMD Pairing</h1>
          <p className="text-gray-600">Link your WhatsApp to get your Session ID</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center ${step === 'phone' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'phone' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className="ml-2 text-sm font-medium">Phone</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-300 mx-2"></div>
          <div className={`flex items-center ${step === 'code' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'code' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="ml-2 text-sm font-medium">Verify</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-300 mx-2"></div>
          <div className={`flex items-center ${step === 'success' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'success' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
              3
            </div>
            <span className="ml-2 text-sm font-medium">Done</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && step !== 'success' && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        {/* Step 1: Phone Number */}
        {step === 'phone' && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g., 254100638635"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
                disabled={loading}
              />
              <p className="mt-2 text-xs text-gray-500">
                Enter your phone number with country code (no + or spaces)
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || !phoneNumber}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </button>
          </form>
        )}

        {/* Step 2: Verification Code */}
        {step === 'code' && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                8-Digit Verification Code
              </label>
              <input
                type="text"
                id="code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="12345678"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl tracking-widest"
                required
                maxLength={8}
                disabled={loading}
              />
              <p className="mt-2 text-xs text-gray-500">
                Check your WhatsApp for the 8-digit code
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || verificationCode.length !== 8}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify & Create Session'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Back to Phone Number
            </button>
          </form>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Created!</h2>
              <p className="text-gray-600 mb-6">Your Session ID has been sent to your WhatsApp</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Session ID:
              </label>
              <div className="bg-white border border-gray-300 rounded-lg p-3 font-mono text-sm break-all">
                {sessionId}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sessionId);
                  alert('Session ID copied to clipboard!');
                }}
                className="mt-3 w-full bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Copy Session ID
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Next Steps:</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Check your WhatsApp for the Session ID message</li>
                <li>Add the Session ID to your config.env file</li>
                <li>Start your bot with the new session</li>
              </ol>
            </div>

            <button
              onClick={handleReset}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Create Another Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
