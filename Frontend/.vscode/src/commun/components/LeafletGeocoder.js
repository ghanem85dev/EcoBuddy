import React, { useEffect } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import "leaflet-control-geocoder";

const LeafletGeocoder = ({ setMarkerPosition }) => {
  const map = useMap();
  let geocoderControl;

  useEffect(() => {
    if (!map) return;

    // Ajout du contrôle de géocodage en haut à gauche
    geocoderControl = L.Control.geocoder({
      defaultMarkGeocode: false,
      position: "topleft", // Position en haut à gauche
    })
      .on("markgeocode", function (e) {
        const latlng = e.geocode.center;
        const marker = L.marker(latlng, { draggable: true }) // Marqueur draggable
          .addTo(map)
          .bindPopup(e.geocode.name)
          .openPopup();
        map.fitBounds(e.geocode.bbox);

        // Gérer le déplacement du marqueur
        marker.on("dragend", function (event) {
          const newPosition = marker.getLatLng();
          console.log("Nouvelle position:", newPosition);
          setMarkerPosition(newPosition); // Met à jour la position dans l'état
        });

        // Met à jour la position du marqueur après une recherche
        setMarkerPosition(latlng);
      })
      .addTo(map);

    return () => {
      // Suppression du contrôle lors du démontage
      if (geocoderControl) {
        map.removeControl(geocoderControl);
      }
    };
  }, [map, setMarkerPosition]);

  return null;
};

export default LeafletGeocoder;
