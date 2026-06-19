/**
 * Dashboard UI interactions and charts management
 */
let categoryChartInstance = null;
let trendChartInstance = null;
let currentPage = 1;
const limitPerPage = 5;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Enforce login status
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/';
    return;
  }

  // 2. Initial load
  await refreshDashboard();

  // 3. Goal Modal Bindings
  const editGoalBtn = document.getElementById('edit-goal-btn');
  const goalModal = document.getElementById('goal-modal');
  const closeGoalBtn = document.getElementById('close-goal-btn');
  const goalForm = document.getElementById('goal-form');

  if (editGoalBtn) {
    editGoalBtn.addEventListener('click', () => {
      const currentGoal = parseFloat(document.getElementById('carbon-goal-val').textContent);
      document.getElementById('input-goal-val').value = isNaN(currentGoal) ? 500 : currentGoal;
      goalModal.style.display = 'flex';
    });
  }

  if (closeGoalBtn) {
    closeGoalBtn.addEventListener('click', () => { goalModal.style.display = 'none'; });
  }

  if (goalForm) {
    goalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const goalVal = parseFloat(document.getElementById('input-goal-val').value);
      try {
        const response = await API.auth.updateGoal(goalVal);
        if (response.success) {
          document.getElementById('carbon-goal-val').textContent = `${goalVal.toFixed(1)} kg`;
          goalModal.style.display = 'none';
          await refreshDashboard(); // Redo metrics comparison
        }
      } catch (err) {
        alert(err.message || 'Failed to update goal');
      }
    });
  }

  // 4. Achievement Modal Close Binding
  const closeAchBtn = document.getElementById('close-ach-btn');
  if (closeAchBtn) {
    closeAchBtn.addEventListener('click', () => {
      document.getElementById('achievement-modal').style.display = 'none';
    });
  }
});

/**
 * Refreshes dashboard statistics, charts, history feed, and AI recommendations
 */
async function refreshDashboard() {
  try {
    // 1. Fetch profile & streak info
    const profile = await API.auth.getProfile();
    const user = profile.user;
    
    document.getElementById('user-display-name').textContent = user.username;
    document.getElementById('streak-days-count').textContent = user.streak_days;
    document.getElementById('carbon-goal-val').textContent = `${user.carbon_goal.toFixed(1)} kg`;
    document.getElementById('badge-count-val').textContent = profile.achievements.length;

    // Trigger achievements celebration if newly unlocked in getProfile refresh
    if (profile.newAchievements && profile.newAchievements.length > 0) {
      showAchievementUnlocked(profile.newAchievements[0]);
    }

    // 2. Fetch footprint stats
    const stats = await API.footprint.getSummary(30);
    document.getElementById('total-carbon-val').textContent = `${stats.totalEmissions.toFixed(1)} kg`;
    
    // Set status description relative to goal
    const relativeDesc = document.getElementById('carbon-relative-desc');
    const difference = user.carbon_goal - stats.totalEmissions;
    if (difference >= 0) {
      relativeDesc.textContent = `${difference.toFixed(1)} kg remaining of budget`;
      relativeDesc.style.color = 'var(--color-primary)';
    } else {
      relativeDesc.textContent = `${Math.abs(difference).toFixed(1)} kg over monthly target`;
      relativeDesc.style.color = 'var(--color-danger)';
    }

    // Render charts
    renderCharts(stats);

    // 3. Render log feed
    await loadHistoryLogs();

    // 4. Load AI recommendations
    await loadAIRecommendations();

  } catch (err) {
    console.error('Failed to load dashboard metrics', err);
  }
}

/**
 * Render Pie and Line charts with Chart.js
 */
