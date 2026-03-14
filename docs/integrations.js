// ============================================================
// LibreAudio PRO — integrations.js  v3.0
// APIs: iHeartRadio · TuneIn · Dailymotion · YouTube · Twitch
// Reproductores: HLS · Audio · iFrame · Social Embeds
// ============================================================

// ── CORS PROXY (para APIs con restricciones) ────────────────
// Usamos allorigins.win que es público y gratuito
const CORS = (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
const CORS2 = (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`;

// ─────────────────────────────────────────────────────────────
// TUNEIN API (OPML público — sin auth requerida)
// Base: opml.radiotime.com
// ─────────────────────────────────────────────────────────────
export const TuneIn = {
  BASE: 'https://opml.radiotime.com',

  async search(query, type = '') {
    const params = new URLSearchParams({
      query,
      render: 'json',
      formats: 'mp3,aac',
      ...(type && { filter: type }),
    });
    try {
      const url = `${this.BASE}/Search.ashx?${params}`;
      const res = await fetch(CORS(url));
      const wrapper = await res.json();
      const data = JSON.parse(wrapper.contents);
      return this._parseResults(data?.body || []);
    } catch (e) {
      console.warn('TuneIn search error:', e);
      return [];
    }
  },

  async browse(id = 'r0') {
    try {
      const url = `${this.BASE}/Browse.ashx?id=${id}&render=json&formats=mp3,aac`;
      const res = await fetch(CORS(url));
      const wrapper = await res.json();
      const data = JSON.parse(wrapper.contents);
      return this._parseResults(data?.body || []);
    } catch (e) {
      console.warn('TuneIn browse error:', e);
      return [];
    }
  },

  async getStreamUrl(tuneUrl) {
    try {
      const res = await fetch(CORS(tuneUrl));
      const wrapper = await res.json();
      const content = wrapper.contents || '';
      const lines = content.split('\n').filter(l => l.startsWith('http'));
      return lines[0] || null;
    } catch (e) {
      return null;
    }
  },

  _parseResults(items) {
    if (!Array.isArray(items)) return [];
    return items
      .filter(i => i.type === 'audio' || i.type === 'link')
      .map(i => ({
        source:    'tunein',
        id:        i.guide_id || i.preset_id || '',
        title:     i.text || '',
        subtitle:  i.subtext || '',
        cover:     i.image || '',
        genre:     i.genre_id || '',
        nowPlaying: i.playing || i.current_track || '',
        streamUrl: i.URL || '',
        directUrl: '',
        reliability: i.reliability || 0,
        bitrate:   i.bitrate || '',
        type:      i.item === 'station' ? 'radio' : (i.item === 'show' ? 'podcast' : 'radio'),
        panelType: 'tunein',
        country:   i.locale || '',
      }));
  },

  embedUrl(guideId) {
    return `https://tunein.com/embed/player/?stationId=${guideId}&partnerId=RadioTime`;
  },
};

