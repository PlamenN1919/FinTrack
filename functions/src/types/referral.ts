export interface ReferralData {
  referrerId: string;
  referrerEmail: string;
  refereeId?: string;
  refereeEmail?: string;
  createdAt: FirebaseFirestore.Timestamp;
  status: 'pending' | 'completed' | 'expired';
  completedAt?: FirebaseFirestore.Timestamp;
  rewardGranted: boolean;
  rewardGrantedAt?: FirebaseFirestore.Timestamp;
  // Anti-fraud fields
  refereeIpAddress?: string;
  refereeDeviceId?: string;
  installTime?: FirebaseFirestore.Timestamp;
}

export interface ReferralStats {
  totalInvites: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalRewardsEarned: number;
  referralHistory: ReferralHistoryItem[];
}

export interface ReferralHistoryItem {
  id: string;
  refereeEmail: string;
  status: 'pending' | 'completed' | 'expired';
  invitedAt: FirebaseFirestore.Timestamp;
  completedAt?: FirebaseFirestore.Timestamp;
  rewardGranted: boolean;
}

export interface ReferralReward {
  userId: string;
  type: 'subscription_extension';
  months: number;
  grantedAt: FirebaseFirestore.Timestamp;
  referralId: string;
}

export interface AntifraudCheck {
  ipAddress: string;
  deviceId: string;
  email: string;
  installTime: FirebaseFirestore.Timestamp;
  passed: boolean;
  reasons?: string[];
} 