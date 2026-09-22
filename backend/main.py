from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import time
import sqlite3
from passlib.hash import bcrypt

app = FastAPI()
DATABASE = "plantpulse.db"


def get_db():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    
    connection = get_db()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        )
    """)
    connection.execute("""
    CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
""")
    connection.execute("""
        CREATE TABLE IF NOT EXISTS spaces (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            location_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (location_id) REFERENCES locations(id)
        )
    """)
    connection.execute("""
        CREATE TABLE IF NOT EXISTS plants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            space_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            scientific_name TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (space_id) REFERENCES spaces(id)
        )
    """)
    connection.execute("""
    CREATE TABLE IF NOT EXISTS watering_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        plant_id INTEGER NOT NULL,
        amount TEXT NOT NULL,
        date TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (plant_id) REFERENCES plants(id)
    )
""")

    connection.commit()
    connection.close()


initialize_database()

def update_plant_table():
    connection = get_db()

    columns = [
    ("age", "TEXT"),
    ("pot_size", "TEXT"),
    ("pot_material", "TEXT"),
    ("drainage", "TEXT"),
    ("sunlight", "TEXT"),
    ("rain_exposure", "TEXT")
]

    existing_columns = [
        row["name"]
        for row in connection.execute("PRAGMA table_info(plants)").fetchall()
    ]

    for column_name, column_type in columns:
        if column_name not in existing_columns:
            connection.execute(
                f"ALTER TABLE plants ADD COLUMN {column_name} {column_type}"
            )


    connection.commit()
    connection.close()


update_plant_table()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
         "http://localhost:5174",
        "https://plant-pulse-liart.vercel.app"

    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

HEADERS = {
    "User-Agent": "PlantPulse/1.0 (college project)",
    "Accept": "application/json",
}

# Simple in-memory cache
search_cache = {}

# Prevent rapid requests to the public geocoding service
last_request_time = 0


@app.get("/")
def home():
    return {
        "message": "PlantPulse backend is running"
    }


@app.get("/api/search-location")
def search_location(
    q: str = Query(..., min_length=2),
    lat: float | None = None,
    lon: float | None = None,
):

    global last_request_time

    query = q.strip().lower()

    if not query:
        return []

    # Return cached result if we already searched this
    cache_key = f"{query}:{lat}:{lon}"

    if cache_key in search_cache:
        return search_cache[cache_key]

    # Make sure we don't hit Nominatim too quickly
    elapsed = time.time() - last_request_time

    if elapsed < 1.2:
        time.sleep(1.2 - elapsed)

    params = {
        "q": query,
        "format": "jsonv2",
        "addressdetails": 1,
        "limit": 8,
    }

    # If we know the user's location,
    # use it to bias nearby search results.
    if lat is not None and lon is not None:

        params["viewbox"] = (
            f"{lon - 0.5},{lat + 0.5},"
            f"{lon + 0.5},{lat - 0.5}"
        )

        params["dedupe"] = 1

    try:

        last_request_time = time.time()

        response = requests.get(
            NOMINATIM_URL,
            params=params,
            headers=HEADERS,
            timeout=10,
        )

        if response.status_code == 429:
            raise HTTPException(
                status_code=429,
                detail="Location service is temporarily busy. Please try again in a moment.",
            )

        response.raise_for_status()

        places = response.json()

    except requests.RequestException as error:

        print("LOCATION SEARCH ERROR:", repr(error))

        raise HTTPException(
            status_code=502,
            detail="Unable to contact the location search service.",
        ) from error


    unwanted_types = {
        "bus_stop",
        "drain",
        "road",
        "footway",
        "path",
        "building",
        "parking",
        "house",
        "railway",
        "station",
    }

    preferred_types = {
        "city",
        "town",
        "village",
        "suburb",
        "neighbourhood",
        "quarter",
        "locality",
        "municipality",
        "administrative",
    }

    results = []

    for place in places:

        place_type = place.get("type", "")
        category = place.get("category", "")

        # Remove irrelevant map objects
        if place_type in unwanted_types:
            continue

        # Keep useful geographic locations
        if not (
            place_type in preferred_types
            or category == "place"
            or category == "boundary"
        ):
            continue

        address = place.get("address", {})

        results.append(
            {
                "name": place.get("name", ""),
                "display_name": place.get(
                    "display_name",
                    place.get("name", "")
                ),
                "latitude": float(place["lat"]),
                "longitude": float(place["lon"]),
                "city": (
                    address.get("city")
                    or address.get("town")
                    or address.get("village")
                    or address.get("municipality")
                ),
                "state": (
                    address.get("state")
                    or address.get("state_district")
                ),
                "country": address.get("country"),
                "postcode": address.get("postcode"),
                "type": place_type,
            }
        )

    results = results[:5]

    # Save results so repeated searches don't hit Nominatim
    search_cache[cache_key] = results

    return results

@app.get("/api/weather")
def get_weather(
    lat: float = Query(...),
    lon: float = Query(...),
):

    weather_url = "https://api.open-meteo.com/v1/forecast"

    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m",
        "daily": "precipitation_probability_max,precipitation_sum",
        "forecast_days": 3,
        "timezone": "auto",
    }

    try:

        response = requests.get(
            weather_url,
            params=params,
            timeout=10,
        )

        response.raise_for_status()

        data = response.json()

        return {
            "latitude": data["latitude"],
            "longitude": data["longitude"],
            "timezone": data["timezone"],
            "current": data["current"],
            "daily": data["daily"],
        }

    except requests.RequestException as error:

        print("WEATHER ERROR:", repr(error))

        raise HTTPException(
            status_code=502,
            detail="Unable to contact the weather service.",
        ) from error

@app.post("/api/signup")
def signup(user: dict):
    name = user.get("name", "").strip()
    email = user.get("email", "").strip().lower()
    password = user.get("password", "")

    if not name or not email or not password:
        raise HTTPException(
            status_code=400,
            detail="All fields are required."
        )

    connection = get_db()

    try:
        hashed_password = bcrypt.hash(password)

        cursor = connection.execute(
            """
            INSERT INTO users (name, email, password)
            VALUES (?, ?, ?)
            """,
            (name, email, hashed_password)
        )

        connection.commit()

        user_id = cursor.lastrowid

    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists."
        )

    finally:
        connection.close()

    return {
        "message": "Account created successfully.",
        "user": {
            "id": user_id,
            "name": name,
            "email": email
        }
    }
    name = user.get("name", "").strip()
    email = user.get("email", "").strip().lower()
    password = user.get("password", "")

    if not name or not email or not password:
        raise HTTPException(
            status_code=400,
            detail="All fields are required."
        )

    connection = get_db()

    try:
        hashed_password = bcrypt.hash(password)

        cursor = connection.execute(
            """
            INSERT INTO users (name, email, password)
            VALUES (?, ?, ?)
            """,
            (name, email, hashed_password)
        )

        connection.commit()

        user_id = cursor.lastrowid

        return {
            "message": "Account created successfully.",
            "user": {
                "id": user_id,
                "name": name,
                "email": email
            }
        }

    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists."
        )

    finally:
        connection.close()
    name = user.get("name", "").strip()
    email = user.get("email", "").strip().lower()
    password = user.get("password", "")

    if not name or not email or not password:
        raise HTTPException(
            status_code=400,
            detail="All fields are required."
        )

    connection = get_db()

    try:
        hashed_password = bcrypt.hash(password)

        connection.execute(
        """
        INSERT INTO users (name, email, password)
        VALUES (?, ?, ?)
        """,
        (name, email, hashed_password)
    )

        connection.commit()

    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists."
        )

    try:
        user_id = connection.execute(
            "SELECT id FROM users WHERE email = ?",
            (email,)
        ).fetchone()["id"]
    finally:
        connection.close()

    return {
        "id": user_id,
        "name": name,
        "email": email
    }
@app.post("/api/login")
def login(user: dict):
    email = user.get("email", "").strip().lower()
    password = user.get("password", "")

    if not email or not password:
        raise HTTPException(
            status_code=400,
            detail="Email and password are required."
        )

    connection = get_db()

    account = connection.execute(
        """
        SELECT id, name, email, password
        FROM users
        WHERE email = ?
        """,
        (email,)
    ).fetchone()

    connection.close()

    if account is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    if not bcrypt.verify(password, account["password"]):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."

        )
    return {
        "message": "Login successful.",
        "user": {
            "id": account["id"],
            "name": account["name"],
            "email": account["email"]
        }
    }
@app.post("/api/locations")
def save_location(location: dict):
    user_id = location.get("user_id")
    name = location.get("name", "").strip()
    latitude = location.get("latitude")
    longitude = location.get("longitude")

    if not user_id or not name or latitude is None or longitude is None:
        raise HTTPException(
            status_code=400,
            detail="User and location details are required."
        )

    connection = get_db()

    user = connection.execute(
        "SELECT id FROM users WHERE id = ?",
        (user_id,)
    ).fetchone()

    if user is None:
        connection.close()
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    cursor = connection.execute(
        """
        INSERT INTO locations (
            user_id,
            name,
            latitude,
            longitude
        )
        VALUES (?, ?, ?, ?)
        """,
        (
            user_id,
            name,
            latitude,
            longitude
        )
    )

    connection.commit()

    location_id = cursor.lastrowid

    connection.close()

    return {
            "message": "Location saved successfully.",
            "location_id": location_id
    }
@app.post("/api/locations")
def save_location(location: dict):
    user_id = location.get("user_id")
    name = location.get("name", "").strip()
    latitude = location.get("latitude")
    longitude = location.get("longitude")

    if not user_id or not name or latitude is None or longitude is None:
        raise HTTPException(
            status_code=400,
            detail="User and location details are required."
        )

    connection = get_db()

    try:
        user = connection.execute(
            "SELECT id FROM users WHERE id = ?",
            (user_id,)
        ).fetchone()

        if user is None:
            raise HTTPException(
                status_code=404,
                detail="User not found."
            )

        cursor = connection.execute(
            """
            INSERT INTO locations (
                user_id,
                name,
                latitude,
                longitude
            )
            VALUES (?, ?, ?, ?)
            """,
            (
                user_id,
                name,
                latitude,
                longitude
            )
        )

        location_id = cursor.lastrowid

        # Create default spaces only if the user has no spaces yet
        existing_space = connection.execute(
            "SELECT id FROM spaces WHERE user_id = ? LIMIT 1",
            (user_id,)
        ).fetchone()

        if existing_space is None:
            default_spaces = [
                "Balcony",
                "Bedroom",
                "Terrace",
                "Garden",
                "Other"
            ]

            for space_name in default_spaces:
                connection.execute(
                    """
                    INSERT INTO spaces (user_id, location_id, name)
                    VALUES (?, ?, ?)
                    """,
                    (user_id, location_id, space_name)
                )

        connection.commit()

        return {
            "message": "Location saved successfully.",
            "location_id": location_id
        }

    finally:
        connection.close()

    name = location.get("name", "").strip()
    latitude = location.get("latitude")
    longitude = location.get("longitude")

    if not name or latitude is None or longitude is None:
        raise HTTPException(
            status_code=400,
            detail="Location details are required."
        )

    connection = get_db()

    existing_location = connection.execute(
        """
        SELECT id
        FROM locations
        WHERE id = ?
        """,
        (location_id,)
    ).fetchone()

    if existing_location is None:
        connection.close()
        raise HTTPException(
            status_code=404,
            detail="Location not found."
        )

    connection.execute(
        """
        UPDATE locations
        SET
            name = ?,
            latitude = ?,
            longitude = ?
        WHERE id = ?
        """,
        (
            name,
            latitude,
            longitude,
            location_id
        )
    )

    connection.commit()
    connection.close()

    return {
        "message": "Location updated successfully."
    }
@app.post("/api/spaces")
def save_space(space: dict):
    user_id = space.get("user_id")
    location_id = space.get("location_id")
    name = space.get("name", "").strip()

    if not user_id or not location_id or not name:
        raise HTTPException(
            status_code=400,
            detail="User, location, and space details are required."
        )

    connection = get_db()

    user = connection.execute(
        "SELECT id FROM users WHERE id = ?",
        (user_id,)
    ).fetchone()

    if user is None:
        connection.close()
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    location = connection.execute(
        """
        SELECT id FROM locations
        WHERE id = ? AND user_id = ?
        """,
        (location_id, user_id)
    ).fetchone()

    if location is None:
        connection.close()
        raise HTTPException(
            status_code=404,
            detail="Location not found for this user."
        )

    cursor = connection.execute(
        """
        INSERT INTO spaces (
            user_id,
            location_id,
            name
        )
        VALUES (?, ?, ?)
        """,
        (
            user_id,
            location_id,
            name
        )
    )

    connection.commit()

    space_id = cursor.lastrowid

    connection.close()

    return {
        "message": "Space saved successfully.",
        "space_id": space_id
    }
@app.get("/api/spaces/{user_id}")
def get_spaces(user_id: int):
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, user_id, location_id, name
        FROM spaces
        WHERE user_id = ?
        ORDER BY id ASC
        """,
        (user_id,)
    )

    spaces = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return spaces