function renderCharts(stats) {
  const ctxCat = document.getElementById('categoryChart');
  const ctxTrend = document.getElementById('trendChart');
  
  if (!ctxCat || !ctxTrend) return;

  // Destroy existing charts to prevent canvas overlays
  if (categoryChartInstance) categoryChartInstance.destroy();
  if (trendChartInstance) trendChartInstance.destroy();

  // 1. Process Category Breakdown Data
  const categories = ['transport', 'energy', 'food', 'consumption'];
  const categoryLabels = ['Transport', 'Home Energy', 'Diet', 'Consumption'];
  const categoryValues = [0, 0, 0, 0];

  stats.breakdown.forEach(item => {
    const idx = categories.indexOf(item.category);
    if (idx !== -1) {
      categoryValues[idx] = item.total_carbon_kg;
    }
  });

  const hasData = categoryValues.some(v => v > 0);

  // Setup Pie Chart
  categoryChartInstance = new Chart(ctxCat, {
    type: 'doughnut',
    data: {
      labels: categoryLabels,
      datasets: [{
        data: hasData ? categoryValues : [1, 1, 1, 1], // uniform weights if no data
        backgroundColor: [
          'rgba(245, 158, 11, 0.7)',  /* warning/transport */
          'rgba(59, 130, 246, 0.7)',  /* accent/energy */
          'rgba(239, 68, 68, 0.7)',   /* danger/food */
          'rgba(16, 185, 129, 0.7)'   /* primary/consumption */
        ],
        borderColor: 'rgba(9, 13, 22, 1)',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#9ca3af', font: { family: 'Outfit', size: 11 } }
        },
        tooltip: {
          enabled: hasData, // Disable tooltips if placeholder
          callbacks: {
            label: (context) => `${context.label}: ${context.raw.toFixed(1)} kg CO2e`
          }
        }
      },
      cutout: '70%'
    }
  });

  // 2. Process Daily Trends Data
  const trendLabels = [];
  const trendValues = [];

  stats.trends.forEach(item => {
    trendLabels.push(item.date.split('-').slice(1).join('/')); // Format MM/DD
    trendValues.push(item.total_carbon_kg);
  });

  if (trendLabels.length === 0) {
    trendLabels.push('No Logs');
    trendValues.push(0);
  }

  // Setup Line Chart
  trendChartInstance = new Chart(ctxTrend, {
    type: 'line',
    data: {
      labels: trendLabels,
      datasets: [{
        label: 'Daily CO2 (kg)',
        data: trendValues,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.3,
        borderWidth: 2.5,
        pointBackgroundColor: '#10b981'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#6b7280', font: { family: 'Outfit' } } },
        y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#6b7280', font: { family: 'Outfit' } }, beginAtZero: true }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

/**
 * Loads paginated user history logs list
 */
async function loadHistoryLogs() {
  const container = document.getElementById('activity-log-container');
  const pagControls = document.getElementById('pagination-controls');
  if (!container) return;

  try {
    const listRes = await API.footprint.list(currentPage, limitPerPage);
    const logs = listRes.data;

    if (logs.length === 0 && currentPage === 1) {
      container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 20px 0;">No logs registered yet.</p>';
      pagControls.innerHTML = '';
      return;
    }

    let html = '';
    logs.forEach(log => {
      const isLow = log.carbon_kg <= 2.0;
      const dateFormatted = new Date(log.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
      });

      // Capitalize category
      const categoryName = log.category.charAt(0).toUpperCase() + log.category.slice(1);
      const subcategoryLabel = log.sub_category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      html += `
        <div class="history-item ${isLow ? 'low-emission' : ''}">
          <div class="history-details">
            <h4>${subcategoryLabel}</h4>
            <p>${categoryName} &bull; ${log.value} ${log.unit} &bull; ${dateFormatted}</p>
            ${log.notes ? `<p style="font-style: italic; color: var(--text-muted); margin-top: 4px;">"${log.notes}"</p>` : ''}
          </div>
          <div style="display: flex; align-items: center;">
            <div class="history-emissions">
              <span class="history-kg">${log.carbon_kg.toFixed(1)} kg</span>
              <div style="font-size: 0.65rem; color: var(--text-muted);">CO2e</div>
            </div>
            <button class="history-delete-btn" onclick="deleteLogEntry(${log.id})" aria-label="Delete log entry">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Render pagination controls
    let pagHtml = '';
    const hasNext = logs.length === limitPerPage; // simple indicator
    
    if (currentPage > 1 || hasNext) {
      pagHtml = `
        <button class="btn btn-secondary" style="padding: 5px 12px; font-size: 0.8rem;" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(-1)">Previous</button>
        <span style="font-size: 0.85rem; color: var(--text-secondary);">Page ${currentPage}</span>
        <button class="btn btn-secondary" style="padding: 5px 12px; font-size: 0.8rem;" ${!hasNext ? 'disabled' : ''} onclick="changePage(1)">Next</button>
      `;
    }
    pagControls.innerHTML = pagHtml;

  } catch (err) {
    console.error('Failed to load logs list', err);
  }
}

async function changePage(offset) {
  currentPage += offset;
  await loadHistoryLogs();
}

/**
 * Handle delete action
 */
async function deleteLogEntry(id) {
  if (!confirm('Are you sure you want to delete this activity log?')) return;

  try {
    const res = await API.footprint.delete(id);
    if (res.success) {
      await refreshDashboard();
    }
  } catch (err) {
    alert(err.message || 'Failed to delete log');
  }
}

/**
 * Loads AI recommendation insights list
 */
async function loadAIRecommendations() {
  const container = document.getElementById('ai-insights-container');
  if (!container) return;

  try {
    const res = await API.insights.get();
    const insights = res.data;

    let html = `
      <p style="color: var(--text-primary); font-weight: 500; font-size: 0.95rem; margin-bottom: 20px; line-height: 1.4;">
        ${insights.summary}
      </p>
    `;

    if (insights.recommendations && insights.recommendations.length > 0) {
      html += '<div style="display: flex; flex-direction: column; gap: 15px;">';
      insights.recommendations.forEach(rec => {
        html += `
          <div class="card insight-card ${rec.category}">
            <div class="insight-header">
              <h3 class="insight-title">${rec.title}</h3>
              <span class="insight-saving">-${rec.potential_saving_kg.toFixed(0)} kg CO2e</span>
            </div>
            <p class="insight-body">${rec.description}</p>
            <div class="insight-action">
              <strong>Action Plan:</strong> ${rec.action_plan}
            </div>
            <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
              <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.75rem;" onclick="logRecommendationAction('${rec.category}', '${rec.id}', ${rec.potential_saving_kg})">Mark Done</button>
            </div>
          </div>
        `;
      });
      html += '</div>';
    }

    container.innerHTML = html;
  } catch (err) {
    console.error('Failed to load recommendations', err);
    container.innerHTML = '<p style="color: var(--color-danger); font-size: 0.9rem;">Unable to load AI insights at this time.</p>';
  }
}

/**
 * Log positive carbon offset action from recommendation cards
 */
async function logRecommendationAction(category, recId, savingKg) {
  // Let's create an offset entry. In our system, recycled waste has a negative factor.
  // Or we can log a note indicating they completed a reduction task.
  // We log under 'consumption' / 'recycled_waste' to credit them, or log with a note!
  // Let's log it with a value that creates a carbon-neutral or reduction action!
  let data = {
    category: 'consumption',
    subCategory: 'recycled_waste',
    value: Math.ceil(savingKg / 0.35), // matching factor in constants (-0.35) to award equivalent carbon reduction!
    unit: 'kg',
    date: new Date().toISOString().split('T')[0],
    notes: `Completed: ${recId.split('_').slice(1).join(' ')}`
  };

  try {
    const res = await API.footprint.create(data);
    if (res.success) {
      alert(`Awesome! You cut your footprint by ${savingKg} kg CO2e!`);
      
      // Celebrate achievement unlocked if any
      if (res.newAchievements && res.newAchievements.length > 0) {
        showAchievementUnlocked(res.newAchievements[0]);
      }
      
      await refreshDashboard();
    }
  } catch (err) {
    alert(err.message || 'Failed to log action');
  }
}

/**
 * Logs a standard activity instantly from Quick Log buttons
 */
async function quickLog(category, subCategory, value, unit, notes) {
  const today = new Date().toISOString().split('T')[0];
  const data = { category, subCategory, value, unit, date: today, notes };

  try {
    const res = await API.footprint.create(data);
    if (res.success) {
      // Celebrate achievement unlocked if any
      if (res.newAchievements && res.newAchievements.length > 0) {
        showAchievementUnlocked(res.newAchievements[0]);
      }
      
      await refreshDashboard();
    }
  } catch (err) {
    alert(err.message || 'Failed to log activity');
  }
}

/**
 * Display the achievement unlocked modal celebrating user milestones
 */
function showAchievementUnlocked(achievement) {
  const modal = document.getElementById('achievement-modal');
  const details = document.getElementById('unlocked-badge-details');
  if (!modal || !details) return;

  details.innerHTML = `
    <div style="font-size: 3rem; margin-bottom: 5px;">${achievement.icon || '⭐'}</div>
    <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--text-primary);">${achievement.name}</h3>
    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 5px;">${achievement.description}</p>
    <div style="display: inline-block; margin-top: 12px; background: var(--color-warning); color: var(--bg-primary); font-weight: 700; padding: 2px 10px; border-radius: 4px; font-size: 0.75rem;">
      +${achievement.points} Points
    </div>
  `;

  modal.style.display = 'flex';
}
