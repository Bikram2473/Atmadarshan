import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { QrCode, IndianRupee, ShieldCheck, Download, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Payments() {
    const { user } = useAuth();
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQRCode();
    }, []);

    const fetchQRCode = async () => {
        try {
            const response = await api.get('/api/settings');
            if (response.data.qrCodeUrl) {
                setQrCodeUrl(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${response.data.qrCodeUrl}`);
            }
        } catch (error) {
            console.error('Error fetching QR code:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadQR = () => {
        if (qrCodeUrl) {
            const link = document.createElement('a');
            link.href = qrCodeUrl;
            link.download = 'payment-qr-code.png';
            link.click();
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto mt-10">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-8 rounded-2xl shadow-xl border border-secondary-200 relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-400 to-primary-600"></div>

                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <QrCode size={40} className="text-primary-600" />
                    </div>
                    <h1 className="text-3xl font-heading font-bold text-primary-900">Fee Payment</h1>
                    <p className="text-secondary-600 mt-2">Scan QR code to pay via any UPI app</p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                ) : qrCodeUrl ? (
                    <div className="space-y-6">
                        {/* QR Code Display */}
                        <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 p-8 rounded-2xl border-2 border-dashed border-primary-300">
                            <div className="bg-white p-6 rounded-xl shadow-lg mx-auto w-fit">
                                <img
                                    src={qrCodeUrl}
                                    alt="Payment QR Code"
                                    className="w-64 h-64 object-contain mx-auto"
                                />
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="bg-primary-50 p-6 rounded-xl border border-primary-200">
                            <h3 className="font-bold text-primary-900 mb-4 flex items-center">
                                <Smartphone size={20} className="mr-2" />
                                How to Pay
                            </h3>
                            <ol className="space-y-2 text-secondary-700 text-sm">
                                <li className="flex items-start">
                                    <span className="bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">1</span>
                                    <span>Open any UPI app (Google Pay, PhonePe, Paytm, etc.)</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">2</span>
                                    <span>Tap on <strong>Scan QR code</strong> option</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">3</span>
                                    <span>Scan the QR code shown above</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">4</span>
                                    <span>Enter the amount and complete the payment</span>
                                </li>
                            </ol>
                        </div>

                        {/* Download Button */}
                        <button
                            onClick={handleDownloadQR}
                            className="w-full py-4 px-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg shadow-primary-900/20 hover:shadow-xl hover:-translate-y-0.5 flex justify-center items-center text-lg"
                        >
                            <Download size={20} className="mr-2" />
                            Download QR Code
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <QrCode size={32} className="text-secondary-400" />
                        </div>
                        <h3 className="text-xl font-bold text-secondary-700 mb-2">No QR Code Available</h3>
                        <p className="text-secondary-500">
                            {user.role === 'teacher'
                                ? 'Please upload a payment QR code in Settings'
                                : 'Please contact your teacher to set up payment QR code'}
                        </p>
                    </div>
                )}

                <div className="mt-8 text-center flex items-center justify-center text-xs text-secondary-400 bg-secondary-50 py-3 rounded-lg">
                    <ShieldCheck size={14} className="mr-1.5 text-primary-500" />
                    Secure UPI payments. All major UPI apps supported.
                </div>
            </motion.div>
        </div>
    );
}
