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
document.getElementById('year').textContent = new Date().getFullYear();