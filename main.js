const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  // Load the index.html file
  mainWindow.loadFile('index.html');

  // Remove menu bar for cleaner look
  mainWindow.setMenuBarVisibility(false);

  // Open DevTools only in development mode
  mainWindow.webContents.openDevTools();
}

// Create window when Electron is ready
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create a window when dock icon is clicked and no windows are open
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle open file dialog
ipcMain.handle('open-file-dialog', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Videos', extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm'] }
    ]
  });
  
  if (!canceled && filePaths.length > 0) {
    return filePaths[0];
  }
  
  return null;
});

// Handle save file dialog
ipcMain.handle('save-file-dialog', async (event, defaultPath, format) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: defaultPath || 'enhanced_video',
    filters: [
      { name: 'Video', extensions: [format.toLowerCase()] }
    ]
  });
  
  if (!canceled && filePath) {
    return filePath;
  }
  
  return null;
});

// Add this with other ipcMain handlers
ipcMain.handle('execute-enhancement', async (event, { projectPath, inputPath, outputPath, model, scalessettings }) => {
  try {
    const venvActivate = path.join(projectPath, '.venv', 'Scripts', 'activate.bat');
    const scriptPath = path.join(projectPath, 'inference_realesrgan_video.py');

    // Verify all paths exist
    if (!fs.existsSync(venvActivate)) throw new Error(`Activate script not found at ${venvActivate}`);
    if (!fs.existsSync(scriptPath)) throw new Error(`Script not found at ${scriptPath}`);
    if (!fs.existsSync(inputPath)) throw new Error(`Input file not found at ${inputPath}`);

    // Prepare chained command
    const command = `cmd.exe /c "cd /d ${projectPath} && call .venv\\Scripts\\activate.bat && python "${scriptPath}" -i "${inputPath}" -o "${outputPath}" -n ${model} --outscale ${scalessettings} --face_enhance"`;

    console.log('Executing command:', command);
    const { stdout, stderr } = await execPromise(command, {
      cwd: projectPath,
      maxBuffer: 1024 * 1024 * 50 // 50MB buffer for large outputs
    });

    const outputFile = path.join(outputPath, `enhanced_${path.basename(inputPath)}`);
    if (!fs.existsSync(outputFile)) {
      throw new Error(`Output file not created at ${outputFile}\nSTDOUT: ${stdout}\nSTDERR: ${stderr}`);
    }

    return {
      success: true,
      output: stdout || stderr,
      outputFile: outputFile
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
});

// Add this with other ipcMain handlers
ipcMain.handle('get-file-path', async (event, fileName) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Select the video file',
    properties: ['openFile'],
    filters: [
      { name: 'Videos', extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm'] }
    ],
    defaultPath: fileName
  });
  
  if (!canceled && filePaths.length > 0) {
    return filePaths[0];
  }
  return null;
});
