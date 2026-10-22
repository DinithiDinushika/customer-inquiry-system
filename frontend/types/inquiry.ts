export type InquiryStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED';

export interface Inquiry {
  id: string;
  customerName: string;
  contactInfo: string;
  subject: string;
  description: string;
  status: InquiryStatus;
  createdById: string;
  createdByName?: string;
  assignedToId?: string | null;
  assignedToName?: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
}

export interface InquiriesFilterParams {
  status?: InquiryStatus | 'ALL';
  search?: string;
  assignedToMe?: boolean;
}

export interface CreateInquiryInput {
  customerName: string;
  contactInfo: string;
  subject: string;
  description: string;
}

export interface InquiryCounts {
  all: number;
  new: number;
  inProgress: number;
  resolved: number;
}

export interface InquiryListResponse {
  success: boolean;
  counts: InquiryCounts;
  inquiries: Inquiry[];
}
