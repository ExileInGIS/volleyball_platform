/* 比赛管理 + 比赛详情（阵容 / 数据记录 / 复盘） */
(function () {
  const VBM = window.VBM;
  const { icon } = VBM;
  VBM.pages = VBM.pages || {};

  VBM.pages.matches = function (c) {
    const D = VBM.D;
    const upcoming = D.matches.filter(m => m.status === 'upcoming');
    const history = D.matches.filter(m => m.status === 'finished');

    c.innerHTML = `
      <div class="page-head">
        <div><div class="page-title">比赛管理</div>
          <div class="page-desc">比赛流程：创建比赛 → 配置阵容 → 确认首发 → 记录数据 → 复盘 → 数据汇入球队分析</div></div>
        <div class="head-actions"><button class="btn btn-primary" id="addMatch">${icon('plus')} 新建比赛</button></div>
      </div>
      <div class="card" style="margin-bottom:18px">
        <div class="card-title" style="margin-bottom:12px">即将进行</div>
        <div style="display:flex;flex-direction:column;gap:11px">
          ${upcoming.map(m => matchCard(m)).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:12px">历史比赛 · 近一月 ${history.length} 场（${history.filter(m => m.result === 'W').length}胜${history.filter(m => m.result === 'L').length}负）</div>
        <div style="display:flex;flex-direction:column;gap:11px">
          ${history.map(m => matchCard(m)).join('')}
        </div>
      </div>`;

    c.querySelector('#addMatch').onclick = addMatchForm;
    c.querySelectorAll('[data-id]').forEach(card2 => card2.onclick = () => VBM.go('match/' + card2.getAttribute('data-id')));
    if (VBM.state.role === 'player') VBM.playerize(c);
  };

  function matchCard(m) {
    const won = m.result === 'W';
    return `<div class="match-card" data-id="${m.id}">
      <span class="tag ${m.status === 'upcoming' ? 'tag-blue' : won ? 'tag-green' : 'tag-red'}">${m.status === 'upcoming' ? '待进行' : won ? '胜' : '负'}</span>
      <div class="match-teams">
        <span class="match-team">南京大学</span>
        <span class="match-vs">VS</span>
        <span class="match-team" style="color:var(--ink-2)">${m.opponent}</span>
      </div>
      ${m.score ? `<span class="match-score">${m.score}</span>` : ''}
      <div class="match-meta">
        <span>${icon('calendar')} ${m.date}</span>
        <span>${icon('pin')} ${m.location}</span>
      </div>
    </div>`;
  }

  function addMatchForm() {
    VBM.modal({
      title: '新建比赛',
      body: `<div class="form-grid">
        <div class="form-field"><label>对手</label><input class="input" id="mm_opp" placeholder="如 东南大学"></div>
        <div class="form-field"><label>比赛日期</label><input class="input" type="date" id="mm_date"></div>
        <div class="form-field full"><label>比赛地点</label><input class="input" id="mm_loc" value="南京大学体育馆"></div>
      </div>`,
      buttons: [
        { text: '取消', onClick: ({ close }) => close() },
        { text: '创建并去配置阵容', primary: true, onClick: ({ close, body }) => {
          const opp = body.querySelector('#mm_opp').value.trim();
          if (!opp) { VBM.toast('请填写对手', 'err'); return; }
          const id = 'M' + Date.now();
          const nm = { id, opponent: opp, date: body.querySelector('#mm_date').value, location: body.querySelector('#mm_loc').value, status: 'upcoming', result: null, score: null, stats: null };
          VBM.D.matches.push(nm);
          // 初始化空白阵容
          const slots = VBM.D.slotDef.map(s => s.key);
          VBM.D.lineups[id] = {
            id: 'L' + id, match_id: id, name: '首发阵容 A', slots,
            slotPos: Object.fromEntries(VBM.D.slotDef.map(s => [s.key, s.pos])),
            map: Object.fromEntries(slots.map(k => [k, null])), bench: VBM.D.players.map(p => p.id), saved: false
          };
          close(); VBM.go('lineup?matchId=' + id);
        } }
      ]
    });
  }

  /* ---------------- 比赛详情 ---------------- */
  VBM.pages.matchDetail = function (c, params) {
    const m = VBM.q.match(params.id);
    if (!m) { c.innerHTML = '<div class="empty">比赛不存在</div>'; return; }
    const L = VBM.q.lineup(m.id);
    const finished = m.status === 'finished';
    const starting = Object.values(L.map).filter(Boolean);

    c.innerHTML = `
      <span class="back-link" data-back>${icon('chevron-left')} 返回比赛管理</span>
      <div class="detail-hero">
        <div style="flex:1">
          <div style="font-size:12px;color:#E3CDEC">${m.date} · ${m.location}</div>
          <h2 style="margin-top:3px">南京大学 vs ${m.opponent}</h2>
          <div class="dh-tags">
            <span class="dh-tag">${finished ? (m.result === 'W' ? '已获胜 ' + m.score : '已负 ' + m.score) : '待进行'}</span>
            ${finished ? '<span class="dh-tag">已复盘</span>' : '<span class="dh-tag">阵容' + (L.saved ? '已确认' : '未确认') + '</span>'}
          </div>
        </div>
        ${finished ? `<div style="text-align:center"><div style="font-size:34px;font-weight:800">${m.score}</div></div>` : ''}
      </div>

      <div class="grid g-2">
        <div class="card">
          <div class="card-head"><div class="card-title">比赛阵容</div>
            <button class="btn btn-sm btn-soft" data-go="lineup?matchId=${m.id}">${icon('grid')} 配置阵容</button></div>
          <div class="card-title" style="font-size:13px;margin-bottom:8px">首发（${starting.length}）</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px">
            ${starting.map(x => {
              const p = VBM.q.player(x.player_id);
              return `<span class="player-chip" style="cursor:default;padding:7px 11px"><span class="pc-num">${p.number}</span>
                <div class="pc-info"><strong style="font-size:12.5px">${p.name}</strong><small>${x.position}</small></div></span>`;
            }).join('') || '<span style="color:var(--ink-3);font-size:13px">尚未配置首发</span>'}
          </div>
          <div class="card-title" style="font-size:13px;margin-bottom:8px">替补（${L.bench.length}）</div>
          <div style="display:flex;flex-wrap:wrap;gap:7px">
            ${L.bench.map(id => { const p = VBM.q.player(id); return `<span class="tag tag-gray">#${p.number} ${p.name}</span>`; }).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-head"><div class="card-title">${finished ? '比赛数据' : '比赛数据记录'}</div>
            ${finished ? '' : '<button class="btn btn-sm btn-ghost" id="editStats">录入数据</button>'}</div>
          <div id="statsBody"></div>
        </div>
      </div>

      ${finished ? `<div class="card section-gap">
        <div class="card-title" style="margin-bottom:10px">${icon('refresh')} 比赛复盘（客观数据摘要）</div>
        <div id="review"></div>
      </div>` : ''}`;

    /* 数据网格 */
    const statsBody = c.querySelector('#statsBody');
    function statFields() {
      return [
        ['一传到位', 'pass_success'], ['发球得分', 'serve_score'], ['发球失误', 'serve_error'],
        ['扣球得分', 'spike_score'], ['扣球失误', 'spike_error'], ['拦网得分', 'block_score'],
        ['防守成功', 'defense_success'], ['得分', 'score'], ['失分', 'against']
      ];
    }
    function renderStats(readonly) {
      const s = m.stats || {};
      statsBody.innerHTML = `<div class="grid g-3">
        ${statFields().map(f => `<div style="border:1px solid var(--line);border-radius:10px;padding:11px 13px">
          <div style="font-size:12px;color:var(--ink-3)">${f[0]}</div>
          ${readonly ? `<div style="font-size:21px;font-weight:800;margin-top:2px">${s[f[1]] ?? '—'}</div>`
            : `<input class="input" style="margin-top:4px;padding:7px 9px" type="number" data-k="${f[1]}" value="${s[f[1]] ?? ''}">`}
        </div>`).join('')}
      </div>`;
    }
    renderStats(finished);

    if (!finished) {
      c.querySelector('#editStats').onclick = () => {
        renderStats(false);
        const btn = document.createElement('button');
        btn.className = 'btn btn-primary btn-block';
        btn.style.marginTop = '13px';
        btn.innerHTML = icon('save') + ' 保存并结束比赛';
        statsBody.appendChild(btn);
        btn.onclick = () => {
          const st = {};
          statsBody.querySelectorAll('[data-k]').forEach(i => st[i.getAttribute('data-k')] = Number(i.value) || 0);
          m.stats = st;
          // 依据得失分客观生成胜负（不做能力评价）
          m.status = 'finished';
          m.result = st.score >= st.against ? 'W' : 'L';
          m.score = '3:2';
          L.saved = true;
          VBM.toast('比赛数据已保存，已进入复盘，数据汇入球队分析', 'ok');
          VBM.go('match/' + m.id);
        };
      };
    }

    /* 复盘摘要（基于客观统计，不评价个人） */
    if (finished) {
      const s = m.stats;
      const passRate = Math.round(s.pass_success / (s.pass_success + 20) * 100);
      const spikeEff = Math.round(s.spike_score / (s.spike_score + s.spike_error) * 100);
      c.querySelector('#review').innerHTML = `<div class="grid g-4">
        ${[
          ['一传到位次数', s.pass_success], ['扣球效率', spikeEff + '%'],
          ['发球净得分', s.serve_score - s.serve_error], ['拦网得分', s.block_score],
          ['防守成功', s.defense_success], ['总得分', s.score],
          ['总失分', s.against], ['净胜分', s.score - s.against]
        ].map(x => `<div style="border:1px solid var(--line);border-radius:10px;padding:12px 14px">
          <div style="font-size:12px;color:var(--ink-3)">${x[0]}</div>
          <div style="font-size:20px;font-weight:800;margin-top:2px">${x[1]}</div></div>`).join('')}
      </div>
      <div class="info-tip" style="margin-top:14px">${icon('info')} 复盘仅汇总客观技术统计与得失分，供教练/队长参考后续训练安排，系统不对球员个人能力做自动评价。</div>`;
    }

    c.querySelector('[data-back]').onclick = () => VBM.go('matches');
    const go = c.querySelector('[data-go]');
    if (go) go.onclick = () => VBM.go(go.getAttribute('data-go'));
  };
})();
