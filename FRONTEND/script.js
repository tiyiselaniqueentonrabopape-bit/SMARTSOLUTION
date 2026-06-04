
const API_BASE_URL = "http://localhost:5000";
// ===== UTILITY FUNCTIONS =====
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `<i class="fas ${icons[type]}"></i> ${message}`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3500);
}

function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validatePhone(phone) {
    return /^[+]?[\d\s()-]{10,}$/.test(phone);
}
function validatePassword(password) {
    return password.length >= 6;
}

function showFieldError(input, message) {
    input.classList.add('error');
    let errorText = input.parentElement.querySelector('.error-text');
    if (!errorText) {
        errorText = document.createElement('div');
        errorText.className = 'error-text';
        input.parentElement.appendChild(errorText);
    }
    errorText.textContent = message;
    errorText.classList.add('show');
}

function clearFieldError(input) {
    input.classList.remove('error');
    const errorText = input.parentElement.querySelector('.error-text');
    if (errorText) {
        errorText.classList.remove('show');
    }
}

function clearAllErrors(form) {
    form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    form.querySelectorAll('.error-text').forEach(el => el.classList.remove('show'));
}

// ===== AUTH TOKEN MANAGEMENT =====
function getToken() {
    return localStorage.getItem('token');
}

function setToken(token) {
    localStorage.setItem('token', token);
}

function removeToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

function getStoredUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function setStoredUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

// ===== API HELPER =====
async function apiRequest(url, options = {}) {
    const token = getToken();
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ===== NAVIGATION =====
function navigateTo(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        window.scrollTo(0, 0);
    }
    
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
        }
    });
    
    document.getElementById('navLinks').classList.remove('active');
    updateAuthUI();
    
    if (pageId === 'rating') loadReviews();
    if (pageId === 'dashboard') loadDashboard();
    if (pageId === 'admin') loadAdminPanel();
}

// ===== AUTH UI =====
function updateAuthUI() {
    const user = getStoredUser();
    const loginNav = document.getElementById('loginNav');
    const logoutNav = document.getElementById('logoutNav');
    const dashboardNav = document.getElementById('dashboardNav');
    const adminNav = document.getElementById('adminNav');
    
    if (user) {
        loginNav.style.display = 'none';
        logoutNav.style.display = 'block';
        dashboardNav.style.display = 'block';
        
        if (user.role === 'admin') {
            adminNav.style.display = 'block';
        } else {
            adminNav.style.display = 'none';
        }
    } else {
        loginNav.style.display = 'block';
        logoutNav.style.display = 'none';
        dashboardNav.style.display = 'none';
        adminNav.style.display = 'none';
    }
}

function logout() {
    removeToken();
    updateAuthUI();
    showToast('Logged out successfully', 'info');
    navigateTo('home');
}

// ===== REVIEWS =====
async function loadReviews() {
    try {
        const data = await apiRequest('/api/reviews');
        const container = document.getElementById('reviewsContainer');
        const currentUser = getStoredUser();
        
        // Update summary
        document.getElementById('averageRating').textContent = data.average.toFixed(1);
        document.getElementById('totalReviews').textContent = `Based on ${data.count} review${data.count !== 1 ? 's' : ''}`;
        
        // Update stars
        const starsContainer = document.getElementById('averageStars');
        starsContainer.innerHTML = '';
        const fullStars = Math.floor(data.average);
        const hasHalf = data.average % 1 >= 0.5;
        
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                starsContainer.innerHTML += '<i class="fas fa-star"></i>';
            } else if (i === fullStars && hasHalf) {
                starsContainer.innerHTML += '<i class="fas fa-star-half-alt"></i>';
            } else {
                starsContainer.innerHTML += '<i class="far fa-star"></i>';
            }
        }
        
        // Update bars
        const maxCount = Math.max(...Object.values(data.distribution), 1);
        for (let i = 1; i <= 5; i++) {
            const count = data.distribution[i] || 0;
            const percentage = (count / maxCount) * 100;
            document.getElementById(`bar${i}`).style.width = `${percentage}%`;
            document.getElementById(`count${i}`).textContent = count;
        }
        
        // Render reviews
        if (data.reviews.length === 0) {
            container.innerHTML = '<p class="empty">No reviews yet. Be the first to review!</p>';
        } else {
            container.innerHTML = data.reviews.map(review => `
                <div class="review-card">
                    <div class="review-header">
                        <div class="review-user">
                            <div class="review-avatar">${review.username.charAt(0).toUpperCase()}</div>
                            <div class="review-user-info">
                                <h4>${review.username}</h4>
                                <span class="review-date">${formatDate(review.date)}</span>
                            </div>
                        </div>
                        <div class="review-rating">
                            ${Array(5).fill(0).map((_, i) => 
                                i < review.rating ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>'
                            ).join('')}
                        </div>
                    </div>
                    <p class="review-text">${review.text}</p>
                    ${currentUser && currentUser.role === 'admin' ? `
                        <button class="btn-small btn-delete" onclick="adminDeleteReview('${review._id}')">Delete</button>
                    ` : ''}
                </div>
            `).join('');
        }
        
        // Show/hide review form
        const reviewForm = document.getElementById('reviewForm');
        const loginPrompt = document.getElementById('reviewLoginPrompt');
        
        if (currentUser && currentUser.role === 'user') {
            reviewForm.style.display = 'block';
            loginPrompt.style.display = 'none';
        } else {
            reviewForm.style.display = 'none';
            loginPrompt.style.display = 'block';
        }
    } catch (error) {
    console.log('Reviews not available');
}
}

