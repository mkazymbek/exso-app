// ══════════════════════════════════════════════════════════════
// src/api.js — ExSo API layer (Supabase)
// Устанавливать: npm install @supabase/supabase-js
// ══════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

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

  return mapReportFromDB(report);
}

export async function approveReport(reportId, updates, userId) {
  const { data, error } = await supabase
    .from('shift_reports')
    .update({
      ...updates,
      status:      'approved',
      approved_by: null,
      approved_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .select()
    .single();
  if (error) throw error;
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
    id:     r.id,
    oid:    r.object_id,
    date:   r.date,
    sh:     r.shift_type,
    df:     r.df,
    bf:     r.bf,
    wh:     r.wh,
    dh:     r.dh,
    fuel:   r.fuel,
    fuel_kg: r.fuel_kg,
    status: r.status,
    comment: r.comment,
    by:     r.submitted_by,
    submittedAt: r.submitted_at,
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
    rigEntries: r.rig_entries || [],
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
