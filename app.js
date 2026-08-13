// --- 数据配置 ---
const tasksData = {
  positive: [
    { id: 'p1', name: '八点之前起床', points: 3 },
    { id: 'p2', name: '坚持背单词', points: 5 },
    { id: 'p3', name: '写英语阅读', points: 5 },
    { id: 'p4', name: '每周作文', points: 3 },
    { id: 'p5', name: '专业课学习两小时', points: 6 },
    { id: 'p6', name: '专业课刷题两小时', points: 6 },
    // { id: 'p7', name: '政治课刷题一小时', points: 5 },
    // { id: 'p8', name: '回顾昨日背诵', points: 3 },
    // { id: 'p9', name: '回顾昨日错题', points: 3 },
    { id: 'p10', name: '每日三餐按时规律吃', points: 2 },
    { id: 'p11', name: '锻炼放松', points: 8 },
    // { id: 'p12', name: '抖音使用时间小于两小时', points: 5 },
    { id: 'p13', name: '小红书使用时间小于1小时', points: 8 },
    { id: 'p14', name: '购物平台使用时间小于半小时', points: 4 },
  ],
  duration: [
    { id: 'd1', name: '每日学习5小时', points: 3 },
    { id: 'd2', name: '每日学习6小时', points: 5 },
    { id: 'd3', name: '每日学习7小时', points: 7 },
    { id: 'd4', name: '每日学习8小时', points: 8 },
    { id: 'd5', name: '每日学习9小时', points: 10 },
  ],
  negative: [
    { id: 'n1', name: '零点以后睡觉', points: -5 },
    { id: 'n2', name: '英语任务（单词 or 阅读 or 写作）未达标', points: -2 },
    { id: 'n3', name: '专业课任务未达标', points: -2 },
    // { id: 'n4', name: '政治课任务未达标', points: -2 },
    // { id: 'n5', name: '没有回顾知识', points: -3 },
    { id: 'n6', name: '不好好吃饭老是焦虑', points: -5 },
    // { id: 'n7', name: '当日学习时间小于4小时', points: -10 },
    { id: 'n8', name: '自暴自弃', points: -20 },
  ]
};

const shopData = {
  exchange: [
    { id: 'e1', name: '奶茶', cost: 130 },
    // { id: 'e2', name: '好利来', cost: 500 },
    // { id: 'e3', name: '想要的小礼物', cost: 800 },
    { id: 'e4', name: '每周一次休息', cost: 130 },
    // { id: 'e5', name: '随心所欲卡', cost: 1000 },
  ],
  milestone: [
    { id: 'm1', name: '奶茶', cost: 130 },
    { id: 'm2', name: '丰盛外卖', cost: 500 },
    // { id: 'm3', name: '榴莲', cost: 400 },
    { id: 'm4', name: 'K歌', cost: 500 },
    { id: 'm5', name: '想买的衣服裤子', cost: 1000 },
    // { id: 'm6', name: '小小系列jellycat', cost: 800 },
    { id: 'm6', name: 'K歌', cost: 1500 },
    { id: 'm7', name: '神秘小惊喜', cost: 1000 },
    { id: 'm8', name: '神秘大惊喜', cost: 2000 },
    { id: 'm9', name: '迪士尼系列随意挑选', cost: 900 },
    { id: 'm10', name: '神秘大礼包 (仅限一次)', cost: 4000 },
    // { id: 'm11', name: '奢侈品包包', cost: 4000 },
    { id: 'm12', name: '考研上岸 (外加甜蜜旅行)', cost: 10000 },
  ]
};

// --- 状态管理 ---
let state = {
  currentPoints: 0,
  totalPoints: 0,
  lastCheckDate: '', 
  streakDays: 0,
  tasksChecked: {},  
  milestonesClaimed: {}, 
  history: [] // 日志记录
};

