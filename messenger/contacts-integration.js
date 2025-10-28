// AChat Contacts Integration
// Интеграция системы контактов в мессенджер

let contactsManager = null;
let searchDebounceTimer = null;

// Initialize contacts system
function initContactsSystem(apiUrl, authToken) {
    contactsManager = new ContactsManager(apiUrl, authToken);
    loadFriendRequests();
    updateFriendsTab();
}

// ============================================================================
// MODAL MANAGEMENT
// ============================================================================

function openAddFriendModal() {
    document.getElementById('addFriendModal').classList.add('show');
    document.getElementById('userSearchInput').focus();
    document.getElementById('emptySearch').style.display = 'block';
    document.getElementById('searchResults').innerHTML = '';
}

function closeAddFriendModal() {
    document.getElementById('addFriendModal').classList.remove('show');
    document.getElementById('userSearchInput').value = '';
    document.getElementById('searchResults').innerHTML = '';
}

function openFriendRequestsModal() {
    document.getElementById('friendRequestsModal').classList.add('show');
    loadFriendRequests();
}

function closeFriendRequestsModal() {
    document.getElementById('friendRequestsModal').classList.remove('show');
}

function openInviteFriendModal() {
    document.getElementById('inviteFriendModal').classList.add('show');
    generateInviteCode();
}

function closeInviteFriendModal() {
    document.getElementById('inviteFriendModal').classList.remove('show');
}

// Close modals on background click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});

// ============================================================================
// USER SEARCH
// ============================================================================

function searchUsersDebounced() {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
        searchUsers();
    }, 300);
}

async function searchUsers() {
    const query = document.getElementById('userSearchInput').value.trim();
    const resultsDiv = document.getElementById('searchResults');
    const emptyDiv = document.getElementById('emptySearch');

    if (query.length < 2) {
        resultsDiv.innerHTML = '';
        emptyDiv.style.display = 'block';
        return;
    }

    emptyDiv.style.display = 'none';
    resultsDiv.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Ищу...</div>';

    try {
        const users = await contactsManager.searchUsers(query);

        if (users.length === 0) {
            resultsDiv.innerHTML = `
                <div class="empty-contacts">
                    <div class="empty-contacts-icon">🤷</div>
                    <h3>Ничего не найдено</h3>
                    <p>Попробуй другой запрос</p>
                </div>
            `;
            return;
        }

        resultsDiv.innerHTML = users.map(user => `
            <div class="user-item">
                <div class="user-avatar-small">${user.username.charAt(0).toUpperCase()}</div>
                <div class="user-info">
                    <div class="user-name">${user.displayName || user.username}</div>
                    <div class="user-username">@${user.username}</div>
                </div>
                <div class="user-actions">
                    ${getUserActionButton(user)}
                </div>
            </div>
        `).join('');
    } catch (error) {
        resultsDiv.innerHTML = `
            <div class="empty-contacts">
                <div class="empty-contacts-icon">❌</div>
                <h3>Ошибка поиска</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function getUserActionButton(user) {
    if (user.isFriend) {
        return `<button class="btn-sm btn-friend" disabled>✓ Друзья</button>`;
    } else if (user.hasPendingRequest) {
        if (user.requestDirection === 'outgoing') {
            return `<button class="btn-sm btn-pending" disabled>⏳ Отправлено</button>`;
        } else {
            return `<button class="btn-sm btn-pending" disabled>📩 Входящий запрос</button>`;
        }
    } else {
        return `<button class="btn-sm btn-add" onclick="sendFriendRequest('${user.id}')">+ Добавить</button>`;
    }
}

// ============================================================================
// FRIEND REQUESTS
// ============================================================================

async function sendFriendRequest(userId) {
    try {
        await contactsManager.sendFriendRequest(userId);
        showNotification('Запрос в друзья отправлен!', 'success');
        searchUsers(); // Refresh search results
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function loadFriendRequests() {
    const requestsDiv = document.getElementById('requestsList');
    const emptyDiv = document.getElementById('emptyRequests');

    if (!requestsDiv) return; // Modal not yet loaded

    try {
        const requests = await contactsManager.loadFriendRequests();

        // Update badge
        updateFriendRequestsBadge(requests.length);

        if (requests.length === 0) {
            requestsDiv.innerHTML = '';
            emptyDiv.style.display = 'block';
            return;
        }

        emptyDiv.style.display = 'none';
        requestsDiv.innerHTML = requests.map(req => `
            <div class="user-item">
                <div class="user-avatar-small">${req.from.username.charAt(0).toUpperCase()}</div>
                <div class="user-info">
                    <div class="user-name">${req.from.displayName || req.from.username}</div>
                    <div class="user-username">@${req.from.username}</div>
                </div>
                <div class="user-actions">
                    <button class="btn-sm btn-accept" onclick="acceptFriendRequest('${req.id}')">✓</button>
                    <button class="btn-sm btn-reject" onclick="rejectFriendRequest('${req.id}')">✗</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Load requests error:', error);
    }
}

