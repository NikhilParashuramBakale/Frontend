# 📊 Species Prediction Feature - Visual Guide

## 🎯 User Flow

```
┌─────────────────────────────────┐
│   Dashboard (Server/Clients)    │
└────────────┬────────────────────┘
             │
             │ Click BAT ID
             ▼
┌─────────────────────────────────┐
│   BAT Details Page              │
│  /bat/:serverNum/:clientNum/:id │
└────────────┬────────────────────┘
             │
             │ useEffect triggers
             ▼
┌─────────────────────────────────┐
│   Fetch from Google Drive       │
│   - Spectrogram                 │
│   - Camera image                │
│   - Audio file                  │
│   - Sensor data                 │
└────────────┬────────────────────┘
             │
             │ Files loaded (loading=false)
             ▼
┌─────────────────────────────────┐
│   Second useEffect Triggers     │
│   setSpeciesPredicting(true)    │
└────────────┬────────────────────┘
             │
             │ Call predictSpecies()
             ▼
        [BACKEND]
┌─────────────────────────────────┐
│   GET /api/predict/{batId}      │
│   ?server=X&client=Y            │
└────────────┬────────────────────┘
             │
             │ Find folder: SERVER{X}_CLIENT{Y}_{batId}
             │ Download spectrogram
             │ Run ML model
             ▼
┌─────────────────────────────────┐
│   Response:                     │
│   {                             │
│     species: "Hipposideros..."  │
│     confidence: 92.5            │
│   }                             │
└────────────┬────────────────────┘
             │
        [FRONTEND]
             │
             ▼
┌─────────────────────────────────┐
│   Update UI:                    │
│   - Species name                │
│   - Confidence badge            │
│   - Call getSpeciesImageUrl()   │
└────────────┬────────────────────┘
             │
             │ Fetch image from /api/species-image/
             ▼
┌─────────────────────────────────┐
│   Display Result:               │
│   ✅ Species photo loaded       │
│   ✅ Species name displayed     │
│   ✅ Confidence shown           │
└─────────────────────────────────┘
```

---

## 🖼️ UI Components

### Basic Information Section
```
┌─────────────────────────────────────────┐
│ Basic Information                       │
│─────────────────────────────────────────│
│ Species:         Hipposideros_speoris ▪  │  ▪ = 92.5% confidence
│ Scientific Name: Hipposideros_speoris    │  (green badge)
│ BAT ID:          BAT825                  │
│ Location:        Kolar                   │
│ Date:            15/08/2024              │
│ Frequency:       45 kHz                  │
│                                         │
│ During Loading:                         │
│ [spinner] Predicting...                 │
│                                         │
│ On Error:                               │
│ ⚠️ Prediction failed: [error msg]       │
└─────────────────────────────────────────┘
```

### Species Photo Section
```
┌─────────────────────────────────────────┐
│ Species Photo                           │
│─────────────────────────────────────────│
│                                         │
│        [Species Image Here]             │
│        or                               │
│        🦇 (if image not found)          │
│   Species photo not available           │
│                                         │
└─────────────────────────────────────────┘
```

---

## 📂 File Organization

### Backend Structure
```
backend/
├── app.py
│   ├── @app.route('/api/predict/<bat_id>')
│   │   ├── Get query params (server, client)
│   │   ├── Find folder in Google Drive
│   │   ├── Download spectrogram
│   │   ├── Import models.predict
│   │   ├── Run classify_image()
│   │   └── Return {species, confidence}
│   │
│   └── @app.route('/api/species-image/<species_name>')
│       ├── Map species_name to file
│       ├── Search bat_species/ folder
│       ├── Return image or Unknown_species.jpg
│       └── Serve as binary file
│
├── models/
│   ├── predict.py
│   │   └── classify_image(image_path)
│   ├── efficientnet_b0_bat_3_dataset(1).pth
│   └── new_3_dataset_classes(1).json
│
└── bat_species/
    ├── Hipposideros_speoris.jpg
    ├── Pipistrellus_coromandra.jpg
    ├── Rhinolophus_rouxii.jpg
    ├── ... (36 more species)
    └── Unknown_species.jpg
```

### Frontend Structure
```
src/
├── services/
│   └── api.ts
│       ├── predictSpecies(batId, server, client)
│       │   └── Calls /api/predict/{batId}?server=X&client=Y
│       │
│       └── getSpeciesImageUrl(species_name)
│           └── Returns /api/species-image/{species_name}
│
└── components/
    └── BatDetailsPage_clean.tsx
        ├── State: predictedSpecies
        ├── State: speciesConfidence
        ├── State: speciesImageUrl
        ├── State: speciesPredicting
        ├── State: speciesPredictionError
        │
        ├── useEffect #1: Load BAT files
        │   └── Sets loading = false
        │
        ├── useEffect #2: Predict species
        │   ├── Trigger: [batId, serverNum, clientNum, loading]
        │   ├── Call: predictSpecies()
        │   ├── Set: speciesImageUrl = getSpeciesImageUrl()
        │   └── Display results in UI
        │
        ├── Basic Information Card
        │   ├── Display predicted species
        │   ├── Show confidence badge
        │   ├── Show loading spinner
        │   └── Show error message
        │
        └── Species Photo Card
            ├── Display species image
            ├── Show loading spinner
            └── Show fallback emoji
```

