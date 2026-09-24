// =====================================================
// HYPERS CLIENT — configuração principal
// Troque o link abaixo quando sair uma versão nova.
// =====================================================
const DOWNLOAD_URL = "https://github.com/vnzinhypers-prog/vnzinhypers-prog.github.io/releases/download/v3.11.5/HypersClient-Setup.exe";
const DISCORD_INVITE = "https://discord.gg/SZxEGgQyJ2";
const GUILD_ID = "1538389920215728161";
const RELEASES_API = "https://api.github.com/repos/vnzinhypers-prog/vnzinhypers-prog.github.io/releases";
const NEWS_URL = "https://vnzinhypers-prog.github.io/news.html";
const BADGES_URL = "https://vnzinhypers-prog.github.io/badges.json";

function fmtNum(n) {
  return n >= 1000 ? (n / 1000).toFixed(1).replace(".", ",").replace(",0", "") + " mil" : String(n);
}
function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }); }
  catch (e) { return iso; }
}
function fmtSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return bytes + " B";
  const u = ["KB", "MB", "GB"];
  let v = bytes / 1024, i = 0;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return v.toFixed(1).replace(".", ",") + " " + u[i];
}

document.addEventListener("DOMContentLoaded", () => {
  // ---- Menu mobile ----
  const burger = document.getElementById("hamburger");
  const nav = document.getElementById("mainnav");
  if (burger && nav) burger.addEventListener("click", () => nav.classList.toggle("open"));

  // ---- Todos os botões de download apontam para DOWNLOAD_URL ----
  document.querySelectorAll("[data-download]").forEach(a => { a.href = DOWNLOAD_URL; });

  // ---- Online agora: jogadores com o client aberto (tempo real) ----
  const onlineEl = document.getElementById("online-count");
  const onlineWrap = document.getElementById("online-wrap");
  function setOnline(n) {
    if (onlineEl) onlineEl.textContent = n;
  }
  function hideOnline() {
    if (onlineWrap) onlineWrap.style.display = "none";
  }
  async function refreshOnline() {
    if (!onlineEl) return;
    // 1) Tenta a API do client (quem está jogando agora).
    try {
      const r = await fetch("https://hypersclient-api.vercel.app/api/online", { cache: "no-store" });
      if (r.ok) {
        const d = await r.json();
        const list = Array.isArray(d) ? d : (d.players || d.online || []);
        if (Array.isArray(list)) {
          const now = Date.now();
          const fresh = list.filter(p => {
            const seen = p.lastSeen || p.last_seen || p.joined || 0;
            return now - seen < 90000;
          }).length;
          setOnline(fresh);
          return;
        }
      }
      throw 0;
    } catch (e) {
      // 2) Cai para o Discord.
      try {
        const r2 = await fetch("https://discord.com/api/guilds/" + GUILD_ID + "/widget.json");
        const d2 = await r2.json();
        if (typeof d2.presence_count === "number") {
          setOnline(d2.presence_count);
          return;
        }
      } catch (e2) {}
      hideOnline();
    }
  }
  if (onlineEl) {
    refreshOnline();
    setInterval(refreshOnline, 30000);
  }

  // ---- Downloads (soma download_count dos assets) ----
  const dlEls = document.querySelectorAll("[data-downloads]");
  if (dlEls.length) {
    fetch(RELEASES_API)
      .then(r => { if (!r.ok) throw 0; return r.json(); })
      .then(rels => {
        let total = 0;
        (Array.isArray(rels) ? rels : []).forEach(r => {
          (r.assets || []).forEach(a => { total += (a.download_count || 0); });
        });
        const label = total > 0 ? fmtNum(total) : "10.000+";
        dlEls.forEach(el => el.textContent = label);
        renderVersions(rels);
      })
      .catch(() => {
        dlEls.forEach(el => el.textContent = "10.000+");
        renderVersions(null);
      });
  }

  // ---- Novidades (extrai <article> de news.html) ----
  const newsGrid = document.getElementById("news-grid");
  if (newsGrid) {
    fetch(NEWS_URL)
      .then(r => { if (!r.ok) throw 0; return r.text(); })
      .then(html => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const articles = Array.from(doc.querySelectorAll("article")).slice(0, 3);
        if (!articles.length) throw 0;
        newsGrid.innerHTML = "";
        articles.forEach(a => {
          const title = (a.querySelector("h1,h2,h3") || {}).textContent || "Novidade Hypers";
          const time = a.querySelector("time");
          const date = time ? (time.getAttribute("datetime") || time.textContent) : "";
          const p = a.querySelector("p");
          const text = p ? p.textContent.trim().slice(0, 140) + (p.textContent.trim().length > 140 ? "…" : "") : "Confira a novidade completa no portal de notícias.";
          const link = a.querySelector("a");
          const href = link ? new URL(link.getAttribute("href") || NEWS_URL, NEWS_URL).href : NEWS_URL;
          const card = document.createElement("div");
          card.className = "card news-card";
          card.innerHTML = "";
          const t = document.createElement("time");
          t.textContent = date || "HYPERS";
          const h = document.createElement("h3");
          h.textContent = title.trim();
          const pp = document.createElement("p");
          pp.textContent = text;
          const btn = document.createElement("a");
          btn.className = "btn btn-outline";
          btn.href = href; btn.target = "_blank"; btn.rel = "noopener";
          btn.textContent = "LER MAIS";
          card.append(t, h, pp, btn);
          newsGrid.appendChild(card);
        });
      })
      .catch(() => {
        newsGrid.innerHTML =
          '<div class="card news-card"><time>ATUALIZAÇÃO</time><h3>Hypers Client atualizado</h3><p>Melhorias de FPS, novas tags e correções de estabilidade já disponíveis para download.</p><a class="btn btn-outline" href="download.html">BAIXAR</a></div>' +
          '<div class="card news-card"><time>COSMÉTICOS</time><h3>Novos cosméticos exclusivos</h3><p>Capas, tags e skins novas liberadas para membros do Discord.</p><a class="btn btn-outline" href="' + NEWS_URL + '" target="_blank" rel="noopener">VER TODAS</a></div>' +
          '<div class="card news-card"><time>COMUNIDADE</time><h3>Eventos da comunidade BR</h3><p>Campeonatos, sorteios e cargos especiais para criadores de conteúdo.</p><a class="btn btn-outline" href="' + DISCORD_INVITE + '" target="_blank" rel="noopener">PARTICIPAR</a></div>';
      });
  }

  // ---- Parceiros (badges.json) ----
  const pg = document.getElementById("partners-grid");
  if (pg) {
    fetch(BADGES_URL)
      .then(r => { if (!r.ok) throw 0; return r.json(); })
      .then(data => {
        const list = Array.isArray(data) ? data : (data.partners || data.badges || data.users || []);
        if (!list.length) throw 0;
        pg.innerHTML = "";
        list.forEach(p => {
          const name = p.name || p.nick || p.user || p.player || "Parceiro";
          const tag = p.tag || p.badge || p.cargo || "PARCEIRO";
          const card = document.createElement("div");
          card.className = "partner";
          const img = document.createElement("img");
          img.src = "https://mc-heads.net/avatar/" + encodeURIComponent(name) + "/64";
          img.alt = "Avatar de " + name;
          img.loading = "lazy";
          img.onerror = function () { this.style.display = "none"; };
          const h = document.createElement("h3");
          h.textContent = name;
          const nick = document.createElement("p");
          nick.className = "nick";
          nick.textContent = name;
          const span = document.createElement("span");
          span.className = "tag";
          span.textContent = String(tag).toUpperCase();
          card.append(img, h, nick, span);
          pg.appendChild(card);
        });
      })
      .catch(() => {
        pg.innerHTML = '<p class="loading">Não foi possível carregar os parceiros agora. Entre no <a href="' + DISCORD_INVITE + '" style="color:var(--gold2)">Discord</a> para ver a lista atualizada.</p>';
      });
  }
});

