// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, remove, onValue, off } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDDCIyLe28ivoIzohTUwBzb3LVKfLtJxBg",
  authDomain: "bcit-d5764.firebaseapp.com",
  databaseURL: "https://bcit-d5764-default-rtdb.firebaseio.com",
  projectId: "bcit-d5764",
  storageBucket: "bcit-d5764.firebasestorage.app",
  messagingSenderId: "864766820084",
  appId: "1:864766820084:web:d524e84073e1924e5be8a1",
  measurementId: "G-0KZX261EZY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Sign in anonymously for database access
signInAnonymously(auth)
  .then(() => {
    console.log('Signed in anonymously to Firebase');
  })
  .catch((error) => {
    console.error('Anonymous sign-in failed:', error);
  });

// Firebase helper functions
// Firebase helper functions
export const createServer = async (serverName: string, location?: string) => {
  try {
    console.log('Attempting to create server:', serverName, 'with location:', location);
    const serverRef = ref(database, `servers/${serverName}`);
    await set(serverRef, {
      mode: "idle",
      client_id: "",
      location: location || "Monitoring Station", // Store location in Firebase
      data: {
        folder_no: "",
        connected: false,
        sensor_file: false,
        audio_file: false,
        image_file: false,
        transmission_completed: false
      },
      record: {
        client1: {
          status: "idle",
          request: false,
          time_range: "",
          date: ""
        }
      }
    });
    console.log('Server created successfully:', serverName);
  } catch (error) {
    console.error('Failed to create server:', serverName, error);
    throw error;
  }
};

export const deleteServer = async (serverName: string) => {
  try {
    console.log('Attempting to delete server:', serverName);
    const serverRef = ref(database, `servers/${serverName}`);
    await remove(serverRef);
    console.log('Server deleted successfully:', serverName);
  } catch (error) {
    console.error('Failed to delete server:', serverName, error);
    throw error;
  }
};

export const createClient = async (serverName: string, clientName: string) => {
  try {
    console.log('Attempting to create client:', serverName, clientName);
    const clientRef = ref(database, `servers/${serverName}/record/${clientName}`);
    await set(clientRef, {
      status: "idle",
      request: false,
      time_range: "",
      date: ""
    });
    console.log('Client created successfully:', serverName, clientName);
  } catch (error) {
    console.error('Failed to create client:', serverName, clientName, error);
    throw error;
  }
};

export const deleteClient = async (serverName: string, clientName: string) => {
  try {
    console.log('Attempting to delete client:', serverName, clientName);
    const clientRef = ref(database, `servers/${serverName}/record/${clientName}`);
    await remove(clientRef);
    console.log('Client deleted successfully:', serverName, clientName);
  } catch (error) {
    console.error('Failed to delete client:', serverName, clientName, error);
    throw error;
  }
};

export const loadAllServers = (callback: (servers: any) => void) => {
  const serversRef = ref(database, 'servers');
  onValue(serversRef, (snapshot) => {
    const data = snapshot.val();
    console.log('Loaded servers from Firebase:', data);
    
    // Transform Firebase data to include clients
    const serversWithClients: any = {};
    if (data) {
      Object.keys(data).forEach(serverKey => {
        const serverData = data[serverKey];
        serversWithClients[serverKey] = {
          ...serverData,
          clients: serverData.record ? Object.keys(serverData.record) : ['client1']
        };
      });
    }
    
    callback(serversWithClients);
  });
  return () => off(serversRef);
};

export const loadServerClients = (serverName: string, callback: (clients: string[]) => void) => {
  const serverRef = ref(database, `servers/${serverName}/record`);
  onValue(serverRef, (snapshot) => {
    const data = snapshot.val();
    console.log(`Loaded clients for server ${serverName}:`, data);
    const clientNames = data ? Object.keys(data) : ['client1'];
    callback(clientNames);
  });
  return () => off(serverRef);
};

export const setServerMode = (serverName: string, mode: "record" | "data" | "idle") => {
  const modeRef = ref(database, `servers/${serverName}/mode`);
  return set(modeRef, mode);
};

export const updateDataSection = (serverName: string, clientId: string) => {
  // Update client_id at the server level
  const clientIdRef = ref(database, `servers/${serverName}/client_id`);
  set(clientIdRef, clientId);
  
  // Update the data section
  const dataRef = ref(database, `servers/${serverName}/data`);
  return set(dataRef, {
    folder_no: `FLD_${Date.now().toString().slice(-6)}`,
    connected: false,
    sensor_file: false,
    audio_file: false,
    image_file: false,
    transmission_completed: false
  });
};

export const subscribeToServerData = (serverName: string, callback: (data: any) => void) => {
  const dataRef = ref(database, `servers/${serverName}/data`);
  onValue(dataRef, (snapshot: any) => {
    callback(snapshot.val());
    
    // Reset Firebase after transmission is complete
    const data = snapshot.val();
    if (data && data.transmission_completed) {
      // Reset after a small delay to ensure UI updates
      setTimeout(() => {
        resetDataSection(serverName);
      }, 5000);
    }
  });
  return () => off(dataRef);
};

export const resetDataSection = (serverName: string) => {
  // Reset client_id at the server level
  const clientIdRef = ref(database, `servers/${serverName}/client_id`);
  set(clientIdRef, "");
  
  // Reset the data section
  const dataRef = ref(database, `servers/${serverName}/data`);
  return set(dataRef, {
    folder_no: "",
    connected: false,
    sensor_file: false,
    audio_file: false,
    image_file: false,
    transmission_completed: false
  });
};

// Record section functions
export const updateRecordSection = (serverName: string, clientName: string, timeRange: string, date: string) => {
  // Update client_id at the server level
  const clientIdRef = ref(database, `servers/${serverName}/client_id`);
  set(clientIdRef, clientName);
  
  // Update the record section
  const recordRef = ref(database, `servers/${serverName}/record/${clientName}`);
  return set(recordRef, {
    status: "idle",
    request: true,
    time_range: timeRange,
    date: date
  });
};

export const subscribeToRecordData = (serverName: string, clientName: string, callback: (data: any) => void) => {
  const recordRef = ref(database, `servers/${serverName}/record/${clientName}`);
  onValue(recordRef, (snapshot: any) => {
    callback(snapshot.val());
  });
  return () => off(recordRef);
};

export const resetRecordSection = (serverName: string, clientName: string) => {
  // Reset client_id at the server level
  const clientIdRef = ref(database, `servers/${serverName}/client_id`);
  set(clientIdRef, "");
  
  // Reset the record section
  const recordRef = ref(database, `servers/${serverName}/record/${clientName}`);
  return set(recordRef, {
    status: "idle",
    request: false,
    time_range: "",
    date: ""
  });
};

export { database };
