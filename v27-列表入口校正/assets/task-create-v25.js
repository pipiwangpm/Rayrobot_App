const TaskCreate=(()=>{
  const {page,toast,esc,icon}=AppUI;
  const local=(()=>{try{return new URLSearchParams(location.search).get('m')==='local'||localStorage.getItem('robops.mode')==='local'}catch(_){return false}})();
  const back='task-center.html'+(local?'?m=local':'');
  const types={script:['脚本任务','选择脚本，为虚拟角色分配机器人','file'],ad:['广告任务','按机器人配置素材与播放顺序','video'],follow:['跟随任务','指定跟随对象、策略和机器队列','pin'],voice:['口播任务','输入文案，选择音色与播报设备','volume']};
  let step=1,done=false,result=null,picker=null,mediaEditor=null,dragFrom=null;
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
  function robotName(id){return TaskFlow.robots.find(robot=>robot.id===id)?.name||id}
  function robotSelection(ids,kind,role){
    const title=kind==='role'?'分配机器人':kind==='ad'?'选择投放机器人':kind==='follow'?'选择跟随机器人':kind==='voice'?'选择播报机器人':'选择机器人';
    return '<div class="task-robot-selection"><div class="task-selected-robots">'+
      (ids.length?ids.map(id=>'<span>'+esc(robotName(id))+'</span>').join(''):'<small>尚未选择机器人</small>')+
      '</div><button type="button" class="task-select-trigger" data-act="openPicker" data-kind="'+kind+'"'+(role?' data-role="'+esc(role)+'"':'')+'>'+title+' · '+ids.length+' 台 ＋</button></div>';
  }
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
      return section(esc(role)+' <small class="task-panel-count">已分配 '+list.length+' 台</small>',robotSelection(list,'role',role));
    }).join('');
    return html;
  }
  function adPage(){
    let html=section('投放机器人',robotSelection(state.ads,'ad')+
      '<button type="button" class="task-batch-config" data-act="mediaOpenAll" '+(state.ads.length?'':'disabled')+'>统一配置播放资源<span>应用到已选择的 '+state.ads.length+' 台机器人</span></button>');
    state.ads.forEach(id=>{
      const playlist=state.playlists[id]||[];
      const list=playlist.length?playlist.map((m,index)=>'<div class="task-playback-row"><b>'+(index+1)+'</b><span>'+esc(m)+'</span></div>').join(''):'<p class="task-playback-empty">尚未配置播放资源</p>';
      html+=section(esc(robotName(id))+' · 播放资源',list+
        '<button type="button" class="task-outline-action" data-act="mediaOpenOne" data-robot="'+id+'">'+(playlist.length?'单独调整资源':'单独配置资源')+' →</button>');
    });
    return html;
  }
  function followPage(){
    let html=section('跟随对象',choices(['固定引导员（UWB 工牌）','指定访客（定位标签）','编队行进'],[state.followTarget],'followTarget'));
    html+=section('跟随策略',choices(['贴身跟随 ~1.5m','巡航跟随 ~3m','侧后方跟随'],[state.strategy],'strategy'));
    html+=section('机器队列',robotSelection(state.queue,'follow')+
      '<p class="task-sort-hint">按住右侧手柄拖动，调整机器人跟随顺序。</p>'+
      '<div class="task-sort-list">'+state.queue.map((id,index)=>
        '<div class="task-sort-row" data-sort-kind="queue" data-index="'+index+'" draggable="true"><b>'+(index+1)+'</b><span>'+esc(robotName(id))+(index===0?'<small>领队</small>':'')+'</span><span class="task-drag-handle" role="button" tabindex="0" aria-label="拖动'+esc(robotName(id))+'调整顺序">⋮⋮</span></div>'
      ).join('')+'</div>');
    return html;
  }
  function voicePage(){
    return section('口播内容','<label class="task-field"><span>播报文字</span><textarea id="voiceText" maxlength="200" placeholder="请输入播报内容">'+esc(state.voiceText)+'</textarea></label><p id="voiceCount">'+state.voiceText.trim().length+' / 200 字 · 约 '+Math.max(1,Math.ceil(state.voiceText.trim().length/4))+' 秒</p>')+
      section('播报设置','<label class="task-field"><span>音色</span><select id="voiceChoice">'+['默认音色','声纹 · 晓雅','声纹 · 阿远'].map(x=>'<option '+(state.voice===x?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select></label>'+
        '<label class="task-field"><span>播报次数</span><select id="repeatChoice">'+[1,3,5].map(n=>'<option value="'+n+'" '+(state.repeat===n?'selected':'')+'>'+n+' 次</option>').join('')+'</select></label>')+
      section('播报机器人',robotSelection(state.voiceRobots,'voice'));
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
      section('选择机器人',robotSelection([state.localRobot],'local'))+
      section('选择本机缓存内容',choices(items,state.localItems,'localItem'))+
      '<div class="task-actions">'+button('立即下发','localSubmit','primary')+'</div></div>';
  }
  function pickerHtml(){
    const groups=['全部',...new Set(TaskFlow.robots.map(robot=>robot.group))];
    const visible=TaskFlow.robots.filter(robot=>picker.group==='全部'||robot.group===picker.group);
    const single=picker.kind==='local';
    return '<div class="task-sheet-backdrop" data-act="sheetBackdrop"><section class="task-sheet" role="dialog" aria-modal="true" aria-label="选择机器人">'+
      '<div class="task-sheet-handle"></div><div class="task-sheet-head"><div><h2>选择机器人</h2><p>已选 '+picker.selected.size+' 台 · 可按分组选择</p></div><button data-act="pickerClose" aria-label="关闭">×</button></div>'+
      '<div class="task-picker-groups">'+groups.map(group=>
        '<button data-act="pickerGroup" data-value="'+esc(group)+'" class="'+(group===picker.group?'active':'')+'">'+esc(group)+' <small>'+TaskFlow.robots.filter(robot=>group==='全部'||robot.group===group).length+'</small></button>'
      ).join('')+'</div>'+
      (single?'':'<div class="task-picker-tools"><span>'+esc(picker.group)+' · '+visible.length+' 台</span><button data-act="pickerSelectGroup">选择本组可用机器人</button><button data-act="pickerClearGroup">取消本组</button></div>')+
      '<div class="task-picker-list">'+visible.map(robot=>{
        const selected=picker.selected.has(robot.id),unavailable=!robot.online||(single&&!cache[robot.id]);
        const owner=picker.kind==='role'?Object.keys(state.roles).find(role=>role!==picker.role&&(state.roles[role]||[]).includes(robot.id)):null;
        return '<button class="task-picker-robot '+(selected?'selected ':'')+(unavailable?'disabled':'')+'" data-act="pickerToggle" data-value="'+robot.id+'" '+(unavailable?'disabled':'')+'><span class="checkmark">'+(selected?'✓':'')+'</span><span><strong>'+esc(robot.name)+'</strong><small>'+esc(robot.group)+' · '+(unavailable?'离线或不可用':owner?'已分配'+esc(owner)+'，选择后改派':'在线')+'</small></span></button>';
      }).join('')+'</div>'+
      '<div class="task-sheet-footer"><button class="button secondary" data-act="pickerClose">取消</button><button class="button primary" data-act="pickerApply">确定 · '+picker.selected.size+' 台</button></div>'+
      '</section></div>';
  }
  function mediaHtml(){
    const list=mediaEditor.playlist;
    return '<div class="task-sheet-backdrop" data-act="sheetBackdrop"><section class="task-sheet" role="dialog" aria-modal="true" aria-label="配置播放资源">'+
      '<div class="task-sheet-handle"></div><div class="task-sheet-head"><div><h2>'+(mediaEditor.batch?'统一配置播放资源':'单独配置播放资源')+'</h2><p>应用到 '+mediaEditor.targets.map(esc).join('、')+'</p></div><button data-act="mediaClose" aria-label="关闭">×</button></div>'+
      (mediaEditor.mixed?'<p class="task-media-warning">所选机器原有资源不同，保存后会统一替换。</p>':'')+
      '<div class="task-sheet-scroll"><h3>播放顺序</h3><p class="task-sort-hint">按住右侧手柄拖动，调整播放顺序。</p>'+
      '<div class="task-sort-list">'+(list.length?list.map((name,index)=>
        '<div class="task-sort-row" data-sort-kind="media" data-index="'+index+'" draggable="true"><b>'+(index+1)+'</b><span>'+esc(name)+'</span><span class="task-drag-handle" role="button" tabindex="0" aria-label="拖动'+esc(name)+'调整顺序">⋮⋮</span><button data-act="mediaRemove" data-index="'+index+'" aria-label="移除'+esc(name)+'">×</button></div>'
      ).join(''):'<p class="task-playback-empty">尚未添加播放资源</p>')+'</div>'+
      '<h3>添加资源</h3>'+TaskFlow.materials.map(name=>
        '<button class="task-media-choice" data-act="mediaAdd" data-value="'+esc(name)+'" '+(list.includes(name)?'disabled':'')+'><span>'+esc(name)+'</span><b>'+(list.includes(name)?'已添加':'＋ 添加')+'</b></button>'
      ).join('')+'</div>'+
      '<div class="task-sheet-footer"><button class="button secondary" data-act="mediaClose">取消</button><button class="button primary" data-act="mediaApply">保存资源顺序</button></div>'+
      '</section></div>';
  }
  function openPicker(kind,role){
    const initial=kind==='role'?(state.roles[role]||[]):kind==='ad'?state.ads:kind==='follow'?state.queue:kind==='voice'?state.voiceRobots:[state.localRobot];
    picker={kind,role,group:'全部',selected:new Set(initial)};
  }
  function applyPicker(){
    const selected=[...picker.selected];
    if(picker.kind==='role'){
      Object.keys(state.roles).forEach(role=>{if(role!==picker.role)state.roles[role]=state.roles[role].filter(id=>!picker.selected.has(id))});
      state.roles[picker.role]=selected;
    } else if(picker.kind==='ad'){
      state.ads=selected;
      selected.forEach(id=>{if(!state.playlists[id])state.playlists[id]=[]});
    } else if(picker.kind==='follow'){
      state.queue=state.queue.filter(id=>picker.selected.has(id)).concat(selected.filter(id=>!state.queue.includes(id)));
    } else if(picker.kind==='voice')state.voiceRobots=selected;
    else if(selected.length&&selected[0]!==state.localRobot){state.localRobot=selected[0];state.localItems=[]}
    picker=null;
  }
  function openMedia(targets,batch){
    const first=(state.playlists[targets[0]]||[]).slice();
    const mixed=targets.some(id=>JSON.stringify(state.playlists[id]||[])!==JSON.stringify(first));
    mediaEditor={targets,playlist:mixed?[]:first,mixed,batch};
  }
  function reorder(kind,from,to){
    const list=kind==='queue'?state.queue:mediaEditor?.playlist;
    if(!list||from<0||to<0||from>=list.length||to>=list.length||from===to)return;
    const item=list.splice(from,1)[0];list.splice(to,0,item);render(true);
  }
  function attachSort(){
    const rows=[...document.querySelectorAll('.task-sort-row')];
    rows.forEach(row=>{
      row.addEventListener('dragstart',event=>{
        dragFrom={kind:row.dataset.sortKind,index:Number(row.dataset.index)};
        event.dataTransfer.effectAllowed='move';
        event.dataTransfer.setData('text/plain',String(dragFrom.index));
        row.classList.add('dragging');
      });
      row.addEventListener('dragover',event=>{
        if(!dragFrom||dragFrom.kind!==row.dataset.sortKind)return;
        event.preventDefault();event.dataTransfer.dropEffect='move';
        rows.forEach(item=>item.classList.remove('drop-target'));row.classList.add('drop-target');
      });
      row.addEventListener('drop',event=>{
        event.preventDefault();if(!dragFrom)return;
        const from=dragFrom;dragFrom=null;reorder(from.kind,from.index,Number(row.dataset.index));
      });
      row.addEventListener('dragend',()=>{dragFrom=null;rows.forEach(item=>item.classList.remove('drop-target','dragging'))});
      const handle=row.querySelector('.task-drag-handle');
      handle.addEventListener('keydown',event=>{
        const delta=event.key==='ArrowUp'?-1:event.key==='ArrowDown'?1:0;
        if(!delta)return;event.preventDefault();reorder(row.dataset.sortKind,Number(row.dataset.index),Number(row.dataset.index)+delta);
      });
      let touchFrom=null,touchTo=null;
      handle.addEventListener('pointerdown',event=>{
        if(event.pointerType==='mouse')return;
        event.preventDefault();touchFrom=Number(row.dataset.index);touchTo=touchFrom;handle.setPointerCapture(event.pointerId);row.classList.add('dragging');
      });
      handle.addEventListener('pointermove',event=>{
        if(touchFrom===null)return;
        const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('.task-sort-row');
        if(!target||target.dataset.sortKind!==row.dataset.sortKind)return;
        touchTo=Number(target.dataset.index);
        rows.forEach(item=>item.classList.remove('drop-target'));target.classList.add('drop-target');
      });
      handle.addEventListener('pointerup',()=>{
        if(touchFrom===null)return;
        const from=touchFrom,to=touchTo;touchFrom=null;touchTo=null;reorder(row.dataset.sortKind,from,to);
        rows.forEach(item=>item.classList.remove('drop-target','dragging'));
      });
      handle.addEventListener('pointercancel',()=>{touchFrom=null;touchTo=null;rows.forEach(item=>item.classList.remove('drop-target','dragging'))});
    });
  }
  function render(keepScroll){
    const top=keepScroll?document.querySelector('.flow-scroll')?.scrollTop||0:0;
    const sheetTop=keepScroll?document.querySelector('.task-sheet-scroll')?.scrollTop||0:0;
    page('新建任务',done?successPage():local?localPage():step===1?typePage():step===2?configPage():finalPage(),{back});
    const scroll=document.querySelector('.flow-scroll');if(scroll)scroll.scrollTop=top;
    const app=document.querySelector('.flow-app');
    if(picker||mediaEditor)app.insertAdjacentHTML('beforeend',picker?pickerHtml():mediaHtml());
    const sheetScroll=document.querySelector('.task-sheet-scroll');if(sheetScroll)sheetScroll.scrollTop=sheetTop;
    app.addEventListener('click',handleClick);
    app.addEventListener('change',event=>{
      if(event.target.id==='voiceChoice')state.voice=event.target.value;
      if(event.target.id==='repeatChoice')state.repeat=Number(event.target.value);
    });
    const name=document.getElementById('taskName');if(name)name.addEventListener('input',e=>state.name=e.target.value);
    const voice=document.getElementById('voiceText');if(voice)voice.addEventListener('input',e=>{
      state.voiceText=e.target.value;
      document.getElementById('voiceCount').textContent=state.voiceText.trim().length+' / 200 字 · 约 '+Math.max(1,Math.ceil(state.voiceText.trim().length/4))+' 秒';
    });
    attachSort();
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
    if(action==='sheetBackdrop'){
      if(event.target!==el)return;
      picker=null;mediaEditor=null;render(true);return;
    }
    if(action==='openPicker'){openPicker(el.dataset.kind,el.dataset.role);render(true);return}
    if(action==='pickerClose'){picker=null;render(true);return}
    if(action==='pickerGroup'){picker.group=value;render(true);return}
    if(action==='pickerToggle'){
      if(picker.kind==='local')picker.selected.clear();
      if(picker.selected.has(value))picker.selected.delete(value);else picker.selected.add(value);
      render(true);return;
    }
    if(action==='pickerSelectGroup'){
      TaskFlow.robots.filter(item=>(picker.group==='全部'||item.group===picker.group)&&item.online&&(picker.kind!=='local'||cache[item.id])).forEach(item=>picker.selected.add(item.id));
      render(true);return;
    }
    if(action==='pickerClearGroup'){
      TaskFlow.robots.filter(item=>picker.group==='全部'||item.group===picker.group).forEach(item=>picker.selected.delete(item.id));
      render(true);return;
    }
    if(action==='pickerApply'){
      if(picker.kind==='local'&&!picker.selected.size){toast('请选择一台机器人');return}
      applyPicker();render(true);return;
    }
    if(action==='mediaOpenAll'){if(state.ads.length){openMedia(state.ads.slice(),true);render(true)}return}
    if(action==='mediaOpenOne'){openMedia([robot],false);render(true);return}
    if(action==='mediaClose'){mediaEditor=null;render(true);return}
    if(action==='mediaAdd'){if(!mediaEditor.playlist.includes(value))mediaEditor.playlist.push(value);render(true);return}
    if(action==='mediaRemove'){mediaEditor.playlist.splice(index,1);render(true);return}
    if(action==='mediaApply'){
      mediaEditor.targets.forEach(id=>state.playlists[id]=mediaEditor.playlist.slice());
      mediaEditor=null;render(true);return;
    }
    if(action==='type'){state.type=value;if(!state.name)state.name={script:'迎宾导览',ad:'广告轮播',follow:'跟随引导',voice:'语音播报'}[value];}
    else if(action==='script'){state.script=value;state.roles={}}
    else if(action==='followTarget')state.followTarget=value;
    else if(action==='strategy')state.strategy=value;
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