---

## 🔄 State Management

### useState Hooks in BatDetailsPage
```typescript
// Existing states
const [loading, setLoading] = useState(true);
const [sensorData, setSensorData] = useState(null);
const [spectrogramUrl, setSpectrogramUrl] = useState(null);
const [cameraUrl, setCameraUrl] = useState(null);

// NEW: Species prediction states
const [predictedSpecies, setPredictedSpecies] = useState(null);
    ↓ Species name from model prediction

const [speciesConfidence, setSpeciesConfidence] = useState(0);
    ↓ Confidence percentage (0-100)

const [speciesImageUrl, setSpeciesImageUrl] = useState(null);
    ↓ URL to species image from backend

const [speciesPredicting, setSpeciesPredicting] = useState(false);
    ↓ True during prediction (shows spinner)

const [speciesPredictionError, setSpeciesPredictionError] = useState(null);
    ↓ Error message if prediction fails
```

---

## 🔀 Request/Response Flow

### Request 1: Prediction
```
Frontend:
GET http://127.0.0.1:5000/api/predict/825?server=1&client=1

Backend:
1. folder_name = "SERVER1_CLIENT1_825"
2. Search Google Drive for folder
3. Find spectrogram.jpg in folder
4. Download to temp file
5. model.predict(temp_file)
6. Delete temp file
7. Return {species, confidence}

Frontend Response:
{
  "success": true,
  "species": "Hipposideros_speoris",
  "confidence": 92.5,
  "bat_id": "825",
  "folder": "SERVER1_CLIENT1_825"
}
```

### Request 2: Species Image
```
Frontend:
GET http://127.0.0.1:5000/api/species-image/Hipposideros_speoris

Backend:
1. Search backend/bat_species/ for file
2. Try: Hipposideros_speoris.jpg
3. Try: Hipposideros_speoris.jpeg
4. Try: Hipposideros_speoris.png
5. If not found: Use Unknown_species.jpg
6. Return image binary data

Frontend Response:
[Binary JPEG image data]
```

---

## ✨ Key Interactions

### 1. Navigation
```
User clicks BAT ID in table
  → handleBatIdClick() triggered
  → navigate(`/bat/${serverNum}/${clientNum}/${batId}`)
  → URL changes: /bat/1/1/825
  → BatDetailsPage component mounts
```

### 2. File Loading
```
BatDetailsPage mounts
  → useEffect #1 runs (empty dependency array)
  → setLoading(true)
  → fetchBatFiles(batId, serverNum, clientNum)
  → Fetch from Google Drive (files loaded)
  → setLoading(false)
  → Triggers useEffect #2
```

### 3. Prediction
```
useEffect #2 runs (dependencies: batId, serverNum, clientNum, loading)
  → setSpeciesPredicting(true)
  → predictSpecies(batId, serverNum, clientNum)
  → Backend prediction (2-3 seconds)
  → setPredictedSpecies(result.species)
  → setSpeciesConfidence(result.confidence)
  → setSpeciesImageUrl(getSpeciesImageUrl(species))
  → setSpeciesPredicting(false)
  → UI updates automatically (React re-render)
```

### 4. Error Handling
```
If prediction fails:
  → setSpeciesPredictionError(message)
  → setPredictedSpecies('Unknown species')
  → setSpeciesImageUrl(getSpeciesImageUrl('Unknown_species'))
  → Show error banner in UI
```

---

## 📊 Console Logs

### Success Flow
```
🤖 Starting species prediction for BAT 825
✅ Prediction successful: Hipposideros_speoris (92.5%)
📸 Species image URL set: http://127.0.0.1:5000/api/species-image/Hipposideros_speoris
```

### Error Flow
```
🤖 Starting species prediction for BAT 999
⚠️ Prediction failed: Folder SERVER1_CLIENT1_999 not found
```

### Backend Logs
```
INFO:__main__:Predicting species for BAT 825 (Server 1, Client 1)
INFO:__main__:Found spectrogram: spectrogram.jpg
INFO:__main__:Downloaded spectrogram to /tmp/tmpXXXXXX.jpg
High confidence prediction: Hipposideros_speoris (92.5%) -> Threshold: 75.0%
INFO:__main__:Cleaned up temporary file: /tmp/tmpXXXXXX.jpg
```

---

## 🎨 Color Scheme

| Element | Color | Meaning |
|---------|-------|---------|
| Spinner | 🟢 Emerald | Loading/Processing |
| Badge | 🟢 Emerald/Green | High confidence |
| Error | 🟠 Orange | Warning/Error |
| Text | 🔵 Blue | Species ID (mono font) |
| Hover | Glow | Interactive element |

---

## ⏱️ Timing

| Operation | Time | Notes |
|-----------|------|-------|
| Page load | Instant | HTML rendered |
| Fetch Google Drive files | 1-2s | Network dependent |
| Prediction | 2-3s | ML model inference |
| Image fetch | 1-2s | Backend file transfer |
| **Total** | **4-7s** | From click to full display |

