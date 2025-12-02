
// VIENE DE: Arquitectura de Usuario: SSOT y Roles Inmutables
// Este archivo es la Fuente Única de Verdad (SSOT) para los tipos de datos en la aplicación.

import { Timestamp } from 'firebase/firestore';

// Roles inmutables definidos por la arquitectura.
export type UserRole = 'Doctor' | 'Patient' | 'Clinic' | 'Admin';

// Perfil base que todos los usuarios comparten.
// Contiene la información de autenticación y el rol inmutable.
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole | null; // El rol puede ser nulo hasta que el usuario lo seleccione en el onboarding.
  createdAt: Timestamp;
  // Otros campos comunes pueden ir aquí.
}

// Extiende el perfil de usuario para incluir datos específicos del Paciente.
export interface Patient extends UserProfile {
  role: 'Patient';
  bloodType?: string; // Tipo de sangre, como se especifica en la data mínima.
  // Otros campos específicos del paciente (historial médico, etc.)
}

// Extiende el perfil de usuario para incluir datos específicos del Doctor.
// Este es el perfil más complejo, sujeto al ciclo de vida de la suscripción.
export interface Doctor extends UserProfile {
  role: 'Doctor';
  image?: string; // URL de la foto de perfil.
  specialty: string; // Especialidad médica, dato mínimo requerido.
  experienceYears: number; // Años de experiencia.
  cost: number; // Costo de la consulta, SSOT para tarifas.
  city: string; // Ciudad de la consulta.
  location?: string; // Dirección del consultorio.
  googleMapsUrl?: string; // URL de Google Maps para la ubicación.
  contactPhone?: string; // Teléfono de contacto profesional.
  instagramUrl?: string; // URL de perfil de Instagram.
  bio?: string; // Biografía profesional.
  subscriptionStatus: 'Trial' | 'Pending_Validation' | 'Active_Paid' | 'Expired'; // Estado de la suscripción.
  // Campos relacionados a la suscripción.
  subscriptionExpiresAt?: Timestamp;
}

// Extiende el perfil de usuario para Clínicas.
export interface Clinic extends UserProfile {
  role: 'Clinic';
  // Campos específicos de la clínica.
}

// Tipo de unión para cualquier tipo de perfil de usuario.
export type AnyUserProfile = Patient | Doctor | Clinic | UserProfile;

// Tipo para las publicaciones que los doctores pueden crear.
export interface Post {
  id: string;
  doctorId: string;
  authorName: string;
  authorImage: string;
  content: string;
  createdAt: Timestamp;
  likes: number;
}

// Tipo para las citas agendadas.
export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: Timestamp;
  status: 'Confirmed' | 'Cancelled' | 'Completed';
  notes?: string;
}
