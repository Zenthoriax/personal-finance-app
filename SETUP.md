Great! Keeping your README.md and SETUP.md clean and updated is excellent for project documentation. A good README is crucial for anyone (including future you!) to understand your project quickly, and SETUP.md is perfect for detailed instructions.

Let's create new, clean versions for both. I'll provide content that you can copy, paste, and then commit to your GitHub repository.

Step 1: Update README.md
This file should give a high-level overview, why the project exists, its features, and how to get started.

Open README.md in your VS Code editor.

Replace its entire content with the following:

Markdown

# Personal Finance Tracker

A secure, full-stack personal finance management application designed for tracking income, expenses, managing accounts, and setting financial goals. This project served as a deep dive into migrating from a basic MySQL setup to a robust, containerized PostgreSQL backend, emphasizing data integrity and modern development practices.

## ✨ Features

* **User Authentication:** Secure user registration and login using JWT (JSON Web Tokens).
* **Account Management:** Create, view, and manage multiple financial accounts.
* **Category Management:** Define custom income and expense categories.
* **Transaction Tracking:** Record and categorize all financial transactions (income, expense, transfers).
* **Atomic Transactions:** Ensures data integrity for financial operations (e.g., balance updates linked to transaction creation).
* **Budgeting:** Set and track budgets against defined categories.
* **Financial Goals:** Create and monitor progress towards financial objectives.
* **Containerized Database:** PostgreSQL database runs in a Docker container for a clean, reproducible development environment.

## 🚀 Tech Stack

**Backend:**
* **Node.js:** JavaScript runtime for the server.
* **Express.js:** Minimalist web framework for API routes and middleware.
* **PostgreSQL:** Robust object-relational database for data storage.
* **Docker:** Containerization for the database.
* **JWT:** For secure authentication.
* **Bcrypt:** For password hashing.

**Frontend:**
* Vanilla HTML, CSS, JavaScript (Future plans to migrate to React).

## 🗄️ Database Schema

The application utilizes a relational database schema centered around `Users`, who own `Accounts`, `Categories`, and `Transactions`. Data integrity is enforced using foreign keys and `ON DELETE CASCADE` rules.

[//]: # (You can add an image of your ER Diagram here later if you wish)
## ⚙️ Setup and Installation

For detailed instructions on setting up the project locally, including environment variables, database setup, and running the application, please refer to the [`SETUP.md`](./SETUP.md) file.

## 💡 Future Enhancements

* Rebuild the frontend using a modern JavaScript framework (e.g., React, Vue, Angular).
* Integrate data visualization tools (e.g., D3.js, Chart.js) for insightful financial analytics.
* Implement recurring transactions.
* Deployment to a cloud platform (e.g., AWS, Azure, Heroku).

---
*Developed by [Your Name/Zenthoriax]*
Save README.md.

Optional: If you want to include your ER Diagram image, you'll need to upload that image to your repository (e.g., in a docs/ or images/ folder) and then uncomment and update the image path in the README.md.

Step 2: Update SETUP.md
This file should contain specific, step-by-step instructions for getting the project running locally.

Open SETUP.md in your VS Code editor.

Replace its entire content with the following:

Markdown

# Project Setup Guide

This guide will walk you through setting up the Personal Finance Tracker application locally on your machine.

## Prerequisites

Before you begin, ensure you have the following installed:

* **Node.js** (LTS version recommended)
* **npm** (comes with Node.js)
* **Docker Desktop** (for Windows/macOS) or **Docker Engine** (for Linux) - essential for the PostgreSQL database.
* **DBeaver** (or your preferred PostgreSQL client) - for database inspection.
* **Git**

## 1. Clone the Repository

First, clone the project to your local machine:

```bash
git clone [https://github.com/Zenthoriax/personal-finance-app.git](https://github.com/Zenthoriax/personal-finance-app.git)
cd personal-finance-app
2. Environment Variables
Create a .env file in the root of your project directory. This file will store sensitive information like database credentials and JWT secret.

PORT=3000

# PostgreSQL Database Configuration
DB_USER=myuser         # Replace with your desired PostgreSQL user
DB_PASSWORD=mypassword # Replace with your desired PostgreSQL password
DB_HOST=localhost      # For Docker, this will be the service name if using docker-compose
DB_PORT=5432
DB_DATABASE=personal_finance_db

# JWT Secret for authentication
JWT_SECRET=supersecretjwtkey # VERY IMPORTANT: Generate a strong, random key for production!
Important: Replace the placeholder values with your actual database user, password, and a strong JWT secret. Never commit your .env file to version control! (It's already in .gitignore).

3. Database Setup with Docker
The PostgreSQL database is containerized using Docker.

Start Docker Desktop/Engine.

Run the PostgreSQL container:

Bash

docker run --name personal-finance-postgres -e POSTGRES_USER=${DB_USER} -e POSTGRES_PASSWORD=${DB_PASSWORD} -p 5432:5432 -d postgres:14-alpine
Replace ${DB_USER} and ${DB_PASSWORD} with the values you set in your .env file.

--name personal-finance-postgres gives your container a recognizable name.

-e sets environment variables inside the container for PostgreSQL.

-p 5432:5432 maps the container's port 5432 to your host's port 5432.

-d runs the container in detached mode (in the background).

postgres:14-alpine specifies the PostgreSQL image and version.

Wait a moment for the database to fully start up inside the container. You can check its status with docker ps.

4. Install Dependencies
Install the necessary Node.js packages for the backend:

Bash

npm install
5. Initialize the Database Schema
After starting the PostgreSQL container, you need to create the tables.

Ensure your personal-finance-postgres Docker container is running.

You can use a database client like DBeaver to connect and run the schema script manually, or use a tool (if provided in your project) to automate this.

Using DBeaver:

Connect to PostgreSQL using localhost:5432, user ${DB_USER}, password ${DB_PASSWORD}, database personal_finance_db.

Open the database/schema.postgres.sql file.

Execute all queries in the script to create your tables.

6. Run the Application
Once the database is set up and dependencies are installed:

Bash

node server.js
Alternatively, if you're comfortable with PowerShell execution policies (or have bypassed them for the session): npm start

The server should start on http://localhost:3000 (or the port you specified in .env).

7. Access the Frontend
Open your web browser and navigate to:

http://localhost:3000
You should see the application's login/registration page.

Having trouble? Feel free to open an issue on GitHub!


