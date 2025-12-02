import type { Timestamp } from 'firebase/firestore';

export interface Doctor {
  id: string;
  slug: string;
  name: string;
  email?: string;
  specialty: string;
  location: string;
  city: string;
  rating?: number;
  reviews?: number;
  bio: string;
  isFeatured: boolean;
  image: string;
  experienceYears: number;
  healthRegistryNumber?: string;
  medicalFederationNumber?: string;
  // availability is an object with day of week as key (0=Sun, 1=Mon,...)
  availability: {
    [key: number]: { startTime: string; endTime: string }[];
  };
  insurances: string[];
  googleMapsUrl?: string;
  cost: number;
  profilePictureUrl?: string; // Ensure this is part of the type
  posts?: Post[]; // Make posts optional
  subscriptionStatus?: 'Trial' | 'Active' | 'Suspended' | 'Expired';
  address?: string;
  biography?: string;
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

export interface UserProfile {
    id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    bloodType?: BloodType;
    photoURL?: string;
    roles?: string[];
    profilePictureUrl?: string;
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
