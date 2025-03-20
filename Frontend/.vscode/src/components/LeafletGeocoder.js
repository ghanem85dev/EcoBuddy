import React, { useEffect } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";

const LeafletGeocoder = ({ setMarkerPosition }) => {
  const map = useMap();
  let geocoderControl;

  useEffect(() => {
    if (!map) return;

    // Ajoutez le contrôle de géocodage
    geocoderControl = L.Control.geocoder({
      defaultMarkGeocode: false,
    })
      .on("markgeocode", function (e) {
        const latlng = e.geocode.center;
        const marker = L.marker(latlng, { draggable: true })  // Marqueur draggable
          .addTo(map)
          .bindPopup(e.geocode.name)
          .openPopup();
        map.fitBounds(e.geocode.bbox);

        // Gérer le déplacement du marqueur
        marker.on('dragend', function (event) {
          const newPosition = marker.getLatLng();
          console.log("Nouveau position:", newPosition);
          setMarkerPosition(newPosition); // Met à jour la position dans l'état
        });

        // Met à jour l'état au cas où l'utilisateur clique pour ajouter un marqueur
        setMarkerPosition(latlng); // Initialiser la position du marqueur
      })
      .addTo(map);

    return () => {
      // Nettoyez le contrôle de géocodage lors du démontage du composant
      if (geocoderControl) {
        map.removeControl(geocoderControl);
      }
    };
  }, [map, setMarkerPosition]);

  return null;
};

export default LeafletGeocoder;
 