'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { inquiryService } from '../../../services/inquiryService';
import { CreateInquiryInput } from '../../../types';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Mail,
  FileText,
  AlignLeft,
  Sparkles,
  Inbox,
  ShieldAlert,
} from 'lucide-react';

export default function NewInquiryPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<CreateInquiryInput>({
    customerName: '',
    contactInfo: '',
    subject: '',
    description: '',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdInquiryId, setCreatedInquiryId] = useState<string | null>(null);

  // Client-side validator
  const validateField = (name: keyof CreateInquiryInput, value: string): string | null => {
    const val = value.trim();

    switch (name) {
      case 'customerName':
        if (!val) return 'Customer name is required.';
        if (val.length < 2) return 'Customer name must be at least 2 characters.';
        if (val.length > 120) return 'Customer name cannot exceed 120 characters.';
        return null;

      case 'contactInfo':
        if (!val) return 'Contact information is required.';
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        const cleanPhone = val.replace(/[\s\-()]/g, '');
        const isSriLankanPhone = /^(?:0\d{9}|\+94\d{9})$/.test(cleanPhone);
        if (!isEmail && !isSriLankanPhone) {
          return 'Please enter a valid email or Sri Lankan phone number (10 digits starting with 0, e.g. 0771234567, or +94 followed by 9 digits, e.g. +94771234567).';
        }
        return null;

      case 'subject':
        if (!val) return 'Subject is required.';
        if (val.length < 5) return 'Subject must be at least 5 characters.';
        if (val.length > 200) return 'Subject cannot exceed 200 characters.';
        return null;

      case 'description':
        if (!val) return 'Description is required.';
        if (val.length < 10) return 'Description must be at least 10 characters.';
        if (val.length > 2000) return 'Description cannot exceed 2000 characters.';
        return null;

      default:
        return null;
    }
  };

  const validateAll = (): boolean => {
    const errors: Record<string, string> = {};
    (Object.keys(formData) as Array<keyof CreateInquiryInput>).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) errors[field] = error;
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (name: keyof CreateInquiryInput, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setGeneralError(null);
    setDuplicateWarning(null);

    // Live validation if field was touched
    if (touched[name]) {
      const error = validateField(name, value);
      setFieldErrors((prev) => ({
        ...prev,
        [name]: error || '',
      }));
    }
  };

  const handleBlur = (name: keyof CreateInquiryInput) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name]);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: error || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setDuplicateWarning(null);

    // Mark all as touched
    setTouched({
      customerName: true,
      contactInfo: true,
      subject: true,
      description: true,
    });

    const isValid = validateAll();
    if (!isValid) return;

    setIsSubmitting(true);

    try {
      const newInquiry = await inquiryService.createInquiry({
        customerName: formData.customerName.trim(),
        contactInfo: formData.contactInfo.trim(),
        subject: formData.subject.trim(),
        description: formData.description.trim(),
      });

      setIsSuccess(true);
      setCreatedInquiryId(newInquiry.id);
    } catch (err: any) {
      if (err.code === 'DUPLICATE_INQUIRY') {
        setDuplicateWarning(err.message || 'Duplicate inquiry detected within 10 minutes.');
      } else if (err.code === 'VALIDATION_ERROR' && err.details) {
        // Map backend validation errors directly to fields (Demonstrates Real-World Situation 1)
        setFieldErrors(err.details);
        setGeneralError('Please review the highlighted fields rejected by the server.');
      } else {
        setGeneralError(err.message || 'Failed to record customer inquiry. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = () => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sample = {
      customerName: 'Kavindu Perera',
      contactInfo: '0771234567',
      subject: `Commercial Coffee Grinder Calibration (${timestamp})`,
      description:
        'Requesting routine inspection and calibration for two commercial espresso machines in the Colombo branch.',
    };
    setFormData(sample);
    setFieldErrors({});
    setTouched({});
    setGeneralError(null);
    setDuplicateWarning(null);
  };

  const handleReset = () => {
    setFormData({
      customerName: '',
      contactInfo: '',
      subject: '',
      description: '',
    });
    setTouched({});
    setFieldErrors({});
    setIsSuccess(false);
    setCreatedInquiryId(null);
    setGeneralError(null);
    setDuplicateWarning(null);
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-zinc-200 dark:border-zinc-800">
          <Link
            href="/inquiries"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Inquiries Overview
          </Link>

          <button
            type="button"
            onClick={handleQuickFill}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100/60 text-xs font-semibold transition-colors shadow-2xs"
            title="Pre-populate valid sample data for rapid evaluation"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Quick Demo Fill
          </button>
        </div>

        {/* Success Confirmation Card */}
        {isSuccess ? (
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900/60 p-8 shadow-xl shadow-emerald-500/5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mb-4">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Inquiry Recorded Successfully!
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
              The inquiry has entered the system with status{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-400">NEW</span> and is ready to be handled by the team.
            </p>
            {createdInquiryId && (
              <p className="mt-2 text-xs font-mono text-zinc-400">
                Inquiry Reference ID: {createdInquiryId}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/inquiries"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-600/20 hover:bg-amber-500 transition-colors"
              >
                <Inbox className="h-4 w-4" />
                View All Inquiries
              </Link>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-5 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 transition-colors"
              >
                Capture Another Inquiry
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-6 sm:p-10 shadow-xl shadow-zinc-200/40 dark:shadow-none">
            
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
                Capture Customer Inquiry
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Log customer requests received via phone, chat, or walk-ins. Initial status will be set to{' '}
                <strong className="text-blue-600 dark:text-blue-400 font-semibold">NEW</strong>.
              </p>
            </div>

            {/* General Server Error Banner */}
            {generalError && (
              <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-4 text-sm text-red-700 dark:text-red-300">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="flex-1 font-medium">{generalError}</div>
              </div>
            )}

            {/* Duplicate Warning Banner (Situation & Judgement: Duplicate Policy) */}
            {duplicateWarning && (
              <div className="mb-6 flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-4 text-sm text-amber-800 dark:text-amber-300">
                <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Duplicate Submission Prevented</p>
                  <p className="mt-1 text-xs">{duplicateWarning}</p>
                  <Link
                    href="/inquiries"
                    className="inline-block mt-2 text-xs font-bold underline hover:text-amber-950 dark:hover:text-amber-100"
                  >
                    Check inquiries list to review existing records &rarr;
                  </Link>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              
              {/* Row 1: Customer Name and Contact Info */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                
                {/* Customer Name */}
                <div>
                  <label
                    htmlFor="customerName"
                    className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5"
                  >
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      id="customerName"
                      type="text"
                      required
                      value={formData.customerName}
                      onChange={(e) => handleChange('customerName', e.target.value)}
                      onBlur={() => handleBlur('customerName')}
                      placeholder="e.g. Eleanor Vance"
                      className={`block w-full rounded-xl border bg-white dark:bg-zinc-800/80 pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none transition-all ${
                        fieldErrors.customerName
                          ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-zinc-300 dark:border-zinc-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                      }`}
                    />
                  </div>
                  {fieldErrors.customerName && (
                    <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1 font-medium">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {fieldErrors.customerName}
                    </p>
                  )}
                </div>

                {/* Contact Information */}
                <div>
                  <label
                    htmlFor="contactInfo"
                    className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5"
                  >
                    Way to Contact <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      id="contactInfo"
                      type="text"
                      required
                      value={formData.contactInfo}
                      onChange={(e) => handleChange('contactInfo', e.target.value)}
                      onBlur={() => handleBlur('contactInfo')}
                      placeholder="0771234567, +94771234567, or name@email.com"
                      className={`block w-full rounded-xl border bg-white dark:bg-zinc-800/80 pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none transition-all ${
                        fieldErrors.contactInfo
                          ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-zinc-300 dark:border-zinc-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                      }`}
                    />
                  </div>
                  {fieldErrors.contactInfo ? (
                    <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1 font-medium">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {fieldErrors.contactInfo}
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-zinc-400">
                      Accepts Sri Lankan numbers (local 10 digits starting with 0 or +94 followed by 9 digits) or valid email.
                    </p>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label
                  htmlFor="subject"
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5"
                >
                  Inquiry Subject <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl shadow-2xs">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <input
                    id="subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    onBlur={() => handleBlur('subject')}
                    placeholder="Brief summary (e.g. Espresso machine steam wand repair request)"
                    className={`block w-full rounded-xl border bg-white dark:bg-zinc-800/80 pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none transition-all ${
                      fieldErrors.subject
                        ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                        : 'border-zinc-300 dark:border-zinc-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                    }`}
                  />
                </div>
                {fieldErrors.subject && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {fieldErrors.subject}
                  </p>
                )}
              </div>

              {/* Short Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="description"
                    className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
                  >
                    Short Description <span className="text-red-500">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      formData.description.length > 2000
                        ? 'text-red-600 font-bold'
                        : 'text-zinc-400'
                    }`}
                  >
                    {formData.description.length} / 2000
                  </span>
                </div>
                <div className="relative rounded-xl shadow-2xs">
                  <div className="pointer-events-none absolute top-3 left-3 text-zinc-400">
                    <AlignLeft className="h-4 w-4" />
                  </div>
                  <textarea
                    id="description"
                    rows={5}
                    required
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    onBlur={() => handleBlur('description')}
                    placeholder="Provide relevant context, customer expectations, dates, or specific machine/order identifiers..."
                    className={`block w-full rounded-xl border bg-white dark:bg-zinc-800/80 pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none transition-all ${
                      fieldErrors.description
                        ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                        : 'border-zinc-300 dark:border-zinc-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                    }`}
                  />
                </div>
                {fieldErrors.description && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {fieldErrors.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800">
                <Link
                  href="/inquiries"
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-600/25 hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Recording Inquiry...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Record Customer Inquiry</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}