@app.post("/api/plants")
def save_plant(plant: dict):
    user_id = plant.get("user_id")
    space_id = plant.get("space_id")
    name = plant.get("name", "").strip()
    scientific_name = plant.get("scientific_name")

    if not user_id or not space_id or not name:
        raise HTTPException(
            status_code=400,
            detail="User, space, and plant details are required."
        )

    connection = get_db()

    user = connection.execute(
        "SELECT id FROM users WHERE id = ?",
        (user_id,)
    ).fetchone()

    if user is None:
        connection.close()
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    space = connection.execute(
        """
        SELECT id FROM spaces
        WHERE id = ? AND user_id = ?
        """,
        (space_id, user_id)
    ).fetchone()

    if space is None:
        connection.close()
        raise HTTPException(
            status_code=404,
            detail="Space not found for this user."
        )

    cursor = connection.execute(
        """
        INSERT INTO plants (
            user_id,
            space_id,
            name,
            scientific_name
        )
        VALUES (?, ?, ?, ?)
        """,
        (
            user_id,
            space_id,
            name,
            scientific_name
        )
    )

    connection.commit()

    plant_id = cursor.lastrowid

    connection.close()

    return {
        "message": "Plant saved successfully.",
        "plant_id": plant_id
    }
@app.put("/api/plants/{plant_id}")
def update_plant(plant_id: int, plant: dict):

    user_id = plant.get("user_id")
    age = plant.get("age")
    pot_size = plant.get("pot_size")
    pot_material = plant.get("pot_material")
    drainage = plant.get("drainage")
    sunlight = plant.get("sunlight")
    rain_exposure = plant.get("rain_exposure")
    spot = plant.get("spot")

    if not user_id:
        raise HTTPException(
            status_code=400,
            detail="User ID is required."
        )

    connection = get_db()

    existing_plant = connection.execute(
        """
        SELECT id FROM plants
        WHERE id = ? AND user_id = ?
        """,
        (plant_id, user_id)
    ).fetchone()

    if existing_plant is None:
        connection.close()
        raise HTTPException(
            status_code=404,
            detail="Plant not found for this user."
        )

    connection.execute(
        """
  UPDATE plants
SET
    age = COALESCE(?, age),
    pot_size = COALESCE(?, pot_size),
    pot_material = COALESCE(?, pot_material),
    drainage = COALESCE(?, drainage),
    sunlight = COALESCE(?, sunlight),
    rain_exposure = COALESCE(?, rain_exposure),
    spot = COALESCE(?, spot)
WHERE id = ? AND user_id = ?
        """,
       (
    age,
    pot_size,
    pot_material,
    drainage,
    sunlight,
    rain_exposure,
    spot,
    plant_id,
    user_id
)
    )

    connection.commit()
    connection.close()

    return {
        "message": "Plant details updated successfully."
    }
