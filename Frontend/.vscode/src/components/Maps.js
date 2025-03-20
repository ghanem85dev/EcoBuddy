import React, { useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-control-geocoder";
import markerIcon from "../assets/markerIcon.png";
import "../styles/Maps.css";
import LeafletGeocoder from './LeafletGeocoder';


// Configuration de l'icône par défaut pour Leaflet
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconSize: [25, 41],
  iconAnchor: [10, 41],
  popupAnchor: [2, -40],
});
L.Marker.prototype.options.icon = DefaultIcon;

const Maps = () => {
  // Position initiale du marqueur
  const initialPosition = [36.8065, 10.1815];
  
  // Utilisation de useState pour stocker la position du marqueur
  const [markerPosition, setMarkerPosition] = useState(initialPosition);

  return (
    <div className="map-wrapper">
      <MapContainer
        center={markerPosition} // Utiliser la position du marqueur dynamique
        zoom={13}
        scrollWheelZoom={true}
        className="leaflet-container"
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png" // Utilisation des tuiles en français
        />
        {/* Marqueur avec la position dynamique */}
        <Marker position={markerPosition} draggable={true}>
          <Popup>Tunis, Tunisie</Popup>
        </Marker>
        {/* Ajout du contrôleur de géocodage, avec la fonction setMarkerPosition pour mettre à jour la position */}
        <LeafletGeocoder setMarkerPosition={setMarkerPosition} />
      </MapContainer>
    </div>
  );
};

export default Maps;
