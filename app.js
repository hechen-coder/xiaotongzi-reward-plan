// --- 数据配置 ---
const tasksData = {
  positive: [
    { id: 'p1', name: '八点之前起床', points: 4 },
    { id: 'p2', name: '坚持背单词', points: 2 },
    { id: 'p3', name: '写英语阅读', points: 2 },
    { id: 'p4', name: '每周作文', points: 3 },
    { id: 'p5', name: '专业课学习两小时', points: 5 },
    { id: 'p6', name: '专业课刷题两小时', points: 5 },
    { id: 'p7', name: '政治课刷题一小时', points: 5 },
    { id: 'p8', name: '回顾昨日背诵', points: 3 },
    { id: 'p9', name: '回顾昨日错题', points: 3 },
    { id: 'p10', name: '每日三餐按时规律吃', points: 4 },
    { id: 'p11', name: '锻炼放松', points: 8 },
    { id: 'p12', name: '抖音使用时间小于两小时', points: 5 },
    { id: 'p13', name: '小红书使用时间小于1小时', points: 8 },
    { id: 'p14', name: '淘宝使用时间小于半小时', points: 6 },
  ],
  duration: [
    { id: 'd1', name: '每日学习6小时', points: 3 },
    { id: 'd2', name: '每日学习7小时', points: 5 },
    { id: 'd3', name: '每日学习8小时', points: 7 },
    { id: 'd4', name: '每日学习10小时', points: 8 },
    { id: 'd5', name: '每日学习12小时', points: 10 },
  ],
  negative: [
    { id: 'n1', name: '一点半以后睡觉', points: -5 },
    { id: 'n2', name: '英语任务未达标', points: -2 },
    { id: 'n3', name: '专业课任务未达标', points: -2 },
    { id: 'n4', name: '政治课任务未达标', points: -2 },
    { id: 'n5', name: '没有回顾知识', points: -3 },
    { id: 'n6', name: '不好好吃饭老是焦虑', points: -5 },
    { id: 'n7', name: '当日学习时间小于4小时', points: -10 },
    { id: 'n8', name: '自暴自弃', points: -20 },
  ]
};

const shopData = {
  exchange: [
    { id: 'e1', name: '奶茶', cost: 1 },
    { id: 'e2', name: '好利来', cost: 500 },
    { id: 'e3', name: '想要的小礼物', cost: 800 },
    { id: 'e4', name: '每周一次休息', cost: 500 },
    { id: 'e5', name: '随心所欲卡', cost: 1000 },
  ],
  milestone: [
    { id: 'm1', name: '奶茶', cost: 100 },
    { id: 'm2', name: '丰盛外卖', cost: 300 },
    { id: 'm3', name: '榴莲', cost: 400 },
    { id: 'm4', name: '拍立得相纸10张', cost: 400 },
    { id: 'm5', name: '想买的衣服裤子', cost: 700 },
    { id: 'm6', name: '小小系列jellycat', cost: 800 },
    { id: 'm7', name: '神秘小惊喜', cost: 800 },
    { id: 'm8', name: '神秘大惊喜', cost: 900 },
    { id: 'm9', name: '迪士尼系列随意挑选', cost: 900 },
    { id: 'm10', name: '神秘大礼包 (仅限一次)', cost: 1000 },
    { id: 'm11', name: '奢侈品包包', cost: 4000 },
    { id: 'm12', name: '考研上岸 (外加甜蜜旅行)', cost: 10000 },
  ]
};

// --- 状态管理 ---
let state = {
  currentPoints: 0,
  totalPoints: 0,
  lastCheckDate: '', 
  tasksChecked: {},  
  milestonesClaimed: {}, 
  history: [] // 日志记录
};

// --- 初始化与持久化 ---
function loadState() {
  const saved = localStorage.getItem('xiaotongzi_state_v2'); // 用新key防止冲突
  if (saved) {
    state = JSON.parse(saved);
  } else {
    // 兼容老版本数据
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
  
  const today = new Date().toDateString();
  if (state.lastCheckDate !== today) {
    state.tasksChecked = {};
    state.lastCheckDate = today;
    addLog('新的一天，加油！', 'gain', 0);
    saveState();
  }
}

function saveState() {
  localStorage.setItem('xiaotongzi_state_v2', JSON.stringify(state));
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
      
      const card = document.createElement('div');
      card.className = 'card';
      
      let inputType = isDuration ? 'radio' : 'checkbox';
      let inputName = isDuration ? 'name="durationGroup"' : '';
      
      card.innerHTML = `
        <div class="task-info">
          <span class="task-name">${task.name}</span>
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
    container.innerHTML = '<div style="color:#aaa; text-align:center; padding: 20px;">暂无打卡记录哦，开始今天的努力吧！</div>';
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

function updateUI() {
  document.getElementById('current-points').innerText = state.currentPoints;
  document.getElementById('total-points').innerText = state.totalPoints;
  renderShop(); 
  renderHistory();
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

// --- 启动应用 ---
window.onload = () => {
  renderDate();
  loadState();
  renderTasks();
  updateUI();
};
