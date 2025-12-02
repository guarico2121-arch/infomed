'use client';

import { useState } from 'react';

interface DoctorProfileFormProps {
  onSubmit: (profileData: any) => void;
}

export default function DoctorProfileForm({ onSubmit }: DoctorProfileFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    experienceYears: '',
    cost: '',
    city: '',
    bio: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!formData.name || !formData.specialty || !formData.experienceYears || !formData.cost || !formData.city) {
      alert('Por favor, rellena todos los campos obligatorios.');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-8 shadow-md rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre Completo*</label>
          <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="specialty" className="block text-sm font-medium text-gray-700">Especialidad*</label>
          <input type="text" name="specialty" id="specialty" value={formData.specialty} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="experienceYears" className="block text-sm font-medium text-gray-700">Años de Experiencia*</label>
          <input type="number" name="experienceYears" id="experienceYears" value={formData.experienceYears} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="cost" className="block text-sm font-medium text-gray-700">Costo de Consulta (USD)*</label>
          <input type="number" name="cost" id="cost" value={formData.cost} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">Ciudad*</label>
          <input type="text" name="city" id="city" value={formData.city} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Biografía Corta</label>
          <textarea name="bio" id="bio" value={formData.bio} onChange={handleChange} rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"></textarea>
        </div>
      </div>
      <div className="mt-8 text-right">
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Guardar Perfil
        </button>
      </div>
    </form>
  );
}
