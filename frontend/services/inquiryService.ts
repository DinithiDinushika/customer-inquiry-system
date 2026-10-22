import { apiClient } from './apiClient';
import {
  Inquiry,
  InquiryStatus,
  InquiriesFilterParams,
  CreateInquiryInput,
  InquiryListResponse,
} from '../types';

export const inquiryService = {
  getInquiries: async (params?: InquiriesFilterParams): Promise<InquiryListResponse> => {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.assignedToMe) query.append('assignedToMe', 'true');

    const qs = query.toString();
    const endpoint = `/inquiries${qs ? `?${qs}` : ''}`;
    return await apiClient<InquiryListResponse>(endpoint);
  },

  getInquiryById: async (id: string): Promise<Inquiry> => {
    const response = await apiClient<{ success: boolean; inquiry: Inquiry }>(`/inquiries/${id}`);
    return response.inquiry;
  },

  createInquiry: async (data: CreateInquiryInput): Promise<Inquiry> => {
    const response = await apiClient<{ success: boolean; inquiry: Inquiry }>('/inquiries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.inquiry;
  },

  updateStatus: async (
    id: string,
    status: InquiryStatus,
    currentVersion: number
  ): Promise<Inquiry> => {
    const response = await apiClient<{ success: boolean; inquiry: Inquiry }>(`/inquiries/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, version: currentVersion }),
    });
    return response.inquiry;
  },

  assignInquiry: async (id: string, assignedToId: string | null): Promise<Inquiry> => {
    const response = await apiClient<{ success: boolean; inquiry: Inquiry }>(`/inquiries/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assignedToId }),
    });
    return response.inquiry;
  },
};