// ─────────────────────────────────────────────────────────────
// iHEARTRADIO API
// ─────────────────────────────────────────────────────────────
export const iHeart = {
  BASE: 'https://api.iheart.com/api/v3',
  BASE_V1: 'https://api.iheart.com/api/v1',

  async search(query, maxResults = 12) {
    try {
      const params = new URLSearchParams({
        keyword:         query,
        maxRows:         maxResults,
        startIndex:      0,
        tabs:            'stations,podcasts',
        boostPartnerStations: 'true',
      });
      const url = `${this.BASE}/search/all?${params}`;
      const res = await fetch(CORS(url));
      const wrapper = await res.json();
      const data = JSON.parse(wrapper.contents);
      return this._parseResults(data);
    } catch (e) {
      console.warn('iHeart search error:', e);
      return [];
    }
  },

  async getFeatured(country = 'MX') {
    try {
      const url = `${this.BASE_V1}/recs/featuredStations?country=${country}&limit=12`;
      const res = await fetch(CORS(url));
      const wrapper = await res.json();
      const data = JSON.parse(wrapper.contents);
      return this._parseResults(data);
    } catch (e) {
      return [];
    }
  },

  async getStreamUrl(stationId) {
    try {
      const url = `${this.BASE_V1}/live-meta/stream/${stationId}/currentTrackMeta`;
      const res = await fetch(CORS(url));
      const wrapper = await res.json();
      const data = JSON.parse(wrapper.contents);
      return data?.streams?.hls_stream || data?.streams?.secure_hls_stream || null;
    } catch {
      return null;
    }
  },

  _parseResults(data) {
    const results = [];
    const stations = data?.results?.stations?.results || data?.stations || [];
    stations.forEach(s => {
      results.push({
        source:    'iheart',
        id:        String(s.id || ''),
        title:     s.name || s.callLetters || '',
        subtitle:  s.description || s.city || '',
        cover:     s.logo || s.logoSquarePath || s.imageUrl || '',
        genre:     s.genres?.[0]?.name || s.format || '',
        country:   s.country || 'US',
        city:      s.city || '',
        streamUrl: s.streams?.hls_stream || s.streams?.secure_hls_stream || s.streams?.pls_stream || '',
        embedUrl:  s.id ? `https://www.iheart.com/live/${s.id}/?embed=true` : '',
        type:      'radio',
        panelType: 'iheart',
        nowPlaying: '',
      });
    });
    const podcasts = data?.results?.podcasts?.results || data?.podcasts || [];
    podcasts.forEach(p => {
      results.push({
        source:    'iheart',
        id:        String(p.id || ''),
        title:     p.title || '',
        subtitle:  p.description?.substring(0, 80) || '',
        cover:     p.imageUrl || p.logo || '',
        genre:     p.genres?.[0]?.name || '',
        country:   'US',
        city:      '',
        streamUrl: '',
        embedUrl:  p.id ? `https://www.iheart.com/podcast/${p.id}/?embed=true` : '',
        type:      'podcast',
        panelType: 'iheart',
        nowPlaying: '',
      });
    });
    return results;
  },
};

