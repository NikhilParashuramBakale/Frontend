# 🚀 Quick Start - Local Testing

## ✅ Prerequisites
- Frontend: Running on `http://localhost:5173`
- Backend: Running on `http://127.0.0.1:5000`
- Google Drive: Authenticated and has BAT folders
- BAT Folders: Named as `SERVER{X}_CLIENT{Y}_{batId}` with spectrograms

---

## 🧪 Testing Steps

### Step 1: Verify Backend Health
```bash
curl http://127.0.0.1:5000/api/health
```
Expected: `{"success": true, ...}`

### Step 2: Test Prediction Endpoint
Replace values with actual data:
```bash
curl "http://127.0.0.1:5000/api/predict/825?server=1&client=1"
```

### Step 3: Navigate in Frontend
1. Go to http://localhost:5173
2. Click Server → Client → Select a BAT ID
3. Wait for prediction (check console with F12)

### Step 4: Verify Display
- [ ] Species name shows (not "Loading...")
- [ ] Confidence badge appears (e.g., "92.5%")
- [ ] Species image loads
- [ ] No console errors (F12 → Console)

---

## 📊 Expected Console Logs

### Success:
```
🤖 Starting species prediction for BAT 825
✅ Prediction successful: Hipposideros_speoris (92.5%)
📸 Species image URL set: http://127.0.0.1:5000/api/species-image/Hipposideros_speoris
```

### Error:
```
🤖 Starting species prediction for BAT 999
⚠️ Prediction failed: Folder SERVER1_CLIENT1_999 not found
```

---

## 🛠️ Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "Model not available" | Check `backend/models/` files exist |
| "Folder not found" | Verify Google Drive folder naming |
| CORS error | Backend CORS configured for localhost:5173 |
| Image not loading | Species name doesn't match `bat_species/` filename |
| No prediction | Check backend logs for errors |

---

## 📋 Files Modified
- ✅ `backend/app.py` - Added 2 new routes
- ✅ `src/services/api.ts` - Added prediction functions
- ✅ `src/components/BatDetailsPage_clean.tsx` - Added UI logic

---

## 💬 Need Help?
1. Check `TESTING_GUIDE.md` for detailed testing scenarios
2. Check `IMPLEMENTATION_SUMMARY.md` for technical details
3. Look at backend console output for server-side errors
4. Check frontend console (F12) for client-side errors

