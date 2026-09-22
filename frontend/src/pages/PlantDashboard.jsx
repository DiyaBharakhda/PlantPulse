import { useEffect, useMemo, useState } from "react"
import {
  Droplets,
  Sun,
  CloudRain,
  MapPin,
  Leaf,
  Wind,
  Thermometer,
  Plus,
  RefreshCw,
  ArrowRight,
  House,
  Shield,
  Sprout,
  CalendarDays,
  LogOut,
  UserRound,
  ChevronDown
} from "lucide-react"

import { getWateringRecommendation } from "../engine/CareEngine"
import "./PlantDashboard.css"

const PLANT_IMAGES = {
  "money plant": "/plants/money-plant.png",
  "aloe vera": "/plants/aloe-vera.png",
  "rose": "/plants/rose.png",
  "tulsi": "/plants/tulsi.png",
  "coriander": "/plants/coriander.png",
  "lemongrass": "/plants/lemongrass.png",
  "snake plant": "/plants/snake-plant.png",
  "peace lily": "/plants/peace-lily.png",
  "spider plant": "/plants/spider-plant.png",
  "areca palm": "/plants/areca-palm.png",
  "curry leaf": "/plants/curry-leaf.png",
  "mint": "/plants/mint.png",
  "hibiscus": "/plants/hibiscus.png",
  "jasmine": "/plants/jasmine.png"
}

