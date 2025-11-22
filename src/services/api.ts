// API service for backend communication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('🔧 API Configuration:', {
  API_BASE_URL,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  NODE_ENV: import.meta.env.MODE
});

export interface BatFile {
  id: string;
  name: string;
  mimeType: string;
  downloadUrl: string;
  modifiedDate: string;
}

export interface BatFilesResponse {
  success: boolean;
  message?: string;
  folder_name?: string;
  folder_id?: string;
  files?: {
    spectrogram: BatFile | null;
    camera: BatFile | null;
    sensor: BatFile | null;
    audio: BatFile | null;
    other: BatFile[];
  };
}

export interface BatFolder {
  id: string;
  name: string;
  modifiedDate: string;
  serverNum: string;
  clientNum: string;
  batId: string;
}

export interface BatFoldersResponse {
  success: boolean;
  total_folders: number;
  folders: BatFolder[];
}

/**
 * Fetch all BAT folders from Google Drive
 */
export const fetchAllBatFolders = async (): Promise<BatFoldersResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/debug/folders`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Parse folder names to extract server, client, and BAT ID info
    const parsedFolders: BatFolder[] = data.folders.map((folder: any) => {
      const match = folder.name.match(/SERVER(\d+)_CLIENT(\d+)_(\d+)/);
      if (match) {
        return {
          id: folder.id,
          name: folder.name,
          modifiedDate: folder.modifiedDate,
          serverNum: match[1],
          clientNum: match[2],
          batId: match[3]
        };
      }
      return null;
    }).filter(Boolean);
    
    return {
      success: data.success,
      total_folders: parsedFolders.length,
      folders: parsedFolders
    };
  } catch (error) {
    console.error('Error fetching BAT folders:', error);
    return {
      success: false,
      total_folders: 0,
      folders: []
    };
  }
};

/**
 * Fetch files for a specific BAT ID
 */
export const fetchBatFiles = async (
  batId: string,
  serverNum: string,
  clientNum: string
): Promise<BatFilesResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/bat/${batId}/files?server=${serverNum}&client=${clientNum}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching bat files:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Get the URL for a specific file
 */
export const getFileUrl = (fileId: string, fileName: string): string => {
  return `${API_BASE_URL}/file/${fileId}?name=${encodeURIComponent(fileName)}`;
};

/**
 * Health check for backend service
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
};

/**
 * Predict bat species from spectrogram in Google Drive
 */
export interface PredictionResponse {
  success: boolean;
  species?: string;
  confidence?: number;
  bat_id?: string;
  folder?: string;
  message?: string;
}

export const predictSpecies = async (
  batId: string,
  serverNum: string,
  clientNum: string
): Promise<PredictionResponse> => {
  try {
    // Strip "BAT" prefix if present (e.g., "BAT825" -> "825")
    const cleanBatId = batId.replace(/^BAT/i, '');
    
    const url = `${API_BASE_URL}/predict/${cleanBatId}?server=${serverNum}&client=${clientNum}`;
    console.log('🔗 Calling predict endpoint:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: PredictionResponse = await response.json();
    console.log('✅ Prediction response:', data);
    return data;
  } catch (error) {
    console.error('Error predicting species:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Get species image URL
 */
export const getSpeciesImageUrl = (speciesName: string): string => {
  const url = `${API_BASE_URL}/species-image/${encodeURIComponent(speciesName)}`;
  console.log('🖼️ Species image URL:', url);
  return url;
};
