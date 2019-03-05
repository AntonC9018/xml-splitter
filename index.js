const { app, BrowserWindow, dialog, Menu, ipcMain } = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs');

let window = null

// Wait until the app is ready
app.once('ready', () => {

  createMenu();

  // Create a new window
  window = new BrowserWindow({
    // Set the initial width to 500px
    width: 720,
    // Set the initial height to 600px
    height: 600,
    // Don't show the window until it ready, this prevents any white flickering
    show: false
  })

  // Load a URL in the window to the local index.html path
  window.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Show window when page is ready
  window.once('ready-to-show', () => {
    window.show()

  })
})

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Select file',
          click: () => dialog.showOpenDialog(window, {
            properties: ['openFile']
          }, filePaths => {
            if ( filePaths[0].endsWith('.XML') ) {
              const dirname = Path.dirname(filePaths[0]);
              window.webContents.send('path:set', dirname);
              const filename = Path.basename(filePaths[0]);
              window.webContents.send('file:set', filename)
            }
          })
        },
        {
          label: 'Select folder',
          click: openDirectory
        },
        {
          label: 'Preferences',
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu);
}

ipcMain.on('dialog', (event) => {
  openDirectory()
})

function openDirectory() {
  dialog.showOpenDialog(window, {
    properties: ['openDirectory']
  }, filePaths => {
    if (filePaths) window.webContents.send('path:set', filePaths[0])
  })
}
