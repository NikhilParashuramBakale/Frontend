import React, { useState } from 'react';
import { X, MapPin, Save } from 'lucide-react';

interface LocationEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (location: string) => void;
  currentLocation: string;
  itemName: string;
  itemType: 'server' | 'client';
}

export const LocationEditModal: React.FC<LocationEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentLocation,
  itemName,
  itemType
}) => {
  const [location, setLocation] = useState(currentLocation);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(location);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-emerald-100">
        <div className="bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-700 px-4 py-3 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold">Edit Location</h3>
              <p className="text-emerald-100 text-xs">{itemType} → {itemName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Location
            </label>
            <textarea
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm resize-none"
              placeholder="Enter location description..."
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
            onClick={handleSave}
            className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1.5 text-sm"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};