'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Send, Mail, Phone, MapPin, Clock, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { analytics } from '@/lib/analytics';
import { getSocialIcon, SocialLink } from '../lib/socialIcons';
import { ContactInfoSkeleton } from './SkeletonLoader';
import ErrorState from './ErrorState';

interface ContactForm {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

interface ProfileData {
  email: string;
  phone?: string;
  location: string;
  socialLinks?: SocialLink[];
}

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fallbackEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'contact@example.com';
  const fallbackPhone = process.env.NEXT_PUBLIC_ADMIN_PHONE || '+0000000000';
  const [profile, setProfile] = useState<ProfileData>({
    email: fallbackEmail,
    phone: fallbackPhone,
    location: 'Thailand'
  });
  const [siteSettings, setSiteSettings] = useState<any | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactForm>();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch profile data
      const timestamp = new Date().getTime();
      const [profileRes, settingsRes] = await Promise.all([
        fetch(`/api/profile?t=${timestamp}`),
        fetch('/api/site-settings')
      ]);

      const profileResult = await profileRes.json();
      const settingsResult = await settingsRes.json();

      if (profileResult.success) {
        setProfile({
          email: profileResult.data.email || 'example@example.com',
          phone: profileResult.data.phone || '+123456789',
          location: profileResult.data.location || 'Thailand',
          socialLinks: profileResult.data.socialLinks || []
        });
      } else {
        setError('Failed to load contact information. Please try again.');
      }

      if (settingsResult.success && settingsResult.data) {
        const incoming = { ...settingsResult.data } as any;
        if (incoming.contact && incoming.contact.whyWorkWithMe) {
          if (typeof incoming.contact.whyWorkWithMe === 'string') {
            incoming.contact.whyWorkWithMe = incoming.contact.whyWorkWithMe
              .split(/\r?\n|\n|\r/)
              .map((s: string) => s.trim())
              .filter((s: string) => s.length > 0);
          } else if (!Array.isArray(incoming.contact.whyWorkWithMe)) {
            incoming.contact.whyWorkWithMe = [String(incoming.contact.whyWorkWithMe)];
          }
        }
        setSiteSettings(incoming);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Unable to load contact information. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    fetchData();
  };

  const getContactInfo = () => {
    const baseInfo = [
      {
        icon: Mail,
        title: 'Email',
  value: siteSettings?.contact?.primaryEmail || profile.email,
  link: `mailto:${siteSettings?.contact?.primaryEmail || profile.email}`
      },
      {
        icon: Phone,
        title: 'Phone',
  value: siteSettings?.contact?.primaryPhone || profile.phone || '+123456789',
  link: `tel:${siteSettings?.contact?.primaryPhone || profile.phone || '+123456789'}`
      },
      {
        icon: MapPin,
        title: 'Location',
  value: siteSettings?.contact?.location || profile.location,
        link: null
      },
      {
        icon: Clock,
        title: 'Response Time',
  value: siteSettings?.contact?.responseTime || 'Within 24 hours',
        link: null
      }
    ];

    return baseInfo;
  };

  const contactInfo = getContactInfo();

  const onSubmit = async (data: ContactForm) => {
    setIsSubmitting(true);
    analytics.contactFormSubmit();
    
    try {
      const response = await fetch('/api/portfolio/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        analytics.contactFormSuccess();
        toast.success('Message sent successfully! I\'ll get back to you soon.');
        reset();
      } else {
        analytics.contactFormError(result.error || 'API Error');
        toast.error(result.error || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      analytics.contactFormError('Network Error');
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <section id="contact" className="section-padding bg-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="h-12 w-64 mx-auto mb-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse" />
            <div className="w-24 h-1 bg-gray-300 mx-auto mb-6 animate-pulse" />
            <div className="h-6 w-96 max-w-full mx-auto bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse" />
          </motion.div>
          
          <div className="grid lg:grid-cols-2 gap-12">
            <ContactInfoSkeleton />
            <div className="space-y-6">
              <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse" />
              <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse" />
              <div className="h-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse" />
              <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="contact" className="section-padding bg-white">
        <div className="container-width">
          <ErrorState
            title="Failed to Load Contact Information"
            message={error}
            onRetry={handleRetry}
          />
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="section-padding bg-white">
      <div className="container-width">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            {siteSettings?.contact?.connectTitle?.split(' ')[0] ?? "Let's"} <span className="text-gradient">{siteSettings?.contact?.connectTitle?.split(' ').slice(1).join(' ') ?? 'Connect'}</span>
          </h2>
              <div className="w-24 h-1 bg-gradient-clover mx-auto mb-6"></div>
          <p className="text-xl text-clover-700 max-w-3xl mx-auto">
            {siteSettings?.contact?.connectIntro ?? 'Ready to bring your ideas to life? Let\'s discuss your next project and explore how we can work together.'}
          </p>
        </motion.div>

        {/* Contact Form - Priority placement at top */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <div className="max-w-3xl mx-auto bg-gray-50 rounded-2xl p-8">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Send a Message</h3>
              <p className="text-gray-600">Ready to discuss your project? Let's get the conversation started.</p>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  {...register('name', { 
                    required: 'Name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' }
                  })}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-clover-500 transition-colors ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Your full name"
                />
                </div>
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-clover-500 transition-colors ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="example@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Phone and Subject in grid */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    {...register('phone')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-clover-500 transition-colors"
                    placeholder="+123456789"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    {...register('subject', { 
                      required: 'Subject is required',
                      minLength: { value: 5, message: 'Subject must be at least 5 characters' }
                    })}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-clover-500 transition-colors ${
                      errors.subject ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="What's this about?"
                  />
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                  )}
                </div>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  rows={5}
                  {...register('message', { 
                    required: 'Message is required',
                    minLength: { value: 20, message: 'Message must be at least 20 characters' }
                  })}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-clover-500 transition-colors resize-none ${
                    errors.message ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Tell me about your project, ideas, or just say hello!"
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white font-semibold py-4 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-xl"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-white font-medium">Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 text-white" />
                    <span className="text-white font-medium">Send Message</span>
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* Contact Information Section */}
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Primary Contact & Why Choose Me */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Let's Connect</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              I'm always excited to discuss new opportunities, innovative projects, or just chat about technology. 
              Whether you have a specific project in mind or want to explore possibilities, I'd love to hear from you.
            </p>

