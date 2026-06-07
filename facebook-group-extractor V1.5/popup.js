let latestRows = [];

const extractVisibleBtn = document.getElementById('extractVisibleBtn');
const extractLoadedBtn = document.getElementById('extractLoadedBtn');
const downloadBtn = document.getElementById('downloadBtn');
const statusEl = document.getElementById('status');
const tbody = document.querySelector('#previewTable tbody');

extractVisibleBtn.addEventListener('click', () => runExtraction('visible'));
extractLoadedBtn.addEventListener('click', () => runExtraction('loaded'));

async function runExtraction(mode) {
  statusEl.textContent = mode === 'loaded'
    ? 'Extracting loaded group links...'
    : 'Extracting visible group links...';

  downloadBtn.disabled = true;
  tbody.innerHTML = '';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
      throw new Error('No active tab found.');
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractFacebookGroups,
      args: [mode]
    });

    latestRows = results?.[0]?.result || [];
    renderPreview(latestRows);

    if (latestRows.length === 0) {
      statusEl.textContent = 'No group links found. Try opening a Facebook group search result page and scrolling first.';
    } else {
      statusEl.textContent = `Found ${latestRows.length} unique ${mode} group link(s).`;
      downloadBtn.disabled = false;
    }
  } catch (error) {
    statusEl.textContent = `Error: ${error.message}`;
  }
}

downloadBtn.addEventListener('click', () => {
  if (!latestRows.length) return;
  downloadCsv(latestRows);
});

