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
        <div className="p-6 max-w-3xl mx-auto">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-heading font-bold text-primary-900 dark:text-white">Fee Payment</h1>
                <p className="text-secondary-500 dark:text-slate-400 mt-2">Securely pay your fees using any UPI application</p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-secondary-200 dark:border-slate-700 overflow-hidden relative"
            >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary-600 to-accent-500"></div>

                <div className="p-8 md:p-10">
                    <div className="text-center mb-8">
                        <div className="w-24 h-24 bg-secondary-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-secondary-200 dark:border-slate-700">
                            <QrCode size={48} className="text-primary-600 dark:text-primary-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-primary-900 dark:text-white">Scan to Pay</h2>
                        <p className="text-secondary-500 dark:text-slate-400 text-sm mt-1">Use Google Pay, PhonePe, Paytm or any UPI app</p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-600 border-t-transparent"></div>
                        </div>
                    ) : qrCodeUrl ? (
                        <div className="space-y-8">
                            {/* QR Code Display */}
                            <div className="flex justify-center">
                                <div className="p-4 bg-white rounded-2xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_-10px_rgba(0,0,0,0.3)] border border-secondary-200 dark:border-slate-600">
                                    <div className="relative">
                                        <img
                                            src={qrCodeUrl}
                                            alt="Payment QR Code"
                                            className="w-64 h-64 object-contain"
                                        />
                                        <div className="absolute inset-0 border-[3px] border-primary-900/10 rounded-lg pointer-events-none"></div>
                                        {/* Corner accents */}
                                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary-600 rounded-tl-lg"></div>
                                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary-600 rounded-tr-lg"></div>
                                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary-600 rounded-bl-lg"></div>
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary-600 rounded-br-lg"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="bg-secondary-50 dark:bg-slate-900/50 p-6 rounded-xl border border-secondary-200 dark:border-slate-700">
                                <h3 className="font-bold text-primary-900 dark:text-white mb-4 flex items-center text-sm uppercase tracking-wider">
                                    <Smartphone size={18} className="mr-2 text-primary-600 dark:text-primary-400" />
                                    Payment Instructions
                                </h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="flex items-start p-3 bg-white dark:bg-slate-800 rounded-lg border border-secondary-200 dark:border-slate-700 shadow-sm">
                                        <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5 border border-primary-200 dark:border-primary-900/50">1</span>
                                        <span className="text-sm text-secondary-700 dark:text-slate-300 font-medium">Open any UPI app on your phone</span>
                                    </div>
                                    <div className="flex items-start p-3 bg-white dark:bg-slate-800 rounded-lg border border-secondary-200 dark:border-slate-700 shadow-sm">
                                        <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5 border border-primary-200 dark:border-primary-900/50">2</span>
                                        <span className="text-sm text-secondary-700 dark:text-slate-300 font-medium">Select "Scan QR Code" option</span>
                                    </div>
                                    <div className="flex items-start p-3 bg-white dark:bg-slate-800 rounded-lg border border-secondary-200 dark:border-slate-700 shadow-sm">
                                        <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5 border border-primary-200 dark:border-primary-900/50">3</span>
                                        <span className="text-sm text-secondary-700 dark:text-slate-300 font-medium">Scan the code shown above</span>
                                    </div>
                                    <div className="flex items-start p-3 bg-white dark:bg-slate-800 rounded-lg border border-secondary-200 dark:border-slate-700 shadow-sm">
                                        <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5 border border-primary-200 dark:border-primary-900/50">4</span>
                                        <span className="text-sm text-secondary-700 dark:text-slate-300 font-medium">Enter amount & complete payment</span>
                                    </div>
                                </div>
                            </div>

                            {/* Download Button */}
                            <button
                                onClick={handleDownloadQR}
                                className="w-full py-4 px-6 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex justify-center items-center text-base tracking-wide"
                            >
                                <Download size={20} className="mr-2" />
                                Download QR Code
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-secondary-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-secondary-300 dark:border-slate-600">
                            <div className="w-16 h-16 bg-secondary-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-secondary-200 dark:border-slate-700">
                                <QrCode size={32} className="text-secondary-400 dark:text-slate-500" />
                            </div>
                            <h3 className="text-lg font-bold text-primary-900 dark:text-slate-300 mb-1">No QR Code Available</h3>
                            <p className="text-secondary-500 dark:text-slate-500 text-sm max-w-xs mx-auto">
                                {user.role === 'teacher'
                                    ? 'Please upload a payment QR code in the Settings page.'
                                    : 'Please contact your teacher to set up the payment QR code.'}
                            </p>
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-secondary-200 dark:border-slate-700 text-center">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-bold border border-green-200 dark:border-green-900/30">
                            <ShieldCheck size={14} className="mr-1.5" />
                            100% Secure Payment via UPI
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
