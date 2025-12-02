'use client'

import type { Timestamp } from 'firebase/firestore';

// ========================================================================
// ADVERTISING & MONETIZATION TYPES (NEW)
// ========================================================================

export type AdTier = 15 | 25 | 50 | 100; // Represents the dollar amount invested daily

export interface AdCampaign {
  isActive: boolean;
  tier: AdTier;
  dailyBudget: number; // The total impulse points for the day (e.g., 1500 for $15)
  remainingBudget: number; // The current impulse points left for the day
  startDate: Timestamp;
  // endDate is not needed for a daily model, but could be added for longer campaigns
}

// ========================================================================
// CORE USER AND PROFILE TYPES
// ========================================================================

export interface UserProfile {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
  roles: string[]; 
  createdAt: Timestamp;
}

export interface Doctor {
  uid: string;
  name: string;
  email: string;
  specialty: string;
  cost: number;
  experienceYears: number;
  city: string;
  // Subscription status is critical for base visibility
  subscriptionStatus: 'Trial' | 'Active' | 'Expired' | 'Pending';
  createdAt: Timestamp;
  // Advertising campaign for preferential placement (NEWLY ADDED)
  adCampaign?: AdCampaign; 
}

export interface Patient {
  uid: string;
  name: string;
  email: string;
  bloodType: string; // e.g., 'O+'
  createdAt: Timestamp;
}

// Represents a simplified version for display in search results
export interface DoctorSearchResult {
  uid: string;
  name: string;
  specialty: string;
  city: string;
  cost: number;
  isVerified: boolean; // From subscription status
  isPromoted: boolean;  // If they are being shown due to an ad campaign
}
