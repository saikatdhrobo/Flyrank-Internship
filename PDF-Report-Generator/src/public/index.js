// Global State
let activePollingInterval = null;
let loggedEventCount = 0;

// DOM Elements
const btnGenerate = document.getElementById('btn-generate');
const progressWidget = document.getElementById('progress-widget');
const progressStatus = document.getElementById('progress-status');
const progressPercent = document.getElementById('progress-percent');
const progressBar = document.getElementById('progress-bar');
const lblJobId = document.getElementById('lbl-job-id');

const kpiRevenue = document.getElementById('kpi-revenue');
const kpiOrders = document.getElementById('kpi-orders');
const kpiCustomers = document.getElementById('kpi-customers');
const kpiItems = document.getElementById('kpi-items');

const feedTbody = document.getElementById('feed-tbody');
const archivesTbody = document.getElementById('archives-tbody');
const schedulesContainer = document.getElementById('schedules-container');
const consoleTerminal = document.getElementById('console-terminal');
const btnClearLogs = document.getElementById('btn-clear-logs');

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
  fetchStats();
  fetchSchedules();
  fetchArchives();
  fetchLogs();
  
  // Set up periodic logs fetch & stats refresh (every 3 seconds)
  setInterval(fetchLogs, 3000);
  setInterval(fetchStats, 6000);
  setInterval(fetchArchives, 6000);

  // Wire Event Listeners
  btnGenerate.addEventListener('click', startReportGeneration);
  btnClearLogs.addEventListener('click', () => {
    consoleTerminal.innerHTML = '<div class="console-line system">[SYSTEM] Console cleared.</div>';
    loggedEventCount = 0;
  });
});

/**
 * Fetch general database analytics and populate KPI cards and feed.
 */
async function fetchStats() {
  try {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Failed to fetch store statistics');
    const data = await res.json();
    
    if (data.success) {
      // 1. Update KPI Values
      kpiRevenue.innerText = `$${parseFloat(data.kpis.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      kpiOrders.innerText = data.kpis.totalOrders.toLocaleString();
      kpiCustomers.innerText = data.kpis.totalCustomers.toLocaleString();
      kpiItems.innerText = data.kpis.totalItemsSold.toLocaleString();

      // 2. Populate Store Transaction Log Feed
      feedTbody.innerHTML = '';
      if (data.recentTransactions.length === 0) {
        feedTbody.innerHTML = '<tr><td colspan="5" class="empty-state">No transactions indexed yet.</td></tr>';
      } else {
        data.recentTransactions.forEach(txn => {
          const row = document.createElement('tr');
          const dateStr = new Date(txn.order_date).toLocaleDateString('en-US', {
            month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
          });
          row.innerHTML = `
            <td><strong>${escapeHTML(txn.customer_name)}</strong></td>
            <td>${escapeHTML(txn.product_name)}</td>
            <td><span class="schedule-expression">${escapeHTML(txn.category)}</span></td>
            <td>${dateStr}</td>
            <td class="align-right"><strong>$${txn.amount.toFixed(2)}</strong></td>
          `;
          feedTbody.appendChild(row);
        });
      }
    }
  } catch (err) {
    console.error('Stats fetch error:', err);
  }
}

/**
 * Fetch and display active background schedules.
 */
async function fetchSchedules() {
  try {
    const res = await fetch('/api/schedules');
    if (!res.ok) throw new Error('Failed to fetch cron schedules');
    const schedules = await res.json();
    
    schedulesContainer.innerHTML = '';
    
    if (schedules.length === 0) {
      schedulesContainer.innerHTML = '<div class="empty-state">No background schedules active in DB.</div>';
      return;
    }
    
    schedules.forEach(sched => {
      const lastRunStr = sched.last_run 
        ? new Date(sched.last_run).toLocaleString() 
        : 'Never run';
      
      const item = document.createElement('div');
      item.className = 'schedule-item';
      item.innerHTML = `
        <div class="schedule-meta">
          <span class="schedule-name">${escapeHTML(sched.name)}</span>
          <span class="schedule-expression">Cron: ${sched.cron_expression}</span>
          <span class="schedule-last-run">Last run: ${lastRunStr}</span>
        </div>
        <button class="btn btn-outline-sm btn-sm" onclick="triggerScheduleManual(${sched.id})">
          <i data-lucide="play" style="width: 12px; height: 12px;"></i> Trigger
        </button>
      `;
      schedulesContainer.appendChild(item);
    });
    
    lucide.createIcons();
  } catch (err) {
    console.error('Schedules fetch error:', err);
    schedulesContainer.innerHTML = '<div class="empty-state">Failed to load active system schedules.</div>';
  }
}

/**
 * Trigger a scheduler job manually.
 */
async function triggerScheduleManual(id) {
  try {
    const res = await fetch(`/api/schedules/trigger/${id}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to trigger schedule');
    const data = await res.json();
    
    appendConsoleLine(`Manual trigger sent for schedule id: ${id}. Queued Job: ${data.jobId}`, 'info');
    pollJobStatus(data.jobId);
    fetchSchedules();
  } catch (err) {
    appendConsoleLine(`Schedule trigger failed: ${err.message}`, 'error');
  }
}

/**
 * Fetch list of completed reports for the download archives table.
 */
async function fetchArchives() {
  try {
    const res = await fetch('/api/reports');
    if (!res.ok) throw new Error('Failed to load archives');
    const reports = await res.json();
    
    archivesTbody.innerHTML = '';
    
    if (reports.length === 0) {
      archivesTbody.innerHTML = '<tr><td colspan="4" class="empty-state">No compiled reports archived.</td></tr>';
      return;
    }
    
    reports.forEach(rep => {
      const row = document.createElement('tr');
      const compiledDate = new Date(rep.updated_at).toLocaleString();
      row.innerHTML = `
        <td>${compiledDate}</td>
        <td><code style="font-size: 0.75rem;">${rep.id}</code></td>
        <td><span class="badge-success">PDF</span></td>
        <td>
          <a href="${rep.result_url}" target="_blank">
            <i data-lucide="download" style="width: 14px; height: 14px;"></i> Download
          </a>
        </td>
      `;
      archivesTbody.appendChild(row);
    });
    
    lucide.createIcons();
  } catch (err) {
    console.error('Archives load error:', err);
  }
}

/**
 * Fetch worker trace logs and append to logs console.
 */
async function fetchLogs() {
  try {
    const res = await fetch('/api/worker/logs');
    if (!res.ok) throw new Error('Failed to load worker logs');
    const logs = await res.json();
    
    if (logs.length > loggedEventCount) {
      // Append only new logs
      const newLogs = logs.slice(loggedEventCount);
      newLogs.forEach(log => {
        appendConsoleLine(log.message, log.type);
      });
      loggedEventCount = logs.length;
    }
  } catch (err) {
    console.error('Logs fetch error:', err);
  }
}

/**
 * Start asynchronous report generation.
 */
async function startReportGeneration() {
  try {
    // Disable generate button & reset progress
    btnGenerate.disabled = true;
    progressWidget.classList.remove('hidden');
    progressStatus.innerText = 'Initializing background thread...';
    progressPercent.innerText = '0%';
    progressBar.style.width = '0%';
    lblJobId.innerText = '-';
    
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) throw new Error('Server rejected generation request');
    const data = await res.json();
    
    if (data.success) {
      lblJobId.innerText = data.jobId;
      appendConsoleLine(`Manual report request accepted. Job ID: ${data.jobId}`, 'info');
      // Begin polling job status
      pollJobStatus(data.jobId);
    }
  } catch (err) {
    progressStatus.innerText = 'Job initiation failed.';
    appendConsoleLine(`Failed to trigger report: ${err.message}`, 'error');
    btnGenerate.disabled = false;
  }
}

