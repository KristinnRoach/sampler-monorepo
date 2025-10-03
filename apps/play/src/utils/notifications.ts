let notificationElement: HTMLDivElement | undefined;

export const showNotification = (message: string, duration = 3000) => {
  if (!notificationElement) {
    notificationElement = document.createElement('div');
    notificationElement.className = 'notification';
    notificationElement.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 10px 15px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 1000;
      transform: translateY(20px);
      opacity: 0;
      transition: opacity 0.3s, transform 0.3s;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    `;
    document.body.appendChild(notificationElement);
  }

  notificationElement.innerHTML = message;
  notificationElement.style.opacity = '1';
  notificationElement.style.transform = 'translateY(0)';

  setTimeout(() => {
    if (notificationElement) {
      notificationElement.style.opacity = '0';
      notificationElement.style.transform = 'translateY(20px)';
    }
  }, duration);
};

export const cleanupNotifications = () => {
  if (notificationElement?.parentNode) {
    notificationElement.parentNode.removeChild(notificationElement);
  }
  notificationElement = undefined;
};
