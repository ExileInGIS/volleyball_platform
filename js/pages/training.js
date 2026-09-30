/* 训练计划：周视图 / 月视图 / 详情 / 创建 / 编辑 */
(function () {
  const VBM = window.VBM;
  const { icon, esc } = VBM;
  VBM.pages = VBM.pages || {};

  VBM.pages.training = function (c, params) {
    const D = VBM.D;
    c.innerHTML = `
      <div class="page-head">
        <div><div class="page-title">训练计划</div>
          <div class="page-desc">训练流程：创建训练 → 发布 → 球员查看 → 训练签到 → 记录表现 → 形成训练数据</div></div>
        <div class="head-actions"><button class="btn btn-primary" id="newTr">${icon('plus')} 新建训练</button></div>
      </div>
      <div class="seg" id="viewSeg" style="margin-bottom:16px">
        <button data-v="week" class="active">周视图</button><button data-v="month">月视图</button>
      </div>
      <div id="viewBody"></div>`;

    const body = c.querySelector('#viewBody');
    let view = 'week';
    c.querySelectorAll('#viewSeg button').forEach(b => b.onclick = () => {
      view = b.getAttribute('data-v');
      c.querySelectorAll('#viewSeg button').forEach(x => x.classList.toggle('active', x === b));
      render();
    });
    c.querySelector('#newTr').onclick = () => VBM.go('training/new');

    function render() {
      if (view === 'week') renderWeek(); else renderMonth();
    }

    function renderWeek() {
      // 本周训练（以今天所在周的周一为起点）
      const now = new Date(D.today + 'T00:00:00');
      const monday = VBM.util.addDays(now, -((now.getDay() + 6) % 7));
      const cards = [];
      for (let i = 0; i < 7; i++) {
        const d = VBM.util.addDays(monday, i);
        const tr = D.trainings.find(t => t.date === VBM.util.fmt(d));
        if (tr) cards.push({ d, tr });
      }
      body.innerHTML = `
        <div class="card">
          <div class="card-head"><div class="card-title">本周训练计划</div>
            <span class="ct-tag" style="font-size:12px;color:var(--ink-3)">${VBM.util.fmt(monday)} 起</span></div>
          <div class="week-grid">
            ${cards.map(({ d, tr }) => {
              const isToday = tr.date === D.today;
              return `<div class="plan-card" data-id="${tr.id}">
                <div class="pc-day"><span>${VBM.util.WEEK[d.getDay()]}</span>${isToday ? '<span class="tag tag-red" style="font-size:10px">今天</span>' : ''}</div>
                <div class="pc-body">
                  <div class="pc-theme">${tr.title}</div>
                  <div class="pc-meta">${icon('clock')} ${tr.start_time}—${tr.end_time}</div>
                  <div class="pc-meta">${icon('pin')} ${tr.location}</div>
                  <div class="pc-meta">${icon('users')} 实到 ${tr.actual_count}/${tr.expected_count}</div>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>`;
      body.querySelectorAll('.plan-card').forEach(p => p.onclick = () => VBM.go('training/detail?id=' + p.getAttribute('data-id')));
    }

    function renderMonth() {
      const now = new Date(D.today + 'T00:00:00');
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const start = VBM.util.addDays(first, -first.getDay());
      const cells = [];
      for (let i = 0; i < 42; i++) {
        const d = VBM.util.addDays(start, i);
        const tr = D.trainings.find(t => t.date === VBM.util.fmt(d));
        cells.push({ d, tr, out: d.getMonth() !== now.getMonth() });
      }
      body.innerHTML = `<div class="card">
        <div class="card-head"><div class="card-title">${now.getMonth() + 1} 月训练日历</div></div>
        <div class="calendar">
          ${['日', '一', '二', '三', '四', '五', '六'].map(w => `<div class="cal-head">周${w}</div>`).join('')}
          ${cells.map(x => `<div class="cal-cell ${x.out ? 'out' : ''} ${x.d.getTime() === new Date(D.today + 'T00:00:00').getTime() ? 'today' : ''}">
            <div class="cal-num">${x.d.getDate()}</div>
            ${x.tr ? `<div class="cal-ev" data-id="${x.tr.id}">${x.tr.start_time} ${x.tr.title}</div>` : ''}
          </div>`).join('')}
        </div>
      </div>`;
      body.querySelectorAll('.cal-ev').forEach(e => e.onclick = () => VBM.go('training/detail?id=' + e.getAttribute('data-id')));
    }
    render();
    if (VBM.state.role === 'player') VBM.playerize(c);
  };

  /* ---------------- 训练详情 ---------------- */
  VBM.pages.trainingDetail = function (c, params) {
    const t = VBM.q.training(params.id);
    if (!t) { c.innerHTML = '<div class="empty">训练不存在</div>'; return; }
    c.innerHTML = `
      <span class="back-link" data-back>${icon('chevron-left')} 返回训练计划</span>
      <div class="card">
        <div class="card-head">
          <div class="card-title" style="font-size:18px">${t.title} <span class="tag tag-purple">${t.weekday}</span></div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-sm btn-soft" data-go="attendance/checkin?id=${t.id}">${icon('clipboard')} 签到</button>
            <button class="btn btn-sm btn-ghost" id="edit">${icon('edit')} 修改</button>
          </div>
        </div>
        <div class="grid g-3">
          <div class="dl-item" style="border:1px solid var(--line);border-radius:10px;padding:13px"><dt style="color:var(--ink-3);font-size:12px">时间</dt><dd style="font-weight:700;margin-top:3px">${t.date} ${t.start_time}—${t.end_time}</dd></div>
          <div class="dl-item" style="border:1px solid var(--line);border-radius:10px;padding:13px"><dt style="color:var(--ink-3);font-size:12px">地点</dt><dd style="font-weight:700;margin-top:3px">${t.location}</dd></div>
          <div class="dl-item" style="border:1px solid var(--line);border-radius:10px;padding:13px"><dt style="color:var(--ink-3);font-size:12px">人数</dt><dd style="font-weight:700;margin-top:3px">预计 ${t.expected_count} / 实际 ${t.actual_count}</dd></div>
        </div>
        <div style="margin-top:16px;display:flex;flex-direction:column;gap:14px">
          <div><h4 style="font-size:13.5px;margin-bottom:5px">训练目标</h4><p style="color:var(--ink-2);font-size:13.5px">${t.goal}</p></div>
          <div><h4 style="font-size:13.5px;margin-bottom:5px">训练内容</h4><p style="color:var(--ink-2);font-size:13.5px">${t.content}（共 ${t.drills.length} 个项目）</p></div>
          <div><h4 style="font-size:13.5px;margin-bottom:5px">完成度</h4><div class="progress" style="max-width:420px"><span style="width:${t.completion_rate}%"></span></div><div style="font-size:12.5px;color:var(--ink-3);margin-top:5px">${t.completion_rate}%</div></div>
          <div><h4 style="font-size:13.5px;margin-bottom:5px">教练备注</h4><p style="color:var(--ink-2);font-size:13.5px">${t.remark || '暂无备注'}</p></div>
        </div>
      </div>`;
    c.querySelector('[data-back]').onclick = () => VBM.go('training');
    c.querySelector('[data-go]').onclick = e => VBM.go(e.currentTarget.getAttribute('data-go'));
    c.querySelector('#edit').onclick = () => trainingForm(t);
  };

  /* ---------------- 创建 / 编辑表单 ---------------- */
  function trainingForm(existing) {
    const t = existing || {};
    VBM.modal({
      title: existing ? '修改训练' : '创建训练', size: 'lg',
      body: `<div class="form-grid">
        <div class="form-field"><label>训练日期 <span class="req">*</span></label><input class="input" type="date" id="tf_date" value="${t.date || VBM.D.today}"></div>
        <div class="form-field"><label>训练时间</label>
          <div style="display:flex;gap:8px"><input class="input" type="time" id="tf_st" value="${t.start_time || '19:00'}"><input class="input" type="time" id="tf_et" value="${t.end_time || '21:00'}"></div></div>
        <div class="form-field full"><label>训练地点</label><input class="input" id="tf_loc" value="${t.location || '南京大学体育馆'}"></div>
        <div class="form-field"><label>训练主题 <span class="req">*</span></label><input class="input" id="tf_title" value="${t.title || ''}" placeholder="如 接发球专项"></div>
        <div class="form-field"><label>预计时长 (min)</label><input class="input" type="number" id="tf_dur" value="120"></div>
        <div class="form-field full"><label>训练目标</label><textarea class="textarea" id="tf_goal">${t.goal || ''}</textarea></div>
        <div class="form-field full"><label>训练项目（逗号分隔）</label><input class="input" id="tf_items" value="${t.content || ''}" placeholder="接发球、防守、扣球"></div>
        <div class="form-field"><label>参与球员</label>
          <select class="select-input" id="tf_who"><option value="all">全体球员（18人）</option>${VBM.D.POSITIONS.map(p => `仅 ${p}`).map(o => `<option>${o}</option>`).join('')}</select></div>
        <div class="form-field"><label>预计人数</label><input class="input" type="number" id="tf_exp" value="18"></div>
        <div class="form-field full"><label>教练备注</label><textarea class="textarea" id="tf_remark">${t.remark || ''}</textarea></div>
      </div>`,
      buttons: [
        { text: '取消', onClick: ({ close }) => close() },
        {
          text: existing ? '保存修改' : '创建训练', primary: true,
          onClick: ({ close, body }) => {
            const title = body.querySelector('#tf_title').value.trim();
            if (!title) { VBM.toast('请填写训练主题', 'err'); return; }
            const v = id => body.querySelector(id).value;
            const items = v('#tf_items').split(/[、,，]/).map(s => s.trim()).filter(Boolean);
            if (existing) {
              Object.assign(existing, {
                date: v('#tf_date'), start_time: v('#tf_st'), end_time: v('#tf_et'),
                location: v('#tf_loc'), title, goal: v('#tf_goal'), content: items.join('、'),
                drills: items, expected_count: Number(v('#tf_exp')), remark: v('#tf_remark')
              });
              VBM.toast('训练计划已更新', 'ok');
            } else {
              const id = 'T' + Date.now();
              const d = new Date(v('#tf_date') + 'T00:00:00');
              const tr = {
                id, date: v('#tf_date'), weekday: VBM.util.WEEK[d.getDay()],
                start_time: v('#tf_st'), end_time: v('#tf_et'), location: v('#tf_loc'),
                title, goal: v('#tf_goal'), content: items.join('、'), drills: items,
                expected_count: Number(v('#tf_exp')), actual_count: 0, completion_rate: 0,
                remark: v('#tf_remark'), isNew: true
              };
              VBM.D.trainings.push(tr);
              // 自动生成初始出勤记录（默认未签到）
              VBM.D.players.forEach(p => VBM.D.attendance.push({
                id: 'A' + Date.now() + p.id, training_id: id, player_id: p.id, status: 'absent', remark: '尚未签到'
              }));
              VBM.toast('训练已创建并发布，球员可查看并签到', 'ok');
            }
            close(); VBM.go('training');
          }
        }
      ]
    });
  }
  VBM.trainingForm = trainingForm;

  VBM.pages.createTraining = function (c) {
    c.innerHTML = '<div></div>';
    // 直接以弹窗形式承载创建表单
    trainingForm(null);
    setTimeout(() => VBM.go('training'), 0);
  };
})();
