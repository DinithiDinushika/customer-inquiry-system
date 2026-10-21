import { User } from './auth';

export interface StaffMember extends User {
  createdAt?: string;
}

export interface StaffListResponse {
  success: boolean;
  staff: StaffMember[];
}
