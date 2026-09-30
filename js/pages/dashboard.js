/* 首页 Dashboard */
(function () {
  const VBM = window.VBM;
  const { icon, hydrate } = VBM;

  function statCard(o) {
    return `<div class="stat-card ${o.accent ? 'accent-purple' : ''}" ${o.go ? `data-go="${o.go}"` : ''}>
      <div class="sc-top"><span class="sc-label">${o.label}</span>
        <span class="sc-ico" style="background:${o.bg};color:${o.fg}">${icon(o.ico)}</span></div>
      <div class="sc-value">${o.value}</div>
      ${o.foot ? `<div class="sc-foot">${o.foot}</div>` : ''}
      ${o.spark ? `<span class="sc-spark"></span>` : ''}
    </div>`;
  }

  VBM.pages = VBM.pages || {};
  VBM.pages.home = function (c) {
    const D = VBM.D, t = D.trainings.find(x => x.date === D.today);
    const S = VBM.q.teamSummary();
    const isPlayer = VBM.state.role === 'player';

    const reminders = [
      { ico: 'users', c: 'var(--amber-bg)', f: 'var(--amber)', p: '3 名球员尚未确认今日训练（陈雨桐、褚一凡缺勤，蒋若溪请假）', tm: '今天' },
      { ico: 'trophy', c: 'var(--purple-soft)', f: 'var(--purple)', p: '10 月 18 日有一场校际比赛：vs 东南大学（主场）', tm: '19 天后' },
      { ico: 'clipboard', c: 'var(--blue-bg)', f: 'var(--blue)', p: '本周训练计划尚有 1 项内容未标记完成', tm: '本周' },
      { ico: 'alert', c: 'var(--red-bg)', f: 'var(--red)', p: '球员褚一凡连续 2 次训练缺勤（仅客观出勤提示，不做能力/健康判断）', tm: '客观数据' }
    ];

    c.innerHTML = `
      <div class="page-head">
        <div>
          <div class="page-title">今日概览 <span class="pt-sub">${t.weekday} · ${D.today}</span></div>
          <div class="page-desc">10 秒掌握三件事：今天来了多少人 · 今天练什么 · 球队近期状态</div>
        </div>
        <div class="head-actions">
          <button class="btn btn-ghost" data-go="attendance">${icon('clipboard')} 去签到</button>
          <button class="btn btn-primary" data-go="training/new">${icon('plus')} 新建训练</button>
        </div>
      </div>

      <!-- 今日训练 -->
      <div class="card" style="margin-bottom:16px;background:linear-gradient(110deg,#5C2470,#722F86);color:#fff;border:none;padding:20px 22px">
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:14px;align-items:center">
          <div>
            <div style="font-size:12px;color:#D9BCE8;letter-spacing:1px">今日训练 · TODAY</div>
            <div style="font-size:21px;font-weight:800;margin-top:3px">${t.title}</div>
          </div>
          <div style="display:flex;gap:26px;flex-wrap:wrap">
            <div><div style="font-size:11.5px;color:#D9BCE8">${icon('clock')} 训练时间</div><div style="font-weight:700;margin-top:2px">${t.start_time}—${t.end_time}</div></div>
            <div><div style="font-size:11.5px;color:#D9BCE8">${icon('pin')} 训练地点</div><div style="font-weight:700;margin-top:2px">${t.location}</div></div>
          </div>
        </div>
      </div>

      <div class="grid g-4" style="margin-bottom:18px">
        ${statCard({ label: '应到人数', value: `${t.expected_count}<small> 人</small>`, ico: 'users', bg: 'var(--purple-soft)', fg: 'var(--purple)', foot: '球队在册球员', go: 'players' })}
        ${statCard({ label: '实到人数', value: `${t.actual_count}<small> 人</small>`, ico: 'check', bg: 'var(--green-bg)', fg: 'var(--green)', foot: '含迟到签到', go: `attendance/checkin?id=${t.id}` })}
        ${statCard({ label: '缺勤人数', value: `${t.absent_count}<small> 人</small>`, ico: 'alert', bg: 'var(--red-bg)', fg: 'var(--red)', foot: `另有请假 ${t.leave_count} 人`, go: `attendance/checkin?id=${t.id}` })}
        ${statCard({ label: '今日出勤率', value: Math.round(t.actual_count / t.expected_count * 100) + '%', ico: 'trend', bg: 'var(--amber-bg)', fg: 'var(--amber)', foot: '低于本月均值', go: 'attendance', spark: true })}
      </div>

      <!-- 今日训练内容 -->
      <div class="card section-gap" style="margin-top:18px">
        <div class="card-head"><div class="card-title">今日训练内容 <span class="ct-tag">${t.content}</span></div>
          <span class="card-link" data-go="training">查看本周计划</span></div>
        <div class="grid g-4">
          ${[
            ['接发球', 25, 90], ['防守', 25, 85], ['扣球', 30, 80], ['六人配合', 30, 75]
          ].map(d => `<div class="drill-card">
            <div class="drill-top"><span class="drill-name">${d[0]}</span><span class="drill-time">${d[1]} min</span></div>
            <div class="progress"><span style="width:${d[2]}%"></span></div>
            <div class="drill-foot"><span>完成度</span><strong>${d[2]}%</strong></div>
          </div>`).join('')}
        </div>
      </div>

      <!-- 球队状态 -->
      <div class="card section-gap">
        <div class="card-head"><div class="card-title">球队状态 <span class="ct-tag">近 4 周</span></div>
          <span class="card-link" data-go="analytics">进入数据分析</span></div>
        <div class="grid g-5">
          ${[
            ['本月出勤率', S.attendance, 'trend', D.teamTrend.attendance, '%', '#722F86'],
            ['训练完成率', S.completion, 'target', D.teamTrend.spike, '%', '#3E79C9'],
            ['一传到位率', S.pass, 'volleyball', D.teamTrend.pass, '%', '#2E9E6B'],
            ['扣球成功率', S.spike, 'trend', D.teamTrend.spike, '%', '#D9922B'],
            ['发球得分率', S.serve, 'target', D.teamTrend.serve, '%', '#B05A9E']
          ].map((m, i) => `<div class="stat-card" data-go="analytics">
            <div class="sc-top"><span class="sc-label">${m[0]}</span>
              <span class="sc-ico" style="background:var(--purple-soft);color:${m[5]}">${icon(m[2])}</span></div>
            <div class="sc-value">${m[1]}<small>${m[4]}</small></div>
            <div class="sc-foot">${i === 2 ? '<span class="trend-down">较上周 -5%</span>' : '<span class="trend-up">保持稳定</span>'}</div>
            <span class="sc-spark" data-spark="${m[3].join(',')}" style="--c:${m[5]}"></span>
          </div>`).join('')}
        </div>
      </div>

      <!-- 今日提醒 + 快捷入口 -->
      <div class="grid g-2 section-gap">
        <div class="card">
          <div class="card-head"><div class="card-title">${icon('bell')} 今日提醒</div></div>
          <div class="remind-list">
            ${reminders.map(r => `<div class="remind-item">
              <span class="remind-ico" style="background:${r.c};color:${r.f}">${icon(r.ico)}</span>
              <div><p>${r.p}</p><time>${r.tm}</time></div>
            </div>`).join('')}
          </div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">${icon('grid')} 快捷操作</div></div>
          <div class="grid g-2">
            ${[
              ['players', '球员管理', '查看 18 名球员档案', 'users'],
              ['lineup?matchId=M6', '阵容配置', '配置下场比赛首发', 'grid'],
              ['matches', '比赛管理', '赛程与比赛复盘', 'trophy'],
              ['analytics', '数据分析', '趋势与球员对比', 'chart']
            ].map(q => `<div class="stat-card" data-go="${q[0]}">
              <span class="sc-ico" style="background:var(--purple-soft);color:var(--purple)">${icon(q[3])}</span>
              <div style="font-weight:700;font-size:14px">${q[1]}</div>
              <div class="sc-foot">${q[2]}</div>
            </div>`).join('')}
          </div>
        </div>
      </div>
    `;

    // sparkline 注入
    c.querySelectorAll('[data-spark]').forEach(n => {
      const arr = n.getAttribute('data-spark').split(',').map(Number);
      const col = getComputedStyle(n).getPropertyValue('--c') || '#722F86';
      n.appendChild(VBM.charts.sparkline(arr, { w: 90, h: 30, color: col }));
    });

    c.querySelectorAll('[data-go]').forEach(n => n.addEventListener('click', () => VBM.go(n.getAttribute('data-go'))));
    hydrate(c);
    if (isPlayer) VBM.playerize(c);
  };
})();
