// Main Application Logic - Yazdan Motahar Ghaem Vosta
const App = {
  currentUser: null,
  organizations: [],
  requests: [],
  selectedRequestIds: new Set(),
  activeTab: 'all',
  officerActiveTab: 'submit', // 'submit', 'history', 'chat'
  filters: {
    organization_id: '',
    status: 'all',
    request_type: 'all',
    search: ''
  },
  viewerState: {
    request: null,
    zoom: 1,
    rotation: 0
  },
  chatState: {
    activeOfficerId: null,
    pollInterval: null
  },

  async init() {
    this.bindGlobalEvents();
    await this.checkAuth();
    this.startNotificationPoller();
  },

  startNotificationPoller() {
    // Poll unread messages count every 15 seconds
    setInterval(async () => {
      if (this.currentUser) {
        await this.checkUnreadMessages();
      }
    }, 15000);
  },

  async checkUnreadMessages() {
    try {
      const data = await API.getUnreadMessageCount();
      const badge = document.getElementById('header-unread-msg-badge');
      if (badge) {
        if (data.unreadCount > 0) {
          badge.textContent = data.unreadCount;
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      }
    } catch (e) {}
  },

  async checkAuth() {
    const token = API.getToken();
    if (!token) {
      this.showLoginView();
      return;
    }

    try {
      const data = await API.getMe();
      this.currentUser = data.user;
      this.renderApp();
      this.checkUnreadMessages();
    } catch (err) {
      this.showLoginView();
    }
  },

  showLoginView() {
    document.getElementById('login-view').classList.remove('hidden');
    document.getElementById('app-view').classList.add('hidden');
    document.getElementById('user-header-menu').classList.add('hidden');
    const header = document.getElementById('main-header');
    if (header) header.classList.add('hidden');
  },

  async renderApp() {
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('app-view').classList.remove('hidden');
    const header = document.getElementById('main-header');
    if (header) header.classList.remove('hidden');
    document.getElementById('user-header-menu').classList.remove('hidden');

    this.renderHeaderUser();

    if (this.currentUser.role === 'admin') {
      document.getElementById('admin-container').classList.remove('hidden');
      document.getElementById('officer-container').classList.add('hidden');
      await this.loadAdminDashboard();
    } else {
      document.getElementById('admin-container').classList.add('hidden');
      document.getElementById('officer-container').classList.remove('hidden');
      await this.loadOfficerDashboard();
    }
  },

  renderHeaderUser() {
    const user = this.currentUser;
    document.getElementById('header-user-name').textContent = user.full_name;
    document.getElementById('header-user-role').textContent = user.role === 'admin' 
      ? 'مدیریت کل ارشد - یزدان مطهر قائم وسطی' 
      : `${user.organization_name || 'مسئول سازمانی'} - ${user.unit_name || ''}`;
    
    const roleBadge = document.getElementById('header-role-badge');
    if (user.role === 'admin') {
      roleBadge.textContent = 'مدیر ارشد';
      roleBadge.className = 'px-2 py-0.5 text-xs font-semibold rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30';
    } else {
      roleBadge.textContent = 'مسئول واحد';
      roleBadge.className = 'px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30';
    }
  },

  // ---------------------------------------------------------------------------
  // ADMIN DASHBOARD
  // ---------------------------------------------------------------------------

  async loadAdminDashboard() {
    await Promise.all([
      this.loadOrganizations(),
      this.loadStats(),
      this.loadRequests()
    ]);
  },

  async loadOrganizations() {
    try {
      const data = await API.getOrganizations();
      this.organizations = data.organizations;
      this.renderOrgTabs();
    } catch (err) {
      Toast.error('خطا در دریافت اطلاعات مجموعه‌ها: ' + err.message);
    }
  },

  renderOrgTabs() {
    const container = document.getElementById('admin-org-tabs');
    if (!container) return;

    let html = `
      <button onclick="App.setOrgFilter('')" class="px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
        this.filters.organization_id === '' 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400' 
          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
      }">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        <span>همه ۸ مجموعه</span>
        <span class="text-xs bg-black/20 px-2 py-0.5 rounded-full" id="total-badge-all">...</span>
      </button>
    `;

    this.organizations.forEach(org => {
      const isSelected = String(this.filters.organization_id) === String(org.id);
      html += `
        <button onclick="App.setOrgFilter(${org.id})" class="px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
          isSelected 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400' 
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
        }">
          <span>${org.name}</span>
          <span class="text-xs ${isSelected ? 'bg-black/30' : 'bg-slate-900'} px-2 py-0.5 rounded-full text-slate-200">
            ${org.total_requests || 0}
          </span>
        </button>
      `;
    });

    container.innerHTML = html;
  },

  setOrgFilter(orgId) {
    this.filters.organization_id = orgId;
    this.renderOrgTabs();
    this.loadRequests();
  },

  async loadStats() {
    try {
      const data = await API.getStats();
      const k = data.kpis;

      document.getElementById('stat-total').textContent = k.total;
      document.getElementById('stat-unread').textContent = k.unread;
      document.getElementById('stat-viewed').textContent = k.viewed;
      document.getElementById('stat-file-prep').textContent = k.file_prep;
      document.getElementById('stat-sent-to-lab').textContent = k.sent_to_lab;
      document.getElementById('stat-printed').textContent = k.printed;
      document.getElementById('stat-delivered').textContent = k.delivered;

      const totalBadge = document.getElementById('total-badge-all');
      if (totalBadge) totalBadge.textContent = k.total;
    } catch (err) {
      console.error(err);
    }
  },

  async loadRequests() {
    try {
      const data = await API.getRequests(this.filters);
      this.requests = data.requests;
      this.renderRequestsTable();
    } catch (err) {
      Toast.error('خطا در دریافت لیست درخواست‌ها: ' + err.message);
    }
  },

  renderRequestsTable() {
    const tbody = document.getElementById('requests-table-body');
    const emptyState = document.getElementById('requests-empty-state');
    const countBadge = document.getElementById('requests-count-badge');

    if (countBadge) countBadge.textContent = `${this.requests.length} درخواست`;

    if (!this.requests || this.requests.length === 0) {
      tbody.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }
    emptyState.classList.add('hidden');

    let html = '';
    this.requests.forEach(req => {
      const isChecked = this.selectedRequestIds.has(req.id);
      const typeBadge = this.getTypeBadge(req.request_type);
      const statusBadge = this.getStatusBadge(req.status);
      const dateTimeHtml = JalaliDate.formatDateTimeBadges(req.created_at);
      const timeAgo = JalaliDate.timeAgo(req.created_at);

      html += `
        <tr class="border-b border-slate-800 hover:bg-slate-800/40 transition-colors group ${isChecked ? 'bg-blue-900/10' : ''}">
          <!-- Checkbox -->
          <td class="p-4 text-center">
            <input type="checkbox" onchange="App.toggleSelectRequest(${req.id})" ${isChecked ? 'checked' : ''} 
              class="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-600 focus:ring-blue-500 cursor-pointer">
          </td>

          <!-- Image Preview Thumbnail -->
          <td class="p-4">
            <div class="relative w-14 h-18 rounded-lg overflow-hidden border border-slate-700 group-hover:border-blue-500 transition-all cursor-pointer bg-slate-900 shadow-sm"
                 onclick="App.openViewer(${req.id})">
              <img src="${req.image_path}" alt="فرم ${req.employee_name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
              <div class="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              </div>
            </div>
          </td>

          <!-- Employee Name & Tracking Code -->
          <td class="p-4">
            <div class="font-bold text-white text-base">${req.employee_name}</div>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs font-mono text-blue-400 bg-blue-950/60 border border-blue-800/40 px-2 py-0.5 rounded">
                ${req.tracking_code}
              </span>
              ${req.notes ? `<span class="text-xs text-amber-400 flex items-center gap-1" title="${req.notes}">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>
                توضیح
              </span>` : ''}
            </div>
          </td>

          <!-- Organization & Unit -->
          <td class="p-4">
            <div class="text-sm font-medium text-slate-200">${req.organization_name}</div>
            <div class="text-xs text-slate-400 mt-0.5">${req.unit_name}</div>
          </td>

          <!-- Request Type -->
          <td class="p-4">
            ${typeBadge}
          </td>

          <!-- Status Dropdown (6 Stages) -->
          <td class="p-4">
            <select onchange="App.changeStatus(${req.id}, this.value)" 
              class="text-xs font-bold rounded-lg px-2.5 py-1.5 bg-slate-900 border transition-all cursor-pointer ${
                req.status === 'unread' ? 'text-amber-300 border-amber-600/50 bg-amber-950/30' :
                req.status === 'viewed' ? 'text-sky-300 border-sky-600/50 bg-sky-950/30' :
                req.status === 'file_prep' ? 'text-purple-300 border-purple-600/50 bg-purple-950/30' :
                req.status === 'sent_to_lab' ? 'text-orange-300 border-orange-600/50 bg-orange-950/30' :
                req.status === 'printed' ? 'text-emerald-300 border-emerald-600/50 bg-emerald-950/30' :
                'text-teal-300 border-teal-600/50 bg-teal-950/30'
              }">
              <option value="unread" ${req.status === 'unread' ? 'selected' : ''}>🟡 ۱. دیده نشده</option>
              <option value="viewed" ${req.status === 'viewed' ? 'selected' : ''}>🔵 ۲. دیده شده</option>
              <option value="file_prep" ${req.status === 'file_prep' ? 'selected' : ''}>🟣 ۳. آماده‌سازی فایل</option>
              <option value="sent_to_lab" ${req.status === 'sent_to_lab' ? 'selected' : ''}>🟠 ۴. ارسال به لابراتوار</option>
              <option value="printed" ${req.status === 'printed' ? 'selected' : ''}>🟢 ۵. چاپ شده</option>
              <option value="delivered" ${req.status === 'delivered' ? 'selected' : ''}>💎 ۶. تحویل داده شده</option>
            </select>
          </td>

          <!-- Exact Shamsi Date & Time of Submission -->
          <td class="p-4">
            ${dateTimeHtml}
            <div class="text-[10px] text-slate-500 mt-1">${timeAgo}</div>
          </td>

          <!-- Submitter -->
          <td class="p-4">
            <div class="text-xs font-semibold text-slate-200">${req.submitter_name}</div>
            <div class="text-[10px] text-slate-400 mt-0.5">${req.submitter_phone || ''}</div>
          </td>

          <!-- Actions -->
          <td class="p-4 text-left">
            <div class="flex items-center justify-end gap-1.5">
              <button onclick="App.openViewer(${req.id})" 
                class="p-2 rounded-lg bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 transition-colors" title="مشاهده بزرگ و زوم">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              </button>
              <button onclick="App.quickMarkNextStage(${req.id}, '${req.status}')" 
                class="p-2 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-400 transition-colors" title="ارتقا به مرحله بعد">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>
              </button>
              <button onclick="App.deleteRequest(${req.id})" 
                class="p-2 rounded-lg bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-400 hover:text-rose-100 transition-colors" title="حذف رکورد">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  },

  getTypeBadge(type) {
    if (type === 'first_time') {
      return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        ۱. دفعه اول
      </span>`;
    }
    if (type === 'reprint') {
      return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
        <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
        ۲. چاپ مجدد
      </span>`;
    }
    if (type === 'correction') {
      return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
        <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
        ۳. اصلاح
      </span>`;
    }
    return type;
  },

  getStatusBadge(status) {
    switch (status) {
      case 'unread':
        return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
          <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          ۱. دیده نشده
        </span>`;
      case 'viewed':
        return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-sky-500/15 text-sky-400 border border-sky-500/25">
          <span class="w-2 h-2 rounded-full bg-sky-400"></span>
          ۲. دیده شده
        </span>`;
      case 'file_prep':
        return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/25">
          <span class="w-2 h-2 rounded-full bg-purple-400"></span>
          ۳. آماده‌سازی فایل
        </span>`;
      case 'sent_to_lab':
        return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-orange-500/15 text-orange-400 border border-orange-500/25">
          <span class="w-2 h-2 rounded-full bg-orange-400"></span>
          ۴. ارسال به لابراتوار
        </span>`;
      case 'printed':
        return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          ۵. چاپ شده
        </span>`;
      case 'delivered':
        return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-teal-500/15 text-teal-400 border border-teal-500/25">
          <span class="w-2 h-2 rounded-full bg-teal-400"></span>
          ۶. تحویل داده شده
        </span>`;
      default:
        return status;
    }
  },

  async quickMarkNextStage(id, currentStatus) {
    const sequence = ['unread', 'viewed', 'file_prep', 'sent_to_lab', 'printed', 'delivered'];
    const currentIndex = sequence.indexOf(currentStatus);
    if (currentIndex < sequence.length - 1) {
      const nextStatus = sequence[currentIndex + 1];
      await this.changeStatus(id, nextStatus);
    } else {
      Toast.info('این درخواست در آخرین مرحله (تحویل داده شده) قرار دارد.');
    }
  },

  async changeStatus(id, newStatus) {
    try {
      await API.updateStatus(id, newStatus);
      Toast.success('وضعیت درخواست به‌روز شد.');
      await this.loadStats();
      await this.loadOrganizations();
      const target = this.requests.find(r => r.id === id);
      if (target) target.status = newStatus;
      this.renderRequestsTable();
    } catch (err) {
      Toast.error(err.message);
    }
  },

  async deleteRequest(id) {
    if (!confirm('آیا از حذف این درخواست اطمینان دارید؟ تصویر مربوطه نیز حذف خواهد شد.')) return;
    try {
      await API.deleteRequest(id);
      Toast.success('درخواست با موفقیت حذف شد.');
      this.selectedRequestIds.delete(id);
      await this.loadStats();
      await this.loadOrganizations();
      await this.loadRequests();
    } catch (err) {
      Toast.error(err.message);
    }
  },

  toggleSelectRequest(id) {
    if (this.selectedRequestIds.has(id)) {
      this.selectedRequestIds.delete(id);
    } else {
      this.selectedRequestIds.add(id);
    }
    this.updateBatchActionsUI();
  },

  toggleSelectAll(checked) {
    if (checked) {
      this.requests.forEach(r => this.selectedRequestIds.add(r.id));
    } else {
      this.selectedRequestIds.clear();
    }
    this.renderRequestsTable();
    this.updateBatchActionsUI();
  },

  updateBatchActionsUI() {
    const bar = document.getElementById('batch-actions-bar');
    const countSpan = document.getElementById('batch-selected-count');
    if (!bar) return;

    if (this.selectedRequestIds.size > 0) {
      bar.classList.remove('hidden');
      countSpan.textContent = `${this.selectedRequestIds.size} مورد انتخاب شده`;
    } else {
      bar.classList.add('hidden');
    }
  },

  async executeBatchStatus(status) {
    if (this.selectedRequestIds.size === 0) return;
    try {
      const ids = Array.from(this.selectedRequestIds);
      const res = await API.batchUpdateStatus(ids, status);
      Toast.success(res.message);
      this.selectedRequestIds.clear();
      this.updateBatchActionsUI();
      await this.loadStats();
      await this.loadOrganizations();
      await this.loadRequests();
    } catch (err) {
      Toast.error(err.message);
    }
  },

  filterByStatusCard(status) {
    this.filters.status = status;
    const select = document.getElementById('filter-status-select');
    if (select) select.value = status;
    this.loadRequests();
  },

  // ---------------------------------------------------------------------------
  // IMAGE VIEWER MODAL
  // ---------------------------------------------------------------------------

  async openViewer(requestId) {
    try {
      const data = await API.getRequest(requestId);
      const req = data.request;
      this.viewerState.request = req;
      this.viewerState.zoom = 1;
      this.viewerState.rotation = 0;

      // Update UI elements
      document.getElementById('viewer-img').src = req.image_path;
      document.getElementById('viewer-employee-name').textContent = req.employee_name;
      document.getElementById('viewer-tracking-code').textContent = req.tracking_code;
      document.getElementById('viewer-org-name').textContent = req.organization_name;
      document.getElementById('viewer-unit-name').textContent = req.unit_name;
      document.getElementById('viewer-submitter-name').textContent = req.submitter_name;
      
      // Explicit Shamsi Date & Time in modal
      document.getElementById('viewer-date').innerHTML = JalaliDate.format(req.created_at);
      document.getElementById('viewer-type-badge').innerHTML = this.getTypeBadge(req.request_type);

      const statusSelect = document.getElementById('viewer-status-select');
      if (statusSelect) {
        statusSelect.value = req.status;
        statusSelect.disabled = this.currentUser.role !== 'admin';
      }

      const notesBox = document.getElementById('viewer-notes-box');
      if (req.notes) {
        notesBox.classList.remove('hidden');
        document.getElementById('viewer-notes').textContent = req.notes;
      } else {
        notesBox.classList.add('hidden');
      }

      this.updateViewerTransform();
      document.getElementById('viewer-modal').classList.remove('hidden');

      if (this.currentUser.role === 'admin' && req.status === 'viewed') {
        this.loadStats();
        this.loadRequests();
      }
    } catch (err) {
      Toast.error('خطا در بارگذاری جزئیات: ' + err.message);
    }
  },

  closeViewer() {
    document.getElementById('viewer-modal').classList.add('hidden');
    this.viewerState.request = null;
  },

  zoomIn() {
    this.viewerState.zoom = Math.min(this.viewerState.zoom + 0.25, 3.5);
    this.updateViewerTransform();
  },

  zoomOut() {
    this.viewerState.zoom = Math.max(this.viewerState.zoom - 0.25, 0.5);
    this.updateViewerTransform();
  },

  rotateRight() {
    this.viewerState.rotation = (this.viewerState.rotation + 90) % 360;
    this.updateViewerTransform();
  },

  resetZoom() {
    this.viewerState.zoom = 1;
    this.viewerState.rotation = 0;
    this.updateViewerTransform();
  },

  updateViewerTransform() {
    const img = document.getElementById('viewer-img');
    if (!img) return;
    img.style.transform = `scale(${this.viewerState.zoom}) rotate(${this.viewerState.rotation}deg)`;
  },

  downloadViewerImage() {
    if (!this.viewerState.request) return;
    const a = document.createElement('a');
    a.href = this.viewerState.request.image_path;
    a.download = `form-${this.viewerState.request.employee_name.replace(/\s+/g, '_')}-${this.viewerState.request.tracking_code}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  printViewerImage() {
    window.print();
  },

  async updateViewerStatus(status) {
    if (!this.viewerState.request || this.currentUser.role !== 'admin') return;
    await this.changeStatus(this.viewerState.request.id, status);
  },

  // ---------------------------------------------------------------------------
  // OFFICER DASHBOARD
  // ---------------------------------------------------------------------------

  async loadOfficerDashboard() {
    this.setOfficerTab('submit');
    await this.loadOfficerRequests();
  },

  setOfficerTab(tab) {
    this.officerActiveTab = tab;
    const btnSubmit = document.getElementById('tab-btn-submit');
    const btnHistory = document.getElementById('tab-btn-history');
    const btnChat = document.getElementById('tab-btn-chat');
    const contentSubmit = document.getElementById('officer-submit-section');
    const contentHistory = document.getElementById('officer-history-section');
    const contentChat = document.getElementById('officer-chat-section');

    const activeClasses = 'px-5 py-2.5 rounded-xl font-bold text-sm bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400';
    const inactiveClasses = 'px-5 py-2.5 rounded-xl font-semibold text-sm bg-slate-800 text-slate-300 hover:bg-slate-700';

    btnSubmit.className = tab === 'submit' ? activeClasses : inactiveClasses;
    btnHistory.className = tab === 'history' ? activeClasses : inactiveClasses;
    if (btnChat) btnChat.className = tab === 'chat' ? activeClasses : inactiveClasses;

    contentSubmit.classList.toggle('hidden', tab !== 'submit');
    contentHistory.classList.toggle('hidden', tab !== 'history');
    if (contentChat) contentChat.classList.toggle('hidden', tab !== 'chat');

    if (tab === 'history') {
      this.loadOfficerRequests();
    } else if (tab === 'chat') {
      this.loadOfficerMessages();
    }
  },

  async loadOfficerRequests() {
    try {
      const data = await API.getRequests();
      this.renderOfficerRequests(data.requests);
      const countBadge = document.getElementById('officer-history-count');
      if (countBadge) countBadge.textContent = `${data.requests.length} درخواست`;
    } catch (err) {
      Toast.error('خطا در دریافت سوابق ارسالی: ' + err.message);
    }
  },

  renderOfficerRequests(list) {
    const container = document.getElementById('officer-cards-container');
    const emptyState = document.getElementById('officer-empty-state');
    if (!container) return;

    if (!list || list.length === 0) {
      container.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }
    emptyState.classList.add('hidden');

    let html = '';
    list.forEach(req => {
      const typeBadge = this.getTypeBadge(req.request_type);
      const statusBadge = this.getStatusBadge(req.status);
      const formattedDate = JalaliDate.format(req.created_at);
      const timeAgo = JalaliDate.timeAgo(req.created_at);

      html += `
        <div class="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:border-blue-500/50 transition-all group">
          <div>
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-12 h-16 rounded-lg bg-slate-900 border border-slate-700 overflow-hidden cursor-pointer" onclick="App.openViewer(${req.id})">
                  <img src="${req.image_path}" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
                </div>
                <div>
                  <h4 class="font-bold text-white text-base">${req.employee_name}</h4>
                  <div class="text-xs font-mono text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded mt-1 inline-block">
                    ${req.tracking_code}
                  </div>
                </div>
              </div>
              <div>${statusBadge}</div>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-800 space-y-2 text-xs text-slate-300">
              <div class="flex justify-between">
                <span class="text-slate-400">واحد سازمانی:</span>
                <span class="font-medium">${req.unit_name}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-400">نوع درخواست:</span>
                <div>${typeBadge}</div>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">تاریخ و ساعت ارسال:</span>
                <span class="font-mono text-sky-300" title="${timeAgo}">${formattedDate}</span>
              </div>
              ${req.notes ? `
                <div class="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-amber-300 mt-2">
                  <span class="font-bold">یادداشت:</span> ${req.notes}
                </div>
              ` : ''}
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <button onclick="App.openViewer(${req.id})" class="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              مشاهده تصویر فرم
            </button>
            ${req.status === 'unread' ? `
              <button onclick="App.deleteRequest(${req.id})" class="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                لغو و حذف
              </button>
            ` : ''}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  handleImageSelection(file) {
    if (!file) return;
    const previewContainer = document.getElementById('upload-preview-container');
    const uploadPrompt = document.getElementById('upload-prompt');
    const previewImg = document.getElementById('upload-preview-img');
    const fileName = document.getElementById('upload-file-name');

    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      fileName.textContent = file.name;
      uploadPrompt.classList.add('hidden');
      previewContainer.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  },

  removeSelectedImage() {
    const input = document.getElementById('card-image-input');
    input.value = '';
    document.getElementById('upload-preview-container').classList.add('hidden');
    document.getElementById('upload-prompt').classList.remove('hidden');
  },

  async handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = document.getElementById('btn-submit-request');
    const fileInput = document.getElementById('card-image-input');

    if (!fileInput.files || fileInput.files.length === 0) {
      Toast.error('لطفاً عکس فرم یا نامه را انتخاب یا آپلود کنید.');
      return;
    }

    const employeeName = form.employee_name.value.trim();
    const unitName = form.unit_name.value.trim();
    const requestType = form.request_type.value;
    const notes = form.notes.value.trim();

    if (!employeeName) {
      Toast.error('نام و نام خانوادگی فرد الزامی است.');
      return;
    }
    if (!unitName) {
      Toast.error('واحد فرد الزامی است.');
      return;
    }

    const formData = new FormData();
    formData.append('card_image', fileInput.files[0]);
    formData.append('employee_name', employeeName);
    formData.append('unit_name', unitName);
    formData.append('request_type', requestType);
    if (notes) formData.append('notes', notes);

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        در حال ارسال...
      `;

      const res = await API.submitRequest(formData);
      Toast.success('درخواست با موفقیت برای مدیریت ارسال شد!');

      form.reset();
      this.removeSelectedImage();

      setTimeout(() => {
        this.setOfficerTab('history');
      }, 500);
    } catch (err) {
      Toast.error(err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
        ثبت و ارسال فرم برای مدیریت
      `;
    }
  },

  // ---------------------------------------------------------------------------
  // MESSAGES & SUPPORT CHAT
  // ---------------------------------------------------------------------------

  // Officer Chat
  async loadOfficerMessages() {
    try {
      const data = await API.getMessages();
      this.renderOfficerChatMessages(data.messages);
      this.checkUnreadMessages();
    } catch (err) {
      console.error(err);
    }
  },

  renderOfficerChatMessages(messages) {
    const box = document.getElementById('officer-chat-box');
    if (!box) return;

    if (!messages || messages.length === 0) {
      box.innerHTML = `
        <div class="text-center text-slate-500 py-12 text-sm">
          پیامی ثبت نشده است. می‌توانید اولین پیام خود را برای مدیر کل ارسال فرمایید.
        </div>
      `;
      return;
    }

    let html = '';
    messages.forEach(m => {
      const isMe = m.sender_role === 'officer';
      const timeStr = JalaliDate.format(m.created_at);

      html += `
        <div class="flex flex-col ${isMe ? 'items-start' : 'items-end'} mb-3">
          <div class="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
            <span class="font-bold ${isMe ? 'text-blue-400' : 'text-purple-400'}">${m.sender_name}</span>
            <span>•</span>
            <span>${timeStr}</span>
          </div>
          <div class="max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed ${
            isMe 
              ? 'bg-blue-600/30 border border-blue-500/40 text-blue-100 rounded-br-none' 
              : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-bl-none'
          }">
            ${m.message}
          </div>
        </div>
      `;
    });

    box.innerHTML = html;
    box.scrollTop = box.scrollHeight;
  },

  async sendOfficerMessage(e) {
    e.preventDefault();
    const input = document.getElementById('officer-chat-input');
    const text = input.value.trim();
    if (!text) return;

    try {
      input.value = '';
      await API.sendMessage(text);
      await this.loadOfficerMessages();
    } catch (err) {
      Toast.error('خطا در ارسال پیام: ' + err.message);
    }
  },

  // Admin Messages Management Modal
  async openMessagesModal() {
    try {
      const data = await API.getMessages();
      this.renderAdminThreads(data.threads);
      document.getElementById('messages-modal').classList.remove('hidden');
      this.checkUnreadMessages();

      // If there are threads, auto-select the first one
      if (data.threads && data.threads.length > 0 && !this.chatState.activeOfficerId) {
        this.selectAdminOfficerThread(data.threads[0].officer_id);
      }
    } catch (err) {
      Toast.error('خطا در بارگذاری پیام‌ها: ' + err.message);
    }
  },

  closeMessagesModal() {
    document.getElementById('messages-modal').classList.add('hidden');
    this.chatState.activeOfficerId = null;
  },

  renderAdminThreads(threads) {
    const listContainer = document.getElementById('admin-threads-list');
    if (!listContainer) return;

    let html = '';
    threads.forEach(t => {
      const isSelected = this.chatState.activeOfficerId === t.officer_id;
      const timeStr = t.last_message_time ? JalaliDate.timeAgo(t.last_message_time) : 'بدون پیام';

      html += `
        <div onclick="App.selectAdminOfficerThread(${t.officer_id})" 
          class="p-3 rounded-xl cursor-pointer transition-all border ${
            isSelected 
              ? 'bg-blue-600/20 border-blue-500/50 text-white shadow-md' 
              : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800 text-slate-300'
          }">
          <div class="flex items-center justify-between">
            <h5 class="font-bold text-sm text-white">${t.full_name}</h5>
            ${t.unread_count > 0 ? `
              <span class="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                ${t.unread_count}
              </span>
            ` : ''}
          </div>
          <div class="text-[11px] text-slate-400 mt-0.5">${t.organization_name} - ${t.unit_name}</div>
          <div class="text-xs text-slate-400 mt-2 truncate font-normal">
            ${t.last_message || 'هنوز پیامی رد و بدل نشده است'}
          </div>
          <div class="text-[10px] text-slate-500 text-left mt-1 font-mono">${timeStr}</div>
        </div>
      `;
    });

    listContainer.innerHTML = html;
  },

  async selectAdminOfficerThread(officerId) {
    this.chatState.activeOfficerId = officerId;
    try {
      const data = await API.getOfficerThread(officerId);
      
      document.getElementById('admin-chat-header-name').textContent = data.officer.full_name;
      document.getElementById('admin-chat-header-unit').textContent = `${data.officer.organization_name} • ${data.officer.unit_name}`;
      
      this.renderAdminChatMessages(data.messages);

      // Refresh threads unread counts
      const tData = await API.getMessages();
      this.renderAdminThreads(tData.threads);
      this.checkUnreadMessages();
    } catch (err) {
      Toast.error('خطا در دریافت مکالمات: ' + err.message);
    }
  },

  renderAdminChatMessages(messages) {
    const box = document.getElementById('admin-chat-box');
    if (!box) return;

    if (!messages || messages.length === 0) {
      box.innerHTML = `
        <div class="text-center text-slate-500 py-12 text-sm">
          هیچ پیامی در این گفتگو وجود ندارد. می‌توانید پیامی برای این مسئول بنویسید.
        </div>
      `;
      return;
    }

    let html = '';
    messages.forEach(m => {
      const isAdmin = m.sender_role === 'admin';
      const timeStr = JalaliDate.format(m.created_at);

      html += `
        <div class="flex flex-col ${isAdmin ? 'items-start' : 'items-end'} mb-3">
          <div class="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
            <span class="font-bold ${isAdmin ? 'text-purple-400' : 'text-blue-400'}">${m.sender_name}</span>
            <span>•</span>
            <span>${timeStr}</span>
          </div>
          <div class="max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed ${
            isAdmin 
              ? 'bg-purple-600/30 border border-purple-500/40 text-purple-100 rounded-br-none' 
              : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-bl-none'
          }">
            ${m.message}
          </div>
        </div>
      `;
    });

    box.innerHTML = html;
    box.scrollTop = box.scrollHeight;
  },

  async sendAdminMessage(e) {
    e.preventDefault();
    if (!this.chatState.activeOfficerId) return;

    const input = document.getElementById('admin-chat-input');
    const text = input.value.trim();
    if (!text) return;

    try {
      input.value = '';
      await API.sendMessage(text, this.chatState.activeOfficerId);
      await this.selectAdminOfficerThread(this.chatState.activeOfficerId);
    } catch (err) {
      Toast.error('خطا در ارسال پیام: ' + err.message);
    }
  },

  // ---------------------------------------------------------------------------
  // USERS MANAGEMENT MODAL (ADMIN ONLY)
  // ---------------------------------------------------------------------------

  async openUsersModal() {
    try {
      const data = await API.getUsers();
      this.renderUsersList(data.users);
      document.getElementById('users-modal').classList.remove('hidden');
    } catch (err) {
      Toast.error('خطا در دریافت کاربران: ' + err.message);
    }
  },

  closeUsersModal() {
    document.getElementById('users-modal').classList.add('hidden');
  },

  renderUsersList(users) {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    let html = '';
    users.forEach(u => {
      html += `
        <tr class="border-b border-slate-800 text-sm">
          <td class="p-3 font-mono text-xs text-blue-400 font-bold">${u.username}</td>
          <td class="p-3 font-semibold text-white">${u.full_name}</td>
          <td class="p-3">
            <span class="px-2 py-0.5 rounded text-xs ${u.role === 'admin' ? 'bg-purple-900/40 text-purple-300' : 'bg-slate-800 text-slate-300'}">
              ${u.role === 'admin' ? 'مدیر ارشد' : 'مسئول واحد'}
            </span>
          </td>
          <td class="p-3 text-slate-300">${u.organization_name || 'مدیریت کل'}</td>
          <td class="p-3 text-slate-400">${u.unit_name || '-'}</td>
          <td class="p-3 font-mono text-xs text-slate-400">${u.phone || '-'}</td>
          <td class="p-3 text-center font-bold text-blue-400">${u.submissions_count || 0}</td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  },

  // ---------------------------------------------------------------------------
  // QUICK DEMO LOGIN
  // ---------------------------------------------------------------------------

  async fastLogin(username, password) {
    try {
      const data = await API.login(username, password);
      Toast.success(`با حساب «${data.user.full_name}» وارد شدید.`);
      this.currentUser = data.user;
      this.renderApp();
      this.checkUnreadMessages();
    } catch (err) {
      Toast.error(err.message);
    }
  },

  async logout() {
    await API.logout();
    this.currentUser = null;
    this.selectedRequestIds.clear();
    Toast.info('از حساب خود خارج شدید.');
    this.showLoginView();
  },

  // ---------------------------------------------------------------------------
  // EVENT LISTENERS
  // ---------------------------------------------------------------------------

  bindGlobalEvents() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const u = loginForm.username.value.trim();
        const p = loginForm.password.value;
        await this.fastLogin(u, p);
      });
    }

    const requestForm = document.getElementById('new-request-form');
    if (requestForm) {
      requestForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    const officerChatForm = document.getElementById('officer-chat-form');
    if (officerChatForm) {
      officerChatForm.addEventListener('submit', (e) => this.sendOfficerMessage(e));
    }

    const adminChatForm = document.getElementById('admin-chat-form');
    if (adminChatForm) {
      adminChatForm.addEventListener('submit', (e) => this.sendAdminMessage(e));
    }

    const fileInput = document.getElementById('card-image-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleImageSelection(e.target.files[0]);
        }
      });
    }

    const dropzone = document.getElementById('file-dropzone');
    if (dropzone) {
      ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropzone.classList.add('dropzone-active');
        }, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropzone.classList.remove('dropzone-active');
        }, false);
      });

      dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
          fileInput.files = files;
          this.handleImageSelection(files[0]);
        }
      });
    }

    const searchInput = document.getElementById('filter-search');
    if (searchInput) {
      let debounceTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          this.filters.search = e.target.value;
          this.loadRequests();
        }, 300);
      });
    }

    const statusSelect = document.getElementById('filter-status-select');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.filters.status = e.target.value;
        this.loadRequests();
      });
    }

    const typeSelect = document.getElementById('filter-type-select');
    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => {
        this.filters.request_type = e.target.value;
        this.loadRequests();
      });
    }
  }
};

window.App = App;

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