async function acceptFriendRequest(requestId) {
    try {
        await contactsManager.acceptFriendRequest(requestId);
        showNotification('Запрос принят!', 'success');
        await loadFriendRequests();
        await updateFriendsTab();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function rejectFriendRequest(requestId) {
    try {
        await contactsManager.rejectFriendRequest(requestId);
        showNotification('Запрос отклонён', 'info');
        await loadFriendRequests();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function updateFriendRequestsBadge(count) {
    let badge = document.getElementById('friendRequestsBadge');
    const usersTab = document.querySelector('.sidebar-tab:nth-child(2)'); // Users tab

    if (!usersTab) return;

    if (count > 0) {
        if (!badge) {
            badge = document.createElement('span');
            badge.id = 'friendRequestsBadge';
            badge.className = 'friend-request-badge';
            usersTab.style.position = 'relative';
            usersTab.appendChild(badge);
        }
        badge.textContent = count > 9 ? '9+' : count;
    } else if (badge) {
        badge.remove();
    }
}

// ============================================================================
// FRIENDS TAB
// ============================================================================

async function updateFriendsTab() {
    const usersListDiv = document.getElementById('usersList');
    const useInviteSection = document.getElementById('useInviteSection');

    if (!usersListDiv) return;

    try {
        const friends = await contactsManager.loadFriends();

        if (friends.length === 0) {
            usersListDiv.innerHTML = '';
            if (useInviteSection) {
                useInviteSection.style.display = 'block';
            }
            return;
        }

        if (useInviteSection) {
            useInviteSection.style.display = 'none';
        }

        usersListDiv.innerHTML = `
            <div class="sidebar-actions">
                <button class="btn-action btn-add-friend" onclick="openAddFriendModal()">
                    🔍 Найти друзей
                </button>
                <button class="btn-action btn-invite-friend" onclick="openInviteFriendModal()">
                    📤 Пригласить друга
                </button>
            </div>
            ${friends.map(friend => `
                <div class="user-item" onclick="startDirectConversation('${friend.id}')">
                    <div class="user-avatar-small">${friend.username.charAt(0).toUpperCase()}</div>
                    <div class="user-info">
                        <div class="user-name">${friend.displayName || friend.username}</div>
                        <div class="user-username">@${friend.username}</div>
                    </div>
                </div>
            `).join('')}
        `;
    } catch (error) {
        console.error('Update friends tab error:', error);
    }
}

// ============================================================================
// INVITE SYSTEM
// ============================================================================

async function generateInviteCode() {
    try {
        const invite = await contactsManager.createInviteCode();
        document.getElementById('inviteCode').textContent = invite.code;
        document.getElementById('inviteUrl').textContent = invite.shareUrl;
    } catch (error) {
        showNotification('Ошибка создания кода', 'error');
    }
}

async function useInviteCode() {
    const input = document.getElementById('inviteCodeInput');
    const code = input.value.trim().toUpperCase();

    if (!code) {
        showNotification('Введи код приглашения', 'error');
        return;
    }

    try {
        const result = await contactsManager.useInviteCode(code);
        showNotification(result.message, 'success');
        input.value = '';
        await updateFriendsTab();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function copyInviteCode() {
    const code = document.getElementById('inviteCode').textContent;
    copyToClipboard(code);
    showNotification('Код скопирован!', 'success');
}

function copyInviteUrl() {
    const url = document.getElementById('inviteUrl').textContent;
    copyToClipboard(url);
    showNotification('Ссылка скопирована!', 'success');
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
}

async function shareInvite() {
    const code = document.getElementById('inviteCode').textContent;
    const url = document.getElementById('inviteUrl').textContent;

    const shareData = {
        title: 'Присоединяйся к AChat!',
        text: `Привет! Присоединяйся ко мне в AChat - защищённом мессенджере с AI модерацией.\n\nИспользуй код: ${code}\nИли перейди по ссылке:`,
        url: url
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
            showNotification('Отправлено!', 'success');
        } catch (error) {
            if (error.name !== 'AbortError') {
                copyInviteUrl();
            }
        }
    } else {
        copyInviteUrl();
    }
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ============================================================================
// INITIALIZATION
// ============================================================================

// Auto-load friend requests every 30 seconds
setInterval(() => {
    if (contactsManager) {
        loadFriendRequests();
    }
}, 30000);