// ---- Lista de versões (download.html) ----
function renderVersions(rels) {
  const box = document.getElementById("versions-list");
  if (!box) return;
  if (!rels || !rels.length) {
    box.innerHTML = '<p class="loading">Não foi possível listar as versões agora. <a data-download style="color:var(--gold2)" href="#">Baixe a versão mais recente aqui</a>.</p>';
    box.querySelectorAll("[data-download]").forEach(a => a.href = DOWNLOAD_URL);
    return;
  }
  box.innerHTML = "";
  rels.slice(0, 8).forEach(r => {
    const row = document.createElement("div");
    row.className = "ver-row";
    const name = r.name || r.tag_name || "Versão";
    const date = fmtDate(r.published_at || r.created_at);
    const asset = (r.assets || []).filter(a => !/panel/i.test(a.name || ""))[0];
    const size = asset ? fmtSize(asset.size) : "";
    const link = (asset && asset.browser_download_url) || r.html_url || DOWNLOAD_URL;
    const s = document.createElement("strong"); s.textContent = name;
    const t = document.createElement("time"); t.textContent = date;
    const z = document.createElement("span"); z.className = "size"; z.textContent = size;
    const a = document.createElement("a"); a.className = "btn btn-gold"; a.href = link; a.textContent = "BAIXAR";
    row.append(s, t, z, a);
    box.appendChild(row);
  });
}
