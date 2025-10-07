import { useState, useEffect } from 'react';
import { Plus, Activity, Server, Users, TreePine } from 'lucide-react';
import { ServerSection } from './components/ServerSection';
import { AddServerModal } from './components/AddServerModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { useMenu } from './context/MenuContext';
import { createServer, deleteServer, loadAllServers } from './firebase';

interface ServerData {
  id: string;
  name: string;
  location: string;
}

interface ClientActiveStatus {
  serverId: string;
  clientName: string;
  isActive: boolean;
  activeType?: 'data' | 'record';
}

function App() {
  const { isExpanded } = useMenu();
  const [servers, setServers] = useState<ServerData[]>([]);
  
  // Load servers from Firebase on component mount
  useEffect(() => {
    console.log('Loading servers from Firebase...');
    const unsubscribe = loadAllServers((firebaseServers) => {
      const serverArray: ServerData[] = Object.keys(firebaseServers).map((serverKey, index) => ({
        id: (index + 1).toString(),
        name: serverKey.replace(/^\w/, c => c.toUpperCase()).replace(/(\d+)/, ' $1'), // Convert "server1" to "Server 1"
        location: firebaseServers[serverKey].location || `Monitoring Station ${index + 1}` // Use location from Firebase or default
      }));
      console.log('Setting servers from Firebase:', serverArray);
      setServers(serverArray);
    });

    return unsubscribe; // Cleanup subscription on unmount
  }, []);
  
  // Active status tracking
  const [activeClients, setActiveClients] = useState<ClientActiveStatus[]>([]);
  const [totalClientCount, setTotalClientCount] = useState<number>(2); // Initialize with default: Server 1 has 1 client, Server 2 has 1 client
  
  // Calculate totals and active counts
  const totalServers = servers.length;
  const activeClientCount = activeClients.filter(client => client.isActive).length;
  const activeServerCount = servers.filter(server => 
    activeClients.some(client => client.serverId === server.id && client.isActive)
  ).length;
  const isSystemMonitoring = activeClientCount > 0;
  
  // Navigation menu is always open on the left now
  const [isAddServerModalOpen, setIsAddServerModalOpen] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'server' | 'client';
    itemName: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    type: 'server',
    itemName: '',
    onConfirm: () => {}
  });
  
  // Function to update client active status
  const updateClientActiveStatus = (serverId: string, clientName: string, isActive: boolean, activeType?: 'data' | 'record') => {
    setActiveClients(prev => {
      const filtered = prev.filter(client => !(client.serverId === serverId && client.clientName === clientName));
      if (isActive) {
        return [...filtered, { serverId, clientName, isActive, activeType }];
      }
      return filtered;
    });
  };

  // Function to update total client count when servers add/remove clients
  const updateTotalClientCount = (change: number) => {
    setTotalClientCount(prev => Math.max(0, prev + change));
  };

  const addServer = (serverNumber: number, location: string) => {
    const newServer: ServerData = {
      id: Date.now().toString(),
      name: `Server ${serverNumber}`,
      location: location
    };
    
    // Update UI immediately (optional, since Firebase subscription will update it)
    // setServers([...servers, newServer]);
    
    // Then update Firebase with higher priority
    const serverKey = newServer.name.toLowerCase().replace(' ', '');
    
    console.log('Creating server in Firebase:', serverKey, 'with location:', location);
    
    // Use setTimeout with 0 delay to move Firebase operation to the next event loop tick
    // This ensures UI updates finish first and Firebase updates happen immediately after
    setTimeout(() => {
      createServer(serverKey, location)
        .then(() => {
          console.log('Server created successfully in Firebase:', serverKey);
        })
        .catch(error => {
          console.error('Error creating server in Firebase:', error);
          // If Firebase fails, we might want to revert the UI change
          // For now, just log the error
        });
    }, 0);
  };

    const removeServer = (serverId: string) => {
    // First find the server to get its name
    const serverToRemove = servers.find(server => server.id === serverId);
    if (!serverToRemove) return;
    
    // Show confirmation modal before deleting
    setConfirmationModal({
      isOpen: true,
      type: 'server',
      itemName: serverToRemove.name,
      onConfirm: () => {
        // Update UI immediately
        setServers(servers.filter(server => server.id !== serverId));
        
        // Remove all active clients for this server
        setActiveClients(prev => prev.filter(client => client.serverId !== serverId));
        
        // Then update Firebase with higher priority
        const serverKey = serverToRemove.name.toLowerCase().replace(' ', '');
        
        // Use setTimeout with 0 delay to move Firebase operation to the next event loop tick
        // This ensures UI updates finish first and Firebase updates happen immediately after
        setTimeout(() => {
          deleteServer(serverKey)
            .catch(error => console.error('Error deleting server:', error));
        }, 0);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/80 to-blue-50/30 relative">
  {/* Header */}
  <div className={`relative bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-800 shadow-lg overflow-hidden transition-all duration-300 ${isExpanded ? 'ml-64' : 'ml-16'}`}>
        {/* Background Video */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-85"
          style={{ objectPosition: 'center 60%' }}
          onError={(e) => console.error('Video loading error:', e)}
          onLoadStart={() => console.log('Video loading started')}
          onCanPlay={() => console.log('Video can play')}
        >
          <source src="/vid1.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Overlay for better text readability - Temporarily reduced for testing */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-800/30 via-teal-700/30 to-emerald-800/30"></div>
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 p-4 rounded-xl">
              <TreePine className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Wildlife Monitoring System</h1>
              <p className="text-emerald-100 text-base">Bat Conservation India Trust</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 transition-all duration-300 hover:bg-white/15 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20">
              <div className="flex items-center gap-4">
                <div className="bg-blue-500/20 p-3 rounded-lg transition-all duration-300 hover:bg-blue-500/30 group">
                  <Users className="w-6 h-6 text-blue-200 transition-all duration-300 group-hover:text-blue-100 group-hover:scale-110" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{totalClientCount}</div>
                  <div className="text-emerald-100 text-sm">Total Clients</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`w-3 h-3 rounded-full ${activeClientCount > 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                    <span className="text-sm text-emerald-200">{activeClientCount} Active</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 transition-all duration-300 hover:bg-white/15 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20">
              <div className="flex items-center gap-4">
                <div className="bg-purple-500/20 p-3 rounded-lg transition-all duration-300 hover:bg-purple-500/30 group">
                  <Server className="w-6 h-6 text-purple-200 transition-all duration-300 group-hover:text-purple-100 group-hover:scale-110" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{totalServers}</div>
                  <div className="text-emerald-100 text-sm">Total Servers</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`w-3 h-3 rounded-full ${activeServerCount > 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                    <span className="text-sm text-emerald-200">{activeServerCount} Active</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 transition-all duration-300 hover:bg-white/15 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20">
              <div className="flex items-center gap-4">
                <div className="bg-green-500/20 p-3 rounded-lg transition-all duration-300 hover:bg-green-500/30 group">
                  <Activity className="w-6 h-6 text-green-200 transition-all duration-300 group-hover:text-green-100 group-hover:scale-110" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">Live</div>
                  <div className="text-emerald-100 text-sm">System Status</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`w-3 h-3 rounded-full ${isSystemMonitoring ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                    <span className="text-sm text-emerald-200">{isSystemMonitoring ? 'Monitoring ON' : 'Monitoring OFF'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

  {/* Main Content */}
  <div className={`max-w-7xl mx-auto px-4 py-6 transition-all duration-300 ${isExpanded ? 'ml-64' : 'ml-16'}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Client - Server Network</h2>
            <p className="text-gray-600 text-sm">Manage your bat detection Recording Stations</p>
          </div>
          
          <button
            onClick={() => setIsAddServerModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl text-sm"
          >
            <Plus className="w-5 h-5" />
            Add Server
          </button>
        </div>

        <div className="space-y-6">
          {servers
            .sort((a, b) => {
              const aNum = parseInt(a.name.replace('Server ', ''));
              const bNum = parseInt(b.name.replace('Server ', ''));
              return aNum - bNum;
            })
            .map((server) => {
              const serverActiveClientCount = activeClients.filter(client => 
                client.serverId === server.id && client.isActive
              ).length;
              
              return (
                <ServerSection
                  key={server.id}
                  serverId={server.id}
                  serverName={server.name}
                  location={server.location}
                  onRemove={() => removeServer(server.id)}
                  activeClientCount={serverActiveClientCount}
                  onClientActiveStatusChange={updateClientActiveStatus}
                  onTotalClientCountChange={updateTotalClientCount}
                />
              );
            })}
        </div>

        {servers.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Server className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-2">No Servers Available</h3>
            <p className="text-gray-500 mb-6 text-sm">Add your first monitoring server to get started</p>
            <button
              onClick={() => setIsAddServerModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
            >
              Add Server
            </button>
          </div>
        )}
      </div>

      <AddServerModal
        isOpen={isAddServerModalOpen}
        onClose={() => setIsAddServerModalOpen(false)}
        onAdd={addServer}
        existingServers={servers.map(s => s.name)}
      />

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationModal.onConfirm}
        title={`Delete ${confirmationModal.type === 'server' ? 'Server' : 'Client'}?`}
        message={`Are you sure you want to delete this ${confirmationModal.type}?`}
        itemName={confirmationModal.itemName}
        type={confirmationModal.type}
      />
    </div>
  );
}

export default App;