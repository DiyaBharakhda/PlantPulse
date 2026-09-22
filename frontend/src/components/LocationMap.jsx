import {
  MapContainer,
  TileLayer,
  Marker,
  Popup
} from "react-leaflet"

import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "./LocationMap.css"


/* =========================================================
   PLANTPULSE LOCATION PIN
   Custom icon avoids Leaflet's default-icon loading issue
   ========================================================= */

const locationPin = L.divIcon({
  className: "plantpulse-location-marker",
  html: `
    <div class="plantpulse-pin">
      <div class="plantpulse-pin-dot"></div>
    </div>
  `,
  iconSize: [42, 52],
  iconAnchor: [21, 52],
  popupAnchor: [0, -48]
})


function LocationMap({
  latitude,
  longitude,
  name,
  onLocationChange
}) {

  const handleDragEnd = (event) => {

    const marker = event.target
    const position = marker.getLatLng()

    onLocationChange({
      latitude: position.lat,
      longitude: position.lng
    })
  }

  return (
    <div className="location-map">

      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={false}
        style={{
          height: "320px",
          width: "100%",
          borderRadius: "16px"
        }}
      >

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker
          position={[latitude, longitude]}
          icon={locationPin}
          draggable={true}
          eventHandlers={{
            dragend: handleDragEnd
          }}
        >

          <Popup>
            <strong>{name}</strong>
            <br />
            Drag this pin to refine your location.
          </Popup>

        </Marker>

      </MapContainer>

    </div>
  )
}

export default LocationMap