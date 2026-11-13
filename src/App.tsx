import {
  useEffect,
  useState,
  type ChangeEvent,
  type SubmitEvent,
  type JSX,
} from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L, { type LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

import arrowIcon from "./assets/icon-arrow.svg";
import locationIcon from "./assets/icon-location.svg";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: locationIcon,
  shadowUrl: iconShadow,
  iconSize: [46, 56],
  iconAnchor: [23, 56],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationTypes {
  ip: string;
  location: {
    region: string;
    city: string;
    lat: number;
    lng: number;
    postalCode: string;
    timezone: string;
  };
  isp: string;
}

const apiKey = import.meta.env.VITE_IPIFY_API_KEY;

function ChangeView({ center }: { center: LatLngExpression }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 17);
  }, [center, map]);
  return null;
}

function App(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [locationData, setLocationData] = useState<LocationTypes | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const getLocation = async (query: string = ""): Promise<void> => {
    try {
      setLoading(true);
      setError(false);

      const cleanedQuery = query
        .trim()
        .replace(/^https?:\/\//i, "")
        .split("/")[0];

      const isIpv4 = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(cleanedQuery);
      const isIpv6 = cleanedQuery.includes(":");

      const paramName =
        cleanedQuery === ""
          ? ""
          : isIpv4 || isIpv6
            ? `&ipAddress=${cleanedQuery}`
            : `&domain=${cleanedQuery}`;

      const response = await fetch(
        `https://geo.ipify.org/api/v2/country,city?apiKey=${apiKey}${paramName}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch location data");
      }

      const data: LocationTypes = await response.json();
      setLocationData(data);
    } catch {
      setError(true);
      setLocationData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getLocation();
  }, []);

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    getLocation(searchQuery);
  };

  const mapCenter: LatLngExpression | undefined = locationData
    ? [locationData.location.lat, locationData.location.lng]
    : undefined;

  return (
    <main className="min-h-screen flex flex-col font-rubik">
      <header className="text-center w-full h-75 lg:h-70 bg-(image:--mobile-pattern) lg:bg-(image:--desktop-pattern) bg-center bg-cover bg-no-repeat pt-7 md:pt-8 px-6">
        <h1 className="text-3xl font-medium text-white">IP Address Tracker</h1>
        <form className="max-w-139 mx-auto mt-7 flex" onSubmit={handleSubmit}>
          <input
            type="text"
            name="ip-address"
            placeholder="Search for any IP address or domain"
            className="flex-1 min-w-0 h-14.5 px-6 bg-white rounded-l-2xl text-lg text-primary focus-visible:outline-0 focus-visible:bg-white/95"
            value={searchQuery}
            onChange={handleChange}
          />
          <button
            type="submit"
            aria-label="Search Button"
            className="flex w-14.5 h-14.5 items-center justify-center bg-black rounded-r-2xl transition-colors duration-200 hover:cursor-pointer hover:bg-primary focus-visible:bg-primary focus-visible:outline-none"
            disabled={loading}
          >
            <img src={arrowIcon} alt="" />
          </button>
        </form>
      </header>
      <section className="relative flex-1 flex flex-col bg-secondary">
        <div className="absolute flex items-center sm:items-start justify-center sm:justify-start w-[calc(100%-3rem)] xl:w-277.5 min-h-40 py-6 md:pt-9 md:pb-8 bg-white rounded-2xl shadow-lg left-1/2 -top-31 md:-top-20 -translate-x-1/2 z-1000">
          {!error && (
            <div className="w-full flex gap-6 sm:gap-0 flex-col sm:flex-row text-center sm:text-start relative">
              <div className="card card-border">
                <h2 className="card-title">IP Address</h2>
                <p className="card-info">
                  {loading || !locationData ? "-" : locationData.ip}
                </p>
              </div>
              <div className="card card-border">
                <h2 className="card-title">Location</h2>
                <p className="card-info">
                  {loading || !locationData
                    ? "-"
                    : `${locationData.location.city}, ${locationData.location.region} ${locationData.location.postalCode}`}
                </p>
              </div>
              <div className="card card-border">
                <h2 className="card-title">Timezone</h2>
                <p className="card-info">
                  {loading || !locationData
                    ? "-"
                    : `UTC ${locationData.location.timezone}`}
                </p>
              </div>
              <div className="card">
                <h2 className="card-title">ISP</h2>
                <p className="card-info">
                  {loading || !locationData
                    ? "-"
                    : locationData.isp || "Not Available"}
                </p>
              </div>
            </div>
          )}
          {error && (
            <p className="max-w-100 h-full my-auto mx-auto text-center text-xl font-medium text-primary">
              Something is wrong; please check your internet connection and IP
              address, then try again later.
            </p>
          )}
        </div>

        {mapCenter && (
          <MapContainer
            className="flex-1 w-full"
            center={mapCenter}
            zoom={17}
            zoomControl={false}
          >
            <ChangeView center={mapCenter} />
            <TileLayer
              attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={mapCenter} />
          </MapContainer>
        )}
      </section>
    </main>
  );
}

export default App;
