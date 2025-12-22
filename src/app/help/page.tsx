'use client';

import { ArrowLeft, PlayCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HelpPage() {
  const router = useRouter();

  const tutorials = [
    {
      id: 1,
      title: 'Cómo iniciar sesión',
      description: 'Aprende a conectarte y guardar tus credenciales',
      videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_1',
      duration: '2:30'
    },
    {
      id: 2,
      title: 'Cargar un parte diario',
      description: 'Descarga y gestiona partes diarios desde el servidor',
      videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_2',
      duration: '3:45'
    },
    {
      id: 3,
      title: 'Completar datos del parte',
      description: 'Ingresa horas de empleados y observaciones',
      videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_3',
      duration: '4:20'
    },
    {
      id: 4,
      title: 'Subir parte al servidor',
      description: 'Envía tus partes completados al sistema',
      videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_4',
      duration: '2:15'
    },
    {
      id: 5,
      title: 'Gestionar historial',
      description: 'Consulta tus partes anteriores',
      videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_5',
      duration: '1:50'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Volver"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Centro de Ayuda</h1>
              <p className="text-gray-600 mt-1">Tutoriales en video para usar Parte Offline</p>
            </div>
          </div>
        </div>

        {/* Video Tutorials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tutorials.map((tutorial) => (
            <div key={tutorial.id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow">
              {/* Video Placeholder */}
              <div className="relative bg-gray-900 aspect-video flex items-center justify-center group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>
                <PlayCircle className="h-16 w-16 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                <span className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {tutorial.duration}
                </span>
              </div>
              
              {/* Video Info */}
              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{tutorial.title}</h3>
                <p className="text-gray-600 text-sm">{tutorial.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">¿Necesitas más ayuda?</h2>
          <div className="space-y-3 text-gray-700">
            <p>
              <strong>📧 Email:</strong>{' '}
              <a href="mailto:soporte@partesdiarios.com" className="text-blue-600 hover:underline">
                soporte@partesdiarios.com
              </a>
            </p>
            <p>
              <strong>📱 WhatsApp:</strong>{' '}
              <a href="https://wa.me/1234567890" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                +123 456 7890
              </a>
            </p>
            <p>
              <strong>🕐 Horario de soporte:</strong> Lunes a Viernes, 9:00 AM - 6:00 PM
            </p>
          </div>
        </div>

        {/* Developer Footer */}
        <footer className="mt-6 text-center text-sm text-gray-600">
          <p>
            Desarrollado por{' '}
            <a 
              href="https://www.odoo.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:underline font-semibold"
            >
              Odoo
            </a>
            {' '}y{' '}
            <a 
              href="https://mfalconsoft.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:underline font-semibold"
            >
              MFalcon Software
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
