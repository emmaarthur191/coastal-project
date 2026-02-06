# 🚀 Live Client Proposal: "Zero-Maintenance" Apps

**Target Systems**:
1.  **Windows App** (for Managers/Cashiers)
2.  **Android App** (for Mobile Bankers)

 **Core Concept**:
Instead of bundling the entire application logic inside the app, we create **Secure Native Wrappers** that load the live application from your cloud server (`https://coastal-project.onrender.com`).

---

## 🏗️ Architecture: The "Thin Client" Model

### 1. The Cloud (Render)
- **Role**: The "Brain"
- **Contains**: Database, Backend Logic, User Accounts, ML Models.
- **Status**: Already deployed and working.

### 2. The Windows Client (`CoastalConnect.exe`)
- **Technology**: Python + `pywebview`
- **Size**: ~50 MB
- **Function**: Opens a native window (no address bar) pointing to the Render URL.
- **Authentication**: Uses secure, HTTP-only cookies (persisted on disk).

### 3. The Android Client (`CoastalMobile.apk`)
- **Technology**: CapacitorJS
- **Size**: ~10 MB
- **Function**: Native Android app pointing to the Render URL.
- **Native Features**: Camera access (for KYC), GPS (for Visits), Biometrics (future).

---

## ✅ Key Benefits

### 1. Instant Global Updates (Zero-Touch)
*   **Problem**: Fixing a bug usually requires sending a new `.exe` or `.apk` to every staff member.
*   **Solution**: With this model, you just `git push` to Render. **The next time any user opens their app, they have the update instantly.**

### 2. Enhanced Security
*   **No Browser Navigation**: Users cannot type URLs or visit YouTube/Facebook. They are locked into the banking app.
*   **Data Safety**: No sensitive data is stored permanently on the device (unlike a full offline app). If a device is stolen, you just disable the user account on the server.

### 3. Hardware Access
*   **Field Operations**: The Android app can access the **Camera** to snap photos of ID cards for new client registration.
*   **Location Verification**: The Android app can tag GPS coordinates when a mobile banker processes a deposit.

---

## 📅 Implementation Plan

### Phase 1: Windows Client (2-3 Days)
1.  Create `desktop_entry.py` wrapper script.
2.  Configure `pywebview` for secure cookie storage.
3.  Bundle with `PyInstaller` into `CoastalBanking.exe`.
4.  **Deliverable**: A single `.exe` file for staff laptops.

### Phase 2: Android Client (2-3 Days)
1.  Initialize Capacitor in `frontend/`.
2.  Configure Android manifest (permissions: Internet, Camera, Location).
3.  Set "Server URL" in Capacitor config to point to Render.
4.  Build APK with Android Studio.
5.  **Deliverable**: A `.apk` file for mobile bankers.

### Phase 3: Update Protocol
*   **Daily Updates**: Push to GitHub → Render Auto-Deploys.
*   **Major Updates**: Only needed if changing the App Icon or Native Permissions (Camera/GPS).

---

## 💰 Cost & Maintenance
*   **Cost**: **$0**. Uses open-source tools (PyInstaller, Capacitor).
*   **Maintenance**: Near zero. You maintain **one codebase** (the web app), and it feeds all three platforms (Web, Windows, Android) automatically.

---

**Recommendation**: APPROVE this approach. It is the industry standard for agile fintech startups to maintain velocity without getting bogged down in app store approval cycles.
