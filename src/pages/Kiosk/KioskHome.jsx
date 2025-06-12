import React, { useState } from 'react';
import { fetchKiosk } from '../../api/api';
import { useNavigate } from 'react-router-dom';
import yangaLogo from '../../../public/Photos/yangaLogo.png'

const KioskHome = () => {
  const navigate = useNavigate();

  const [kioskKey, setKioskKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [error, setError] = useState('');

  const validKeys = [
    'K447F8Y9',
    'K233N8Y1',
    'K7F8Y9',
    'ADMIN-MASTER-001',
    'TEST-KEY-123'
  ];

  const handleSubmit = async () => {
    if (!kioskKey.trim()) {
      setError('Please enter a kiosk key');
      return;
    }

    setIsLoading(true);
    setError('');
    setVerificationStatus(null);

    try {
      const response = await fetchKiosk(kioskKey);

      console.log(response);

      if (response && response._id && response.kioskID) {
        setVerificationStatus('success');
        setError('');
        console.log('Access granted for key:', kioskKey);
        console.log('Kiosk data:', response);

        // Here you would typically:
        // - Store kiosk data in state/context
        // - Redirect to main kiosk interface
        // - Set authentication token
        // localStorage.setItem('kioskData', JSON.stringify(response));
        setTimeout(() => {
          navigate(`/${kioskKey}`);
        }, 1500);

      } else {
        setVerificationStatus('error');
        setError('Invalid kiosk key. Access denied.');
      }

    }
    catch (error) {
      console.log('Error verifying kiosk key:', error);
      setVerificationStatus('error');
      setError('Connection error. Please try again.');
    }
    finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setKioskKey('');
    setVerificationStatus(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <img
              src={yangaLogo}
              alt=""
             
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome</h1>
          <p className="text-gray-600">Please enter your kiosk key to continue</p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div>
            <label htmlFor="kioskKey" className="block text-sm font-medium text-gray-700 mb-2">
              Kiosk Key
            </label>
            <div className="relative">
              <input
                type="text"
                id="kioskKey"
                value={kioskKey}
                onChange={(e) => setKioskKey(e.target.value)}
                placeholder="Enter your kiosk key"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center font-mono text-lg"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3">
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {verificationStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3">
              <span className="text-sm">Key verified successfully! Access granted.</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`w-full py-3 px-4 font-semibold text-white transition-all duration-200 ${isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : verificationStatus === 'success'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-1'
              }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Verifying...
              </div>
            ) : verificationStatus === 'success' ? (
              'Access Granted'
            ) : (
              'Verify Key'
            )}
          </button>

          {/* Reset Button */}
          {(verificationStatus || error) && (
            <button
              type="button"
              onClick={handleReset}
              className="w-full py-2 px-4 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default KioskHome;