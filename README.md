# NiX Garden 🌸 — 和風 Voxel 種田家園

## 快速啟動（Live Server）

### 方法一：VS Code Live Server 插件
1. 用 VS Code 開啟 `NiX_Garden` 資料夾
2. 右鍵 `index.html` → **Open with Live Server**
3. 瀏覽器自動打開 http://127.0.0.1:5500

### 方法二：npm live-server
```bash
cd NiX_Garden
npm install
npm run dev
```

---

## 操作說明

| 操作 | 說明 |
|------|------|
| 左鍵/單指點擊地面 | 在目前模式放置物件 |
| 拖拉 | 旋轉鏡頭 |
| 滾輪 | 縮放 |
| 🌱 種植 按鈕 | 切換種植模式（點地面生成粉色植物）|
| 🪑 家具 按鈕 | 切換家具模式（隨機生成椅/桌/提燈）|
| 🗑️ 移除 按鈕 | 點擊已放置物件將其刪除 |

植物放下後 **5 秒自動長大**，並有彈跳動畫。

---

## 打包成 Android App（完整步驟）

### 前置需求

| 工具 | 版本 | 下載 |
|------|------|------|
| Node.js | >= 18 | https://nodejs.org |
| Android Studio | 最新版 | https://developer.android.com/studio |
| JDK | 17 | Android Studio 內建 |

### 步驟 1 — 安裝依賴

```bash
cd NiX_Garden
npm install
```

### 步驟 2 — 初始化 Capacitor

```bash
npx cap init "NiX Garden" "com.nixgarden.app" --web-dir=.
```

> 若 capacitor.config.ts 已存在，此步可跳過

### 步驟 3 — 加入 Android 平台

```bash
npx cap add android
```

此指令會在專案根目錄建立 `android/` 資料夾（Android Studio 專案）

### 步驟 4 — 同步 Web 資源到 Android

```bash
npx cap sync
```

每次修改 HTML/CSS/JS 後都需重新執行此步驟

### 步驟 5 — 用 Android Studio 開啟

```bash
npx cap open android
```

### 步驟 6 — 在 Android Studio 中

1. 等待 Gradle 同步完成
2. 連接 Android 實機（USB 偵錯開啟）或啟動模擬器
3. 點擊綠色 **Run** 按鈕 ▶

### 步驟 7（選用）— 直接執行到裝置

```bash
npx cap run android
```

---

## 資料夾結構

```
NiX_Garden/
├── index.html          # 主頁面 + UI overlay
├── style.css           # 和風 UI 樣式
├── main.js             # Three.js 遊戲邏輯
├── package.json        # npm 依賴
├── capacitor.config.ts # Capacitor 設定
├── android/            # （執行 cap add android 後自動生成）
└── README.md           # 本說明
```

---

## 進階調整

### 更改地圖大小
在 `main.js` 第 52 行：
```js
const GRID_SIZE = 24;  // 改成 32 可擴大地圖
```

### 更改成長時間
```js
setTimeout(() => growPlant(group), 5000);  // 5000ms = 5秒
```

### 加入新家具
在 `spawnFurniture()` 函數的 `types` 陣列中加入新類型，並在 if/else 區塊中定義幾何形狀。

---

*Made with Three.js + Capacitor • NiX Garden © 2026*
