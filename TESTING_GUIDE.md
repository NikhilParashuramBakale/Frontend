# 🧪 Species Prediction Feature - Testing Guide

## ✅ Local Testing Checklist

### Prerequisites
- ✅ Frontend running on `http://localhost:5173`
- ✅ Backend running on `http://127.0.0.1:5000`
- ✅ Google Drive integration authenticated
- ✅ BAT data folders in Google Drive with spectrograms

---

## 🔍 Testing Steps

### 1. **Health Check - Backend APIs**
Open browser and visit these endpoints to verify they exist:

```
http://127.0.0.1:5000/api/health
```
**Expected Response:**
```json
{
  "success": true,
  "message": "Backend service is running",
  "timestamp": "2025-10-17T..."
}
```

### 2. **Test Prediction Endpoint**
Replace `{bat_id}`, `{server}`, `{client}` with actual values:

```
GET http://127.0.0.1:5000/api/predict/{bat_id}?server=1&client=1
```

**Example:**
```
http://127.0.0.1:5000/api/predict/825?server=1&client=1
```

**Expected Response:**
```json
{
  "success": true,
  "species": "Hipposideros_speoris",
  "confidence": 92.5,
  "bat_id": "825",
  "folder": "SERVER1_CLIENT1_825"
}
```

**Error Response (if folder not found):**
```json
{
  "success": false,
  "message": "Folder SERVER1_CLIENT1_825 not found",
  "species": "Unknown species",
  "confidence": 0
}
```

### 3. **Test Species Image Endpoint**
```
GET http://127.0.0.1:5000/api/species-image/Hipposideros_speoris
```

**Expected:** Returns the image file from `backend/bat_species/` folder

**Fallback (if species not found):**
```
GET http://127.0.0.1:5000/api/species-image/Unknown_species
```

---

## 🎯 Frontend Testing

### 1. **Navigate to BAT Details Page**
1. Open http://localhost:5173
2. Click on a Server → Click on a Client → View data table
3. Click on any **BAT ID** in the data table
4. You should be redirected to `/bat/:serverNum/:clientNum/:batId`

### 2. **Check Species Prediction Display**
Once on the BAT Details page, verify:

- ✅ **Basic Information Section:**
  - [ ] Shows "Predicting..." spinner while loading
  - [ ] Displays predicted species name
  - [ ] Shows confidence percentage in green badge (e.g., "92.5%")
  - [ ] If error: Shows error message with warning icon

- ✅ **Species Photo Section:**
  - [ ] Loading spinner appears initially
  - [ ] Species image loads from backend (`/api/species-image/{species_name}`)
  - [ ] Displays actual species photograph
  - [ ] If image not found: Shows bat emoji + "Species photo not available"

### 3. **Console Logs (Press F12 → Console tab)**
Look for these debug logs:

```
🤖 Starting species prediction for BAT 825
✅ Prediction successful: Hipposideros_speoris (92.5%)
📸 Species image URL set: http://127.0.0.1:5000/api/species-image/Hipposideros_speoris
```

**For errors:**
```
❌ Error during prediction: [error message]
```

---

## 🧪 Test Scenarios

### Scenario 1: Successful Prediction ✅
**Setup:** BAT folder exists in Google Drive with spectrogram
**Expected:**
- Species name displayed
- Confidence shown
- Species photo loads
- No error messages

**Console Output:**
```
🤖 Starting species prediction for BAT 825
✅ Prediction successful: Hipposideros_speoris (92.5%)
📸 Species image URL set: http://127.0.0.1:5000/api/species-image/Hipposideros_speoris
```

### Scenario 2: Missing BAT Folder ❌
**Setup:** Click BAT ID that doesn't have corresponding Google Drive folder
**Expected:**
- "Predicting..." spinner shows
- Error message: "Folder SERVER1_CLIENT1_999 not found"
- Species shows "Unknown species"
- Species photo shows bat emoji with "not available" message

**Console Output:**
```
🤖 Starting species prediction for BAT 999
⚠️ Prediction failed: Folder SERVER1_CLIENT1_999 not found
```

### Scenario 3: Model Not Available ⚠️
**Setup:** Prediction model files missing
**Expected:**
- Error message: "Prediction model not available"
- Falls back to "Unknown species"
- Species image uses Unknown_species.jpg

**Console Output:**
```
❌ Error during prediction: Prediction model not available
```

### Scenario 4: Unknown Species ❓
**Setup:** Spectrogram confidence below threshold (< 75%)
**Expected:**
- Species shows predicted name (with confidence < 75%)
- Species image loads if available
- Display shows low confidence

