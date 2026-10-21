import { apiClient } from './apiClient';
import { StaffMember, StaffListResponse } from '../types';

export const userService = {
  getStaffList: async (): Promise<StaffMember[]> => {
    const response = await apiClient<StaffListResponse>('/auth/staff', {
      method: 'GET',
      requiresAuth: true,
    });
    return response.staff;
  },
};
