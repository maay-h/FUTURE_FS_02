/**
 * Pure JSON file database — zero npm dependencies.
 * Uses direct array methods instead of SQL parsing for reliability.
 */
const fs = require('fs');
const path = require('path');

const DB_PATH = path.resolve(__dirname, 'crm-data.json');

const TABLES = ['users','accounts','leads','activities','tasks','payments','email_templates','email_triggers'];

function loadDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      const data = JSON.parse(raw);
      // Ensure all tables exist
      TABLES.forEach(t => { if (!data[t]) data[t] = []; });
      return data;
    }
  } catch(e) { console.error('DB load error:', e.message); }
  const fresh = {};
  TABLES.forEach(t => fresh[t] = []);
  return fresh;
}

let _saveTimer = null;
function saveDb(data) {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  }, 100);
}

function now() { return new Date().toISOString(); }

// ─── Parse SQL into an operation descriptor ──────────────────────────────────
function parseSQL(sql, params) {
  sql = sql.trim().replace(/\s+/g, ' ');

  // ── INSERT ──────────────────────────────────────────────────────────────────
  const insertRx = /^INSERT\s+(OR\s+IGNORE\s+)?INTO\s+(\w+)\s*\(([^)]+)\)\s+VALUES\s*\(([^)]+)\)/i;
  const ins = sql.match(insertRx);
  if (ins) {
    const ignore = !!ins[1];
    const table = ins[2].toLowerCase();
    const cols = ins[3].split(',').map(c => c.trim());
    const record = {};
    cols.forEach((col, i) => { record[col] = params[i] !== undefined ? params[i] : null; });
    if (!record.created_at) record.created_at = now();
    if (!record.updated_at) record.updated_at = now();
    return { op: 'insert', table, record, ignore };
  }

  // ── UPDATE ──────────────────────────────────────────────────────────────────
  const updRx = /^UPDATE\s+(\w+)\s+SET\s+(.*?)\s+WHERE\s+(.+)$/i;
  const upd = sql.match(updRx);
  if (upd) {
    const table = upd[1].toLowerCase();
    const setPart = upd[2];
    const wherePart = upd[3];
    // Parse SET fields
    const setFields = {};
    let pIdx = 0;
    setPart.split(',').forEach(s => {
      s = s.trim();
      if (/CURRENT_TIMESTAMP/i.test(s)) return;
      const m = s.match(/(\w+)\s*=\s*\?/);
      if (m) { setFields[m[1]] = params[pIdx++]; }
    });
    setFields.updated_at = now();
    // Parse WHERE
    const where = parseWhere(wherePart, params, pIdx);
    return { op: 'update', table, setFields, where };
  }

  // ── DELETE ──────────────────────────────────────────────────────────────────
  const delRx = /^DELETE\s+FROM\s+(\w+)\s+WHERE\s+(.+)$/i;
  const del = sql.match(delRx);
  if (del) {
    const table = del[1].toLowerCase();
    const where = parseWhere(del[2], params, 0);
    return { op: 'delete', table, where };
  }

  // ── SELECT ──────────────────────────────────────────────────────────────────
  return { op: 'select', sql, params };
}

