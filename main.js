const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const heicConvert = require('heic-convert');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 600,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.loadFile("index.html");
}

app.whenReady().then(() => {
    createWindow();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

ipcMain.handle('convert-heic', async (event, filePath) => {
  try {
    const inputBuffer = fs.readFileSync(filePath);
    const outputBuffer = await heicConvert({
      buffer: inputBuffer,
      format: 'PNG'
    });
    return { success: true, base64: outputBuffer.toString('base64') };
  } catch (err) {
    return { success: false, error: err.message };
  }
});