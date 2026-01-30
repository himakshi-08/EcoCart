// detect if we are running locally (localhost or file protocol)
if (typeof window.isLocal === 'undefined') {
  window.isLocal = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'file:';
}
const BACKEND_URL = window.isLocal ? 'http://localhost:5001' : 'https://ecocart-backend-lcos.onrender.com';
const API_BASE_URL = `${BACKEND_URL}/api/items`;

let token = localStorage.getItem('token') || '';
// Debug mode - set to false for production
const DEBUG_MODE = true;

/* ========== ITEM LOADING ========== */
async function loadItems(category = '', searchQuery = '') {
  try {
    if (DEBUG_MODE) console.log('[DEBUG] Loading items...');

    let url = API_BASE_URL;
    const params = new URLSearchParams();

    if (category) params.append('category', category);
    if (searchQuery) params.append('search', searchQuery);

    if (params.toString()) url += `?${params.toString()}`;

    if (DEBUG_MODE) console.log('[DEBUG] Request URL:', url);

    const response = await fetch(url, {
      headers: {
        'x-auth-token': token,
        'Cache-Control': 'no-cache' // Prevent caching issues
      }
    });

    const data = await response.json();
    if (DEBUG_MODE) console.log('[DEBUG] API Response:', data);

    if (!response.ok) {
      throw new Error(data.message || `Failed to load items (${response.status})`);
    }

    displayItems(data.data || data);
  } catch (err) {
    console.error('Error loading items:', err);
    const container = document.getElementById('items-container');
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <p>${err.message || 'Failed to load items. Please try again.'}</p>
          <button onclick="loadItems()">Retry</button>
        </div>
      `;
    }
  }
}

/* ========== USER HUB LOADING ========== */
async function loadUserHub() {
  try {
    // Include claimed items for the user hub
    const response = await fetch(`${BACKEND_URL}/api/items/hub?includeClaimed=true`, {
      headers: { 'x-auth-token': token }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load hub');

    displayHub(data.myPosts, 'my-posts-container', true);
    displayHub(data.myClaims, 'my-claims-container', false);

    // Update stats if elements exist
    const sharedCount = data.myPosts.length;
    const wasteSaved = sharedCount * 3; // roughly 3kg per item average

    const sharedEl = document.getElementById('hub-stat-shared');
    const wasteEl = document.getElementById('hub-stat-waste'); // Corrected ID

    if (sharedEl) sharedEl.textContent = sharedCount;
    if (wasteEl) wasteEl.textContent = `${wasteSaved}kg`;

  } catch (err) {
    console.error('Hub error:', err);
    showNotification(err.message, 'error');
  }
}

function displayHub(items, containerId, isOwner) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!items.length) {
    container.innerHTML = '<p style="text-align:center; padding: 2rem; color: var(--text-light);">No items found here yet.</p>';
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="item-card animate-fade" style="min-height: auto;">
      <div class="item-image" style="height: 150px;">
        <img src="${item.images[0]}" alt="${item.title}" loading="lazy">
      </div>
      <div class="item-info" style="padding: 1rem;">
        <h3 style="font-size: 1.1rem;">${item.title}</h3>
        <p style="font-size: 0.8rem; color: var(--text-light); margin-bottom: 1rem;">${item.location}</p>
        <div style="display: flex; gap: 0.5rem;">
          <a href="item-details.html?id=${item._id}" class="btn" style="padding: 0.5rem; background: var(--accent); color: var(--primary);"><i class="fas fa-eye"></i></a>
          ${isOwner ? `<button onclick="handleDeleteItem('${item._id}')" class="btn" style="padding: 0.5rem; background: #fee2e2; color: #ef4444;"><i class="fas fa-trash"></i></button>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

async function handleDeleteItem(id) {
  if (!confirm('Are you sure you want to remove this item? This cannot be undone.')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: { 'x-auth-token': token }
    });

    if (response.ok) {
      showNotification('Item removed successfully', 'success');
      // Refresh the appropriate view
      if (window.location.pathname.includes('hub.html')) {
        loadUserHub();
      } else if (window.location.pathname.includes('admin.html')) {
        if (typeof loadAdminDashboard === 'function') loadAdminDashboard();
      } else if (window.location.pathname.includes('dashboard.html')) {
        if (typeof loadDashboardData === 'function') loadDashboardData();
      } else {
        loadItems();
      }
    } else {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete');
    }
  } catch (err) {
    showNotification(err.message, 'error');
  }
}

