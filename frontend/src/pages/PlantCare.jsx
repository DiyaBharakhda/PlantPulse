import { useEffect, useState } from "react"

import {
  ArrowLeft,
  Droplets,
  Sun,
  CloudRain,
  Wind,
  Thermometer,
  Leaf,
  MapPin
} from "lucide-react"

import {
  getWateringRecommendation
} from "../engine/CareEngine"

import "./PlantCare.css"

function PlantCare({
  plantData,
  onBack,
  onWater
}) {

  const plant = plantData?.plant

  const [weather, setWeather] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)

  useEffect(() => {

    const location = plantData?.location

    if (!location?.latitude || !location?.longitude) {
      return
    }

    const fetchWeather = async () => {

      setWeatherLoading(true)

      try {

        const response = await fetch(
          `http://127.0.0.1:8000/api/weather?lat=${location.latitude}&lon=${location.longitude}`
        )

        if (!response.ok) {
          throw new Error("Weather request failed")
        }

        const data = await response.json()

        setWeather(data)

      } catch (error) {

        console.error(
          "Plant Care weather fetch failed:",
          error
        )

        setWeather(null)

      } finally {

        setWeatherLoading(false)

      }
    }

    fetchWeather()

  }, [plantData?.location])

  const recommendation =
    getWateringRecommendation(
      plantData,
      weather
    )

  const metrics =
    recommendation.metrics || {}

  return (
    <div className="plant-care-page">

      <div className="plant-care-content">

        {/* BACK */}

        <button
          type="button"
          className="plant-care-back"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>


        {/* HEADER */}

        <header className="plant-care-header">

          <p className="plant-care-eyebrow">
            DAILY CARE
          </p>

          <div className="plant-care-title-row">

            <div>
              <h1>
                What does {plant?.name || "your plant"} need today?
              </h1>

              <p>
                PlantPulse is checking its environment,
                weather and watering history.
              </p>
            </div>

            <div className="plant-care-icon">
              <Leaf size={34} />
            </div>

          </div>

        </header>


        {/* TODAY'S ACTION */}

        <section className="plant-care-section care-action-card">

          <div className="care-action-heading">

            <div className="care-action-icon">
              {getActionIcon(recommendation.action)}
            </div>

            <div>
              <span>
                TODAY'S ACTION
              </span>

              <h2>
                {recommendation.title}
              </h2>
            </div>

          </div>

          <p className="care-action-message">
            {recommendation.message}
          </p>


          {/* WATERING GUIDANCE */}

          {recommendation.suggestedAmount &&
            (
              recommendation.action === "water" ||
              recommendation.action === "check-soil"
            ) && (

              <div className="care-water-guidance">

                <div>
                  <span>
                    Suggested amount
                  </span>

                  <strong>
                    {formatWateringAmount(
                      recommendation.suggestedAmount
                    )}

                    {recommendation.waterMl
                      ? ` · about ${recommendation.waterMl} ml`
                      : ""}
                  </strong>
                </div>

                <p>
                  Water slowly until a little drains
                  from the bottom.
                </p>

              </div>
          )}


          {/* ACTION BUTTON */}

          {recommendation.action === "water" ? (

            <button
              type="button"
              className="care-primary-button"
              onClick={onWater}
            >
              💧 Water this plant
            </button>

          ) : (

            <div className="care-no-water-message">
              {getActionMessage(
                recommendation.action
              )}
            </div>

          )}

        </section>


        {/* WHY */}

        <section className="plant-care-section">

          <div className="plant-care-section-title">

            <h2>
              Why PlantPulse recommends this
            </h2>

            <span>
              Based on this plant's current conditions
            </span>

          </div>


          <div className="care-reasons">

            {(recommendation.reasons || []).map(
              (reason, index) => (

                <div
                  className="care-reason"
                  key={index}
                >
                  <span className="reason-number">
                    {index + 1}
                  </span>

                  <p>
                    {reason}
                  </p>
                </div>

              )
            )}

          </div>

        </section>


        {/* CURRENT CONDITIONS */}

        <section className="plant-care-section">

          <div className="plant-care-section-title">

            <h2>
              Current Conditions
            </h2>

            <span>
              What PlantPulse used for today's decision
            </span>

          </div>


          <div className="care-metrics-grid">

            <MetricCard
              icon={<Thermometer size={20} />}
              label="Temperature"
              value={
  weatherLoading
    ? "Loading..."
    : weather
      ? `${weather.current.temperature_2m}°C`
      : "Unavailable"
}
            />

            <MetricCard
              icon={<Droplets size={20} />}
              label="Humidity"
             value={
  weatherLoading
    ? "Loading..."
    : weather
      ? `${weather.current.relative_humidity_2m}%`
      : "Unavailable"
}
            />

            <MetricCard
              icon={<CloudRain size={20} />}
              label="Rain Today"
             value={
  weatherLoading
    ? "Loading..."
    : weather
      ? `${weather.daily.precipitation_sum[0]} mm`
      : "Unavailable"
}
            />

            <MetricCard
              icon={<Wind size={20} />}
              label="Wind"
              value={
  weatherLoading
    ? "Loading..."
    : weather
      ? `${weather.current.wind_speed_10m} km/h`
      : "Unavailable"
}
            />

          </div>

        </section>


        {/* CARE CALCULATION */}

        <section className="plant-care-section">

          <div className="plant-care-section-title">

            <h2>
              Care Calculation
            </h2>

            <span>
              Plant-specific drying estimate
            </span>

          </div>


          <div className="care-calculation-card">

            <div>
              <span>
                Days since watering
              </span>

              <strong>
                {recommendation.daysSinceWatering === null ||
recommendation.daysSinceWatering === undefined
  ? "Not recorded"
  : `${recommendation.daysSinceWatering} ${
      recommendation.daysSinceWatering === 1 ? "day" : "days"
    }`}
              </strong>
            </div>


            <div>
              <span>
                Expected drying window
              </span>

              <strong>
                {metrics.adjustedDryAfter
  ? `About ${Math.ceil(metrics.adjustedDryAfter)} day(s)`
  : "Calculating"}
              </strong>
            </div>


            <div>
              <span>
                Environment score
              </span>

              <strong>
                {metrics.environmentScore !== undefined
                  ? `${metrics.environmentScore}/100`
                  : "Calculating"}
              </strong>
            </div>

          </div>

        </section>


        {/* PLACEMENT */}

        <section className="plant-care-section">

          <div className="plant-care-section-title">

            <h2>
              Plant Placement
            </h2>

            <span>
              Where this plant is currently living
            </span>

          </div>


          <div className="care-placement-card">

            <MapPin size={21} />

            <div>

              <span>
                Space
              </span>

              <strong>
                {plantData?.space?.name ||
                  plantData?.location?.name ||
                  "Not set"}
              </strong>

            </div>

            <div>

              <span>
                Spot
              </span>

              <strong>
                {plantData?.spot?.name ||
                  formatSunlight(
                    plantData?.details?.sunlight
                  )}
              </strong>

            </div>

          </div>

        </section>


      </div>

    </div>
  )
}


