import { useEffect, useState } from "react"

import Logo from "./components/Logo"
import LocationSetup from "./pages/LocationSetup"
import SpaceSetup from "./pages/SpaceSetup"
import PlantSetup from "./pages/PlantSetup"
import PlantDetails from "./pages/PlantDetails"
import PlantDashboard from "./pages/PlantDashboard"
import WateringHistory from "./pages/WateringHistory"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import MySpace from "./pages/MySpace"
import PlantLibrary from "./pages/PlantLibrary"
import PlantView from "./pages/PlantView"
import PlantCare from "./pages/PlantCare"
import "./PlantPulseTheme.css"
import "./App.css"

function App() {
const [screen, setScreen] = useState(() => {
  return localStorage.getItem("plantpulse_user") ? "dashboard" : "welcome"
})
const [selectedPlant, setSelectedPlant] = useState(null)
const [plants, setPlants] = useState([])
const [plantData, setPlantData] = useState(null)
const [location, setLocation] = useState(null)
const [space, setSpace] = useState(null)
const [spaces, setSpaces] = useState([])
const [currentUser, setCurrentUser] = useState(() => {
  const savedUser = localStorage.getItem("plantpulse_user")
  return savedUser ? JSON.parse(savedUser) : null
})
useEffect(() => {
  if (currentUser) {
    localStorage.setItem("plantpulse_user", JSON.stringify(currentUser))
  }
}, [currentUser])

useEffect(() => {
  if (!currentUser?.id) return

  const loadPlants = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/plants/${currentUser.id}`
      )

      const data = await response.json()

      if (response.ok) {
        setPlants(data.plants || [])
        if (data.plants && data.plants.length > 0) {
  const firstPlant = data.plants[0]
  if (firstPlant.location) {
  setLocation(firstPlant.location)
}

  setSelectedPlant({
    id: firstPlant.id,
    name: firstPlant.name,
    scientificName: firstPlant.scientific_name
  })

  setPlantData({
    plant: {
      id: firstPlant.id,
      name: firstPlant.name,
      scientificName: firstPlant.scientific_name

    },
    details: {
      age: firstPlant.age,
      potSize: firstPlant.pot_size,
      potMaterial: firstPlant.pot_material,
      drainage: firstPlant.drainage,
      sunlight: firstPlant.sunlight,
      rainExposure: firstPlant.rain_exposure
    },
    spot: firstPlant.spot
      ? { name: firstPlant.spot }
      : null,
    watering: firstPlant.watering,
    location: firstPlant.location || null,
  })
}
        console.log("Loaded plants:", data.plants)
      }
    } catch (error) {
      console.error("Failed to load plants:", error)
    }
  }

  loadPlants()
}, [currentUser])
useEffect(() => {
  if (!currentUser?.id) return

  const loadSpaces = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/spaces/${currentUser.id}`
      )

      const data = await response.json()

      console.log("Loaded spaces:", data)

      if (!response.ok) {
        console.error("Failed to load spaces:", data)
        return
      }

      setSpaces(data)
    } catch (error) {
      console.error("Failed to load spaces:", error)
    }
  }

  loadSpaces()
}, [currentUser])
  
