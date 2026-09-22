import { useState } from "react"

import {
  Sprout,
  Ruler,
  Droplets,
  
  CloudRain
} from "lucide-react"

import "./PlantDetails.css"



 function PlantDetails({ plant, onContinue, onBack }) {

const [age, setAge] = useState(plant?.age || "")
const [potSize, setPotSize] = useState(plant?.potSize || "")
const [potMaterial, setPotMaterial] = useState(plant?.potMaterial || "")
const [drainage, setDrainage] = useState(plant?.drainage || "")



  const handleContinue = () => {

    if (
      !age ||
      !potSize ||
      !potMaterial ||
      !drainage 
     
      
    ) {
      return
    }

    onContinue({
      plant,
      age,
      potSize,
      potMaterial,
      drainage
     
     
    })
  }


  return (

    <div className="details-page">

      <div className="details-content">
        <button
  type="button"
  className="plant-details-back"
  onClick={onBack}
>
  ← Back
</button>

        <p className="details-eyebrow">
          TELL US ABOUT YOUR PLANT
        </p>

        <div className="details-title">

          <div className="details-plant-icon">
            <Sprout size={30} />
          </div>

          <div>
            <h1>
              {plant?.name || "Your Plant"}
            </h1>

            <p>
              A few details help PlantPulse personalize its care.
            </p>
          </div>

        </div>


        {/* AGE */}

        <section className="details-section">

          <div className="section-heading">
            <Sprout size={20} />

            <div>
              <h2>How old is your plant?</h2>
              <p>This helps us understand its care stage.</p>
            </div>
          </div>

          <div className="choice-grid three">

            {[
              ["new", "New", "Recently planted"],
              ["young", "Young", "Still growing"],
              ["mature", "Mature", "Well established"]
            ].map(([id, title, description]) => (

              <button
                key={id}
                className={`choice-card ${
                  age === id ? "selected" : ""
                }`}
                onClick={() => setAge(id)}
              >
                <strong>{title}</strong>
                <span>{description}</span>
              </button>

            ))}

          </div>

        </section>


        {/* POT SIZE */}

        <section className="details-section">

          <div className="section-heading">
            <Ruler size={20} />

            <div>
              <h2>What size is the pot?</h2>
              <p>Choose the closest everyday size.</p>
            </div>
          </div>

          <div className="choice-grid four">

            {[
              ["handheld", "Handheld"],
              ["tabletop", "Tabletop"],
              ["floor-pot", "Floor Pot"],
              ["large-planter", "Large Planter"]
            ].map(([id, title]) => (

              <button
                key={id}
                className={`choice-card ${
                  potSize === id ? "selected" : ""
                }`}
                onClick={() => setPotSize(id)}
              >
                <strong>{title}</strong>
              </button>

            ))}

          </div>

        </section>


        {/* POT MATERIAL */}

        <section className="details-section">

          <div className="section-heading">
            <Sprout size={20} />

            <div>
              <h2>What is the pot made of?</h2>
              <p>Different materials hold moisture differently.</p>
            </div>
          </div>

          <div className="choice-grid four">

            {[
              ["plastic", "Plastic"],
              ["terracotta", "Terracotta"],
              ["ceramic", "Ceramic"],
              ["other", "Other"]
            ].map(([id, title]) => (

              <button
                key={id}
                className={`choice-card ${
                  potMaterial === id ? "selected" : ""
                }`}
                onClick={() => setPotMaterial(id)}
              >
                <strong>{title}</strong>
              </button>

            ))}

          </div>

        </section>


        {/* DRAINAGE */}

        <section className="details-section">

          <div className="section-heading">
            <Droplets size={20} />

            <div>
              <h2>Does the pot have drainage?</h2>
              <p>Drainage is important when deciding how to water.</p>
            </div>
          </div>

          <div className="choice-grid two">

            {[
              ["yes", "Yes", "Water can drain from the bottom"],
              ["no", "No", "There is no drainage hole"]
            ].map(([id, title, description]) => (

              <button
                key={id}
                className={`choice-card ${
                  drainage === id ? "selected" : ""
                }`}
                onClick={() => setDrainage(id)}
              >
                <strong>{title}</strong>
                <span>{description}</span>
              </button>

            ))}

          </div>

        </section>


        {/* SUNLIGHT */}

        <section className="details-section">

          <div className="section-heading">
           

            
          </div>

         

        </section>


  

        


        <button
          className="details-continue-button"
          onClick={handleContinue}
          disabled={
            !age ||
            !potSize ||
            !potMaterial ||
            !drainage 
            
           
          }
        >
          Continue
        </button>

      </div>

    </div>

  )
}

export default PlantDetails