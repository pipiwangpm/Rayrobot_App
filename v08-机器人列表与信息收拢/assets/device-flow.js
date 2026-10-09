const Fleet = (() => {
  const data = {
    A03:{id:'A03',name:'迎宾机器人 · A03',model:'镗钯-EDU',sn:'TP-A03-202609',ip:'10.2.0.31',group:'大厅 A 区',state:'online',status:'在线 · 运行中',battery:86,hours:'4.3h',mode:'自主交互',agent:'晓雅',color:'金黄色',image:'robot-golden-yellow.webp',task:'秋日迎宾',lastSeen:'刚刚',connection:'wifi',signal:4},
    K12:{id:'K12',name:'巡检机器人 · K12',model:'巡检型',sn:'KK-12-202605',ip:'10.2.0.42',group:'巡更组',state:'online',status:'在线 · 巡检中',battery:52,hours:'2.1h',mode:'任务执行中',agent:'未绑定',color:'翡翠绿',image:'robot-emerald-green.webp',task:'展厅巡检',lastSeen:'刚刚',connection:'ap',signal:3},
    U2:{id:'U2',name:'双轮足机器人 · U2',model:'双轮足测试型',sn:'DW-U2-202607',ip:'10.2.0.53',group:'研发测试',state:'fault',status:'在线 · 故障',battery:21,hours:'1.8h',mode:'异常',agent:'阿远',color:'珍珠白',image:'robot-pearl-white.webp',task:'无运行任务',lastSeen:'刚刚',connection:'wifi',signal:1},
    D07:{id:'D07',name:'配送机器人 · D07',model:'双轮足配送型',sn:'DW-D07-202608',ip:'—',group:'未分组',state:'offline',status:'离线',battery:null,hours:'—',mode:'不可用',agent:'未绑定',color:'钴蓝色',image:'robot-cobalt-blue.webp',task:'无运行任务',lastSeen:'2026-10-07 18:26 · 演示数据',connection:null,signal:0}
  };
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const query=new URLSearchParams(location.search);
  const id=data[query.get('id')]?query.get('id'):'A03';
  const base=data[id];
  let saved={};try{saved=JSON.parse(localStorage.getItem('fleet-device-'+id)||'{}')}catch(e){}
  const device={...base,...saved};
  const href=(page,extra='')=>`${page}.html?id=${encodeURIComponent(id)}${extra}`;
  const icons={back:'<path d="m15 5-7 7 7 7"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9 7 7m10 10 2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',video:'<rect x="3" y="5" width="13" height="14" rx="3"/><path d="m16 10 5-3v10l-5-3"/>',control:'<rect x="3" y="7" width="18" height="12" rx="4"/><path d="M7 13h5m-2.5-2.5v5M16 12h.01M18 14h.01"/>',pin:'<path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z"/><circle cx="12" cy="10" r="2"/>',wifi:'<path d="M2 9a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15a5 5 0 0 1 7 0M12 19h.01"/>',ap:'<path d="M8 20h8v-6H8zM5 13a10 10 0 0 1 14 0M2 9a15 15 0 0 1 20 0"/>',power:'<path d="M12 2v9m6-6a9 9 0 1 1-12 0"/>',check:'<path d="m4 12 5 5L20 6"/>',close:'<path d="M5 5 19 19M19 5 5 19"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',link:'<path d="M10 13a5 5 0 0 0 7 .3l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7-.3l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',camera:'<rect x="3" y="5" width="18" height="15" rx="2"/><circle cx="12" cy="12.5" r="3"/>',volume:'<path d="M5 10h4l5-4v12l-5-4H5zM17 9a5 5 0 0 1 0 6"/>',more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',robot:'<rect x="4" y="7" width="16" height="13" rx="4"/><path d="M12 3v4M8 12v2M16 12v2"/>',alert:'<path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5M12 17h.01"/>',battery:'<rect x="3" y="7" width="17" height="10" rx="2"/><path d="M22 10v4M6 10h8"/>'};
  const icon=(name,size=20)=>`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.robot}</svg>`;
  function shell(title,content,right='',back='home.html'){
    document.body.innerHTML=`<div class="flow-app"><header class="flow-head"><a class="icon-button" href="${back}" aria-label="返回上一页">${icon('back')}</a><div class="head-title"><strong>${esc(title)}</strong></div>${right||`<a class="icon-button" href="home.html" aria-label="机器人列表">${icon('robot')}</a>`}</header><main class="flow-scroll">${content}</main><div id="flow-toast" class="flow-toast" role="status" hidden></div><div id="flow-modal" class="modal-wrap" hidden><div class="modal-shade"></div><div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title"><h2 id="modal-title"></h2><p id="modal-copy"></p><div class="modal-actions"><button class="button secondary" id="modal-cancel">取消</button><button class="button primary" id="modal-confirm">确认</button></div></div></div></div>`;
  }
  let toastTimer;
  function toast(message){const e=$('flow-toast');e.textContent=message;e.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.hidden=true,3000)}
  function confirmAction(title,copy,onConfirm){$('modal-title').textContent=title;$('modal-copy').textContent=copy;$('flow-modal').hidden=false;const close=()=>$('flow-modal').hidden=true;$('modal-cancel').onclick=close;$('flow-modal').querySelector('.modal-shade').onclick=close;$('modal-confirm').onclick=()=>{close();onConfirm()}}
  function save(fields){const prior=JSON.parse(localStorage.getItem('fleet-device-'+id)||'{}');localStorage.setItem('fleet-device-'+id,JSON.stringify({...prior,...fields}));Object.assign(device,fields)}
  function row(label,value){return `<div class="info-row"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`}
  function section(title,body,note=''){return `<section class="flow-section"><div class="section-head"><h2>${esc(title)}</h2>${note?`<span>${esc(note)}</span>`:''}</div>${body}</section>`}
  return {data,device,id,href,icon,esc,$,shell,toast,confirmAction,save,row,section};
})();
