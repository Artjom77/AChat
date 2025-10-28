// PWA Initialization
// Service Worker, Push Notifications, Install Prompt

class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.swRegistration = null;
    }

    // Initialize PWA features
    async init() {
        console.log('[PWA] Initializing...');

        // Register Service Worker
        await this.registerServiceWorker();

        // Setup install prompt
        this.setupInstallPrompt();

        // Request notification permission
        this.setupNotifications();

        // Handle online/offline events
        this.setupOnlineOfflineHandlers();

        console.log('[PWA] Initialized successfully');
    }

    // Register Service Worker
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                this.swRegistration = await navigator.serviceWorker.register('/service-worker.js');
                console.log('[PWA] Service Worker registered:', this.swRegistration);

                // Check for updates every 30 minutes
                setInterval(() => {
                    this.swRegistration.update();
                }, 30 * 60 * 1000);

                // Listen for updates
                this.swRegistration.addEventListener('updatefound', () => {
                    const newWorker = this.swRegistration.installing;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateNotification();
                        }
                    });
                });

            } catch (error) {
                console.error('[PWA] Service Worker registration failed:', error);
            }
        }
    }

    // Show update notification
    showUpdateNotification() {
        const banner = document.createElement('div');
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #4CAF50;
            color: white;
            padding: 15px;
            text-align: center;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        banner.innerHTML = `
            <strong>Доступна новая версия AChat!</strong>
            <button onclick="window.location.reload()" style="
                background: white;
                color: #4CAF50;
                border: none;
                padding: 8px 20px;
                border-radius: 5px;
                margin-left: 15px;
                cursor: pointer;
                font-weight: bold;
            ">Обновить</button>
        `;
        document.body.appendChild(banner);
    }

    // Setup install prompt
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('[PWA] Install prompt triggered');

            // Prevent the default prompt
            e.preventDefault();

            // Store the event
            this.deferredPrompt = e;

            // Show custom install button
            this.showInstallButton();
        });

        // Track installation
        window.addEventListener('appinstalled', () => {
            console.log('[PWA] App installed successfully');
            this.deferredPrompt = null;

            // Hide install button
            const installBtn = document.getElementById('pwa-install-btn');
            if (installBtn) {
                installBtn.style.display = 'none';
            }

            // Show success message
            this.showNotification('AChat установлен! 🎉', 'success');
        });
    }

    // Show install button
    showInstallButton() {
        // Check if button already exists
        if (document.getElementById('pwa-install-btn')) return;

        const button = document.createElement('button');
        button.id = 'pwa-install-btn';
        button.innerHTML = '📲 Установить AChat';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 25px;
            border-radius: 50px;
            font-size: 1em;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            z-index: 9999;
            transition: transform 0.2s;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.05)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
        });

        button.addEventListener('click', async () => {
            if (!this.deferredPrompt) return;

            // Show the install prompt
            this.deferredPrompt.prompt();

            // Wait for the user's response
            const { outcome } = await this.deferredPrompt.userChoice;
            console.log('[PWA] Install prompt outcome:', outcome);

            // Clear the deferred prompt
            this.deferredPrompt = null;

            // Hide the button
            button.style.display = 'none';
        });

        document.body.appendChild(button);
    }

    // Setup notifications
    async setupNotifications() {
        if (!('Notification' in window)) {
            console.log('[PWA] Notifications not supported');
            return;
        }

        // Check current permission
        if (Notification.permission === 'granted') {
            await this.subscribeToPushNotifications();
        }
    }

    // Request notification permission
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            console.log('[PWA] Notification permission granted');
            await this.subscribeToPushNotifications();
            return true;
        }

        return false;
    }

    // Subscribe to push notifications
    async subscribeToPushNotifications() {
        if (!this.swRegistration) {
            console.log('[PWA] No service worker registration');
            return;
        }

        try {
            // Check if already subscribed
            let subscription = await this.swRegistration.pushManager.getSubscription();

            if (!subscription) {
                // Generate VAPID keys on server and use public key here
                // For now, just create a subscription
                subscription = await this.swRegistration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: null // Replace with your VAPID public key
                });

                console.log('[PWA] Push subscription created:', subscription);

                // Send subscription to server
                await this.sendSubscriptionToServer(subscription);
            }

            return subscription;
        } catch (error) {
            console.error('[PWA] Push subscription failed:', error);
        }
    }

    // Send subscription to server
    async sendSubscriptionToServer(subscription) {
        try {
            // TODO: Send to backend
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(subscription)
            });

            if (response.ok) {
                console.log('[PWA] Subscription sent to server');
            }
        } catch (error) {
            console.error('[PWA] Failed to send subscription:', error);
        }
    }

    // Show local notification
    async showLocalNotification(title, options = {}) {
        if (Notification.permission !== 'granted') {
            return;
        }

        const defaultOptions = {
            icon: '/icon-192.png',
            badge: '/icon-96.png',
            vibrate: [200, 100, 200],
            ...options
        };

        if (this.swRegistration) {
            await this.swRegistration.showNotification(title, defaultOptions);
        } else {
            new Notification(title, defaultOptions);
        }
    }

    // Handle online/offline events
    setupOnlineOfflineHandlers() {
        window.addEventListener('online', () => {
            console.log('[PWA] Connection restored');
            this.showNotification('Соединение восстановлено ✅', 'success');

            // Trigger background sync
            if (this.swRegistration && 'sync' in this.swRegistration) {
                this.swRegistration.sync.register('sync-messages');
            }
        });

        window.addEventListener('offline', () => {
            console.log('[PWA] Connection lost');
            this.showNotification('Нет соединения 📡', 'warning');
        });
    }

    // Show notification (reuse from contacts)
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196F3'};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Check if app is installed
    isStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone ||
               document.referrer.includes('android-app://');
    }

    // Get install status
    async getInstallStatus() {
        if (this.isStandalone()) {
            return 'installed';
        }

        if (this.deferredPrompt) {
            return 'installable';
        }

        return 'not-installable';
    }
}

// Create global instance
const pwaManager = new PWAManager();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => pwaManager.init());
} else {
    pwaManager.init();
}

// Export for use in other modules
window.pwaManager = pwaManager;
