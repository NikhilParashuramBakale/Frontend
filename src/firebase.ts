// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, remove, onValue, off } from "firebase/database";

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

// Firebase helper functions
export const createServer = (serverName: string) => {
  const serverRef = ref(database, `servers/${serverName}`);
  return set(serverRef, {
    mode: "idle",
    client_id: "",
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
};

export const deleteServer = (serverName: string) => {
  const serverRef = ref(database, `servers/${serverName}`);
  return remove(serverRef);
};

export const createClient = (serverName: string, clientName: string) => {
  const clientRef = ref(database, `servers/${serverName}/record/${clientName}`);
  return set(clientRef, {
    status: "idle",
    request: false,
    time_range: "",
    date: ""
  });
};

export const deleteClient = (serverName: string, clientName: string) => {
  const clientRef = ref(database, `servers/${serverName}/record/${clientName}`);
  return remove(clientRef);
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
