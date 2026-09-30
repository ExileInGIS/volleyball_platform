/* 系统设置：球队信息 / 权限（球员/教练/队长） / 数据管理 / 通知设置 */
(function () {
  const VBM = window.VBM;
  const { icon } = VBM;
  VBM.pages = VBM.pages || {};

  const TABS = ['球队信息', '球员权限', '教练权限', '队长权限', '数据管理', '通知设置'];
  const PERMS = ['查看训练计划', '创建/修改训练', '训练签到', '管理球员档案', '配置比赛阵容', '记录比赛数据', '查看球队数据分析', '导出球队数据'];

  VBM.pages.settings = function (c) {
    let tab = TABS[0];
    c.innerHTML = `
      <div class="page-head"><div><div class="page-title">系统设置</div>
        <div class="page-desc">角色权限清晰分离：最终训练/阵容/人员决策归教练与队长，系统仅记录与辅助</div></div></div>
      <div class="setting-nav" id="tabs">
        ${TABS.map((t, i) => `<button class="set-tab ${i === 0 ? 'active' : ''}" data-t="${t}">${t}</button>`).join('')}
      </div>
      <div id="body"></div>`;

    const body = c.querySelector('#body');

    function render() {
      if (tab === '球队信息') renderTeam();
      else if (tab.includes('权限')) renderPerm();
      else if (tab === '数据管理') renderData();
      else renderNotify();
    }

    function renderTeam() {
      body.innerHTML = `<div class="card">
        <div class="form-grid">
          <div class="form-field"><label>球队名称</label><input class="input" value="南京大学女子排球队"></div>
          <div class="form-field"><label>所属院校</label><input class="input" value="南京大学"></div>
          <div class="form-field"><label>主运动项目</label>
            <select class="select-input"><option>排球</option><option>篮球</option><option>足球</option></select></div>
          <div class="form-field"><label>赛季</label><input class="input" value="2026 赛季"></div>
          <div class="form-field"><label>常驻训练场馆</label><input class="input" value="南京大学体育馆"></div>
          <div class="form-field"><label>球队人数</label><input class="input" value="18"></div>
          <div class="form-field full"><label>球队简介</label>
            <textarea class="textarea">南京大学女子排球队，代表南京大学参加各级高校排球赛事，每周固定训练 4 次。</textarea></div>
        </div>
        <div style="text-align:right;margin-top:16px"><button class="btn btn-primary" onclick="VBM.toast('球队信息已保存','ok')">保存</button></div>
      </div>`;
    }

    function renderPerm() {
      // 不同角色默认权限矩阵
      const matrix = {
        '球员权限': [1, 0, 0, 0, 0, 0, 0, 0],
        '教练权限': [1, 1, 1, 1, 1, 1, 1, 1],
        '队长权限': [1, 1, 1, 1, 1, 1, 1, 0]
      };
      const vals = matrix[tab];
      body.innerHTML = `<div class="card">
        <div class="info-tip" style="margin-bottom:14px">${icon('shield')} 权限最小化分配。球员默认为只读视角；教练拥有完整管理权限；队长除“导出球队数据”外拥有管理权限。</div>
        <div class="table-wrap"><table class="data-table perm-table">
          <thead><tr><th>权限项</th><th>${tab.replace('权限', '')}</th><th style="width:120px">开关</th></tr></thead>
          <tbody>${PERMS.map((p, i) => `<tr>
            <td>${p}</td><td><span class="tag ${vals[i] ? 'tag-green' : 'tag-gray'}">${vals[i] ? '允许' : '不可用'}</span></td>
            <td><label class="switch"><input type="checkbox" ${vals[i] ? 'checked' : ''}><span class="sl"></span></label></td>
          </tr>`).join('')}</tbody>
        </table></div>
        <div style="text-align:right;margin-top:14px"><button class="btn btn-primary" onclick="VBM.toast('权限设置已保存','ok')">保存权限</button></div>
      </div>`;
    }

    function renderData() {
      body.innerHTML = `
        <div class="grid g-2">
          <div class="card">
            <div class="card-title" style="margin-bottom:12px">${icon('database')} 数据导出 / 备份</div>
            ${['球员档案数据', '训练与出勤数据', '比赛与技术统计', '球队阵容数据'].map(x =>
              `<div style="display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px dashed var(--line)">
                <span>${x}</span><button class="btn btn-sm btn-soft" onclick="VBM.toast('${x}导出任务已创建（模拟）','ok')">${icon('download')} 导出</button></div>`).join('')}
          </div>
          <div class="card">
            <div class="card-title" style="margin-bottom:12px">${icon('alert')} 危险操作</div>
            <p style="font-size:13px;color:var(--ink-2);margin-bottom:14px">清空数据不可恢复，仅建议在赛季归档后操作。归档数据保留只读。</p>
            <button class="btn btn-danger-ghost" style="margin-right:8px" onclick="VBM.confirmBox('确认归档本赛季全部数据？归档后将转为只读。',()=>VBM.toast('已归档（模拟）','ok'))">归档本赛季</button>
            <button class="btn btn-danger-ghost" onclick="VBM.confirmBox('确认清空全部模拟数据？此操作不可恢复。',()=>VBM.toast('已取消清空（演示保护）','info'))">清空数据</button>
          </div>
        </div>`;
    }

    function renderNotify() {
      const items = ['训练通知（计划/变更）', '出勤提醒（未签到/异常）', '比赛提醒（倒计时/结果）', '数据提醒（指标波动）'];
      body.innerHTML = `<div class="card">
        ${items.map(x => `<div style="display:flex;justify-content:space-between;align-items:center;padding:13px 0;border-bottom:1px dashed var(--line)">
          <span>${x}</span><label class="switch"><input type="checkbox" checked><span class="sl"></span></label></div>`).join('')}
        <div class="form-field" style="margin-top:16px"><label>提醒方式</label>
          <div style="display:flex;gap:16px;margin-top:6px">
            <label class="dot-tag"><input type="checkbox" checked> 站内通知</label>
            <label class="dot-tag"><input type="checkbox"> 邮件</label>
            <label class="dot-tag"><input type="checkbox"> 微信（预留）</label>
          </div></div>
        <div style="text-align:right;margin-top:16px"><button class="btn btn-primary" onclick="VBM.toast('通知设置已保存','ok')">保存</button></div>
      </div>`;
    }

    c.querySelector('#tabs').querySelectorAll('button').forEach(b => b.onclick = () => {
      tab = b.getAttribute('data-t');
      c.querySelector('#tabs').querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
      render();
    });
    render();
  };
})();
