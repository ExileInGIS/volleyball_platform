/* 球队数据分析 Dashboard */
(function () {
  const VBM = window.VBM;
  const { icon } = VBM;
  VBM.pages = VBM.pages || {};

  VBM.pages.analytics = function (c) {
    const D = VBM.D, S = VBM.q.teamSummary();
    let timeRange = 'month'; // week/month/term
    let posFilter = '全部';
    let metric = 'attendance';

    c.innerHTML = `
      <div class="page-head">
        <div><div class="page-title">球队数据分析</div>
          <div class="page-desc">记录 → 统计 → 趋势 → 异常提醒 → 信息辅助；系统不做“AI 自动评价球员”</div></div>
      </div>

      <!-- 筛选 -->
      <div class="card" style="margin-bottom:16px">
        <div class="toolbar" style="margin-bottom:0">
          <span style="font-size:13px;color:var(--ink-3)">时间范围</span>
          <div class="seg" id="timeSeg">
            <button data-v="week">本周</button><button data-v="month" class="active">本月</button><button data-v="term">本学期</button>
          </div>
          <span style="font-size:13px;color:var(--ink-3);margin-left:8px">位置</span>
          <select class="select" id="posSel">
            <option>全部</option>${D.POSITIONS.map(p => `<option>${p}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- 训练数据卡片 -->
      <div class="grid g-5" style="margin-bottom:18px">
        ${[
          ['本月出勤率', S.attendance, 'trend', '#722F86'],
          ['训练完成率', S.completion, 'target', '#3E79C9'],
          ['一传到位率', S.pass, 'volleyball', '#2E9E6B'],
          ['扣球成功率', S.spike, 'trend', '#D9922B'],
          ['发球得分率', S.serve, 'target', '#B05A9E']
        ].map(x => `<div class="stat-card"><div class="sc-top"><span class="sc-label">${x[0]}</span>
          <span class="sc-ico" style="background:var(--purple-soft);color:${x[3]}">${icon(x[2])}</span></div>
          <div class="sc-value">${x[1]}<small>%</small></div></div>`).join('')}
      </div>

      <div class="grid g-2">
        <div class="card">
          <div class="card-head"><div class="card-title">出勤率趋势</div></div>
          <div id="attChart"></div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">技术数据趋势</div></div>
          <div id="techChart"></div>
        </div>
      </div>

      <div class="card section-gap">
        <div class="card-head">
          <div class="card-title">球员数据对比</div>
          <div class="seg" id="metricSeg">
            ${[
              ['attendance', '出勤率'], ['pass', '一传到位率'], ['spike', '扣球成功率'], ['serve', '发球得分率']
            ].map((m, i) => `<button data-v="${m[0]}" class="${i === 0 ? 'active' : ''}">${m[1]}</button>`).join('')}
          </div>
        </div>
        <div id="compareChart"></div>
      </div>

      <div class="card section-gap">
        <div class="card-title" style="margin-bottom:10px">${icon('alert')} 异常提醒（仅客观数据）</div>
        <div id="anomList"></div>
      </div>`;

    /* 出勤率折线（时间范围影响） */
    const labels = timeRange === 'week' ? ['周一', '周二', '周三', '周五'] : ['周1', '周2', '周3', '周4'];
    function attData() {
      if (timeRange === 'term') return [90, 89, 92, 91];
      return D.teamTrend.attendance;
    }
    c.querySelector('#attChart').appendChild(
      VBM.charts.lineChart(attData(), labels, { color: '#722F86', unit: '%', min: 80, max: 100 })
    );

    c.querySelector('#techChart').appendChild(VBM.charts.multiLine([
      { name: '一传到位率', data: D.teamTrend.pass, color: '#722F86' },
      { name: '扣球成功率', data: D.teamTrend.spike, color: '#D9922B' },
      { name: '发球得分率', data: D.teamTrend.serve, color: '#3E79C9' },
      { name: '拦网成功率', data: D.teamTrend.block, color: '#2E9E6B' }
    ], ['周1', '周2', '周3', '周4'], { min: 10, max: 70 }));

    /* 球员对比柱状图 */
    const metricMap = {
      attendance: p => p.attendance_rate,
      pass: p => p.pass_rate,
      spike: p => p.spike_success_rate,
      serve: p => p.serve_score_rate
    };
    const compareBox = c.querySelector('#compareChart');
    function renderCompare() {
      let list = D.players;
      if (posFilter !== '全部') list = list.filter(p => p.position === posFilter);
      list = [...list].sort((a, b) => metricMap[metric](b) - metricMap[metric](a));
      compareBox.innerHTML = '';
      compareBox.appendChild(VBM.charts.barChart(
        list.map(metricMap[metric]), list.map(p => p.name),
        { color: VBM.charts.PAL[0], max: 100 }
      ));
    }
    renderCompare();

    /* 异常 */
    const anomalies = VBM.q.attendanceAnomalies();
    c.querySelector('#anomList').innerHTML = anomalies.length ? anomalies.map(a =>
      `<div class="lineup-alert la-info" style="margin-bottom:8px">${icon('info')}<div><strong>${a.player.name}</strong>（${a.player.position}）近 ${a.total} 次训练 ${a.bad} 次非出勤。系统仅提示客观出勤，不做能力/健康判断。</div></div>`
    ).join('') : '<div class="lineup-alert la-ok">' + icon('check') + '暂无出勤异常。</div>';
    // 数据波动提醒
    c.querySelector('#anomList').insertAdjacentHTML('beforeend',
      `<div class="lineup-alert la-info">${icon('trend')}<div>本周一传到位率较上周下降 5%（63%→58%），建议增加接发球训练（建议项，最终由教练/队长决定）。</div></div>`);

    /* 交互 */
    c.querySelector('#timeSeg').querySelectorAll('button').forEach(b => b.onclick = () => {
      timeRange = b.getAttribute('data-v');
      c.querySelector('#timeSeg').querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
      const att = c.querySelector('#attChart'); att.innerHTML = '';
      att.appendChild(VBM.charts.lineChart(attData(), labels, { color: '#722F86', unit: '%', min: 80, max: 100 }));
    });
    c.querySelector('#posSel').onchange = e => { posFilter = e.target.value; renderCompare(); };
    c.querySelector('#metricSeg').querySelectorAll('button').forEach(b => b.onclick = () => {
      metric = b.getAttribute('data-v');
      c.querySelector('#metricSeg').querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
      renderCompare();
    });
    if (VBM.state.role === 'player') VBM.playerize(c);
  };
})();
