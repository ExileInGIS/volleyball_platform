/* 出勤管理 + 签到详情 */
(function () {
  const VBM = window.VBM;
  const { icon } = VBM;
  VBM.pages = VBM.pages || {};

  VBM.pages.attendance = function (c) {
    const D = VBM.D;
    const list = [...D.trainings].reverse();
    const last = list[0];
    c.innerHTML = `
      <div class="page-head">
        <div><div class="page-title">出勤管理</div>
          <div class="page-desc">所有出勤率均由签到记录实时统计，系统仅做客观数据提醒</div></div>
      </div>
      <div class="grid g-5" style="margin-bottom:18px">
        ${[
          ['本月出勤率', VBM.q.teamSummary().attendance + '%', 'trend', 'var(--purple)'],
          ['应到人次', D.trainings.length * 18, 'users', '#3E79C9'],
          ['实到人次', D.attendance.filter(a => VBM.q.onTime(a.status)).length, 'check', 'var(--green)'],
          ['缺勤人次', D.attendance.filter(a => a.status === 'absent').length, 'alert', 'var(--red)'],
          ['请假人次', D.attendance.filter(a => a.status === 'leave').length, 'clock', 'var(--amber)']
        ].map(s => `<div class="stat-card"><div class="sc-top"><span class="sc-label">${s[0]}</span>
          <span class="sc-ico" style="background:var(--purple-soft);color:${s[3]}">${icon(s[2])}</span></div>
          <div class="sc-value">${s[1]}</div></div>`).join('')}
      </div>
      <div class="card">
        <div class="card-head"><div class="card-title">训练记录表</div></div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>日期</th><th>训练内容</th><th class="num">应到</th><th class="num">实到</th><th class="num">请假</th><th class="num">缺勤</th><th class="num">出勤率</th></tr></thead>
            <tbody>${list.map(t => `<tr data-id="${t.id}">
              <td style="white-space:nowrap">${t.date} <span style="color:var(--ink-3);font-size:12px">${t.weekday}</span></td>
              <td>${t.title}</td>
              <td class="num">${t.expected_count}</td>
              <td class="num">${t.actual_count}</td>
              <td class="num">${t.leave_count}</td>
              <td class="num">${t.absent_count}</td>
              <td class="num"><span class="att-pill" style="color:${t.actual_count / t.expected_count >= .9 ? 'var(--green)' : 'var(--amber)'}">${Math.round(t.actual_count / t.expected_count * 100)}%</span></td>
            </tr>`).join('')}</tbody>
          </table>
        </div>
      </div>`;
    c.querySelectorAll('tr[data-id]').forEach(r => r.onclick = () => VBM.go('attendance/checkin?id=' + r.getAttribute('data-id')));
    if (VBM.state.role === 'player') VBM.playerize(c);
  };

  /* ---------------- 签到详情 ---------------- */
  VBM.pages.checkin = function (c, params) {
    const t = VBM.q.training(params.id);
    if (!t) { c.innerHTML = '<div class="empty">训练不存在</div>'; return; }
    let recs = VBM.q.recsOfTraining(t.id);

    c.innerHTML = `
      <span class="back-link" data-back>${icon('chevron-left')} 返回出勤管理</span>
      <div class="card">
        <div class="card-head">
          <div class="card-title" style="font-size:18px">签到详情 · ${t.title}
            <span class="ct-tag">${t.date} ${t.start_time}</span></div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-sm btn-soft" id="allPresent">全部签到</button>
            <button class="btn btn-sm btn-ghost" id="batch">批量修改状态</button>
          </div>
        </div>
        <div id="gridBox" class="checkin-grid"></div>
        <div id="anomaly" style="margin-top:18px"></div>
        <div style="margin-top:18px;text-align:right"><button class="btn btn-primary" id="save">${icon('save')} 保存记录</button></div>
      </div>`;

    const box = c.querySelector('#gridBox');
    function render() {
      box.innerHTML = recs.map(r => {
        const p = VBM.q.player(r.player_id);
        return `<div class="checkin-item">
          ${VBM.avatar(p)}
          <div class="ci-name"><strong>${p.name}</strong><small>${p.position} · #${p.number}</small></div>
          <select class="status-select s-${r.status}" data-pid="${p.id}">
            ${['present', 'leave', 'absent', 'late'].map(s => `<option value="${s}" ${r.status === s ? 'selected' : ''}>${VBM.ATT_STATUS[s].text}</option>`).join('')}
          </select>
        </div>`;
      }).join('');
      box.querySelectorAll('select').forEach(sel => sel.onchange = () => {
        const r = recs.find(x => x.player_id === Number(sel.getAttribute('data-pid')));
        r.status = sel.value;
        sel.className = 'status-select s-' + sel.value;
      });
    }
    render();

    c.querySelector('#allPresent').onclick = () => { recs.forEach(r => r.status = 'present'); render(); VBM.toast('已将全部球员设为出勤'); };
    c.querySelector('#batch').onclick = () => {
      VBM.modal({
        title: '批量修改状态',
        body: `<p style="font-size:13px;margin-bottom:12px">将当前非出勤球员统一修改为：</p>
          <select class="select-input" id="bs">${['present', 'late', 'leave', 'absent'].map(s => `<option value="${s}">${VBM.ATT_STATUS[s].text}</option>`).join('')}</select>`,
        buttons: [
          { text: '取消', onClick: ({ close }) => close() },
          { text: '应用', primary: true, onClick: ({ close, body }) => {
            const v = body.querySelector('#bs').value;
            recs.forEach(r => { if (!VBM.q.onTime(r.status)) r.status = v; });
            render(); close();
          } }
        ]
      });
    };
    c.querySelector('#save').onclick = () => {
      // 回写训练汇总（实际人数由出勤记录驱动）
      t.actual_count = recs.filter(r => VBM.q.onTime(r.status)).length;
      t.leave_count = recs.filter(r => r.status === 'leave').length;
      t.absent_count = recs.filter(r => r.status === 'absent').length;
      t.late_count = recs.filter(r => r.status === 'late').length;
      // 同步球员月度出勤率
      VBM.D.players.forEach(p => {
        const rs = VBM.q.recsOfPlayer(p.id);
        p.attendance_rate = Math.round(rs.filter(a => VBM.q.onTime(a.status)).length / rs.length * 100);
      });
      renderAnomaly();
      VBM.toast('签到记录已保存，出勤数据已更新', 'ok');
    };
    c.querySelector('[data-back]').onclick = () => VBM.go('attendance');

    function renderAnomaly() {
      const anomalies = VBM.q.attendanceAnomalies();
      const box2 = c.querySelector('#anomaly');
      if (!anomalies.length) { box2.innerHTML = '<div class="lineup-alert la-ok">' + icon('check') + '近 4 次训练无出勤异常。</div>'; return; }
      box2.innerHTML = anomalies.map(a => `<div class="lineup-alert la-info">${icon('info')}
        <div><strong>${a.player.name}</strong> 近 ${a.total} 次训练中有 ${a.bad} 次非出勤（请假/缺勤/迟到），建议关注。<br>
        <span style="font-size:11.5px;opacity:.8">说明：系统仅基于客观出勤记录提示，不做球员能力、健康或人格判断。</span></div></div>`).join('');
    }
    renderAnomaly();
  };
})();