// ─────────────────────────────────────────────────────────────
// DAILYMOTION
// ─────────────────────────────────────────────────────────────
export const Dailymotion = {
  BASE: 'https://api.dailymotion.com',

  async search(query, limit = 10) {
    try {
      const params = new URLSearchParams({
        search:  query,
        fields:  'id,title,description,thumbnail_url,channel,duration,owner,language,country',
        limit,
        sort:    'relevance',
      });
      const res = await fetch(`${this.BASE}/videos?${params}`);
      const data = await res.json();
      return this._parseVideos(data?.list || []);
    } catch (e) {
      console.warn('Dailymotion search error:', e);
      return [];
    }
  },

  async getPopular(limit = 12) {
    try {
      const params = new URLSearchParams({
        fields: 'id,title,description,thumbnail_url,channel,duration,owner,language,country',
        limit,
        sort:   'trending',
      });
      const res = await fetch(`${this.BASE}/videos?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = data?.list || [];
      return list.length ? this._parseVideos(list, false) : this.search('noticias', limit);
    } catch (e) {
      console.warn('Dailymotion getPopular error:', e);
      return this.search('videos', limit).catch(() => []);
    }
  },

  async getLive(limit = 8) {
    try {
      const params = new URLSearchParams({
        fields:       'id,title,description,thumbnail_url,channel,owner',
        limit,
        sort:         'live-airing-time',
        'live_onair': 'true',
      });
      const res = await fetch(`${this.BASE}/videos?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = data?.list || [];
      if (!list.length) return this.getPopular(limit);
      return this._parseVideos(list, true);
    } catch (e) {
      console.warn('Dailymotion getLive error:', e);
      return this.getPopular(limit);
    }
  },

  embedUrl(videoId, autoplay = false) {
    return `https://www.dailymotion.com/embed/video/${videoId}?autoplay=${autoplay ? 1 : 0}&mute=0`;
  },

  extractId(url) {
    const m = url?.match(/dailymotion\.com\/(?:video|embed\/video)\/([a-zA-Z0-9]+)/);
    return m ? m[1] : null;
  },

  _parseVideos(list, isLive = false) {
    return list.map(v => ({
      source:    'dailymotion',
      id:        v.id,
      title:     v.title || '',
      subtitle:  v.channel || '',
      cover:     v.thumbnail_url || '',
      genre:     v.channel || '',
      country:   v.country || '',
      streamUrl: '',
      embedUrl:  this.embedUrl(v.id),
      externalUrl: `https://www.dailymotion.com/video/${v.id}`,
      type:      isLive ? 'tv_en_vivo' : 'tv_grabado',
      panelType: 'dailymotion',
      nowPlaying: '',
    }));
  },
};

// ─────────────────────────────────────────────────────────────
// REPRODUCTOR UNIVERSAL
// ─────────────────────────────────────────────────────────────
export const PlayerResolver = {

  detectType(url) {
    if (!url) return 'generic';
    if (url.includes('youtube.com') || url.includes('youtu.be'))  return 'youtube';
    if (url.includes('twitch.tv'))     return 'twitch';
    if (url.includes('dailymotion'))   return 'dailymotion';
    if (url.includes('facebook.com'))  return 'facebook';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('tiktok.com'))    return 'tiktok';
    if (url.includes('iheart.com'))    return 'iheart';
    if (url.includes('tunein.com'))    return 'tunein';
    if (url.includes('zeno.fm'))       return 'zenofm';
    if (url.includes('azuracast') || url.includes('/public/'))    return 'azuracast';
    if (url.endsWith('.m3u8') || url.includes('.m3u8?'))  return 'hls';
    if (url.match(/\.(mp3|aac|ogg|flac|opus)(\?|$)/i))   return 'audio';
    return 'iframe';
  },

  buildEmbed(url, type, autoplay = true) {
    const auto = autoplay ? 1 : 0;
    switch (type) {
      case 'youtube': {
        const id = this._ytId(url);
        if (!id) return url;
        return `https://www.youtube.com/embed/${id}?autoplay=${auto}&rel=0`;
      }
      case 'twitch': {
        const ch = this._twitchChannel(url);
        return `https://player.twitch.tv/?channel=${ch}&parent=${location.hostname}&autoplay=${!!autoplay}`;
      }
      case 'dailymotion': {
        const id = Dailymotion.extractId(url);
        if (!id) return url;
        return `https://www.dailymotion.com/embed/video/${id}?autoplay=${auto}&mute=0`;
      }
      case 'facebook': {
        const encoded = encodeURIComponent(url);
        return `https://www.facebook.com/plugins/video.php?href=${encoded}&width=500&autoplay=${!!autoplay}&show_text=false`;
      }
      case 'iheart': {
        if (url.includes('embed=true')) return url;
        return url.includes('?') ? `${url}&embed=true` : `${url}?embed=true`;
      }
      case 'tunein': {
        const stId = url.match(/s\d+/)?.[0] || '';
        if (stId) return `https://tunein.com/embed/player/?stationId=${stId}&partnerId=RadioTime`;
        return url;
      }
      case 'zenofm': {
        if (url.includes('embed')) return url;
        const match = url.match(/zeno\.fm\/radio\/([^/?]+)/);
        if (match) return `https://zeno.fm/radio/${match[1]}/embed`;
        return url;
      }
      default:
        return url;
    }
  },

  iframeHTML(embedUrl, title = '') {
    return `<iframe
      src="${embedUrl}"
      title="${title}"
      frameborder="0"
      allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
      allowfullscreen
      style="width:100%;height:100%;border:none;"
    ></iframe>`;
  },

  _ytId(url) {
    const m = url?.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  },
  _twitchChannel(url) {
    const m = url?.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
    return m ? m[1] : (url || '');
  },
};

