(()=>{
  const links=[
    ["Programme Centre","index.html"],
    ["Automator","programme-builder-v21.html"],
    ["League Table","league-table.html"],
    ["Results Matrix","results-matrix.html"],
    ["League So Far","league-so-far.html"],
    ["Photo Library","photo-library.html"],
    ["Around the League","around-the-league.html"],
    ["Planner","programme-plan.html"],
    ["Feature Slot","feature-slot.html"]
  ];
  const css=`
  .programme-global-nav{background:#111;border-bottom:3px solid #f2c400;position:sticky;top:0;z-index:1000;box-shadow:0 2px 7px rgba(0,0,0,.18)}
  .programme-global-nav .pgn-inner{max-width:1400px;margin:auto;display:flex;gap:4px;overflow-x:auto;padding:8px 14px;scrollbar-width:thin}
  .programme-global-nav a{flex:0 0 auto;color:#eee;text-decoration:none;border:1px solid #444;border-radius:7px;padding:8px 11px;font:700 12px Arial,Helvetica,sans-serif;white-space:nowrap;background:#1b1b1b}
  .programme-global-nav a:hover{border-color:#f2c400;color:#f2c400}
  .programme-global-nav a.active{background:#f2c400;color:#111;border-color:#f2c400}
  @media(max-width:650px){.programme-global-nav .pgn-inner{padding:7px 8px}.programme-global-nav a{padding:7px 9px;font-size:11px}}
  `;
  if(!document.getElementById("programme-global-nav-style")){
    const st=document.createElement("style"); st.id="programme-global-nav-style"; st.textContent=css; document.head.appendChild(st);
  }
  const current=(location.pathname.split("/").pop()||"index.html").toLowerCase();
  const nav=document.createElement("nav"); nav.className="programme-global-nav"; nav.setAttribute("aria-label","Programme Centre");
  const inner=document.createElement("div"); inner.className="pgn-inner";
  for(const [label,href] of links){
    const a=document.createElement("a"); a.href=href; a.textContent=label;
    if(current===href.toLowerCase()) a.classList.add("active");
    inner.appendChild(a);
  }
  nav.appendChild(inner);

  const app=document.getElementById("private-app");
  const scope=app||document.body;
  const header=scope.querySelector("header");
  if(header){
    const oldNav=header.querySelector("nav");
    if(oldNav) oldNav.style.display="none";
    header.insertAdjacentElement("afterend",nav);
  }else{
    scope.insertBefore(nav,scope.firstChild);
  }
})();