// ===== DASHBOARD =====
async function loadDashboard() {
    const user = getStoredUser();
    if (!user) {
        navigateTo('login');
        return;
    }
    
    document.getElementById('dashboardUsername').textContent = user.username;
    document.getElementById('dashUsername').textContent = user.username;
    document.getElementById('dashEmail').textContent = user.email;
    document.getElementById('dashPhone').textContent = user.phone;
    document.getElementById('memberSince').textContent = formatDate(user.createdAt);
    
    try {
        showLoading();
        
        // Get user's requests
        const requestsData = await apiRequest(`/api/requests/user/${user._id}`);
        document.getElementById('myRequestsCount').textContent = requestsData.count;
        
        // Get user's reviews count (from all reviews)
        const reviewsData = await apiRequest('/api/reviews');
 
       const reviews = Array.isArray(reviewsData)
  ? reviewsData
  : reviewsData.reviews || [];

const myReviews = reviews.filter(r =>
  r.userId === user._id || r.userId === user.id
);
        
        // Load requests table
        const tbody = document.getElementById('userRequestsBody');
        if (requestsData.count === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty">No requests yet. <a href="#" data-page="contact">Make a request</a></td></tr>';
        } else {
            tbody.innerHTML = requestsData.requests.map(req => `
                <tr>
                    <td>${formatDate(req.date)}</td>
                    <td>${req.service}</td>
                    <td><span class="status-badge status-${req.status}">${req.status}</span></td>
                    <td>${req.notes || '-'}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        showToast('Failed to load dashboard data', 'error');
    } finally {
        hideLoading();
    }
}

// ===== ADMIN PANEL =====
async function loadAdminPanel() {
    const user = getStoredUser();
    if (!user || user.role !== 'admin') {
        showToast('Access denied', 'error');
        navigateTo('home');
        return;
    }
    
    try {
        showLoading();
        
        // Get stats
        const statsData = await apiRequest('/api/admin/stats');
        const stats = statsData.stats;
        
        document.getElementById('adminTotalUsers').textContent = stats.totalUsers;
        document.getElementById('adminTotalRequests').textContent = stats.totalRequests;
        document.getElementById('adminTotalReviews').textContent = stats.totalReviews;
        document.getElementById('adminTotalMessages').textContent = stats.totalMessages;
        
        // Get all data
        const [usersData, requestsData, reviewsData, messagesData] = await Promise.all([
    apiRequest('/api/admin/users'),
    apiRequest('/api/admin/requests'),
    apiRequest('/api/admin/reviews'),
    apiRequest('/api/admin/messages')
]);
        
        // Users table
        const usersBody = document.getElementById('adminUsersBody');
       if (!usersData.users || usersData.users.length === 0) {
            usersBody.innerHTML = '<tr><td colspan="5" class="empty">No registered users yet</td></tr>';
        } else {
            usersBody.innerHTML = usersData.users.map(u => `
                <tr>
                    <td>${u.username}</td>
                    <td>${u.email}</td>
                    <td>${u.phone}</td>
                    <td>${formatDate(u.createdAt)}</td>
                    <td>
                        <button class="btn-small btn-delete" onclick="adminDeleteUser('${u._id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
        }
        
        // Requests table
        const requestsBody = document.getElementById('adminRequestsBody');
        if (!requestsData.requests || requestsData.requests.length === 0) {
            requestsBody.innerHTML = '<tr><td colspan="6" class="empty">No service requests yet</td></tr>';
        } else {
            requestsBody.innerHTML = requestsData.requests.map(r => `
                <tr>
                    <td>${formatDate(r.date)}</td>
                    <td>${r.username || r.name || 'Guest'}</td>
                    <td>${r.service}</td>
                    <td>${r.phone || '-'}</td>
                    <td><span class="status-badge status-${r.status}">${r.status}</span></td>
                    <td>
                        <button class="btn-small btn-approve" onclick="adminUpdateStatus('${r._id}', 'approved')">Approve</button>
                        <button class="btn-small btn-view" onclick="adminUpdateStatus('${r._id}', 'completed')">Complete</button>
                        <button class="btn-small btn-delete" onclick="adminDeleteRequest('${r._id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
        }
        
        // Reviews table
        const reviewsBody = document.getElementById('adminReviewsBody');
       if (!reviewsData.reviews || reviewsData.reviews.length === 0) {
            reviewsBody.innerHTML = '<tr><td colspan="5" class="empty">No reviews yet</td></tr>';
        } else {
            reviewsBody.innerHTML = reviewsData.reviews.map(r => `
                <tr>
                    <td>${formatDate(r.date)}</td>
                    <td>${r.username}</td>
                    <td>${r.rating} <i class="fas fa-star" style="color:var(--primary)"></i></td>
                    <td>${r.text.substring(0, 50)}${r.text.length > 50 ? '...' : ''}</td>
                    <td>
                        <button class="btn-small btn-delete" onclick="adminDeleteReview('${r._id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
        }
        
        // Messages table
        const messagesBody = document.getElementById('adminMessagesBody');
        if (!messagesData.messages || messagesData.messages.length === 0) {
            messagesBody.innerHTML = '<tr><td colspan="6" class="empty">No messages yet</td></tr>';
        } else {
            messagesBody.innerHTML = messagesData.messages.map(m => `
                <tr>
                    <td>${formatDate(m.date)}</td>
                    <td>${m.name}</td>
                    <td>${m.email}</td>
                    <td>${m.service || '-'}</td>
                    <td>${m.message.substring(0, 40)}${m.message.length > 40 ? '...' : ''}</td>
                    <td>
                        <button class="btn-small btn-delete" onclick="adminDeleteMessage('${m._id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        showToast('Failed to load admin data', 'error');
    } finally {
        hideLoading();
    }
}

// ===== ADMIN ACTIONS =====
async function adminDeleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
        showLoading();
        await apiRequest(`/api/users/${userId}`, { method: 'DELETE' });
        showToast('User deleted', 'success');
        loadAdminPanel();
    } catch (error) {
        showToast(error.message || 'Failed to delete user', 'error');
    } finally {
        hideLoading();
    }
}

async function adminDeleteReview(reviewId) {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
        showLoading();
        await apiRequest(`/api/reviews/${reviewId}`, { method: 'DELETE' });
        showToast('Review deleted', 'success');
        loadAdminPanel();
        if (document.getElementById('rating').classList.contains('active')) {
            loadReviews();
        }
    } catch (error) {
        showToast(error.message || 'Failed to delete review', 'error');
    } finally {
        hideLoading();
    }
}

async function adminDeleteRequest(reqId) {
    if (!confirm('Are you sure?')) return;
    try {
        showLoading();
        await apiRequest(`/api/requests/${reqId}`, { method: 'DELETE' });
        showToast('Request deleted', 'success');
        loadAdminPanel();
    } catch (error) {
        showToast(error.message || 'Failed to delete request', 'error');
    } finally {
        hideLoading();
    }
}

async function adminUpdateStatus(reqId, status) {
    try {
        showLoading();
        await apiRequest(`/api/requests/${reqId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        showToast(`Status updated to ${status}`, 'success');
        loadAdminPanel();
    } catch (error) {
        showToast(error.message || 'Failed to update status', 'error');
    } finally {
        hideLoading();
    }
}

async function adminDeleteMessage(msgId) {
    if (!confirm('Are you sure?')) return;
    try {
        showLoading();
        await apiRequest(`/api/messages/${msgId}`, { method: 'DELETE' });
        showToast('Message deleted', 'success');
        loadAdminPanel();
    } catch (error) {
        showToast(error.message || 'Failed to delete message', 'error');
    } finally {
        hideLoading();
    }
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', function() {
    updateAuthUI();
    
    // Navigation
    document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            if (page) navigateTo(page);
        });
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });
    
    // Mobile menu
    document.getElementById('hamburger').addEventListener('click', function() {
        document.getElementById('navLinks').classList.toggle('active');
    });
    
    // Auth tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const target = this.getAttribute('data-tab');
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(target).classList.add('active');
            const form = document.querySelector('.auth-panel.active form');
            if (form) clearAllErrors(form);
        });
    });
    
    // Password toggle
    document.querySelectorAll('.toggle-password').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const target = document.getElementById(this.getAttribute('data-target'));
            if (target.type === 'password') {
                target.type = 'text';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            } else {
                target.type = 'password';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            }
        });
    });
    
    // Registration form
    document.getElementById('registerForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        clearAllErrors(this);
        
        const username = document.getElementById('regUsername');
        const email = document.getElementById('regEmail');
        const phone = document.getElementById('regPhone');
        const password = document.getElementById('regPassword');
        const confirmPassword = document.getElementById('regConfirmPassword');
        const agreeTerms = document.getElementById('agreeTerms');
        
        let hasError = false;
        
        if (username.value.trim().length < 3) {
            showFieldError(username, 'Username must be at least 3 characters');
            hasError = true;
        }
        
        if (!validateEmail(email.value)) {
            showFieldError(email, 'Please enter a valid email address');
            hasError = true;
        }
        
        if (!validatePhone(phone.value)) {
            showFieldError(phone, 'Please enter a valid phone number');
            hasError = true;
        }
        
        if (!validatePassword(password.value)) {
            showFieldError(password, 'Password must be at least 6 characters');
            hasError = true;
        }
        
        if (password.value !== confirmPassword.value) {
            showFieldError(confirmPassword, 'Passwords do not match');
            hasError = true;
        }
        
        if (!agreeTerms.checked) {
            showToast('Please agree to the Terms & Conditions', 'warning');
            hasError = true;
        }
        
        if (hasError) return;
        
        try {
            showLoading();
            const data = await apiRequest('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    username: username.value.trim(),
                    email: email.value.trim(),
                    phone: phone.value.trim(),
                    password: password.value,
                    confirmPassword: confirmPassword.value
                })
            });
            
            showToast(data.message, 'success');
            this.reset();
            document.querySelector('[data-tab="user-login"]').click();
        } catch (error) {
            showToast(error.message || 'Registration failed', 'error');
        } finally {
            hideLoading();
        }
    });
    
    // Password strength indicator
    document.getElementById('regPassword').addEventListener('input', function() {
        const strengthBar = document.getElementById('passwordStrength');
        const val = this.value;
        
        if (val.length > 0) {
            strengthBar.classList.add('show');
            let strength = 0;
            if (val.length >= 6) strength++;
            if (val.length >= 10) strength++;
            if (/[A-Z]/.test(val)) strength++;
            if (/[0-9]/.test(val)) strength++;
            if (/[^A-Za-z0-9]/.test(val)) strength++;
            
            const colors = ['#dc3545', '#ffc107', '#17a2b8', '#28a745', '#28a745'];
            const widths = ['20%', '40%', '60%', '80%', '100%'];
            
            strengthBar.innerHTML = `<div class="strength-bar" style="width:${widths[Math.min(strength, 4)]};background:${colors[Math.min(strength, 4)]}"></div>`;
        } else {
            strengthBar.classList.remove('show');
        }
    });
    
    // User login
    document.getElementById('userLoginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        clearAllErrors(this);
        
        const username = document.getElementById('userLoginUsername');
        const password = document.getElementById('userLoginPassword');
        
        if (!username.value.trim()) {
            showFieldError(username, 'Please enter your username or email');
            return;
        }
        
        if (!password.value) {
            showFieldError(password, 'Please enter your password');
            return;
        }
        
        try {
            showLoading();
            const data = await apiRequest('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    username: username.value.trim(),
                    password: password.value
                })
            });
            
            setToken(data.token);
            setStoredUser(data.user);
            updateAuthUI();
            showToast(data.message, 'success');
            navigateTo('dashboard');
        } catch (error) {
            showToast(error.message || 'Login failed', 'error');
            showFieldError(password, error.message || 'Invalid credentials');
        } finally {
            hideLoading();
        }
    });
    
    // Admin login
    document.getElementById('adminLoginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        clearAllErrors(this);
        
        const username = document.getElementById('adminLoginUsername');
        const password = document.getElementById('adminLoginPassword');
        
        if (!username.value.trim()) {
            showFieldError(username, 'Please enter admin username');
            return;
        }
        
        if (!password.value) {
            showFieldError(password, 'Please enter admin password');
            return;
        }
        
        try {
            showLoading();
            const data = await apiRequest('/api/auth/admin-login', {
                method: 'POST',
                body: JSON.stringify({
                    username: username.value.trim(),
                    password: password.value
                })
            });
            
            setToken(data.token);
            setStoredUser(data.user);
            updateAuthUI();
            showToast(data.message, 'success');
            navigateTo('admin');
        } catch (error) {
            showToast(error.message || 'Admin login failed', 'error');
            showFieldError(password, error.message || 'Invalid admin credentials');
        } finally {
            hideLoading();
        }
    });
    
    // Contact form
    document.getElementById('contactForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        clearAllErrors(this);
        
        const name = document.getElementById('contactName');
        const email = document.getElementById('contactEmail');
        const phone = document.getElementById('contactPhone');
        const service = document.getElementById('contactService');
        const message = document.getElementById('contactMessage');
        
        let hasError = false;
        
        if (name.value.trim().length < 2) {
            showFieldError(name, 'Please enter your name');
            hasError = true;
        }
        
        if (!validateEmail(email.value)) {
            showFieldError(email, 'Please enter a valid email');
            hasError = true;
        }
        
        if (message.value.trim().length < 10) {
            showFieldError(message, 'Message must be at least 10 characters');
            hasError = true;
        }
        
        if (hasError) return;
        
        try {
            showLoading();
            
            // Send contact message
            await apiRequest('/api/messages', {
                method: 'POST',
                body: JSON.stringify({
                    name: name.value.trim(),
                    email: email.value.trim(),
                    phone: phone.value.trim(),
                    service: service.value,
                    message: message.value.trim()
                })
            });
            
            // Also create service request if user is logged in
            const currentUser = getStoredUser();
            if (currentUser) {
                await apiRequest('/api/requests', {
                    method: 'POST',
                    body: JSON.stringify({
                        userId: currentUser.id || currentUser._id,
                        username: currentUser.username,
                        service: service.options[service.selectedIndex].text || 'General Inquiry',
                        notes: message.value.trim()
                    })
                });
            }
            
            showToast('Message sent successfully! We will contact you soon.', 'success');
            this.reset();
        } catch (error) {
            showToast(error.message || 'Failed to send message', 'error');
        } finally {
            hideLoading();
        }
    });
    
    // Review form
    document.getElementById('reviewForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const rating = document.getElementById('reviewRating').value;
        const text = document.getElementById('reviewText');
        const user = getStoredUser();
        
        if (!user) {
            showToast('Please login to write a review', 'warning');
            return;
        }
        
        if (rating === '0') {
            showToast('Please select a rating', 'warning');
            return;
        }
        
        if (text.value.trim().length < 5) {
            showToast('Please write at least 5 characters', 'warning');
            return;
        }
        
        try {
            showLoading();
            await apiRequest('/api/reviews', {
                method: 'POST',
                body: JSON.stringify({
                    rating: parseInt(rating),
                    text: text.value.trim()
                })
            });
            
            showToast('Review submitted successfully!', 'success');
            text.value = '';
            document.getElementById('reviewRating').value = '0';
            document.querySelectorAll('.star-rating-input i').forEach(s => {
                s.classList.remove('active');
                s.classList.remove('fas');
                s.classList.add('far');
            });
            loadReviews();
        } catch (error) {
            showToast(error.message || 'Failed to submit review', 'error');
        } finally {
            hideLoading();
        }
    });
    
    // Star rating input
    document.querySelectorAll('.star-rating-input i').forEach(star => {
        star.addEventListener('click', function() {
            const rating = this.getAttribute('data-rating');
            document.getElementById('reviewRating').value = rating;
            
            document.querySelectorAll('.star-rating-input i').forEach((s, index) => {
                if (index < rating) {
                    s.classList.remove('far');
                    s.classList.add('fas', 'active');
                } else {
                    s.classList.remove('fas', 'active');
                    s.classList.add('far');
                }
            });
        });
    });
    
    // Admin tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const target = this.getAttribute('data-admin-tab');
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            document.getElementById('admin-' + target).classList.add('active');
        });
    });
    
    // Admin settings
    document.getElementById('saveSettingsBtn').addEventListener('click', function() {
        showToast('Settings saved successfully!', 'success');
    });
    
    // Clear errors on input
    document.querySelectorAll('input, textarea, select').forEach(input => {
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
    
    // Seed database button (for first time setup)
    async function seedDatabase() {
        try {
            await apiRequest('/api/admin/seed', { method: 'POST' });
            console.log('Database seeded');
        } catch (error) {
            console.log('Seed check:', error.message);
        }
    }
    
    // Try to seed on load
    seedDatabase();
    
    // Load initial reviews
    loadReviews();
});