// ─────────────────────────────────────────────────────────────
// HLS.js helper
// ─────────────────────────────────────────────────────────────
export async function loadHlsJs() {
  if (window.Hls) return window.Hls;
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js';
    s.onload = () => resolve(window.Hls);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ─────────────────────────────────────────────────────────────
// SOCIAL MEDIA
// ─────────────────────────────────────────────────────────────
export const Social = {

  detectNetwork(url) {
    if (!url) return null;
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('twitch.tv'))     return 'twitch';
    if (url.includes('dailymotion'))   return 'dailymotion';
    if (url.includes('facebook.com'))  return 'facebook';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('tiktok.com'))    return 'tiktok';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    if (url.includes('kick.com'))      return 'kick';
    if (url.includes('rumble.com'))    return 'rumble';
    return null;
  },

  badge(network) {
    const badges = {
      youtube:     { icon: '▶️', label: 'YouTube',    color: '#FF0000' },
      twitch:      { icon: '🟣', label: 'Twitch',     color: '#9146FF' },
      dailymotion: { icon: '🔵', label: 'Dailymotion', color: '#0090D0' },
      facebook:    { icon: '👥', label: 'Facebook',   color: '#1877F2' },
      instagram:   { icon: '📸', label: 'Instagram',  color: '#E1306C' },
      tiktok:      { icon: '🎵', label: 'TikTok',     color: '#010101' },
      twitter:     { icon: '🐦', label: 'X/Twitter',  color: '#1DA1F2' },
      kick:        { icon: '🟢', label: 'Kick',       color: '#53FC18' },
      rumble:      { icon: '🔴', label: 'Rumble',     color: '#85C742' },
      iheart:      { icon: '❤️', label: 'iHeart',     color: '#C6002B' },
      tunein:      { icon: '📻', label: 'TuneIn',     color: '#00A0EE' },
      azuracast:   { icon: '⚡', label: 'AzuraCast',  color: '#528FC8' },
      sonicpanel:  { icon: '🎵', label: 'SonicPanel', color: '#2563EB' },
      zenofm:      { icon: '📡', label: 'ZenoFM',     color: '#7C3AED' },
    };
    return badges[network] || { icon: '🔗', label: network || 'Web', color: '#6B7280' };
  },

  rumbleEmbed(url) {
    const m = url?.match(/rumble\.com\/(?:embed\/)?([a-zA-Z0-9]+)/);
    if (m) return `https://rumble.com/embed/${m[1]}/?pub=4`;
    return url;
  },

  kickEmbed(url) {
    const m = url?.match(/kick\.com\/([a-zA-Z0-9_]+)/);
    if (m) return `https://player.kick.com/${m[1]}`;
    return url;
  },
};


// ─────────────────────────────────────────────────────────────
// METADATA — AzuraCast / SonicPanel / ZenoFM now-playing
// ─────────────────────────────────────────────────────────────
export const Metadata = {

  async azuracast(baseUrl, stationSlug) {
    try {
      const apiUrl = `${baseUrl.replace(/\/$/, '')}/api/nowplaying/${stationSlug}`;
      const res = await fetch(apiUrl, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error('no ok');
      const data = await res.json();
      return {
        song:     data?.now_playing?.song?.title || '',
        artist:   data?.now_playing?.song?.artist || '',
        album:    data?.now_playing?.song?.album || '',
        cover:    data?.now_playing?.song?.art || '',
        listeners: data?.listeners?.current || 0,
        isLive:   data?.live?.is_live || false,
        streamer: data?.live?.streamer_name || '',
      };
    } catch {
      return null;
    }
  },

  parseAzuraCastUrl(url) {
    if (!url) return null;
    const m = url.match(/(?:\/public\/|\/api\/nowplaying\/)([^/?#]+)/);
    if (!m) return null;
    const base = url.split('/public/')[0] || url.split('/api/')[0];
    return { base, slug: m[1] };
  },

  async sonicpanel(statsUrl) {
    try {
      const res = await fetch(statsUrl, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error('no ok');
      const data = await res.json();
      return {
        song:      data?.currentsong || data?.title || '',
        artist:    data?.artist || '',
        listeners: data?.currentlisteners || data?.listeners || 0,
        isLive:    false,
      };
    } catch {
      return null;
    }
  },

  async zenofm(streamUrl) {
    return null;
  },

  async fetch(panelType, streamUrl, embedUrl) {
    if (panelType === 'azuracast') {
      const parsed = this.parseAzuraCastUrl(embedUrl || streamUrl);
      if (parsed) return this.azuracast(parsed.base, parsed.slug);
    }
    if (panelType === 'sonicpanel') {
      if (streamUrl) {
        const statsUrl = streamUrl.replace(/;.*$/, '').replace(/stream.*$/, 'stats?json=1');
        return this.sonicpanel(statsUrl);
      }
    }
    return null;
  },
};

export default { TuneIn, iHeart, Dailymotion, PlayerResolver, Social, loadHlsJs, Metadata };