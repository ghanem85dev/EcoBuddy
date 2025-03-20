import React, { useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-control-geocoder";
import markerIcon from "../assets/markerIcon.png";
import "../styles/Maps.css";
import LeafletGeocoder from './LeafletGeocoder';
import { useNavigate, useLocation } from "react-router-dom";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";
import "leaflet-control-geocoder/dist/Control.Geocoder.js";

// Configuration de l'icône par défaut pour Leaflet
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconSize: [25, 41],
  iconAnchor: [10, 41],
  popupAnchor: [2, -40],
});
L.Marker.prototype.options.icon = DefaultIcon;

const Maps = () => {
  const location = useLocation();
  const initialPosition = location.state?.coordinates || [36.8065, 10.1815];
  const [markerPosition, setMarkerPosition] = useState(initialPosition);
  const navigate = useNavigate();

  // Fonction pour mettre à jour la position du marqueur (uniquement en mode édition)
  const updateMarkerPosition = (event) => {
    if (location.state?.isEditing) {
      const newPosition = event.target.getLatLng();
      setMarkerPosition(newPosition);
      console.log("Nouvelle position du marqueur:", newPosition);
    }
  };

  // Fonction pour envoyer les coordonnées à la page sitesettings (uniquement en mode édition)
  const handleSave = () => {
    if (location.state?.isEditing) {
      console.log(localStorage.getItem("residenceData"));
      localStorage.setItem("coordinates", JSON.stringify({ 
        lat: markerPosition.lat, 
        lng: markerPosition.lng 
      })); 
      navigate('/sites-settings/1', { 
        state: { 
          coordinates: markerPosition, // Envoyer les nouvelles coordonnées
        } 
      });
    }
  };

  return (
    <div className="map-wrapper">
      {/* Afficher le bouton "Enregistrer" uniquement si isEditing est true */}
      {location.state?.isEditing && (
        <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000 }}>
          <button 
            onClick={handleSave} 
            style={{
              backgroundColor: '#003366',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Enregistrer
          </button>
        </div>
      )}

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
        <Marker 
          position={markerPosition} 
          draggable={location.state?.isEditing} // Activer le glisser-déposer uniquement en mode édition
          eventHandlers={{ dragend: updateMarkerPosition }} // Utiliser la fonction définie
        >
          <Popup>Tunis, Tunisie</Popup>
        </Marker>
        {/* Ajout du contrôleur de géocodage, avec la fonction setMarkerPosition pour mettre à jour la position */}
        <LeafletGeocoder setMarkerPosition={setMarkerPosition} />
      </MapContainer>
    </div>
  );
};

export default Maps;