import { useState } from "react"

import {
  Flower2,
  Home,
  Sofa,
  Bed,
  TreePine,
  Plus
} from "lucide-react"

import "./SpaceSetup.css"

function SpaceSetup({ onContinue }) {

  const [selectedSpace, setSelectedSpace] = useState(null)

  const spaces = [
    { id: "balcony", name: "Balcony", icon: Flower2 },
    { id: "terrace", name: "Terrace", icon: Home },
    { id: "living-room", name: "Living Room", icon: Sofa },
    { id: "bedroom", name: "Bedroom", icon: Bed },
    { id: "garden", name: "Garden", icon: TreePine }
  ]

  const selectSpace = (space) => {
    setSelectedSpace(space)
  }

  const handleContinue = () => {

    if (!selectedSpace) {
      return
    }

    onContinue(selectedSpace)
  }

  return (

    <div className="space-page">

      <div className="space-content">

        <p className="space-eyebrow">
          YOUR PLANT SPACES
        </p>

        <h1>
          Where do your plants live?
        </h1>

        <p className="space-description">
          Choose the space where you keep your plants.
          You can add more spaces later.
        </p>

        <div className="space-grid">

          {spaces.map((space) => {

            const Icon = space.icon

            return (

              <button
                key={space.id}
                className={`space-option ${
                  selectedSpace?.id === space.id
                    ? "selected"
                    : ""
                }`}
                onClick={() => selectSpace(space)}
              >

                <div className="space-icon">
                  <Icon size={28} />
                </div>

                <span>
                  {space.name}
                </span>

              </button>

            )

          })}

          <button
            className={`space-option add-space ${
              selectedSpace?.id === "other"
                ? "selected"
                : ""
            }`}
            onClick={() =>
              selectSpace({
                id: "other",
                name: "Other"
              })
            }
          >

            <div className="space-icon">
              <Plus size={28} />
            </div>

            <span>
              Other
            </span>

          </button>

        </div>

        <button
          className="space-continue-button"
          onClick={handleContinue}
          disabled={!selectedSpace}
        >
          Continue
        </button>

      </div>

    </div>

  )
}

export default SpaceSetup