// --- 初始化与持久化 ---
async function loadState() {
  try {
    const response = await fetch('/api/state');
    if (response.ok) {
      const saved = await response.json();
      if (Object.keys(saved).length > 0) {
        state = saved;
      } else {
        // 后端还没有数据时，尝试看看本地有没有老数据，顺便合并一下
        const oldSaved = localStorage.getItem('xiaotongzi_state');
        if (oldSaved) {
          const oldState = JSON.parse(oldSaved);
          state.currentPoints = oldState.currentPoints || 0;
          state.totalPoints = oldState.totalPoints || 0;
          state.tasksChecked = oldState.tasksChecked || {};
          state.milestonesClaimed = oldState.milestonesClaimed || {};
          state.lastCheckDate = oldState.lastCheckDate || '';
        }
      }
    }
  } catch (e) {
    console.error("加载云端数据失败，请检查服务器是否开启", e);
    // 如果服务器连不上，降级读取本地试试
    const local = localStorage.getItem('xiaotongzi_state_v2');
    if (local) state = JSON.parse(local);
  }
  
  const todayDate = new Date();
  const todayStr = todayDate.toDateString();
  
  if (state.lastCheckDate !== todayStr) {
    const yesterday = new Date(todayDate);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (state.lastCheckDate === yesterday.toDateString()) {
      state.streakDays = (state.streakDays || 0) + 1;
    } else if (state.lastCheckDate !== '') {
      state.streakDays = 1;
    } else {
      state.streakDays = 1;
    }

    state.tasksChecked = {};
    state.lastCheckDate = todayStr;
    addLog('新的一天，加油！', 'gain', 0);
    saveState();
  }
}

async function saveState() {
  // 依然保存一份到本地做备份
  localStorage.setItem('xiaotongzi_state_v2', JSON.stringify(state));
  
  // 发送给后端
  try {
    await fetch('/api/state', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(state)
    });
  } catch (e) {
    console.error("同步到云端失败", e);
  }
  
  updateUI();
}

// 记录日志
function addLog(actionName, type, points) {
  const now = new Date();
  const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  
  state.history.unshift({
    time: timeStr,
    date: now.toDateString(),
    action: actionName,
    type: type, // gain, loss, redeem
    points: points
  });

  // 最多保留 100 条
  if (state.history.length > 100) {
    state.history.pop();
  }
}

// --- 渲染逻辑 ---
function renderDate() {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  const now = new Date();
  const dateStr = `今天是 ${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 星期${days[now.getDay()]}`;
  document.getElementById('today-date').innerText = dateStr;
}

function renderTasks() {
  const renderList = (data, containerId, isNegative = false, isDuration = false) => {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    data.forEach(task => {
      const isChecked = state.tasksChecked[task.id] || false;
      const ptsClass = isNegative ? 'minus' : 'plus';
      const ptsPrefix = isNegative ? '' : '+';
      
      let extraClass = '';
      let extraIcon = '';
      if (!isNegative && task.points >= 8) {
        extraIcon = '<i class="fa-solid fa-fire high-points-icon"></i>';
      }
      if (isNegative && task.points <= -10) {
        extraClass = 'severe-penalty';
      }
      
      const card = document.createElement('div');
      card.className = `card ${extraClass}`;
      
      let inputType = isDuration ? 'radio' : 'checkbox';
      let inputName = isDuration ? 'name="durationGroup"' : '';
      
      card.innerHTML = `
        <div class="task-info">
          <span class="task-name">${task.name}${extraIcon}</span>
          <span class="task-pts ${ptsClass}">${ptsPrefix}${task.points} 分</span>
        </div>
        <label class="checkbox-wrapper">
          <input type="${inputType}" ${inputName} id="task-${task.id}" ${isChecked ? 'checked' : ''} onchange="handleTaskChange('${task.id}', '${task.name}', ${task.points}, ${isNegative}, this, ${isDuration})">
          <div class="checkmark ${isNegative ? 'negative' : ''}">
            <i class="fa-solid fa-check"></i>
          </div>
        </label>
      `;
      container.appendChild(card);
    });
  };

  renderList(tasksData.positive, 'list-positive');
  renderList(tasksData.duration, 'list-duration', false, true);
  renderList(tasksData.negative, 'list-negative', true);
}

