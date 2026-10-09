const AgentStore=(()=>{
const base=[
{id:'xy',name:'晓雅',glyph:'雅',role:'迎宾接待',desc:'热情、耐心的迎宾大使，主动问候并引导访客。',docs:['展厅话术.docx','迎宾FAQ.pdf'],model:'GPT-4o',voice:'晓雅',bound:3,ready:true,opening:'欢迎光临～'},
{id:'ay',name:'阿远',glyph:'远',role:'展厅讲解',desc:'专业沉稳，随行讲解展厅内容与产品卖点。',docs:['产品手册.pdf'],model:'通义千问',voice:'阿远',bound:2,ready:true,opening:'欢迎参观～'},
{id:'yf',name:'云帆',glyph:'帆',role:'通用助手',desc:'稳重周到的通用助手，处理日常咨询。',docs:['通用话术.docx'],model:'DeepSeek-V3',voice:'默认音色',bound:0,ready:true,opening:null},
{id:'dd',name:'点点',glyph:'点',role:'儿童互动',desc:'俏皮温柔，擅长与儿童游戏互动。',docs:[],model:null,voice:null,bound:0,ready:false,opening:null}];
function all(){let saved=[];try{saved=JSON.parse(localStorage.getItem('prototype-agents')||'[]');if(!Array.isArray(saved))saved=[]}catch(e){}const overrides=new Map(saved.filter(a=>a&&a.id).map(a=>[a.id,a]));return [...saved.filter(a=>a&&a.id&&!base.some(b=>b.id===a.id)),...base.map(a=>({...a,...overrides.get(a.id)}))]}
function get(id){return all().find(a=>a.id===id)||null}
return {all,get};})();
