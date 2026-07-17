-- Create the users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed data if the users table is empty. This statement inserts only if the ID does not exist.
INSERT IGNORE INTO users (id, name, email) VALUES
('user-1', 'Alice Wonderland', 'alice@example.com'),
('user-2', 'Bob The Builder', 'bob@example.com'),
('user-3', 'Charlie Chaplin', 'charlie@example.com');