function renderShop() {
  const renderExchangeList = (data, containerId, isMilestone = false) => {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    data.forEach(item => {
      const card = document.createElement('div');
      card.className = 'card';
      
      const affordable = isMilestone ? (state.totalPoints >= item.cost) : (state.currentPoints >= item.cost);
      const claimed = isMilestone && state.milestonesClaimed[item.id];
      const disabledAttr = (!affordable || claimed) ? 'disabled' : '';
      
      let btnText = '兑换';
      if (claimed) btnText = '已达成';
      else if (!affordable) btnText = '积分不足';

      card.innerHTML = `
        <div class="shop-item-info">
          <span class="shop-item-name">${item.name}</span>
          <span class="shop-item-cost"><i class="fa-solid fa-coins"></i> ${item.cost} 分</span>
        </div>
        <button class="btn-redeem" ${disabledAttr} onclick="handleRedeem('${item.id}', ${item.cost}, ${isMilestone}, '${item.name}')">${btnText}</button>
      `;
      container.appendChild(card);
    });
  };

  renderExchangeList(shopData.exchange, 'list-exchange');
  renderExchangeList(shopData.milestone, 'list-milestone', true);
}

function renderHistory() {
  const container = document.getElementById('history-timeline');
  container.innerHTML = '';
  
  if (state.history.length === 0) {
    container.innerHTML = `
      <div style="color:var(--text-muted); text-align:center; padding: 40px 20px;">
        <i class="fa-regular fa-face-smile-wink" style="font-size: 3rem; margin-bottom: 15px; color: var(--secondary-color);"></i>
        <div>暂无打卡记录哦，开始今天的努力吧！</div>
      </div>
    `;
    return;
  }

  state.history.forEach(log => {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    
    let sign = '';
    if (log.type === 'gain') sign = '+';
    else if (log.type === 'loss') sign = ''; // log.points already negative or implicit
    else if (log.type === 'redeem') sign = '-';

    let ptsDisplay = (log.points !== 0) ? `(${sign}${Math.abs(log.points)}分)` : '';

    item.innerHTML = `
      <div class="tl-time">${log.date} ${log.time}</div>
      <div class="tl-content ${log.type}">${log.action} ${ptsDisplay}</div>
    `;
    container.appendChild(item);
  });
}

function updateProgressBar() {
  const currentTotal = state.totalPoints;
  let nextGoal = null;
  
  for (let i = 0; i < shopData.milestone.length; i++) {
    let m = shopData.milestone[i];
    if (!state.milestonesClaimed[m.id] && m.cost > currentTotal) {
      nextGoal = m;
      break;
    }
  }

  const progressText = document.getElementById('progress-text');
  const barFill = document.getElementById('progress-bar-fill');
  
  if (!progressText || !barFill) return;

  if (nextGoal) {
    const diff = nextGoal.cost - currentTotal;
    progressText.innerText = `距离【${nextGoal.name}】还差 ${diff} 分`;
    const percent = Math.min(100, Math.max(0, (currentTotal / nextGoal.cost) * 100));
    barFill.style.width = `${percent}%`;
  } else {
    progressText.innerText = `太棒了！所有累计成就已解锁！🎉`;
    barFill.style.width = `100%`;
  }
}

function updateUI() {
  document.getElementById('current-points').innerText = state.currentPoints;
  document.getElementById('total-points').innerText = state.totalPoints;
  if (document.getElementById('streak-display')) {
    document.getElementById('streak-display').innerText = `已连续努力 ${state.streakDays || 0} 天 👏`;
  }
  renderShop(); 
  renderHistory();
  updateProgressBar();
}

// --- 交互处理 ---
function playSound(type) {
  try {
    if (type === 'ding') {
      const audio = document.getElementById('audio-ding');
      audio.currentTime = 0;
      audio.play();
    } else {
      const audio = document.getElementById('audio-error');
      audio.currentTime = 0;
      audio.play();
    }
  } catch(e) {
    // 忽略无法自动播放的情况
  }
}

function handleTaskChange(taskId, taskName, points, isNegative, el, isDuration) {
  const isChecked = el.checked;
  
  if (isDuration) {
    tasksData.duration.forEach(dTask => {
      if (state.tasksChecked[dTask.id] && dTask.id !== taskId) {
        state.currentPoints -= dTask.points;
        state.totalPoints -= dTask.points;
        delete state.tasksChecked[dTask.id];
        addLog(`取消选择 ${dTask.name}`, 'loss', -dTask.points);
      }
    });
  }

  if (isChecked) {
    state.currentPoints += points;
    if (!isNegative) {
      state.totalPoints += points; 
      addLog(`完成打卡：${taskName}`, 'gain', points);
      playSound('ding');
      triggerConfetti(el);
    } else {
      addLog(`扣分项目：${taskName}`, 'loss', points);
      playSound('error');
    }
    state.tasksChecked[taskId] = true;
    
  } else {
    state.currentPoints -= points;
    if (!isNegative) {
      state.totalPoints -= points;
      addLog(`取消打卡：${taskName}`, 'loss', -points);
    } else {
      addLog(`撤销扣分：${taskName}`, 'gain', Math.abs(points));
    }
    delete state.tasksChecked[taskId];
  }
  
  saveState();
}