/* =========================================================
   METRIC CARD
========================================================= */

function MetricCard({
  icon,
  label,
  value
}) {

  return (
    <div className="care-metric-card">

      {icon}

      <div>

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>
  )
}


/* =========================================================
   ACTION ICON
========================================================= */

function getActionIcon(action) {

  const icons = {
    water: "💧",
    "check-soil": "🪴",
    move: "🌤️",
    protect: "🛡️",
    "dont-water": "🌧️",
    wait: "⏳",
    setup: "⚙️"
  }

  return icons[action] || "🌱"
}


/* =========================================================
   ACTION MESSAGE
========================================================= */

function getActionMessage(action) {

  if (action === "dont-water") {
    return "🌧️ No watering needed today."
  }

  if (action === "move") {
    return "🌤️ Adjust the plant's position as recommended."
  }

  if (action === "protect") {
    return "🛡️ Give the plant a more sheltered position."
  }

  if (action === "check-soil") {
    return "🪴 Check the soil before deciding whether to water."
  }

  if (action === "wait") {
    return "⏳ No watering needed right now. Keep monitoring."
  }

  return "🌱 Follow the recommendation above."
}


/* =========================================================
   HELPERS
========================================================= */

function formatWateringAmount(amount) {

  const labels = {
    sip: "a Sip",
    drink: "a Good Drink",
    "deep-drink": "a Deep Drink",
    soaked: "a Soak"
  }

  return labels[amount] || amount
}


function formatSunlight(value) {

  const labels = {
    sunny: "Sunny Side",
    partial: "Partial Shade",
    shade: "Shaded Corner"
  }

  return labels[value] || "Not set"
}


export default PlantCare