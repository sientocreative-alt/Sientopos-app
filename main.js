const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const isDev = process.env.NODE_ENV === 'development';
    const startUrl = isDev
        ? (process.env.ELECTRON_START_URL || 'http://localhost:5173/pos') // Default Vite port is 5173
        : `file://${path.join(__dirname, 'client/dist/index.html')}`;

    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        title: 'SientoPOS',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    // Remove default menu
    win.setMenu(null);

    win.loadURL(startUrl);

    if (isDev) {
        win.webContents.openDevTools();
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
