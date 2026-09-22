import { useState } from "react"
import "./MySpace.css"
function MySpace({ space, plants, onSpotChange, onContinue, onBackToDashboard }) {

  const availableSpaces = [
    "Balcony",
    "Bedroom",
    "Terrace",
    "Garden",
    
  ]

  const [selectedSpace, setSelectedSpace] = useState(
    space?.name || "Balcony"
  )

  const visiblePlants = plants.filter(
    (plant) =>
      (plant.space_name || "").toLowerCase() ===
      selectedSpace.toLowerCase()
  )

  const spaceName = selectedSpace.toLowerCase()
const getSavedPositions = () => {
  try {
    const saved = localStorage.getItem("plantpulse_positions")
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

const savedPositions = getSavedPositions()

const initialPositions = {}

visiblePlants.forEach((plant, index) => {
  initialPositions[plant.id] =
    savedPositions[plant.id] || {
      x: 30 + (index % 3) * 30,
      y: 35 + (index % 2) * 25
    }
})

const [plantPositions, setPlantPositions] = useState(initialPositions)
const [plantSpots, setPlantSpots] = useState({})
const [locationChanged, setLocationChanged] = useState(null)

  const getSpotFromPosition = (x, y) => {

    // LIVING ROOM / BEDROOM
    // Window is at the top, so upper area receives more light.
    if (
      (spaceName === "living room" || spaceName === "bedroom") &&
      x >= 25 &&
      x <= 75 &&
      y <= 50
    ) {
      return "Sunny Side"
    }

    if (
      (spaceName === "living room" || spaceName === "bedroom") &&
      (x < 30 || y > 65)
    ) {
      return "Shaded Corner"
    }

    // BALCONY / TERRACE / GARDEN / OTHER
    if (x < 33) {
      return "Shaded Corner"
    }

    if (x > 66) {
      return "Sunny Side"
    }

    return "Partial Shade"
  }

 const handleDragEnd = (event, plantId) => {
  const spaceArea = event.currentTarget.parentElement
  const rect = spaceArea.getBoundingClientRect()

  let x = ((event.clientX - rect.left) / rect.width) * 100
  let y = ((event.clientY - rect.top) / rect.height) * 100

  x = Math.max(8, Math.min(92, x))
  y = Math.max(12, Math.min(88, y))

  const spot = getSpotFromPosition(x, y)

  setPlantPositions((current) => {
    const updated = {
      ...current,
      [plantId]: { x, y }
    }

    localStorage.setItem(
      "plantpulse_positions",
      JSON.stringify({
        ...getSavedPositions(),
        [plantId]: { x, y }
      })
    )

    return updated
  })

  setPlantSpots((current) => ({
    ...current,
    [plantId]: spot
  }))

  setLocationChanged({
    plantId,
    spot
  })

  if (onSpotChange) {
    onSpotChange(plantId, spot)
  }
}

  const renderPlants = () => {

    return visiblePlants.map((plant) => {

      const position = plantPositions[plant.id] || {
        x: 50,
        y: 55
      }

      return (
        
        <div
          key={plant.id}
          className="draggable-plant"
          draggable
          onDragEnd={(event) =>
            handleDragEnd(event, plant.id)
          }
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`
          }}
        >
          <span className="plant-icon">
            🪴
          </span>

          <strong>
            {plant.name}
          </strong>
        </div>
      )
    })
  }

  const handleContinue = () => {
    onContinue(plantSpots)
  }

  return (
    <div className="my-space-page">
      <button
  type="button"
  className="back-dashboard-button"
  onClick={onBackToDashboard}
>
  ← Back to Dashboard
</button>
      <div className="my-space-header">
  <span className="my-space-eyebrow">
    YOUR PLANT SPACE
  </span>

  <h1>
    {space?.name || "Your Plant Space"}
  </h1>

  <p>
    Drag your plant to the spot where you actually keep it.
    This helps PlantPulse understand the light and environment
    your plant receives.
  </p>
</div>

      <div className="my-space-content">

        <p className="space-eyebrow">
          YOUR PLANT SPACE
        </p>

        <h1>
          Your {space?.name || "space"}
        </h1>

        <p className="space-description">
          Drag each plant to where you normally keep it.
          Each plant's position helps PlantPulse understand
          its individual light conditions.
        </p>
        {locationChanged && (
  <div className="location-changed-message">
    <strong>Location changed</strong>
    <span>
      {plants.find((p) => p.id === locationChanged.plantId)?.name}
      {" "}is now in {locationChanged.spot}.
      Its care recommendation will be updated.
    </span>
  </div>
)}
<div className="space-selector">
  {availableSpaces.map((spaceOption) => (
    <button
      key={spaceOption}
      type="button"
      className={
        selectedSpace === spaceOption
          ? "space-selector-button active"
          : "space-selector-button"
      }
      onClick={() => setSelectedSpace(spaceOption)}
    >
      {spaceOption}
    </button>
  ))}
</div>
        <section className="space-visual">

          <div className="space-visual-header">

            <strong>
              {space?.name || "My Space"} · Top View
            </strong>

            <span>
              DRAG TO PLACE
            </span>

          </div>


          {/* BALCONY */}

          {spaceName === "balcony" && (
            <div className="space-map balcony-map">

              <div className="map-railing">
                RAILING
              </div>

              <div className="map-shade">
                <span>🌿</span>
                <small>Shaded</small>
              </div>

              <div className="map-partial">
                <span>🌤️</span>
                <small>Partial Shade</small>
              </div>

              <div className="map-sun">
                <span>☀️</span>
                <small>Sunny</small>
              </div>

              <div className="balcony-chair">
                <div></div>
              </div>

              <div className="map-door">
                DOOR
              </div>

              <div className="floor-grid"></div>

              {visiblePlants.length > 0 ? (
  renderPlants()
) : (
  <div className="empty-space-message">
    <strong>No plants here yet</strong>
    <span>Add a plant to this space from your Dashboard.</span>
  </div>
)}

            </div>
          )}


          {/* TERRACE */}

          {spaceName === "terrace" && (
            <div className="space-map terrace-map">

              <div className="terrace-wall top-wall">
                WALL
              </div>

              <div className="terrace-wall left-wall">
                WALL
              </div>

              <div className="terrace-wall right-wall">
                WALL
              </div>

              <div className="terrace-shaded-area">
                SHADED AREA
              </div>

              <div className="terrace-sun-area">
                <span>☀️</span>
                <small>Sunny Area</small>
              </div>

              <div className="terrace-door">
                DOOR
              </div>

              <div className="floor-grid"></div>

              {renderPlants()}

            </div>
          )}


          {/* LIVING ROOM */}

          {spaceName === "living room" && (
            <div className="space-map living-room-map">

              <div className="room-window">
                WINDOW
              </div>

              <div className="window-light">
                ☀️
              </div>

              <div className="sofa">
                SOFA
              </div>

              <div className="coffee-table">
                TABLE
              </div>

              <div className="room-door">
                DOOR
              </div>

              <div className="room-shade">
                SHADED
              </div>

              {renderPlants()}

            </div>
          )}


          {/* BEDROOM */}

          {spaceName === "bedroom" && (
            <div className="space-map bedroom-map">

              <div className="bedroom-window">
                WINDOW
              </div>

              <div className="bed">
                <div className="pillow"></div>
                BED
              </div>

              <div className="side-table">
                TABLE
              </div>

              <div className="bedroom-door">
                DOOR
              </div>

              <div className="bedroom-light">
                ☀️
              </div>

              <div className="bedroom-shade">
                SHADED
              </div>

              {renderPlants()}

            </div>
          )}


          {/* GARDEN */}

          {spaceName === "garden" && (
            <div className="space-map garden-map">

              <div className="garden-boundary">
                GARDEN BOUNDARY
              </div>

              <div className="garden-sun">
                ☀️
              </div>

              <div className="garden-shade">
                🌳
                <small>Shaded Area</small>
              </div>

              <div className="garden-path"></div>

              <div className="garden-ground"></div>

              {renderPlants()}

            </div>
          )}


          {/* OTHER */}

          {spaceName === "other" && (
            <div className="space-map other-map">

              <div className="other-boundary">
                YOUR SPACE
              </div>

              <div className="other-shade">
                SHADE
              </div>

              <div className="other-sun">
                ☀️
              </div>

              <div className="floor-grid"></div>

              {renderPlants()}

            </div>
          )}


          {/* PLANT POSITIONS */}

          {Object.keys(plantSpots).length > 0 && (
            <div className="selected-spot-list">

              {plants.map((plant) => {

                const spot = plantSpots[plant.id]

                if (!spot) return null

                return (
                  <p key={plant.id} className="selected-spot">

                    {plant.name}:
                    <strong>
                      {spot}
                    </strong>

                  </p>
                )
              })}

            </div>
          )}

        </section>


        <button
          className="space-continue"
          onClick={handleContinue}
        >
          Continue
        </button>

      </div>

    </div>
  )
}

export default MySpace