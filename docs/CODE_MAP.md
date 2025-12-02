# Aquí tienes las directivas optimizadas para el MVP de InfoMed Central, presentadas de forma lineal, sin caracteres especiales ni cuadros, y con las notas de trazabilidad (// VIENE DE: ...) requeridas.

InfoMed Central MVP: Directivas de Arquitectura y Funcionalidad Lineales
El MVP se enfoca en la Identidad Digital Inmutable (SSOT), la Visibilidad del Doctor sujeta a la Suscripción con Pago Manual, y la funcionalidad básica de Búsqueda, Perfil y Red Social.

I. Arquitectura de Usuario: SSOT y Roles Inmutables
El sistema de roles es la Fuente Única de Verdad (SSOT). Los roles son inmutables tras la asignación inicial.

Roles Definidos y Ámbito del MVP:

Paciente: Acceso a Búsqueda, Perfil Básico (Tipo de Sangre), Agendamiento de Citas y Calificación. Uso Gratuito.

Doctor: Sujeto a Ciclo de Suscripción. Acceso a Perfil Profesional, Gestión de Agenda, Publicación de Contenido (Posts/Estados).

Clínica: Acceso a Perfil de Entidad y Visibilidad en Búsqueda. Uso Gratuito en MVP.

Admin: Control total. Función clave: Validación de Pagos Manuales y Gestión de Banners.

Módulos SSOT Requeridos:

Módulo de Identidad (AuthService): Almacena ID_Usuario y Rol_Inmutable.

// VIENE DE: AuthService -> VA HACIA: Todos los Componentes de Vista, Lógica y Seguridad.

Módulo de Suscripción (SubscriptionService): Almacena Fecha_Inicio, Fecha_Vencimiento y Estado_Actual (Free_Trial, Active_Paid, Expired).

// VIENE DE: SubscriptionService -> VA HACIA: SearchResults, DoctorProfile, AdminPanel.

Explicación Lógica: Esta separación garantiza que el chequeo de acceso esté desacoplado de los datos del perfil, permitiendo la evolución del modelo de negocio.

II. Funcionalidades Core del MVP
A. Perfiles y Data Mínima
Datos Mínimos Requeridos:

Doctor: Nombre completo, Especialidad, Licencia/Credenciales, Costo de Consulta (SSOT para Tarifas), Dirección del Consultorio.

Paciente (Nuevo): Perfil básico + Tipo de Sangre.

Mecanismo a Prueba de Fallos (Draft):

El perfil de Doctor solo se hará público si: 1) Todos los datos mínimos están completos Y 2) El estado de suscripción es Free_Trial o Active_Paid. El estado intermedio es "Borrador" (Draft).

B. Gestión de Suscripción y Pago Manual (Modelo $5/mes)
Ciclo de Suscripción:

Inicio: El Doctor se registra y se le asigna el estado Free_Trial (30 días).

Notificación: El sistema notifica el vencimiento y solicita el pago de $5 USD.

Reporte Manual de Pago: El Doctor carga el comprobante de transferencia y reporta el pago.

Tras el reporte, el estado del Doctor cambia a Pending_Validation.

Validación del Admin (Punto Crítico):

El Admin revisa y, si es válido, actualiza el estado a Active_Paid y establece la Fecha_Vencimiento (30 días futuros).

Si el Free Trial ha terminado y no hay pago validado, el estado pasa a Expired.

Acceso Condicional (Regla Central): El Perfil del Doctor se desactiva de la búsqueda y la Agenda se bloquea si el estado de suscripción es Expired.

C. Funcionalidad de Red Social y Agenda
Módulo de Contenido (ContentService):

Permitir al Doctor crear Posts (Contenido persistente) y Estados (Contenido efímero/temporal).

// VIENE DE: DoctorProfile -> VA HACIA: PatientFeed.

Módulo de Agenda (AppointmentService):

Doctor: Permite definir la Disponibilidad y gestionar el estado de las citas.

Paciente: Permite seleccionar y Reservar horarios disponibles.

Trazabilidad: Toda cita debe registrar ID_Doctor, ID_Paciente, Fecha/Hora y su Estado (Pendiente, Confirmada, Cancelada, Completada).

III. Estándares Técnicos Finales
Evitar Componentes Nivel Dios: Separar la lógica de Presentación (UI) de la lógica de Negocio (Gestión de Estado de Suscripción y Agenda).

Componentes Reutilizables: Crear componentes de entrada de datos (Input de Especialidad, Componente de Calificación) que puedan ser reutilizados por múltiples roles.

Trazabilidad: Toda función que lea o modifique estados críticos debe llevar la nota guía obligatoria (// VIENE DE: AuthService/SubscriptionService...).