/* 通知中心 */
(function () {
  const VBM = window.VBM;
  const { icon } = VBM;
  VBM.pages = VBM.pages || {};

  const TYPE_ICO = {
    '训练': { ico: 'calendar', bg: 'var(--purple-soft)', fg: 'var(--purple)' },
    '出勤': { ico: 'clipboard', bg: 'var(--blue-bg)', fg: 'var(--blue)' },
    '比赛': { ico: 'trophy', bg: 'var(--green-bg)', fg: 'var(--green)' },
    '数据': { ico: 'chart', bg: 'var(--amber-bg)', fg: 'var(--amber)' }
  };

  VBM.pages.notifications = function (c) {
    const D = VBM.D;
    let filter = '全部';
    c.innerHTML = `
      <div class="page-head">
        <div><div class="page-title">通知中心</div>
          <div class="page-desc">统一收敛微信群式的零散通知：训练 / 出勤 / 比赛 / 数据</div></div>
        <div class="head-actions"><button class="btn btn-ghost" id="readAll">${icon('check')} 全部已读</button></div>
      </div>
      <div class="notice-filter" id="filter">
        ${['全部', '训练', '比赛', '出勤', '数据'].map((t, i) =>
          `<button class="notice-tab ${i === 0 ? 'active' : ''}" data-t="${t}">${t}</button>`).join('')}
      </div>
      <div id="list"></div>`;

    const listBox = c.querySelector('#list');
    function render() {
      const list = filter === '全部' ? D.notices : D.notices.filter(n => n.type === filter);
      listBox.innerHTML = list.length ? list.map(n => {
        const m = TYPE_ICO[n.type];
        return `<div class="notice-item">
          <span class="ni-ico" style="background:${m.bg};color:${m.fg}">${icon(m.ico)}</span>
          <div style="flex:1">
            <div style="display:flex;justify-content:space-between;gap:10px"><h4>${n.title}</h4>
              <time>${n.when}</time></div>
            <p>${n.body}</p>
            <div style="margin-top:6px"><span class="tag tag-gray">${n.type}通知</span>
              ${n.unread ? '<span class="tag tag-purple">未读</span>' : '<span class="tag tag-gray">已读</span>'}</div>
          </div>
        </div>`;
      }).join('') : '<div class="empty">该分类下暂无通知</div>';
    }
    render();

    c.querySelector('#filter').querySelectorAll('button').forEach(b => b.onclick = () => {
      filter = b.getAttribute('data-t');
      c.querySelector('#filter').querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
      render();
    });
    c.querySelector('#readAll').onclick = () => {
      D.notices.forEach(n => n.unread = false);
      document.getElementById('notifyDot').style.display = 'none';
      render(); VBM.toast('已全部标记为已读', 'ok');
    };
  };
})();
