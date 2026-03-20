// ══════════════════════════════════════════════════════════════
// src/api.js — ExSo API layer (Supabase)
// Устанавливать: npm install @supabase/supabase-js
// ══════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

// Генератор временных фронтенд-ID для rigEntries (не хранятся в БД)
let _idCounter = Date.now();
function genFrontendId() { return `fe_${++_idCounter}`; }

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default supabase;

// ──────────────────────────────────────────────────────────────
// AUTH
// ──────────────────────────────────────────────────────────────

export async function login(login, password) {
  // Supabase Auth использует email — используем login@exso.internal как email
  const email = `${login}@exso.internal`;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  // Загружаем профиль пользователя
  const { data: profile } = await supabase
    .from('users')
    .select('*, user_objects(object_id)')
    .eq('auth_id', data.user.id)
    .single();

  return {
    ...profile,
    oids: profile.role === 'foreman'
      ? profile.user_objects.map(r => r.object_id)
      : 'all',
  };
}

export async function logout() {
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('*, user_objects(object_id)')
    .eq('auth_id', user.id)
    .single();

  if (!profile) return null;
  return {
    ...profile,
    oids: profile.role === 'foreman'
      ? profile.user_objects.map(r => r.object_id)
      : 'all',
  };
}

// ──────────────────────────────────────────────────────────────
// OBJECTS
// ──────────────────────────────────────────────────────────────

export async function getObjects() {
  const { data, error } = await supabase
    .from('objects')
    .select('*')
    .order('id');
  if (error) throw error;
  return data;
}