/* ========== ITEM DISPLAY ========== */
function displayItems(items) {
  const container = document.getElementById('items-container');
  if (!container) return;
  if (!items.length) {
    container.innerHTML = '<p>No items found.</p>';
    return;
  }
  container.innerHTML = items.map(item => `
    <div class="item-card animate-fade" data-id="${item._id}">
      <div class="item-image">
        ${item.images && item.images.length > 0 ?
      `<img src="${item.images[0].startsWith('http') ? item.images[0] : BACKEND_URL + item.images[0]}" alt="${item.title}" loading="lazy">` :
      '<div style="height: 100%; display: flex; align-items: center; justify-content: center; background: var(--accent); color: var(--primary-light);"><i class="fas fa-box-open fa-3x"></i></div>'}
        <span class="category-tag">${item.category || 'Item'}</span>
      </div>
      <div class="item-info">
        <h3>${item.title || 'Untitled Item'}</h3>
        <div class="item-meta">
          <span><i class="fas fa-info-circle"></i> ${item.condition || 'Used'}</span>
          <span><i class="fas fa-map-marker-alt"></i> ${item.location || 'Local'}</span>
        </div>
        <p style="color: var(--text-light); font-size: 0.9rem; margin-bottom: 1.5rem; height: 3rem; overflow: hidden;">
          ${truncateText(item.description || '', 80)}
        </p>
        <div style="display: flex; gap: 0.5rem;">
          ${item.claimedBy ?
      `<button class="btn btn-primary" style="flex: 1; padding: 0.6rem; justify-content: center; opacity: 0.6; cursor: not-allowed;" disabled>
              <i class="fas fa-check-circle"></i> Claimed
            </button>` :
      `<button class="btn btn-primary claim-btn" data-id="${item._id}" style="flex: 1; padding: 0.6rem; justify-content: center;">
              <i class="fas fa-hand-holding-heart"></i> Claim
            </button>`
    }
          <button class="btn view-details" data-id="${item._id}" style="background: var(--accent); color: var(--primary); padding: 0.6rem;">
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  addItemEventListeners();
}

function truncateText(text, maxLength) {
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}

/* ========== EVENT LISTENERS ========== */
function addItemEventListeners() {
  // Claim buttons
  document.querySelectorAll('.claim-btn').forEach(btn => {
    btn.addEventListener('click', handleClaimItem);
  });

  // View details buttons
  document.querySelectorAll('.view-details').forEach(btn => {
    btn.addEventListener('click', handleViewDetails);
  });

  // Search input
  const searchInput = document.getElementById('search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => {
      loadItems(document.getElementById('category').value, searchInput.value);
    }, 300));
  }

  // Category filter
  const categoryFilter = document.getElementById('category');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', () => {
      loadItems(categoryFilter.value, document.getElementById('search').value);
    });
  }
}

function debounce(func, wait) {
  let timeout;
  return function () {
    const context = this, args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

/* ========== ITEM CLAIM ========== */
async function handleClaimItem(e) {
  const itemId = e.target.closest('.claim-btn').dataset.id;
  if (!itemId) return;

  if (DEBUG_MODE) console.log('[DEBUG] Claiming item:', itemId);

  if (!confirm('Are you sure you want to claim this item?')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/${itemId}/claim`, {
      method: 'PATCH',
      headers: {
        'x-auth-token': token,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (DEBUG_MODE) console.log('[DEBUG] Claim response:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to claim item');
    }

    showNotification('Item claimed successfully!', 'success');
    loadItems(); // Refresh the list
  } catch (err) {
    console.error('Claim error:', err);
    showNotification(err.message || 'Error claiming item', 'error');
  }
}

/* ========== ITEM POSTING ========== */
const postItemForm = document.getElementById('post-item-form');
if (postItemForm) {
  postItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = postItemForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    try {
      // Disable button during submission
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';

      // Create FormData and append all fields
      const formData = new FormData();
      const fields = ['title', 'description', 'category', 'condition', 'location'];

      fields.forEach(field => {
        const element = document.getElementById(field);
        if (element) formData.append(field, element.value);
      });

      // Handle image uploads
      const imageInput = document.getElementById('images');
      if (imageInput && imageInput.files) {
        for (let i = 0; i < imageInput.files.length; i++) {
          formData.append('images', imageInput.files[i]);
        }
      }

      if (DEBUG_MODE) {
        console.log('[DEBUG] Form data to submit:');
        for (let [key, value] of formData.entries()) {
          console.log(key, value instanceof File ? value.name : value);
        }
      }

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'x-auth-token': token
          // Let browser set Content-Type with boundary
        },
        body: formData
      });

      const data = await response.json();
      if (DEBUG_MODE) console.log('[DEBUG] Post response:', data);

      if (!response.ok) {
        throw new Error(data.message || `Failed to post item (${response.status})`);
      }

      showNotification('Item posted successfully!', 'success');
      setTimeout(() => window.location.href = 'browse.html', 1500);
    } catch (err) {
      console.error('Post error:', err);
      showNotification(err.message || 'Error posting item', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });
}

/* ========== UTILITY FUNCTIONS ========== */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'error' ? 'times-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
    <span>${message}</span>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

function handleViewDetails(e) {
  const itemId = e.target.closest('.view-details').dataset.id;
  if (itemId) {
    window.location.href = `item-details.html?id=${itemId}`;
  }
}

/* ========== INITIALIZATION ========== */
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('browse.html')) {
    // Check URL for initial filters
    const urlParams = new URLSearchParams(window.location.search);
    const initialCategory = urlParams.get('category') || '';
    const initialSearch = urlParams.get('search') || '';

    // Set filter values
    const categoryFilter = document.getElementById('category');
    const searchInput = document.getElementById('search');

    if (categoryFilter && initialCategory) {
      categoryFilter.value = initialCategory;
    }

    if (searchInput && initialSearch) {
      searchInput.value = initialSearch;
    }

    // Load items with initial filters
    loadItems(initialCategory, initialSearch);
  }

  if (window.location.pathname.includes('hub.html')) {
    loadUserHub();
  }
});