// LOGIN SCREEN
if (screen === "login") {
  return (
    <Login
      onLogin={async (user) => {
  console.log("Logged in user:", user)
  setCurrentUser(user)

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/plants/${user.id}`
    )

    const data = await response.json()

    if (response.ok && data.plants && data.plants.length > 0) {
      setScreen("dashboard")
    } else {
      setScreen("location")
    }
  } catch (error) {
    console.error("Failed to check existing plants:", error)
    setScreen("location")
  }
}}
      onGoToSignup={() => {
        setScreen("signup")
      }}
    />
  )
}

// SIGN UP SCREEN
if (screen === "signup") {
  return (
    <Signup
      onSignup={(user) => {
  console.log("Sign up:", user)
  setCurrentUser(user)
  setScreen("location")
}}
      onGoToLogin={() => {
        setScreen("login")
      }}
    />
  )
} 

  // LOCATION SCREEN
 if (screen === "location") {
  return (
    <LocationSetup
      onContinue={async (location) => {
        console.log("Selected location:", location)

        setLocation(location)

        try {
          const response = await fetch(
            "http://127.0.0.1:8000/api/locations",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                user_id: currentUser.id,
                name: location.name,
                latitude: location.latitude,
                longitude: location.longitude
              })
            }
          )

          const data = await response.json()

if (!response.ok) {
  console.error("Location save failed:", data)
} else {
  console.log("Location saved:", data)

  setLocation({
    ...location,
    id: data.location_id
  })
}

        } catch (error) {
          console.error("Location save failed:", error)
        }

        setScreen("dashboard")
      }}
    />
  )
}


// SPACE SCREEN
if (screen === "spaces") {
  return (
    <SpaceSetup
      onContinue={async (selectedSpace) => {
        console.log("Selected space:", selectedSpace)

        setSpace(selectedSpace)

        try {
          const response = await fetch(
            "http://127.0.0.1:8000/api/spaces",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                user_id: currentUser.id,
                location_id: location.id,
                name: selectedSpace.name
              })
            }
          )

          const data = await response.json()

          if (!response.ok) {
  console.error("Space save failed:", data)
} else {
  console.log("Space saved:", data)

  setSpace({
    ...selectedSpace,
    id: data.space_id
  })
}
        } catch (error) {
          console.error("Space save failed:", error)
        }

        setScreen("choose-space")
      }}
    />
  )
}



// CHOOSE SPACE SCREEN
if (screen === "choose-space") {
  const spaceOptions = [
    "Balcony",
    "Bedroom",
    "Terrace",
    "Garden"
    
  ]

  return (
    <div className="plant-page">
     <div className="plant-content">

  <button
    type="button"
    className="space-setup-back"
    onClick={() => {
      setScreen("plant-details")
    }}
  >
    ← Back
  </button>

  <p className="plant-eyebrow">
    CHOOSE A SPACE
  </p>

        <h1>
          Where does this plant live?
        </h1>

        <p className="plant-description">
          Select the space where you actually keep this plant.
        </p>

        <div className="plant-grid">

          {spaceOptions.map((spaceName) => {

            const existingSpace = spaces.find(
              (item) =>
                item.name.toLowerCase() ===
                spaceName.toLowerCase()
            )

            const isSelected =
              space?.name?.toLowerCase() ===
              spaceName.toLowerCase()

            return (
              <button
                key={spaceName}
                type="button"
                className={`plant-option ${
                  isSelected ? "selected" : ""
                }`}
                onClick={() => {

                  if (existingSpace) {
                    setSpace(existingSpace)
                  } else {
                    setSpace({
                      id: null,
                      name: spaceName
                    })
                  }

                }}
              >
                <div className="plant-info">

                  <strong>
                    {spaceName}
                  </strong>

                  <span>
                    Plant location
                  </span>

                </div>
              </button>
            )
          })}

        </div>

        <button
          type="button"
          className="plant-continue-button"
          disabled={!space}
          onClick={async () => {
  console.log("=== CHOOSE SPACE CONTINUE ===")
  console.log("Current user:", currentUser)
  console.log("Selected plant:", selectedPlant)
  console.log("Plant data:", plantData)
  console.log("Selected space:", space)

  if (!currentUser?.id) {
    alert("User information is missing. Please log in again.")
    return
  }

  if (!selectedPlant) {
    alert("Please select a plant first.")
    return
  }

  if (!plantData?.details) {
    alert("Plant details are missing.")
    return
  }

  if (!space) {
    alert("Please select a space.")
    return
  }

  try {
    let selectedSpace = space

    /*
     * If this space does not exist in the database yet,
     * create it first.
     */
    if (!selectedSpace.id) {
      if (!location?.id) {
        alert("Location information is missing. Please select your location again.")
        return
      }

      const spaceResponse = await fetch(
        "http://127.0.0.1:8000/api/spaces",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            user_id: currentUser.id,
            location_id: location.id,
            name: selectedSpace.name
          })
        }
      )

      const spaceData = await spaceResponse.json()

      console.log("Space API response:", spaceResponse.status, spaceData)

      if (!spaceResponse.ok) {
        alert(
          `Could not create space.\n\n${
            spaceData.detail || "Server error"
          }`
        )
        return
      }

      selectedSpace = {
        ...selectedSpace,
        id: spaceData.space_id
      }

      setSpace(selectedSpace)

      setSpaces((currentSpaces) => [
        ...currentSpaces,
        selectedSpace
      ])
    }

    /*
     * Save the plant.
     */
    const plantResponse = await fetch(
      "http://127.0.0.1:8000/api/plants",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: currentUser.id,
          space_id: selectedSpace.id,
          name: selectedPlant.name,
          scientific_name: selectedPlant.scientificName
        })
      }
    )

    const plantResult = await plantResponse.json()

    console.log(
      "Plant API response:",
      plantResponse.status,
      plantResult
    )

    if (!plantResponse.ok) {
      alert(
        `Could not save plant.\n\n${
          plantResult.detail || "Server error"
        }`
      )
      return
    }

    /*
     * Save plant details.
     */
    const detailsResponse = await fetch(
      `http://127.0.0.1:8000/api/plants/${plantResult.plant_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: currentUser.id,
          age: plantData.details.age,
          pot_size: plantData.details.potSize,
          pot_material: plantData.details.potMaterial,
          drainage: plantData.details.drainage,
          sunlight: plantData.details.sunlight,
          rain_exposure: plantData.details.rainExposure,
          spot: null
        })
      }
    )

    const detailsResult = await detailsResponse.json()

    console.log(
      "Plant details response:",
      detailsResponse.status,
      detailsResult
    )

    if (!detailsResponse.ok) {
      alert(
        `Could not save plant details.\n\n${
          detailsResult.detail || "Server error"
        }`
      )
      return
    }

    /*
     * Build the plant exactly as the dashboard expects.
     */
    const savedPlant = {
      ...selectedPlant,
      id: plantResult.plant_id,
      age: plantData.details.age,
      pot_size: plantData.details.potSize,
      pot_material: plantData.details.potMaterial,
      drainage: plantData.details.drainage,
      sunlight: plantData.details.sunlight,
      rain_exposure: plantData.details.rainExposure,
      space_id: selectedSpace.id,
      space_name: selectedSpace.name,
      spot: null
    }

    setPlants((currentPlants) => [
      ...currentPlants,
      savedPlant
    ])

    setSelectedPlant(savedPlant)

    setPlantData({
      plant: savedPlant,
      details: {
        ...plantData.details,
        rainExposure: plantData.details.rainExposure
      },
      spot: null,
      watering: null,
      location: location,
      space: selectedSpace
    })

    console.log("Plant saved successfully:", savedPlant)

    setScreen("dashboard")

  } catch (error) {
    console.error("Plant save failed:", error)

    alert(
      "Could not connect to the PlantPulse backend. Make sure the backend is running."
    )
  }
}}
        >
          Continue
        </button>

      </div>
    </div>
  )
}
if (screen === "plant") {
  return (
    <PlantSetup
      onBackToDashboard={() => {
        setSelectedPlant(null)
        setPlantData(null)
        setSpace(null)
        setScreen("dashboard")
      }}
      onContinue={async (plant) => {
        console.log("Selected plant:", plant)

        setSelectedPlant(plant)

        // Go to plant details first
        setScreen("plant-details")
      }}
    />
  )
}
if (screen === "plant-details") {
  return (
    <PlantDetails
      plant={{
        ...selectedPlant,
        age: plantData?.details?.age || "",
        potSize: plantData?.details?.potSize || "",
        potMaterial: plantData?.details?.potMaterial || "",
        drainage: plantData?.details?.drainage || "",
        sunlight: plantData?.details?.sunlight || "",
        rainExposure: plantData?.details?.rainExposure || ""
      }}
      onBack={() => {
  setScreen("plant")
}}
      onContinue={(details) => {
        console.log("Plant details:", details)

        setPlantData({
          plant: selectedPlant,
          details: details,
          location: location,
          space: null
        })

        // After details → choose where the plant lives
        setScreen("choose-space")
      }}
    />
  )
}