/**
 * Poll job status in short intervals until completed or failed.
 */
function pollJobStatus(jobId) {
  if (activePollingInterval) clearInterval(activePollingInterval);
  
  // Show progress widget
  progressWidget.classList.remove('hidden');
  lblJobId.innerText = jobId;
  btnGenerate.disabled = true;

  activePollingInterval = setInterval(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) throw new Error('Polling error');
      const job = await res.json();
      
      // Update UI metrics
      progressPercent.innerText = `${job.progress}%`;
      progressBar.style.width = `${job.progress}%`;
      
      if (job.status === 'pending') {
        progressStatus.innerText = 'Job queued (pending background thread)...';
        progressStatus.className = 'progress-status badge-pending';
      } else if (job.status === 'processing') {
        progressStatus.innerText = 'Compiling metrics & rendering PDF...';
        progressStatus.className = 'progress-status badge-processing';
      } else if (job.status === 'completed') {
        progressStatus.innerText = 'Report generated successfully!';
        progressStatus.className = 'progress-status badge-success';
        
        appendConsoleLine(`Job ${jobId} finished! Archiving report.`, 'success');
        
        // Refresh items
        fetchArchives();
        fetchStats();
        
        // Stop polling
        clearInterval(activePollingInterval);
        activePollingInterval = null;
        
        // Re-enable button after a short delay
        setTimeout(() => {
          progressWidget.classList.add('hidden');
          btnGenerate.disabled = false;
        }, 3000);
      } else if (job.status === 'failed') {
        progressStatus.innerText = 'Job failed. See worker trace log.';
        progressStatus.className = 'progress-status badge-danger';
        
        appendConsoleLine(`Job ${jobId} failed: ${job.error}`, 'error');
        
        clearInterval(activePollingInterval);
        activePollingInterval = null;
        
        setTimeout(() => {
          btnGenerate.disabled = false;
        }, 5000);
      }
    } catch (err) {
      console.error('Polling tick failed:', err);
    }
  }, 800); // Poll every 800ms
}

// Helper: Append line to terminal console
function appendConsoleLine(message, type = 'info') {
  const line = document.createElement('div');
  line.className = `console-line ${type}`;
  
  const timeStr = new Date().toLocaleTimeString();
  line.innerHTML = `<span style="color: #64748b;">[${timeStr}]</span> ${escapeHTML(message)}`;
  
  consoleTerminal.appendChild(line);
  consoleTerminal.scrollTop = consoleTerminal.scrollHeight;
}

// Helper: Escape HTML strings to prevent XSS
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Global scope injection for onclick handlers
window.triggerScheduleManual = triggerScheduleManual;