function PlantDashboard({
  plantData,
  location,
  plants,
  onStartWatering,
  onOpenMySpace,
  onSelectPlant,
  onOpenPlantCare,
  onAddPlant
}) {
  const [weather, setWeather] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [userLocation, setUserLocation] = useState(plantData?.location || null)
  const [showLocationPopup, setShowLocationPopup] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationMessage, setLocationMessage] = useState("")
  const [profileOpen, setProfileOpen] = useState(false)

  const savedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("plantpulse_user") || "null")
    } catch {
      return null
    }
  }, [])

  const userName = savedUser?.name || savedUser?.username || "Plant Parent"

  useEffect(() => {
    if (plantData?.location) {
      setUserLocation(plantData.location)
    }
  }, [plantData?.location])

  const fetchWeather = async (location = userLocation) => {
    if (!location?.latitude || !location?.longitude) return

    setWeatherLoading(true)
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/weather?lat=${location.latitude}&lon=${location.longitude}`
      )

      if (!response.ok) {
        throw new Error(`Weather request failed: ${response.status}`)
      }

      setWeather(await response.json())
    } catch (error) {
      console.error("Weather fetch failed:", error)
      setWeather(null)
    } finally {
      setWeatherLoading(false)
    }
  }

  useEffect(() => {
    if (userLocation) fetchWeather(userLocation)
  }, [userLocation])

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("Your browser does not support location access.")
      return
    }

    setLocationLoading(true)
    setLocationMessage("Finding your location...")

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude

        const newLocation = {
          name: "Current Location",
          latitude,
          longitude
        }

        setUserLocation(newLocation)
        setLocationMessage("Location detected.")
        setShowLocationPopup(false)

        try {
          if (plantData?.location?.id) {
            await fetch(
              `http://127.0.0.1:8000/api/locations/${plantData.location.id}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: "Current Location",
                  latitude,
                  longitude
                })
              }
            )
          }
        } catch (error) {
          console.error("Location update failed:", error)
        }

        setLocationLoading(false)
      },
      (error) => {
        console.error("Location permission error:", error)
        setLocationMessage(
          "Location access was not allowed. You can continue without it."
        )
        setLocationLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    )
  }

  const buildPlantData = (plant) => ({
    plant: {
      id: plant.id,
      name: plant.name,
      scientificName: plant.scientific_name
    },
    details: {
      age: plant.age,
      potSize: plant.pot_size,
      potMaterial: plant.pot_material,
      drainage: plant.drainage,
      sunlight: plant.sunlight,
      rainExposure: plant.rain_exposure
    },
    spot: plant.spot ? { name: plant.spot } : null,
    watering: plant.watering,
    location: plant.location,
    space: { name: plant.space_name }
  })

  const plantRecommendations = useMemo(() => {
    return (plants || []).map((plant) => {
      const data = buildPlantData(plant)
      return {
        plant,
        data,
        recommendation: getWateringRecommendation(data, weather)
      }
    })
  }, [plants, weather])

  // Only genuinely actionable states appear in Today's Care.
  const attentionPlants = plantRecommendations.filter(({ recommendation }) =>
    ["water", "check-soil", "move", "protect"].includes(
      recommendation?.action
    )
  )

  const locationName =
    userLocation?.name && userLocation.name !== "Current Location"
      ? userLocation.name
      : userLocation
        ? "Current Location"
        : "Your location"

  const temperature = weather?.current?.temperature_2m
  const humidity = weather?.current?.relative_humidity_2m
  const wind = weather?.current?.wind_speed_10m
  const rain = weather?.daily?.precipitation_sum?.[0]
  const weatherAlerts = useMemo(() => {
    if (!weather || !plants?.length) return []

    const alerts = []

    // Find ALL plants exposed to rain
    const exposedPlants = plants.filter(
      (plant) =>
        plant.spot === "sunny" ||
        plant.spot === "Sunny Side"
    )

   const exposedPlantNames = exposedPlants
  .map(
    (plant) =>
      `${plant.name} — ${plant.space_name || "Space not set"}`
  )
  .filter(Boolean)

const exposedPlantText =
  exposedPlantNames.length === 1
    ? exposedPlantNames[0]
    : exposedPlantNames.length === 2
      ? `${exposedPlantNames[0]} and ${exposedPlantNames[1]}`
      : `${exposedPlantNames.slice(0, -1).join(", ")}, and ${exposedPlantNames[exposedPlantNames.length - 1]}`

    // Heavy rain
    if (rain != null && rain >= 7.5) {
      alerts.push({
        type: "rain",
        icon: "🌧️",
        title: "Heavy rain expected",
        message:
          exposedPlantNames.length > 0
            ? `${exposedPlantText} ${exposedPlantNames.length === 1 ? "is" : "are"} exposed to rain. Consider moving ${exposedPlantNames.length === 1 ? "it" : "them"} to a protected spot.`
            : "Avoid unnecessary watering today and protect plants from excessive rain."
      })
    }

    // Normal rain
    else if (rain != null && rain > 0) {
      alerts.push({
        type: "rain",
        icon: "🌧️",
        title: "Rain expected today",
        message:
          exposedPlantNames.length > 0
            ? `${exposedPlantText} ${exposedPlantNames.length === 1 ? "is" : "are"} exposed to rain. Check the soil before watering.`
            : "Rain is expected today. Check the soil before watering."
      })
    }

    // High temperature
    if (temperature != null && temperature >= 35) {
      alerts.push({
        type: "heat",
        icon: "☀️",
        title: "High heat today",
        message:
          "Plants may lose moisture faster. Check the soil before watering."
      })
    }

    // Strong wind
    if (wind != null && wind >= 30) {
      alerts.push({
        type: "wind",
        icon: "🌬️",
        title: "Strong winds expected",
        message:
          "Consider moving delicate plants to a sheltered location."
      })
    }

    return alerts
  }, [weather, plants, rain, temperature, wind])
  return (
    <div className="dashboard-page">
      <div className="botanical-glow botanical-glow-one" />
      <div className="botanical-glow botanical-glow-two" />

      <div className="dashboard-content">
        <header className="topbar">
          <button className="brand" type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <span className="brand-mark">
              <Leaf size={27} />
            </span>
            <span>
              <strong>PlantPulse</strong>
              <small>Greener Days, Healthier Tomorrows</small>
            </span>
          </button>

          <nav className="dashboard-nav">
            <button className="nav-link active" type="button">
              <House size={17} />
              Home
            </button>
            <button className="nav-link" type="button" onClick={onOpenMySpace}>
              <Sprout size={17} />
              My Space
            </button>

            <div className="profile-wrap">
              <button
                className="profile-button"
                type="button"
                onClick={() => setProfileOpen((value) => !value)}
              >
                <span className="avatar">{userName.charAt(0).toUpperCase()}</span>
                <span>{userName}</span>
                <ChevronDown size={16} />
              </button>

              {profileOpen && (
                <div className="profile-menu">
                  <button type="button" onClick={() => setProfileOpen(false)}>
                    <UserRound size={16} />
                    Profile
                  </button>
                  <button
                    type="button"
                    className="logout-menu-item"
                    onClick={() => {
                      localStorage.removeItem("plantpulse_user")
                      window.location.reload()
                    }}
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </nav>
        </header>

        <section className="hero-row">
          <div className="hero-copy">
            <p className="hero-eyebrow">GOOD {getPartOfDay().toUpperCase()},</p>
            <h1>{userName}<span className="hero-leaf">❧</span></h1>
            <p>Your plants are counting on you today!</p>
          </div>

          <div className="quote-card">
            <span className="quote-mark">“</span>
            <p>A plant today,<br />a brighter tomorrow.</p>
            <Leaf size={22} />
          </div>
        </section>

        <section className="top-info-grid">
          <article className="info-card location-card">
            <div className="info-icon location-icon">
              <MapPin size={24} />
            </div>
            <div className="info-main">
              <span className="info-label">Your Location</span>
              <strong>{locationName}</strong>
              <small>
                {userLocation?.latitude
                  ? `${userLocation.latitude.toFixed(4)}° N, ${userLocation.longitude.toFixed(4)}° E`
                  : "Set your location for local weather"}
              </small>
              <button
  type="button"
  className="outline-button"
  onClick={fetchCurrentLocation}
  disabled={locationLoading}
>
  <MapPin size={15} />
  {locationLoading ? "Finding Location..." : "Use My Location"}
</button>
            </div>
            <div className="map-lines" />
          </article>

          <article className="info-card weather-card">
            <div className="weather-main">
              <div className="weather-symbol">
                {weather?.current ? <WeatherIcon rain={rain} /> : <Sun size={42} />}
              </div>
              <div>
                <span className="info-label">TODAY'S WEATHER</span>
                <strong className="temperature">
                  {temperature != null ? `${Math.round(temperature)}°C` : "--"}
                </strong>
                <span className="weather-description">
                  {temperature != null ? getTemperatureDescription(temperature) : "Waiting for weather"}
                </span>
              </div>
            </div>

            <div className="weather-actions">
              <span>
                <RefreshCw size={14} className={weatherLoading ? "spin" : ""} />
                {weatherLoading ? "Updating" : "Live conditions"}
              </span>
              <button
                type="button"
                className="refresh-button"
                onClick={() => fetchWeather()}
                disabled={weatherLoading}
              >
                <RefreshCw size={15} />
                Refresh
              </button>
            </div>

            <div className="weather-stats">
              <WeatherStat icon={<Thermometer size={18} />} value={temperature != null ? `${Math.round(temperature)}°C` : "--"} label="Temperature" />
              <WeatherStat icon={<Droplets size={18} />} value={humidity != null ? `${Math.round(humidity)}%` : "--"} label="Humidity" />
              <WeatherStat icon={<Wind size={18} />} value={wind != null ? `${Math.round(wind)} km/h` : "--"} label="Wind" />
              <WeatherStat icon={<CloudRain size={18} />} value={rain != null ? `${Math.round(rain)} mm` : "--"} label="Rain today" />
            </div>
          </article>
        </section>

        <section className="today-care-panel">
          <div className="panel-heading">
            <div className="heading-with-icon">
              <div className="section-icon leaf-section-icon"><Leaf size={25} /></div>
              <div>
                <h2>Today's Care</h2>
                <p>{attentionPlants.length} plant{attentionPlants.length === 1 ? "" : "s"} need your attention</p>
              </div>
            </div>
            <button type="button" className="text-action" onClick={() => document.querySelector(".my-plants-panel")?.scrollIntoView({ behavior: "smooth" })}>
              View All Plants <ArrowRight size={17} />
            </button>
          </div>

          {attentionPlants.length === 0 ? (
            <div className="care-empty-card">
              <Leaf size={22} />
              <div>
                <strong>No urgent care needed</strong>
                <p>Your plants are looking good right now.</p>
              </div>
            </div>
          ) : (
            <div className="care-card-grid">
              {attentionPlants.map(({ plant, recommendation }) => (
                <CareCard
                  key={plant.id}
                  plant={plant}
                  recommendation={recommendation}
                  onWater={() => onStartWatering(plant)}
                  onCare={() => onOpenPlantCare ? onOpenPlantCare(plant) : onSelectPlant(plant)}
                  onView={() => onSelectPlant(plant)}
                />
              ))}
            </div>
          )}
        </section>
        {weatherAlerts.length > 0 && (
          <section className="weather-alerts-section">
            <div className="panel-heading">
              <div className="heading-with-icon">
                <div className="section-icon weather-alert-icon">
                  <CloudRain size={25} />
                </div>
                <div>
                  <h2>Weather Alerts</h2>
                  <p>Conditions that may affect your plants today</p>
                </div>
              </div>
            </div>

            <div className="weather-alert-grid">
              {weatherAlerts.map((alert, index) => (
                <article
                  className={`weather-alert-card weather-alert-${alert.type}`}
                  key={`${alert.type}-${index}`}
                >
                  <div className="weather-alert-symbol">
                    {alert.icon}
                  </div>

                  <div className="weather-alert-content">
                    <strong>{alert.title}</strong>
                    <p>{alert.message}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
        
        <section className="bottom-grid">
          <article className="my-plants-panel">
            <div className="panel-heading compact-heading">
              <div className="heading-with-icon">
                <div className="section-icon plant-section-icon"><Sprout size={24} /></div>
                <div>
                  <h2>My Plants</h2>
                  <p>{plants?.length || 0} plants in your collection</p>
                </div>
              </div>
              <button type="button" className="add-button" onClick={onAddPlant}>
                <Plus size={17} />
                Add Plant
              </button>
            </div>

           {plants?.length ? (
  <div className="mini-plants-row">
    {plants.map((plant) => (
      <MiniPlantCard
        key={plant.id}
        plant={plant}
        onClick={() => onSelectPlant(plant)}
      />
    ))}
  </div>
) : (
  <div className="empty-plant-state">
    <div className="empty-plant-icon">
      <Sprout size={28} />
    </div>

    <div className="empty-plant-content">
      <strong>Let's get your garden started</strong>

      <p>
        Add your first plant to begin using PlantPulse.
        You can then place it in your space and receive
        personalized care recommendations.
      </p>

      <span>
        Add at least one plant to get started.
      </span>
    </div>

    
  </div>
)}
          </article>

          <article className="my-space-panel">
            <div className="panel-heading compact-heading">
              <div className="heading-with-icon">
                <div className="section-icon home-section-icon"><House size={23} /></div>
                <div>
                  <h2>My Space</h2>
                  <p>See and manage where your plants are placed</p>
                </div>
              </div>
            </div>

            <button type="button" className="space-preview" onClick={onOpenMySpace}>
              <div className="space-photo">
                <img src="/plants/money-plant.png" alt="Plant in your garden space" />
              </div>
              <div>
                <strong>{plantData?.space?.name || "Home Garden"}</strong>
                <span>{plants?.length || 0} plants</span>
              </div>
              <ArrowRight size={20} />
            </button>

            
          </article>
        </section>

        <footer className="dashboard-footer">
          <span><Leaf size={15} /> Rooted in care. Growing together.</span>
          <span>PlantPulse v1.0.0 &nbsp;|&nbsp; Made for a greener world.</span>
        </footer>
      </div>

      {showLocationPopup && (
        <div className="location-modal-overlay">
          <div className="location-modal">
            <button
              type="button"
              className="location-modal-close"
              onClick={() => setShowLocationPopup(false)}
            >
              ×
            </button>
            <div className="location-modal-icon"><MapPin size={27} /></div>
            <h2>Use your current location?</h2>
            <p>
              PlantPulse can use your location to understand today's weather
              and improve your plant-care recommendations.
            </p>
            {locationMessage && <div className="location-modal-message">{locationMessage}</div>}
            <div className="location-modal-actions">
              <button type="button" className="location-not-now" onClick={() => setShowLocationPopup(false)}>
                Not Now
              </button>
              <button type="button" className="location-yes-button" onClick={fetchCurrentLocation} disabled={locationLoading}>
                <MapPin size={16} />
                {locationLoading ? "Finding..." : "Yes, Fetch Location"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CareCard({ plant, recommendation, onWater, onCare, onView }) {
  const action = recommendation?.action
  const isWater = action === "water"
const isCheck = action === "check-soil"
const isProtect = action === "protect"
const needsFirstWater = isCheck && recommendation?.daysSinceWatering === null

  const badge = isWater
    ? "WATER"
    : isCheck
      ? "CHECK SOIL"
      : isProtect
        ? "PROTECT"
        : "CARE"

  const image = getPlantImage(plant.name)

  return (
    <article className={`care-card ${isWater ? "care-water" : isCheck ? "care-check" : isProtect ? "care-protect" : ""}`}>
      <div className="care-image-wrap">
        <img src={image} alt={plant.name} onError={(event) => { event.currentTarget.style.display = "none" }} />
        <div className="care-image-fallback"><Leaf size={28} /></div>
      </div>

      <div className="care-card-body">
        <span className="care-badge">
          {isWater ? <Droplets size={13} /> : isProtect ? <Shield size={13} /> : <Leaf size={13} />}
          {badge}
        </span>

        <button type="button" className="care-title-button" onClick={onView}>
          <strong>{plant.name}</strong>
        </button>

        <span className="care-location">
          {plant.space_name || "My Space"} {plant.spot ? `• ${formatSpot(plant.spot)}` : ""}
        </span>

        <p>{recommendation?.message || "Check your plant and follow today's care guidance."}</p>

        {recommendation?.suggestedAmount && (isWater || isCheck) && (
          <strong className="care-amount">
            ~ {waterMl(recommendation)} ml
          </strong>
        )}

        <button
  type="button"
  className="care-action-button"
  onClick={isWater || needsFirstWater ? onWater : onCare}
>
  {isWater || needsFirstWater ? "💧 Water Now" : "View Care"} <ArrowRight size={15} />
</button>
      </div>
    </article>
  )
}

function MiniPlantCard({ plant, onClick }) {
  return (
    <button type="button" className="mini-plant-card" onClick={onClick}>
      <div className="mini-plant-image">
        <img
          src={getPlantImage(plant.name)}
          alt={plant.name}
          onError={(event) => { event.currentTarget.style.display = "none" }}
        />
        <Leaf size={22} />
      </div>
      <strong>{plant.name}</strong>
      <span>{plant.space_name || "My Space"}</span>
    </button>
  )
}

function WeatherStat({ icon, value, label }) {
  return (
    <div className="weather-stat">
      <span className="weather-stat-icon">{icon}</span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </div>
  )
}

function WeatherIcon({ rain }) {
  return rain > 0 ? <CloudRain size={44} /> : <Sun size={44} />
}

function getPlantImage(name = "") {
  const key = name.trim().toLowerCase()
  return PLANT_IMAGES[key] || "/plants/money-plant.png"
}

function waterMl(recommendation) {
  if (recommendation.waterMl) return recommendation.waterMl
  const map = { sip: 120, drink: 250, "deep-drink": 400, soaked: 500 }
  return map[recommendation.suggestedAmount] || 250
}

function formatSpot(value) {
  const labels = {
    sunny: "Sunny Side",
    partial: "Partial Shade",
    shade: "Shaded Corner"
  }
  return labels[value] || value || "My Space"
}

function getTemperatureDescription(temperature) {
  if (temperature < 15) return "Cool"
  if (temperature < 25) return "Mild"
  if (temperature < 32) return "Warm"
  if (temperature < 38) return "Hot"
  return "Very hot"
}

function getPartOfDay() {
  const hour = new Date().getHours()
  if (hour < 12) return "morning"
  if (hour < 17) return "afternoon"
  return "evening"
}

export default PlantDashboard
