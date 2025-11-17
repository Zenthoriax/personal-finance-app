const express = require('express');
const { Pool } = require('pg'); // Changed: Use PostgreSQL Pool
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_in_production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection configuration (using environment variables from .env)
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres', // Expected PostgreSQL user
    password: process.env.DB_PASSWORD || 'Jeeva@9806', // Your Docker password
    database: process.env.DB_NAME || 'personal_finance_db',
    port: process.env.DB_PORT || 5432 // PostgreSQL port
};

const pool = new Pool(dbConfig); // Changed: Create a Pool instead of a single connection

// Initialize database connection (now just checking connection)
async function initDB() {
    try {
        await pool.connect();
        console.log('Connected to PostgreSQL database');
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
}

// Authentication middleware (no changes needed here)
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// ==================== AUTHENTICATION ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user exists (Changed: $1, $2 parameters)
        const { rows: existingUsers } = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert user (Changed: $1, $2, $3 parameters AND RETURNING user_id)
        const { rows: resultRows } = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id',
            [username, email, passwordHash]
        );

        // Changed: Get inserted ID from resultRows[0]
        const newUserId = resultRows[0].user_id;

        // Generate token
        const token = jwt.sign({ userId: newUserId }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            userId: newUserId
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user (Changed: $1 parameter)
        const { rows: users } = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Login successful',
            token,
            userId: user.user_id,
            username: user.username
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== CATEGORY ROUTES ====================

// Get all categories
app.get('/api/categories', authenticateToken, async (req, res) => {
    try {
        // Changed: $1 parameter
        const { rows: categories } = await pool.query(
            'SELECT * FROM categories WHERE user_id = $1 ORDER BY category_name',
            [req.userId]
        );
        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create category
app.post('/api/categories', authenticateToken, async (req, res) => {
    try {
        const { category_name, category_type } = req.body;

        if (!category_name || !category_type) {
            return res.status(400).json({ error: 'Category name and type are required' });
        }

        // Changed: $1, $2, $3 parameters AND RETURNING category_id
        const { rows: resultRows } = await pool.query(
            'INSERT INTO categories (user_id, category_name, category_type) VALUES ($1, $2, $3) RETURNING category_id',
            [req.userId, category_name, category_type]
        );

        res.status(201).json({ message: 'Category created', categoryId: resultRows[0].category_id });
    } catch (error) {
        // Changed: PostgreSQL error code is '23505' for unique constraint violation
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Category already exists' });
        }
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete category
app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
    try {
        // Changed: $1, $2 parameters
        const result = await pool.query(
            'DELETE FROM categories WHERE category_id = $1 AND user_id = $2',
            [req.params.id, req.userId]
        );

        // Changed: Use rowCount
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json({ message: 'Category deleted' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== ACCOUNT ROUTES ====================

// Get all accounts
app.get('/api/accounts', authenticateToken, async (req, res) => {
    try {
        // Changed: $1 parameter
        const { rows: accounts } = await pool.query(
            'SELECT * FROM accounts WHERE user_id = $1 ORDER BY account_name',
            [req.userId]
        );
        res.json(accounts);
    } catch (error) {
        console.error('Get accounts error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create account
app.post('/api/accounts', authenticateToken, async (req, res) => {
    try {
        const { account_name, account_type, balance } = req.body;

        if (!account_name || !account_type) {
            return res.status(400).json({ error: 'Account name and type are required' });
        }

        // Changed: $1, $2, $3, $4 parameters AND RETURNING account_id
        const { rows: resultRows } = await pool.query(
            'INSERT INTO accounts (user_id, account_name, account_type, balance) VALUES ($1, $2, $3, $4) RETURNING account_id',
            [req.userId, account_name, account_type, balance || 0]
        );

        res.status(201).json({ message: 'Account created', accountId: resultRows[0].account_id });
    } catch (error) {
        console.error('Create account error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update account
app.put('/api/accounts/:id', authenticateToken, async (req, res) => {
    try {
        const { account_name, account_type, balance } = req.body;

        // Changed: $1, $2, $3, $4, $5 parameters
        const result = await pool.query(
            'UPDATE accounts SET account_name = $1, account_type = $2, balance = $3 WHERE account_id = $4 AND user_id = $5',
            [account_name, account_type, balance, req.params.id, req.userId]
        );

        // Changed: Use rowCount
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Account not found' });
        }

        res.json({ message: 'Account updated' });
    } catch (error) {
        console.error('Update account error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete account
app.delete('/api/accounts/:id', authenticateToken, async (req, res) => {
    try {
        // Changed: $1, $2 parameters
        const result = await pool.query(
            'DELETE FROM accounts WHERE account_id = $1 AND user_id = $2',
            [req.params.id, req.userId]
        );

        // Changed: Use rowCount
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Account not found' });
        }

        res.json({ message: 'Account deleted' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== BUDGET ROUTES ====================

// Get all budgets
app.get('/api/budgets', authenticateToken, async (req, res) => {
    try {
        // Changed: $1 parameter
        const { rows: budgets } = await pool.query(
            `SELECT b.*, c.category_name 
             FROM budgets b 
             JOIN categories c ON b.category_id = c.category_id 
             WHERE b.user_id = $1 
             ORDER BY b.period_start DESC`,
            [req.userId]
        );
        res.json(budgets);
    } catch (error) {
        console.error('Get budgets error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create budget
app.post('/api/budgets', authenticateToken, async (req, res) => {
    try {
        const { category_id, budget_amount, period_start, period_end } = req.body;

        if (!category_id || !budget_amount || !period_start || !period_end) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Changed: $1 - $5 parameters AND RETURNING budget_id
        const { rows: resultRows } = await pool.query(
            'INSERT INTO budgets (user_id, category_id, budget_amount, period_start, period_end) VALUES ($1, $2, $3, $4, $5) RETURNING budget_id',
            [req.userId, category_id, budget_amount, period_start, period_end]
        );

        res.status(201).json({ message: 'Budget created', budgetId: resultRows[0].budget_id });
    } catch (error) {
        console.error('Create budget error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update budget
app.put('/api/budgets/:id', authenticateToken, async (req, res) => {
    try {
        const { budget_amount, period_start, period_end } = req.body;

        // Changed: $1 - $5 parameters
        const result = await pool.query(
            'UPDATE budgets SET budget_amount = $1, period_start = $2, period_end = $3 WHERE budget_id = $4 AND user_id = $5',
            [budget_amount, period_start, period_end, req.params.id, req.userId]
        );

        // Changed: Use rowCount
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Budget not found' });
        }

        res.json({ message: 'Budget updated' });
    } catch (error) {
        console.error('Update budget error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete budget
app.delete('/api/budgets/:id', authenticateToken, async (req, res) => {
    try {
        // Changed: $1, $2 parameters
        const result = await pool.query(
            'DELETE FROM budgets WHERE budget_id = $1 AND user_id = $2',
            [req.params.id, req.userId]
        );

        // Changed: Use rowCount
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Account not found' });
        }

        res.json({ message: 'Budget deleted' });
    } catch (error) {
        console.error('Delete budget error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== GOALS ROUTES ====================

// Get all goals
app.get('/api/goals', authenticateToken, async (req, res) => {
    try {
        // Changed: $1 parameter
        const { rows: goals } = await pool.query(
            'SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC',
            [req.userId]
        );
        res.json(goals);
    } catch (error) {
        console.error('Get goals error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create goal
app.post('/api/goals', authenticateToken, async (req, res) => {
    try {
        const { goal_name, target_amount, current_amount, target_date, status } = req.body;

        if (!goal_name || !target_amount) {
            return res.status(400).json({ error: 'Goal name and target amount are required' });
        }

        // Changed: $1 - $6 parameters AND RETURNING goal_id
        const { rows: resultRows } = await pool.query(
            'INSERT INTO goals (user_id, goal_name, target_amount, current_amount, target_date, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING goal_id',
            [req.userId, goal_name, target_amount, current_amount || 0, target_date || null, status || 'active']
        );

        res.status(201).json({ message: 'Goal created', goalId: resultRows[0].goal_id });
    } catch (error) {
        console.error('Create goal error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update goal
app.put('/api/goals/:id', authenticateToken, async (req, res) => {
    try {
        const { goal_name, target_amount, current_amount, target_date, status } = req.body;

        // Changed: $1 - $7 parameters
        const result = await pool.query(
            'UPDATE goals SET goal_name = $1, target_amount = $2, current_amount = $3, target_date = $4, status = $5 WHERE goal_id = $6 AND user_id = $7',
            [goal_name, target_amount, current_amount, target_date, status, req.params.id, req.userId]
        );

        // Changed: Use rowCount
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        res.json({ message: 'Goal updated' });
    } catch (error) {
        console.error('Update goal error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete goal
app.delete('/api/goals/:id', authenticateToken, async (req, res) => {
    try {
        // Changed: $1, $2 parameters
        const result = await pool.query(
            'DELETE FROM goals WHERE goal_id = $1 AND user_id = $2',
            [req.params.id, req.userId]
        );

        // Changed: Use rowCount
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        res.json({ message: 'Goal deleted' });
    } catch (error) {
        console.error('Delete goal error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== TRANSACTION ROUTES ====================

// Get all transactions
app.get('/api/transactions', authenticateToken, async (req, res) => {
    try {
        // Changed: $1 parameter
        const { rows: transactions } = await pool.query(
            `SELECT t.*, a.account_name, c.category_name 
             FROM transactions t 
             JOIN accounts a ON t.account_id = a.account_id 
             JOIN categories c ON t.category_id = c.category_id 
             WHERE t.user_id = $1 
             ORDER BY t.transaction_date DESC, t.created_at DESC`,
            [req.userId]
        );
        res.json(transactions);
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create transaction
app.post('/api/transactions', authenticateToken, async (req, res) => {
    const client = await pool.connect(); // Changed: Get client for explicit transaction

    try {
        const { account_id, category_id, transaction_type, amount, description, transaction_date } = req.body;

        if (!account_id || !category_id || !transaction_type || !amount || !transaction_date) {
            return res.status(400).json({ error: 'Required fields are missing' });
        }

        // Start transaction (Changed: use client)
        await client.query('BEGIN');

        try {
            // Insert transaction (Changed: $1 - $7 parameters AND RETURNING transaction_id)
            const { rows: resultRows } = await client.query(
                'INSERT INTO transactions (user_id, account_id, category_id, transaction_type, amount, description, transaction_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING transaction_id',
                [req.userId, account_id, category_id, transaction_type, amount, description || null, transaction_date]
            );

            // Update account balance (Changed: $1, $2, $3 parameters)
            const balanceChange = transaction_type === 'income' ? amount : -amount;
            await client.query(
                'UPDATE accounts SET balance = balance + $1 WHERE account_id = $2 AND user_id = $3',
                [balanceChange, account_id, req.userId]
            );

            await client.query('COMMIT'); // Changed: use client
            res.status(201).json({ message: 'Transaction created', transactionId: resultRows[0].transaction_id });
        } catch (error) {
            await client.query('ROLLBACK'); // Changed: use client
            throw error;
        } finally {
            client.release(); // Must release client
        }
    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update transaction
app.put('/api/transactions/:id', authenticateToken, async (req, res) => {
    const client = await pool.connect(); // Changed: Get client for explicit transaction

    try {
        const { account_id, category_id, transaction_type, amount, description, transaction_date } = req.body;

        // Get old transaction (Changed: $1, $2 parameters)
        const { rows: oldTransactions } = await client.query(
            'SELECT * FROM transactions WHERE transaction_id = $1 AND user_id = $2',
            [req.params.id, req.userId]
        );

        if (oldTransactions.length === 0) {
            client.release();
            return res.status(404).json({ error: 'Transaction not found' });
        }

        const oldTransaction = oldTransactions[0];

        await client.query('BEGIN'); // Changed: use client

        try {
            // Revert old balance change (Changed: $1, $2, $3 parameters)
            const oldBalanceChange = oldTransaction.transaction_type === 'income' ? -oldTransaction.amount : oldTransaction.amount;
            await client.query(
                'UPDATE accounts SET balance = balance + $1 WHERE account_id = $2 AND user_id = $3',
                [oldBalanceChange, oldTransaction.account_id, req.userId]
            );

            // Update transaction (Changed: $1 - $8 parameters)
            await client.query(
                'UPDATE transactions SET account_id = $1, category_id = $2, transaction_type = $3, amount = $4, description = $5, transaction_date = $6 WHERE transaction_id = $7 AND user_id = $8',
                [account_id, category_id, transaction_type, amount, description, transaction_date, req.params.id, req.userId]
            );

            // Apply new balance change (Changed: $1, $2, $3 parameters)
            const newBalanceChange = transaction_type === 'income' ? amount : -amount;
            await client.query(
                'UPDATE accounts SET balance = balance + $1 WHERE account_id = $2 AND user_id = $3',
                [newBalanceChange, account_id, req.userId]
            );

            await client.query('COMMIT'); // Changed: use client
            res.json({ message: 'Transaction updated' });
        } catch (error) {
            await client.query('ROLLBACK'); // Changed: use client
            throw error;
        } finally {
            client.release(); // Must release client
        }
    } catch (error) {
        console.error('Update transaction error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete transaction
app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
    const client = await pool.connect(); // Changed: Get client for explicit transaction
    try {
        // Get transaction (Changed: $1, $2 parameters)
        const { rows: transactions } = await client.query(
            'SELECT * FROM transactions WHERE transaction_id = $1 AND user_id = $2',
            [req.params.id, req.userId]
        );

        if (transactions.length === 0) {
            client.release();
            return res.status(404).json({ error: 'Transaction not found' });
        }

        const transaction = transactions[0];

        await client.query('BEGIN'); // Changed: use client

        try {
            // Revert balance change (Changed: $1, $2, $3 parameters)
            const balanceChange = transaction.transaction_type === 'income' ? -transaction.amount : transaction.amount;
            await client.query(
                'UPDATE accounts SET balance = balance + $1 WHERE account_id = $2 AND user_id = $3',
                [balanceChange, transaction.account_id, req.userId]
            );

            // Delete transaction (Changed: $1, $2 parameters)
            await client.query(
                'DELETE FROM transactions WHERE transaction_id = $1 AND user_id = $2',
                [req.params.id, req.userId]
            );

            await client.query('COMMIT'); // Changed: use client
            res.json({ message: 'Transaction deleted' });
        } catch (error) {
            await client.query('ROLLBACK'); // Changed: use client
            throw error;
        } finally {
            client.release(); // Must release client
        }
    } catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== DASHBOARD STATS ====================

app.get('/api/dashboard', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;

        // Get total balance (Changed: $1 parameter)
        const { rows: balanceResult } = await pool.query(
            'SELECT SUM(balance) as total_balance FROM accounts WHERE user_id = $1',
            [userId]
        );

        // Get monthly income (Changed: Date functions to PostgreSQL EXTRACT, $1 parameter)
        const { rows: incomeResult } = await pool.query(
            'SELECT SUM(amount) as total_income FROM transactions WHERE user_id = $1 AND transaction_type = \'income\' AND EXTRACT(MONTH FROM transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE)',
            [userId]
        );

        // Get monthly expenses (Changed: Date functions to PostgreSQL EXTRACT, $1 parameter)
        const { rows: expenseResult } = await pool.query(
            'SELECT SUM(amount) as total_expense FROM transactions WHERE user_id = $1 AND transaction_type = \'expense\' AND EXTRACT(MONTH FROM transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE)',
            [userId]
        );

        // Get active goals (Changed: $1 parameter)
        const { rows: goalsResult } = await pool.query(
            'SELECT COUNT(*) as active_goals FROM goals WHERE user_id = $1 AND status = \'active\'',
            [userId]
        );

        res.json({
            totalBalance: balanceResult[0].total_balance || 0,
            monthlyIncome: incomeResult[0].total_income || 0,
            monthlyExpense: expenseResult[0].total_expense || 0,
            activeGoals: goalsResult[0].active_goals || 0
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Start server
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});