if (screen === "my-space") {
  return (
    <MySpace
    
      space={space}
      plants={plants}
      onBackToDashboard={() => {
  setScreen("dashboard")
}}
      onSpotChange={(plantId, spot) => {
  setPlants((currentPlants) =>
    currentPlants.map((plant) =>
      plant.id === Number(plantId)
        ? {
            ...plant,
            spot
          }
        : plant
    )
  )

  if (selectedPlant?.id === Number(plantId)) {
    setPlantData((current) => ({
      ...current,
      spot: {
        name: spot
      }
    }))
  }
}}
      onContinue={async (selectedSpots) => {

        try {

          for (const [plantId, spot] of Object.entries(selectedSpots)) {

            const response = await fetch(
              `http://127.0.0.1:8000/api/plants/${plantId}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  user_id: currentUser.id,
                  spot: spot
                })
              }
            )

            const data = await response.json()

            if (!response.ok) {
              console.error(
                `Spot save failed for plant ${plantId}:`,
                data
              )
              continue
            }

            console.log(
              `Spot saved for plant ${plantId}:`,
              spot
            )
          }

          // Update the currently selected plant's spot
          if (
            selectedPlant &&
            selectedSpots[selectedPlant.id]
          ) {
            const newSpot = selectedSpots[selectedPlant.id]

            setPlantData((current) => ({
              ...current,
              spot: {
                name: newSpot
              }
            }))
          }

          setScreen("dashboard")

        } catch (error) {
          console.error("Spot save failed:", error)
        }
      }}
    />
  )
}
if (screen === "plant-library") {
  return (
    <PlantLibrary
      plants={plants}
      onSelectPlant={async (plant) => {

        try {
          const response = await fetch(
            `http://127.0.0.1:8000/api/plants/${currentUser.id}`
          )

          const data = await response.json()

          if (!response.ok) {
            console.error("Failed to load plant details:", data)
            return
          }

          const fullPlant = data.plants.find(
            (item) => item.id === plant.id
          )

          if (!fullPlant) {
            console.error("Plant not found:", plant.id)
            return
          }

          setSelectedPlant({
            id: fullPlant.id,
            name: fullPlant.name,
            scientificName: fullPlant.scientific_name
          })

          setPlantData({
            plant: {
              id: fullPlant.id,
              name: fullPlant.name,
              scientificName: fullPlant.scientific_name
            },

            details: {
              age: fullPlant.age,
              potSize: fullPlant.pot_size,
              potMaterial: fullPlant.pot_material,
              drainage: fullPlant.drainage,
              sunlight: fullPlant.sunlight,
              rainExposure: fullPlant.rain_exposure
            },

            spot: fullPlant.spot
              ? { name: fullPlant.spot }
              : null,

            watering: fullPlant.watering,

            location: location,
            space: space
          })

          setScreen("dashboard")

        } catch (error) {
          console.error("Failed to load selected plant:", error)
        }
      }}

     onAddPlant={() => {
  setSelectedPlant(null)
  setPlantData(null)
  setSpace(null)
  setScreen("plant")
}}
    />
  )
}
if (screen === "plant-care") {
  return (
    <PlantCare
  plantData={plantData}
  onBack={() => {
    setScreen("dashboard")
  }}
      onWater={() => {
        setScreen("watering")
      }}
    />
  )
}
if (screen === "plant-view") {
  return (
    <PlantView
      plantData={plantData}
      weather={null}
      onBack={() => {
        setScreen("dashboard")
      }}
      onWater={() => {
        setScreen("watering")
      }}
      onEditDetails={() => {
  setScreen("plant-details")
}}
    />
  )
}
if (screen === "dashboard") {
  return (
   <PlantDashboard
  plantData={plantData}
  location={location}
  plants={plants}
      onSelectPlant={(plant) => {
  setSelectedPlant(plant)

  setPlantData({
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
    spot: plant.spot
      ? { name: plant.spot }
      : null,
    watering: plant.watering,
    location: plant.location
  })

  setScreen("plant-view")
}}
onOpenPlantCare={(plant) => {
  setSelectedPlant({
    id: plant.id,
    name: plant.name,
    scientificName: plant.scientific_name
  })

  setPlantData({
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
    spot: plant.spot
      ? { name: plant.spot }
      : null,
    watering: plant.watering,
    location: plant.location
  })

  setScreen("plant-care")
}}

      onStartWatering={(plant) => {
  setSelectedPlant({
    id: plant.id,
    name: plant.name,
    scientificName: plant.scientific_name
  })

  setPlantData((current) => ({
    ...current,
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
    spot: plant.spot
      ? { name: plant.spot }
      : null,
    watering: plant.watering
  }))

  setScreen("watering")
}}
onAddPlant={async () => {
  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/spaces/${currentUser.id}`
    )

    const data = await response.json()

    if (!response.ok) {
      console.error("Failed to load spaces:", data)
      return
    }

    console.log("Spaces available for new plant:", data)

    setSpaces(data)
    setSelectedPlant(null)
    setPlantData(null)
    setSpace(null)

    setScreen("plant")
  } catch (error) {
    console.error("Failed to load spaces:", error)
  }
}}

      onOpenMySpace={() => {
        setScreen("my-space")
      }}

      onOpenPlantLibrary={() => {
        setScreen("plant-library")
      }}
    />
  )
}

if (screen === "watering") {
  return (
    <WateringHistory
      plantData={plantData}
      onContinue={async (watering) => {
        console.log("Watering recorded:", watering)

        try {
          const response = await fetch(
            "http://127.0.0.1:8000/api/watering",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                user_id: currentUser.id,
                plant_id: selectedPlant.id,
                amount: watering.amount,
                date: watering.date
              })
            }
          )

          const data = await response.json()

          if (!response.ok) {
            console.error("Watering save failed:", data)
            return
          }

          console.log("Watering saved:", data)

          setPlantData((current) => ({
            ...current,
            watering
          }))

          setPlants((currentPlants) =>
            currentPlants.map((plant) =>
              plant.id === selectedPlant.id
                ? {
                    ...plant,
                    watering
                  }
                : plant
            )
          )

          setScreen("dashboard")

        } catch (error) {
          console.error("Watering save failed:", error)
        }
      }}
    />
  )
}

  // WELCOME SCREEN
  return (
    <main className="app">

      <Logo />

      <section className="welcome">

        <p className="eyebrow">
          YOUR PLANTS. YOUR SPACE. YOUR CARE.
        </p>

        <h1>
          Understand what
          <br />
          your plants need.
        </h1>

        <p className="description">
          PlantPulse helps you understand your plants through
          their environment, weather, and everyday care.
        </p>

        <button onClick={() => setScreen("login")}>
          Get Started
        </button>

      </section>

    </main>
  )
}

export default App