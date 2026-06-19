/**
 * Education Page UI logic and interactive fact carousel
 */
let factsList = [];
let activeFactIndex = 0;

document.addEventListener('DOMContentLoaded', async () => {
  await loadEducationContent();

  const nextFactBtn = document.getElementById('next-fact-btn');
  if (nextFactBtn) {
    nextFactBtn.addEventListener('click', rotateFact);
  }
});

async function loadEducationContent() {
  const articlesContainer = document.getElementById('articles-container');
  const factText = document.getElementById('fact-display-text');

  try {
    const res = await API.education.get();
    const articles = res.articles;
    factsList = res.facts;

    // 1. Render Articles
    if (articles.length === 0) {
      articlesContainer.innerHTML = '<p style="color: var(--text-secondary);">No educational articles available.</p>';
    } else {
      let articlesHtml = '';
      articles.forEach(art => {
        const categoryLabel = art.category.charAt(0).toUpperCase() + art.category.slice(1);
        
        articlesHtml += `
          <article class="article-item" style="border-bottom: 1px solid var(--border-color); padding-bottom: 25px; margin-bottom: 25px;">
            <h3>${art.title}</h3>
            <div class="article-meta">
              <span class="badge badge-info">${categoryLabel}</span>
              <span>&bull;</span>
              <span>${art.readTime}</span>
              <span>&bull;</span>
              <span>Level: ${art.difficulty}</span>
            </div>
            <p style="color: var(--text-secondary); margin-bottom: 15px;">${art.summary}</p>
            
            <div id="full-content-${art.id}" style="display: none; color: var(--text-secondary); margin: 20px 0 15px; line-height: 1.6; animation: fadeIn 0.4s ease forwards;">
              ${art.content.replace(/\n\n/g, '<br><br>')}
            </div>

            <button class="btn btn-secondary" style="padding: 5px 15px; font-size: 0.8rem;" id="toggle-btn-${art.id}" onclick="toggleArticle('${art.id}')">Read Full Article</button>
          </article>
        `;
      });
      articlesContainer.innerHTML = articlesHtml;
    }

    // 2. Render Initial Fact
    if (factsList.length > 0 && factText) {
      factText.textContent = factsList[0];
    }

  } catch (err) {
    console.error('Failed to load educational content', err);
    if (articlesContainer) {
      articlesContainer.innerHTML = '<p style="color: var(--color-danger);">Failed to load educational hub resources.</p>';
    }
  }
}

/**
 * Toggles expanding full article content
 */
function toggleArticle(id) {
  const content = document.getElementById(`full-content-${id}`);
  const btn = document.getElementById(`toggle-btn-${id}`);
  
  if (content.style.display === 'none' || content.style.display === '') {
    content.style.display = 'block';
    btn.textContent = 'Collapse Article';
  } else {
    content.style.display = 'none';
    btn.textContent = 'Read Full Article';
  }
}

/**
 * Sequentially rotates environmental facts
 */
function rotateFact() {
  if (factsList.length === 0) return;

  const factText = document.getElementById('fact-display-text');
  
  // Fade out effect
  factText.style.opacity = 0;
  factText.style.transform = 'translateY(5px)';
  factText.style.transition = 'all 0.2s ease';

  setTimeout(() => {
    activeFactIndex = (activeFactIndex + 1) % factsList.length;
    factText.textContent = factsList[activeFactIndex];
    
    // Fade in
    factText.style.opacity = 1;
    factText.style.transform = 'translateY(0)';
  }, 200);
}
