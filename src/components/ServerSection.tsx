import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Server, Edit3, ChevronDown, ChevronRight } from 'lucide-react';
import { ClientCard } from './ClientCard';
import { LocationEditModal } from './LocationEditModal';
import { AddClientModal } from './AddClientModal';
import { ConfirmationModal } from './ConfirmationModal';
import { createClient, deleteClient, subscribeToServerData, loadServerClients } from '../firebase';

interface Client {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
}

interface ServerSectionProps {
  serverId: string;
  serverName: string;
  location: string;
  onRemove: () => void;
  activeClientCount: number;
  onClientActiveStatusChange: (serverId: string, clientName: string, isActive: boolean, activeType?: 'data' | 'record') => void;
  onTotalClientCountChange: (change: number) => void;
}

// Track busy state per server locally

export const ServerSection: React.FC<ServerSectionProps> = ({
  serverId,
  serverName,
  location,
  onRemove,
  activeClientCount,
  onClientActiveStatusChange,
  onTotalClientCountChange
}) => {
  // const serverKey = serverName.toLowerCase().replace(' ', '');
  
  const [serverLocation, setServerLocation] = useState(location);
  const [isLocationEditOpen, setIsLocationEditOpen] = useState(false);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    clientName: string;
    clientId: string;
  }>({
    isOpen: false,
    clientName: '',
    clientId: ''
  });
    // Server-wide processing state (any client's Data in progress)
  const [isServerProcessing, setIsServerProcessing] = useState<boolean>(false);
  
  // Server-wide record processing state (Phase 1 - before status becomes "done")
  const [isRecordProcessing, setIsRecordProcessing] = useState<boolean>(false);
  
  // Initialize with empty array, will be loaded from Firebase
  const [clients, setClients] = useState<Client[]>([]);

  // Load clients from Firebase on component mount
  useEffect(() => {
    console.log(`Loading clients for server: ${serverName}`);
    const serverKey = serverName.toLowerCase().replace(' ', '');
    const unsubscribe = loadServerClients(serverKey, (clientNames) => {
      const clientObjects: Client[] = clientNames.map((clientName, index) => ({
        id: (index + 1).toString(),
        name: clientName.replace(/^\w/, c => c.toUpperCase()).replace(/(\d+)/, ' $1'), // Convert "client1" to "Client 1"
        location: `Station ${index + 1}`, // Default location, could be enhanced
        isActive: false
      }));
      console.log('Setting clients from Firebase:', clientObjects);
      setClients(clientObjects);
    });

    return unsubscribe;
  }, [serverName]);

  const addClient = (clientNumber: number, location: string) => {
    const newClient: Client = {
      id: Date.now().toString(),
      name: `Client ${clientNumber}`,
      location: location,
      isActive: false // Default to inactive
    };
    
    // Update UI immediately
    setClients([...clients, newClient]);
    
    // Update total client count
    onTotalClientCountChange(1);
    
    // Close the modal immediately
    setIsAddClientModalOpen(false);
    
    // Then update Firebase with higher priority
    const serverKey = serverName.toLowerCase().replace(' ', '');
    const clientKey = newClient.name.toLowerCase().replace(' ', '');
    
    // Use setTimeout with 0 delay to move Firebase operation to the next event loop tick
    // This ensures UI updates finish first and Firebase updates happen immediately after
    setTimeout(() => {
      createClient(serverKey, clientKey)
        .catch(error => console.error('Error creating client:', error));
    }, 0);
  };

  const removeClient = (id: string) => {
    const clientToRemove = clients.find(c => c.id === id);
    if (clientToRemove) {
      // Update UI immediately
      setClients(clients.filter(client => client.id !== id));
      
      // Update total client count
      onTotalClientCountChange(-1);
      
      // Remove active status for this client
      onClientActiveStatusChange(serverId, clientToRemove.name, false);
      
      // Then update Firebase with higher priority
      const serverKey = serverName.toLowerCase().replace(' ', '');
      const clientKey = clientToRemove.name.toLowerCase().replace(' ', '');
      
      // Use setTimeout with 0 delay to move Firebase operation to the next event loop tick
      // This ensures UI updates finish first and Firebase updates happen immediately after
      setTimeout(() => {
        deleteClient(serverKey, clientKey)
          .catch(error => console.error('Error deleting client:', error));
      }, 0);
    }
  };

  const updateClientLocation = (clientId: string, newLocation: string) => {
    setClients(clients.map(client => 
      client.id === clientId ? { ...client, location: newLocation } : client
    ));
  };
  
  // Log when processing state changes
  useEffect(() => {
    console.log(`${serverName} - Server processing: ${isServerProcessing}, Record processing: ${isRecordProcessing}`);
  }, [isServerProcessing, isRecordProcessing, serverName]);

  return (
    <>
      <div className={`bg-gradient-to-br rounded-xl border overflow-hidden shadow-sm transition-all duration-700 transform ${
        (isServerProcessing || isRecordProcessing) 
          ? 'from-slate-800 via-slate-800 to-slate-600 border-amber-600' 
          : activeClientCount > 0
            ? 'from-slate-800 via-slate-800 to-slate-600 border-slate-600 shadow-2xl shadow-emerald-500/25 ring-2 ring-emerald-400/20 hover:shadow-emerald-500/30 hover:ring-emerald-400/30 hover:scale-[1.02]'
            : 'from-slate-800 via-slate-800 to-slate-600 border-slate-600 hover:shadow-lg'
      }`}>
        {activeClientCount > 0 && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/8 via-emerald-400/4 to-emerald-500/8"></div>
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/20 via-emerald-400/10 to-emerald-600/20 rounded-xl blur-sm opacity-75"></div>
          </>
        )}
        <div 
          className={`bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 px-4 py-4 text-white cursor-pointer hover:from-slate-800 hover:via-slate-700 hover:to-slate-800 transition-all duration-500 shadow-lg relative overflow-hidden ${
            activeClientCount > 0 
              ? 'shadow-emerald-900/20'
              : ''
          }`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {activeClientCount > 0 && (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/15 via-emerald-400/8 to-emerald-500/15"></div>
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent"></div>
            </>
          )}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-200 transition-transform duration-200" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-200 transition-transform duration-200" />
              )}
              <div className={`p-1.5 rounded-lg transition-all duration-500 transform ${
                activeClientCount > 0 
                  ? 'bg-emerald-500/25 ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-400/30 hover:scale-110 hover:rotate-3' 
                  : 'bg-slate-500/30 hover:bg-slate-500/40'
              }`}>
                <Server className={`w-5 h-5 transition-all duration-500 ${
                  activeClientCount > 0 
                    ? 'text-emerald-200 drop-shadow-lg filter' 
                    : 'text-slate-100'
                }`} />
              </div>
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-50">{serverName}</h2>
              <div className="flex items-center gap-2 text-slate-200 text-xs">
                <span className="max-w-full">{serverLocation}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLocationEditOpen(true);
                  }}
                  className="ml-1 p-1 text-slate-300 hover:text-white hover:bg-slate-500/30 rounded transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {(isServerProcessing || isRecordProcessing) && (
              <div className="flex items-center gap-2 bg-amber-500/30 px-3 py-1.5 rounded-lg border border-amber-400/30">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse shadow-sm"></div>
                <span className="text-xs font-medium text-amber-100">Processing</span>
              </div>
            )}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-500 transform ${
              activeClientCount > 0 
                ? 'bg-gradient-to-r from-emerald-500/25 to-emerald-400/20 border-emerald-400/50 shadow-lg shadow-emerald-400/25 ring-1 ring-emerald-300/30 hover:scale-105' 
                : 'bg-slate-500/40 border-slate-500/30 hover:bg-slate-500/50'
            }`}>
              <div className={`w-2 h-2 rounded-full shadow-sm transition-all duration-500 ${
                activeClientCount > 0 
                  ? 'bg-emerald-400 shadow-emerald-400/60 shadow-lg ring-2 ring-emerald-300/40' 
                  : 'bg-gray-400'
              }`}></div>
              <span className={`text-xs font-medium transition-all duration-500 ${
                activeClientCount > 0 
                  ? 'text-emerald-100 drop-shadow-sm font-semibold' 
                  : 'text-slate-300'
              }`}>Active ({activeClientCount})</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              disabled={isServerProcessing}
              className={`p-2 rounded-lg transition-colors ${
                isServerProcessing 
                  ? 'text-slate-400 cursor-not-allowed' 
                  : 'text-slate-200 hover:bg-slate-500/30 hover:text-red-300'
              }`}
              title="Remove Server"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
        {isExpanded && (
          <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 relative">
            {/* Controls are disabled via isServerBusy */}
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 text-sm">
                Connected Clients ({clients.length})
              </h3>
            <button
              onClick={() => setIsAddClientModalOpen(true)}
              disabled={isServerProcessing || isRecordProcessing}
              className={`w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center shadow-md ${
                (isServerProcessing || isRecordProcessing)
                  ? 'bg-emerald-300 cursor-not-allowed' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 hover:shadow-lg'
              }`}
              title="Add Client"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
            <div className="grid gap-3">
            {/* Server busy: {String(isServerBusy)} */}
            {clients
              .sort((a, b) => {
                const aNum = parseInt(a.name.replace('Client ', ''));
                const bNum = parseInt(b.name.replace('Client ', ''));
                return aNum - bNum;
              })
              .map((client) => (
              <div key={client.id} className={`flex items-center gap-3`}>
                <div className="flex-1">
                  <ClientCard
                    serverId={serverId}
                    serverName={serverName}
                    clientName={client.name}
                    location={client.location}
                    onLocationUpdate={(newLocation) => updateClientLocation(client.id, newLocation)}
                    isActive={client.isActive}
                    isServerProcessing={isServerProcessing}
                    onServerProcessingChange={(isProcessing) => {
                      console.log(`${client.name} processing change: ${isProcessing}`);
                      setIsServerProcessing(isProcessing);
                    }}
                    isRecordProcessing={isRecordProcessing}
                    onRecordProcessingChange={(isProcessing) => {
                      console.log(`${client.name} record processing change: ${isProcessing}`);
                      setIsRecordProcessing(isProcessing);
                    }}
                    onActiveStatusChange={onClientActiveStatusChange}
                  />
                </div>
                {clients.length > 1 && (
                  <button
                    onClick={() => {
                      setConfirmationModal({
                        isOpen: true,
                        clientName: client.name,
                        clientId: client.id
                      });
                    }}
                    disabled={isServerProcessing || isRecordProcessing}
                    className={`p-2 rounded-lg transition-colors shrink-0 ${
                      (isServerProcessing || isRecordProcessing) 
                        ? 'text-red-300 bg-gray-50 cursor-not-allowed' 
                        : 'text-red-500 hover:bg-red-50'
                    }`}
                    title="Remove Client"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        )}
      </div>
      
      <LocationEditModal
        isOpen={isLocationEditOpen}
        onClose={() => setIsLocationEditOpen(false)}
        onSave={setServerLocation}
        currentLocation={serverLocation}
        itemName={serverName}
        itemType="server"
      />
      
      <AddClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        onAdd={addClient}
        existingClients={clients.map(c => c.name)}
        serverName={serverName}
      />

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => removeClient(confirmationModal.clientId)}
        title="Delete Client?"
        message="Are you sure you want to delete this client?"
        itemName={confirmationModal.clientName}
        type="client"
      />
    </>
  );
};