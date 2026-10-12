const TaskCreate=(()=>{
  const {page,toast,esc,icon}=AppUI;
  const local=(()=>{try{return new URLSearchParams(location.search).get('m')==='local'||localStorage.getItem('robops.mode')==='local'}catch(_){return false}})();
  const back='task-center.html'+(local?'?m=local':'');
  const types={script:['脚本任务','选择脚本，为虚拟角色分配机器人','file'],ad:['广告任务','按机器人配置素材与播放顺序','video'],follow:['跟随任务','指定跟随对象、策略和机器队列','pin'],voice:['口播任务','输入文案，选择音色与播报设备','volume']};
  let step=1,done=false,result=null;
  const state={type:null,name:'',script:'welcome',roles:{},ads:[],playlists:{},followTarget:'',strategy:'贴身跟随 ~1.5m',queue:[],voiceText:'',voice:'默认音色',repeat:1,voiceRobots:[],localRobot:'A03',localItems:[]};
  const cache={
    A03:{busy:false,tasks:['大厅迎宾 · 秋日主题','品牌快闪 · 广告轮播'],materials:['夏季新品 · 15s','开业酬宾 · 20s']},
    K12:{busy:true,tasks:['展厅接待'],materials:['展厅导览路线']},
    U2:{busy:false,tasks:['贵宾厅跟随'],materials:['贵宾路线']}
  };
  function button(label,action,kind){return '<button class="button '+(kind||'secondary')+'" data-act="'+action+'">'+label+'</button>'}
  function choices(items,selected,action,disabled){
    return items.map(item=>{
      const id=typeof item==='string'?item:item.id;
      const label=typeof item==='string'?item:item.name;
      const off=disabled&&disabled(item);
      const on=selected.includes(id);
      const sub=typeof item==='string'?'':typeof item.online==='boolean'?'<small>'+id+(item.online?' · 在线':' · 离线')+'</small>':'<small>'+id+' · '+(item.roles||[]).length+' 个虚拟角色</small>';
      return '<button type="button" class="task-check '+(on?'active ':'')+(off?'disabled':'')+'" data-act="'+action+'" data-value="'+esc(id)+'" '+(off?'disabled':'')+'><span class="checkmark">'+(on?'✓':'')+'</span><span class="label"><strong>'+esc(label)+'</strong>'+sub+'</span></button>';
    }).join('');
  }
  function section(title,body){return '<section class="task-panel"><h2>'+title+'</h2>'+body+'</section>'}
  function heading(){
    return '<div class="task-steps">'+[1,2,3].map(i=>'<span class="'+(i<=step?'done':'')+'"></span>').join('')+'</div><p class="task-step-caption">第 '+step+' / 3 步</p>';
  }
  function typePage(){
    return heading()+'<div class="task-pane"><h1>选择任务类型</h1>'+
      Object.keys(types).map(key=>{const x=types[key];return '<button class="task-option '+(state.type===key?'active':'')+'" data-act="type" data-value="'+key+'">'+icon(x[2],25)+'<span><strong>'+x[0]+'</strong><small>'+x[1]+'</small></span></button>'}).join('')+
      '<div class="task-actions">'+button('下一步','next','primary')+'</div></div>';
  }
  function scriptPage(){
    const selected=TaskFlow.scripts.find(s=>s.id===state.script)||TaskFlow.scripts[0];
    let html=section('选择脚本',choices(TaskFlow.scripts,[state.script],'script'));
    html+=selected.roles.map(role=>{
      const list=state.roles[role]||[];
      const rows=TaskFlow.robots.map(robot=>{
        const owner=Object.keys(state.roles).find(k=>k!==role&&(state.roles[k]||[]).includes(robot.id));
        const on=list.includes(robot.id),off=!robot.online;
        return '<button type="button" class="task-check '+(on?'active ':'')+(off?'disabled':'')+'" data-act="role" data-role="'+esc(role)+'" data-value="'+robot.id+'" '+(off?'disabled':'')+'><span class="checkmark">'+(on?'✓':'')+'</span><span class="label"><strong>'+esc(robot.name)+'</strong><small>'+(owner?'已分配给'+esc(owner)+' · 点击改派':robot.online?'在线 · 可分配':'离线 · 不可分配')+'</small></span></button>';
      }).join('');
      return section(esc(role)+' <small style="color:#8ea0a6;font-size:11px">已分配 '+list.length+' 台</small>',rows);
    }).join('');
    return html;
  }
  function adPage(){
    let html=section('投放机器',choices(TaskFlow.robots,state.ads,'adRobot',r=>!r.online));
    state.ads.forEach(id=>{
      const playlist=state.playlists[id]||[];
      const robot=TaskFlow.robots.find(r=>r.id===id);
      let rows=playlist.map((m,index)=>
        '<div class="task-inline"><strong>'+(index+1)+'. '+esc(m)+'</strong><span><button data-act="adUp" data-robot="'+id+'" data-index="'+index+'" '+(index===0?'disabled':'')+' aria-label="上移">↑</button> <button data-act="adDown" data-robot="'+id+'" data-index="'+index+'" '+(index===playlist.length-1?'disabled':'')+' aria-label="下移">↓</button> <button data-act="adRemove" data-robot="'+id+'" data-index="'+index+'" aria-label="移除">×</button></span></div>'
      ).join('');
      rows+=choices(TaskFlow.materials.filter(m=>!playlist.includes(m)),[],'adAdd').replaceAll('data-act="adAdd"','data-act="adAdd" data-robot="'+id+'"');
      html+=section(esc(robot.name)+' · 播放顺序',rows||'<p>请选择至少一支素材。</p>');
    });
    return html;
  }
  function followPage(){
    let html=section('跟随对象',choices(['固定引导员（UWB 工牌）','指定访客（定位标签）','编队行进'],[state.followTarget],'followTarget'));
    html+=section('跟随策略',choices(['贴身跟随 ~1.5m','巡航跟随 ~3m','侧后方跟随'],[state.strategy],'strategy'));
    html+=section('机器队列',choices(TaskFlow.robots,state.queue,'queue',r=>!r.online)+
      '<div class="task-queue">'+state.queue.map((id,index)=>{
        const robot=TaskFlow.robots.find(r=>r.id===id);
        return '<div class="task-inline"><strong>第 '+(index+1)+' 台'+(index===0?'（领队）':'')+' · '+esc(robot.name)+'</strong><span><button data-act="followUp" data-index="'+index+'" '+(index===0?'disabled':'')+' aria-label="上移">↑</button> <button data-act="followDown" data-index="'+index+'" '+(index===state.queue.length-1?'disabled':'')+' aria-label="下移">↓</button></span></div>';
      }).join('')+'</div>');
    return html;
  }
  function voicePage(){
    return section('口播内容','<label class="task-field"><span>播报文字</span><textarea id="voiceText" maxlength="200" placeholder="请输入播报内容">'+esc(state.voiceText)+'</textarea></label><p id="voiceCount">'+state.voiceText.trim().length+' / 200 字 · 约 '+Math.max(1,Math.ceil(state.voiceText.trim().length/4))+' 秒</p>')+
      section('音色',choices(['默认音色','声纹 · 晓雅','声纹 · 阿远'],[state.voice],'voice'))+
      section('播报次数',choices(['1','3','5'],[String(state.repeat)],'repeat'))+
      section('播报机器人',choices(TaskFlow.robots,state.voiceRobots,'voiceRobot',r=>!r.online));
  }
  function configPage(){
    let content=heading()+'<div class="task-pane"><h1>'+types[state.type][0]+'配置</h1>'+
      '<label class="task-field"><span>任务名称</span><input id="taskName" maxlength="30" placeholder="请输入任务名称" value="'+esc(state.name)+'"></label>';
    content+=state.type==='script'?scriptPage():state.type==='ad'?adPage():state.type==='follow'?followPage():voicePage();
    content+='<div class="task-actions">'+button('上一步','back')+button('下一步','next','primary')+'</div></div>';
    return content;
  }
  function summaryRow(label,value){return '<div class="task-summary-row"><span>'+label+'</span><strong>'+esc(value)+'</strong></div>'}
  function targets(){
    if(state.type==='script')return [...new Set(Object.values(state.roles).flat())];
    if(state.type==='ad')return state.ads.slice();
    if(state.type==='follow')return state.queue.slice();
    return state.voiceRobots.slice();
  }
  function summary(){
    let html=summaryRow('任务类型',types[state.type][0])+summaryRow('任务名称',state.name);
    if(state.type==='script'){
      const script=TaskFlow.scripts.find(s=>s.id===state.script);
      html+=summaryRow('执行脚本',script.name);
      html+=script.roles.map(role=>summaryRow(role,(state.roles[role]||[]).join('、')||'未绑定（跳过）')).join('');
    } else if(state.type==='ad'){
      html+=state.ads.map(id=>summaryRow(id,(state.playlists[id]||[]).join(' → '))).join('');
    } else if(state.type==='follow'){
      html+=summaryRow('跟随对象',state.followTarget)+summaryRow('跟随策略',state.strategy)+summaryRow('机器队列',state.queue.join(' → '));
    } else {
      html+=summaryRow('口播文字',state.voiceText)+summaryRow('音色 / 次数',state.voice+' · '+state.repeat+' 次')+summaryRow('播报机器人',state.voiceRobots.join('、'));
    }
    return html;
  }
  function finalPage(){
    return heading()+'<div class="task-pane"><h1>确认并下发</h1>'+section('执行摘要',summary())+
      section('下发方式','<p>提交后立即检查机器人状态。机器人占用或离线时，本次执行会被拒绝并记录原因。</p>')+
      '<div class="task-actions">'+button('上一步','back')+button('立即下发','submit','primary')+'</div></div>';
  }
  function successPage(){
    return '<div class="task-result"><div class="empty-mark">'+icon(result.status==='失败'?'alert':'check',34)+'</div><h2>'+(result.status==='失败'?'下发被拒绝':'已开始执行')+'</h2><p>'+esc(result.note)+'</p><a class="button primary block" href="'+back+'">查看任务与执行记录</a></div>';
  }
  function localPage(){
    const data=cache[state.localRobot],items=[...data.tasks,...data.materials];
    return '<div class="task-pane"><p class="task-step-caption">本地模式</p><h1>本地任务</h1>'+
      section('选择机器人',choices(Object.keys(cache).map(id=>({id,name:TaskFlow.robots.find(r=>r.id===id).name,online:!cache[id].busy})),[state.localRobot],'localRobot'))+
      section('选择本机缓存内容',choices(items,state.localItems,'localItem'))+
      '<div class="task-actions">'+button('立即下发','localSubmit','primary')+'</div></div>';
  }
  function render(keepScroll){
    const top=keepScroll?document.querySelector('.flow-scroll')?.scrollTop||0:0;
    page('新建任务',done?successPage():local?localPage():step===1?typePage():step===2?configPage():finalPage(),{back});
    const scroll=document.querySelector('.flow-scroll');if(scroll)scroll.scrollTop=top;
    scroll.addEventListener('click',handleClick);
    const name=document.getElementById('taskName');if(name)name.addEventListener('input',e=>state.name=e.target.value);
    const voice=document.getElementById('voiceText');if(voice)voice.addEventListener('input',e=>{
      state.voiceText=e.target.value;
      document.getElementById('voiceCount').textContent=state.voiceText.trim().length+' / 200 字 · 约 '+Math.max(1,Math.ceil(state.voiceText.trim().length/4))+' 秒';
    });
  }
  function toggle(list,value){const i=list.indexOf(value);i<0?list.push(value):list.splice(i,1)}
  function move(list,index,delta){const other=index+delta;if(other<0||other>=list.length)return;[list[index],list[other]]=[list[other],list[index]]}
  function validate(){
    if(!state.name.trim()){toast('请输入任务名称');return false}
    if(state.type==='script'&&!targets().length){toast('请至少为一个虚拟角色分配机器人');return false}
    if(state.type==='ad'&&(!state.ads.length||state.ads.some(id=>!(state.playlists[id]||[]).length))){toast('请为每台投放机器人配置素材');return false}
    if(state.type==='follow'&&(!state.followTarget||!state.queue.length)){toast('请选择跟随对象和机器人');return false}
    if(state.type==='voice'&&(!state.voiceText.trim()||!state.voiceRobots.length)){toast('请输入播报文字并选择机器人');return false}
    return true;
  }
  function submit(){
    if(!validate())return;
    const robots=targets(),name=state.name.trim();
    const note=state.type==='script'?TaskFlow.scripts.find(s=>s.id===state.script).name+' · '+robots.join('、'):
      state.type==='ad'?'每台一组素材 · 按序循环':
      state.type==='follow'?state.followTarget+' · '+state.strategy:
      state.voice+' · '+state.voiceText.trim().length+' 字';
    const task={id:'new-'+Date.now(),name,type:{script:'脚本',ad:'广告',follow:'跟随',voice:'口播'}[state.type],robots,note,config:JSON.parse(JSON.stringify(state)),runs:[]};
    const tasks=TaskFlow.load();tasks.unshift(task);result=TaskFlow.dispatch(task,tasks);done=true;render(false);
  }
  function handleClick(event){
    const el=event.target.closest('[data-act]');if(!el)return;
    const action=el.dataset.act,value=el.dataset.value,index=Number(el.dataset.index),robot=el.dataset.robot;
    if(action==='type'){state.type=value;if(!state.name)state.name={script:'迎宾导览',ad:'广告轮播',follow:'跟随引导',voice:'语音播报'}[value];}
    else if(action==='script'){state.script=value;state.roles={}}
    else if(action==='role'){
      const role=el.dataset.role;
      const current=state.roles[role]||[];
      if(current.includes(value))state.roles[role]=current.filter(x=>x!==value);
      else {
        Object.keys(state.roles).forEach(k=>state.roles[k]=state.roles[k].filter(x=>x!==value));
        state.roles[role]=current.concat(value);
      }
    }
    else if(action==='adRobot'){toggle(state.ads,value);if(!state.playlists[value])state.playlists[value]=[]}
    else if(action==='adAdd'){state.playlists[robot].push(value)}
    else if(action==='adRemove'){state.playlists[robot].splice(index,1)}
    else if(action==='adUp'||action==='adDown'){move(state.playlists[robot],index,action==='adUp'?-1:1)}
    else if(action==='followTarget')state.followTarget=value;
    else if(action==='strategy')state.strategy=value;
    else if(action==='queue')toggle(state.queue,value);
    else if(action==='followUp'||action==='followDown')move(state.queue,index,action==='followUp'?-1:1);
    else if(action==='voice')state.voice=value;
    else if(action==='repeat')state.repeat=Number(value);
    else if(action==='voiceRobot')toggle(state.voiceRobots,value);
    else if(action==='localRobot'){state.localRobot=value;state.localItems=[]}
    else if(action==='localItem')toggle(state.localItems,value);
    else if(action==='localSubmit'){
      const data=cache[state.localRobot];
      if(!state.localItems.length){toast('请至少选择一项缓存内容');return}
      result={status:data.busy?'失败':'执行中',note:data.busy?state.localRobot+' 正在执行其他任务，已拒绝下发':state.localRobot+' 已开始执行 '+state.localItems.length+' 项缓存内容'};
      if(!data.busy)data.busy=true;done=true;render(false);return;
    }
    else if(action==='next'){
      if(step===1&&!state.type){toast('请先选择任务类型');return}
      if(step===2&&!validate())return;
      step=Math.min(3,step+1);render(false);return;
    }
    else if(action==='back'){step=Math.max(1,step-1);render(false);return}
    else if(action==='submit'){submit();return}
    render(true);
  }
  render(false);
})();
