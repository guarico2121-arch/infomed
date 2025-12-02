'use client'

import type { Timestamp } from 'firebase/firestore';

// ========================================================================
// ADVERTISING & MONETIZATION TYPES
// ========================================================================

export type AdTier = 15 | 25 | 50 | 100; // Represents the dollar amount invested daily

export interface AdCampaign {
  isActive: boolean;
  tier: AdTier;
  dailyBudget: number; // The total impulse points for the day (e.g., 1500 for $15)
  remainingBudget: number; // The current impulse points left for the day
  startDate: Timestamp;
}

// ========================================================================
// CORE USER, PROFILE, AND CONTENT TYPES
// ========================================================================

export interface UserProfile {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
  roles: string[]; 
  createdAt: Timestamp;
}

// The comprehensive Doctor model for use in components like the profile page.
export interface Doctor {
  uid: string;
  id: string; // Often the same as uid, used for slugs/keys
  slug: string;
  name: string;
  email: string;
  specialty: string;
  cost: number;
  experienceYears: number;
  city: string;
  location: string;
  subscriptionStatus: 'Trial' | 'Active' | 'Expired' | 'Pending';
  createdAt: Timestamp;
  adCampaign?: AdCampaign;
  // Properties for the public profile, which were missing or inconsistent:
  image?: string;
  bio?: string;
  rating: number;
  reviews: number;
  isFeatured?: boolean;
  availability?: Record<string, any>; // Keeping flexible for now
  insurances?: string[];
  googleMapsUrl?: string;
  // CRITICAL FIX: Added the missing fields for complete profile management.
  contactPhone?: string;
  instagramUrl?: string;
  posts?: any[]; // Define a Post type later if needed
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

// Type for patient ratings and comments (was missing)
export interface Rating {
    id: string;
    doctorId: string;
    patientId: string;
    appointmentId: string;
    rating: number;
    comment: string;
    createdAt: Timestamp;
}

// Type for doctor's temporary statuses/stories (was missing)
export interface Status {
    id: string;
    mediaUrl: string;
    caption?: string;
    createdAt: Timestamp;
    expiresAt: Timestamp;
}
