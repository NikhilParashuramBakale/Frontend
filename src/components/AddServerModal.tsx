import React, { useState } from 'react';
import { X, ChevronUp, ChevronDown, MapPin } from 'lucide-react';

interface AddServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (serverNumber: number, location: string) => void;
  existingServers: string[];
}

export const AddServerModal: React.FC<AddServerModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  existingServers
}) => {
  const [serverNumber, setServerNumber] = useState(1);
  const [location, setLocation] = useState('Monitoring Station A');

  if (!isOpen) return null;

  // Find available server numbers
  const getAvailableNumbers = () => {
    const numbers = [];
    for (let i = 1; i <= 10; i++) {
      if (!existingServers.includes(`Server ${i}`)) {
        numbers.push(i);
      }
    }
    return numbers;
  };

  const availableNumbers = getAvailableNumbers();
  
  // Ensure we have a valid server number
  const validServerNumber = availableNumbers.includes(serverNumber) ? serverNumber : availableNumbers[0] || 1;

  const incrementCounter = () => {
    const currentIdx = availableNumbers.indexOf(validServerNumber);
    if (currentIdx < availableNumbers.length - 1) {
      setServerNumber(availableNumbers[currentIdx + 1]);
    }
  };

  const decrementCounter = () => {
    const currentIdx = availableNumbers.indexOf(validServerNumber);
    if (currentIdx > 0) {
      setServerNumber(availableNumbers[currentIdx - 1]);
    }
  };

  const handleAdd = () => {
    onAdd(validServerNumber, location);
    onClose();
    // Reset for next time
    setLocation('Monitoring Station A');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-emerald-100">
        <div className="bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-700 px-4 py-3 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold">Add New Server</h3>
              <p className="text-emerald-100 text-xs">Configure Server Details</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Server Number</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                <span className="font-semibold text-gray-900">Server {validServerNumber}</span>
              </div>
              <div className="flex flex-col">
                <button
                  onClick={incrementCounter}
                  disabled={!availableNumbers.length || availableNumbers.indexOf(validServerNumber) >= availableNumbers.length - 1}
                  className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={decrementCounter}
                  disabled={!availableNumbers.length || availableNumbers.indexOf(validServerNumber) <= 0}
                  className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
            {availableNumbers.length === 0 && (
              <p className="text-xs text-red-500">No available server numbers (max 10)</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm"
              placeholder="Enter server location"
            />
          </div>
        </div>

        <div className="bg-gray-50 px-4 py-3 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={availableNumbers.length === 0}
            className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Server
          </button>
        </div>
      </div>
    </div>
  );
};
