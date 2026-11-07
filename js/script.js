// ===== Storage =====
const STORAGE_KEY = 'spendwise-expenses';
let expenses = loadExpenses();

function isValidExpense(item) {
    return item
        && typeof item.id === 'number'
        && typeof item.title === 'string'
        && typeof item.amount === 'number'
        && typeof item.category === 'string'
        && typeof item.date === 'string';
}

function loadExpenses() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(data) ? data.filter(isValidExpense) : [];
    } catch (error) {
        return [];
    }
}

function saveExpenses() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    } catch (error) {
        showToast('Could not save data. Browser storage may be full or blocked.', 'error');
    }
}

// ===== Helpers =====
function todayString() {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
}

function formatAmount(value) {
    return 'Rs ' + value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

// ===== Toast messages =====
const toast = document.getElementById('toast');
let toastTimer;

function showToast(text, type = 'success') {
    toast.textContent = text;
    toast.className = 'toast show ' + type;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== Form =====
const form = document.getElementById('expenseForm');
const titleInput = document.getElementById('title');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const dateInput = document.getElementById('date');

function showError(input, message) {
    document.getElementById(input.id + 'Error').textContent = message;
    input.classList.add('invalid');
}

function clearErrors() {
    form.querySelectorAll('.error-text').forEach(el => { el.textContent = ''; });
    form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
}

function validateForm() {
    clearErrors();
    let valid = true;

    const title = titleInput.value.trim();
    const amount = parseFloat(amountInput.value);

    if (title.length < 3) {
        showError(titleInput, 'Title must be at least 3 characters.');
        valid = false;
    }

    if (isNaN(amount) || amount <= 0) {
        showError(amountInput, 'Enter an amount greater than 0.');
        valid = false;
    } else if (amount > 10000000) {
        showError(amountInput, 'Amount is too large.');
        valid = false;
    }

    if (!categoryInput.value) {
        showError(categoryInput, 'Please select a category.');
        valid = false;
    }

    if (!dateInput.value) {
        showError(dateInput, 'Please choose a date.');
        valid = false;
    } else if (dateInput.value > todayString()) {
        showError(dateInput, 'Date cannot be in the future.');
        valid = false;
    }

    return valid;
}

function resetForm() {
    form.reset();
    dateInput.value = todayString();
    clearErrors();
}

// Remove a field's error as soon as the user edits it
[titleInput, amountInput, categoryInput, dateInput].forEach(input => {
    input.addEventListener('input', () => {
        input.classList.remove('invalid');
        document.getElementById(input.id + 'Error').textContent = '';
    });
});

form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validateForm()) {
        showToast('Please fix the errors in the form.', 'error');
        return;
    }

    expenses.push({
        id: Date.now(),
        title: titleInput.value.trim(),
        amount: Math.round(parseFloat(amountInput.value) * 100) / 100,
        category: categoryInput.value,
        date: dateInput.value
    });

    saveExpenses();
    resetForm();
    showToast('Expense added successfully!');
});

dateInput.value = todayString();
dateInput.max = todayString();
updateUI();
// ===== Expense list =====
const expenseList = document.getElementById('expenseList');
const emptyState = document.getElementById('emptyState');

function getVisibleExpenses() {

    return [...expenses].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}

function renderExpenses() {
    const visible = getVisibleExpenses();
    expenseList.innerHTML = '';

    emptyState.hidden = visible.length > 0;
    emptyState.textContent = expenses.length === 0
        ? 'No expenses yet. Add your first one using the form.'
        : 'No expenses match your search or filter.';

    visible.forEach(expense => {
        const li = document.createElement('li');
        li.className = 'expense-item';
        li.dataset.id = expense.id;
        li.innerHTML = `
      <div class="expense-info">
        <h3 class="expense-title"></h3>
        <p class="expense-meta"><span class="tag"></span><span class="expense-date"></span></p>
      </div>
      <div class="expense-side">
        <strong class="expense-amount"></strong>
        <div class="expense-actions">
          <button class="icon-btn delete-btn" aria-label="Delete expense">🗑️</button>
        </div>
      </div>`;

        // textContent (not innerHTML) keeps user text safe from HTML injection
        li.querySelector('.expense-title').textContent = expense.title;
        li.querySelector('.tag').textContent = expense.category;
        li.querySelector('.expense-date').textContent = formatDate(expense.date);
        li.querySelector('.expense-amount').textContent = formatAmount(expense.amount);

        expenseList.appendChild(li);
    });
}

function updateUI() {
    renderExpenses();
    renderSummary();
}

function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    expenses = expenses.filter(item => item.id !== id);
    saveExpenses();
    updateUI();
    showToast('Expense deleted.');
    resetForm();
}


expenseList.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.delete-btn');
    if (!deleteBtn) return;
    deleteExpense(Number(deleteBtn.closest('.expense-item').dataset.id));
});

const totalAmountEl = document.getElementById('totalAmount');
const totalCountEl = document.getElementById('totalCount');
const topCategoryEl = document.getElementById('topCategory');
const monthTotalEl = document.getElementById('monthTotal');

function renderSummary() {
    const totalAmount = expenses.reduce((sum, item) => sum + item.amount, 0);
    totalAmountEl.textContent = formatAmount(totalAmount);
    const totalCount = expenses.length;
    totalCountEl.textContent = totalCount;

    const totals = {};
    expenses.forEach(item => {
        totals[item.category] = (totals[item.category] || 0) + item.amount;
    });

    const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
    topCategoryEl.textContent = top ? `${top[0]} (${formatAmount(top[1])})` : '—';

    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const monthTotal = expenses
        .filter(item => item.date.startsWith(monthPrefix))
        .reduce((sum, item) => sum + item.amount, 0);
    monthTotalEl.textContent = formatAmount(monthTotal);
}

// Additional summary calculations can be added here
document.getElementById('year').textContent = new Date().getFullYear();