            {/* Primary Contact Info */}
              <div className="space-y-4 mb-8">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                  className="flex items-center p-4 bg-clover-50 rounded-xl hover:bg-clover-100 transition-colors"
                >
                    <div className="w-12 h-12 bg-clover-100 rounded-lg flex items-center justify-center mr-4 shadow-md border-2 border-clover-300">
                    <info.icon className="w-6 h-6 text-clover-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{info.title}</h4>
                    {info.link ? (
                      <a
                          href={info.link}
                          className="text-clover-700 hover:text-clover-900 transition-colors"
                        >
                        {info.value}
                      </a>
                    ) : (
                      <p className="text-gray-600">{info.value}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Why Choose Me */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] shadow-[0_12px_40px_rgba(15,23,42,0.06)]"
            >
              <h4 className="font-bold text-[var(--foreground)] mb-4">Why Work With Me?</h4>
              <div className="space-y-2">
                {(siteSettings?.contact?.whyWorkWithMe && Array.isArray(siteSettings.contact.whyWorkWithMe) ? siteSettings.contact.whyWorkWithMe : [
                  'Dedicated to delivering high-quality solutions',
                  'Strong communication throughout the project',
                  'Experienced in both hardware and software development',
                  'Passionate about turning ideas into reality'
                ]).map((point: string, index: number) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-[var(--foreground)] mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-[var(--muted-foreground)]">{point}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Social Links & Additional Contact Options */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Find Me Online</h3>
            <p className="text-gray-600 mb-8">
              Connect with me on social platforms or choose your preferred way to get in touch.
            </p>

            {/* Social Links Grid */}
            {profile.socialLinks && profile.socialLinks.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Social Media</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {profile.socialLinks.map((socialLink, index) => {
                    const iconConfig = getSocialIcon(socialLink.icon);
                    if (!iconConfig) return null;
                    
                    return (
                      <motion.a
                        key={index}
                        href={socialLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.1 * index }}
                        whileHover={{ scale: 1.05 }}
                        className="flex flex-col items-center p-4 bg-white rounded-xl border border-clover-300 hover:border-clover-500 hover:shadow-lg transition-all duration-300 group"
                      >
                                <div className="w-10 h-10 bg-clover-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-clover-700 group-hover:scale-110 transition-all">
                          <iconConfig.icon className="w-5 h-5 text-clover-700 group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-clover-700 transition-colors">
                          {socialLink.name}
                        </span>
                      </motion.a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Contact Options */}
            <div className="bg-white rounded-xl border border-clover-300 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Contact</h4>
              <div className="space-y-3">
                <a
                  href={`mailto:${siteSettings?.contact?.quickContactEmail ?? profile.email}`}
                  className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-clover-300 hover:bg-clover-100 transition-all group"
                >
                  <Mail className="w-5 h-5 text-clover-700 mr-3" />
                  <div>
                    <span className="font-medium text-gray-900 group-hover:text-clover-700">{siteSettings?.contact?.readyToStartEmailText ?? 'Email Me'}</span>
                    <p className="text-sm text-gray-600">{siteSettings?.contact?.quickContactEmail ?? profile.email}</p>
                  </div>
                </a>
                
                <a
                  href={`tel:${siteSettings?.contact?.quickContactPhone ?? profile.phone}`}
                  className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-clover-500 hover:bg-clover-100 transition-all group"
                >
                  <Phone className="w-5 h-5 text-clover-700 mr-3" />
                  <div>
                    <span className="font-medium text-gray-900 group-hover:text-clover-700">{siteSettings?.contact?.readyToStartCallText ?? 'Call Me'}</span>
                    <p className="text-sm text-gray-600">{siteSettings?.contact?.quickContactPhone ?? profile.phone}</p>
                  </div>
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-16 p-8 bg-gradient-to-r from-clover-500 to-clover-700 rounded-3xl text-white"
        >
          <h3 className="text-2xl font-bold mb-4">Ready to Start Your Project?</h3>
          <p className="text-clover-100 mb-6 max-w-2xl mx-auto text-justify">
            From concept to completion, I'm here to help bring your vision to life with innovative solutions and expert craftsmanship.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={`mailto:${siteSettings?.contact?.primaryEmail ?? profile.email}`}
              className="bg-white text-clover-700 px-6 py-3 rounded-xl font-semibold hover:bg-clover-100 transition-colors"
            >
              Email Me Directly
            </a>
            <a
              href="tel:+66628602714"
              className="bg-clover-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-clover-900 transition-colors"
            >
              Call Now
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
