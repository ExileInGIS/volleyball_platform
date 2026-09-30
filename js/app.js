/* =========================================================
 * app.js — 路由 / 导航 / 顶栏 / 通知 / 角色切换
 * ========================================================= */
(function () {
  const VBM = window.VBM;
  const { icon, hydrate } = VBM;
  const main = document.getElementById('main');

  /* ---------------- 导航定义 ---------------- */
  const NAV = [
    { sec: '工作台' },
    { key: 'home', label: '首页', ico: 'home', route: 'home' },
    { sec: '日常管理' },
    { key: 'players', label: '球员管理', ico: 'users', route: 'players' },
    { key: 'training', label: '训练计划', ico: 'calendar', route: 'training' },
    { key: 'attendance', label: '出勤管理', ico: 'clipboard', route: 'attendance' },
    { sec: '比赛与数据' },
    { key: 'lineup', label: '阵容配置', ico: 'grid', route: 'lineup?matchId=M6' },
    { key: 'matches', label: '比赛管理', ico: 'trophy', route: 'matches' },
    { key: 'analytics', label: '数据分析', ico: 'chart', route: 'analytics' },
    { key: 'notifications', label: '通知中心', ico: 'bell', route: 'notifications', badge: true },
    { key: 'settings', label: '系统设置', ico: 'settings', route: 'settings', coachOnly: true }
  ];

  function buildNav() {
    const nav = document.getElementById('nav');
    nav.innerHTML = NAV.map(n => {
      if (n.sec) return `<div class="nav-sec">${n.sec}</div>`;
      if (n.coachOnly && VBM.state.role === 'player') return '';
      return `<a class="nav-item" data-route="${n.route}" href="#${n.route}">
        ${icon(n.ico)}<span>${n.label}</span>
        ${n.badge ? '<span class="nav-badge">' + VBM.D.notices.filter(x => x.unread).length + '</span>' : ''}
      </a>`;
    }).join('');
    hydrate(nav);
  }

  /* ---------------- 路由 ---------------- */
  const routes = [
    { re: /^home$/, page: 'home' },
    { re: /^players$/, page: 'players' },
    { re: /^player\/(\d+)$/, page: 'playerDetail' },
    { re: /^training\/new$/, page: 'createTraining' },
    { re: /^training\/detail$/, page: 'trainingDetail' },
    { re: /^training$/, page: 'training' },
    { re: /^attendance\/checkin$/, page: 'checkin' },
    { re: /^attendance$/, page: 'attendance' },
    { re: /^lineup$/, page: 'lineup' },
    { re: /^matches$/, page: 'matches' },
    { re: /^match\/([\w\d]+)$/, page: 'matchDetail' },
    { re: /^analytics$/, page: 'analytics' },
    { re: /^notifications$/, page: 'notifications' },
    { re: /^settings$/, page: 'settings' }
  ];

  function parseQuery(str) {
    const o = {};
    str.split('&').filter(Boolean).forEach(kv => { const [k, v] = kv.split('='); o[k] = decodeURIComponent(v || ''); });
    return o;
  }

  let currentPath = 'home';

  function renderRoute(rawPath) {
    const raw = (rawPath || currentPath || 'home').replace(/^#/, '');
    currentPath = raw;
    const [path, qstr] = raw.split('?');
    const params = parseQuery(qstr || '');
    let match = routes.find(r => r.re.test(path));
    if (!match) { match = routes[0]; }
    // 将路径中的捕获组映射为参数
    const cap = path.match(match.re);
    if (cap && cap.length > 1) {
      if (match.page === 'playerDetail') params.id = cap[1];
      if (match.page === 'matchDetail') params.id = cap[1];
    }
    // 球员角色不允许进入设置
    if (match.page === 'settings' && VBM.state.role === 'player') { VBM.go('home'); return; }

    try { window.scrollTo(0, 0); } catch (e) {}
    main.innerHTML = '';
    const fn = VBM.pages[match.page];
    if (fn) fn(main, params); else main.innerHTML = '<div class="empty">页面建设中</div>';
    setActiveNav(path);
    document.getElementById('sidebar').classList.remove('open');
  }

  // 统一导航入口：不依赖浏览器对 hash 链接 / hashchange 的支持
  function navigate(path) {
    const raw = String(path || 'home').replace(/^#/, '');
    if (raw === currentPath) {
      // 即便路径相同也确保地址栏同步
      try { if (location.hash.slice(1) !== raw) location.hash = raw; } catch (e) {}
      return;
    }
    try { location.hash = raw; } catch (e) {} // 某些预览环境可能限制，忽略后仍直接渲染
    renderRoute(raw);
  }

  function setActiveNav(path) {
    document.querySelectorAll('.nav-item').forEach(a => {
      const r = a.getAttribute('data-route').split('?')[0];
      const cur = path.split('/')[0];
      a.classList.toggle('active', r === cur || (r === 'home' && cur === ''));
    });
  }

  VBM.go = navigate;

  /* 拦截所有 hash 链接点击（导航栏 / 通知面板 / 页内链接），直接渲染，
     避免某些内嵌预览 WebView 不处理锚点跳转或 hashchange。 */
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const dest = a.getAttribute('href').slice(1);
    if (!dest) return;
    e.preventDefault();
    navigate(dest);
  });

  /* ---------------- 顶栏日期 ---------------- */
  function fillDate() {
    const d = new Date(VBM.D.today + 'T00:00:00');
    document.getElementById('tbDate').textContent =
      `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日 ${['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][d.getDay()]}`;
  }

  /* ---------------- 通知下拉 ---------------- */
  const TYPE_ICO = {
    '训练': { ico: 'calendar', bg: 'var(--purple-soft)', fg: 'var(--purple)' },
    '出勤': { ico: 'clipboard', bg: 'var(--blue-bg)', fg: 'var(--blue)' },
    '比赛': { ico: 'trophy', bg: 'var(--green-bg)', fg: 'var(--green)' },
    '数据': { ico: 'chart', bg: 'var(--amber-bg)', fg: 'var(--amber)' }
  };
  function buildNotifyPanel() {
    const unread = VBM.D.notices.filter(n => n.unread).length;
    document.getElementById('notifyDot').style.display = unread ? 'block' : 'none';
    const panel = document.getElementById('notifyPanel');
    panel.innerHTML = `<div class="np-head"><strong>通知</strong><span class="tag tag-purple">${unread} 条未读</span></div>
      ${VBM.D.notices.slice(0, 5).map(n => {
        const m = TYPE_ICO[n.type];
        return `<div class="np-item">
          <span class="np-ico" style="background:${m.bg};color:${m.fg}">${icon(m.ico)}</span>
          <div style="flex:1"><p>${n.body}</p><time>${n.when}</time></div>
        </div>`;
      }).join('')}
      <a class="np-all" href="#notifications">查看全部通知</a>`;
  }
  document.getElementById('notifyBtn').addEventListener('click', e => {
    e.stopPropagation();
    document.getElementById('notifyPanel').classList.toggle('open');
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.notify-wrap')) document.getElementById('notifyPanel').classList.remove('open');
  });

  /* ---------------- 角色切换（权限演示） ---------------- */
  document.querySelectorAll('.rs-btn').forEach(b => b.addEventListener('click', () => {
    const role = b.getAttribute('data-role');
    VBM.state.role = role;
    document.querySelectorAll('.rs-btn').forEach(x => x.classList.toggle('active', x === b));
    document.getElementById('tbRole').textContent = role === 'coach' ? '队长' : '球员';
    buildNav();
    renderRoute();
    VBM.toast(role === 'coach' ? '已切换到教练/队长视角（完整管理权限）' : '已切换到球员视角（只读）', 'info');
  }));

  /* 球员只读化处理 */
  VBM.playerize = function (c) {
    const hideSel = ['.head-actions', '#addPlayer', '#newTr', '#allPresent', '#batch', '#save', '#saveLineup', '#altLineup', '#editStats', '#addMatch', '#edit'];
    hideSel.forEach(s => c.querySelectorAll(s).forEach(n => n.style.display = 'none'));
    const note = document.createElement('div');
    note.className = 'readonly-note';
    note.innerHTML = icon('shield') + '球员视角：仅可查看训练计划、个人记录/数据、比赛安排、出勤与阵容，不能修改或决定首发。';
    c.insertBefore(note, c.firstChild);
  };

  /* 移动端菜单 */
  document.getElementById('menuToggle').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));

  /* ---------------- 初始化 ---------------- */
  buildNav();
  fillDate();
  buildNotifyPanel();
  // 浏览器前进/后退（若环境支持 hashchange）
  window.addEventListener('hashchange', function () {
    const raw = (location.hash || '#home').slice(1);
    if (raw !== currentPath) renderRoute(raw);
  });
  // 初始路由：优先用地址栏已有 hash，否则首页
  const initial = (location.hash || '#home').slice(1) || 'home';
  renderRoute(initial);
})();
