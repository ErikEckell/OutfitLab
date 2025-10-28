db {
    CREATE TABLE user (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    birth_date DATE,
    gender TEXT CHECK (gender IN ('M', 'F', 'Other')),
    created_at TIMESTAMP DEFAULT now(),
    password TEXT NOT NULL
    );

    CREATE TABLE clothing_type (
        id SERIAL PRIMARY KEY,
        name TEXT,          -- e.g., shirt, pants, jacket
        category TEXT       -- e.g., top, bottom, accessory
    );

    CREATE TABLE clothing_item (
        id SERIAL PRIMARY KEY,
        type_id INT REFERENCES clothing_type(id) ON DELETE CASCADE,
        user_id INT REFERENCES user(id) ON DELETE CASCADE,
        photo_url TEXT,                         -- image URL or path
        last_used DATE,
        height FLOAT,
        width FLOAT,
        formality TEXT,                         -- casual, formal, sport, etc.
        main_color TEXT,
        secondary_colors TEXT[],                -- array of additional colors
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
    );

    CREATE TABLE style (
        id SERIAL PRIMARY KEY,
        name TEXT,
        color_palette JSONB,                    -- recommended color combinations
        event_type TEXT                         -- e.g., wedding, work, party
    );

    CREATE TABLE style_clothing (
        style_id INT REFERENCES style(id) ON DELETE CASCADE,
        clothing_id INT REFERENCES clothing_item(id) ON DELETE CASCADE,
        PRIMARY KEY (style_id, clothing_id)
    );

    CREATE TABLE preference (
        style_id INT REFERENCES style(id) ON DELETE CASCADE,
        user_id INT REFERENCES user(id) ON DELETE CASCADE,
        PRIMARY KEY (style_id, user_id)
    );

    CREATE TABLE weather (
        id SERIAL PRIMARY KEY,
        date DATE,
        temperature FLOAT,
        feels_like FLOAT,
        humidity FLOAT,
        wind FLOAT,
        conditions TEXT,                        -- sunny, rainy, snowy, etc.
        precipitation_prob FLOAT,               -- 0-1
        cloudiness INT,                         -- percentage
        uv_index FLOAT,
        created_at TIMESTAMP DEFAULT now()
    );

    CREATE TABLE weather_clothing (
        clothing_id INT REFERENCES clothing_item(id) ON DELETE CASCADE,
        weather_id INT REFERENCES weather(id) ON DELETE CASCADE,
        PRIMARY KEY (clothing_id, weather_id)
    );

}
