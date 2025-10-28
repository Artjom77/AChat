// AChat Contacts and Friends Management
// Система контактов и друзей

class ContactsManager {
    constructor(apiUrl, authToken) {
        this.apiUrl = apiUrl;
        this.authToken = authToken;
        this.friends = [];
        this.friendRequests = [];
        this.searchResults = [];
    }

    // Search users
    async searchUsers(query) {
        if (!query || query.length < 2) {
            this.searchResults = [];
            return [];
        }

        try {
            const response = await fetch(`${this.apiUrl}/users/search?q=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (!response.ok) throw new Error('Search failed');

            const data = await response.json();
            this.searchResults = data.users || [];
            return this.searchResults;
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    }

    // Send friend request
    async sendFriendRequest(userId) {
        try {
            const response = await fetch(`${this.apiUrl}/friends/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({ targetUserId: userId })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to send friend request');
            }

            return await response.json();
        } catch (error) {
            console.error('Friend request error:', error);
            throw error;
        }
    }

    // Accept friend request
    async acceptFriendRequest(requestId) {
        try {
            const response = await fetch(`${this.apiUrl}/friends/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({ requestId })
            });

            if (!response.ok) throw new Error('Failed to accept request');

            await this.loadFriends(); // Reload friends list
            await this.loadFriendRequests(); // Reload requests
            return await response.json();
        } catch (error) {
            console.error('Accept request error:', error);
            throw error;
        }
    }

    // Reject friend request
    async rejectFriendRequest(requestId) {
        try {
            const response = await fetch(`${this.apiUrl}/friends/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({ requestId })
            });

            if (!response.ok) throw new Error('Failed to reject request');

            await this.loadFriendRequests(); // Reload requests
            return await response.json();
        } catch (error) {
            console.error('Reject request error:', error);
            throw error;
        }
    }

    // Load friends list
    async loadFriends() {
        try {
            const response = await fetch(`${this.apiUrl}/friends`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (!response.ok) throw new Error('Failed to load friends');

            const data = await response.json();
            this.friends = data.friends || [];
            return this.friends;
        } catch (error) {
            console.error('Load friends error:', error);
            return [];
        }
    }

    // Load friend requests
    async loadFriendRequests() {
        try {
            const response = await fetch(`${this.apiUrl}/friends/requests`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (!response.ok) throw new Error('Failed to load requests');

            const data = await response.json();
            this.friendRequests = data.requests || [];
            return this.friendRequests;
        } catch (error) {
            console.error('Load requests error:', error);
            return [];
        }
    }

    // Create invite code
    async createInviteCode() {
        try {
            const response = await fetch(`${this.apiUrl}/invite/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (!response.ok) throw new Error('Failed to create invite');

            return await response.json();
        } catch (error) {
            console.error('Create invite error:', error);
            throw error;
        }
    }

    // Use invite code
    async useInviteCode(code) {
        try {
            const response = await fetch(`${this.apiUrl}/invite/use?code=${code}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Invalid invite code');
            }

            await this.loadFriends(); // Reload friends
            return await response.json();
        } catch (error) {
            console.error('Use invite error:', error);
            throw error;
        }
    }
}
