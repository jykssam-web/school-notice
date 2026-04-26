import { app, BrowserWindow, Tray, Menu, ipcMain, Notification, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import isDev from 'electron-is-dev';
import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let tray;
let firebaseUnsubscribe = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const startUrl = isDev
    ? 'http://localhost:3000/#/'
    : `file://${path.join(__dirname, 'dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });
}

function createTray() {
  tray = new Tray(nativeImage.createEmpty());

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '열기',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        } else {
          createWindow();
        }
      },
    },
    {
      label: '종료',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (mainWindow && mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      if (mainWindow) {
        mainWindow.show();
      } else {
        createWindow();
      }
    }
  });
}

// Firebase 초기화 (설정 로드 후)
async function startFirebaseListener() {
  if (firebaseUnsubscribe) return;

  try {
    const settingsPath = path.join(app.getPath('userData'), 'chalkboard-setup.json');
    if (!fs.existsSync(settingsPath)) return;

    const data = fs.readFileSync(settingsPath, 'utf-8');
    const setup = JSON.parse(data);

    if (!setup || !setup.schoolId || !setup.classId) return;

    // Firebase 설정
    const firebaseConfig = {
  apiKey: "AIzaSyBL-aN5qf0SJzFgxvuQwjKxGuE5KgXPuKI",
  authDomain: "gen-lang-client-0617105081.firebaseapp.com",
  projectId: "gen-lang-client-0617105081",
  storageBucket: "gen-lang-client-0617105081.firebasestorage.app",
  messagingSenderId: "84076770878",
  appId: "1:84076770878:web:b1b279a176354212b0036f"
};

    const firebaseApp = initializeApp(firebaseConfig);
    const db = getFirestore(firebaseApp);

    // Firebase 감시 시작
    const q = query(
      collection(db, 'schools', setup.schoolId, 'channels', setup.classId, 'notices'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    let lastNoticeId = null;

    firebaseUnsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docs.forEach((doc) => {
        const notice = doc.data();
        if (notice.id !== lastNoticeId) {
          lastNoticeId = notice.id;
          new Notification({
            title: '✨ 새로운 공지가 있습니다!',
            body: notice.content || '새 공지를 확인하세요.',
          }).show();
        }
      });
    });

  } catch (error) {
    console.error('Firebase 리스너 오류:', error);
  }
}

// 설정 저장/로드 IPC
ipcMain.handle('save-setup', (event, setupData) => {
  const settingsPath = path.join(app.getPath('userData'), 'chalkboard-setup.json');
  fs.writeFileSync(settingsPath, JSON.stringify(setupData));
  startFirebaseListener(); // 설정 저장 후 Firebase 리스너 시작!
  return true;
});

ipcMain.handle('load-setup', async (event) => {
  const settingsPath = path.join(app.getPath('userData'), 'chalkboard-setup.json');
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('설정 로드 오류:', error);
  }
  return null;
});

ipcMain.handle('delete-setup', (event) => {
  const settingsPath = path.join(app.getPath('userData'), 'chalkboard-setup.json');
  try {
    fs.unlinkSync(settingsPath);
    if (firebaseUnsubscribe) {
      firebaseUnsubscribe();
      firebaseUnsubscribe = null;
    }
    return true;
  } catch (error) {
    console.error('설정 삭제 오류:', error);
  }
  return false;
});

app.on('ready', () => {
  createWindow();
  createTray();
  startFirebaseListener();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // 앱을 완전히 종료하지 않음 (트레이에서 계속 실행)
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
ipcMain.on('show-notification', (event, { title, body }) => {
  console.log('알림 수신:', title, body); // ← 추가!
  new Notification({
    title: title,
    body: body,
  }).show();
});