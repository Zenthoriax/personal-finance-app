-- Personal Finance App Database Schema for PostgreSQL

-- 1. Create ENUM types first (PostgreSQL requires this)
DO $$ BEGIN
    CREATE TYPE category_type_enum AS ENUM ('income', 'expense');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE goal_status_enum AS ENUM ('active', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. USER Table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY, -- Changed from INT AUTO_INCREMENT
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Removed ON UPDATE CURRENT_TIMESTAMP, must be handled in Node.js or a trigger
);

-- 3. CATEGORY Table
CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY, -- Changed from INT AUTO_INCREMENT
    user_id INT NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    category_type category_type_enum NOT NULL, -- Changed from MySQL ENUM()
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE (user_id, category_name) -- PostgreSQL UNIQUE syntax
);

-- 4. ACCOUNT Table
CREATE TABLE IF NOT EXISTS accounts (
    account_id SERIAL PRIMARY KEY, -- Changed from INT AUTO_INCREMENT
    user_id INT NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Removed ON UPDATE CURRENT_TIMESTAMP
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 5. BUDGET Table
CREATE TABLE IF NOT EXISTS budgets (
    budget_id SERIAL PRIMARY KEY, -- Changed from INT AUTO_INCREMENT
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    budget_amount DECIMAL(15, 2) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Removed ON UPDATE CURRENT_TIMESTAMP
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

-- 6. GOALS Table
CREATE TABLE IF NOT EXISTS goals (
    goal_id SERIAL PRIMARY KEY, -- Changed from INT AUTO_INCREMENT
    user_id INT NOT NULL,
    goal_name VARCHAR(200) NOT NULL,
    target_amount DECIMAL(15, 2) NOT NULL,
    current_amount DECIMAL(15, 2) DEFAULT 0.00,
    target_date DATE,
    status goal_status_enum DEFAULT 'active', -- Changed from MySQL ENUM()
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Removed ON UPDATE CURRENT_TIMESTAMP
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 7. TRANSACTION Table
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id SERIAL PRIMARY KEY, -- Changed from INT AUTO_INCREMENT
    user_id INT NOT NULL,
    account_id INT NOT NULL,
    category_id INT NOT NULL,
    transaction_type category_type_enum NOT NULL, -- Changed from MySQL ENUM()
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Removed ON UPDATE CURRENT_TIMESTAMP
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

-- Indexes for better performance (CREATE INDEX syntax is the same)
CREATE INDEX IF NOT EXISTS idx_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transaction_date ON transactions(transaction_date);