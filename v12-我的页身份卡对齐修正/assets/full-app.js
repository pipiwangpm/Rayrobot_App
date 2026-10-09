const AppUI=(()=>{
 const {icon,esc}=Fleet;
 const navItems=[['home.html','机器人','robot'],['agents.html','智能体','agent'],['alerts.html','消息','bell'],['task-center.html','任务','task'],['profile.html','我的','user']];
 function nav(active){return `<nav class="full-bottom-nav" aria-label="主导航">${navItems.map(([url,label,glyph])=>`<a href="${url}" class="${active===label?'active':''}" ${active===label?'aria-current="page"':''}>${icon(glyph,21)}<span>${label}</span></a>`).join('')}</nav>`}
 function page(title,content,{primary=false,active='',right='',back='profile.html'}={}){
   Fleet.shell(title,content,right||'<span class="head-spacer" aria-hidden="true"></span>',primary?'home.html':back);
   const app=document.querySelector('.flow-app');app.classList.add('full-app');
   if(primary){app.classList.add('full-primary');app.insertAdjacentHTML('beforeend',nav(active));}
 }
 function get(key,fallback){try{const value=JSON.parse(localStorage.getItem('prototype-'+key)||'null');return value??fallback}catch(e){return fallback}}
 function set(key,value){try{localStorage.setItem('prototype-'+key,JSON.stringify(value))}catch(e){}}
 return {page,nav,icon,esc,get,set,toast:Fleet.toast,confirm:Fleet.confirmAction,$:Fleet.$};
})();
