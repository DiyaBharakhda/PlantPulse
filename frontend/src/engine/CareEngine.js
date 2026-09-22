function getDaysSinceWatering(date) {
  if (!date) {
    return null
  }

  const lastWatered = new Date(date)
  const today = new Date()

  lastWatered.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)

  const difference =
    today.getTime() - lastWatered.getTime()

  return Math.floor(
    difference / (1000 * 60 * 60 * 24)
  )
}


function getPlantWateringProfile(plantName) {
  const profiles = {
    "money plant": {
      dryAfter: 5,
      name: "Money Plant",
      demand: 1.0
    },

    "snake plant": {
      dryAfter: 12,
      name: "Snake Plant",
      demand: 0.45
    },

    "aloe vera": {
      dryAfter: 12,
      name: "Aloe Vera",
      demand: 0.45
    },

    "peace lily": {
      dryAfter: 4,
      name: "Peace Lily",
      demand: 1.15
    },

    "spider plant": {
      dryAfter: 5,
      name: "Spider Plant",
      demand: 1.0
    },

    "areca palm": {
      dryAfter: 4,
      name: "Areca Palm",
      demand: 1.15
    },

    "tulsi": {
      dryAfter: 3,
      name: "Tulsi",
      demand: 1.3
    },

    "curry leaf": {
      dryAfter: 3,
      name: "Curry Leaf",
      demand: 1.25
    },

    "mint": {
      dryAfter: 2.5,
      name: "Mint",
      demand: 1.4
    },

    "coriander": {
      dryAfter: 2,
      name: "Coriander",
      demand: 1.5
    },

    "rose": {
      dryAfter: 4,
      name: "Rose",
      demand: 1.25
    },

    "hibiscus": {
      dryAfter: 3.5,
      name: "Hibiscus",
      demand: 1.3
    },

    "jasmine": {
      dryAfter: 4,
      name: "Jasmine",
      demand: 1.15
    }
  }

  const key = String(plantName || "")
    .trim()
    .toLowerCase()

  return profiles[key] || {
    dryAfter: 5,
    name: plantName || "Your plant",
    demand: 1.0
  }
}


