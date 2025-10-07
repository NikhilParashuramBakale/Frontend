import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Play, MapPin, Edit3, X, Database, ChevronLeft, ChevronRight, Search, ArrowUpDown, Maximize2 } from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';
import { SettingsModal } from './SettingsModal';
import { LocationEditModal } from './LocationEditModal';
import { subscribeToServerData, setServerMode, updateDataSection, updateRecordSection, subscribeToRecordData, resetRecordSection, resetDataSection, getServerMode, getActiveDataClient } from '../firebase';
import { fetchAllBatFolders } from '../services/api';

type DataHistoryRow = {
  batId: string;
  location: string;
  date: string;
  frequency: string;
};

export interface ClientCardProps {
  serverId: string;
  serverName: string;
  clientName: string;
  location: string;
  onLocationUpdate: (newLocation: string) => void;
  isActive: boolean;
  isServerProcessing: boolean;
  onServerProcessingChange?: (isProcessing: boolean) => void;
  isRecordProcessing: boolean;
  onRecordProcessingChange?: (isProcessing: boolean) => void;
  onActiveStatusChange: (serverId: string, clientName: string, isActive: boolean, activeType?: 'data' | 'record') => void;
  dataHistory?: DataHistoryRow[];
}

export const ClientCard: React.FC<ClientCardProps> = ({
  serverId,
  serverName,
  clientName,
  location,
  onLocationUpdate,
  // isActive, // Remove if not used
  isServerProcessing,
  onServerProcessingChange,
  isRecordProcessing,
  onRecordProcessingChange,
  onActiveStatusChange,
  dataHistory = []
}) => {
  const navigate = useNavigate();
  
  // State for dynamic BAT data
  const [batData, setBatData] = useState<DataHistoryRow[]>([]);
  const [isLoadingBatData, setIsLoadingBatData] = useState(true);
  
  // Extract server and client numbers for API calls
  const serverNum = serverName.replace('Server ', '');
  const clientNum = clientName.replace('Client ', '');
  
  // Fetch BAT data from backend
  useEffect(() => {
    const loadBatData = async () => {
      setIsLoadingBatData(true);
      console.log(`[ClientCard] Loading BAT data for Server ${serverNum}, Client ${clientNum}`);
      try {
        const response = await fetchAllBatFolders();
        console.log(`[ClientCard] API Response:`, response);
        if (response.success) {
          // Filter folders for this specific server and client
          const relevantFolders = response.folders.filter(
            folder => folder.serverNum === serverNum && folder.clientNum === clientNum
          );
          console.log(`[ClientCard] Relevant folders for Server ${serverNum}, Client ${clientNum}:`, relevantFolders);
          
          // Convert to DataHistoryRow format
          const batRows: DataHistoryRow[] = relevantFolders.map(folder => ({
            batId: folder.batId,
            location: location, // Use client location or could fetch from folder metadata
            date: new Date(folder.modifiedDate).toLocaleDateString('en-GB'), // DD/MM/YYYY format
            frequency: '120khz' // Default frequency, could be fetched from files later
          }));
          
          console.log(`[ClientCard] Final BAT data:`, batRows);
          setBatData(batRows);
        } else {
          console.error('Failed to fetch BAT folders:', response);
          // Fallback to sample data if API fails
          setBatData([]);
        }
      } catch (error) {
        console.error('Error loading BAT data:', error);
        setBatData([]);
      } finally {
        setIsLoadingBatData(false);
      }
    };
    
    loadBatData();
  }, [serverNum, clientNum, location]);
  
  // Use real BAT data if available, otherwise show loading or empty state
  const sampleDataHistory: DataHistoryRow[] = dataHistory.length > 0 ? dataHistory : batData;

  // Pagination state for data history table
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  // Search and sort state
  const [globalSearch, setGlobalSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof DataHistoryRow | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  // Filter and sort the data
  const filteredData = sampleDataHistory.filter(row => {
    const searchTerm = globalSearch.toLowerCase();
    return (
      row.batId.toLowerCase().includes(searchTerm) ||
      row.location.toLowerCase().includes(searchTerm) ||
      row.date.toLowerCase().includes(searchTerm) ||
      row.frequency.toLowerCase().includes(searchTerm)
    );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;

    if (sortConfig.key === 'frequency') {
      const aNum = parseFloat(String(a.frequency).replace(/[^\d.]/g, '')) || 0;
      const bNum = parseFloat(String(b.frequency).replace(/[^\d.]/g, '')) || 0;
      return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
    }

    const aVal = String(a[sortConfig.key]).toLowerCase();
    const bVal = String(b[sortConfig.key]).toLowerCase();
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData: DataHistoryRow[] = sortedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Handle sort
  const handleSort = (key: keyof DataHistoryRow) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Handle search
  const handleSearchChange = (value: string) => {
    setGlobalSearch(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle maximize
  const handleMaximize = () => {
    navigate('/data-history-full', { 
      state: { 
        data: sampleDataHistory, 
        clientName,
        serverName 
      } 
    });
  };

  const handleBatIdClick = (batId: string) => {
    // Extract server and client numbers from serverName and clientName
    const serverNum = serverName.replace('Server ', '');
    const clientNum = clientName.replace('Client ', '');
    
    navigate(`/bat/${batId}`, {
      state: {
        serverName,
        clientName,
        serverNum,
        clientNum,
        batId
      }
    });
  };
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLocationEditOpen, setIsLocationEditOpen] = useState(false);
  const [currentSettings, setCurrentSettings] = useState<{ timing: string; date?: string }>(() => {
    const isoToday = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return { timing: '9:00 AM - 5:00 PM', date: isoToday };
  });
  const [showStatusSection, setShowStatusSection] = useState(false);
  const [isDataModeActive, setIsDataModeActive] = useState(false);
  const [showRecordingSection, setShowRecordingSection] = useState(false);
  const [recordData, setRecordData] = useState({
    status: 'idle',
    request: false,
    time_range: '',
    date: ''
  });
  const [recordUIStatus, setRecordUIStatus] = useState('waiting'); // Separate UI state
  // const [timeRemaining, setTimeRemaining] = useState('');
  const [firebaseData, setFirebaseData] = useState({
    folder_no: '',
    connected: false,
    sensor_file: false,
    audio_file: false,
    image_file: false,
    transmission_completed: false
  });
  const [dataUICompleted, setDataUICompleted] = useState(false); // Simple flag like recordUIStatus
  const [progressPercentage, setProgressPercentage] = useState(0);

  // Check server mode AND active client on component mount to restore data mode state after refresh
  useEffect(() => {
    const serverKey = serverName.toLowerCase().replace(' ', '');
    const clientKey = clientName.toLowerCase().replace(' ', '');
    
    // Listen for server mode changes in real-time
    const unsubscribeMode = getServerMode(serverKey, (mode) => {
      console.log(`${clientName} - Server mode changed to: ${mode}`);
      
      if (mode === 'data') {
        // Server is in data mode, now check if THIS client is the active one
        getActiveDataClient(serverKey, (activeClientId) => {
          if (activeClientId === clientKey) {
            console.log(`${clientName} - This client is the active data client, showing processing state`);
            setIsDataModeActive(true);
            // Don't auto-show popup on mode change, only on initial load
            if (!showStatusSection) {
              setShowStatusSection(true); // Show the popup like first time
              setProgressPercentage(0); // Start at 0%
              setDataUICompleted(false); // Reset completion flag
            }
            
            // Also notify parent that this client is active
            onActiveStatusChange(serverId, clientName, true, 'data');
            
            // Mark server as processing
            if (onServerProcessingChange) {
              onServerProcessingChange(true);
            }
          } else {
            console.log(`${clientName} - Server is in data mode but this client is not active (active: ${activeClientId})`);
            setIsDataModeActive(false);
            setShowStatusSection(false);
          }
        });
      } else {
        // Server mode is idle or something else - deactivate this client
        console.log(`${clientName} - Server is not in data mode (${mode}) - deactivating`);
        setIsDataModeActive(false);
        setShowStatusSection(false);
        setDataUICompleted(false);
        setProgressPercentage(0);
        
        // Notify parent that this client is no longer active
        onActiveStatusChange(serverId, clientName, false);
        
        // Mark server as not processing
        if (onServerProcessingChange) {
          onServerProcessingChange(false);
        }
      }
    });

    return unsubscribeMode;
  }, [serverName, clientName, serverId, onActiveStatusChange, onServerProcessingChange, showStatusSection]);

  // Also listen for active client changes to immediately update UI when client_id is reset
  useEffect(() => {
    const serverKey = serverName.toLowerCase().replace(' ', '');
    const clientKey = clientName.toLowerCase().replace(' ', '');
    
    const unsubscribeClient = getActiveDataClient(serverKey, (activeClientId) => {
      // Only update if we're currently in data mode and this affects us
      if (isDataModeActive) {
        if (!activeClientId || activeClientId !== clientKey) {
          console.log(`${clientName} - No longer the active data client (active: ${activeClientId}) - deactivating`);
          setIsDataModeActive(false);
          setShowStatusSection(false);
          setDataUICompleted(false);
          setProgressPercentage(0);
          
          // Notify parent that this client is no longer active
          onActiveStatusChange(serverId, clientName, false);
          
          // Mark server as not processing
          if (onServerProcessingChange) {
            onServerProcessingChange(false);
          }
        }
      }
    });

    return unsubscribeClient;
  }, [serverName, clientName, serverId, isDataModeActive, onActiveStatusChange, onServerProcessingChange]);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    if (showStatusSection) {
      unsubscribe = subscribeToServerData(serverName.toLowerCase().replace(' ', ''), (data) => {
        if (data) {
          setFirebaseData(data);
          
          // Update UI state only if data session hasn't completed yet
          // Once completed, UI state should remain frozen until manual close
          if (!dataUICompleted) {
            // Calculate progress percentage based on completed steps
            const steps = [
              data.connected, 
              data.sensor_file, 
              data.audio_file, 
              data.image_file, 
              data.transmission_completed
            ];
            
            const completedSteps = steps.filter(step => step).length;
            const totalSteps = steps.length;
            const percentage = Math.round((completedSteps / totalSteps) * 100);
            
            setProgressPercentage(percentage);
          }
          
          // If transmission is completed, mark as completed
          if (data.transmission_completed && !dataUICompleted) {
            // Set completion flag to prevent further UI updates
            setDataUICompleted(true);
            
            console.log(`${serverName} data transmission completed - auto-resetting to idle after delay`);
            
            // Auto-reset Firebase to idle after a short delay to let user see completion
            const serverKey = serverName.toLowerCase().replace(' ', '');
            setTimeout(() => {
              resetDataSection(serverKey)
                .then(() => {
                  console.log(`Auto-reset Firebase data keys for ${serverName} after transmission completed`);
                })
                .catch(error => console.error('Error auto-resetting data section:', error));
              
              // Reset server mode to idle - this will trigger our mode listener to update UI
              setServerMode(serverKey, 'idle')
                .then(() => {
                  console.log(`Auto-reset server mode to idle for ${serverName} after transmission completed`);
                })
                .catch(error => console.error('Error auto-resetting server mode:', error));
            }, 3000); // 3 second delay to show completion state
          }
        }
      });
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [showStatusSection, serverName, onServerProcessingChange]);

  // Recording data subscription
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    if (showRecordingSection) {
      const serverKey = serverName.toLowerCase().replace(' ', '');
      const clientKey = clientName.toLowerCase().replace(' ', '');
      
      unsubscribe = subscribeToRecordData(serverKey, clientKey, (data) => {
        if (data) {
          setRecordData(data);
          
          // Phase 1 to Phase 2 transition: When status becomes "done"
          if (data.status === "done") {
            // Update UI status to show "Done"
            setRecordUIStatus('done');
            
            // Notify active status change - client becomes inactive
            onActiveStatusChange(serverId, clientName, false);
            
            // End Phase 1 - Release server-wide record processing
            if (onRecordProcessingChange) {
              onRecordProcessingChange(false);
            }
            
            // Reset Firebase keys but keep UI showing "Done" status
            const serverKey = serverName.toLowerCase().replace(' ', '');
            const clientKey = clientName.toLowerCase().replace(' ', '');
            
            resetRecordSection(serverKey, clientKey)
              .then(() => {
                console.log(`Reset Firebase keys for ${clientName} after done status`);
              })
              .catch(error => console.error('Error resetting record section:', error));
              
            // Reset server mode to idle when status becomes "done"
            setServerMode(serverKey, 'idle')
              .catch(error => console.error('Error resetting server mode:', error));
              
            console.log(`Status changed to "done" for ${clientName} - releasing server processing`);
          }
        }
      });
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [showRecordingSection, serverName, clientName]);

  // Timer calculation for recording session
  const calculateTimeRemaining = (timeRange: string) => {
    if (!timeRange) return;
    
    try {
      const [startTime, endTime] = timeRange.split(' - ');
      
      // Parse start time
      const startTimeParts = startTime.trim().split(' ');
      const [startHour, startMinute] = startTimeParts[0].split(':');
      const startPeriod = startTimeParts[1];
      
      let startHour24 = parseInt(startHour);
      if (startPeriod === 'PM' && startHour24 !== 12) startHour24 += 12;
      if (startPeriod === 'AM' && startHour24 === 12) startHour24 = 0;
      
      // Parse end time
      const endTimeParts = endTime.trim().split(' ');
      const [endHour, endMinute] = endTimeParts[0].split(':');
      const endPeriod = endTimeParts[1];
      
      let endHour24 = parseInt(endHour);
      if (endPeriod === 'PM' && endHour24 !== 12) endHour24 += 12;
      if (endPeriod === 'AM' && endHour24 === 12) endHour24 = 0;
      
      // Calculate total duration in milliseconds
      const startDate = new Date();
      startDate.setHours(startHour24, parseInt(startMinute), 0, 0);
      
      const endDate = new Date();
      endDate.setHours(endHour24, parseInt(endMinute), 0, 0);
      
      // If end time is before start time, assume it's next day
      if (endDate <= startDate) {
        endDate.setDate(endDate.getDate() + 1);
      }
      
      // Calculate remaining time from current time to end time
      const now = new Date();
      const remainingTime = endDate.getTime() - now.getTime();
      
      if (remainingTime > 0) {
        // If needed later, compute remaining h:m:s here and update UI
        // Example:
        // const hours = Math.floor(remainingTime / (1000 * 60 * 60));
        // const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
        // const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
        // setTimeRemaining(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
  // setTimeRemaining('0:00:00');
        // Timer ended - Phase 2 complete
        console.log(`Timer completed for ${clientName} - ending Phase 2`);
      }
    } catch (error) {
      console.error('Error calculating time remaining:', error);
  // setTimeRemaining('');
    }
  };

  // Update timer every second when recording
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (recordData.status === "done" && recordData.time_range) {
      interval = setInterval(() => {
        calculateTimeRemaining(recordData.time_range);
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [recordData.status, recordData.time_range]);

  const handleRecordAccess = () => {
    console.log(`${clientName} Record button clicked - starting Phase 1 (server-wide disable)`);
    
    // Notify active status change - client becomes active
    onActiveStatusChange(serverId, clientName, true, 'record');
    
    // Phase 1: Start server-wide record processing (disables all buttons)
    if (onRecordProcessingChange) {
      onRecordProcessingChange(true);
    }
    
    // Get the server and client keys
    const serverKey = serverName.toLowerCase().replace(' ', '');
    const clientKey = clientName.toLowerCase().replace(' ', '');
    
    // Show recording section immediately
    setShowRecordingSection(true);
    
    // Set server mode to record
    setServerMode(serverKey, 'record')
      .then(() => {
        // Update record section with current settings
  return updateRecordSection(serverKey, clientKey, currentSettings.timing, currentSettings.date || '');
      })
      .catch(error => console.error('Error updating record section:', error));
  };

  const handleCloseRecordingSection = () => {
    console.log(`${clientName} Record section closed - resetting both phases`);
    
    // Notify active status change - client becomes inactive
    onActiveStatusChange(serverId, clientName, false);
    
    // Reset Phase 1: Server-wide record processing
    if (onRecordProcessingChange) {
      onRecordProcessingChange(false);
    }
    
    setShowRecordingSection(false);
    
    // Reset UI status
    setRecordUIStatus('waiting');
    
    // Reset Firebase record data
    const serverKey = serverName.toLowerCase().replace(' ', '');
    const clientKey = clientName.toLowerCase().replace(' ', '');
    
    resetRecordSection(serverKey, clientKey)
      .catch(error => console.error('Error resetting record section:', error));
      
    // Reset server mode to idle
    setServerMode(serverKey, 'idle')
      .catch(error => console.error('Error resetting server mode:', error));
  };

  const handleDataAccess = () => {
    // If data mode is already active, don't allow new triggers
    if (isDataModeActive) {
      console.log(`${clientName} Data mode already active - cannot start new session`);
      return;
    }
    
    console.log(`${clientName} Data button clicked - starting processing`);
    
    // Notify active status change - client becomes active
    onActiveStatusChange(serverId, clientName, true, 'data');
    
    // Get the server and client keys
    const serverKey = serverName.toLowerCase().replace(' ', '');
    const clientKey = clientName.toLowerCase().replace(' ', '');
    
    // Notify parent immediately to mark server as busy
    if (onServerProcessingChange) {
      onServerProcessingChange(true);
    }
    
    // Show live status section immediately for instant feedback
    setShowStatusSection(true);
    setIsDataModeActive(true);
    setProgressPercentage(0);
    
    // Reset completion flag for new session
    setDataUICompleted(false);
    
    // Pre-populate with dummy data for immediate display
    const initialData = {
      folder_no: `FLD_${Date.now().toString().slice(-6)}`,
      connected: false,
      sensor_file: false,
      audio_file: false,
      image_file: false,
      transmission_completed: false
    };
    setFirebaseData(initialData);
    
    // Then update Firebase with higher priority using setTimeout to ensure UI updates complete first
    setTimeout(() => {
      // Use Promise chaining for Firebase operations
      setServerMode(serverKey, 'data')
        .then(() => updateDataSection(serverKey, clientKey))
        .catch(error => console.error('Error accessing data:', error));
    }, 0);
  };
  
  const handleCloseStatusSection = () => {
    // Just close the UI popup without changing Firebase mode
    // The server should stay in "data" mode until explicitly changed
    
    console.log(`${clientName} hide button clicked - closing popup`);
    setShowStatusSection(false);
    // Keep isDataModeActive true - data mode is still running
    
    // Reset UI state when manually closing the popup
    setDataUICompleted(false);
    setProgressPercentage(0);
    
    // Don't reset Firebase data or change server mode when just closing the popup
    // The data session should continue running in the background
    
    console.log(`${clientName} data popup closed - keeping data mode active in Firebase`);
  };

  const handleStopDataMode = () => {
    // This actually stops the data mode and resets Firebase
    
    // Notify active status change - client becomes inactive
    onActiveStatusChange(serverId, clientName, false);
    
    // First notify parent that processing has stopped
    if (onServerProcessingChange) {
      onServerProcessingChange(false);
    }
    
    setShowStatusSection(false);
    setIsDataModeActive(false);
    
    // Reset completion flag and UI state when stopping data mode
    setDataUICompleted(false);
    setFirebaseData({
      folder_no: '',
      connected: false,
      sensor_file: false,
      audio_file: false,
      image_file: false,
      transmission_completed: false
    });
    setProgressPercentage(0);
    
    // Reset Firebase data and server mode when actually stopping
    const serverKey = serverName.toLowerCase().replace(' ', '');
    
    // Reset Firebase data section
    resetDataSection(serverKey)
      .catch(error => console.error('Error resetting data section:', error));
      
    // Reset server mode to idle
    setServerMode(serverKey, 'idle')
      .catch(error => console.error('Error resetting server mode:', error));
      
    console.log(`${clientName} data mode stopped - Firebase reset to idle`);
  };

  const handleSettingsSave = (settings: { timing: string; date: string }) => {
    setCurrentSettings(settings);
  };

  // Check if client is currently active (has an open session but not completed)
  const isClientActive = (showStatusSection && !dataUICompleted) || (showRecordingSection && recordUIStatus !== 'done');

  return (
    <>
      <div 
        className={`rounded-xl shadow-sm border transition-all duration-700 transform relative overflow-hidden ${
          (isServerProcessing || isRecordProcessing) 
            ? 'border-gray-300 bg-gray-100 opacity-70' 
            : isClientActive
              ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/30 via-white to-emerald-50/20 hover:shadow-2xl shadow-emerald-200/40 ring-2 ring-emerald-300/30 hover:ring-emerald-400/40 hover:scale-[1.02] hover:-translate-y-1' 
              : 'border-gray-200 bg-white hover:shadow-lg hover:scale-[1.01] transition-transform'
        }`}>
        {isClientActive && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 via-transparent to-emerald-400/6"></div>
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/15 via-emerald-400/8 to-emerald-600/15 rounded-xl blur-md opacity-60"></div>
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent"></div>
          </>
        )}
        <div className="p-4 relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full transition-all duration-700 transform ${
                (isServerProcessing || isRecordProcessing) 
                  ? 'bg-gray-300' 
                  : isClientActive 
                    ? 'bg-emerald-500 shadow-emerald-400/70 shadow-xl ring-4 ring-emerald-300/40 scale-125' 
                    : 'bg-gray-300 hover:bg-gray-400'
              }`}>
                {isClientActive && (
                  <>
                    <div className="absolute inset-0 bg-emerald-400 rounded-full opacity-40"></div>
                    <div className="absolute inset-0.5 bg-emerald-300 rounded-full"></div>
                  </>
                )}
              </div>
              <div>
                <h3 className={`font-semibold text-sm ${(isServerProcessing || isRecordProcessing) ? 'text-gray-500' : 'text-gray-900'}`}>{clientName}</h3>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className={`w-3 h-3 ${isServerProcessing ? 'text-gray-400' : ''}`} />
                  <span className={`max-w-full ${isServerProcessing ? 'text-gray-400' : ''}`}>{location}</span>
                  <button
                    onClick={() => setIsLocationEditOpen(true)}
                    disabled={isServerProcessing}
                    className={`ml-1 p-0.5 transition-colors ${
                      isServerProcessing 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-gray-400 hover:text-emerald-600'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 relative">
              <button
                onClick={() => setIsSettingsOpen(true)}
                disabled={isServerProcessing || isRecordProcessing}
                className={`p-1.5 rounded-lg transition-colors ${
                  (isServerProcessing || isRecordProcessing)
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleRecordAccess}
                disabled={isServerProcessing || isRecordProcessing}
                className={`px-3 py-1.5 rounded-lg text-white font-medium transition-all duration-300 transform flex items-center gap-1.5 text-sm ${
                  (isServerProcessing || isRecordProcessing)
                    ? 'bg-blue-300 cursor-not-allowed' 
                    : showRecordingSection
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/30 scale-105'
                      : 'bg-blue-500 hover:bg-blue-600 hover:shadow-lg hover:scale-105 hover:shadow-blue-500/30'
                }`}
              >
                <Play className={`w-4 h-4 transition-transform duration-300 ${showRecordingSection ? 'animate-pulse' : ''}`} />
                Record
              </button>
              
              <button
                onClick={handleDataAccess}
                disabled={isServerProcessing || isRecordProcessing || isDataModeActive}
                className={`px-3 py-1.5 rounded-lg text-white font-medium transition-all duration-300 transform flex items-center gap-1.5 text-sm ${
                  (isServerProcessing || isRecordProcessing)
                    ? 'bg-emerald-300 cursor-not-allowed' 
                    : isDataModeActive
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400/30 cursor-not-allowed animate-pulse'
                      : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:scale-105 hover:shadow-emerald-500/30'
                }`}
                title={isDataModeActive ? "Data mode is running - processing..." : "Start data mode"}
              >
                <Database className={`w-4 h-4 transition-transform duration-300 ${isDataModeActive ? 'animate-pulse' : ''}`} />
                Data
              </button>
              {isDataModeActive && (
                <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  Processing...
                </div>
              )}
            </div>
          </div>
          
          <div className="text-xs text-gray-600 mb-2">
            <span className="font-medium">Settings: </span>
            {currentSettings.date && <>{currentSettings.date} | </>}
            {currentSettings.timing}
          </div>

          {/* Data History Table - Inside the client card */}
          {isLoadingBatData ? (
            <div className="mt-4 border-t border-gray-200 pt-4">
              <div className="flex items-center justify-center py-8 text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent"></div>
                  <span className="text-sm">Loading BAT data from Google Drive...</span>
                </div>
              </div>
            </div>
          ) : sampleDataHistory.length > 0 ? (
            <div 
              className="mt-4 border-t border-gray-200 pt-4"
              style={(isServerProcessing || isRecordProcessing) ? { opacity: 1 } : {}}
            >
              {/* Controls: Search input and square maximize button side-by-side (no overlap) */}
              <div className="mb-3 flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search BAT ID, Location, Date, or Frequency..."
                    value={globalSearch}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pl-9 pr-3"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
                <button
                  onClick={handleMaximize}
                  className="h-10 w-10 p-0 flex items-center justify-center rounded-md bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-sm"
                  title="Maximize Table"
                  aria-label="Maximize Table"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              <div 
                className="overflow-x-auto rounded-lg border border-gray-200 bg-gray-50"
                style={(isServerProcessing || isRecordProcessing) ? { opacity: 1 } : {}}
              >
                <table 
                  className="min-w-full table-fixed divide-y divide-gray-200 text-sm"
                  style={(isServerProcessing || isRecordProcessing) ? { opacity: 1 } : {}}
                >
                  <colgroup>
                    <col className="w-1/4" />
                    <col className="w-1/4" />
                    <col className="w-1/4" />
                    <col className="w-1/4" />
                  </colgroup>
                  <thead className="bg-gray-100">
                    <tr>
                      <th 
                        className="px-3 py-2 text-left font-medium text-gray-700 text-xs cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => handleSort('batId')}
                      >
                        <div className="flex items-center gap-1">
                          BAT ID
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th 
                        className="px-3 py-2 text-left font-medium text-gray-700 text-xs cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => handleSort('location')}
                      >
                        <div className="flex items-center gap-1">
                          Location
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th 
                        className="px-3 py-2 text-left font-medium text-gray-700 text-xs cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center gap-1">
                          Date
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th 
                        className="px-3 py-2 text-left font-medium text-gray-700 text-xs cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => handleSort('frequency')}
                      >
                        <div className="flex items-center gap-1">
                          Frequency
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {paginatedData.map((row: DataHistoryRow) => (
                      <tr key={row.batId} className="hover:bg-emerald-50/40 transition-colors duration-200">
                        <td className="px-3 py-2 text-blue-600 font-medium cursor-pointer hover:text-blue-800 hover:underline text-xs" onClick={() => handleBatIdClick(row.batId)}>BAT{row.batId}</td>
                        <td className="px-3 py-2 text-gray-700 text-xs">{row.location}</td>
                        <td className="px-3 py-2 text-gray-700 text-xs">{row.date}</td>
                        <td className="px-3 py-2 text-gray-700 text-xs">{row.frequency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div 
                    className="flex justify-between items-center px-3 py-2 bg-gray-50 border-t border-gray-200"
                    style={(isServerProcessing || isRecordProcessing) ? { opacity: 1 } : {}}
                  >
                    <div className="text-xs text-gray-600">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="px-2 py-1 text-xs rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <button
                        className="px-2 py-1 text-xs rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4 border-t border-gray-200 pt-4">
              <div className="flex items-center justify-center py-8 text-gray-500">
                <div className="text-sm">No BAT data found for this client.</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Status Section - Outside the main card to avoid opacity inheritance */}
      {showStatusSection && (
        <div className="mt-2 border border-emerald-200 rounded-lg bg-white shadow-lg relative z-20">
          <div className="p-4 space-y-4 bg-gradient-to-br from-emerald-50/80 to-blue-50/30 border-l-4 border-l-emerald-500 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-gray-900">Data Session</h4>
                </div>
                <div className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold border border-emerald-200">
                  {dataUICompleted || progressPercentage === 100 ? 'Completed' : `${progressPercentage}%`}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleStopDataMode}
                  className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                  title="Stop data mode"
                >
                  Stop
                </button>
                <button
                  onClick={handleCloseStatusSection}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-105"
                  title="Hide popup (keeps data mode running)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {firebaseData.folder_no && (
              <div className="bg-white/70 border border-blue-200 rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-700">Analytics Dashboard Folder:</span>
                  <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border">{firebaseData.folder_no}</span>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-gray-700">
                <span>Status Pipeline</span>
                <span className="text-emerald-600">{dataUICompleted ? '100' : progressPercentage}%</span>
              </div>
              
              {/* Progress bar */}
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500 ease-out" 
                  style={{ width: `${dataUICompleted ? 100 : progressPercentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-1.5">
                <StatusIndicator 
                  status={dataUICompleted || firebaseData.connected ? 'completed' : showStatusSection ? 'active' : 'idle'} 
                  label="Connected" 
                />
                <StatusIndicator 
                  status={dataUICompleted || firebaseData.sensor_file ? 'completed' : (showStatusSection && firebaseData.connected) ? 'active' : 'idle'} 
                  label="Sensor Data" 
                />
                <StatusIndicator 
                  status={dataUICompleted || firebaseData.image_file ? 'completed' : (showStatusSection && firebaseData.sensor_file) ? 'active' : 'idle'} 
                  label="Image File" 
                />
                <StatusIndicator 
                  status={dataUICompleted || firebaseData.audio_file ? 'completed' : (showStatusSection && firebaseData.image_file) ? 'active' : 'idle'} 
                  label="Audio File" 
                />
                <StatusIndicator 
                  status={dataUICompleted || firebaseData.transmission_completed ? 'completed' : (showStatusSection && firebaseData.audio_file) ? 'active' : 'idle'} 
                  label="Transmission Completed" 
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recording Session Section - Outside the main card to avoid opacity inheritance */}
      {showRecordingSection && (
        <div className="mt-2 border border-blue-200 rounded-lg bg-white shadow-lg relative z-20">
          <div className="p-4 space-y-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/30 border-l-4 border-l-blue-500 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-gray-900">Recording Session</h4>
                </div>
                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold border border-blue-200">
                  {recordUIStatus === 'done' ? 'Done' : 'Waiting'}
                </div>
              </div>
              <button
                onClick={handleCloseRecordingSection}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-105"
                title="Close recording session"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/70 border border-blue-200 rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-xs font-semibold text-gray-700">Time Range:</span>
                </div>
                <span className="text-sm font-bold text-blue-600 block mt-1">{recordData.time_range || currentSettings.timing}</span>
              </div>
              
              <div className="bg-white/70 border border-blue-200 rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-xs font-semibold text-gray-700">Date:</span>
                </div>
                <span className="text-sm font-bold text-blue-600 block mt-1">{recordData.date || currentSettings.date || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSettingsSave}
        serverName={serverName}
        clientName={clientName}
      />
      
      <LocationEditModal
        isOpen={isLocationEditOpen}
        onClose={() => setIsLocationEditOpen(false)}
        onSave={onLocationUpdate}
        currentLocation={location}
        itemName={clientName}
        itemType="client"
      />
    </>
  );
};
