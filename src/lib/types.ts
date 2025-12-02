import type { Timestamp } from 'firebase/firestore';

// Represents the detailed professional profile of a doctor stored in 'doctor_profiles'
export interface Doctor {
  uid: string; // Corresponds to the Firebase Auth UID
  email: string;
  name: string;
  specialty: string;
  experienceYears: number;
  cost: number;
  city: string;
  bio?: string;
  createdAt: Timestamp;

  // Optional fields that can be added later
  slug?: string;
  location?: string;
  rating?: number;
  reviews?: number;
  isFeatured?: boolean;
  image?: string;
  healthRegistryNumber?: string;
  medicalFederationNumber?: string;
  availability?: {
    [key: number]: { startTime: string; endTime: string }[];
  };
  insurances?: string[];
  googleMapsUrl?: string;
  profilePictureUrl?: string;
  posts?: Post[];
  subscriptionStatus?: 'Trial' | 'Active' | 'Suspended' | 'Expired';
  address?: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName?: string;
  authorPhotoUrl?: string;
  content: string;
  createdAt: Timestamp;
}

export interface Rating {
  id: string;
  doctorId: string;
  patientId: string;
  appointmentId: string;
  rating: number;
  comment: string;
  createdAt: Timestamp;
}

export interface Appointment {
    id: string;
    doctorId: string;
    patientId: string;
    startTime: Timestamp;
    endTime: Timestamp;
    status: 'Confirmed' | 'Cancelled' | 'Completed';
    cost: number;
}

export interface Status {
  id: string;
  doctorId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

export enum BloodType {
  A_POSITIVE = "A+",
  A_NEGATIVE = "A-",
  B_POSITIVE = "B+",
  B_NEGATIVE = "B-",
  AB_POSITIVE = "AB+",
  AB_NEGATIVE = "AB-",
  O_POSITIVE = "O+",
  O_NEGATIVE = "O-",
}

// Represents the basic user info stored in the 'users' collection
export interface UserProfile {
    uid: string;
    email: string;
    name?: string;
    photoURL?: string;
    roles: ('Admin' | 'Doctor' | 'Patient')[];
    createdAt: Timestamp;
    bloodType?: BloodType;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: Timestamp;
}

export interface SubscriptionPayment {
  id: string;
  doctorId: string;
  doctorName: string;
  paymentScreenshotUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Timestamp;
}
