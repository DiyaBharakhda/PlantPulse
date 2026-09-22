import "./PlantLibrary.css"

function PlantLibrary({ plants, onSelectPlant, onAddPlant }) {
  return (
    <div className="plant-library-page">

      <div className="plant-library-content">

        <p className="plant-library-eyebrow">
          YOUR PLANTS
        </p>

        <h1>My Plants</h1>

        <p className="plant-library-description">
          Choose a plant to view its care and environment.
        </p>

        <div className="plant-grid">

          {plants.map((plant) => (
            <button
  type="button"
  key={plant.id}
  className="plant-card"
  onClick={() => {
    console.log("Selected plant:", plant)
    onSelectPlant(plant)
  }}
>
              <div className="plant-card-icon">
                🪴
              </div>

              <div className="plant-card-info">
                <strong>{plant.name}</strong>

                {plant.scientific_name && (
                  <span>{plant.scientific_name}</span>
                )}
              </div>

              <span className="plant-card-arrow">
                →
              </span>
            </button>
          ))}

          <button
            className="add-plant-card"
            onClick={onAddPlant}
          >
            <div className="add-plant-icon">
              +
            </div>

            <strong>Add another plant</strong>

            <span>
              Create a new plant profile
            </span>
          </button>

        </div>

      </div>

    </div>
  )
}

export default PlantLibrary