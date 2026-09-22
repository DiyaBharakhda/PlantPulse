import { useState } from "react"
import "./Signup.css"

function Signup({ onSignup, onGoToLogin }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError("")

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("All fields are required.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password: password
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || "Unable to create account.")
        setLoading(false)
        return
      }

      /*
       * IMPORTANT:
       * The backend now returns:
       *
       * data.user = {
       *   id,
       *   name,
       *   email
       * }
       *
       * Pass the COMPLETE user object to App.jsx.
       * This makes signup work like login.
       */

      if (!data.user || !data.user.id) {
        console.error("Signup response missing user:", data)
        setError("Account was created, but user information was not returned.")
        setLoading(false)
        return
      }

      console.log("Signup successful:", data.user)

      onSignup(data.user)

    } catch (error) {
      console.error("Signup failed:", error)
      setError("Unable to connect to the PlantPulse server.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-header">
          <p className="auth-eyebrow">
            PLANTPULSE
          </p>

          <h1>
            Create your account
          </h1>

          <p>
            Start your personalized plant-care journey.
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label htmlFor="signup-name">
              Name
            </label>

            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your name"
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-email">
              Email
            </label>

            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-password">
              Password
            </label>

            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create a password"
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-confirm-password">
              Confirm Password
            </label>

            <input
              id="signup-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p className="auth-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

        </form>

        <div className="auth-footer">
          <span>
            Already have an account?
          </span>

          <button
            type="button"
            className="auth-link"
            onClick={onGoToLogin}
          >
            Login
          </button>
        </div>

      </div>
    </div>
  )
}

export default Signup