// Parse WHERE clause into array of condition objects
function parseWhere(whereStr, params, startIdx = 0) {
  if (!whereStr) return [];
  let pIdx = startIdx;
  const conditions = [];
  const parts = whereStr.split(/\bAND\b/i);

  parts.forEach(part => {
    part = part.trim();
    // Skip strftime/DATE() conditions
    if (/strftime|DATE\(/i.test(part)) { if (/\?/.test(part)) pIdx++; return; }
    // IS NULL / IS NOT NULL
    let m = part.match(/^[\w.]+\.?(\w+)\s+(IS\s+NOT\s+NULL|IS\s+NULL)$/i);
    if (m) { conditions.push({ field: m[1], op: m[2].replace(/\s+/,'_').toUpperCase() }); return; }
    // LIKE ?
    m = part.match(/^[\w.]+\.?(\w+)\s+LIKE\s+\?$/i);
    if (m) { conditions.push({ field: m[1], op: 'LIKE', value: params[pIdx++] }); return; }
    // field op ? 
    m = part.match(/^[\w.]+\.?(\w+)\s*(=|!=|>=|<=|>|<)\s*\?$/i);
    if (m) { conditions.push({ field: m[1], op: m[2], value: params[pIdx++] }); return; }
    // field = 'literal'
    m = part.match(/^[\w.]+\.?(\w+)\s*(=|!=)\s*'([^']*)'$/i);
    if (m) { conditions.push({ field: m[1], op: m[2], value: m[3] }); return; }
    // field NOT IN ('a','b')
    m = part.match(/^[\w.]+\.?(\w+)\s+NOT\s+IN\s*\(([^)]+)\)$/i);
    if (m) {
      const vals = m[2].split(',').map(v => v.trim().replace(/'/g,''));
      conditions.push({ field: m[1], op: 'NOT_IN', value: vals });
    }
  });
  return conditions;
}

function matchRow(row, conditions) {
  return conditions.every(({ field, op, value }) => {
    const v = row[field];
    if (op === '=' || op === '==') return String(v ?? '') === String(value ?? '');
    if (op === '!=') return String(v ?? '') !== String(value ?? '');
    if (op === 'LIKE') return new RegExp(String(value).replace(/%/g,'.*').replace(/_/g,'.'), 'i').test(String(v ?? ''));
    if (op === '>=' ) return v >= value;
    if (op === '<=' ) return v <= value;
    if (op === '>'  ) return v >  value;
    if (op === '<'  ) return v <  value;
    if (op === 'IS_NULL')     return v == null;
    if (op === 'IS_NOT_NULL') return v != null;
    if (op === 'NOT_IN') return !value.includes(String(v ?? ''));
    return true;
  });
}

// ─── Execute a parsed operation ───────────────────────────────────────────────
function execute(sql, params, returnMode) {
  const data = loadDb();
  const op = parseSQL(sql, params);

  if (op.op === 'insert') {
    const table = data[op.table];
    if (!table) throw new Error(`Unknown table: ${op.table}`);
    if (op.ignore && op.record.id && table.find(r => r.id === op.record.id)) return [];
    table.push(op.record);
    saveDb(data);
    return [];
  }

  if (op.op === 'update') {
    const table = data[op.table];
    if (!table) throw new Error(`Unknown table: ${op.table}`);
    table.forEach(r => { if (matchRow(r, op.where)) Object.assign(r, op.setFields); });
    saveDb(data);
    return [];
  }

  if (op.op === 'delete') {
    const table = data[op.table];
    if (!table) throw new Error(`Unknown table: ${op.table}`);
    data[op.table] = table.filter(r => !matchRow(r, op.where));
    saveDb(data);
    return [];
  }

  // SELECT
  return executeSelect(op.sql, op.params, data);
}

function executeSelect(sql, params, data) {
  // COUNT(*)
  const countRx = /SELECT\s+COUNT\(\*\)\s+as\s+(\w+)\s+FROM\s+(\w+)(?:\s+\w+)?(.*)?$/is;
  const cm = sql.match(countRx);
  if (cm) {
    let rows = [...(data[cm[2].toLowerCase()] || [])];
    const wm = cm[3] && cm[3].match(/WHERE\s+(.*?)(?:ORDER BY|LIMIT|OFFSET|GROUP BY|$)/is);
    if (wm) rows = rows.filter(r => matchRow(r, parseWhere(wm[1], params, 0)));
    return [{ [cm[1]]: rows.length, c: rows.length, total: rows.length }];
  }

  // COALESCE(SUM()) - one or two
  const sumRx = /SELECT\s+COALESCE\(SUM\((\w+)\),\s*0\)\s+as\s+(\w+)(?:,\s*COALESCE\(SUM\((\w+)\),\s*0\)\s+as\s+(\w+))?\s+FROM\s+(\w+)(.*)?$/is;
  const sm = sql.match(sumRx);
  if (sm) {
    let rows = [...(data[sm[5].toLowerCase()] || [])];
    const wm = sm[6] && sm[6].match(/WHERE\s+(.*?)(?:ORDER BY|LIMIT|OFFSET|$)/is);
    if (wm) rows = rows.filter(r => matchRow(r, parseWhere(wm[1], params, 0)));
    const result = { [sm[2]]: rows.reduce((s,r) => s + (Number(r[sm[1]]) || 0), 0) };
    if (sm[3]) result[sm[4]] = rows.reduce((s,r) => s + (Number(r[sm[3]]) || 0), 0);
    result.v = result[sm[2]];
    return [result];
  }

  // strftime GROUP BY (trend)
  const trendRx = /SELECT\s+strftime\('([^']+)',\s*(\w+)\)\s+as\s+(\w+),\s*COUNT\(\*\)\s+as\s+(\w+)\s+FROM\s+(\w+)(.*)?$/is;
  const tm = sql.match(trendRx);
  if (tm) {
    const rows = data[tm[5].toLowerCase()] || [];
    const grouped = {};
    rows.forEach(r => {
      const d = new Date(r[tm[2]] || r.created_at || now());
      const key = tm[1] === '%Y-%m'
        ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
        : String(d.getFullYear());
      grouped[key] = (grouped[key] || 0) + 1;
    });
    let result = Object.entries(grouped).map(([k,v]) => ({ [tm[3]]: k, [tm[4]]: v }));
    result.sort((a,b) => a[tm[3]] < b[tm[3]] ? -1 : 1);
    const lm = tm[6] && tm[6].match(/LIMIT\s+(\d+)/i);
    if (lm) result = result.slice(-parseInt(lm[1]));
    return result;
  }

  // GROUP BY field, COUNT(*)
  const grpRx = /SELECT\s+([\w.]+),\s*COUNT\(\*\)\s+as\s+(\w+)\s+FROM\s+(\w+)(?:\s+\w+)?(.*)?$/is;
  const gm = sql.match(grpRx);
  if (gm) {
    const field = gm[1].split('.').pop();
    let rows = [...(data[gm[3].toLowerCase()] || [])];
    const wm = gm[4] && gm[4].match(/WHERE\s+(.*?)(?:GROUP BY|ORDER BY|LIMIT|$)/is);
    if (wm) rows = rows.filter(r => matchRow(r, parseWhere(wm[1], params, 0)));
    const grouped = {};
    rows.forEach(r => { const k = r[field] ?? 'Unknown'; grouped[k] = (grouped[k]||0) + 1; });
    let result = Object.entries(grouped).map(([k,v]) => {
      const obj = { [field]: k, [gm[2]]: v, count: v };
      obj.source = k; obj.type = k; obj.status = k;
      return obj;
    });
    const om = gm[4] && gm[4].match(/ORDER BY\s+(\w+)\s*(DESC|ASC)?/i);
    if (om) { const d = (om[2]||'ASC').toUpperCase(); result.sort((a,b) => d==='DESC' ? b.count-a.count : a.count-b.count); }
    const lm = gm[4] && gm[4].match(/LIMIT\s+(\d+)/i);
    if (lm) result = result.slice(0, parseInt(lm[1]));
    return result;
  }

  // Regular SELECT
  const selRx = /SELECT\s+.*?\s+FROM\s+(\w+)(?:\s+(\w+))?(.*)?$/is;
  const sel = sql.match(selRx);
  if (!sel) return [];

  const tableName = sel[1].toLowerCase();
  const alias = sel[2] && !['WHERE','LEFT','INNER','ORDER','LIMIT','GROUP'].includes(sel[2].toUpperCase()) ? sel[2] : null;
  const rest = sel[3] || '';

  let rows = JSON.parse(JSON.stringify(data[tableName] || []));

  // LEFT JOINs
  const joinRx = /LEFT JOIN\s+(\w+)\s+(\w+)\s+ON\s+([\w.]+)\s*=\s*([\w.]+)/gi;
  let jm;
  while ((jm = joinRx.exec(rest)) !== null) {
    const joinTable = jm[1].toLowerCase();
    const jRows = data[joinTable] || [];
    const leftField  = jm[3].split('.').pop();
    const rightField = jm[4].split('.').pop();
    rows = rows.map(r => {
      const j = jRows.find(jr => jr[rightField] === r[leftField] || jr[leftField] === r[rightField]);
      if (!j) return r;
      const merged = { ...r };
      if (joinTable === 'users') {
        if (r.assigned_to && j.id === r.assigned_to) {
          merged.assigned_name = j.name; merged.assigned_role = j.role; merged.assigned_email = j.email;
        }
        if (r.performed_by && j.id === r.performed_by) merged.performed_by_name = j.name;
      }
      if (joinTable === 'leads') { merged.lead_name = j.name; if (!merged.company) merged.company = j.company; }
      if (joinTable === 'email_templates') merged.template_name = j.name;
      return merged;
    });
  }

  // WHERE
  const wm = rest.match(/WHERE\s+(.*?)(?:ORDER BY|LIMIT|OFFSET|GROUP BY|$)/is);
  if (wm) rows = rows.filter(r => matchRow(r, parseWhere(wm[1], params, 0)));

  // ORDER BY
  const om = rest.match(/ORDER BY\s+([\w.]+)\s*(DESC|ASC)?/i);
  if (om) {
    const f = om[1].split('.').pop();
    const d = (om[2]||'ASC').toUpperCase();
    rows.sort((a,b) => {
      const av = a[f] ?? ''; const bv = b[f] ?? '';
      return d==='DESC' ? (av<bv?1:av>bv?-1:0) : (av>bv?1:av<bv?-1:0);
    });
  }

  // LIMIT / OFFSET
  const offM = rest.match(/OFFSET\s+(\d+)/i);
  const limM = rest.match(/LIMIT\s+(\d+)/i);
  if (offM) rows = rows.slice(parseInt(offM[1]));
  if (limM) rows = rows.slice(0, parseInt(limM[1]));

  return rows;
}

// ─── Public API ───────────────────────────────────────────────────────────────
const db = {
  prepare(sql) {
    return {
      run(...params)  { execute(sql, params, 'run'); },
      get(...params)  { return execute(sql, params, 'get')[0] || undefined; },
      all(...params)  { return execute(sql, params, 'all'); },
    };
  },
  exec() {
    // Schema is handled by JSON structure, nothing to do
    const data = loadDb();
    saveDb(data);
  },
  pragma() {},
  waitReady: () => Promise.resolve(),
};

// Initialise on load
const _init = loadDb();
saveDb(_init);
console.log('✅ JSON database ready →', DB_PATH);

module.exports = db;
