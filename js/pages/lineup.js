/* 阵容配置 —— 排球场示意 + 点击替换 + 拖拽 + 校验 + 信息辅助 */
(function () {
  const VBM = window.VBM;
  const { icon, esc } = VBM;
  VBM.pages = VBM.pages || {};
  const NS = 'http://www.w3.org/2000/svg';

  VBM.pages.lineup = function (c, params) {
    const matchId = params.matchId || 'M6';
    const match = VBM.q.match(matchId);
    const D = VBM.D;
    let L = D.lineups[matchId];
    let variants = [{ name: L.name, data: clone(L.map), saved: L.saved }];
    let vi = 0;
    let selectedSlot = null;

    function clone(o) { return JSON.parse(JSON.stringify(o)); }

    c.innerHTML = `
      <span class="back-link" data-back>${icon('chevron-left')} 返回比赛管理</span>
      <div class="page-head">
        <div><div class="page-title">比赛阵容</div>
          <div class="page-desc">比赛名称：2026 高校排球比赛 · 南京大学 vs ${match.opponent} · ${match.date}</div></div>
        <div class="head-actions">
          <button class="btn btn-ghost" id="altLineup">${icon('plus')} 创建备用阵容</button>
          <button class="btn btn-primary" id="saveLineup">${icon('save')} 保存阵容</button>
        </div>
      </div>
      <div class="seg" id="varSeg" style="margin-bottom:16px"></div>
      <div id="alertBox" style="margin-bottom:14px"></div>
      <div class="lineup-wrap">
        <div class="court-box" id="courtBox"></div>
        <div class="bench-card card" id="benchCard">
          <div class="card-title">替补 / 可用球员</div>
          <div class="info-tip">${icon('info')} 拖拽球员到场上位置，或点击场上圆圈换人。系统仅提供客观出勤/技术数据，<strong>不自动判定首发</strong>，最终阵容由教练/队长决定。</div>
          <div id="benchList"></div>
        </div>
      </div>`;

    /* ---------- 球场 SVG ---------- */
    const courtBox = c.querySelector('#courtBox');
    function buildCourt() {
      const W = 480, H = 520;
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.classList.add('court');
      // 场地
      svg.appendChild(rect(24, 24, W - 48, H - 48, 24, '#FFF', '#B98FCB', 2.5));
      // 中线
      svg.appendChild(line(W / 2, 24, W / 2, H - 24, '#B98FCB', 2));
      // 网（中线加粗虚线带）
      svg.appendChild(line(24, H / 2, W - 24, H / 2, '#722F86', 3.5, '7 5'));
      svg.appendChild(text('三米线', 40, 152, 10, '#B596C7'));
      svg.appendChild(line(24, 142, W - 24, 142, '#D6B9E6', 1.5));
      svg.appendChild(line(24, H - 142, W - 24, H - 142, '#D6B9E6', 1.5));
      svg.appendChild(text('球网', W - 48, H / 2 - 8, 11, '#722F86', 'end'));

      // 位置槽
      D.slotDef.forEach(s => {
        const cur = variants[vi].data[s.key];
        const p = cur ? VBM.q.player(cur.player_id) : null;
        const g = document.createElementNS(NS, 'g');
        g.setAttribute('class', 'slot-node' + (p ? '' : 'empty'));
        g.setAttribute('data-slot', s.key);
        g.setAttribute('transform', `translate(${s.x},${s.y})`);
        g.appendChild(circle(0, 0, 33, '', 'slot-circle'));
        const pt = document.createElementNS(NS, 'text');
        pt.setAttribute('y', -40); pt.setAttribute('text-anchor', 'middle');
        pt.setAttribute('class', 'slot-pos'); pt.textContent = s.pos;
        g.appendChild(pt);
        if (p) {
          const nt = document.createElementNS(NS, 'text');
          nt.setAttribute('y', 4); nt.setAttribute('text-anchor', 'middle');
          nt.setAttribute('class', 'slot-name'); nt.textContent = p.name.length > 3 ? p.name.slice(0, 3) : p.name;
          g.appendChild(nt);
          // 号码小徽
          g.appendChild(circle(24, -24, 10, VBM.D.POS_COLOR[p.position], ''));
          const ntt = document.createElementNS(NS, 'text');
          ntt.setAttribute('x', 24); ntt.setAttribute('y', -20); ntt.setAttribute('text-anchor', 'middle');
          ntt.setAttribute('class', 'slot-num'); ntt.textContent = p.number;
          g.appendChild(ntt);
        } else {
          const et = document.createElementNS(NS, 'text');
          et.setAttribute('y', 4); et.setAttribute('text-anchor', 'middle');
          et.setAttribute('class', 'slot-pos'); et.textContent = '待配置';
          g.appendChild(et);
        }
        g.addEventListener('click', () => openPicker(s.key));
        // 拖拽接收
        g.addEventListener('dragover', e => { e.preventDefault(); g.classList.add('drag-over'); });
        g.addEventListener('dragleave', () => g.classList.remove('drag-over'));
        g.addEventListener('drop', e => {
          e.preventDefault(); g.classList.remove('drag-over');
          assignPlayer(s.key, Number(e.dataTransfer.getData('pid')));
        });
        svg.appendChild(g);
      });
      courtBox.innerHTML = '';
      courtBox.appendChild(svg);
    }

    /* ---------- 替补列表 ---------- */
    function buildBench() {
      const onCourt = Object.values(variants[vi].data).filter(Boolean).map(x => x.player_id);
      const listBox = c.querySelector('#benchList');
      listBox.innerHTML = VBM.D.players.map(p => {
        const active = onCourt.includes(p.id);
        return `<div class="player-chip ${active ? '' : ''}" draggable="${active ? 'false' : 'true'}" data-pid="${p.id}" style="${active ? 'opacity:.4;cursor:not-allowed' : ''}">
          <span class="pc-num">${p.number}</span>
          <div class="pc-info"><strong>${p.name}</strong><small>${p.position} · 出勤${p.attendance_rate}% · 扣球${p.spike_success_rate}%</small></div>
        </div>`;
      }).join('');
      listBox.querySelectorAll('[data-pid]').forEach(chip => {
        chip.addEventListener('dragstart', e => {
          chip.classList.add('dragging');
          e.dataTransfer.setData('pid', chip.getAttribute('data-pid'));
        });
        chip.addEventListener('dragend', () => chip.classList.remove('dragging'));
      });
    }

    /* ---------- 点击换人弹层（含客观信息辅助） ---------- */
    function openPicker(slotKey) {
      const needPos = L.slotPos[slotKey];
      const onCourt = Object.values(variants[vi].data).filter(Boolean).map(x => x.player_id);
      const candidates = VBM.D.players.filter(p => !onCourt.includes(p.id));
      VBM.modal({
        title: `替换 · ${needPos}（${slotLabel(slotKey)}）`, size: 'lg',
        body: `<div class="info-tip" style="margin-bottom:12px">${icon('target')} 建议从 <strong>${needPos}</strong> 中选择；下方按位置分组，仅展示客观数据供参考。</div>
          <div class="table-wrap"><table class="data-table">
            <thead><tr><th>球员</th><th>位置</th><th class="num">近4周出勤率</th><th class="num">扣球成功率</th><th class="num">一传到位率</th><th></th></tr></thead>
            <tbody>${candidates.map(p => `<tr>
              <td><div class="cell-player">${VBM.avatar(p)}<strong>${p.name}</strong></div></td>
              <td><span class="tag tag-purple">${p.position}</span></td>
              <td class="num">${p.attendance_rate}%</td>
              <td class="num">${p.spike_success_rate}%</td>
              <td class="num">${p.pass_rate}%</td>
              <td><button class="btn btn-sm btn-primary" data-pick="${p.id}">选用</button></td>
            </tr>`).join('')}</tbody></table></div>`,
        onMount: body => body.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => {
          assignPlayer(slotKey, Number(b.getAttribute('data-pick')));
          document.querySelector('.modal-mask')?.remove();
        })
      });
    }
    function slotLabel(k) { return { oh1: '主攻一', oh2: '主攻二', mb1: '副攻一', mb2: '副攻二', set: '二传', opp: '接应', lib: '自由人' }[k]; }

    function assignPlayer(slotKey, pid) {
      // 若该球员已在其他槽位，先交换/清空
      for (const k in variants[vi].data) {
        const cell = variants[vi].data[k];
        if (cell && cell.player_id === pid && k !== slotKey) variants[vi].data[k] = variants[vi].data[slotKey] || null;
      }
      variants[vi].data[slotKey] = { player_id: pid, position: L.slotPos[slotKey], starting: 1 };
      variants[vi].saved = false;
      refresh();
      VBM.toast('已调整位置，记得保存阵容');
    }

    /* ---------- 校验 ---------- */
    function validate() {
      const data = variants[vi].data;
      const errs = [], infos = [];
      const placed = Object.values(data).filter(Boolean).map(x => x.player_id);
      // 空槽
      L.slots.forEach(k => { if (!data[k]) errs.push(`位置「${L.slotPos[k]} · ${slotLabel(k)}」尚未配置球员。`); });
      // 重复
      const dup = placed.filter((id, i) => placed.indexOf(id) !== i);
      if (dup.length) errs.push('同一球员不能同时出现在多个位置。');
      // 位置覆盖
      const covered = {};
      Object.entries(data).forEach(([k, v]) => { if (v) covered[VBM.q.player(v.player_id).position] = true; });
      ['主攻', '副攻', '二传', '接应', '自由人'].forEach(pos => {
        if (!covered[pos]) errs.push(`当前阵容缺少${pos}，请补充后再保存。`);
      });
      return { errs, infos };
    }
    function renderAlert(showAll) {
      const { errs } = validate();
      const box = c.querySelector('#alertBox');
      if (!errs.length) {
        box.innerHTML = `<div class="lineup-alert la-ok">${icon('check')} 阵容结构完整（主攻/副攻/二传/接应/自由人齐备，无重复），可保存。最终是否首发仍由教练/队长确认。</div>`;
      } else if (showAll) {
        box.innerHTML = errs.map(e => `<div class="lineup-alert la-error">${icon('alert')}<div>${e}</div></div>`).join('');
      } else {
        box.innerHTML = `<div class="lineup-alert la-info">${icon('info')}<div>阵容配置中，保存时将自动校验结构（共 ${errs.length} 项待处理）。</div></div>`;
      }
    }

    /* ---------- 变体（备用阵容） ---------- */
    function buildVarSeg() {
      const seg = c.querySelector('#varSeg');
      seg.innerHTML = variants.map((v, i) => `<button data-i="${i}" class="${i === vi ? 'active' : ''}">${v.name}${v.saved ? '' : ' ●'}</button>`).join('');
      seg.querySelectorAll('button').forEach(b => b.onclick = () => { vi = Number(b.getAttribute('data-i')); refresh(); });
    }
    c.querySelector('#altLineup').onclick = () => {
      const data = {};
      L.slots.forEach(k => data[k] = null);
      variants.push({ name: '备用阵容 ' + String.fromCharCode(66 + variants.length - 1), data, saved: false });
      vi = variants.length - 1;
      refresh();
      VBM.toast('已创建空白备用阵容');
    };

    c.querySelector('#saveLineup').onclick = () => {
      const { errs } = validate();
      renderAlert(true);
      if (errs.length) { VBM.toast('阵容存在错误，无法保存', 'err'); return; }
      // 写回数据层
      L.map = clone(variants[vi].data);
      const onCourt = Object.values(L.map).map(x => x.player_id);
      L.bench = VBM.D.players.filter(p => !onCourt.includes(p.id)).map(p => p.id);
      L.saved = true; L.name = variants[vi].name;
      variants[vi].saved = true;
      VBM.toast('阵容已保存并关联本场比赛', 'ok');
      refresh();
    };

    function refresh() { buildVarSeg(); buildCourt(); buildBench(); renderAlert(false); }
    refresh();
    c.querySelector('[data-back]').onclick = () => VBM.go('matches');
    if (VBM.state.role === 'player') VBM.playerize(c);
  };

  /* SVG 小工具 */
  function rect(x, y, w, h, r, fill, stroke, sw) {
    const e = document.createElementNS(NS, 'rect');
    Object.entries({ x, y, width: w, height: h, rx: r, fill, stroke, 'stroke-width': sw }).forEach(([k, v]) => e.setAttribute(k, v));
    return e;
  }
  function line(x1, y1, x2, y2, stroke, sw, dash) {
    const e = document.createElementNS(NS, 'line');
    Object.entries({ x1, y1, x2, y2, stroke, 'stroke-width': sw }).forEach(([k, v]) => e.setAttribute(k, v));
    if (dash) e.setAttribute('stroke-dasharray', dash);
    return e;
  }
  function circle(cx, cy, r, fill, cls) {
    const e = document.createElementNS(NS, 'circle');
    e.setAttribute('cx', cx); e.setAttribute('cy', cy); e.setAttribute('r', r);
    if (fill) e.setAttribute('fill', fill);
    if (cls) e.setAttribute('class', cls);
    return e;
  }
  function text(t, x, y, size, fill, anchor) {
    const e = document.createElementNS(NS, 'text');
    e.setAttribute('x', x); e.setAttribute('y', y); e.setAttribute('font-size', size);
    e.setAttribute('fill', fill); if (anchor) e.setAttribute('text-anchor', anchor);
    e.textContent = t; return e;
  }
})();