function renderPreview(rows) {
  tbody.innerHTML = '';

  rows.forEach((row, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${escapeHtml(row.group_name || '')}</td>
      <td>${escapeHtml(row.privacy_status || '')}</td>
      <td>${escapeHtml(row.member_count || '')}</td>
      <td>${escapeHtml(row.posts_per_day || '')}</td>
      <td>${escapeHtml(row.unread_posts || '')}</td>
      <td>${escapeHtml(row.friends_joined || '')}</td>
      <td class="url">${escapeHtml(row.group_url || '')}</td>
      <td class="text">${escapeHtml(row.group_basic_info || '')}</td>
    `;
    tbody.appendChild(tr);
  });
}

function downloadCsv(rows) {
  const headers = [
    'group_name',
    'group_url',
    'privacy_status',
    'member_count',
    'member_count_number',
    'posts_per_day',
    'posts_per_day_number',
    'unread_posts',
    'unread_posts_number',
    'friends_joined',
    'friends_joined_number',
    'joined_time',
    'group_basic_info',
    'source_page',
    'collected_at',
    'extract_mode'
  ];

  const csvLines = [headers.join(',')];

  rows.forEach(row => {
    csvLines.push(headers.map(header => csvEscape(row[header] || '')).join(','));
  });

  const csvContent = '\uFEFF' + csvLines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const filename = `fb_groups_${new Date().toISOString().slice(0, 10)}.csv`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const str = String(value).replace(/\r?\n|\r/g, ' ').trim();
  return `"${str.replace(/"/g, '""')}"`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// This function runs inside the current webpage.
function extractFacebookGroups(mode) {
  const collectedAt = new Date().toISOString();
  const sourcePage = window.location.href;
  const links = Array.from(document.querySelectorAll('a[href]'));
  const rowsByUrl = new Map();

  for (const link of links) {
    const rawHref = link.getAttribute('href') || '';
    const normalizedUrl = normalizeFacebookGroupUrl(rawHref);

    if (!normalizedUrl) continue;

    if (mode === 'visible' && !isElementVisible(link)) continue;

    const container = findUsefulContainer(link);
    const groupBasicInfo = cleanText(container ? container.innerText : link.innerText);
    const parsed = parseGroupBasicInfo(groupBasicInfo);
    const groupName = guessGroupName(link, groupBasicInfo, normalizedUrl);

    if (!groupName && !groupBasicInfo) continue;

    const row = {
      group_name: groupName,
      group_url: normalizedUrl,
      privacy_status: parsed.privacy_status,
      member_count: parsed.member_count,
      member_count_number: parsed.member_count_number,
      posts_per_day: parsed.posts_per_day,
      posts_per_day_number: parsed.posts_per_day_number,
      unread_posts: parsed.unread_posts,
      unread_posts_number: parsed.unread_posts_number,
      friends_joined: parsed.friends_joined,
      friends_joined_number: parsed.friends_joined_number,
      joined_time: parsed.joined_time,
      group_basic_info: groupBasicInfo,
      source_page: sourcePage,
      collected_at: collectedAt,
      extract_mode: mode
    };

    if (!rowsByUrl.has(normalizedUrl)) {
      rowsByUrl.set(normalizedUrl, row);
    } else {
      const existing = rowsByUrl.get(normalizedUrl);

      if ((groupBasicInfo || '').length > (existing.group_basic_info || '').length) {
        rowsByUrl.set(normalizedUrl, {
          ...row,
          group_name: chooseBetterGroupName(existing.group_name, row.group_name)
        });
      } else {
        for (const key of [
          'privacy_status',
          'member_count',
          'member_count_number',
          'posts_per_day',
          'posts_per_day_number',
          'unread_posts',
          'unread_posts_number',
          'friends_joined',
          'friends_joined_number',
          'joined_time'
        ]) {
          if (!existing[key] && row[key]) existing[key] = row[key];
        }
        existing.group_name = chooseBetterGroupName(existing.group_name, row.group_name);
      }
    }
  }

  return Array.from(rowsByUrl.values());

  function normalizeFacebookGroupUrl(href) {
    if (!href) return '';

    let url;
    try {
      url = new URL(href, window.location.origin);
    } catch {
      return '';
    }

    const host = url.hostname.replace(/^www\./, '');
    if (host !== 'facebook.com' && host !== 'm.facebook.com') return '';

    const path = url.pathname;
    const groupMatch = path.match(/\/groups\/([^/?#]+)/);
    if (!groupMatch) return '';

    const groupIdOrSlug = groupMatch[1];
    if (!groupIdOrSlug || groupIdOrSlug === 'feed' || groupIdOrSlug === 'discover') return '';

    return `https://www.facebook.com/groups/${groupIdOrSlug}`;
  }

  function findUsefulContainer(element) {
    let current = element;

    for (let depth = 0; depth < 10 && current; depth++) {
      const text = cleanText(current.innerText || '');
      const linkCount = current.querySelectorAll ? current.querySelectorAll('a[href]').length : 0;

      if (text.length >= 20 && text.length <= 1800 && linkCount <= 35) {
        return current;
      }

      current = current.parentElement;
    }

    return element.closest('[role="article"], [role="listitem"], div') || element;
  }

  function guessGroupName(link, groupBasicInfo, normalizedUrl) {
    // Best source: the first part of the group card, before privacy/member info.
    const fromBasicInfo = extractNameFromBasicInfo(groupBasicInfo);
    if (fromBasicInfo) return fromBasicInfo;

    const candidates = [];

    const linkText = cleanText(link.innerText || '');
    const ariaLabel = cleanText(link.getAttribute('aria-label') || '');
    const title = cleanText(link.getAttribute('title') || '');

    if (linkText) candidates.push(linkText);
    if (ariaLabel) candidates.push(ariaLabel);
    if (title) candidates.push(title);

    const lines = splitUsefulLines(groupBasicInfo);
    for (const line of lines) {
      candidates.push(line);
    }

    for (const candidate of candidates) {
      const cleaned = cleanGroupName(candidate);
      if (isValidGroupName(cleaned)) {
        return cleaned;
      }
    }

    return cleanGroupName(normalizedUrl.split('/groups/')[1] || '');
  }

  function extractNameFromBasicInfo(text) {
    let s = cleanText(text);
    if (!s) return '';

    // Remove avatar text first.
    s = cleanGroupName(s);

    // For examples like:
    // "LASER FILES 公开 · 6.5 万位成员 · 25 篇未读帖子 · 加入时间：2025年12月 17 位好友已加入 访问"
    // we take everything before privacy/member keywords.
    const markerRegex = /(公开|非公开|私密|私人|public\s+group|private\s+group|[\d,.]+\s*万?\s*位成员|[\d,.]+\s*[KkMm]?\s*members?)/i;
    const match = s.match(markerRegex);

    if (match && match.index > 0) {
      const name = cleanGroupName(s.slice(0, match.index));
      if (isValidGroupName(name)) return name;
    }

    return '';
  }

  function cleanGroupName(name) {
    let s = cleanText(name);

    s = s
      .replace(/的头像$/i, '')
      .replace(/^头像$/i, '')
      .replace(/^头像\s*/i, '')
      .replace(/\s*头像$/i, '')
      .replace(/\s*的个人头像$/i, '')
      .replace(/\s*个人头像$/i, '')
      .replace(/\s*的资料头像$/i, '')
      .replace(/\s*资料头像$/i, '')
      .replace(/\s*'s profile picture$/i, '')
      .replace(/\s*profile picture$/i, '')
      .replace(/\s*'s avatar$/i, '')
      .replace(/\s*avatar$/i, '')
      .replace(/\s*cover photo$/i, '');

    // Remove button/action words at the end.
    s = s
      .replace(/\s+访问$/i, '')
      .replace(/\s+加入$/i, '')
      .replace(/\s+已加入$/i, '')
      .replace(/\s+Visit$/i, '')
      .replace(/\s+Join Group$/i, '')
      .replace(/\s+Join$/i, '')
      .replace(/\s+View$/i, '')
      .trim();

    return cleanText(s);
  }

  function isValidGroupName(name) {
    const cleaned = cleanGroupName(name || '');
    if (!cleaned) return false;
    if (cleaned.length > 160) return false;
    if (looksLikeMetaText(cleaned)) return false;

    // Reject single action words.
    if (/^(访问|加入|已加入|visit|join|view)$/i.test(cleaned)) return false;

    // Reject pure metadata.
    if (/^(公开|非公开|私密|私人|public|private)$/i.test(cleaned)) return false;
    if (/^[\d,.]+\s*(万)?\s*(位成员|members?)$/i.test(cleaned)) return false;
    if (/^[\d,.]+\s*篇未读帖子$/i.test(cleaned)) return false;

    return true;
  }

  function chooseBetterGroupName(oldName, newName) {
    const oldClean = cleanGroupName(oldName || '');
    const newClean = cleanGroupName(newName || '');

    if (!isValidGroupName(oldClean)) return isValidGroupName(newClean) ? newClean : '';
    if (!isValidGroupName(newClean)) return oldClean;

    const oldIsAction = /^(访问|加入|visit|join|view)$/i.test(oldClean);
    const newIsAction = /^(访问|加入|visit|join|view)$/i.test(newClean);

    if (oldIsAction && !newIsAction) return newClean;
    if (newIsAction && !oldIsAction) return oldClean;

    const oldHasAvatar = /头像|profile picture|avatar/i.test(oldName || '');
    const newHasAvatar = /头像|profile picture|avatar/i.test(newName || '');

    if (oldHasAvatar && !newHasAvatar) return newClean;
    if (newHasAvatar && !oldHasAvatar) return oldClean;

    // Prefer the name that appears before privacy/member markers, often longer and more complete.
    return newClean.length > oldClean.length ? newClean : oldClean;
  }

  function parseGroupBasicInfo(text) {
    const info = cleanText(text);
    const result = {
      privacy_status: '',
      member_count: '',
      member_count_number: '',
      posts_per_day: '',
      posts_per_day_number: '',
      unread_posts: '',
      unread_posts_number: '',
      friends_joined: '',
      friends_joined_number: '',
      joined_time: ''
    };

    if (/(公开|public\s+group|public)/i.test(info)) {
      result.privacy_status = 'Public';
    } else if (/(非公开|私密|私人|private\s+group|private)/i.test(info)) {
      result.privacy_status = 'Private';
    }

    const memberMatch =
      info.match(/([\d,.]+)\s*万?\s*位成员/i) ||
      info.match(/([\d,.]+)\s*[KkMm]?\s*members?/i);

    if (memberMatch) {
      result.member_count = normalizeCountText(memberMatch[0]);
      result.member_count_number = countTextToNumber(memberMatch[0]);
    }

    const postsMatch =
      info.match(/单日发\s*([\d,.]+)\+?\s*篇帖/i) ||
      info.match(/单日\s*([\d,.]+)\+?\s*篇帖/i) ||
      info.match(/每天\s*([\d,.]+)\+?\s*(个帖子|篇帖)/i) ||
      info.match(/每日\s*([\d,.]+)\+?\s*(个帖子|篇帖)/i) ||
      info.match(/([\d,.]+)\+?\s*posts?\s*(a|per)\s*day/i) ||
      info.match(/([\d,.]+)\+?\s*posts?\s*\/\s*day/i);

    if (postsMatch) {
      result.posts_per_day = normalizeCountText(postsMatch[0]);
      result.posts_per_day_number = countTextToNumber(postsMatch[0]);
    }

    const unreadMatch =
      info.match(/([\d,.]+)\s*篇未读帖子/i) ||
      info.match(/([\d,.]+)\s*unread\s*posts?/i);

    if (unreadMatch) {
      result.unread_posts = normalizeCountText(unreadMatch[0]);
      result.unread_posts_number = countTextToNumber(unreadMatch[0]);
    }

    const friendsMatch =
      info.match(/([\d,.]+)\s*位好友已加入/i) ||
      info.match(/([\d,.]+)\s*friends?\s*(joined|are members|in the group)/i);

    if (friendsMatch) {
      result.friends_joined = normalizeCountText(friendsMatch[0]);
      result.friends_joined_number = countTextToNumber(friendsMatch[0]);
    }

    const joinedTimeMatch =
      info.match(/加入时间[:：]\s*([^\s·]+)/i) ||
      info.match(/joined\s+([A-Za-z]+\s+\d{4}|\d{4})/i);

    if (joinedTimeMatch) {
      result.joined_time = cleanText(joinedTimeMatch[0]);
    }

    return result;
  }

  function normalizeCountText(text) {
    return cleanText(text);
  }

  function countTextToNumber(text) {
    const raw = String(text || '').replace(/,/g, '');
    const numMatch = raw.match(/[\d.]+/);
    if (!numMatch) return '';

    let num = parseFloat(numMatch[0]);
    if (Number.isNaN(num)) return '';

    if (/万/.test(raw)) num *= 10000;
    if (/[Kk]/.test(raw)) num *= 1000;
    if (/[Mm]/.test(raw)) num *= 1000000;

    return Math.round(num);
  }

  function looksLikeMetaText(text) {
    const lower = String(text || '').toLowerCase();
    return [
      'join group',
      'joined',
      'visit',
      'view',
      'public group',
      'private group',
      'members',
      'posts',
      '访问',
      '加入',
      '已加入',
      '公开',
      '非公开',
      '私密',
      '私人',
      '成员',
      '未读帖子',
      '好友已加入',
      '加入时间',
      '查看更多',
      'see more'
    ].some(bad => lower === bad || lower.includes(bad) && lower.length <= 30);
  }

  function splitUsefulLines(text) {
    return String(text || '')
      .split(/\n|·|\|/)
      .map(line => cleanText(line))
      .filter(Boolean);
  }

  function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      rect.bottom >= 0 &&
      rect.right >= 0 &&
      rect.top <= window.innerHeight &&
      rect.left <= window.innerWidth &&
      style.visibility !== 'hidden' &&
      style.display !== 'none'
    );
  }

  function cleanText(text) {
    return String(text || '')
      .replace(/\s+/g, ' ')
      .replace(/\u00a0/g, ' ')
      .trim();
  }
}
