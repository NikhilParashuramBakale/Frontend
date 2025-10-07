import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, Play, Volume2, AlertCircle } from 'lucide-react';
import { NavigationMenu } from './NavigationMenu';
import { useMenu } from '../context/MenuContext';
import { fetchBatFiles, getFileUrl } from '../services/api';

interface EnvironmentalData {
  temperature: number;
  humidity: number;
  pressure: number;
  lightLevel: number;
}

const BatDetailsPage: React.FC = () => {
  const { batId, serverNum, clientNum } = useParams<{ batId: string; serverNum: string; clientNum: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isExpanded } = useMenu();

  console.log('BatDetailsPage mounted with params:', { batId, serverNum, clientNum, pathname: location.pathname });

  // Get navigation state (server and client info) - fallback if not in params
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

  // Image and Audio URLs
  const [spectrogramUrl, setSpectrogramUrl] = useState<string | null>(null);
  const [cameraUrl, setCameraUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    console.log('useEffect triggered with location.pathname:', location.pathname);
    const loadBatFiles = async () => {
      console.log('BatDetailsPage: Starting loadBatFiles');
      console.log('batId:', batId);
      console.log('serverNum:', serverNum);
      console.log('clientNum:', clientNum);
      console.log('Current location:', location.pathname);
      
      // Reset all states when loading new data
      setLoading(true);
      setSensorData(null);
      setSensorError(null);
      setSpectrogramUrl(null);
      setCameraUrl(null);
      setAudioUrl(null);
      
      // Use params first, then fallback to navigationState
      const effectiveServerNum = serverNum || navigationState?.serverNum || '1';
      const effectiveClientNum = clientNum || navigationState?.clientNum || '1';
      
      if (!batId) {
        console.log('Missing batId');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Calling fetchBatFiles with:', {
          batId,
          serverNum: effectiveServerNum,
          clientNum: effectiveClientNum
        });
        
        const files = await fetchBatFiles(
          batId,
          effectiveServerNum,
          effectiveClientNum
        );
        
        console.log('fetchBatFiles response:', files);
        
        if (!files.success) {
          console.error('fetchBatFiles failed:', files.message);
          setSensorError('Failed to load BAT files: ' + (files.message || 'Unknown error'));
          setLoading(false);
          return;
        }
        
        // Set file URLs if files exist
        if (files.files?.spectrogram) {
          setSpectrogramUrl(getFileUrl(files.files.spectrogram.id, files.files.spectrogram.name));
        }
        if (files.files?.camera) {
          setCameraUrl(getFileUrl(files.files.camera.id, files.files.camera.name));
        }
        if (files.files?.audio) {
          setAudioUrl(getFileUrl(files.files.audio.id, files.files.audio.name));
        }
        
        // Parse sensor data if available
        if (files.files?.sensor) {
          setSensorLoading(true);
          try {
            const response = await fetch(getFileUrl(files.files.sensor.id, files.files.sensor.name));
            const text = await response.text();
            console.log('Raw sensor.txt content:', text);
            
            // Parse sensor.txt format
            const lines = text.split('\n');
            const data: any = {};
            
            lines.forEach(line => {
              console.log('Parsing line:', line);
              // Handle temperature - look for "Temp:" pattern (covers "Client1 Temp:", "Temperature:", etc.)
              if (line.includes('Temp:') || line.includes('temperature:')) {
                const temp = line.split(/.*[Tt]emp:/)[1]?.trim().replace(/°?C|celsius/gi, '').trim();
                data.temperature = parseFloat(temp || '0');
                console.log('Parsed temperature:', data.temperature);
              } 
              // Handle humidity
              else if (line.includes('Humidity:') || line.includes('humidity:')) {
                const hum = line.split(/[Hh]umidity:/)[1]?.trim().replace(/%/g, '').trim();
                data.humidity = parseFloat(hum || '0');
                console.log('Parsed humidity:', data.humidity);
              } 
              // Handle pressure
              else if (line.includes('Pressure:') || line.includes('pressure:')) {
                const press = line.split(/[Pp]ressure:/)[1]?.trim().replace(/hPa|Pa|pascal/gi, '').trim();
                data.pressure = parseFloat(press || '0');
                console.log('Parsed pressure:', data.pressure);
              } 
              // Handle light - look for "Light:" pattern
              else if (line.includes('Light:') || line.includes('light:')) {
                const light = line.split(/[Ll]ight:/)[1]?.trim().replace(/lux|lx/gi, '').trim();
                data.lightLevel = parseFloat(light || '0');
                console.log('Parsed light level:', data.lightLevel);
              }
            });
            
            console.log('Final parsed sensor data:', data);
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
  }, [location.pathname]);

  console.log('BatDetailsPage - Rendering with:', {
    batId,
    loading,
    navigationState,
    isExpanded,
    sensorData,
    spectrogramUrl,
    cameraUrl
  });

  // Sample bat data
  const batData = {
    id: batId ? `BAT${batId}` : 'BAT001',
    species: 'Pipistrellus pipistrellus',
    location: 'Kolar',
    date: '15/08/2024',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50/80 to-blue-50/30 relative">
        <NavigationMenu />
        <div className={`bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-700 shadow-lg transition-all duration-300 ${isExpanded ? 'ml-64' : 'ml-16'}`}>
          <div className="max-w-7xl mx-auto px-4 py-4 h-16 flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors mr-4"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-lg font-semibold text-white">BAT ID: {batData.id}</h1>
          </div>
        </div>
        <div className={`max-w-7xl mx-auto px-4 py-8 transition-all duration-300 ${isExpanded ? 'ml-64' : 'ml-16'}`}>
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <span className="text-lg text-gray-600">Loading BAT data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/80 to-blue-50/30 relative">
      <NavigationMenu />
      
      {/* Header with back button */}
      <div className={`bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-700 shadow-lg transition-all duration-300 ${isExpanded ? 'ml-64' : 'ml-16'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 h-16 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors mr-4"
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
                <span className="text-sm text-gray-900">45 kHz</span>
              </div>
            </div>
          </div>

          {/* Species Photo Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 min-h-64 hover:shadow-lg hover:border-emerald-300 transition-all duration-300 hover:scale-[1.02]">
            <h3 className="text-base font-semibold mb-3 text-emerald-600">Species Photo</h3>
            <div className="h-48 bg-gray-100 rounded-lg flex flex-col items-center justify-center">
              <div className="flex flex-col items-center">
                <span className="text-4xl mb-1">🦇</span>
                <p className="text-sm text-center text-gray-600">Pipistrellus pipistrellus</p>
                <p className="text-xs text-center text-gray-500 mt-1">Common Pipistrelle Bat</p>
              </div>
            </div>
          </div>
        </div>

        {/* Spectrogram and Camera Image */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Spectrogram Image Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 min-h-64 hover:shadow-lg hover:border-emerald-300 transition-all duration-300 hover:scale-[1.02]">
            <h3 className="text-base font-semibold mb-3 text-emerald-600">Spectrogram Image</h3>
            <div className="h-80 bg-gray-100 rounded-lg flex flex-col items-center justify-center overflow-hidden">
              {spectrogramUrl ? (
                <img 
                  src={spectrogramUrl} 
                  alt="Spectrogram" 
                  className="w-full h-full object-contain rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                  }}
                />
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-4xl mb-1">�</span>
                  <p className="text-sm text-center text-gray-600">No spectrogram available</p>
                </div>
              )}
              <div className="hidden flex-col items-center">
                <span className="text-4xl mb-1">❌</span>
                <p className="text-sm text-center text-gray-600">Failed to load spectrogram</p>
              </div>
            </div>
          </div>

          {/* Camera Image Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 min-h-64 hover:shadow-lg hover:border-emerald-300 transition-all duration-300 hover:scale-[1.02]">
            <h3 className="text-base font-semibold mb-3 text-emerald-600">Camera Image</h3>
            <div className="h-80 bg-gray-100 rounded-lg flex flex-col items-center justify-center overflow-hidden">
              {cameraUrl ? (
                <img 
                  src={cameraUrl} 
                  alt="Camera Image" 
                  className="w-full h-full object-contain rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                  }}
                />
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-4xl mb-1">�</span>
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

        {/* Audio and Environmental Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Audio Player Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 min-h-64 hover:shadow-lg hover:border-emerald-300 transition-all duration-300 hover:scale-[1.02]">
            <h3 className="text-base font-semibold mb-4 text-emerald-600">Audio Recording</h3>
            {audioUrl ? (
              <div className="space-y-4">
                {/* Audio Player */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg border border-emerald-100">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">🎵</span>
                    <div>
                      <p className="text-sm font-medium text-gray-700">BAT Audio Recording</p>
                      <p className="text-xs text-gray-500">Ultra-sonic audio file</p>
                    </div>
                  </div>
                  
                  <audio 
                    controls 
                    className="w-full mb-3"
                    preload="metadata"
                  >
                    <source src={audioUrl} type="audio/wav" />
                    Your browser does not support the audio element.
                  </audio>
                  
                  <div className="flex gap-2">
                    <a
                      href={audioUrl}
                      download="audio.wav"
                      className="flex-1 bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Volume2 className="w-4 h-4" />
                      Download Audio
                    </a>
                    <button className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200 transition-colors">
                      <Play className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Audio Info */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Format:</span>
                    <span className="text-gray-900 font-mono">WAV</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sample Rate:</span>
                    <span className="text-gray-900">384 kHz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="text-gray-900">~2.5s</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <div className="flex flex-col items-center">
                  <span className="text-4xl mb-2">🎵</span>
                  <p className="text-sm text-center text-gray-600 mb-2">No audio file available</p>
                  <p className="text-xs text-center text-gray-500">Audio.wav not found in folder</p>
                </div>
              </div>
            )}
          </div>

          {/* Environmental Data Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 min-h-64 hover:shadow-lg hover:border-emerald-300 transition-all duration-300 hover:scale-[1.02]">
            <h3 className="text-base font-semibold mb-4 text-emerald-600">Environmental Data</h3>
            {sensorLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                  <span className="text-sm text-gray-600">Loading environmental data...</span>
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
              <div className="space-y-3">
                {/* Temperature */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 p-2 rounded-lg border border-red-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🌡️</span>
                      <span className="text-xs font-medium text-gray-700">Temperature</span>
                    </div>
                    <span className="text-sm font-bold text-red-600">
                      {sensorData.temperature > 0 ? `${sensorData.temperature}°C` : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Humidity */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-2 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">💧</span>
                      <span className="text-xs font-medium text-gray-700">Humidity</span>
                    </div>
                    <span className="text-sm font-bold text-blue-600">
                      {sensorData.humidity > 0 ? `${sensorData.humidity}%` : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Pressure */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-2 rounded-lg border border-purple-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🌬️</span>
                      <span className="text-xs font-medium text-gray-700">Pressure</span>
                    </div>
                    <span className="text-sm font-bold text-purple-600">
                      {sensorData.pressure > 0 ? `${sensorData.pressure} hPa` : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Light Level */}
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-2 rounded-lg border border-yellow-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">☀️</span>
                      <span className="text-xs font-medium text-gray-700">Light Level</span>
                    </div>
                    <span className="text-sm font-bold text-amber-600">
                      {sensorData.lightLevel > 0 ? `${sensorData.lightLevel} lux` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <div className="flex flex-col items-center">
                  <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">No environmental data available</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Guano Metadata and Spectrogram Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Guano Metadata Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-emerald-300 transition-all duration-300 hover:scale-[1.02]">
            <h3 className="text-lg font-semibold mb-6 text-emerald-600 flex items-center gap-2">
              <span className="text-xl">📋</span>
              Guano Metadata
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="border-l-4 border-blue-400 pl-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">GUANO Version</span>
                    <span className="text-base text-gray-900 font-mono font-semibold">1.0</span>
                  </div>
                </div>
                <div className="border-l-4 border-green-400 pl-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Species</span>
                    <span className="text-base text-gray-900 font-semibold">Pipistrellus pipistrellus</span>
                  </div>
                </div>
                <div className="border-l-4 border-purple-400 pl-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Location</span>
                    <span className="text-base text-gray-900 font-semibold">{batData.location}</span>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="border-l-4 border-orange-400 pl-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Timestamp</span>
                    <span className="text-base text-gray-900 font-semibold">{batData.date}</span>
                  </div>
                </div>
                <div className="border-l-4 border-red-400 pl-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Filter</span>
                    <span className="text-base text-gray-900 font-semibold">High-pass 10kHz</span>
                  </div>
                </div>
                <div className="border-l-4 border-indigo-400 pl-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Sample Rate</span>
                    <span className="text-base text-gray-900 font-semibold">384kHz</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Spectrogram Analysis Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-emerald-300 transition-all duration-300 hover:scale-[1.02]">
            <h3 className="text-base font-semibold mb-4 text-emerald-600">Spectrogram Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Species Identification */}
              <div className="text-center">
                <div className="relative mb-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-blue-600">85%</div>
                </div>
                <div className="text-xs text-gray-600">Species Identification</div>
              </div>

              {/* Peak Frequency */}
              <div className="text-center">
                <div className="relative mb-2">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">♪</span>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-purple-600">42kHz</div>
                </div>
                <div className="text-xs text-gray-600">Peak Frequency</div>
              </div>

              {/* Call Duration */}
              <div className="text-center">
                <div className="relative mb-2">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">⏱</span>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-orange-600">12ms</div>
                </div>
                <div className="text-xs text-gray-600">Call Duration</div>
              </div>
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