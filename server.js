const express = require('express');
const mysql = require('mysql2/promise');
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

// Database connection
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'personal_finance_db'
};

let db;

// Initialize database connection
async function initDB() {
    try {
        db = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL database');
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
}

// Authentication middleware
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

        // Check if user exists
        const [existingUsers] = await db.execute(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, passwordHash]
        );

        // Generate token
        const token = jwt.sign({ userId: result.insertId }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            userId: result.insertId
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

        // Find user
        const [users] = await db.execute(
            'SELECT * FROM users WHERE email = ?',
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
        const [categories] = await db.execute(
            'SELECT * FROM categories WHERE user_id = ? ORDER BY category_name',
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

        const [result] = await db.execute(
            'INSERT INTO categories (user_id, category_name, category_type) VALUES (?, ?, ?)',
            [req.userId, category_name, category_type]
        );

        res.status(201).json({ message: 'Category created', categoryId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Category already exists' });
        }
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete category
app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
    try {
        const [result] = await db.execute(
            'DELETE FROM categories WHERE category_id = ? AND user_id = ?',
            [req.params.id, req.userId]
        );

        if (result.affectedRows === 0) {
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
        const [accounts] = await db.execute(
            'SELECT * FROM accounts WHERE user_id = ? ORDER BY account_name',
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

        const [result] = await db.execute(
            'INSERT INTO accounts (user_id, account_name, account_type, balance) VALUES (?, ?, ?, ?)',
            [req.userId, account_name, account_type, balance || 0]
        );

        res.status(201).json({ message: 'Account created', accountId: result.insertId });
    } catch (error) {
        console.error('Create account error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update account
app.put('/api/accounts/:id', authenticateToken, async (req, res) => {
    try {
        const { account_name, account_type, balance } = req.body;

        const [result] = await db.execute(
            'UPDATE accounts SET account_name = ?, account_type = ?, balance = ? WHERE account_id = ? AND user_id = ?',
            [account_name, account_type, balance, req.params.id, req.userId]
        );

        if (result.affectedRows === 0) {
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
        const [result] = await db.execute(
            'DELETE FROM accounts WHERE account_id = ? AND user_id = ?',
            [req.params.id, req.userId]
        );

        if (result.affectedRows === 0) {
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
        const [budgets] = await db.execute(
            `SELECT b.*, c.category_name 
             FROM budgets b 
             JOIN categories c ON b.category_id = c.category_id 
             WHERE b.user_id = ? 
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

        const [result] = await db.execute(
            'INSERT INTO budgets (user_id, category_id, budget_amount, period_start, period_end) VALUES (?, ?, ?, ?, ?)',
            [req.userId, category_id, budget_amount, period_start, period_end]
        );

        res.status(201).json({ message: 'Budget created', budgetId: result.insertId });
    } catch (error) {
        console.error('Create budget error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update budget
app.put('/api/budgets/:id', authenticateToken, async (req, res) => {
    try {
        const { budget_amount, period_start, period_end } = req.body;

        const [result] = await db.execute(
            'UPDATE budgets SET budget_amount = ?, period_start = ?, period_end = ? WHERE budget_id = ? AND user_id = ?',
            [budget_amount, period_start, period_end, req.params.id, req.userId]
        );

        if (result.affectedRows === 0) {
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
        const [result] = await db.execute(
            'DELETE FROM budgets WHERE budget_id = ? AND user_id = ?',
            [req.params.id, req.userId]
        );

        if (result.affectedRows === 0) {
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
        const [goals] = await db.execute(
            'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC',
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

        const [result] = await db.execute(
            'INSERT INTO goals (user_id, goal_name, target_amount, current_amount, target_date, status) VALUES (?, ?, ?, ?, ?, ?)',
            [req.userId, goal_name, target_amount, current_amount || 0, target_date || null, status || 'active']
        );

        res.status(201).json({ message: 'Goal created', goalId: result.insertId });
    } catch (error) {
        console.error('Create goal error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update goal
app.put('/api/goals/:id', authenticateToken, async (req, res) => {
    try {
        const { goal_name, target_amount, current_amount, target_date, status } = req.body;

        const [result] = await db.execute(
            'UPDATE goals SET goal_name = ?, target_amount = ?, current_amount = ?, target_date = ?, status = ? WHERE goal_id = ? AND user_id = ?',
            [goal_name, target_amount, current_amount, target_date, status, req.params.id, req.userId]
        );

        if (result.affectedRows === 0) {
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
        const [result] = await db.execute(
            'DELETE FROM goals WHERE goal_id = ? AND user_id = ?',
            [req.params.id, req.userId]
        );

        if (result.affectedRows === 0) {
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
        const [transactions] = await db.execute(
            `SELECT t.*, a.account_name, c.category_name 
             FROM transactions t 
             JOIN accounts a ON t.account_id = a.account_id 
             JOIN categories c ON t.category_id = c.category_id 
             WHERE t.user_id = ? 
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
    try {
        const { account_id, category_id, transaction_type, amount, description, transaction_date } = req.body;

        if (!account_id || !category_id || !transaction_type || !amount || !transaction_date) {
            return res.status(400).json({ error: 'Required fields are missing' });
        }

        // Start transaction
        await db.beginTransaction();

        try {
            // Insert transaction
            const [result] = await db.execute(
                'INSERT INTO transactions (user_id, account_id, category_id, transaction_type, amount, description, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [req.userId, account_id, category_id, transaction_type, amount, description || null, transaction_date]
            );

            // Update account balance
            const balanceChange = transaction_type === 'income' ? amount : -amount;
            await db.execute(
                'UPDATE accounts SET balance = balance + ? WHERE account_id = ? AND user_id = ?',
                [balanceChange, account_id, req.userId]
            );

            await db.commit();
            res.status(201).json({ message: 'Transaction created', transactionId: result.insertId });
        } catch (error) {
            await db.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update transaction
app.put('/api/transactions/:id', authenticateToken, async (req, res) => {
    try {
        const { account_id, category_id, transaction_type, amount, description, transaction_date } = req.body;

        // Get old transaction
        const [oldTransactions] = await db.execute(
            'SELECT * FROM transactions WHERE transaction_id = ? AND user_id = ?',
            [req.params.id, req.userId]
        );

        if (oldTransactions.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        const oldTransaction = oldTransactions[0];

        await db.beginTransaction();

        try {
            // Revert old balance change
            const oldBalanceChange = oldTransaction.transaction_type === 'income' ? -oldTransaction.amount : oldTransaction.amount;
            await db.execute(
                'UPDATE accounts SET balance = balance + ? WHERE account_id = ? AND user_id = ?',
                [oldBalanceChange, oldTransaction.account_id, req.userId]
            );

            // Update transaction
            await db.execute(
                'UPDATE transactions SET account_id = ?, category_id = ?, transaction_type = ?, amount = ?, description = ?, transaction_date = ? WHERE transaction_id = ? AND user_id = ?',
                [account_id, category_id, transaction_type, amount, description, transaction_date, req.params.id, req.userId]
            );

            // Apply new balance change
            const newBalanceChange = transaction_type === 'income' ? amount : -amount;
            await db.execute(
                'UPDATE accounts SET balance = balance + ? WHERE account_id = ? AND user_id = ?',
                [newBalanceChange, account_id, req.userId]
            );

            await db.commit();
            res.json({ message: 'Transaction updated' });
        } catch (error) {
            await db.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Update transaction error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete transaction
app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
    try {
        // Get transaction
        const [transactions] = await db.execute(
            'SELECT * FROM transactions WHERE transaction_id = ? AND user_id = ?',
            [req.params.id, req.userId]
        );

        if (transactions.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        const transaction = transactions[0];

        await db.beginTransaction();

        try {
            // Revert balance change
            const balanceChange = transaction.transaction_type === 'income' ? -transaction.amount : transaction.amount;
            await db.execute(
                'UPDATE accounts SET balance = balance + ? WHERE account_id = ? AND user_id = ?',
                [balanceChange, transaction.account_id, req.userId]
            );

            // Delete transaction
            await db.execute(
                'DELETE FROM transactions WHERE transaction_id = ? AND user_id = ?',
                [req.params.id, req.userId]
            );

            await db.commit();
            res.json({ message: 'Transaction deleted' });
        } catch (error) {
            await db.rollback();
            throw error;
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

        // Get total balance
        const [balanceResult] = await db.execute(
            'SELECT SUM(balance) as total_balance FROM accounts WHERE user_id = ?',
            [userId]
        );

        // Get monthly income
        const [incomeResult] = await db.execute(
            'SELECT SUM(amount) as total_income FROM transactions WHERE user_id = ? AND transaction_type = "income" AND MONTH(transaction_date) = MONTH(CURRENT_DATE()) AND YEAR(transaction_date) = YEAR(CURRENT_DATE())',
            [userId]
        );

        // Get monthly expenses
        const [expenseResult] = await db.execute(
            'SELECT SUM(amount) as total_expense FROM transactions WHERE user_id = ? AND transaction_type = "expense" AND MONTH(transaction_date) = MONTH(CURRENT_DATE()) AND YEAR(transaction_date) = YEAR(CURRENT_DATE())',
            [userId]
        );

        // Get active goals
        const [goalsResult] = await db.execute(
            'SELECT COUNT(*) as active_goals FROM goals WHERE user_id = ? AND status = "active"',
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

