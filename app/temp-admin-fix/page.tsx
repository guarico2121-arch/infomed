'use client';

import React, { useEffect, useState } from 'react';
import { initializeFirebase } from '../../src/firebase/client';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function TempAdminFixPage() {
    const [message, setMessage] = useState('Iniciando proceso de corrección final...');
    const router = useRouter();

    useEffect(() => {
        const { firestore } = initializeFirebase();

        if (!firestore) {
            setMessage('Error: No se pudo inicializar Firestore.');
            return;
        }

        const fixAdminRole = async () => {
            try {
                // UID de admin@informed.com
                const adminUid = 'ukj5ZmztxENSSr3mCqH5mboFr8r1'; 
                const roleDocRef = doc(firestore, 'roles_admin', adminUid);

                setMessage('Conectado a Firestore. Creando documento de rol de administrador...');
                
                await setDoc(roleDocRef, { isAdmin: true });

                setMessage('¡ÉXITO! Se han asignado los permisos de administrador. Puede cerrar esta página o será redirigido en 10 segundos.');

                setTimeout(() => {
                    router.push('/admin/dashboard');
                }, 10000);

            } catch (error) {
                console.error("Error crítico durante la corrección:", error);
                if (error instanceof Error) {
                    setMessage(`Error al intentar crear el rol: ${error.message}. Esto probablemente se deba a un problema de conexión a la red en el entorno de desarrollo. Intente ejecutar esto desde una URL de vista previa de App Hosting.`);
                } else {
                    setMessage('Ocurrió un error desconocido.');
                }
            }
        };

        fixAdminRole();

    }, [router]);

    return (
        <div style={{ padding: '2rem', fontFamily: 'monospace', textAlign: 'center' }}>
            <h1>Página de Corrección de Permisos</h1>
            <p>{message}</p>
        </div>
    );
}