---

## 📊 Backend Logs

Watch the terminal running `python app.py` for these logs:

### Successful Prediction:
```
INFO:__main__:Predicting species for BAT 825 (Server 1, Client 1)
INFO:__main__:Found spectrogram: spectrogram.jpg
INFO:__main__:Downloaded spectrogram to /tmp/tmpXXXXXX.jpg
High confidence prediction: Hipposideros_speoris (92.5%) -> Threshold: 75.0%
INFO:__main__:Cleaned up temporary file: /tmp/tmpXXXXXX.jpg
```

### Error Logs:
```
WARNING:__main__:Folder not found: SERVER1_CLIENT1_999
ERROR:__main__:Failed to import predict module: [error details]
```

---

## 🗂️ File Structure Verification

### Backend Structure:
```
backend/
├── app.py                          # ✅ Updated with /api/predict and /api/species-image
├── models/
│   ├── predict.py                 # ✅ Contains classify_image(image_path)
│   ├── efficientnet_b0_bat_3_dataset(1).pth
│   └── new_3_dataset_classes(1).json
├── bat_species/                    # ✅ Local species images
│   ├── Hipposideros_speoris.jpg
│   ├── Pipistrellus_coromandra.jpg
│   ├── Unknown_species.jpg
│   └── ... (39 species images)
└── requirements.txt
```

### Frontend Structure:
```
src/
├── services/
│   └── api.ts                      # ✅ Added predictSpecies() and getSpeciesImageUrl()
└── components/
    └── BatDetailsPage_clean.tsx    # ✅ Updated with prediction states and display
```

---

## 🚀 What Happens During Navigation

### Flow Diagram:
```
1. User clicks BAT ID
   ↓
2. Navigate to /bat/{serverNum}/{clientNum}/{batId}
   ↓
3. BatDetailsPage mounts (useEffect with empty deps)
   ↓
4. Fetch BAT files from Google Drive (for spectrogram, camera, audio, sensor)
   ↓
5. Second useEffect triggers when loading = false
   ↓
6. Call predictSpecies({batId}, {serverNum}, {clientNum})
   ↓
7. Backend:
   - Finds folder: SERVER{server}_CLIENT{client}_{batId}
   - Downloads spectrogram from Google Drive
   - Runs model.predict(spectrogram)
   - Returns {species, confidence}
   ↓
8. Frontend receives prediction result
   ↓
9. Call getSpeciesImageUrl(species) to get image URL
   ↓
10. Display species name, confidence, and image
    ↓
11. All done! ✅
```

---

## 🐛 Troubleshooting

### Issue: "Prediction model not available"
**Solution:**
- Check if `backend/models/predict.py` exists
- Verify `efficientnet_b0_bat_3_dataset(1).pth` is present
- Verify `new_3_dataset_classes(1).json` is present
- Check console for import errors

### Issue: "Failed to download spectrogram"
**Solution:**
- Verify Google Drive folder naming: `SERVER{server}_CLIENT{client}_{batId}`
- Ensure spectrogram file contains word "spectro" in name
- Check Google Drive authentication

### Issue: Species image shows bat emoji instead of actual image
**Solution:**
- Verify species name exactly matches filename in `backend/bat_species/`
- Check case sensitivity (Windows is case-insensitive, but better to match exactly)
- Verify file extension is `.jpg` or `.jpeg`

### Issue: CORS errors in browser console
**Solution:**
- Backend CORS is configured in `app.py` for:
  - `http://localhost:5173`
  - `http://localhost:3000`
  - `https://frontend-ten-eta-28.vercel.app`
  - `https://*.vercel.app`
- If using different URL, add to CORS configuration

---

## ✨ Expected User Experience

### Normal Flow:
1. User navigates to BAT details page
2. Sees loading spinner in "Basic Information" section
3. After 2-3 seconds, species name appears with confidence badge
4. Species photo area shows loading spinner
5. Species image appears
6. User can see all data on page

### Error Flow:
1. User navigates to BAT details page
2. Prediction attempt fails (orange warning banner)
3. Falls back to "Unknown species"
4. Species photo shows generic bat emoji

---

## 📝 Notes

- Predictions run **only once on page mount**
- Spectrogram is **temporarily downloaded** and deleted after prediction
- Species images are **cached locally** in `backend/bat_species/`
- Confidence threshold is **75%** (set in `backend/models/predict.py`)
- Low confidence predictions still return the species name (not "Unknown")

