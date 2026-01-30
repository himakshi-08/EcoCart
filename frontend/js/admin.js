const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
const ADMIN_API_URL = (isLocal ? 'http://localhost:5001' : 'https://ecocart-backend-lcos.onrender.com') + '/api/admin';
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

async function loadAdminDashboard() {
    loadStats();
    loadUsers();
    loadAdminItems();
}

document.addEventListener('DOMContentLoaded', () => {
    if (!token || !user || user.role !== 'admin') {
        window.location.href = '../auth/login.html';
        return;
    }

    loadAdminDashboard();
});

async function loadStats() {
    try {
        const res = await fetch(`${ADMIN_API_URL}/stats`, {
            headers: { 'x-auth-token': token }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        document.getElementById('stat-users').textContent = data.data.totalUsers;
        document.getElementById('stat-items').textContent = data.data.totalItems;
        document.getElementById('stat-claimed').textContent = data.data.claimedItems;
        document.getElementById('stat-pending').textContent = data.data.pendingItems;
    } catch (err) {
        console.error('Stats error:', err);
    }
}

async function loadUsers() {
    const tbody = document.getElementById('user-table-body');
    try {
        const res = await fetch(`${ADMIN_API_URL}/users`, {
            headers: { 'x-auth-token': token }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        tbody.innerHTML = data.data.map(user => `
      <tr>
        <td style="font-weight: 600;">${user.name}</td>
        <td>${user.email}</td>
        <td><span class="category-tag" style="position:static; background:${user.role === 'admin' ? '#dcfce7' : '#f3f4f6'}; color:${user.role === 'admin' ? '#166534' : '#374151'};">${user.role}</span></td>
        <td>
          <button onclick="deleteUser('${user._id}')" class="btn" style="padding: 0.5rem 0.8rem; background: #fee2e2; color: #ef4444;" ${user.role === 'admin' ? 'disabled' : ''}>
            <i class="fas fa-user-slash"></i>
          </button>
        </td>
      </tr>
    `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--error);">${err.message}</td></tr>`;
    }
}

async function deleteUser(id) {
    if (!confirm('Are you sure you want to remove this user? All their items will also be deleted.')) return;

    try {
        const res = await fetch(`${ADMIN_API_URL}/users/${id}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        });
        const data = await res.json();

        if (res.ok) {
            alert('User removed successfully');
            loadStats();
            loadUsers();
            loadAdminItems();
        } else {
            alert(data.error);
        }
    } catch (err) {
        alert('Failed to delete user');
    }
}

async function loadAdminItems() {
    const tbody = document.getElementById('item-table-body');
    if (!tbody) return;

    try {
        // Fetch ALL items including claimed ones
        const res = await fetch(`${window.BACKEND_URL || (isLocal ? 'http://localhost:5001' : 'https://ecocart-backend-lcos.onrender.com')}/api/items?includeClaimed=true`, {
            headers: { 'x-auth-token': token }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        tbody.innerHTML = data.data.map(item => `
            <tr>
                <td style="font-weight: 600;">${item.title}</td>
                <td>${item.postedBy ? item.postedBy.name : 'Unknown'}</td>
                <td>
                    <span class="category-tag" style="position:static; background:${item.claimedBy ? '#fee2e2' : '#dcfce7'}; color:${item.claimedBy ? '#ef4444' : '#166534'};">
                        ${item.claimedBy ? 'Claimed' : 'Available'}
                    </span>
                </td>
                <td>${new Date(item.createdAt).toLocaleDateString()}</td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <a href="item-details.html?id=${item._id}" class="btn" style="padding: 0.5rem; background: var(--accent); color: var(--primary);"><i class="fas fa-eye"></i></a>
                        <button onclick="handleDeleteItem('${item._id}')" class="btn" style="padding: 0.5rem; background: #fee2e2; color: #ef4444;"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--error);">${err.message}</td></tr>`;
    }
}

// Map handleDeleteItem global function if not loaded
if (typeof window.handleDeleteItem === 'undefined') {
    window.handleDeleteItem = async function (id) {
        if (!confirm('Are you sure you want to remove this item? (Admin Action)')) return;

        try {
            const res = await fetch(`${window.BACKEND_URL || (isLocal ? 'http://localhost:5001' : 'https://ecocart-backend-lcos.onrender.com')}/api/items/${id}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();

            if (res.ok) {
                alert('Item removed successfully');
                loadStats();
                loadAdminItems();
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert('Failed to delete item');
        }
    };
}
