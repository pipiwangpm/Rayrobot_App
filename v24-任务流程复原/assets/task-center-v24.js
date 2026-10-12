const TaskCenter = (() => {
  const {page,toast,esc,icon}=AppUI;
  const local=(()=>{try{return new URLSearchParams(location.search).get('m')==='local'||localStorage.getItem('robops.mode')==='local'}catch(_){return false}})();
  let tasks=TaskFlow.load();
  const body='<div id="taskContent"></div>';
  page('任务',body,{primary:true,active:'任务',right:'<a class="icon-button" href="task-create.html'+(local?'?m=local':'')+'" aria-label="新建任务">'+icon('plus')+'</a>'});
  const root=document.getElementById('taskContent');
  const statusClass={执行中:'blue',成功:'',失败:'warn',已取消:'neutral'};
  const stamp=t=>TaskFlow.latest(t);
  function runHtml(run){
    return '<div class="timeline-item"><small>'+esc(run.time)+' · '+esc(run.duration)+' · '+esc(run.robots)+'</small><strong>'+esc(run.status)+'</strong>'+(run.note?'<p class="'+(run.status==='失败'?'task-error':'')+'">'+esc(run.note)+'</p>':'')+'</div>';
  }
  function card(task){
    const run=stamp(task),state=run.status;
    return '<article class="task-card"><div class="task-top"><div><h3>'+esc(task.name)+'</h3><p>'+esc(task.type)+'任务 · '+esc(task.note)+'</p></div><span class="status-chip '+(statusClass[state]||'neutral')+'">'+esc(state)+'</span></div>'+
      '<div class="task-sub">'+esc(run.time)+' · '+task.runs.length+' 条执行记录</div>'+
      '<details><summary>查看执行记录 ▾</summary><div class="timeline">'+task.runs.map(runHtml).join('')+'</div></details>'+
      '<div class="task-foot"><small>上次执行 '+esc(run.time)+'</small><button data-run="'+esc(task.id)+'" '+(state==='执行中'?'disabled':'')+'>'+(state==='执行中'?'执行中':'再次执行')+'</button></div></article>';
  }
  function group(title,items,done){
    return items.length?'<section class="task-group '+(done?'done':'')+'"><h2>'+title+'（'+items.length+'）</h2>'+items.map(card).join('')+'</section>':'';
  }
  function renderCloud(){
    const running=tasks.filter(t=>stamp(t).status==='执行中');
    const completed=tasks.filter(t=>stamp(t).status!=='执行中');
    root.innerHTML=group('执行中',running,false)+group('已完成',completed,true);
    root.querySelectorAll('[data-run]').forEach(button=>button.onclick=()=>{
      const task=tasks.find(t=>t.id===button.dataset.run);if(!task)return;
      const result=TaskFlow.dispatch(task,tasks);renderCloud();
      toast(result.status==='失败'?result.note:'已开始执行「'+task.name+'」');
    });
  }
  const cache=[
    {id:'A03',name:'迎宾机器人',busy:false,tasks:['大厅迎宾 · 秋日主题','品牌快闪 · 广告轮播'],materials:['夏季新品','开业酬宾']},
    {id:'K12',name:'接待机器人',busy:true,tasks:['展厅接待'],materials:['展厅导览路线']},
    {id:'U2',name:'导览机器人',busy:false,tasks:['贵宾厅跟随'],materials:['贵宾路线']}
  ];
  function renderLocal(){
    root.innerHTML='<p class="task-local-heading">本地任务<strong>已缓存的能力清单</strong></p>'+cache.map(d=>
      '<section class="task-group"><h2>'+esc(d.name)+' · '+d.id+'</h2>'+
      d.tasks.map(name=>'<article class="task-card"><div class="task-top"><div><h3>'+esc(name)+'</h3><p>缓存任务 · '+d.id+'</p></div><span class="status-chip '+(d.busy?'blue':'')+'">'+(d.busy?'执行中':'可执行')+'</span></div><div class="task-foot"><small>本机缓存</small><button data-local="'+d.id+'" data-name="'+esc(name)+'" '+(d.busy?'disabled':'')+'>立即下发</button></div></article>').join('')+
      '<div class="task-sub">本地素材：'+d.materials.map(esc).join('、')+'</div></section>'
    ).join('');
    root.querySelectorAll('[data-local]').forEach(button=>button.onclick=()=>{
      const d=cache.find(x=>x.id===button.dataset.local);if(!d)return;
      if(d.busy){toast(d.id+' 正在执行其他任务，已拒绝下发');return}
      d.busy=true;renderLocal();toast('已下发「'+button.dataset.name+'」至 '+d.id);
    });
  }
  local?renderLocal():renderCloud();
})();