function getWateringRecommendation(plantData, weather) {

  const plant = plantData?.plant
  const details = plantData?.details
  const watering = plantData?.watering
  const spot = plantData?.spot?.name
  const rainExposure =
  spot === "Sunny Side"
    ? "exposed"
    : spot === "Partial Shade"
      ? "partial"
      : spot === "Shaded Corner"
        ? "protected"
        : details.rainExposure
  /*
   * ---------------------------------------------------------
   * BASIC VALIDATION
   * ---------------------------------------------------------
   */

  if (!plant || !details) {
    return {
      status: "setup",
      action: "setup",
      priority: "high",
      title: "Complete your plant profile",
      message:
        "PlantPulse needs your plant details before it can make a care recommendation."
    }
  }


  /*
   * ---------------------------------------------------------
   * EFFECTIVE SUNLIGHT
   *
   * The actual My Space position takes priority over the
   * original sunlight selection.
   * ---------------------------------------------------------
   */

  let effectiveSunlight = details.sunlight

  if (spot === "Shaded Corner") {
    effectiveSunlight = "shade"
  }

  if (spot === "Partial Shade") {
    effectiveSunlight = "partial"
  }

  if (spot === "Sunny Side") {
    effectiveSunlight = "sunny"
  }


  /*
   * ---------------------------------------------------------
   * PLANT PROFILE
   * ---------------------------------------------------------
   */

  const profile = getPlantWateringProfile(plant.name)


  /*
   * ---------------------------------------------------------
   * WATERING HISTORY
   * ---------------------------------------------------------
   */

  const daysSinceWatering =
    watering?.date
      ? getDaysSinceWatering(watering.date)
      : null


  /*
   * ---------------------------------------------------------
   * WEATHER VALUES
   * ---------------------------------------------------------
   */

  const temperature =
    weather?.current?.temperature_2m ?? null

  const humidity =
    weather?.current?.relative_humidity_2m ?? null

  const wind =
    weather?.current?.wind_speed_10m ?? null

  const rainfall =
    weather?.daily?.precipitation_sum?.[0] ?? 0

  const rainProbability =
    weather?.daily?.precipitation_probability_max?.[0] ?? 0


  /*
   * ---------------------------------------------------------
   * WATERING AMOUNT
   *
   * Friendly watering categories are retained, but we also
   * calculate an approximate quantity.
   * ---------------------------------------------------------
   */

  let suggestedAmount = "drink"
  let waterMl = 250

  if (details.potSize === "handheld") {
    suggestedAmount = "sip"
    waterMl = 120
  }

  if (details.potSize === "tabletop") {
    suggestedAmount = "drink"
    waterMl = 250
  }

  if (details.potSize === "floor-pot") {
    suggestedAmount = "drink"
    waterMl = 400
  }

  if (details.potSize === "large-planter") {
    suggestedAmount = "deep-drink"
    waterMl = 700
  }
/*
 * ---------------------------------------------------------
 * DYNAMIC DRYING MODEL
 *
 * Plant type provides the baseline water demand.
 * Weather + placement + pot conditions dynamically
 * change how quickly the soil is expected to dry.
 * ---------------------------------------------------------
 */

let adjustedDryAfter = profile.dryAfter

const reasons = []

/*
 * ---------------------------------------------------------
 * PLANT WATER-DEMAND FACTOR
 * ---------------------------------------------------------
 *
 * Higher-demand plants react more strongly to
 * hot, dry and sunny conditions.
 */

const demand = profile.demand || 1.0


/*
 * ---------------------------------------------------------
 * POT MATERIAL
 * ---------------------------------------------------------
 */

if (details.potMaterial === "terracotta") {
  adjustedDryAfter *= 0.90

  reasons.push(
    "Terracotta can lose moisture faster."
  )
}

if (details.potMaterial === "plastic") {
  adjustedDryAfter *= 1.10

  reasons.push(
    "Plastic tends to retain moisture longer."
  )
}


/*
 * ---------------------------------------------------------
 * POT SIZE
 * ---------------------------------------------------------
 */

if (details.potSize === "handheld") {
  adjustedDryAfter *= 0.85

  reasons.push(
    "The smaller pot can dry faster."
  )
}

if (details.potSize === "tabletop") {
  adjustedDryAfter *= 1.00
}

if (details.potSize === "floor-pot") {
  adjustedDryAfter *= 1.05
}

if (details.potSize === "large-planter") {
  adjustedDryAfter *= 1.15

  reasons.push(
    "The larger planter can retain moisture longer."
  )
}


/*
 * ---------------------------------------------------------
 * SUNLIGHT / ACTUAL POSITION
 * ---------------------------------------------------------
 */

if (effectiveSunlight === "sunny") {
  adjustedDryAfter *= 0.78 + (1 - demand) * 0.08

  reasons.push(
    "Sunny Side increases moisture loss."
  )
}

if (effectiveSunlight === "partial") {
  adjustedDryAfter *= 1.00

  reasons.push(
    "Partial Shade provides moderate drying."
  )
}

if (effectiveSunlight === "shade") {
  adjustedDryAfter *= 1.18

  reasons.push(
    "Shaded Corner slows drying."
  )
}


/*
 * ---------------------------------------------------------
 * TEMPERATURE
 * ---------------------------------------------------------
 */

if (temperature !== null) {

  if (temperature >= 35) {

    const heatMultiplier =
      0.72 + (1 - demand) * 0.18

    adjustedDryAfter *= heatMultiplier

    reasons.push(
      `Very hot weather at ${temperature}°C can dry soil quickly.`
    )

  } else if (temperature >= 30) {

    const heatMultiplier =
      0.85 + (1 - demand) * 0.10

    adjustedDryAfter *= heatMultiplier

    reasons.push(
      `Warm weather at ${temperature}°C increases drying.`
    )

  } else if (temperature >= 25) {

    adjustedDryAfter *= 0.96

  } else if (temperature <= 18) {

    adjustedDryAfter *= 1.15

    reasons.push(
      `Cool weather at ${temperature}°C slows drying.`
    )
  }
}


/*
 * ---------------------------------------------------------
 * HUMIDITY
 * ---------------------------------------------------------
 */

if (humidity !== null) {

  if (humidity < 40) {

    const humidityMultiplier =
      0.72 + (1 - demand) * 0.12

    adjustedDryAfter *= humidityMultiplier

    reasons.push(
      `Air is dry at ${humidity}% humidity.`
    )

  } else if (humidity < 55) {

    const humidityMultiplier =
      0.88 + (1 - demand) * 0.06

    adjustedDryAfter *= humidityMultiplier

    reasons.push(
      `Humidity is relatively low at ${humidity}%.`
    )

  } else if (humidity >= 85) {

    adjustedDryAfter *= 1.18

    reasons.push(
      `Very high humidity at ${humidity}% slows drying.`
    )

  } else if (humidity >= 70) {

    adjustedDryAfter *= 1.10

    reasons.push(
      `High humidity at ${humidity}% slows drying.`
    )
  }
}


/*
 * ---------------------------------------------------------
 * WIND
 * ---------------------------------------------------------
 */

if (wind !== null) {

  if (wind >= 30) {

    adjustedDryAfter *= 0.82

    reasons.push(
      `Strong wind at ${wind} km/h increases moisture loss.`
    )

  } else if (wind >= 20) {

    adjustedDryAfter *= 0.92

    reasons.push(
      `Wind at ${wind} km/h can increase drying.`
    )
  }
}


/*
 * ---------------------------------------------------------
 * RAINFALL
 *
 * Rain affects the drying model only when the plant is
 * actually exposed to rain.
 * ---------------------------------------------------------
 */

if (
  rainExposure === "exposed" &&
  rainfall > 0
) {

  if (rainfall >= 7.5) {

    adjustedDryAfter += 3

    reasons.push(
      `${rainfall} mm of rain can add substantial moisture.`
    )

  }

  else if (rainfall >= 2.5) {

    adjustedDryAfter += 2

    reasons.push(
      `${rainfall} mm of rain can slow soil drying.`
    )

  }

  else {

    adjustedDryAfter += 1

    reasons.push(
      `${rainfall} mm of rain may add some moisture.`
    )
  }
}


/*
 * ---------------------------------------------------------
 * NEVER LET THE WINDOW DROP BELOW ONE DAY.
 *
 * This means some plants can legitimately need daily
 * attention during hot, dry conditions.
 * ---------------------------------------------------------
 */

adjustedDryAfter = Math.max(
  1,
  adjustedDryAfter
)

  /*
   * ---------------------------------------------------------
   * ENVIRONMENT SCORE
   *
   * This is a deterministic score based on the plant's
   * current conditions.
   * ---------------------------------------------------------
   */

  let environmentScore = 100


  if (details.drainage === "no") {
    environmentScore -= 20
  }

  if (humidity !== null && humidity >= 85) {
    environmentScore -= 5
  }

  if (temperature !== null && temperature >= 38) {
    environmentScore -= 10
  }

  if (wind !== null && wind >= 30) {
    environmentScore -= 10
  }

  if (
    rainfall > 7.5 &&
    rainExposure === "exposed"
  ) {
    environmentScore -= 5
  }

  if (effectiveSunlight === "sunny") {
    if (
      temperature !== null &&
      temperature >= 38
    ) {
      environmentScore -= 10
    }
  }

  environmentScore = Math.max(
    0,
    Math.min(100, environmentScore)
  )


  /*
   * ---------------------------------------------------------
   * SAFETY CONDITION #1
   *
   * No drainage is always important.
   * ---------------------------------------------------------
   */

  if (details.drainage === "no") {

    return {
      status: "warning",
      action: "check-soil",
      priority: "high",

      title: "Check the soil first",

      message:
        `Your ${profile.name} is in a pot without drainage. Extra water can remain around the roots, so check the soil carefully before watering.`,

      suggestedAmount,

      waterMl,

      daysSinceWatering,

      reasons: [
        "The pot has no drainage.",
        ...reasons
      ],

      metrics: {
        temperature,
        humidity,
        wind,
        rainfall,
        rainProbability,
        adjustedDryAfter,
        environmentScore
      }
    }
  }


  /*
   * ---------------------------------------------------------
   * SAFETY CONDITION #2
   *
   * EXTREME HEAT + SUNNY POSITION
   * ---------------------------------------------------------
   */

  if (
    temperature !== null &&
    temperature >= 38 &&
    effectiveSunlight === "sunny"
  ) {

    return {
      status: "warning",
      action: "move",
      priority: "high",

      title: "Protect your plant from the heat",

      message:
        `It's ${temperature}°C and your ${profile.name} is in Sunny Side. Move it to Partial Shade during the hottest part of the day.`,

      daysSinceWatering,

      reasons: [
        `Temperature is very high at ${temperature}°C.`,
        "The plant is in direct sunlight.",
        "Partial Shade can reduce heat exposure.",
        ...reasons
      ],

      metrics: {
        temperature,
        humidity,
        wind,
        rainfall,
        rainProbability,
        adjustedDryAfter,
        environmentScore
      }
    }
  }


  /*
   * ---------------------------------------------------------
   * SAFETY CONDITION #3
   *
   * STRONG WIND
   * ---------------------------------------------------------
   */

  if (
    wind !== null &&
    wind >= 30 &&
    (
      rainExposure === "exposed" ||
      effectiveSunlight === "sunny"
    )
  ) {

    return {
      status: "warning",
      action: "protect",
      priority: "high",

      title: "Protect your plant",

      message:
        `Wind is reaching ${wind} km/h. Move your ${profile.name} to a more sheltered position if possible.`,

      daysSinceWatering,

      reasons: [
        `Strong wind: ${wind} km/h.`,
        "The current position is exposed.",
        ...reasons
      ],

      metrics: {
        temperature,
        humidity,
        wind,
        rainfall,
        rainProbability,
        adjustedDryAfter,
        environmentScore
      }
    }
  }


  /*
   * ---------------------------------------------------------
   * RAIN CONDITION
   * ---------------------------------------------------------
   */

  if (
    rainfall > 7.5 &&
    rainExposure === "exposed"
  ) {

    return {
      status: "warning",
      action: "dont-water",
      priority: "high",

      title: "Don't water today",

      message:
        `Around ${rainfall} mm of rain is expected and your ${profile.name} is exposed to rainfall. Let the weather contribute moisture instead of adding more water.`,

      daysSinceWatering,

      reasons: [
        `Rainfall expected: ${rainfall} mm.`,
        "The plant is exposed to rain.",
        "Additional watering may cause excess moisture."
      ],

      metrics: {
        temperature,
        humidity,
        wind,
        rainfall,
        rainProbability,
        adjustedDryAfter,
        environmentScore
      }
    }
  }


  /*
   * ---------------------------------------------------------
   * NO WATERING HISTORY
   * ---------------------------------------------------------
   */

  if (daysSinceWatering === null) {

    return {
      status: "check",
      action: "check-soil",
      priority: "medium",

      title: "Check the soil",

      message:
        `No watering has been recorded for your ${profile.name}. Check the top layer of soil before giving it water.`,

      suggestedAmount,

      waterMl,

      daysSinceWatering: null,

      reasons: [
        "There is no watering history yet.",
        "The soil should be checked manually."
      ],

      metrics: {
        temperature,
        humidity,
        wind,
        rainfall,
        rainProbability,
        adjustedDryAfter,
        environmentScore
      }
    }
  }


  /*
   * ---------------------------------------------------------
   * RECENTLY WATERED
   * ---------------------------------------------------------
   */

  if (daysSinceWatering <= 1) {

    return {
      status: "good",
      action: "wait",
      priority: "low",

      title: "Let the soil settle",

      message:
        `Your ${profile.name} was watered ${daysSinceWatering === 0 ? "today" : "yesterday"}. Give the soil time to absorb and drain before watering again.`,

      daysSinceWatering,

      reasons: [
        `Last watered ${daysSinceWatering === 0 ? "today" : "yesterday"}.`,
        "Watering again too soon can keep the soil unnecessarily wet."
      ],

      metrics: {
        temperature,
        humidity,
        wind,
        rainfall,
        rainProbability,
        adjustedDryAfter,
        environmentScore
      }
    }
  }


  /*
   * ---------------------------------------------------------
   * HEAVY PREVIOUS WATERING
   * ---------------------------------------------------------
   */

  if (
    watering.amount === "deep-drink" ||
    watering.amount === "soaked"
  ) {

    if (daysSinceWatering <= 3) {

      return {
        status: "good",
        action: "wait",
        priority: "low",

        title: "Don't water yet",

        message:
          `Your ${profile.name} received a thorough watering recently. Give the soil more time to dry.`,

        daysSinceWatering,

        reasons: [
          "The previous watering was substantial.",
          `${daysSinceWatering} day(s) have passed since watering.`
        ],

        metrics: {
          temperature,
          humidity,
          wind,
          rainfall,
          rainProbability,
          adjustedDryAfter,
          environmentScore
        }
      }
    }
  }


  /*
   * ---------------------------------------------------------
   * MODERATE RAIN / RAIN PROBABILITY
   *
   * The plant isn't necessarily protected from watering,
   * but rainfall should be considered before adding water.
   * ---------------------------------------------------------
   */

 if (
  rainExposure === "exposed" &&
  rainfall > 7.5
) {

    return {
      status: "warning",
      action: "check-soil",
      priority: "medium",

      title: "Check before watering",

      message:
        `Rain may reach your ${profile.name}. Check the soil before adding water so you don't water unnecessarily.`,

      suggestedAmount,

      waterMl,

      daysSinceWatering,

      reasons: [
        rainfall > 0
          ? `${rainfall} mm of rain is expected.`
          : `Rain probability is ${rainProbability}%.`,
        "The plant is exposed to rain.",
        ...reasons
      ],

      metrics: {
        temperature,
        humidity,
        wind,
        rainfall,
        rainProbability,
        adjustedDryAfter,
        environmentScore
      }
    }
  }


  /*
   * ---------------------------------------------------------
   * WATERING WINDOW
   * ---------------------------------------------------------
   */

  if (
    daysSinceWatering >= adjustedDryAfter
  ) {

    return {
      status: "check",
      action: "water",
      priority: "high",

      title: "Water if the soil is dry",

      message:
        `It has been ${daysSinceWatering} days since watering. Your ${profile.name} is around its expected drying window, so check the top layer of soil.`,

      suggestedAmount,

      waterMl,

      daysSinceWatering,

      reasons: [
        `${daysSinceWatering} days since the last watering.`,
        `Expected drying window: about ${Math.ceil(adjustedDryAfter)} days.`,
        ...reasons
      ],

      metrics: {
        temperature,
        humidity,
        wind,
        rainfall,
        rainProbability,
        adjustedDryAfter,
        environmentScore
      }
    }
  }


  /*
   * ---------------------------------------------------------
   * NORMAL / WAITING STATE
   * ---------------------------------------------------------
   */

  const displayDryAfter = Math.ceil(adjustedDryAfter)

const daysUntilDrying =
  Math.max(
    1,
    Math.ceil(adjustedDryAfter - daysSinceWatering)
  )


  return {
    status: "good",
    action: "wait",
    priority: "low",

    title: "Wait and monitor",

    message:
      `Your ${profile.name} is still within its expected drying window. Check the soil again in about ${daysUntilDrying} day(s).`,

    daysSinceWatering,

    reasons: [
      `${daysSinceWatering} day(s) since watering.`,
     `Expected drying window: about ${displayDryAfter} days.`,
      ...reasons
    ],

    metrics: {
      temperature,
      humidity,
      wind,
      rainfall,
      rainProbability,

      adjustedDryAfter,
      environmentScore
    }
  }
}
function getPlantHealthScore(plantData, weather) {
  const details = plantData?.details
  const watering = plantData?.watering

  if (!details) {
    return null
  }

  let score = 100

  const recommendation =
    getWateringRecommendation(
      plantData,
      weather
    )

  /*
   * Keep Health Score consistent with
   * Today's Care recommendation.
   */

  if (recommendation?.priority === "high") {
    score -= 30
  }

  if (recommendation?.priority === "medium") {
    score -= 25
  }

  /*
   * Additional environmental risks.
   */

  if (details.drainage === "no") {
    score -= 20
  }

  if (
    weather?.current?.relative_humidity_2m >= 85
  ) {
    score -= 5
  }

  if (
    weather?.current?.temperature_2m >= 38
  ) {
    score -= 10
  }

  return Math.max(
    0,
    Math.min(100, score)
  )
}

export {
  getWateringRecommendation,
  getPlantHealthScore
}