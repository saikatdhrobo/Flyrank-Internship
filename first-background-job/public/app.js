document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const jobForm = document.getElementById('job-form');
  const queryInput = document.getElementById('query-input');
  const promptInput = document.getElementById('prompt-input');
  const idempotencyInput = document.getElementById('idempotency-input');
  const genKeyBtn = document.getElementById('gen-key-btn');
  const retriesInput = document.getElementById('retries-input');
  const failInput = document.getElementById('fail-input');
  const clearDbBtn = document.getElementById('clear-db-btn');
  
  const statsPending = document.getElementById('stats-pending');
  const statsProcessing = document.getElementById('stats-processing');
  const statsCompleted = document.getElementById('stats-completed');
  const statsFailed = document.getElementById('stats-failed');
  
  const jobsList = document.getElementById('jobs-list');
  const alertsContainer = document.getElementById('alerts-container');
  const alertsCount = document.getElementById('alerts-count');

  // Generate a random idempotency key on load & button click
  function generateIdempotencyKey() {
    const chars = 'abcdef0123456789';
    let result = 'key-';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    idempotencyInput.value = result;
  }

  genKeyBtn.addEventListener('click', generateIdempotencyKey);
  // Optional: generate on page load to encourage usage
  generateIdempotencyKey();

  // Submit Job
  jobForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const query = queryInput.value.trim();
    const prompt = promptInput.value.trim();
    const idempotencyKey = idempotencyInput.value.trim();
    const maxRetries = parseInt(retriesInput.value, 10) || 3;
    const forceFail = failInput.checked;

    if (!query || !prompt) return;

    const headers = {
      'Content-Type': 'application/json'
    };

    if (idempotencyKey) {
      headers['x-idempotency-key'] = idempotencyKey;
    }

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          prompt,
          maxRetries,
          forceFail
        })
      });

      const data = await response.json();
      
      if (response.status === 202 || response.status === 200) {
        // Clear input form query and force fail, but keep prompt for convenience
        queryInput.value = '';
        failInput.checked = false;
        // Generate new key to prevent accidental immediate resubmission of duplicate
        generateIdempotencyKey();
        
        // Immediate fetch to show new job
        fetchJobsAndAlerts();
      } else {
        alert(`Failed to queue job: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting job:', error);
      alert('Error submitting job to the server.');
    }
  });

  // Clear DB
  clearDbBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to clear all jobs and alerts?')) return;
    
    try {
      const response = await fetch('/api/clear', { method: 'POST' });
      if (response.ok) {
        fetchJobsAndAlerts();
      }
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  });

  // Manual Retry Handler
  window.retryJob = async (jobId) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/retry`, { method: 'POST' });
      if (response.ok) {
        fetchJobsAndAlerts();
      } else {
        const err = await response.json();
        alert(`Failed to retry: ${err.error}`);
      }
    } catch (error) {
      console.error('Error retrying job:', error);
    }
  };

  // Render Stats Card
  function renderStats(jobs) {
    let pending = 0;
    let processing = 0;
    let completed = 0;
    let failed = 0;

    jobs.forEach(job => {
      if (job.status === 'pending') pending++;
      else if (job.status === 'processing' || job.status === 'retrying') processing++;
      else if (job.status === 'completed') completed++;
      else if (job.status === 'failed') failed++;
    });

    statsPending.innerText = pending;
    statsProcessing.innerText = processing;
    statsCompleted.innerText = completed;
    statsFailed.innerText = failed;
  }

  // Render Jobs Queue list
  function renderJobs(jobs) {
    if (jobs.length === 0) {
      jobsList.innerHTML = `
        <div class="empty-queue">
          <p>No jobs in queue. Submit a decision job to start background execution.</p>
        </div>
      `;
      return;
    }

    jobsList.innerHTML = jobs.map(job => {
      const isProgressActive = job.status === 'processing' || job.status === 'retrying' || job.status === 'pending';
      const dateStr = new Date(job.created_at).toLocaleString();
      
      // Determine badge class
      let badgeClass = 'badge-pending';
      let statusText = job.status;
      
      if (job.status === 'processing') {
        badgeClass = 'badge-processing';
        statusText = 'processing...';
      } else if (job.status === 'retrying') {
        badgeClass = 'badge-retrying';
        statusText = `retrying (${job.retries}/${job.max_retries})`;
      } else if (job.status === 'completed') {
        badgeClass = 'badge-completed';
      } else if (job.status === 'failed') {
        badgeClass = 'badge-failed';
      }

      // Check if job had retries
      const retryCounterHtml = job.retries > 0 
        ? `<span class="retry-badge ${job.status === 'failed' ? 'has-failed' : ''}">Attemped: ${job.retries}/${job.max_retries}</span>` 
        : '';

      // Results display HTML
      let detailsHtml = '';
      if (job.status === 'completed' && job.result) {
        const isYes = job.result.decision === 'YES';
        detailsHtml = `
          <div class="detail-block">
            <div class="detail-label">Decision Result</div>
            <div class="detail-text detail-text-result ${isYes ? 'result-yes' : 'result-no'}">
              ${isYes ? '✓ YES' : '✗ NO'}
            </div>
          </div>
        `;
      } else if (job.error) {
        detailsHtml = `
          <div class="detail-block" style="grid-column: 1 / -1; border-color: rgba(239, 68, 68, 0.15);">
            <div class="detail-label">Execution Errors</div>
            <div class="detail-text error-text">${job.error}</div>
          </div>
        `;
      }

      // Action button footer for failed jobs
      const footerHtml = job.status === 'failed'
        ? `
          <div class="job-footer">
            <button class="btn-retry" onclick="retryJob('${job.id}')">
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Manual Retry Job
            </button>
          </div>
        `
        : '';

      return `
        <div class="job-row">
          <div class="job-header">
            <div class="job-meta">
              <div class="job-id">
                <span>Job #${job.id.substring(0, 8)}</span>
                ${job.idempotency_key ? `<span class="idempotency-badge" title="Key: ${job.idempotency_key}">idempotent</span>` : ''}
              </div>
              <div class="job-dates">Submitted: ${dateStr}</div>
            </div>
            
            <div class="job-badges">
              ${retryCounterHtml}
              <span class="badge ${badgeClass}">${statusText}</span>
            </div>
          </div>

          <div class="progress-container ${isProgressActive ? 'active' : ''}">
            <div class="progress-bar ${job.status === 'processing' ? 'processing' : ''}" style="width: ${job.progress}%;"></div>
          </div>

          <div class="job-details-grid">
            <div class="detail-block">
              <div class="detail-label">Evaluation Task</div>
              <div class="detail-text"><strong>Query:</strong> "${job.input.query}"</div>
              <div class="detail-text" style="margin-top: 0.25rem;"><strong>Criteria:</strong> "${job.input.prompt}"</div>
            </div>
            ${detailsHtml}
          </div>
          
          ${footerHtml}
        </div>
      `;
    }).join('');
  }

  // Render Alerts Column
  function renderAlerts(alerts) {
    alertsCount.innerText = alerts.length;
    
    if (alerts.length === 0) {
      alertsContainer.innerHTML = `
        <div class="alert-empty">
          All systems operational. No active alerts.
        </div>
      `;
      return;
    }

    alertsContainer.innerHTML = alerts.map(alert => {
      const dateStr = new Date(alert.created_at).toLocaleTimeString();
      return `
        <div class="alert-card">
          <div class="alert-header">
            <span class="alert-title">CRITICAL FAILURE</span>
            <span class="alert-time">${dateStr}</span>
          </div>
          <div class="alert-body">
            ${alert.message}
          </div>
        </div>
      `;
    }).join('');
  }

  // Fetch all data from backend
  async function fetchJobsAndAlerts() {
    try {
      const [jobsRes, alertsRes] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/alerts')
      ]);

      if (jobsRes.ok && alertsRes.ok) {
        const jobs = await jobsRes.json();
        const alerts = await alertsRes.json();
        
        renderStats(jobs);
        renderJobs(jobs);
        renderAlerts(alerts);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }

  // Set up polling interval
  fetchJobsAndAlerts();
  setInterval(fetchJobsAndAlerts, 1500);
});
