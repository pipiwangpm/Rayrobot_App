/* 部署形态基础设施（v0.6.0 · 云模式 / 本地模式）
   用法：各页 <head> 引入 <script src="mode.js"></script>（与 tailwind/iconify 并列）。
   形态来源优先级：URL ?m=local|cloud > localStorage('robops.mode') > 默认 cloud（云）。
   元素约定（本文件自动处理，无需额外 JS）：
     [data-c]  仅云模式元素 —— 本地模式下隐藏
     [data-l]  仅本地模式元素 —— 非本地模式（云）下隐藏
     （底部导航"智能体"Tab 等仅云链接加 data-c 即自动隐藏）
   全局：
     window.__mode    当前形态 'cloud' | 'local'
     window.goMode(m) 切换形态并跳转（写 URL ?m= + localStorage）
   形态说明：本地模式＝内网部署形态（同一局域网段 mDNS 可达、路由器不出网），
   手动切换（P-061 连接与部署形态），不做自动切换。详见需求文档 §4.0 部署形态。 */
(function () {
    var LS = 'robops.mode';
    function cur() {
        try {
            var q = new URLSearchParams(location.search).get('m');
            if (q === 'local' || q === 'cloud') return q;
            return localStorage.getItem(LS) === 'local' ? 'local' : 'cloud';
        } catch (e) { return 'cloud'; }
    }
    var mode = cur();
    // 挂在 <html>，CSS 首屏即生效、无闪烁
    document.documentElement.dataset.mode = mode;
    var s = document.createElement('style');
    s.textContent =
        'html[data-mode="local"] [data-c]{display:none!important}' +
        'html:not([data-mode="local"]) [data-l]{display:none!important}';
    (document.head || document.documentElement).appendChild(s);
    function sync() { if (document.body) document.body.dataset.mode = mode; }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sync);
    else sync();
    window.__mode = mode;
    window.__isLocal = mode === 'local';
    window.goMode = function (m) {
        if (m !== 'local' && m !== 'cloud') m = 'cloud';
        try { localStorage.setItem(LS, m); } catch (e) { }
        var u = new URL(location.href);
        u.searchParams.set('m', m);
        location.href = u.toString();
    };
    // 本地模式下：站内导航自动携带 ?m=local，避免跳回云模式
    function keepMode() {
        if (mode !== 'local') return;
        document.querySelectorAll('a[href]').forEach(function (a) {
            var h = a.getAttribute('href');
            if (!h || h.charAt(0) === '#' || /^(https?:|mailto:|javascript:)/.test(h)) return;
            if (h.indexOf('.html') < 0) return;
            if (/(^|[?&])m=/.test(h)) return; // 已显式带形态
            a.setAttribute('href', h + (h.indexOf('?') > -1 ? '&' : '?') + 'm=local');
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', keepMode);
    else keepMode();
})();
