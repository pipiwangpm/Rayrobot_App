/* Task / run model shared by the task tab and creation flow. */
const TaskFlow = (() => {
  const key = 'prototype-task-flow-v26';
  const robots = [
    {id:'A03', name:'迎宾机器人 · A03', online:true},
    {id:'K12', name:'接待机器人 · K12', online:true},
    {id:'U2', name:'导览机器人 · U2', online:true},
    {id:'D07', name:'咨询机器人 · D07', online:false}
  ];
  robots.forEach(robot=>{
    const source=typeof Fleet!=='undefined'?Fleet.data?.[robot.id]:null;
    robot.group=source?.group||'未分组';
    try{
      const saved=JSON.parse(localStorage.getItem('fleet-device-'+robot.id)||'{}');
      if(saved.group)robot.group=saved.group;
      if(saved.name)robot.name=saved.name;
    }catch(_){}
  });
  const scripts = [
    {id:'welcome', name:'迎宾导览 v3', roles:['迎宾大使','导览讲解','合影互动']},
    {id:'dance', name:'群舞 · 品牌亮相', roles:['主舞','伴舞左','伴舞右']},
    {id:'reception', name:'展厅接待 v2', roles:['接待员','讲解员']}
  ];
  const materials = ['夏季新品 · 竖屏轮播','开业酬宾 · 15s 视频','节日问候 · 静态海报'];
  const seed = [
    {id:'t1',name:'大厅迎宾 · 秋日主题',type:'脚本',robots:['A03'],note:'迎宾导览 v3 · 迎宾大使 → A03',runs:[{status:'执行中',time:'今天 10:02',duration:'进行中',robots:'A03',note:'正在执行'},{status:'成功',time:'今天 07:30',duration:'12 分钟',robots:'A03',note:''}]},
    {id:'t2',name:'展厅接待',type:'脚本',robots:['K12'],note:'展厅接待 v2 · 接待员 → K12',runs:[{status:'执行中',time:'今天 10:08',duration:'进行中',robots:'K12',note:'正在执行'}]},
    {id:'t3',name:'早间迎宾',type:'脚本',robots:['A03'],note:'迎宾导览 v3 · A03',runs:[{status:'成功',time:'今天 07:30',duration:'8 分钟',robots:'A03',note:''},{status:'失败',time:'今天 06:58',duration:'0 分钟',robots:'A03',note:'已拒绝下发：设备被其他任务占用'}]},
    {id:'t4',name:'访客咨询',type:'脚本',robots:['K12'],note:'展厅接待 v2 · K12',runs:[{status:'失败',time:'今天 08:12',duration:'0 分钟',robots:'K12',note:'连接中断，拒绝下发'}]},
    {id:'t5',name:'品牌快闪 · 广告轮播',type:'广告',robots:['A03','U2'],note:'每台一组素材 · 按序循环',runs:[{status:'成功',time:'昨天 13:00',duration:'30 分钟',robots:'A03、U2',note:'夏季新品 → 开业酬宾'}]},
    {id:'t6',name:'贵宾厅跟随',type:'跟随',robots:['U2'],note:'固定引导员 · 贴身跟随',runs:[{status:'成功',time:'昨天 15:30',duration:'20 分钟',robots:'U2',note:''}]},
    {id:'t7',name:'闭馆温馨提醒',type:'口播',robots:['A03'],note:'默认音色 · 42 字',runs:[{status:'成功',time:'今天 09:40',duration:'38 秒',robots:'A03',note:''}]}
  ];
  function clone(value){return JSON.parse(JSON.stringify(value))}
  function load(){try{const value=JSON.parse(localStorage.getItem(key)||'null');return Array.isArray(value)?value:clone(seed)}catch(_){return clone(seed)}}
  function save(tasks){try{localStorage.setItem(key,JSON.stringify(tasks))}catch(_){}}
  function latest(task){return task.runs[0]}
  function time(){const d=new Date();return '今天 '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}
  function dispatch(task,tasks){
    const offline=task.robots.find(id=>!robots.find(robot=>robot.id===id)?.online);
    const busy=task.robots.map(id=>({id,other:tasks.find(t=>t.id!==task.id&&latest(t)?.status==='执行中'&&t.robots.includes(id))})).find(x=>x.other);
    const reason=offline?`设备 ${offline} 离线，拒绝下发`:busy?`设备 ${busy.id} 正被「${busy.other.name}」占用，拒绝下发`:'';
    const run={status:reason?'失败':'执行中',time:time(),duration:reason?'0 分钟':'进行中',robots:task.robots.join('、'),note:reason||'立即下发 · 正在执行'};
    task.runs.unshift(run);save(tasks);return run;
  }
  return {robots,scripts,materials,load,save,latest,dispatch};
})();
