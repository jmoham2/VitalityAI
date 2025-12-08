'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface PlaceResult {
  name: string;
  address: string;
  rating?: number;
}

export default function AnimatedNearbyPlaces() {
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gyms, setGyms] = useState<PlaceResult[]>([]);
  const [stores, setStores] = useState<PlaceResult[]>([]);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);

  const enableLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      setError('');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationEnabled(true);
          setLoading(false);
        },
        (error) => {
          setError('Unable to access your location. Please enable location services.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  const findNearbyGyms = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not available');
      return;
    }

    setLoading(true);
    setError('');
    setShowResults(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          const response = await fetch(
            `/api/nearby?latitude=${latitude}&longitude=${longitude}&type=gym`
          );
          
          const data = await response.json();
          
          if (!response.ok) {
            setError(data.error || 'Failed to find nearby gyms. Please try again.');
            setLoading(false);
            return;
          }
          
          setGyms(data.results || []);
          setShowResults(true);
        } catch (err) {
          setError('Failed to find nearby gyms. Please try again.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError('Unable to access your location.');
        setLoading(false);
      }
    );
  };

  const findNearbyStores = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not available');
      return;
    }

    setLoading(true);
    setError('');
    setShowResults(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          const response = await fetch(
            `/api/nearby?latitude=${latitude}&longitude=${longitude}&type=store`
          );
          
          const data = await response.json();
          
          if (!response.ok) {
            setError(data.error || 'Failed to find nearby supplement stores. Please try again.');
            setLoading(false);
            return;
          }
          
          setStores(data.results || []);
          setShowResults(true);
        } catch (err) {
          setError('Failed to find nearby supplement stores. Please try again.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError('Unable to access your location.');
        setLoading(false);
      }
    );
  };

  return (
    <section className="w-full max-w-2xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-lg">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Find Nearby Places</h2>
      </div>

      {!locationEnabled ? (
        <div className="text-center space-y-4">
          <p className="text-lg text-gray-700">Enable location access to find gyms and supplement stores near you.</p>
          <Button
            onClick={enableLocation}
            disabled={loading}
            className="px-8 py-3 text-lg rounded-lg bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? 'Enabling...' : 'Enable Location'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-center text-gray-700 font-medium">Location enabled! Find what you're looking for.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              onClick={findNearbyGyms}
              disabled={loading}
              className="px-6 py-3 text-lg rounded-lg"
            >
              {loading ? 'Searching...' : '🏋️ Find Nearby Gyms'}
            </Button>
            <Button
              onClick={findNearbyStores}
              disabled={loading}
              variant="outline"
              className="px-6 py-3 text-lg rounded-lg"
            >
              {loading ? 'Searching...' : '💊 Find Supplement Stores'}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {showResults && (gyms.length > 0 || stores.length > 0) && (
        <div className="mt-6 space-y-4 max-h-96 overflow-y-auto">
          {gyms.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">🏋️ Nearby Gyms</h3>
              <div className="space-y-3">
                {gyms.map((gym, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                    <h4 className="font-bold text-lg text-gray-800">{gym.name}</h4>
                    <p className="text-gray-600">{gym.address}</p>
                    {gym.rating && (
                      <p className="text-sm text-yellow-600 mt-1">⭐ Rating: {gym.rating}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {stores.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">💊 Nearby Supplement Stores</h3>
              <div className="space-y-3">
                {stores.map((store, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                    <h4 className="font-bold text-lg text-gray-800">{store.name}</h4>
                    <p className="text-gray-600">{store.address}</p>
                    {store.rating && (
                      <p className="text-sm text-yellow-600 mt-1">⭐ Rating: {store.rating}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
