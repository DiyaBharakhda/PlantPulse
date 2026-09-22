import { useEffect, useState } from "react"
import {
  ArrowLeft,
  Droplets,
  Sun,
  CloudRain,
  MapPin,
  Leaf
} from "lucide-react"

import {
  getWateringRecommendation,
  getPlantHealthScore
} from "../engine/CareEngine"

import "./PlantView.css"

function PlantView({
  plantData,
  onBack,
  onWater,
  onEditDetails
}) {
   const [weather, setWeather] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)

useEffect(() => {
  let cancelled = false

  const fetchWeather = async () => {
    setWeatherLoading(true)

    try {
      let location = plantData?.location

      /*
       * If saved plant location is available, use it.
       */
      if (location?.latitude && location?.longitude) {
        console.log("Using saved plant location:", location)
      } else {
        /*
         * Fallback: use browser location if saved coordinates
         * are not available.
         */
        if (!navigator.geolocation) {
          throw new Error("Location is not available.")
        }

        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000
            }
          )
        })

        location = {
          name: "Current Location",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }

        console.log("Using browser location:", location)
      }

      const response = await fetch(
        `http://127.0.0.1:8000/api/weather?lat=${location.latitude}&lon=${location.longitude}`
      )

      if (!response.ok) {
        throw new Error(
          `Weather request failed: ${response.status}`
        )
      }

      const data = await response.json()

      if (!cancelled) {
        setWeather(data)
      }

    } catch (error) {
      console.error(
        "Plant View weather fetch failed:",
        error
      )

      if (!cancelled) {
        setWeather(null)
      }

    } finally {
      if (!cancelled) {
        setWeatherLoading(false)
      }
    }
  }

  fetchWeather()

  return () => {
    cancelled = true
  }
}, [plantData?.location])

  const plant = plantData?.plant
  const details = plantData?.details

  const recommendation = getWateringRecommendation(
    plantData,
    weather
  )

  const healthScore = getPlantHealthScore(
    plantData,
    weather
  )

  return (
    <div className="plant-view-page">
      <div className="plant-view-content">

        <button
          type="button"
          className="plant-view-back"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
        <button
  type="button"
  className="plant-view-edit"
  onClick={onEditDetails}
>
  ✏️ Edit Plant Details
</button>

        <div className="plant-view-header">
          <div>
            <p className="plant-view-eyebrow">
              YOUR PLANT
            </p>

            <h1>
              {plant?.name || "Plant"}
            </h1>

            <p className="plant-view-scientific">
              {plant?.scientificName || "Plant"}
            </p>
          </div>

          <div className="plant-view-icon">
            <Leaf size={34} />
          </div>
        </div>


        {/* TODAY'S CARE */}

        <section className="plant-view-section care-highlight">

          <div className="plant-view-section-heading">
            <div className="plant-view-icon-small">
              <Droplets size={22} />
            </div>

            <div>
              <span>TODAY'S CARE</span>
              <h2>{recommendation.title}</h2>
            </div>
          </div>

          <p>
            {recommendation.message}
          </p>

          {recommendation.suggestedAmount &&
  (recommendation.action === "water" ||
    recommendation.action === "check-soil") && (
    <div className="plant-view-suggestion">
      <strong>
        Give it{" "}
        {formatWateringAmount(
          recommendation.suggestedAmount
        )}
        {recommendation.waterMl
          ? ` · about ${recommendation.waterMl} ml`
          : ""}
      </strong>

      <span>
        Water slowly until a little drains
        from the bottom.
      </span>
    </div>
)}

{recommendation.action !== "dont-water" &&
 recommendation.action !== "check-soil" &&
 recommendation.action !== "move" &&
 recommendation.action !== "protect" &&
 recommendation.action !== "water" ? null : (
  <button
    type="button"
    className="plant-view-water-button"
    onClick={recommendation.action === "water" ? onWater : onBack}
  >
    {recommendation.action === "water"
      ? "💧 Water this plant"
      : recommendation.action === "move"
        ? "🌤️ Move Plant"
        : recommendation.action === "protect"
          ? "🛡️ Protect Plant"
          : recommendation.action === "dont-water"
            ? "🌧️ Don't Water"
            : "🪴 Check Soil"}
  </button>
)}
        </section>


        {/* ENVIRONMENT */}

        <section className="plant-view-section">

          <div className="plant-view-section-title">
            <h2>Current Environment</h2>
            <span>
              Based on this plant's placement
            </span>
          </div>

          <div className="plant-view-grid">

            <InfoCard
              icon={<Sun size={20} />}
              label="Sunlight"
              value={formatValue(
                plantData?.spot?.name ||
                details?.sunlight
              )}
            />

            <InfoCard
              icon={<Droplets size={20} />}
              label="Drainage"
              value={formatValue(
                details?.drainage
              )}
            />

            <InfoCard
  icon={<CloudRain size={20} />}
  label="Rain Exposure"
  value={
    plantData?.spot?.name === "Sunny Side"
      ? "Exposed"
      : plantData?.spot?.name === "Partial Shade"
        ? "Partial"
        : plantData?.spot?.name === "Shaded Corner"
          ? "Protected"
          : formatValue(details?.rainExposure)
  }
/>

            <InfoCard
              icon={<MapPin size={20} />}
              label="Plant Spot"
              value={formatValue(
                plantData?.spot?.name
              )}
            />

            <InfoCard
              icon={<MapPin size={20} />}
              label="Pot"
              value={formatValue(
                details?.potSize
              )}
            />

          </div>

        </section>


        {/* HEALTH */}

        {healthScore !== null && (
          <section className="plant-view-section">

            <div className="plant-view-section-title">
              <h2>Plant Health</h2>
              <span>
                Based on current care conditions
              </span>
            </div>

            <div className="plant-health-card">
              <Leaf size={22} />

              <div>
                <span>Health Score</span>

                <strong>
                  {healthScore}/100 —{" "}
                  {getHealthLabel(healthScore)}
                </strong>
              </div>
            </div>

          </section>
        )}


        {/* LAST WATERED */}

        <section className="plant-view-section">

          <div className="plant-view-section-title">
            <h2>Last Watered</h2>
          </div>

          <div className="plant-health-card">

            <Droplets size={22} />

            <div>
              <span>Date</span>

              <strong>
                {plantData?.watering?.date
                  ? formatDate(
                      plantData.watering.date
                    )
                  : "Not recorded"}
              </strong>

              {plantData?.watering?.amount && (
                <small>
                  Given:{" "}
                  {formatWateringAmount(
                    plantData.watering.amount
                  )}
                </small>
              )}
            </div>

          </div>

        </section>


        {/* WEATHER */}

        <section className="plant-view-section">

          <div className="plant-view-section-title">
            <h2>Today's Weather</h2>
            <span>
  {plantData?.location?.name || "Your location"}
</span>
          </div>

          {weatherLoading ? (
  <div className="plant-weather-unavailable">
    Loading weather...
  </div>
) : weather ? (
            <div className="plant-view-grid">

              <InfoCard
                icon={<Sun size={20} />}
                label="Temperature"
                value={`${weather.current.temperature_2m}°C`}
              />

              <InfoCard
                icon={<Droplets size={20} />}
                label="Humidity"
                value={`${weather.current.relative_humidity_2m}%`}
              />

              <InfoCard
                icon={<CloudRain size={20} />}
                label="Rainfall"
                value={getRainDescription(
                  weather.daily.precipitation_sum[0]
                )}
              />

            </div>
          ) : (
            <div className="plant-weather-unavailable">
              Weather unavailable
            </div>
          )}

        </section>

      </div>
    </div>
  )
}


