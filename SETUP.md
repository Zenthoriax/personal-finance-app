# Quick Setup Guide

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Set Up MySQL Database

1. Open MySQL Workbench
2. Connect to your MySQL server
3. Open and run the file: `database/schema.sql`
4. This will create the database `personal_finance_db` and all required tables

## Step 3: Configure Environment

Create a `.env` file in the root directory with the following content:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=personal_finance_db
JWT_SECRET=your_secret_key_here_change_this
PORT=3000
```

**Important**: Replace `your_mysql_password` with your actual MySQL password.

## Step 4: Start the Server

```bash
npm start
```

Or for development (with auto-reload):
```bash
npm run dev
```

## Step 5: Access the Application

Open your browser and go to: `http://localhost:3000`

## First Steps

1. **Register** a new account
2. **Login** with your credentials
3. **Create Categories** (e.g., "Salary" for income, "Food" for expense)
4. **Add Accounts** (e.g., "Savings", "Checking")
5. **Add Transactions** to track your finances
6. **Set Budgets** and **Goals** to manage your finances

## Troubleshooting

- **Can't connect to database**: Check your MySQL credentials in `.env`
- **Port 3000 already in use**: Change PORT in `.env` or stop the process using port 3000
- **Module errors**: Run `npm install` again

