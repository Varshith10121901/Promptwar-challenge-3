/**
 * Challenges page UI interactions
 */
const SYSTEM_ACHIEVEMENTS = [
  { name: 'First Step', description: 'Log your first carbon entry.', icon: '🌱', points: 10 },
  { name: 'Week of Commits', description: 'Maintain a 7-day logging streak.', icon: '🔥', points: 50 },
  { name: 'Green Commuter', description: 'Log 5 public transit or bike/walk transport entries.', icon: '🚲', points: 30 },
  { name: 'Eco-Friendly Eater', description: 'Log 10 vegetarian or vegan meals.', icon: '🥗', points: 40 },
  { name: 'Carbon Cutback', description: 'Achieve a cumulative carbon reduction of 100 kg CO2e.', icon: '🌳', points: 100 }
];

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Enforce login
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/';
    return;
  }

  // 2. Fetch page metrics
  await refreshChallengesPage();
});

async function refreshChallengesPage() {
  try {
    // 1. Get profile details
    const profile = await API.auth.getProfile();
    document.getElementById('streak-count-val').textContent = profile.user.streak_days;

    // 2. Render Achievements Shelf
    renderAchievementsShelf(profile.achievements);

    // 3. Render System Challenges
    await loadChallengesList();

  } catch (err) {
    console.error('Failed to load challenges page details', err);
  }
}

/**
 * Render Achievements Grid (High-lighting earned ones)
 */
function renderAchievementsShelf(earnedAchievements) {
  const container = document.getElementById('badges-container');
  if (!container) {
    return;
  }

  const earnedNames = new Set(earnedAchievements.map(a => a.name));

  let html = '';
  SYSTEM_ACHIEVEMENTS.forEach(ach => {
    const isEarned = earnedNames.has(ach.name);
    
    html += `
      <div class="badge-item ${isEarned ? '' : 'locked'}" title="${ach.description}">
        <div class="badge-icon">${ach.icon}</div>
        <div class="badge-name">${ach.name}</div>
        <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 5px;">
          ${isEarned ? 'Unlocked' : 'Locked'}
        </div>
        <div style="font-size: 0.65rem; color: var(--color-warning); font-weight: 700; margin-top: 2px;">
          +${ach.points} Pts
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * Load system challenges and map enrollments
 */
async function loadChallengesList() {
  const container = document.getElementById('challenges-container');
  if (!container) {
    return;
  }

  try {
    // Get all system challenges
    const sysRes = await API.challenges.list();
    const systemChallenges = sysRes.data;

    // Get user active challenges
    const userRes = await API.challenges.listUser();
    const userChallenges = userRes.data;

    // Map challenge ID to user challenge status
    const enrollmentMap = {};
    userChallenges.forEach(uc => {
      enrollmentMap[uc.id] = uc.status; // uc.id represents challenge_id because of controller join
    });

    if (systemChallenges.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px 0;">No challenges loaded.</p>';
      return;
    }

    let html = '';
    systemChallenges.forEach(c => {
      const status = enrollmentMap[c.id];
      let actionBtn = '';

      if (!status) {
        // Not enrolled
        actionBtn = `<button class="btn btn-outline" onclick="enrollChallenge(${c.id})">Enroll Challenge</button>`;
      } else if (status === 'active') {
        // Active
        actionBtn = `
          <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-end;">
            <span class="badge badge-info">Active</span>
            <button class="btn btn-primary" style="padding: 6px 14px; font-size: 0.8rem;" onclick="completeChallenge(${c.id})">Mark Completed</button>
          </div>
        `;
      } else if (status === 'completed') {
        // Completed
        actionBtn = `<span class="badge badge-success">Completed (+${c.points} Pts)</span>`;
      }

      html += `
        <div class="challenge-item">
          <div class="challenge-info">
            <h3>${c.title}</h3>
            <p>${c.description}</p>
            <div class="challenge-meta">
              <span style="color: var(--color-primary);">🎯 Target: -${c.target_reduction} kg CO2e</span>
              <span style="color: var(--text-muted);">&bull;</span>
              <span style="color: var(--text-secondary);">⏱️ Duration: ${c.duration_days} days</span>
              <span style="color: var(--text-muted);">&bull;</span>
              <span style="color: var(--color-warning); text-transform: capitalize;">Diff: ${c.difficulty}</span>
            </div>
          </div>
          <div style="margin-left: 20px;">
            ${actionBtn}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

  } catch (err) {
    console.error('Failed to load challenges list', err);
    container.innerHTML = '<p style="color: var(--color-danger); font-size: 0.9rem;">Unable to load challenges at this time.</p>';
  }
}

/**
 * Handle enroll action
 */
async function enrollChallenge(id) {
  try {
    const res = await API.challenges.enroll(id);
    if (res.success) {
      await refreshChallengesPage();
    }
  } catch (err) {
    alert(err.message || 'Failed to enroll in challenge');
  }
}

/**
 * Handle manual completion
 */
async function completeChallenge(id) {
  try {
    const res = await API.challenges.complete(id);
    if (res.success) {
      alert(res.message);
      await refreshChallengesPage();
    }
  } catch (err) {
    alert(err.message || 'Failed to complete challenge');
  }
}

// Bind handlers to the window object so they can be called from HTML onclick attributes
window.enrollChallenge = enrollChallenge;
window.completeChallenge = completeChallenge;
