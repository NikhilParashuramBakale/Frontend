import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Play, Volume2, Loader2, AlertCircle } from 'lucide-react';
import { NavigationMenu } from './NavigationMenu';
import { useMenu } from '../context/MenuContext';
import { fetchBatFiles, getFileUrl } from '../services/api';

interface EnvironmentalData {
  temperature: number;
  humidity: number;
  pressure: number;
  lightLevel: number;
}

interface BatData {
  id: string;
  species: string;
  scientificName: string;
  location: string;
  date: string;
  frequency: string;
  spectrogramImage: string;
  soundTracks: string[];
  environmentalData: EnvironmentalData;
  confidence: string;
  duration: string;
  temperature: string;
  humidity: string;
  quality: string;
}

const BatDetailsPage: React.FC = () => {
  const { batId } = useParams<{ batId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isExpanded } = useMenu();

  // Get navigation state (server and client info)
  const navigationState = location.state as {
    serverName?: string;
    clientName?: string;
    serverNum?: string;
    clientNum?: string;
    batId?: string;
  } | null;

  // States for Google Drive file fetching
  const [loading, setLoading] = useState(true);
  
  // Sensor data states
  const [sensorData, setSensorData] = useState<EnvironmentalData | null>(null);
  const [sensorLoading, setSensorLoading] = useState(false);
  const [sensorError, setSensorError] = useState<string | null>(null);

  // Image URLs
  const [spectrogramUrl, setSpectrogramUrl] = useState<string | null>(null);
  const [cameraUrl, setCameraUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadBatFiles = async () => {
      console.log('BatDetailsPage: Starting loadBatFiles');
      console.log('batId:', batId);
      console.log('navigationState:', navigationState);
      
      if (!batId || !navigationState?.serverNum || !navigationState?.clientNum) {
        console.log('Missing required parameters:', {
          batId,
          serverNum: navigationState?.serverNum,
          clientNum: navigationState?.clientNum
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Calling fetchBatFiles with:', {
          batId,
          serverNum: navigationState.serverNum,
          clientNum: navigationState.clientNum
        });
        
        const files = await fetchBatFiles(
          batId,
          navigationState.serverNum,
          navigationState.clientNum
        );
        
        console.log('fetchBatFiles response:', files);
        
        // Set image URLs if files exist
        if (files.files?.spectrogram) {
          setSpectrogramUrl(getFileUrl(files.files.spectrogram.id, files.files.spectrogram.name));
        }
        if (files.files?.camera) {
          setCameraUrl(getFileUrl(files.files.camera.id, files.files.camera.name));
        }
        
        // Parse sensor data if available
        if (files.files?.sensor) {
          setSensorLoading(true);
          try {
            const response = await fetch(getFileUrl(files.files.sensor.id, files.files.sensor.name));
            const text = await response.text();
            
            // Parse sensor.txt format
            const lines = text.split('\n');
            const data: any = {};
            
            lines.forEach(line => {
              if (line.includes('Temperature:')) {
                const temp = line.split('Temperature:')[1]?.trim().replace('°C', '');
                data.temperature = parseFloat(temp || '0');
              } else if (line.includes('Humidity:')) {
                const hum = line.split('Humidity:')[1]?.trim().replace('%', '');
                data.humidity = parseFloat(hum || '0');
              } else if (line.includes('Pressure:')) {
                const press = line.split('Pressure:')[1]?.trim().replace('hPa', '');
                data.pressure = parseFloat(press || '0');
              } else if (line.includes('Light Level:')) {
                const light = line.split('Light Level:')[1]?.trim().replace('lux', '');
                data.lightLevel = parseFloat(light || '0');
              }
            });
            
            setSensorData(data as EnvironmentalData);
          } catch (err) {
            setSensorError('Failed to parse sensor data');
            console.error('Sensor parsing error:', err);
          } finally {
            setSensorLoading(false);
          }
        }
        
      } catch (err) {
        console.error('Error loading BAT files:', err);
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    loadBatFiles();
  }, [batId, navigationState]);

  // Sample bat data
  const batData: BatData = {
    id: batId || 'BAT001',
    species: 'Pipistrellus pipistrellus',
    scientificName: 'Pipistrellus pipistrellus',
    location: 'Kolar',
    date: '15/08/2024',
    frequency: '45 kHz',
    spectrogramImage: 'spectrogram.jpg',
    soundTracks: ['audio_001_1.wav', 'audio_001_2.wav'],
    environmentalData: {
      temperature: 23.5,
      humidity: 65.2,
      pressure: 1013.25,
      lightLevel: 0.05
    },
    confidence: '92%',
    duration: '12ms',
    temperature: '24°C',
    humidity: '75%',
    quality: 'High'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/80 to-blue-50/30 relative">
      <NavigationMenu />
      
      {/* Header with back button */}
      <div className={`bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-700 shadow-lg transition-all duration-300 ${isExpanded ? 'ml-64' : 'ml-16'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 border-b border-emerald-600/20 h-16 flex items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">BAT ID: {batData.id}</h1>
              {navigationState && (
                <p className="text-sm text-emerald-100">
                  {navigationState.serverName} → {navigationState.clientName}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`max-w-7xl mx-auto px-4 py-8 transition-all duration-300 ${isExpanded ? 'ml-64' : 'ml-16'}`}>
        
        {/* Basic Information and Species Photo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Basic Information Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 min-h-64 hover:shadow-lg hover:border-emerald-300 transition-all duration-300 hover:scale-[1.02]">
            <h3 className="text-base font-semibold mb-3 text-emerald-600">Basic Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Species:</span>
                <span className="text-sm text-gray-900">{batData.species}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Scientific Name:</span>
                <span className="text-sm text-gray-900 italic">{batData.species}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">BAT ID:</span>
                <span className="text-sm text-blue-600 font-mono">{batData.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Location:</span>
                <span className="text-sm text-gray-900">{batData.location}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Date:</span>
                <span className="text-sm text-gray-900">{batData.date}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Frequency:</span>
                <span className="text-sm text-gray-900">{batData.frequency}</span>
              </div>
            </div>
          </div>

          {/* Species Photo Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 min-h-64 hover:shadow-lg hover:border-emerald-300 transition-all duration-300 hover:scale-[1.02]">
            <h3 className="text-base font-semibold mb-3 text-emerald-600">Species Photo</h3>
            <div className="h-48 bg-gray-100 rounded-lg flex flex-col items-center justify-center">
              <div className="flex flex-col items-center">
                <span className="text-4xl mb-1">📷</span>
                <p className="text-sm text-center text-gray-600">No species photo available</p>
              </div>
            </div>
          </div>
        </div>

        {/* Audio Recording and Camera Image */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Audio Recording Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 min-h-64 hover:shadow-lg hover:border-emerald-300 transition-all duration-300 hover:scale-[1.02]">
            <h3 className="text-base font-semibold mb-3 text-emerald-600">Audio Recording</h3>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Play className="w-5 h-5 text-emerald-500" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">audio_001_1.wav</div>
                    <div className="text-xs text-gray-500">Ultrasonic Recording</div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Volume2 className="w-4 h-4" />
                    <span>2.3s</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Camera Image Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 min-h-64 hover:shadow-lg hover:border-emerald-300 transition-all duration-300 hover:scale-[1.02]">
            <h3 className="text-base font-semibold mb-3 text-emerald-600">Camera Image</h3>
            <div className="h-48 bg-gray-100 rounded-lg flex flex-col items-center justify-center">
              {loading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
                  <p className="text-sm text-gray-600">Loading camera image...</p>
                </div>
              ) : cameraUrl ? (
                <img 
                  src={cameraUrl} 
                  alt="Camera Image" 
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                  }}
                />
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-4xl mb-1">📷</span>
                  <p className="text-sm text-center text-gray-600">No camera image available</p>
                </div>
              )}
              <div className="hidden flex-col items-center">
                <span className="text-4xl mb-1">❌</span>
                <p className="text-sm text-center text-gray-600">Failed to load camera image</p>
              </div>
            </div>
          </div>
        </div>

        {/* Spectrogram Image and Sensor Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Spectrogram Image Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 min-h-64 hover:shadow-lg hover:border-emerald-300 transition-all duration-300 hover:scale-[1.02]">
            <h3 className="text-base font-semibold mb-3 text-emerald-600">Spectrogram Image</h3>
            <div className="h-48 bg-gray-100 rounded-lg flex flex-col items-center justify-center">
              {loading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
                  <p className="text-sm text-gray-600">Loading spectrogram...</p>
                </div>
              ) : spectrogramUrl ? (
                <img 
                  src={spectrogramUrl} 
                  alt="Spectrogram" 
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                  }}
                />
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-4xl mb-1">📊</span>
                  <p className="text-sm text-center text-gray-600">No spectrogram available</p>
                </div>
              )}
              <div className="hidden flex-col items-center">
                <span className="text-4xl mb-1">❌</span>
                <p className="text-sm text-center text-gray-600">Failed to load spectrogram</p>
              </div>
            </div>
          </div>

          {/* Sensor Data Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 min-h-64 hover:shadow-lg hover:border-emerald-300 transition-all duration-300 hover:scale-[1.02]">
            <h3 className="text-base font-semibold mb-3 text-emerald-600">Sensor Data</h3>
            <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-400 scrollbar-track-emerald-100">
              {sensorLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                    <span className="text-sm text-gray-600">Loading sensor data...</span>
                  </div>
                </div>
              ) : sensorError ? (
                <div className="flex items-center justify-center h-32">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-gray-600">{sensorError}</span>
                  </div>
                </div>
              ) : sensorData ? (
                <div className="space-y-2 text-sm">
                  <div className="bg-blue-50 p-3 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-blue-700">📊 Environmental Readings</span>
                      <span className="text-xs text-blue-600">Real-time Data</span>
                    </div>
                    <div className="mt-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><strong>Temperature:</strong> {sensorData.temperature.toFixed(2)}°C</div>
                        <div><strong>Humidity:</strong> {sensorData.humidity.toFixed(2)}%</div>
                        <div><strong>Pressure:</strong> {sensorData.pressure.toFixed(2)} hPa</div>
                        <div><strong>Light Level:</strong> {sensorData.lightLevel.toFixed(2)} lux</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <span className="text-sm text-gray-600">No sensor data available</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Environmental Conditions and Guano Metadata */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Environmental Conditions Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 min-h-64 hover:shadow-lg hover:border-emerald-300 transition-all duration-300 hover:scale-[1.02]">
            <h3 className="text-base font-semibold mb-4 text-emerald-600">Environmental Conditions</h3>
            {sensorLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                  <span className="text-sm text-gray-600">Loading sensor data...</span>
                </div>
              </div>
            ) : sensorData ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Temperature:</span>
                  <span className="text-sm text-gray-900 font-bold">{sensorData.temperature.toFixed(2)}°C</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Humidity:</span>
                  <span className="text-sm text-gray-900 font-bold">{sensorData.humidity.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pressure:</span>
                  <span className="text-sm text-gray-900 font-bold">{sensorData.pressure.toFixed(2)} hPa</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Light Level:</span>
                  <span className="text-sm text-gray-900 font-bold">{sensorData.lightLevel.toFixed(2)} lux</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <div className="flex flex-col items-center">
                  <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">No sensor data available</span>
                </div>
              </div>
            )}
          </div>

          {/* Guano Metadata Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-lg hover:border-emerald-300 transition-all duration-300 hover:scale-[1.02]">
            <h3 className="text-base font-semibold mb-4 text-emerald-600">Guano Metadata</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">GUANO|Version:</span>
                <span className="text-sm text-gray-900 font-mono">1.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Species:</span>
                <span className="text-sm text-gray-900">Pipistrellus pipistrellus</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Location:</span>
                <span className="text-sm text-gray-900">Kolar</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Timestamp:</span>
                <span className="text-sm text-gray-900">15/08/2024</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Filter:</span>
                <span className="text-sm text-gray-900">High-pass 10kHz</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Sample Rate:</span>
                <span className="text-sm text-gray-900">384kHz</span>
              </div>
            </div>
          </div>
        </div>

        {/* Spectrogram Analysis */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 hover:shadow-lg hover:border-emerald-300 transition-all duration-300 hover:scale-[1.02]">
          <h3 className="text-lg font-semibold mb-6 text-emerald-600">Spectrogram Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Species Identification */}
            <div className="text-center">
              <div className="relative mb-3">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-600">85%</div>
              </div>
              <div className="text-sm text-gray-600">Species Identification</div>
            </div>

            {/* Peak Frequency */}
            <div className="text-center">
              <div className="relative mb-3">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">♪</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-purple-600">42kHz</div>
              </div>
              <div className="text-sm text-gray-600">Peak Frequency</div>
            </div>

            {/* Call Duration */}
            <div className="text-center">
              <div className="relative mb-3">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">⏱</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-orange-600">12ms</div>
              </div>
              <div className="text-sm text-gray-600">Call Duration</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end space-y-3 sm:space-y-0 sm:space-x-3">
          <button className="w-full sm:w-auto px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors">
            Export Data
          </button>
          <button className="w-full sm:w-auto px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatDetailsPage;
