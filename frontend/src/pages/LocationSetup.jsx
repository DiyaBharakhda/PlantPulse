import { useEffect, useRef, useState } from "react"
import { MapPin, Search, Navigation } from "lucide-react"

import LocationMap from "../components/LocationMap"

import "./LocationSetup.css"

function LocationSetup({ onContinue }) {

  const [location, setLocation] = useState("")
  const [results, setResults] = useState([])
  const [userCoordinates, setUserCoordinates] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [hasSearched, setHasSearched] = useState(false)

  const searchTimeout = useRef(null)
  const abortController = useRef(null)


  useEffect(() => {

    return () => {

      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }

      if (abortController.current) {
        abortController.current.abort()
      }

    }

  }, [])


  const searchLocations = (value) => {

    setLocation(value)
    setSelectedLocation(null)
    setError("")
    setHasSearched(false)

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    if (abortController.current) {
      abortController.current.abort()
    }

    if (value.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }


    searchTimeout.current = setTimeout(async () => {

      try {

        setLoading(true)

        abortController.current = new AbortController()

    let searchUrl =
    `http://127.0.0.1:8000/api/search-location?q=${encodeURIComponent(value.trim())}`

    if (userCoordinates) {
    searchUrl +=
        `&lat=${userCoordinates.latitude}&lon=${userCoordinates.longitude}`
    }

    const response = await fetch(
    searchUrl,
    {
        signal: abortController.current.signal
    }
    )

        if (!response.ok) {
          throw new Error("Location search failed")
        }

        const data = await response.json()

        setResults(data)
        setHasSearched(true)

      } catch (err) {

        if (err.name === "AbortError") {
          return
        }

        console.error(err)

        setError("Unable to search locations.")
        setResults([])
        setHasSearched(true)

      } finally {

        setLoading(false)

      }

    }, 500)

  }


  const selectLocation = (place) => {

    const locationData = {
      name: place.display_name,
      latitude: Number(place.latitude),
      longitude: Number(place.longitude)
    }
    
    setUserCoordinates({
        latitude: locationData.latitude,
        longitude: locationData.longitude
        })

    setSelectedLocation(locationData)
    setLocation(place.display_name)
    setResults([])
    setHasSearched(false)
    setError("")
  }


const useMyLocation = () => {

  console.log("Use My Location clicked")

  // Completely clear manual search
  setLocation("")
  setResults([])
  setHasSearched(false)
  setError("")
  setSelectedLocation(null)
  setLoading(true)

  if (!navigator.geolocation) {
    setLoading(false)
    setError("Location detection is not supported by your browser.")
    return
  }

  navigator.geolocation.getCurrentPosition(

    (position) => {

      console.log("Location detected:", position.coords)

      const latitude = position.coords.latitude
      const longitude = position.coords.longitude

      const locationData = {
        name: "My Current Location",
        latitude: latitude,
        longitude: longitude
      }

      setUserCoordinates({
        latitude: latitude,
        longitude: longitude
      })

      setSelectedLocation(locationData)

      // Keep manual search EMPTY
      setLocation("")
      setResults([])
      setHasSearched(false)
      setError("")
      setLoading(false)
    },

    (error) => {

      console.error("Location error:", error)

      setLoading(false)

      if (error.code === 1) {
        setError(
          "Location permission was denied. Please allow location access in your browser."
        )
      } else if (error.code === 2) {
        setError(
          "Your location could not be determined. Please try again."
        )
      } else if (error.code === 3) {
        setError(
          "Location detection timed out. Please try again."
        )
      } else {
        setError(
          "Unable to detect your location. Please search manually."
        )
      }
    },

    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  )
}


  const handleContinue = () => {

    if (!selectedLocation) {

      setError("Please select a location first.")

      return
    }

    onContinue(selectedLocation)
  }


  return (

    <div className="location-page">

      <div className="location-content">

        <p className="location-eyebrow">
          LET'S SET UP YOUR SPACE
        </p>

        <h1>
          Where do your plants live?
        </h1>

        <p className="location-description">
          Your location helps PlantPulse understand the weather
          and environment around your plants.
        </p>


        <div className="location-options">


          {/* USE CURRENT LOCATION */}

          <button
            className="location-card"
            onClick={useMyLocation}
          >

            <div className="location-card-icon">
              <Navigation size={24} />
            </div>

            <div>

              <strong>
                Use My Location
              </strong>

              <span>
                Automatically detect where you are
              </span>

            </div>

          </button>


          {/* MANUAL SEARCH */}

          <div className="manual-location">

            <div className="manual-header">

              <div className="location-card-icon">
                <Search size={24} />
              </div>

              <div>

                <strong>
                  Search Manually
                </strong>

                <span>
                  Search for your area, city or locality
                </span>

              </div>

            </div>


            <div className="search-wrapper">

              <MapPin size={20} />

              <input
                type="text"
                value={location}
                onChange={(e) =>
                  searchLocations(e.target.value)
                }
                placeholder="Search a location..."
              />

            </div>


            {loading && (

              <div className="search-status">
                Searching...
              </div>

            )}


            {/* SEARCH RESULTS */}

            {!loading && results.length > 0 && (

              <div className="location-results">

                {results.map((place, index) => (

                  <button
                    key={`${place.latitude}-${place.longitude}-${index}`}
                    className="location-result"
                    onClick={() => selectLocation(place)}
                  >

                    <MapPin size={18} />

                    <span>
                      {place.display_name}
                    </span>

                  </button>

                ))}

              </div>

            )}


            {/* NO RESULTS */}

            {!loading &&
              hasSearched &&
              results.length === 0 &&
              !error &&
              !selectedLocation && (

                <div className="search-status">
                  No locations found.
                </div>

              )
            }


            {/* SELECTED LOCATION */}

            {selectedLocation && (

              <div className="selected-location">

                <MapPin size={18} />

                <div>

                  <strong>
                    Location selected
                  </strong>

                  <span>
                    {selectedLocation.name}
                  </span>

                  <small>
                    {selectedLocation.latitude.toFixed(5)},
                    {" "}
                    {selectedLocation.longitude.toFixed(5)}
                  </small>

                </div>

              </div>

            )}


            {/* ERROR */}

            {error && (

              <p className="location-error">
                {error}
              </p>

            )}

          </div>

        </div>


{/* MAP */}

{selectedLocation && (
  <div className="map-section">

    <div className="map-header">
      <div>
        <p className="map-eyebrow">
          LOCATION CONFIRMATION
        </p>

        <h2>
          Is this your location?
        </h2>

        <p>
          PlantPulse will use this area to understand
          your local weather and environment.
        </p>
      </div>
    </div>

    <LocationMap
  latitude={selectedLocation.latitude}
  longitude={selectedLocation.longitude}
  name={selectedLocation.name}
  onLocationChange={(newCoordinates) => {

    setSelectedLocation((current) => ({
      ...current,
      latitude: newCoordinates.latitude,
      longitude: newCoordinates.longitude
    }))

    setUserCoordinates({
      latitude: newCoordinates.latitude,
      longitude: newCoordinates.longitude
    })

  }}
/>

  </div>
)}


{/* CONTINUE */}

<button
  className="continue-button"
  onClick={handleContinue}
>
  Continue
</button>

      </div>

    </div>

  )

}

export default LocationSetup