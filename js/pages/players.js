/* 球员管理 + 球员详情 */
(function () {
  const VBM = window.VBM;
  const { icon, esc } = VBM;
  VBM.pages = VBM.pages || {};

  /* ---------------- 列表 ---------------- */
  VBM.pages.players = function (c) {
    const D = VBM.D;
    c.innerHTML = `
      <div class="page-head">
        <div><div class="page-title">球员管理</div>
          <div class="page-desc">在册球员 18 人 · 主攻5 / 副攻4 / 二传3 / 接应3 / 自由人3</div></div>
        <div class="head-actions"><button class="btn btn-primary" id="addPlayer">${icon('plus')} 添加球员</button></div>
      </div>
      <div class="card">
        <div class="toolbar">
          <div class="search-box">${icon('search')}<input id="kw" placeholder="搜索姓名 / 学号 / 号码" /></div>
          <select class="select" id="fPos"><option value="">全部位置</option>${D.POSITIONS.map(p => `<option>${p}</option>`).join('')}</select>
          <select class="select" id="fGrade"><option value="">全部年级</option><option>2023级</option><option>2024级</option><option>2025级</option></select>
          <select class="select" id="fAtt">
            <option value="">全部出勤率</option><option value="90">≥90% 正常</option>
            <option value="85">85–89% 需关注</option><option value="0"><85% 重点跟进</option>
          </select>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr>
              <th>姓名</th><th>学号</th><th>位置</th><th>年级</th><th class="num">出勤率</th><th>训练状态</th><th>操作</th>
            </tr></thead>
            <tbody id="rows"></tbody>
          </table>
        </div>
      </div>`;

    const rows = c.querySelector('#rows');
    function render() {
      const kw = c.querySelector('#kw').value.trim();
      const pos = c.querySelector('#fPos').value;
      const grade = c.querySelector('#fGrade').value;
      const att = c.querySelector('#fAtt').value;
      const list = D.players.filter(p => {
        if (kw && !(p.name.includes(kw) || p.student_id.includes(kw) || String(p.number).includes(kw))) return false;
        if (pos && p.position !== pos) return false;
        if (grade && p.grade !== grade) return false;
        if (att !== '') {
          if (att === '90' && p.attendance_rate < 90) return false;
          if (att === '85' && !(p.attendance_rate >= 85 && p.attendance_rate < 90)) return false;
          if (att === '0' && p.attendance_rate >= 85) return false;
        }
        return true;
      });
      rows.innerHTML = list.length ? list.map(p => `<tr data-id="${p.id}">
        <td><div class="cell-player">${VBM.avatar(p)}<div class="cp-meta"><strong>${p.name}</strong><small>#${p.number} 球衣号</small></div></div></td>
        <td>${p.student_id}</td>
        <td><span class="tag tag-purple">${p.position}</span></td>
        <td>${p.grade}</td>
        <td class="num"><span class="att-pill" style="color:${p.attendance_rate >= 90 ? 'var(--green)' : p.attendance_rate >= 85 ? 'var(--amber)' : 'var(--red)'}">${p.attendance_rate}%</span></td>
        <td>${VBM.trainStateTag(p)}</td>
        <td><button class="btn btn-sm btn-soft" data-view="${p.id}">查看详情</button></td>
      </tr>`).join('') : '<tr><td colspan="7"><div class="empty">未找到匹配的球员</div></td></tr>';
      rows.querySelectorAll('[data-view]').forEach(b => b.onclick = e => { e.stopPropagation(); VBM.go('player/' + b.getAttribute('data-view')); });
      rows.querySelectorAll('tr[data-id]').forEach(r => r.onclick = () => VBM.go('player/' + r.getAttribute('data-id')));
    }
    ['kw', 'fPos', 'fGrade', 'fAtt'].forEach(id => c.querySelector('#' + id).addEventListener('input', render));
    c.querySelector('#addPlayer').onclick = addPlayerForm;
    render();
    if (VBM.state.role === 'player') VBM.playerize(c);
  };

  /* ---------------- 添加球员表单 ---------------- */
  function addPlayerForm() {
    VBM.modal({
      title: '添加球员', size: 'lg',
      body: `<div class="form-grid">
        <div class="form-field"><label>姓名 <span class="req">*</span></label><input class="input" id="np_name"></div>
        <div class="form-field"><label>学号 <span class="req">*</span></label><input class="input" id="np_sid" placeholder="如 20262601"></div>
        <div class="form-field"><label>场上位置</label><select class="select-input" id="np_pos">${VBM.D.POSITIONS.map(p => `<option>${p}</option>`).join('')}</select></div>
        <div class="form-field"><label>年级</label><select class="select-input" id="np_grade"><option>2023级</option><option>2024级</option><option selected>2025级</option><option>2026级</option></select></div>
        <div class="form-field"><label>球衣号码</label><input class="input" id="np_num" type="number" value="${VBM.D.players.length + 1}"></div>
        <div class="form-field"><label>惯用手</label><select class="select-input" id="np_hand"><option>右手</option><option>左手</option></select></div>
        <div class="form-field"><label>身高 (cm)</label><input class="input" id="np_h" type="number"></div>
        <div class="form-field"><label>体重 (kg)</label><input class="input" id="np_w" type="number"></div>
      </div>`,
      buttons: [
        { text: '取消', onClick: ({ close }) => close() },
        {
          text: '添加', primary: true,
          onClick: ({ close, body }) => {
            const name = body.querySelector('#np_name').value.trim();
            if (!name) { VBM.toast('请填写球员姓名', 'err'); return; }
            const pos = body.querySelector('#np_pos').value;
            const id = VBM.D.players.length + 1;
            VBM.D.players.push({
              id, name, number: Number(body.querySelector('#np_num').value) || id,
              position: pos, grade: body.querySelector('#np_grade').value,
              student_id: body.querySelector('#np_sid').value || '20260000',
              height: Number(body.querySelector('#np_h').value) || 0,
              weight: Number(body.querySelector('#np_w').value) || 0,
              hand: body.querySelector('#np_hand').value,
              attendance_rate: 100, training_completion_rate: 0,
              pass_rate: pos === '自由人' ? 70 : 58, spike_success_rate: 45, serve_score_rate: 16, block_success_rate: 15,
              weekly: { pass: [60, 60, 60, 60], spike: [45, 45, 45, 45] }
            });
            VBM.toast('球员 ' + name + ' 已加入球队', 'ok');
            close(); VBM.go('players');
          }
        }
      ]
    });
  }

  /* ---------------- 详情 ---------------- */
  VBM.pages.playerDetail = function (c, params) {
    const p = VBM.q.player(params.id);
    if (!p) { c.innerHTML = '<div class="empty">球员不存在</div>'; return; }
    VBM.state.currentPlayerId = p.id;
    const attRecs = VBM.q.recsOfPlayer(p.id).slice(-8).reverse();
    const color = VBM.D.POS_COLOR[p.position];

    c.innerHTML = `
      <span class="back-link" data-back>${icon('chevron-left')} 返回球员管理</span>
      <div class="detail-hero">
        <span class="dh-back" data-back>${icon('chevron-left')}</span>
        <div class="dh-avatar">${esc(p.name[0])}</div>
        <div style="flex:1">
          <h2>${p.name} <span style="font-size:14px;font-weight:500;color:#E3CDEC">#${p.number}</span></h2>
          <div class="dh-tags"><span class="dh-tag">${p.position}</span><span class="dh-tag">${p.grade}</span><span class="dh-tag">球衣 ${p.number} 号</span></div>
        </div>
        <div style="text-align:right"><div style="font-size:30px;font-weight:800">${p.attendance_rate}%</div><div style="font-size:12px;color:#E3CDEC">本月出勤率</div></div>
      </div>

      <div class="grid g-3">
        <div class="card">
          <div class="card-title" style="margin-bottom:12px">基础信息</div>
          <div class="desc-list">
            <div class="dl-item"><dt>身高</dt><dd>${p.height} cm</dd></div>
            <div class="dl-item"><dt>体重</dt><dd>${p.weight} kg</dd></div>
            <div class="dl-item"><dt>惯用手</dt><dd>${p.hand}</dd></div>
            <div class="dl-item"><dt>场上位置</dt><dd>${p.position}</dd></div>
            <div class="dl-item"><dt>球衣号码</dt><dd>${p.number} 号</dd></div>
            <div class="dl-item"><dt>学号</dt><dd>${p.student_id}</dd></div>
          </div>
        </div>
        <div class="card g-2" style="grid-column:span 2">
          ${[
            ['训练次数', VBM.q.recsOfPlayer(p.id).length + ' 次'],
            ['出勤率', p.attendance_rate + '%'],
            ['训练完成率', p.training_completion_rate + '%'],
            ['一传到位率', p.pass_rate + '%'],
            ['扣球成功率', p.spike_success_rate + '%'],
            ['发球得分率', p.serve_score_rate + '%'],
            ['拦网成功率', p.block_success_rate + '%'],
            ['综合状态', p.attendance_rate >= 90 ? '出勤稳定' : '出勤需关注']
          ].map(x => `<div style="border:1px solid var(--line);border-radius:10px;padding:12px 14px">
            <div style="font-size:12px;color:var(--ink-3)">${x[0]}</div>
            <div style="font-size:20px;font-weight:800;margin-top:2px;color:${color}">${x[1]}</div></div>`).join('')}
        </div>
      </div>

      <div class="grid g-2 section-gap">
        <div class="card">
          <div class="card-head"><div class="card-title">最近训练表现 <span class="ct-tag">近 4 周</span></div></div>
          <div id="trend"></div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">出勤记录</div></div>
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>日期</th><th>训练内容</th><th>状态</th><th>备注</th></tr></thead>
              <tbody>${attRecs.map(a => {
                const tr = VBM.q.training(a.training_id);
                return `<tr><td style="white-space:nowrap">${tr.date}</td><td>${tr.title}</td><td>${VBM.statusTag(a.status)}</td><td style="color:var(--ink-3);font-size:12.5px">${a.remark || '—'}</td></tr>`;
              }).join('')}</tbody>
            </table>
          </div>
        </div>
      </div>`;

    c.querySelector('#trend').appendChild(VBM.charts.multiLine([
      { name: '一传到位率', data: p.weekly.pass, color: '#722F86' },
      { name: '扣球成功率', data: p.weekly.spike, color: '#D9922B' }
    ], ['周1', '周2', '周3', '周4'], { min: 30, max: 75 }));

    c.querySelectorAll('[data-back]').forEach(b => b.onclick = () => VBM.go('players'));
  };
})();
