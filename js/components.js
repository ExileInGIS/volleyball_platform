/* =========================================================
 * components.js — 图标 / 弹窗 / Toast / 通用片段
 * ========================================================= */
(function () {
  const VBM = window.VBM;

  /* ---------- 线性图标（24x24，stroke） ---------- */
  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 16v-5"/><path d="M12 16V8"/><path d="M17 16v-8"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"/><circle cx="12" cy="12" r="3"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    x: '<path d="M18 6 6 18M6 6l18 18"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    volleyball: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
    trend: '<path d="M22 7 13.5 15.5 8.5 10.5 2 17"/><path d="M16 7h6v6"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>'
  };
  function icon(name, size) {
    const body = ICONS[name] || ICONS.info;
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${size ? ` width="${size}" height="${size}"` : ''}>${body}</svg>`;
  }
  VBM.icon = icon;

  /* 把容器内 [data-icon] 占位替换为 svg */
  function hydrate(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(n => {
      n.innerHTML = icon(n.getAttribute('data-icon'));
      n.removeAttribute('data-icon');
    });
  }
  VBM.hydrate = hydrate;

  /* ---------- 通用片段 ---------- */
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  VBM.esc = esc;

  function avatar(p, cls) {
    const color = VBM.D.POS_COLOR[p.position];
    return `<span class="cell-avatar ${cls || ''}" style="background:${color}">${esc(p.name[0])}</span>`;
  }
  VBM.avatar = avatar;

  const ATT_STATUS = {
    present: { text: '出勤', cls: 'tag-green' },
    leave: { text: '请假', cls: 'tag-amber' },
    absent: { text: '缺勤', cls: 'tag-red' },
    late: { text: '迟到', cls: 'tag-blue' }
  };
  function statusTag(st) { const s = ATT_STATUS[st]; return `<span class="tag ${s.cls}">${s.text}</span>`; }
  VBM.statusTag = statusTag;
  VBM.ATT_STATUS = ATT_STATUS;

  function trainStateTag(p) {
    if (p.attendance_rate >= 90) return '<span class="tag tag-green">正常</span>';
    if (p.attendance_rate >= 85) return '<span class="tag tag-amber">需关注</span>';
    return '<span class="tag tag-red">重点跟进</span>';
  }
  VBM.trainStateTag = trainStateTag;

  /* ---------- Toast ---------- */
  function toast(msg, type = 'info') {
    const root = document.getElementById('toastRoot');
    const t = document.createElement('div');
    t.className = 'toast ' + (type === 'ok' ? 'ok' : type === 'err' ? 'err' : 'info');
    t.innerHTML = icon(type === 'ok' ? 'check' : type === 'err' ? 'alert' : 'info') + '<span>' + esc(msg) + '</span>';
    root.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(-8px)'; t.style.transition = '.3s'; setTimeout(() => t.remove(), 300); }, 2200);
  }
  VBM.toast = toast;

  /* ---------- Modal ---------- */
  function modal(opt) {
    const root = document.getElementById('modalRoot');
    const mask = document.createElement('div');
    mask.className = 'modal-mask';
    mask.innerHTML = `<div class="modal ${opt.size === 'lg' ? 'lg' : ''}">
      <div class="modal-head"><h3>${esc(opt.title || '')}</h3>
        <button class="modal-close" data-close>${icon('x')}</button></div>
      <div class="modal-body"></div>
      ${opt.footer !== false ? '<div class="modal-foot"></div>' : ''}
    </div>`;
    root.appendChild(mask);
    hydrate(mask);
    const body = mask.querySelector('.modal-body');
    if (opt.body instanceof Node) body.appendChild(opt.body);
    else body.innerHTML = opt.body || '';
    const foot = mask.querySelector('.modal-foot');
    if (opt.buttons && foot) {
      opt.buttons.forEach(b => {
        const btn = document.createElement('button');
        btn.className = 'btn ' + (b.primary ? 'btn-primary' : 'btn-ghost');
        btn.innerHTML = (b.icon ? icon(b.icon) : '') + esc(b.text);
        btn.onclick = () => b.onClick && b.onClick({ close: close, body });
        foot.appendChild(btn);
      });
    }
    function close() { mask.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    mask.addEventListener('mousedown', e => { if (e.target === mask && opt.dismissable !== false) close(); });
    mask.querySelectorAll('[data-close]').forEach(b => b.onclick = close);
    if (opt.onMount) opt.onMount(body, close);
    hydrate(mask);
    return { close, body, mask };
  }
  VBM.modal = modal;

  /* 确认框 */
  function confirmBox(text, onOk) {
    modal({
      title: '请确认',
      body: `<p style="font-size:13.5px;line-height:1.7">${esc(text)}</p>`,
      buttons: [
        { text: '取消', onClick: ({ close }) => close() },
        { text: '确认', primary: true, onClick: ({ close }) => { close(); onOk && onOk(); } }
      ]
    });
  }
  VBM.confirmBox = confirmBox;
})();
