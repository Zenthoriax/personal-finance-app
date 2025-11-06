// Main Application JavaScript
const API_URL = 'http://localhost:3000/api';

// Check authentication
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'index.html';
}

// API helper function
async function apiCall(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    });
    
    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        window.location.href = 'index.html';
        return null;
    }
    
    return response.json();
}

// Navigation
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const section = tab.dataset.section;
        
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update active section
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        document.getElementById(`${section}-section`).classList.add('active');
        
        // Load section data
        loadSectionData(section);
    });
});

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    window.location.href = 'index.html';
});

// Modal
const modal = document.getElementById('modal');
const closeModal = document.querySelector('.close');

closeModal.addEventListener('click', () => {
    modal.classList.remove('show');
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('show');
    }
});

// Load dashboard stats
async function loadDashboard() {
    try {
        const data = await apiCall('/dashboard');
        if (data) {
            document.getElementById('total-balance').textContent = formatCurrency(data.totalBalance);
            document.getElementById('monthly-income').textContent = formatCurrency(data.monthlyIncome);
            document.getElementById('monthly-expense').textContent = formatCurrency(data.monthlyExpense);
            document.getElementById('active-goals').textContent = data.activeGoals;
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Load transactions
async function loadTransactions() {
    try {
        const transactions = await apiCall('/transactions');
        if (transactions) {
            const tbody = document.getElementById('transactions-table-body');
            tbody.innerHTML = '';
            
            if (transactions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No transactions found</td></tr>';
                return;
            }
            
            transactions.forEach(transaction => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${formatDate(transaction.transaction_date)}</td>
                    <td><span class="badge ${transaction.transaction_type}">${transaction.transaction_type}</span></td>
                    <td>${transaction.category_name}</td>
                    <td>${transaction.account_name}</td>
                    <td class="${transaction.transaction_type}">${formatCurrency(transaction.amount)}</td>
                    <td>${transaction.description || '-'}</td>
                    <td>
                        <button class="btn-edit" onclick="editTransaction(${transaction.transaction_id})">Edit</button>
                        <button class="btn-danger" onclick="deleteTransaction(${transaction.transaction_id})">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// Load accounts
async function loadAccounts() {
    try {
        const accounts = await apiCall('/accounts');
        if (accounts) {
            const tbody = document.getElementById('accounts-table-body');
            tbody.innerHTML = '';
            
            if (accounts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No accounts found</td></tr>';
                return;
            }
            
            accounts.forEach(account => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${account.account_name}</td>
                    <td>${account.account_type}</td>
                    <td>${formatCurrency(account.balance)}</td>
                    <td>
                        <button class="btn-edit" onclick="editAccount(${account.account_id})">Edit</button>
                        <button class="btn-danger" onclick="deleteAccount(${account.account_id})">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading accounts:', error);
    }
}

// Load categories
async function loadCategories() {
    try {
        const categories = await apiCall('/categories');
        if (categories) {
            const tbody = document.getElementById('categories-table-body');
            tbody.innerHTML = '';
            
            if (categories.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="empty-state">No categories found</td></tr>';
                return;
            }
            
            categories.forEach(category => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${category.category_name}</td>
                    <td><span class="badge ${category.category_type}">${category.category_type}</span></td>
                    <td>
                        <button class="btn-danger" onclick="deleteCategory(${category.category_id})">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load budgets
async function loadBudgets() {
    try {
        const budgets = await apiCall('/budgets');
        if (budgets) {
            const tbody = document.getElementById('budgets-table-body');
            tbody.innerHTML = '';
            
            if (budgets.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No budgets found</td></tr>';
                return;
            }
            
            budgets.forEach(budget => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${budget.category_name}</td>
                    <td>${formatCurrency(budget.budget_amount)}</td>
                    <td>${formatDate(budget.period_start)}</td>
                    <td>${formatDate(budget.period_end)}</td>
                    <td>
                        <button class="btn-edit" onclick="editBudget(${budget.budget_id})">Edit</button>
                        <button class="btn-danger" onclick="deleteBudget(${budget.budget_id})">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading budgets:', error);
    }
}

// Load goals
async function loadGoals() {
    try {
        const goals = await apiCall('/goals');
        if (goals) {
            const tbody = document.getElementById('goals-table-body');
            tbody.innerHTML = '';
            
            if (goals.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No goals found</td></tr>';
                return;
            }
            
            goals.forEach(goal => {
                const progress = (goal.current_amount / goal.target_amount) * 100;
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${goal.goal_name}</td>
                    <td>${formatCurrency(goal.target_amount)}</td>
                    <td>${formatCurrency(goal.current_amount)}</td>
                    <td>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                        </div>
                        <span style="font-size: 12px; color: var(--text-secondary);">${Math.round(progress)}%</span>
                    </td>
                    <td>${goal.target_date ? formatDate(goal.target_date) : '-'}</td>
                    <td><span class="badge ${goal.status}">${goal.status}</span></td>
                    <td>
                        <button class="btn-edit" onclick="editGoal(${goal.goal_id})">Edit</button>
                        <button class="btn-danger" onclick="deleteGoal(${goal.goal_id})">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading goals:', error);
    }
}

// Load section data
function loadSectionData(section) {
    switch(section) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'transactions':
            loadTransactions();
            break;
        case 'accounts':
            loadAccounts();
            break;
        case 'categories':
            loadCategories();
            break;
        case 'budgets':
            loadBudgets();
            break;
        case 'goals':
            loadGoals();
            break;
    }
}

// Add Transaction
document.getElementById('add-transaction-btn').addEventListener('click', async () => {
    const accounts = await apiCall('/accounts');
    const categories = await apiCall('/categories');
    
    if (!accounts || !categories) return;
    
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3>Add Transaction</h3>
        <form id="transaction-form">
            <div class="form-group">
                <label>Account</label>
                <select id="transaction-account" required>
                    <option value="">Select Account</option>
                    ${accounts.map(a => `<option value="${a.account_id}">${a.account_name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Category</label>
                <select id="transaction-category" required>
                    <option value="">Select Category</option>
                    ${categories.map(c => `<option value="${c.category_id}">${c.category_name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Type</label>
                <select id="transaction-type" required>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                </select>
            </div>
            <div class="form-group">
                <label>Amount</label>
                <input type="number" id="transaction-amount" step="0.01" required>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="transaction-description"></textarea>
            </div>
            <div class="form-group">
                <label>Date</label>
                <input type="date" id="transaction-date" required>
            </div>
            <button type="submit" class="btn-primary">Add Transaction</button>
        </form>
    `;
    
    document.getElementById('transaction-date').valueAsDate = new Date();
    modal.classList.add('show');
    
    document.getElementById('transaction-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            account_id: document.getElementById('transaction-account').value,
            category_id: document.getElementById('transaction-category').value,
            transaction_type: document.getElementById('transaction-type').value,
            amount: parseFloat(document.getElementById('transaction-amount').value),
            description: document.getElementById('transaction-description').value,
            transaction_date: document.getElementById('transaction-date').value
        };
        
        const result = await apiCall('/transactions', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (result) {
            modal.classList.remove('show');
            loadTransactions();
            loadDashboard();
            loadAccounts();
        }
    });
});

// Add Account
document.getElementById('add-account-btn').addEventListener('click', () => {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3>Add Account</h3>
        <form id="account-form">
            <div class="form-group">
                <label>Account Name</label>
                <input type="text" id="account-name" required>
            </div>
            <div class="form-group">
                <label>Account Type</label>
                <input type="text" id="account-type" placeholder="e.g., Savings, Checking, Credit Card" required>
            </div>
            <div class="form-group">
                <label>Initial Balance</label>
                <input type="number" id="account-balance" step="0.01" value="0" required>
            </div>
            <button type="submit" class="btn-primary">Add Account</button>
        </form>
    `;
    modal.classList.add('show');
    
    document.getElementById('account-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            account_name: document.getElementById('account-name').value,
            account_type: document.getElementById('account-type').value,
            balance: parseFloat(document.getElementById('account-balance').value)
        };
        
        const result = await apiCall('/accounts', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (result) {
            modal.classList.remove('show');
            loadAccounts();
        }
    });
});

// Add Category
document.getElementById('add-category-btn').addEventListener('click', () => {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3>Add Category</h3>
        <form id="category-form">
            <div class="form-group">
                <label>Category Name</label>
                <input type="text" id="category-name" required>
            </div>
            <div class="form-group">
                <label>Type</label>
                <select id="category-type" required>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                </select>
            </div>
            <button type="submit" class="btn-primary">Add Category</button>
        </form>
    `;
    modal.classList.add('show');
    
    document.getElementById('category-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            category_name: document.getElementById('category-name').value,
            category_type: document.getElementById('category-type').value
        };
        
        const result = await apiCall('/categories', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (result) {
            modal.classList.remove('show');
            loadCategories();
        }
    });
});

// Add Budget
document.getElementById('add-budget-btn').addEventListener('click', async () => {
    const categories = await apiCall('/categories');
    if (!categories) return;
    
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3>Add Budget</h3>
        <form id="budget-form">
            <div class="form-group">
                <label>Category</label>
                <select id="budget-category" required>
                    <option value="">Select Category</option>
                    ${categories.map(c => `<option value="${c.category_id}">${c.category_name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Budget Amount</label>
                <input type="number" id="budget-amount" step="0.01" required>
            </div>
            <div class="form-group">
                <label>Start Date</label>
                <input type="date" id="budget-start" required>
            </div>
            <div class="form-group">
                <label>End Date</label>
                <input type="date" id="budget-end" required>
            </div>
            <button type="submit" class="btn-primary">Add Budget</button>
        </form>
    `;
    modal.classList.add('show');
    
    document.getElementById('budget-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            category_id: document.getElementById('budget-category').value,
            budget_amount: parseFloat(document.getElementById('budget-amount').value),
            period_start: document.getElementById('budget-start').value,
            period_end: document.getElementById('budget-end').value
        };
        
        const result = await apiCall('/budgets', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (result) {
            modal.classList.remove('show');
            loadBudgets();
        }
    });
});

// Add Goal
document.getElementById('add-goal-btn').addEventListener('click', () => {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3>Add Goal</h3>
        <form id="goal-form">
            <div class="form-group">
                <label>Goal Name</label>
                <input type="text" id="goal-name" required>
            </div>
            <div class="form-group">
                <label>Target Amount</label>
                <input type="number" id="goal-target" step="0.01" required>
            </div>
            <div class="form-group">
                <label>Current Amount</label>
                <input type="number" id="goal-current" step="0.01" value="0" required>
            </div>
            <div class="form-group">
                <label>Target Date</label>
                <input type="date" id="goal-date">
            </div>
            <div class="form-group">
                <label>Status</label>
                <select id="goal-status">
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>
            <button type="submit" class="btn-primary">Add Goal</button>
        </form>
    `;
    modal.classList.add('show');
    
    document.getElementById('goal-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            goal_name: document.getElementById('goal-name').value,
            target_amount: parseFloat(document.getElementById('goal-target').value),
            current_amount: parseFloat(document.getElementById('goal-current').value),
            target_date: document.getElementById('goal-date').value || null,
            status: document.getElementById('goal-status').value
        };
        
        const result = await apiCall('/goals', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (result) {
            modal.classList.remove('show');
            loadGoals();
            loadDashboard();
        }
    });
});

// Edit functions
window.editTransaction = async (id) => {
    const transaction = (await apiCall('/transactions')).find(t => t.transaction_id === id);
    const accounts = await apiCall('/accounts');
    const categories = await apiCall('/categories');
    
    if (!transaction || !accounts || !categories) return;
    
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3>Edit Transaction</h3>
        <form id="transaction-form">
            <div class="form-group">
                <label>Account</label>
                <select id="transaction-account" required>
                    ${accounts.map(a => `<option value="${a.account_id}" ${a.account_id == transaction.account_id ? 'selected' : ''}>${a.account_name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Category</label>
                <select id="transaction-category" required>
                    ${categories.map(c => `<option value="${c.category_id}" ${c.category_id == transaction.category_id ? 'selected' : ''}>${c.category_name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Type</label>
                <select id="transaction-type" required>
                    <option value="income" ${transaction.transaction_type === 'income' ? 'selected' : ''}>Income</option>
                    <option value="expense" ${transaction.transaction_type === 'expense' ? 'selected' : ''}>Expense</option>
                </select>
            </div>
            <div class="form-group">
                <label>Amount</label>
                <input type="number" id="transaction-amount" step="0.01" value="${transaction.amount}" required>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="transaction-description">${transaction.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Date</label>
                <input type="date" id="transaction-date" value="${transaction.transaction_date}" required>
            </div>
            <button type="submit" class="btn-primary">Update Transaction</button>
        </form>
    `;
    modal.classList.add('show');
    
    document.getElementById('transaction-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            account_id: document.getElementById('transaction-account').value,
            category_id: document.getElementById('transaction-category').value,
            transaction_type: document.getElementById('transaction-type').value,
            amount: parseFloat(document.getElementById('transaction-amount').value),
            description: document.getElementById('transaction-description').value,
            transaction_date: document.getElementById('transaction-date').value
        };
        
        const result = await apiCall(`/transactions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        
        if (result) {
            modal.classList.remove('show');
            loadTransactions();
            loadDashboard();
            loadAccounts();
        }
    });
};

window.editAccount = async (id) => {
    const accounts = await apiCall('/accounts');
    const account = accounts.find(a => a.account_id === id);
    
    if (!account) return;
    
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3>Edit Account</h3>
        <form id="account-form">
            <div class="form-group">
                <label>Account Name</label>
                <input type="text" id="account-name" value="${account.account_name}" required>
            </div>
            <div class="form-group">
                <label>Account Type</label>
                <input type="text" id="account-type" value="${account.account_type}" required>
            </div>
            <div class="form-group">
                <label>Balance</label>
                <input type="number" id="account-balance" step="0.01" value="${account.balance}" required>
            </div>
            <button type="submit" class="btn-primary">Update Account</button>
        </form>
    `;
    modal.classList.add('show');
    
    document.getElementById('account-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            account_name: document.getElementById('account-name').value,
            account_type: document.getElementById('account-type').value,
            balance: parseFloat(document.getElementById('account-balance').value)
        };
        
        const result = await apiCall(`/accounts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        
        if (result) {
            modal.classList.remove('show');
            loadAccounts();
        }
    });
};

window.editBudget = async (id) => {
    const budgets = await apiCall('/budgets');
    const budget = budgets.find(b => b.budget_id === id);
    const categories = await apiCall('/categories');
    
    if (!budget || !categories) return;
    
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3>Edit Budget</h3>
        <form id="budget-form">
            <div class="form-group">
                <label>Category</label>
                <select id="budget-category" required>
                    ${categories.map(c => `<option value="${c.category_id}" ${c.category_id == budget.category_id ? 'selected' : ''}>${c.category_name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Budget Amount</label>
                <input type="number" id="budget-amount" step="0.01" value="${budget.budget_amount}" required>
            </div>
            <div class="form-group">
                <label>Start Date</label>
                <input type="date" id="budget-start" value="${budget.period_start}" required>
            </div>
            <div class="form-group">
                <label>End Date</label>
                <input type="date" id="budget-end" value="${budget.period_end}" required>
            </div>
            <button type="submit" class="btn-primary">Update Budget</button>
        </form>
    `;
    modal.classList.add('show');
    
    document.getElementById('budget-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            category_id: document.getElementById('budget-category').value,
            budget_amount: parseFloat(document.getElementById('budget-amount').value),
            period_start: document.getElementById('budget-start').value,
            period_end: document.getElementById('budget-end').value
        };
        
        const result = await apiCall(`/budgets/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        
        if (result) {
            modal.classList.remove('show');
            loadBudgets();
        }
    });
};

window.editGoal = async (id) => {
    const goals = await apiCall('/goals');
    const goal = goals.find(g => g.goal_id === id);
    
    if (!goal) return;
    
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3>Edit Goal</h3>
        <form id="goal-form">
            <div class="form-group">
                <label>Goal Name</label>
                <input type="text" id="goal-name" value="${goal.goal_name}" required>
            </div>
            <div class="form-group">
                <label>Target Amount</label>
                <input type="number" id="goal-target" step="0.01" value="${goal.target_amount}" required>
            </div>
            <div class="form-group">
                <label>Current Amount</label>
                <input type="number" id="goal-current" step="0.01" value="${goal.current_amount}" required>
            </div>
            <div class="form-group">
                <label>Target Date</label>
                <input type="date" id="goal-date" value="${goal.target_date || ''}">
            </div>
            <div class="form-group">
                <label>Status</label>
                <select id="goal-status">
                    <option value="active" ${goal.status === 'active' ? 'selected' : ''}>Active</option>
                    <option value="completed" ${goal.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${goal.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </div>
            <button type="submit" class="btn-primary">Update Goal</button>
        </form>
    `;
    modal.classList.add('show');
    
    document.getElementById('goal-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            goal_name: document.getElementById('goal-name').value,
            target_amount: parseFloat(document.getElementById('goal-target').value),
            current_amount: parseFloat(document.getElementById('goal-current').value),
            target_date: document.getElementById('goal-date').value || null,
            status: document.getElementById('goal-status').value
        };
        
        const result = await apiCall(`/goals/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        
        if (result) {
            modal.classList.remove('show');
            loadGoals();
            loadDashboard();
        }
    });
};

// Delete functions
window.deleteTransaction = async (id) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
        const result = await apiCall(`/transactions/${id}`, { method: 'DELETE' });
        if (result) {
            loadTransactions();
            loadDashboard();
            loadAccounts();
        }
    }
};

window.deleteAccount = async (id) => {
    if (confirm('Are you sure you want to delete this account? All related transactions will be deleted.')) {
        const result = await apiCall(`/accounts/${id}`, { method: 'DELETE' });
        if (result) {
            loadAccounts();
        }
    }
};

window.deleteCategory = async (id) => {
    if (confirm('Are you sure you want to delete this category? All related transactions and budgets will be deleted.')) {
        const result = await apiCall(`/categories/${id}`, { method: 'DELETE' });
        if (result) {
            loadCategories();
            loadBudgets();
        }
    }
};

window.deleteBudget = async (id) => {
    if (confirm('Are you sure you want to delete this budget?')) {
        const result = await apiCall(`/budgets/${id}`, { method: 'DELETE' });
        if (result) {
            loadBudgets();
        }
    }
};

window.deleteGoal = async (id) => {
    if (confirm('Are you sure you want to delete this goal?')) {
        const result = await apiCall(`/goals/${id}`, { method: 'DELETE' });
        if (result) {
            loadGoals();
            loadDashboard();
        }
    }
};

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount || 0);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Add badge styles
const style = document.createElement('style');
style.textContent = `
    .badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        text-transform: uppercase;
        font-weight: 500;
        letter-spacing: 0.5px;
    }
    .badge.income {
        background-color: rgba(74, 222, 128, 0.2);
        color: var(--income);
    }
    .badge.expense {
        background-color: rgba(248, 113, 113, 0.2);
        color: var(--expense);
    }
    .badge.active {
        background-color: rgba(74, 158, 255, 0.2);
        color: var(--accent);
    }
    .badge.completed {
        background-color: rgba(74, 222, 128, 0.2);
        color: var(--income);
    }
    .badge.cancelled {
        background-color: rgba(107, 114, 128, 0.2);
        color: var(--text-secondary);
    }
    td.income {
        color: var(--income);
    }
    td.expense {
        color: var(--expense);
    }
`;
document.head.appendChild(style);

// Load dashboard on page load
loadDashboard();

