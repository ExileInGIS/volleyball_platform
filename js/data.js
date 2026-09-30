/* =========================================================
 * data.js — 模拟数据层（南京大学女子排球队）
 * 所有出勤类指标均由出勤记录动态计算，保证内部一致性。
 * ========================================================= */
(function () {
  const VBM = (window.VBM = window.VBM || {});
  VBM.D = {};
  VBM.state = { role: 'coach', currentPlayerId: 1 };

  /* ---------- 工具 ---------- */
  const pad = n => String(n).padStart(2, '0');
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  function addDays(base, n) { const d = new Date(base); d.setDate(d.getDate() + n); return d; }
  // 确定性伪随机
  function hash() {
    let h = 2166136261;
    for (const s of arguments) {
      const str = String(s);
      for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    }
    return ((h >>> 0) % 10000) / 10000;
  }

  VBM.util = { pad, fmt, WEEK, addDays, hash };

  const today = new Date();
  const TODAY_STR = fmt(today);
  VBM.D.today = TODAY_STR;

  const POSITIONS = ['主攻', '副攻', '二传', '接应', '自由人'];
  const POS_COLOR = { '主攻': '#722F86', '副攻': '#3E79C9', '二传': '#D9922B', '接应': '#B05A9E', '自由人': '#2E9E6B' };

  /* ---------- 球员基础信息（18 人） ---------- */
  const rawPlayers = [
    ['沈若瑶', 20232101, '主攻', '2023级', 184, 72, '右手', 97],
    ['顾明曦', 20232102, '主攻', '2023级', 181, 70, '右手', 95],
    ['陈雨桐', 20252103, '主攻', '2025级', 186, 74, '右手', 85],
    ['宋清然', 20242104, '主攻', '2024级', 182, 69, '左手', 93],
    ['韩书宁', 20252105, '主攻', '2025级', 180, 68, '右手', 90],
    ['苏亦晴', 20232201, '副攻', '2023级', 187, 73, '右手', 94],
    ['周予安', 20242202, '副攻', '2024级', 185, 71, '右手', 91],
    ['吴清扬', 20242203, '副攻', '2024级', 183, 70, '右手', 89],
    ['褚一凡', 20252204, '副攻', '2025级', 184, 70, '右手', 84],
    ['林知夏', 20232301, '二传', '2023级', 176, 64, '右手', 98],
    ['钟灵韵', 20242302, '二传', '2024级', 174, 62, '右手', 92],
    ['白露白', 20252303, '二传', '2025级', 175, 63, '右手', 87],
    ['叶予笙', 20232401, '接应', '2023级', 180, 68, '右手', 93],
    ['高语墨', 20242402, '接应', '2024级', 179, 67, '左手', 90],
    ['蒋若溪', 20252403, '接应', '2025级', 178, 66, '右手', 86],
    ['秦晚棠', 20232501, '自由人', '2023级', 170, 60, '右手', 97],
    ['冯小夏', 20242502, '自由人', '2024级', 169, 59, '右手', 88],
    ['许念安', 20252503, '自由人', '2025级', 171, 61, '右手', 92]
  ];

  /* ---------- 训练课（最近约 4 周，固定周一/三/五/日，含今日） ---------- */
  const themeByDay = {
    1: ['基础技术', ['垫球', '传球', '步法移动'], '巩固垫传基础与场上移动步法'],
    3: ['接发球专项', ['接发球', '防守', '发球'], '提升一传稳定性与发球质量'],
    5: ['六人配合', ['扣球', '拦网', '六人配合'], '强化攻防转换与整体配合'],
    0: ['模拟比赛', ['模拟对抗', '战术配合'], '以赛代练，检验训练成果']
  };
  const trainings = [];
  for (let off = -27; off <= 0; off++) {
    const d = addDays(today, off);
    const wd = d.getDay();
    if (off !== 0 && ![0, 1, 3, 5].includes(wd)) continue;
    let theme, drills, goal;
    if (off === 0) {
      theme = '接发球与团队配合';
      drills = ['接发球', '防守', '扣球', '六人配合'];
      goal = '强化接发球到位率，演练六人攻防轮转配合';
    } else {
      [theme, drills, goal] = themeByDay[wd];
    }
    trainings.push({
      id: 'T' + (1000 + trainings.length + 1),
      date: fmt(d),
      weekday: WEEK[wd],
      start_time: wd === 0 ? '15:00' : '19:00',
      end_time: wd === 0 ? '17:00' : '21:00',
      location: '南京大学体育馆',
      title: theme,
      goal,
      content: drills.join('、'),
      drills: drills,
      expected_count: 18,
      actual_count: null,
      completion_rate: off === 0 ? 80 : Math.round(78 + hash('comp', off) * 16),
      remark: '',
      isNew: false
    });
  }
  trainings.sort((a, b) => a.date.localeCompare(b.date));
  const todayTr = trainings.find(t => t.date === TODAY_STR);

  /* ---------- 出勤记录（Attendance） ---------- */
  const attendance = [];
  const N = trainings.length;
  const ti = id => trainings.findIndex(t => t.id === id);
  // 球员目标出勤率（来自 raw 末位）
  const targetRate = {};
  rawPlayers.forEach((r, i) => targetRate[i + 1] = r[7]);

  // 每名球员的状态矩阵（先全部 present）
  const matrix = rawPlayers.map(() => trainings.map(() => 'present'));
  // 固定覆盖今日：陈雨桐缺勤、褚一凡连续两次缺勤、蒋若溪请假
  matrix[2][N - 1] = 'absent';
  matrix[8][N - 1] = 'absent'; matrix[8][N - 2] = 'absent';
  matrix[14][N - 1] = 'leave';

  // 每名球员期望的非出勤场次（依据其目标出勤率）
  const want = rawPlayers.map((r, idx) => {
    const fixed = matrix[idx].filter(s => s !== 'present').length;
    return Math.max(fixed, Math.round(N * (1 - r[7] / 100)));
  });
  // 全局非出勤名额：使球队整体出勤率精确等于 91%
  const totalSlots = rawPlayers.length * N;
  const globalNon = totalSlots - Math.round(0.91 * totalSlots);
  // 微调个人期望，使总数等于全局名额
  while (want.reduce((a, b) => a + b, 0) < globalNon) {
    // 优先加到当前出勤率最高（非出勤占比最低）的球员，保持个体数据合理
    let pick = 0, lowest = 1;
    want.forEach((w, i) => { const nonRate = w / N; if (nonRate < lowest && w < N - 1) { lowest = nonRate; pick = i; } });
    want[pick]++;
  }
  while (want.reduce((a, b) => a + b, 0) > globalNon) {
    let pick = 0, worst = 2;
    want.forEach((w, i) => { const rate = 1 - w / N; const fixed = matrix[i].filter(s => s !== 'present').length;
      if (rate < worst && w > fixed) { worst = rate; pick = i; } });
    want[pick]--;
  }
  // 确定性地把非出勤状态安排到具体场次（今日固定值除外）
  matrix.forEach((row, idx) => {
    const fixed = row.filter(s => s === 'absent' || s === 'leave').length;
    let need = want[idx] - fixed;
    const reserved = idx === 8 ? [N - 1, N - 2] : [N - 1];
    const order = trainings.map((t, i) => i)
      .filter(i => !reserved.includes(i) && row[i] === 'present')
      .sort((a, b) => hash('att', idx + 1, a) - hash('att', idx + 1, b));
    let k = 0;
    while (need > 0 && k < order.length) {
      const i = order[k++];
      row[i] = hash('kind', idx + 1, i) < 0.72 ? 'absent' : 'leave'; // 仅缺勤/请假计入非出勤
      need--;
    }
  });
  // 迟到单独安排（计入出勤，但单独展示），不影响 91% 口径
  matrix.forEach((row, idx) => {
    const reserved = idx === 8 ? [N - 1, N - 2] : [N - 1];
    const lateWant = Math.round(hash('lateW', idx + 1) * 1.1);
    const cand = trainings.map((t, i) => i).filter(i => !reserved.includes(i) && row[i] === 'present')
      .sort((a, b) => hash('lateO', idx + 1, a) - hash('lateO', idx + 1, b));
    for (let k = 0; k < lateWant && k < cand.length; k++) row[cand[k]] = 'late';
  });

  // 生成出勤记录与备注
  matrix.forEach((row, idx) => {
    const pid = idx + 1;
    row.forEach((st, i) => {
      let remark = '';
      if (st === 'leave') remark = ['课程冲突', '身体不适请假', '家中有事', '考试复习'][Math.floor(hash('rm', pid, i) * 4)];
      if (st === 'absent') remark = hash('ab', pid, i) < 0.5 ? '未说明原因' : '无故缺勤';
      if (st === 'late') remark = '迟到约 ' + (10 + Math.floor(hash('lt', pid, i) * 21)) + ' 分钟';
      attendance.push({ id: 'A' + attendance.length, training_id: trainings[i].id, player_id: pid, status: st, remark });
    });
  });

  /* ---------- 技术统计（按位置校准 + 缩放对齐球队目标值） ---------- */
  // 基础区间：[pass, spike, serve, block]
  const baseRange = {
    '主攻': [58, 50, 17, 18],
    '副攻': [55, 52, 15, 30],
    '二传': [66, 35, 20, 12],
    '接应': [60, 55, 22, 20],
    '自由人': [74, 20, 14, 8]
  };
  const teamTarget = { pass: 62, spike: 48, serve: 18, block: 24 };
  const techBase = rawPlayers.map((r, i) => {
    const [b] = [baseRange[r[2]]];
    const j = () => (hash('tech', i + 1, r[2]) - 0.5) * 8;
    return {
      pass: Math.max(10, Math.round(b[0] + j())),
      spike: Math.max(10, Math.round(b[1] + j())),
      serve: Math.max(5, Math.round(b[2] + j() * 0.7)),
      block: Math.max(4, Math.round(b[3] + j() * 0.8))
    };
  });
  // 缩放到球队目标
  ['pass', 'spike', 'serve', 'block'].forEach(key => {
    const m = techBase.reduce((s, t) => s + t[key], 0) / techBase.length;
    const f = teamTarget[key] / m;
    techBase.forEach(t => { t[key] = Math.max(3, Math.min(85, Math.round(t[key] * f))); });
  });

  const players = rawPlayers.map((r, i) => ({
    id: i + 1,
    name: r[0],
    number: i + 1,
    position: r[2],
    grade: r[3],
    student_id: String(r[1]),
    height: r[4],
    weight: r[5],
    hand: r[6],
    attendance_rate: 0, // 稍后由出勤记录计算
    training_completion_rate: Math.round(79 + hash('comp2', i + 1) * 14),
    pass_rate: techBase[i].pass,
    spike_success_rate: techBase[i].spike,
    serve_score_rate: techBase[i].serve,
    block_success_rate: techBase[i].block,
    weekly: {
      pass: [65, 63, 63, 58].map((v, w) => Math.max(20, v + Math.round((hash('wp', i, w) - .5) * 10))),
      spike: [46, 47, 49, 50].map((v, w) => Math.max(10, v + Math.round((hash('ws', i, w) - .5) * 10)))
    }
  }));

  /* ---------- 由出勤记录计算每名球员 / 每次训练的真实出勤 ---------- */
  function recsOfTraining(tid) { return attendance.filter(a => a.training_id === tid); }
  function recsOfPlayer(pid) { return attendance.filter(a => a.player_id === pid); }
  const onTime = s => s === 'present' || s === 'late';

  players.forEach(p => {
    const recs = recsOfPlayer(p.id);
    const ok = recs.filter(a => onTime(a.status)).length;
    p.attendance_rate = Math.round((ok / recs.length) * 100);
  });
  trainings.forEach(t => {
    const recs = recsOfTraining(t.id);
    t.actual_count = recs.filter(a => onTime(a.status)).length;
    t.leave_count = recs.filter(a => a.status === 'leave').length;
    t.absent_count = recs.filter(a => a.status === 'absent').length;
    t.late_count = recs.filter(a => a.status === 'late').length;
  });

  /* ---------- 比赛 ---------- */
  const matchRaw = [
    ['南京理工大学', -30, '南京理工大学体育馆', 'finished', 'W', '3:1'],
    ['东南大学', -22, '南京大学体育馆', 'finished', 'L', '2:3'],
    ['南京航空航天大学', -15, '南京航空航天大学体育馆', 'finished', 'W', '3:0'],
    ['河海大学', -8, '南京大学体育馆', 'finished', 'W', '3:2'],
    ['南京师范大学', -2, '南京师范大学体育馆', 'finished', 'W', '3:1'],
    ['东南大学', 19, '南京大学体育馆', 'upcoming', null, null],
    ['南京师范大学', 34, '南京大学体育馆', 'upcoming', null, null]
  ];
  const matches = matchRaw.map((m, i) => {
    const d = addDays(today, m[1]);
    const ma = {
      id: 'M' + (i + 1),
      opponent: m[0],
      date: fmt(d),
      location: m[2],
      status: m[3],
      result: m[4],
      score: m[5],
      stats: null
    };
    if (m[3] === 'finished') {
      const won = m[4] === 'W';
      ma.stats = {
        pass_success: Math.round(60 + hash('mp', i) * 10),
        serve_score: 7 + Math.round(hash('ms', i) * 8),
        serve_error: 6 + Math.round(hash('mse', i) * 7),
        spike_score: 38 + Math.round(hash('mss', i) * 14),
        spike_error: 10 + Math.round(hash('msp', i) * 9),
        block_score: 6 + Math.round(hash('mb', i) * 8),
        defense_success: 30 + Math.round(hash('md', i) * 16),
        score: won ? 75 + Math.round(hash('msc', i) * 12) : 68 + Math.round(hash('msc', i) * 8),
        against: won ? 62 + Math.round(hash('ma2', i) * 12) : 78 + Math.round(hash('ma2', i) * 8)
      };
    }
    return ma;
  });

  /* ---------- 阵容（Lineup） ---------- */
  // 场上 6+1 槽位（2主攻/2副攻/二传/接应/自由人）
  const slotDef = [
    { key: 'oh1', pos: '主攻', x: 150, y: 92 },
    { key: 'oh2', pos: '主攻', x: 330, y: 92 },
    { key: 'mb1', pos: '副攻', x: 92, y: 250 },
    { key: 'mb2', pos: '副攻', x: 388, y: 250 },
    { key: 'set', pos: '二传', x: 150, y: 408 },
    { key: 'opp', pos: '接应', x: 330, y: 408 },
    { key: 'lib', pos: '自由人', x: 240, y: 250 }
  ];
  const startIds = [1, 2, 6, 7, 10, 13, 16]; // 首发
  function buildLineup(matchId) {
    const map = {};
    slotDef.forEach((s, i) => { map[s.key] = { player_id: startIds[i], position: s.pos, starting: 1 }; });
    return {
      id: 'L' + matchId,
      match_id: matchId,
      name: '首发阵容 A',
      slots: slotDef.map(s => s.key),
      slotPos: Object.fromEntries(slotDef.map(s => [s.key, s.pos])),
      map,
      bench: players.filter(p => !startIds.includes(p.id)).map(p => p.id),
      saved: true
    };
  }
  const lineups = {};
  matches.forEach(m => { lineups[m.id] = buildLineup(m.id); });
  lineups['M6'].saved = false; // 即将到来的比赛尚未确认

  /* ---------- 通知 ---------- */
  const notices = [
    { id: 'N1', type: '训练', title: '今日训练提醒', body: `今日 19:00 进行「${todayTr.title}」训练，地点：南京大学体育馆，请提前 15 分钟到场热身。`, when: '今天 08:00', unread: true },
    { id: 'N2', type: '出勤', title: '签到未完成', body: '今日训练仍有 3 名球员未完成签到/确认，请及时跟进。', when: '今天 18:40', unread: true },
    { id: 'N3', type: '比赛', title: '比赛倒计时', body: '距离下一场校际比赛（vs 东南大学）还有 19 天，比赛地点：南京大学体育馆。', when: '今天 09:00', unread: true },
    { id: 'N4', type: '数据', title: '技术数据波动', body: '本周球队一传到位率较上周下降 5%，建议在下次训练中增加接发球专项内容。', when: '昨天 21:30', unread: true },
    { id: 'N5', type: '出勤', title: '出勤异常提醒', body: '球员褚一凡近 2 次训练连续缺勤，请客观关注其出勤情况（系统不做能力或健康判断）。', when: '昨天 18:05', unread: false },
    { id: 'N6', type: '训练', title: '周训练计划已发布', body: '本周共安排 4 次训练：基础技术 / 接发球专项 / 六人配合 / 模拟比赛。', when: '周一 09:00', unread: false },
    { id: 'N7', type: '比赛', title: '比赛复盘已生成', body: '上一场 vs 南京师范大学（3:1）比赛数据已汇总，可进入比赛复盘查看。', when: '2 天前', unread: false },
    { id: 'N8', type: '数据', title: '训练数据周报', body: '本月球队出勤率 91%，训练完成率 86%，数据摘要已生成。', when: '3 天前', unread: false },
    { id: 'N9', type: '出勤', title: '请假申请', body: '球员蒋若溪提交今日训练请假申请，原因为课程冲突。', when: '今天 13:20', unread: true },
    { id: 'N10', type: '训练', title: '训练完成度提醒', body: '本周训练计划尚有 1 项内容未标记完成。', when: '4 天前', unread: false }
  ];

  /* ---------- 挂载数据 ---------- */
  Object.assign(VBM.D, {
    players, trainings, attendance, matches, lineups, notices,
    POSITIONS, POS_COLOR, slotDef,
    teamTrend: {
      attendance: [88, 90, 93, 92],
      pass: [65, 63, 63, 58],
      spike: [46, 47, 49, 50],
      serve: [16, 17, 18, 19],
      block: [21, 23, 24, 26]
    }
  });

  /* ---------- 查询辅助 ---------- */
  VBM.q = {
    player: id => players.find(p => p.id === Number(id)),
    training: id => trainings.find(t => t.id === id),
    match: id => matches.find(m => m.id === id),
    lineup: mid => lineups[mid],
    recsOfTraining, recsOfPlayer,
    onTime,
    // 球队汇总指标（动态计算）
    teamSummary() {
      const mean = f => Math.round(players.reduce((s, p) => s + f(p), 0) / players.length);
      // 出勤率按全体出勤记录的总体口径计算，避免逐人取整造成的偏差
      const total = attendance.length;
      const onTimeCount = attendance.filter(a => onTime(a.status)).length;
      return {
        attendance: Math.round(onTimeCount / total * 100),
        completion: mean(p => p.training_completion_rate),
        pass: mean(p => p.pass_rate),
        spike: mean(p => p.spike_success_rate),
        serve: mean(p => p.serve_score_rate),
        block: mean(p => p.block_success_rate)
      };
    },
    attendanceAnomalies() {
      // 仅基于客观出勤记录的异常：近 4 次中非出勤 ≥2 次
      const out = [];
      players.forEach(p => {
        const recs = recsOfPlayer(p.id).slice(-4);
        const bad = recs.filter(a => !onTime(a.status));
        if (bad.length >= 2) out.push({ player: p, bad: bad.length, total: recs.length });
      });
      return out;
    }
  };
})();