function InfoCard({ icon, label, value }) {
  return (
    <div className="plant-info-card">
      {icon}

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  )
}


function formatValue(value) {
  if (!value) {
    return "Not set"
  }

  const labels = {
    sunny: "Sunny Side",
    partial: "Partial Shade",
    shade: "Shaded Corner",
    yes: "Yes",
    no: "No",
    exposed: "Fully Exposed",
    protected: "Protected",
    handheld: "Handheld",
    tabletop: "Tabletop",
    "floor-pot": "Floor Pot",
    "large-planter": "Large Planter"
  }

  return labels[value] || value
}


function formatWateringAmount(amount) {
  const labels = {
    sip: "a Sip",
    drink: "a Good Drink",
    "deep-drink": "a Deep Drink",
    soaked: "a Soak"
  }

  return labels[amount] || amount
}


function formatDate(date) {
  if (!date) {
    return "Not recorded"
  }

  const [year, month, day] = date.split("-")

  return `${day}/${month}/${year}`
}


function getRainDescription(rainfall) {
  if (rainfall === 0) {
    return "No rain expected"
  }

  if (rainfall <= 2.5) {
    return "Very light rain"
  }

  if (rainfall <= 7.5) {
    return "Light rain"
  }

  if (rainfall <= 15) {
    return "Moderate rain"
  }

  if (rainfall <= 30) {
    return "Heavy rain"
  }

  return "Very heavy rain"
}


function getHealthLabel(score) {
  if (score >= 90) return "Excellent"
  if (score >= 75) return "Healthy"
  if (score >= 50) return "Needs attention"
  return "Needs care"
}


export default PlantView