function handleRedeem(itemId, cost, isMilestone, itemName) {
  if (isMilestone) {
    if (state.totalPoints >= cost) {
      state.milestonesClaimed[itemId] = true;
      addLog(`达成累计成就：${itemName}`, 'redeem', 0);
      showTicket(itemName, 0, '达成累计成就免费兑换！');
      saveState();
    }
  } else {
    if (state.currentPoints >= cost) {
      if(confirm(`确定要花费 ${cost} 积分兑换【${itemName}】吗？`)) {
        state.currentPoints -= cost;
        addLog(`兑换奖品：${itemName}`, 'redeem', cost);
        showTicket(itemName, cost, '你超棒的！继续加油鸭！');
        saveState();
      }
    }
  }
}

// --- 兑换券生成逻辑 ---
function showTicket(itemName, cost, msg) {
  const now = new Date();
  
  document.getElementById('ticket-item-name').innerText = itemName;
  document.getElementById('ticket-cost-val').innerText = cost;
  document.getElementById('ticket-date-val').innerText = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}`;
  document.querySelector('.ticket-msg').innerText = `"${msg}"`;
  
  // 生成随机编号
  const serial = Math.floor(Math.random() * 900000) + 100000;
  document.getElementById('ticket-serial-val').innerText = serial;

  const modal = document.getElementById('ticket-modal-overlay');
  modal.style.display = 'flex';
  
  triggerBigConfetti();
}

function closeTicketModal() {
  document.getElementById('ticket-modal-overlay').style.display = 'none';
}

function saveTicketAsImage() {
  const captureArea = document.getElementById('ticket-capture-area');
  html2canvas(captureArea, { scale: 3 }).then(canvas => {
    const link = document.createElement('a');
    link.download = `兑换券-${document.getElementById('ticket-item-name').innerText}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
}

// --- Tab 切换 ---
function switchTab(tabId, el) {
  document.querySelectorAll('.view-section').forEach(section => {
    section.classList.remove('active');
  });
  document.querySelectorAll('.nav-item').forEach(nav => {
    nav.classList.remove('active');
  });
  
  document.getElementById(`view-${tabId}`).classList.add('active');
  el.classList.add('active');
}

// --- 特效函数 ---
function triggerConfetti(el) {
  const rect = el.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;
  
  confetti({
    particleCount: 40,
    spread: 60,
    origin: { x, y },
    colors: ['#ff8fab', '#fb6f92', '#4ade80']
  });
}

function triggerBigConfetti() {
  var duration = 3000;
  var end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#ff8fab', '#fb6f92', '#4ade80', '#ffd166']
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#ff8fab', '#fb6f92', '#4ade80', '#ffd166']
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
}

// --- 设置与数据备份 ---
function openSettingsModal() {
  document.getElementById('settings-modal-overlay').style.display = 'flex';
}

function closeSettingsModal() {
  document.getElementById('settings-modal-overlay').style.display = 'none';
}

function exportData() {
  const dataStr = JSON.stringify(state);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `小彤子奖励计划备份_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedState = JSON.parse(e.target.result);
      if (importedState && importedState.tasksChecked !== undefined) {
        state = importedState;
        saveState();
        closeSettingsModal();
        alert('数据恢复成功！');
      } else {
        alert('文件格式错误！');
      }
    } catch (err) {
      alert('解析失败，请检查文件是否完整。');
    }
  };
  reader.readAsText(file);
}

// --- 启动应用 ---
window.onload = async () => {
  renderDate();
  await loadState();
  renderTasks();
  updateUI();
};

// --- PWA Service Worker 注册 ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(registration => {
      console.log('SW registered');
    }).catch(err => {
      console.log('SW failed', err);
    });
  });
}
