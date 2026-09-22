import { useState } from "react"

import "./Login.css"

function Login({ onLogin, onGoToSignup }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (event) => {
  event.preventDefault()

  try {
    const response = await fetch(
  `${import.meta.env.VITE_API_URL}/api/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      alert(data.detail || "Unable to log in.")
      return
    }

    alert(`Welcome back, ${data.user.name}!`)

    onLogin(data.user)

  } catch (error) {
    console.error("Login failed:", error)
    alert("Unable to connect to the PlantPulse server.")
  }
}

  return (
    <div className="auth-page">
      <div className="auth-card">

        <p className="auth-eyebrow">
          WELCOME BACK
        </p>

        <h1>Log in to PlantPulse</h1>

        <p className="auth-description">
          Continue caring for your plants with your
          personalized PlantPulse space.
        </p>

        <form onSubmit={handleSubmit}>

          <label>
            Email
          </label>

          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label>
            Password
          </label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button type="submit">
            Log In
          </button>

        </form>

        <p className="auth-switch">
          Don't have an account?{" "}
          <button
            type="button"
            className="auth-link"
            onClick={onGoToSignup}
          >
            Sign Up
          </button>
        </p>

      </div>
    </div>
  )
}

export default Login