@app.post("/api/watering")
def save_watering(watering: dict):

    user_id = watering.get("user_id")
    plant_id = watering.get("plant_id")
    amount = watering.get("amount")
    date = watering.get("date")

    if not user_id or not plant_id or not amount or not date:
        raise HTTPException(
            status_code=400,
            detail="User, plant, amount, and date are required."
        )

    connection = get_db()

    plant = connection.execute(
        """
        SELECT id FROM plants
        WHERE id = ? AND user_id = ?
        """,
        (plant_id, user_id)
    ).fetchone()

    if plant is None:
        connection.close()
        raise HTTPException(
            status_code=404,
            detail="Plant not found for this user."
        )

    cursor = connection.execute(
        """
        INSERT INTO watering_history (
            user_id,
            plant_id,
            amount,
            date
        )
        VALUES (?, ?, ?, ?)
        """,
        (
            user_id,
            plant_id,
            amount,
            date
        )
    )

    connection.commit()

    watering_id = cursor.lastrowid

    connection.close()

    return {
        "message": "Watering record saved successfully.",
        "watering_id": watering_id
    }
@app.get("/api/plants/{user_id}")
def get_user_plants(user_id: int):

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            p.id,
            p.name,
            p.scientific_name,
            p.age,
            p.pot_size,
            p.pot_material,
            p.drainage,
            p.sunlight,
            p.rain_exposure,
            p.spot,
            p.space_id,
            s.name AS space_name,
            l.name AS location_name,
            l.latitude,
            l.longitude,

            (
                SELECT w.amount
                FROM watering_history w
                WHERE w.plant_id = p.id
                ORDER BY w.id DESC
                LIMIT 1
            ) AS watering_amount,

            (
                SELECT w.date
                FROM watering_history w
                WHERE w.plant_id = p.id
                ORDER BY w.id DESC
                LIMIT 1
            ) AS watering_date

        FROM plants p
        JOIN spaces s ON p.space_id = s.id
        JOIN locations l ON s.location_id = l.id
        WHERE p.user_id = ?
        ORDER BY p.id ASC
    """, (user_id,))

    plants = cursor.fetchall()

    conn.close()

    return {
        "plants": [
            {
    "id": plant[0],
    "name": plant[1],
    "scientific_name": plant[2],
    "age": plant[3],
    "pot_size": plant[4],
    "pot_material": plant[5],
    "drainage": plant[6],
    "sunlight": plant[7],
    "rain_exposure": plant[8],
    "spot": plant[9],
    "space_id": plant[10],
    "space_name": plant[11],
    "location": {
        "name": plant[12],
        "latitude": plant[13],
        "longitude": plant[14]
    },
    "watering": {
        "amount": plant[15],
        "date": plant[16]
    } if plant[16] else None
}
            for plant in plants
        ]
    }