export async function updateObject(id, updates) {
  const { data, error } = await supabase
    .from('objects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ──────────────────────────────────────────────────────────────
// RIGS
// ──────────────────────────────────────────────────────────────

export async function getRigs() {
  const { data, error } = await supabase
    .from('rigs')
    .select('*')
    .order('id');
  if (error) throw error;
  // Маппинг для совместимости с App.jsx (o = object_id)
  return data.map(r => ({ ...r, o: r.object_id, n: r.name }));
}

// ──────────────────────────────────────────────────────────────
// SHIFT REPORTS
// ──────────────────────────────────────────────────────────────

export async function getReports(filters = {}) {
  let query = supabase
    .from('shift_reports')
    .select(`
      *,
      rig_entries(*),
      downtime_events(*)
    `)
    .order('date', { ascending: false })
    .order('shift_type', { ascending: false });

  if (filters.objectId)  query = query.eq('object_id', filters.objectId);
  if (filters.status)    query = query.eq('status', filters.status);
  if (filters.dateFrom)  query = query.gte('date', filters.dateFrom);
  if (filters.dateTo)    query = query.lte('date', filters.dateTo);

  const { data, error } = await query;
  if (error) throw error;

  // Маппинг в формат App.jsx
  return data.map(mapReportFromDB);
}

export async function submitReport(repObj, userId) {
  // 1. Проверка дубликата на уровне API (доп. защита)
  const { data: existing } = await supabase
    .from('shift_reports')
    .select('id, status')
    .eq('object_id', repObj.oid)
    .eq('date', repObj.date)
    .eq('shift_type', repObj.sh)
    .not('status', 'eq', 'draft')
    .maybeSingle();

  if (existing) {
    throw new Error(
      `Отчёт за ${repObj.date} (${repObj.sh === 'day' ? 'дневная' : 'ночная'} смена) уже существует со статусом "${existing.status}"`
    );
  }

  // 2. Вставляем отчёт
  const { data: report, error: repError } = await supabase
    .from('shift_reports')
    .insert({
      object_id:          repObj.oid,
      date:               repObj.date,
      shift_type:         repObj.sh,
      shift_duration_hrs: repObj.shiftDurationHours || 11,
      df:                 repObj.df,
      bf:                 repObj.bf,
      wh:                 repObj.wh,
      dh:                 repObj.dh,
      fuel:               repObj.fuel,
      fuel_kg:            repObj.fuel_kg || 0,
      over_drill:         repObj.rigs?.reduce((s, r) => s + (r.overDrill || 0), 0) || 0,
      status:             'submitted',
      comment:            repObj.comment || null,
      submitted_by:       null,
      submitted_at:       new Date().toISOString(),
    })
    .select()
    .single();

  if (repError) throw repError;

  // 3. Вставляем строки по станкам
  if (repObj.rigs?.length) {
    const entries = repObj.rigs.map(r => ({
      report_id:       report.id,
      rig_id:          r.id,
      rig_name:        r.n,
      drilling_meters: r.df || 0,
      over_drill:      r.overDrill || 0,
      working_hours:   r.wh || 0,
      downtime_hours:  r.dh || 0,
      fuel_liters:     r.fuel || 0,
      notes:           r.dt || null,
    }));

    const { error: entryError } = await supabase
      .from('rig_entries')
      .insert(entries);
    if (entryError) throw entryError;
  }

  // 4. Вставляем простои
  if (repObj.downtime_events?.length) {
    const downtimes = repObj.downtime_events.map(d => ({
      report_id:      report.id,
      rig_id:         d.rig_id,
      rig_name:       d.rig_name,
      category:       d.category || d.cat,
      reason:         d.reason || d.sub,
      duration_hours: d.durationHours || d.hrs,
      comment:        d.comment || null,
    }));

    const { error: dtError } = await supabase
      .from('downtime_events')
      .insert(downtimes);
    if (dtError) throw dtError;
  }

  // 5. Перечитываем с полным join чтобы вернуть актуальные данные
  const { data: full, error: fetchError } = await supabase
    .from('shift_reports')
    .select('*, rig_entries(*), downtime_events(*)')
    .eq('id', report.id)
    .single();
  if (fetchError) throw fetchError;
  return mapReportFromDB(full);
}

export async function deleteReport(reportId) {
  // Удаляем связанные записи (если нет CASCADE в БД — удаляем вручную)
  await supabase.from('downtime_events').delete().eq('report_id', reportId);
  await supabase.from('rig_entries').delete().eq('report_id', reportId);

  const { error } = await supabase
    .from('shift_reports')
    .delete()
    .eq('id', reportId);
  if (error) throw error;
}

export async function updateReport(repObj, userId) {
  // 1. Обновляем основную строку отчёта
  const { error: repError } = await supabase
    .from('shift_reports')
    .update({
      date:               repObj.date,
      shift_type:         repObj.sh,
      df:                 repObj.df,
      bf:                 repObj.bf,
      wh:                 repObj.wh,
      dh:                 repObj.dh,
      fuel:               repObj.fuel,
      fuel_kg:            repObj.fuel_kg || 0,
      over_drill:         repObj.rigs?.reduce((s, r) => s + (r.overDrill || 0), 0) || 0,
      status:             repObj.status,
      comment:            repObj.comment || null,
      submitted_at:       new Date().toISOString(),
    })
    .eq('id', repObj.id);
  if (repError) throw repError;

  // 2. Перезаписываем rig_entries
  await supabase.from('rig_entries').delete().eq('report_id', repObj.id);
  if (repObj.rigs?.length) {
    const entries = repObj.rigs.map(r => ({
      report_id:       repObj.id,
      rig_id:          r.id,
      rig_name:        r.n,
      drilling_meters: r.df || 0,
      over_drill:      r.overDrill || 0,
      working_hours:   r.wh || 0,
      downtime_hours:  r.dh || 0,
      fuel_liters:     r.fuel || 0,
      notes:           r.dt || null,
    }));
    const { error: entryError } = await supabase.from('rig_entries').insert(entries);
    if (entryError) throw entryError;
  }

  // 3. Перезаписываем downtime_events
  await supabase.from('downtime_events').delete().eq('report_id', repObj.id);
  if (repObj.downtime_events?.length) {
    const downtimes = repObj.downtime_events.map(d => ({
      report_id:      repObj.id,
      rig_id:         d.rig_id,
      rig_name:       d.rig_name,
      category:       d.category || d.cat,
      reason:         d.reason || d.sub,
      duration_hours: d.durationHours || d.hrs,
      comment:        d.comment || null,
    }));
    const { error: dtError } = await supabase.from('downtime_events').insert(downtimes);
    if (dtError) throw dtError;
  }

  // 4. Перечитываем с полным join чтобы вернуть актуальные данные
  const { data: full, error: fetchError } = await supabase
    .from('shift_reports')
    .select('*, rig_entries(*), downtime_events(*)')
    .eq('id', repObj.id)
    .single();
  if (fetchError) throw fetchError;
  return mapReportFromDB(full);
}

export async function approveReport(reportId, updates, userId) {
  const { error } = await supabase
    .from('shift_reports')
    .update({
      ...updates,
      status:      'approved',
      approved_by: null,
      approved_at: new Date().toISOString(),
    })
    .eq('id', reportId);
  if (error) throw error;

  const { data, error: fetchError } = await supabase
    .from('shift_reports')
    .select('*, rig_entries(*), downtime_events(*)')
    .eq('id', reportId)
    .single();
  if (fetchError) throw fetchError;
  return mapReportFromDB(data);
}

// ──────────────────────────────────────────────────────────────
// PLANS
// ──────────────────────────────────────────────────────────────

export async function getPlans() {
  const { data, error } = await supabase
    .from('plans')
    .select('*');
  if (error) throw error;
  return data.map(p => ({
    ...p,
    oid:       p.object_id,
    periodKey: p.period_key,
    monthTotal: p.month_total,
  }));
}

export async function upsertPlan(plan) {
  const { data, error } = await supabase
    .from('plans')
    .upsert({
      object_id:   plan.oid,
      field:       plan.field,
      mode:        plan.mode,
      period_key:  plan.periodKey,
      month_total: plan.monthTotal,
      dates:       plan.dates,
    }, { onConflict: 'object_id,field,mode,period_key' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ──────────────────────────────────────────────────────────────
// МАППИНГ: DB → формат App.jsx
// ──────────────────────────────────────────────────────────────

function mapReportFromDB(r) {
  return {
    id:          r.id,
    oid:         r.object_id,
    date:        r.date,
    sh:          r.shift_type,
    df:          r.df,
    bf:          r.bf,
    wh:          r.wh,
    dh:          r.dh,
    fuel:        r.fuel,
    fuel_kg:     r.fuel_kg,
    overDrill:   r.over_drill || 0,
    status:      r.status,
    comment:     r.comment,
    by:          r.submitted_by,
    submittedAt: r.submitted_at,
    approvedAt:  r.approved_at || null,
    rigs: (r.rig_entries || []).map(e => ({
      id:        e.rig_id,
      n:         e.rig_name,
      df:        e.drilling_meters,
      overDrill: e.over_drill,
      wh:        e.working_hours,
      dh:        e.downtime_hours,
      fuel:      e.fuel_liters,
      dt:        e.notes || '—',
    })),
    downtime_events: (r.downtime_events || []).map(d => ({
      id:            d.id,
      rig_id:        d.rig_id,
      rig_name:      d.rig_name,
      category:      d.category,
      reason:        d.reason,
      durationHours: d.duration_hours,
      comment:       d.comment,
    })),
    rigEntries: (r.rig_entries || []).map(e => ({
      id:             genFrontendId(),
      rigId:          e.rig_id,
      rigName:        e.rig_name,
      workingHours:   String(e.working_hours  || ''),
      drillingMeters: String(e.drilling_meters || ''),
      overDrill:      String(e.over_drill      || ''),
      fuelLiters:     String(e.fuel_liters     || ''),
      notes:          e.notes || '',
      downtimes:      [],
    })),
  };
}

// ──────────────────────────────────────────────────────────────
// PLANS
// ──────────────────────────────────────────────────────────────

export async function savePlanToDB(plan) {
  const { data, error } = await supabase
    .from('plans')
    .upsert({
      object_id:   plan.oid,
      field:       plan.field,
      mode:        plan.mode || 'month',
      period_key:  plan.periodKey,
      month_total: plan.monthTotal ?? null,
      dates:       plan.dates || [],
    }, { onConflict: 'object_id,field,mode,period_key' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ──────────────────────────────────────────────────────────────
// KTG PLANS
// ──────────────────────────────────────────────────────────────

export async function saveKtgPlanToDB(plan) {
  const { data, error } = await supabase
    .from('ktg_plans')
    .upsert({
      object_id:   plan.object_id,
      year_month:  plan.year_month,
      status:      plan.status,
      items:       plan.items || {},
    }, { onConflict: 'object_id,year_month' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateKtgPlanStatus(objectId, yearMonth, status, extra = {}) {
  const { data, error } = await supabase
    .from('ktg_plans')
    .update({ status, ...extra })
    .eq('object_id', objectId)
    .eq('year_month', yearMonth)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getKtgPlans() {
  const { data, error } = await supabase
    .from('ktg_plans')
    .select('*')
    .order('year_month', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ──────────────────────────────────────────────────────────────
// USER MANAGEMENT (через Edge Function)
// ──────────────────────────────────────────────────────────────

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`;

async function callEdge(body) {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  const res = await fetch(EDGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Edge function error');
  return data;
}

export async function adminCreateUser({ login, password, name, role, ini, objectIds }) {
  return callEdge({ action: 'create', email: login, password, userData: { name, role, ini, objectIds } });
}

export async function adminUpdatePassword(authId, password) {
  return callEdge({ action: 'update_password', userId: authId, password });
}

export async function adminDeleteUser(authId) {
  return callEdge({ action: 'delete', userId: authId });
}

export async function adminListUsers() {
  const data = await callEdge({ action: 'list' });
  return (data.users || []).map(u => ({
    ...u,
    oids: u.role === 'foreman' ? (u.user_objects || []).map(r => r.object_id) : 'all',
  }));
}

// ──────────────────────────────────────────────────────────────
// ASSETS (nodes + passports + maintRecords)
// Таблицы: assets, asset_passports, asset_maint_records
// ──────────────────────────────────────────────────────────────

// ── Загрузить все активы ──────────────────────────────────────
export async function getAssets() {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .order('name');
  if (error) throw error;
  return data; // [{id, parent_id, name, type, cat_type, fuel_rate, desc, assigned_object_id, garage_num, created_by, created_at}]
}

// ── Сохранить/обновить один актив ────────────────────────────
export async function upsertAsset(asset) {
  const row = {
    id:                 asset.id,
    parent_id:          asset.parentId,
    name:               asset.name,
    type:               asset.type,
    cat_type:           asset.catType,
    fuel_rate:          asset.fuelRate,
    description:        asset.desc || '',
    assigned_object_id: asset.assigned_object_id ?? null,
    created_by:         asset.createdBy || 'system',
  };
  const { data, error } = await supabase
    .from('assets')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Загрузить все паспорта ────────────────────────────────────
export async function getPassports() {
  const { data, error } = await supabase
    .from('asset_passports')
    .select('*');
  if (error) throw error;
  // Convert array → object keyed by asset_id
  const result = {};
  (data || []).forEach(row => {
    result[row.asset_id] = {
      assetClass:      row.asset_class,
      manufacturer:    row.manufacturer,
      model:           row.model,
      serial:          row.serial,
      year:            row.year,
      inventory:       row.inventory,
      reg_plate:       row.reg_plate,
      engine_vol:      row.engine_vol,
      commissioned:    row.commissioned,
      total_hours:     row.total_hours,
      moto_hours:      row.moto_hours,
      moto_hours_log:  row.moto_hours_log || [],
      avg_monthly:     row.avg_monthly,
      fuel_rate:       row.fuel_rate,
      location:        row.location,
      toSchedule:      row.to_schedule || [{name:"ТО-250",interval:250,duration_hrs:2}],
    };
  });
  return result;
}

// ── Сохранить/обновить паспорт актива ────────────────────────
export async function upsertPassport(assetId, passport) {
  const row = {
    asset_id:        assetId,
    asset_class:     passport.assetClass,
    manufacturer:    passport.manufacturer,
    model:           passport.model,
    serial:          passport.serial,
    year:            passport.year,
    inventory:       passport.inventory,
    reg_plate:       passport.reg_plate,
    engine_vol:      passport.engine_vol,
    commissioned:    passport.commissioned,
    total_hours:     passport.total_hours,
    moto_hours:      passport.moto_hours,
    moto_hours_log:  passport.moto_hours_log || [],
    avg_monthly:     passport.avg_monthly,
    fuel_rate:       passport.fuel_rate,
    location:        passport.location,
    to_schedule:     passport.toSchedule || [{name:"ТО-250",interval:250,duration_hrs:2}],
  };
  const { data, error } = await supabase
    .from('asset_passports')
    .upsert(row, { onConflict: 'asset_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Загрузить все записи ТО ───────────────────────────────────
export async function getMaintRecords() {
  const { data, error } = await supabase
    .from('asset_maint_records')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  // Convert to {assetId: [{id,date,type,hours,note,by}]}
  const result = {};
  (data || []).forEach(row => {
    if (!result[row.asset_id]) result[row.asset_id] = [];
    result[row.asset_id].push({
      id:    row.id,
      date:  row.date,
      type:  row.type,
      hours: row.hours,
      note:  row.note,
      by:    row.by,
    });
  });
  return result;
}

// ── Добавить запись ТО ────────────────────────────────────────
export async function addMaintRecord(assetId, record) {
  const row = {
    id:       record.id,
    asset_id: assetId,
    date:     record.date,
    type:     record.type,
    hours:    record.hours,
    note:     record.note || '',
    by:       record.by || 'system',
  };
  const { data, error } = await supabase
    .from('asset_maint_records')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Удалить запись ТО ─────────────────────────────────────────
export async function deleteMaintRecord(recordId) {
  const { error } = await supabase
    .from('asset_maint_records')
    .delete()
    .eq('id', recordId);
  if (error) throw error;
}

// ──────────────────────────────────────────────────────────────
// INVENTORY (storage_units + inv_txns)
// ──────────────────────────────────────────────────────────────

export async function getStorageUnits() {
  const { data, error } = await supabase
    .from('storage_units')
    .select('*')
    .order('oid')
    .order('name');
  if (error) throw error;
  return (data || []).map(r => ({
    id:         r.id,
    oid:        r.oid,
    name:       r.name,
    item_type:  r.item_type,
    item_name:  r.item_name,
    unit:       r.unit,
    capacity:   r.capacity,
    min_level:  r.min_level,
  }));
}

export async function upsertStorageUnit(unit) {
  const { data, error } = await supabase
    .from('storage_units')
    .upsert({ id: unit.id, oid: unit.oid, name: unit.name, item_type: unit.item_type,
              item_name: unit.item_name, unit: unit.unit, capacity: unit.capacity,
              min_level: unit.min_level }, { onConflict: 'id' })
    .select().single();
  if (error) throw error;
  return data;
}

export async function deleteStorageUnit(id) {
  const { error } = await supabase.from('storage_units').delete().eq('id', id);
  if (error) throw error;
}

export async function getInvTxns() {
  const { data, error } = await supabase
    .from('inv_txns')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(r => ({
    id:          r.id,
    su_id:       r.su_id,
    txn_type:    r.txn_type,
    qty:         r.qty,
    date:        r.date,
    doc_ref:     r.doc_ref,
    note:        r.note,
    asset_id:    r.asset_id,
    recorded_by: r.recorded_by,
  }));
}

export async function addInvTxn(txn) {
  const { data, error } = await supabase
    .from('inv_txns')
    .upsert({ id: txn.id, su_id: txn.su_id, txn_type: txn.txn_type, qty: txn.qty,
              date: txn.date, doc_ref: txn.doc_ref || '', note: txn.note || '',
              asset_id: txn.asset_id || null, recorded_by: txn.recorded_by || 'system' },
             { onConflict: 'id' })
    .select().single();
  if (error) throw error;
  return data;
}
