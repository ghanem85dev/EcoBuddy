import React, { useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";
import "leaflet-control-geocoder/dist/Control.Geocoder.js";
import markerIcon from "../../assets/markerIcon.png";
import "../styles/Maps.css";
import LeafletGeocoder from './LeafletGeocoder';
import { useNavigate, useLocation } from "react-router-dom";

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

  // Fonction pour mettre à jour la position du marqueur
  const updateMarkerPosition = (event) => {
    if (location.state?.isEditing) {
      const newPosition = event.target.getLatLng();
      setMarkerPosition(newPosition);
    }
  };

  // Fonction pour enregistrer et retourner
  // const handleSave = () => {
  //   if (location.state?.isEditing) {
  //     localStorage.setItem("coordinates", JSON.stringify({ 
  //       lat: markerPosition.lat, 
  //       lng: markerPosition.lng 
  //     }));

  //     if (location.state?.entreprise) {
  //       if (location.state?.isFirst) {
  //         navigate('/entreprise/addEntreprise', { 
  //           state: { 
  //             coordinates: markerPosition,
  //             preserveFormData: true
  //           } 
  //         });
  //       } else {
  //         navigate(`/listSites/${location.state?.idEntreprise}`, { 
  //           state: { 
  //             coordinates: markerPosition,
  //             preserveFormData: true
  //           } 
  //         });
  //       }
  //     } else {
  //       navigate(-1);
  //     }
  //   }
  // };
  const handleSave = () => {
    if (location.state?.isEditing) {
      localStorage.setItem("coordinates", JSON.stringify({ 
        lat: markerPosition.lat, 
        lng: markerPosition.lng 
      }));
  
      if (location.state?.entreprise) {
        if (location.state?.isFirst) {
          navigate('/entreprise/addEntreprise', { 
            state: { 
              coordinates: markerPosition,
              preserveFormData: true
            } 
          });
        } else {
          navigate(`/listSites/${location.state?.idEntreprise}`, { 
            state: { 
              coordinates: markerPosition,
              preserveFormData: true
            } 
          });
        }
      } else {
        navigate(-1);
      }
    }
  };

  return (
    <div className="map-wrapper">
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
        center={markerPosition}
        zoom={13}
        scrollWheelZoom={true}
        className="leaflet-container"
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"
        />
        <Marker 
          position={markerPosition} 
          draggable={location.state?.isEditing}
          eventHandlers={{ dragend: updateMarkerPosition }}
        >
          <Popup>Tunis, Tunisie</Popup>
        </Marker>
        <LeafletGeocoder setMarkerPosition={setMarkerPosition} />
      </MapContainer>
    </div>
  );
};

export default Maps;