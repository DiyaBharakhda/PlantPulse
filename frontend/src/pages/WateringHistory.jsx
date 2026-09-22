import { useState } from "react"

import {
  Droplets,
  CalendarDays
} from "lucide-react"

import "./WateringHistory.css"

function WateringHistory({ plantData, onContinue }) {

  const [wateringAmount, setWateringAmount] = useState("")
  const [wateringDate, setWateringDate] = useState(
    new Date().toISOString().split("T")[0]
  )

  const amounts = [
    {
      id: "sip",
      name: "Sip",
      description: "A small amount"
    },
    {
      id: "drink",
      name: "Good Drink",
      description: "Watered normally"
    },
    {
      id: "deep-drink",
      name: "Deep Drink",
      description: "Watered thoroughly"
    },
    {
      id: "soaked",
      name: "Soaked",
      description: "Very thoroughly watered"
    }
  ]


  const handleContinue = () => {

    if (!wateringAmount || !wateringDate) {
      return
    }

    onContinue({
      amount: wateringAmount,
      date: wateringDate
    })
  }


  return (

    <div className="watering-page">

      <div className="watering-content">

        <p className="watering-eyebrow">
          WATERING HISTORY
        </p>

        <h1>
          When did you last water{" "}
          {plantData?.plant?.name || "your plant"}?
        </h1>

        <p className="watering-description">
          This gives PlantPulse a starting point for understanding
          your plant's watering pattern.
        </p>


        {/* DATE */}

        <section className="watering-section">

          <div className="watering-heading">

            <div className="watering-icon">
              <CalendarDays size={22} />
            </div>

            <div>
              <h2>
                When was it watered?
              </h2>

              <p>
                Select the most recent watering date.
              </p>
            </div>

          </div>


          <input
  className="watering-date"
  type="date"
  value={wateringDate}
  min="2020-01-01"
  max={new Date().toISOString().split("T")[0]}
  onChange={(e) => setWateringDate(e.target.value)}
/>

        </section>


        {/* AMOUNT */}

        <section className="watering-section">

          <div className="watering-heading">

            <div className="watering-icon">
              <Droplets size={22} />
            </div>

            <div>
              <h2>
                How much did you water?
              </h2>

              <p>
                Choose the closest description.
              </p>
            </div>

          </div>


          <div className="watering-options">

            {amounts.map((amount) => (

              <button
                key={amount.id}
                className={`watering-option ${
                  wateringAmount === amount.id
                    ? "selected"
                    : ""
                }`}
                onClick={() => setWateringAmount(amount.id)}
              >

                <strong>
                  {amount.name}
                </strong>

                <span>
                  {amount.description}
                </span>

              </button>

            ))}

          </div>

        </section>


        {/* SUMMARY */}

        {wateringAmount && (

          <div className="watering-summary">

            <Droplets size={20} />

            <div>

              <strong>
                Watering recorded
              </strong>

              <span>
                {formatAmount(wateringAmount)} on{" "}
                {formatDate(wateringDate)}
              </span>

            </div>

          </div>

        )}


        <button
          className="watering-continue-button"
          disabled={!wateringAmount || !wateringDate}
          onClick={handleContinue}
        >
          Continue
        </button>

      </div>

    </div>

  )
}


function formatAmount(amount) {

  const labels = {
    sip: "a Sip",
    drink: "a Good Drink",
    "deep-drink": "a Deep Drink",
    soaked: "Soaked"
  }

  return labels[amount] || amount
}


function formatDate(date) {

  if (!date) {
    return ""
  }

  const [year, month, day] = date.split("-")

  return `${day}/${month}/${year}`
}


export default WateringHistory