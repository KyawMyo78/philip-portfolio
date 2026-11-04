'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface ForgotPasswordForm {
  email: string;
  secondaryEmail?: string;
}

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmails, setSubmittedEmails] = useState<{ email: string; secondaryEmail?: string } | null>(null);
  const { register, handleSubmit, formState: { errors }, setValue, clearErrors, trigger } = useForm<ForgotPasswordForm>();
  const [showSecondary, setShowSecondary] = useState(false);
  const devEmail = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_DEV_EMAIL || '') : '';

  // Set document title for forgot password page
  useEffect(() => {
    const fetchSiteNameAndSetTitle = async () => {
      try {
        const response = await fetch('/api/site-settings');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const siteName = result.data?.general?.siteTitle || result.data?.navigation?.siteName || 'Portfolio';
            document.title = `${siteName} | Forgot Password`;
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching site name:', error);
      }
      // Fallback title
      document.title = 'Portfolio | Forgot Password';
    };

    fetchSiteNameAndSetTitle();
  }, []);

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    
    try {
      // If user is in secondary flow, ensure primary is not sent and prefills secondary with dev email if needed
      if (showSecondary) {
        data.email = ''
        if (!data.secondaryEmail && devEmail) data.secondaryEmail = devEmail
      } else {
        // Normal flow: send only to the primary email, don't include secondary
        data.secondaryEmail = undefined
      }

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
  body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);
  setSubmittedEmails({ email: data.email, secondaryEmail: data.secondaryEmail });
        toast.success('Password reset email sent successfully!');
      } else {
        toast.error(result.error || 'Failed to send reset email');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f2f2f2' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-8 h-8 text-green-500" />
            </motion.div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Email Sent!</h1>
            <p className="text-gray-600 mb-6">
              We've sent password reset instructions to the email address you provided.
              Please check your inbox (and spam folder) and follow the link to reset your password.
            </p>
            <div className="space-y-3 mb-4">
              {submittedEmails?.email && (
                <div className="text-sm text-gray-600">Sent to: <span className="text-gray-900 font-medium">{submittedEmails.email}</span></div>
              )}
              {submittedEmails?.secondaryEmail && !submittedEmails?.email && (
                <div className="text-sm text-gray-600">Sent to: <span className="text-gray-900 font-medium">{submittedEmails.secondaryEmail}</span></div>
              )}
            </div>
            
            <div className="flex items-center justify-center gap-3 mb-4">
              <button
                onClick={async () => {
                  if (!submittedEmails) return;
                  setIsLoading(true);
                  try {
                    const payload = { email: submittedEmails.email, secondaryEmail: submittedEmails.secondaryEmail };
                    const res = await fetch('/api/auth/forgot-password', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload),
                    });
                    const json = await res.json();
                    if (json.success) {
                      toast.success('Resend successful');
                    } else {
                      toast.error(json.error || 'Failed to resend');
                    }
                  } catch (e) {
                    toast.error('Failed to resend reset email');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
              >
                <Send size={16} />
                Resend Link
              </button>
            </div>

            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <ArrowLeft size={20} />
              Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-16 h-16 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Mail className="w-8 h-8 text-primary-600" />
          </motion.div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
          <p className="text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {!showSecondary && (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
                  {...register('email', {
                      validate: (value?: string) => {
                        if (showSecondary) return true // primary not required when using secondary
                        if (!value) return 'Email is required'
                        const re = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
                        return re.test(value) || 'Invalid email address'
                      }
                    })}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={async () => {
                // reveal secondary input, clear primary so only secondary is sent, and focus it
                setShowSecondary(true);
                setValue('email', '');
                // clear any existing primary email validation error that may block submit
                clearErrors('email');
                // trigger validation for secondary (in case devEmail is used)
                await trigger('secondaryEmail');
                setTimeout(() => (document.getElementById('secondaryEmail') as HTMLInputElement | null)?.focus(), 60);
              }}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline transition-all"
            >
              My email is not accessible
            </button>

            {showSecondary && (
              <div className="mt-3">
                <label htmlFor="secondaryEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Email (optional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    id="secondaryEmail"
                    placeholder="Secondary email"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
                    {...register('secondaryEmail', {
                        validate: (value?: string) => {
                          if (!showSecondary) return true // not required when hidden
                          const final = value || devEmail || ''
                          if (!final) return 'Secondary email is required'
                          const re = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
                          return re.test(final) || 'Invalid email address'
                        }
                      })}
                  />
                </div>
                {errors.secondaryEmail && (
                  <p className="text-red-500 text-sm mt-1">{errors.secondaryEmail.message}</p>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-700 hover:shadow-lg'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send size={20} />
                <span>Send Reset Link</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-all text-sm font-medium hover:underline hover:gap-3"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
