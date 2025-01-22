document.addEventListener('DOMContentLoaded', function () {
  const searchButton = document.getElementById('search-btn');
  const usernameInput = document.getElementById('user-input');
  const easyLabel = document.getElementById('easy-label');
  const mediumLabel = document.getElementById('medium-label');
  const hardLabel = document.getElementById('hard-label');

  async function fetchUserMetrics(username) {
    try {
      searchButton.textContent = 'Searching...';
      searchButton.disabled = true;

      const response = await fetch('http://localhost:8080/api/leetcode-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user metrics');
      }

      const data = await response.json();
      displayMetrics(data);
    } catch (err) {
      alert(err.message);
    } finally {
      searchButton.textContent = 'Search';
      searchButton.disabled = false;
    }
  }

  function displayMetrics(metrics) {
    easyLabel.textContent = `${metrics.easy.solved} / ${metrics.easy.total}`;
    mediumLabel.textContent = `${metrics.medium.solved} / ${metrics.medium.total}`;
    hardLabel.textContent = `${metrics.hard.solved} / ${metrics.hard.total}`;
  
    const easyPercentage = (metrics.easy.solved / metrics.easy.total) * 100 || 0;
    const mediumPercentage = (metrics.medium.solved / metrics.medium.total) * 100 || 0;
    const hardPercentage = (metrics.hard.solved / metrics.hard.total) * 100 || 0;
  
    document.documentElement.style.setProperty('--easy-progress-degree', `${easyPercentage}%`);
    document.documentElement.style.setProperty('--medium-progress-degree', `${mediumPercentage}%`);
    document.documentElement.style.setProperty('--hard-progress-degree', `${hardPercentage}%`);
  }
  
  searchButton.addEventListener('click', function () {
    const username = usernameInput.value.trim();
    if (username) {
      fetchUserMetrics(username);
    } else {
      alert('Please enter a username');
    }
  });
});
