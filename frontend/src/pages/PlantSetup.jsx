import { useState } from "react"

import {
  Search,
  Leaf
} from "lucide-react"

import "./PlantSetup.css"
function PlantSetup({ onContinue, onBackToDashboard }) {

  const [search, setSearch] = useState("")
  const [selectedPlant, setSelectedPlant] = useState(null)
  const [customPlantName, setCustomPlantName] = useState("")

const plants = [

  // Indoor Plants
  {
    id: "money-plant",
    name: "Money Plant",
    scientificName: "Epipremnum aureum",
    category: "Indoor"
  },
  {
    id: "snake-plant",
    name: "Snake Plant",
    scientificName: "Dracaena trifasciata",
    category: "Indoor"
  },
  {
    id: "peace-lily",
    name: "Peace Lily",
    scientificName: "Spathiphyllum",
    category: "Indoor"
  },
  {
    id: "spider-plant",
    name: "Spider Plant",
    scientificName: "Chlorophytum comosum",
    category: "Indoor"
  },
  {
    id: "zz-plant",
    name: "ZZ Plant",
    scientificName: "Zamioculcas zamiifolia",
    category: "Indoor"
  },
  {
    id: "rubber-plant",
    name: "Rubber Plant",
    scientificName: "Ficus elastica",
    category: "Indoor"
  },
  {
    id: "areca-palm",
    name: "Areca Palm",
    scientificName: "Dypsis lutescens",
    category: "Indoor"
  },
  {
    id: "lucky-bamboo",
    name: "Lucky Bamboo",
    scientificName: "Dracaena sanderiana",
    category: "Indoor"
  },
  {
    id: "jade-plant",
    name: "Jade Plant",
    scientificName: "Crassula ovata",
    category: "Indoor"
  },
  {
    id: "aloe-vera",
    name: "Aloe Vera",
    scientificName: "Aloe barbadensis",
    category: "Indoor"
  },

  // Everyday Indian Plants
  {
    id: "tulsi",
    name: "Tulsi",
    scientificName: "Ocimum tenuiflorum",
    category: "Everyday"
  },
  {
    id: "curry-leaf",
    name: "Curry Leaf",
    scientificName: "Murraya koenigii",
    category: "Everyday"
  },
  {
    id: "mint",
    name: "Mint",
    scientificName: "Mentha",
    category: "Herbs"
  },
  {
    id: "coriander",
    name: "Coriander",
    scientificName: "Coriandrum sativum",
    category: "Herbs"
  },
  {
    id: "lemongrass",
    name: "Lemongrass",
    scientificName: "Cymbopogon",
    category: "Herbs"
  },
  {
    id: "green-chilli",
    name: "Green Chilli",
    scientificName: "Capsicum annuum",
    category: "Edible"
  },

  // Flowering Plants
  {
    id: "rose",
    name: "Rose",
    scientificName: "Rosa",
    category: "Flowering"
  },
  {
    id: "hibiscus",
    name: "Hibiscus",
    scientificName: "Hibiscus rosa-sinensis",
    category: "Flowering"
  },
  {
    id: "jasmine",
    name: "Jasmine",
    scientificName: "Jasminum",
    category: "Flowering"
  },
  {
    id: "marigold",
    name: "Marigold",
    scientificName: "Tagetes",
    category: "Flowering"
  },
  {
    id: "bougainvillea",
    name: "Bougainvillea",
    scientificName: "Bougainvillea",
    category: "Flowering"
  },
  {
    id: "chrysanthemum",
    name: "Chrysanthemum",
    scientificName: "Chrysanthemum",
    category: "Flowering"
  },
  {
    id: "periwinkle",
    name: "Periwinkle",
    scientificName: "Catharanthus roseus",
    category: "Flowering"
  },

  // Herbs & Kitchen Plants
  {
    id: "basil",
    name: "Basil",
    scientificName: "Ocimum basilicum",
    category: "Herbs"
  },
  {
    id: "rosemary",
    name: "Rosemary",
    scientificName: "Salvia rosmarinus",
    category: "Herbs"
  },
  {
    id: "thyme",
    name: "Thyme",
    scientificName: "Thymus",
    category: "Herbs"
  },
  {
    id: "oregano",
    name: "Oregano",
    scientificName: "Origanum",
    category: "Herbs"
  },

  // Edible Plants
  {
    id: "tomato",
    name: "Tomato",
    scientificName: "Solanum lycopersicum",
    category: "Edible"
  },
  {
    id: "brinjal",
    name: "Brinjal",
    scientificName: "Solanum melongena",
    category: "Edible"
  },
  {
    id: "lemon",
    name: "Lemon",
    scientificName: "Citrus limon",
    category: "Edible"
  },
  {
    id: "strawberry",
    name: "Strawberry",
    scientificName: "Fragaria × ananassa",
    category: "Edible"
  },
  {
    id: "guava",
    name: "Guava",
    scientificName: "Psidium guajava",
    category: "Edible"
  },

  // Outdoor / Larger Plants
  {
    id: "croton",
    name: "Croton",
    scientificName: "Codiaeum variegatum",
    category: "Outdoor"
  },
  {
    id: "bird-of-paradise",
    name: "Bird of Paradise",
    scientificName: "Strelitzia reginae",
    category: "Outdoor"
  },
  {
    id: "plumeria",
    name: "Plumeria",
    scientificName: "Plumeria",
    category: "Outdoor"
  },
  {
    id: "banana",
    name: "Banana Plant",
    scientificName: "Musa",
    category: "Outdoor"
  },
  {
  id: "other",
  name: "Other — Enter plant name",
  scientificName: "",
  category: "Other"
}
]

const filteredPlants = plants.filter((plant) =>
  `${plant.name} ${plant.scientificName} ${plant.category}`
    .toLowerCase()
    .includes(search.toLowerCase())
)

const visiblePlants =
  search.trim() === ""
    ? filteredPlants.slice(0, 15)
    : filteredPlants
  const handleContinue = () => {

    if (!selectedPlant) {
      return
    }

    onContinue(selectedPlant)
  }

  return (

    <div className="plant-page">

      <div className="plant-content">
        <button
  type="button"
  className="plant-setup-back"
  onClick={onBackToDashboard}
>
  ← Back to Dashboard
</button>

        <p className="plant-eyebrow">
          ADD YOUR FIRST PLANT
        </p>

        <h1>
          What are you growing?
        </h1>

        <p className="plant-description">
          Tell PlantPulse which plant you want to care for.
          We'll use its needs to personalize your recommendations.
        </p>


        <div className="plant-search">

          <Search size={20} />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for a plant..."
          />

        </div>


        <div className="plant-grid">

          {visiblePlants.map((plant) => (

            <button
              key={plant.id}
              className={`plant-option ${
                selectedPlant?.id === plant.id
                  ? "selected"
                  : ""
              }`}
              onClick={() => setSelectedPlant(plant)}
            >

              <div className="plant-icon">
                <Leaf size={26} />
              </div>

              <div className="plant-info">

                <strong>
                  {plant.name}
                </strong>

                <span>
                  {plant.scientificName}
                </span>

              </div>

            </button>

          ))}

        </div>


        {filteredPlants.length === 0 && search.trim() !== "" && (
  <button
    type="button"
    className="plant-option custom-plant-option"
    onClick={() => {
      const name = search.trim()

      setSelectedPlant({
        id: `custom-${Date.now()}`,
        name: name,
        scientificName: "",
        category: "Other"
      })
    }}
  >
    <div className="plant-icon">
      <Leaf size={26} />
    </div>

    <div className="plant-info">
      <strong>Add "{search.trim()}"</strong>
      
    </div>
  </button>
)}


        {selectedPlant && (

          <div className="selected-plant">

            <Leaf size={20} />

            <div>

              <strong>
                {selectedPlant.name}
              </strong>

              <span>
                Plant selected
              </span>

            </div>

          </div>

        )}
{selectedPlant?.id === "other" && (
  <div className="custom-plant-input">
    <label htmlFor="customPlantName">
      Enter your plant name
    </label>

    <input
      id="customPlantName"
      type="text"
      value={customPlantName}
      onChange={(e) => setCustomPlantName(e.target.value)}
      placeholder="e.g. Monstera, Lavender, Ficus..."
    />
  </div>
)}

        <button
  type="button"
  className="plant-continue-button"
  disabled={
    !selectedPlant ||
    (selectedPlant.id === "other" && !customPlantName.trim())
  }
  onClick={() => {
    if (!selectedPlant) return

    if (
      selectedPlant.id === "other" &&
      !customPlantName.trim()
    ) {
      return
    }

    if (selectedPlant.id === "other") {
      const customPlant = {
        id: `custom-${Date.now()}`,
        name: customPlantName.trim(),
        scientificName: "",
        category: "Other"
      }

      onContinue(customPlant)
      return
    }

    onContinue(selectedPlant)
  }}
>
  Continue
</button>

      </div>

    </div>

  )
}

export default PlantSetup