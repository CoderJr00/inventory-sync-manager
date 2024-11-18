"use client";

type NotificationType = 'error' | 'success' | 'warning';

interface NotificationProps {
    type: NotificationType;
    title: string;
    message: string | React.ReactNode;
    duration?: number;
}

export const showNotification = ({ type, title, message, duration = 5000 }: NotificationProps) => {
    const notificationDiv = document.createElement('div');
    const baseClasses = 'fixed bottom-4 right-4 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-500 ease-in-out z-50 flex items-center gap-3 max-w-md';
    
    // Configurar clases según el tipo
    const typeClasses = {
        error: 'bg-red-500 text-white',
        success: 'bg-green-500 text-white',
        warning: 'bg-yellow-500 text-white'
    };

    // Configurar icono según el tipo
    const icons = {
        error: `<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>`,
        success: `<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>`,
        warning: `<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>`
    };

    notificationDiv.className = `${baseClasses} ${typeClasses[type]} translate-x-full`;
    notificationDiv.innerHTML = `
        <div class="flex-shrink-0">
            ${icons[type]}
        </div>
        <div class="flex-1">
            <h3 class="font-bold">${title}</h3>
            <div class="text-sm">${typeof message === 'string' ? message : ''}</div>
        </div>
        <button class="flex-shrink-0 ml-4" onclick="this.parentElement.remove()">
            <svg class="h-5 w-5 text-white opacity-50 hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    `;

    document.body.appendChild(notificationDiv);

    // Animación de entrada
    setTimeout(() => {
        notificationDiv.style.transform = 'translateX(0)';
    }, 100);

    // Auto-cerrar después del tiempo especificado
    setTimeout(() => {
        notificationDiv.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notificationDiv.remove();
        }, 500);
    }, duration);

    return notificationDiv;
}; 