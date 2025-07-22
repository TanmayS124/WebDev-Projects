// Helper for localStorage
function getTransactions() {
  return JSON.parse(localStorage.getItem('transactions')) || [];
}
function setTransactions(transactions) {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

// State
let transactions = getTransactions();
console.log('Loaded transactions:', transactions);

// DOM elements
const transactionsUl = document.getElementById('transactions');
const balanceEl = document.getElementById('balance');
const incomeEl = document.getElementById('income');
const expenseEl = document.getElementById('expense');
const transactionForm = document.getElementById('transaction-form');
const descInput = document.getElementById('desc');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');

function renderTransactions() {
  console.log("RENDERING TRANSACTIONS", transactions); // ← Debug line

  transactionsUl.innerHTML = '';
  transactions.forEach((t, idx) => {
    const li = document.createElement('li');
    li.classList.add(t.amount > 0 ? 'income' : 'expense');
    li.innerHTML = `
      <span>${t.desc} [${t.category}]</span>
      <span>
        ${t.amount > 0 ? '+' : '-'}$${Math.abs(t.amount)} 
        <button class="del-btn" onclick="deleteTransaction(${idx})">&times;</button>
      </span>
    `;
    transactionsUl.appendChild(li);
  });
}


function renderSummary() {
  const amounts = transactions.map(t => t.amount);
  const totalIncome = amounts.filter(a => a > 0).reduce((a, b) => a + b, 0);
  const totalExpense = amounts.filter(a => a < 0).reduce((a, b) => a + b, 0);
  incomeEl.textContent = '$' + totalIncome;
  expenseEl.textContent = '$' + Math.abs(totalExpense);
  balanceEl.textContent = '$' + (totalIncome + totalExpense);
}
const centerTextPlugin = {
  id: 'centerText',
  beforeDraw: function(chart) {
    if (chart.config.type === 'doughnut') {
      const {width, height, ctx} = chart;
      ctx.restore();
      const fontSize = (height / 110).toFixed(2);
      ctx.font = `${fontSize}em Arial`;
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#2e86de';
      const text = 'Expenses';
      const textX = Math.round((width - ctx.measureText(text).width) / 2);
      const textY = height / 2;
      ctx.fillText(text, textX, textY);
      ctx.save();
    }
  }
};

function renderChart() {
  const expenseCats = {};
  transactions.forEach(t => {
    if (t.amount < 0 && t.category !== 'Income') {
      expenseCats[t.category] = (expenseCats[t.category] || 0) + Math.abs(t.amount);
    }
  });
  const categories = Object.keys(expenseCats);
  const values = Object.values(expenseCats);

  if (window.expChart) window.expChart.destroy();

  const ctx = document.getElementById('expenseChart').getContext('2d');
  window.expChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categories,
      datasets: [{
        data: values,
        backgroundColor: [
          '#54a0ff', '#5efc82', '#ff7675', '#ffe162', '#a29bfe', '#00b894', '#fdcb6e'
        ],
        borderWidth: 3,
        borderColor: '#fff',
        hoverOffset: 12,
      }]
    },
    options: {
      responsive: true,
      cutout: '60%',
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 14 } } },
        datalabels: {
          color: '#fff',
          font: { weight: 'bold', size: 16 },
          formatter: (value, ctx) => {
            let sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
            let percentage = sum ? (value * 100 / sum) : 0;
            return percentage ? percentage.toFixed(1) + '%' : '';
          },
          textAlign: 'center',
          display: true
        }
      }
    },
    plugins: [ChartDataLabels, centerTextPlugin]

  });
  
}


// Add Transaction Handler
transactionForm.onsubmit = function(e) {
  e.preventDefault();
  const desc = descInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const category = categoryInput.value;
  if (!desc || isNaN(amount) || !category) return;
  const amt = category === 'Income' ? Math.abs(amount) : -Math.abs(amount);
  transactions.push({ desc, amount: amt, category });
  setTransactions(transactions);
  console.log('Saved:', transactions);

  renderTransactions(); renderSummary(); renderChart();
  transactionForm.reset();
};

// Delete Transaction Handler
window.deleteTransaction = function(idx) {
  if (confirm('Delete this transaction?')) {
    transactions.splice(idx, 1);
    setTransactions(transactions);
    renderTransactions(); renderSummary(); renderChart();
  }
};

// Initial render
renderTransactions();
renderSummary();
renderChart();
