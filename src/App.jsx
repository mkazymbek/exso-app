import { useState, useMemo } from "react";

// ─── THEMES ───────────────────────────────────────────────────────────────────
const DARK = {
  bg0: "#05080f", bg1: "#090d18", bg2: "#0d1421", bg3: "#111b2e",
  border: "#1e2f4a", borderHi: "#2a4066",
  red: "#e8212e", redDim: "#b01920",
  amber: "#f59e0b", green: "#10b981", blue: "#3b82f6",
  violet: "#8b5cf6", cyan: "#06b6d4",
  txt0: "#f0f4ff", txt1: "#9db3d4", txt2: "#5a7499",
  rowAlt: "rgba(0,0,0,0.2)", rowHdr: "rgba(0,0,0,0.35)",
  inputBg: "#090d18", inputBgFocus: "#0d1421",
  cardSh: "rgba(0,0,0,0.25)", modalBg: "rgba(3,5,10,0.92)",
};
const LIGHT = {
  bg0: "#eef2f7", bg1: "#e2e8f2", bg2: "#ffffff", bg3: "#f4f7fb",
  border: "#c8d4e8", borderHi: "#a2b4cf",
  red: "#c41020", redDim: "#9e0c1a",
  amber: "#d97706", green: "#059669", blue: "#2563eb",
  violet: "#7c3aed", cyan: "#0891b2",
  txt0: "#0d1520", txt1: "#364b66", txt2: "#6b7fa0",
  rowAlt: "rgba(0,0,0,0.025)", rowHdr: "rgba(0,0,0,0.055)",
  inputBg: "#ffffff", inputBgFocus: "#f9fafc",
  cardSh: "rgba(0,0,0,0.04)", modalBg: "rgba(10,20,40,0.65)",
};

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────
const INIT_OBJS = [
  { id: 1, name: "Борлы",      dp: 0, bp: 0, kp: 0 },
  { id: 2, name: "Коскудук",   dp: 0, bp: 0, kp: 0 },
  { id: 3, name: "Бактай",     dp: 0, bp: 0, kp: 0 },
  { id: 4, name: "Жолымбек",   dp: 0, bp: 0, kp: 0 },
  { id: 5, name: "Шыганак",    dp: 0, bp: 0, kp: 0 },
  { id: 6, name: "Сарыопан",   dp: 0, bp: 0, kp: 0 },
  { id: 7, name: "Улькенсай",  dp: 0, bp: 0, kp: 0 },
];
const INIT_RIGS = [
  { id: 1,  n: "ROC 107",   o: 1 }, { id: 2,  n: "ROC 108",   o: 1 }, { id: 3,  n: "JK 103",    o: 1 },
  { id: 4,  n: "JK 109",   o: 2 }, { id: 5,  n: "JK 110",   o: 2 }, { id: 6,  n: "JK 111",   o: 2 },
  { id: 7,  n: "JK 115",   o: 2 }, { id: 8,  n: "JK 177",   o: 2 },
  { id: 9,  n: "JK 112",   o: 3 }, { id: 10, n: "JK 113",   o: 3 }, { id: 11, n: "JK 114",   o: 3 },
  { id: 12, n: "JK 116",   o: 3 }, { id: 13, n: "JK 106",   o: 3 }, { id: 14, n: "ZEGA 117", o: 3 },
  { id: 15, n: "JK 119",   o: 4 }, { id: 16, n: "JK 120",   o: 4 }, { id: 17, n: "JK 121",   o: 4 },
];
const INIT_USERS = [
  { id: 1, name: "Иванов А.С.",    login: "ceo",      pw: "ceo123",   role: "ceo",      oids: "all", ini: "ИА" },
  { id: 2, name: "Петренко Д.В.",  login: "engineer", pw: "eng123",   role: "engineer", oids: "all", ini: "ПД" },
  { id: 3, name: "Сейткали Е.Б.",  login: "seitkali", pw: "foreman1", role: "foreman",  oids: [1,3], ini: "СЕ" },
  { id: 4, name: "Момбеков Т.Р.",  login: "mombekov", pw: "foreman2", role: "foreman",  oids: [2],   ini: "МТ" },
  { id: 5, name: "Жанабеков К.А.", login: "zhanab",   pw: "foreman3", role: "foreman",  oids: [4],   ini: "ЖК" },
  { id: 6, name: "Асанов Б.М.",     login: "mechanic", pw: "mech123",  role: "mechanic", oids: "all", ini: "АБ" },
];

function makeRep(id, oid, date, sh, by, rows, status = "approved") {
  const df   = rows.reduce((s, r) => s + r[2], 0);
  const bf   = rows.reduce((s, r) => s + r[3], 0);
  const wh   = rows.reduce((s, r) => s + r[4], 0);
  const dh   = rows.reduce((s, r) => s + r[5], 0);
  const fuel = rows.reduce((s, r) => s + r[6], 0);
  return {
    id, oid, date, sh, df, bf, wh, dh, fuel, status, by,
    rigs: rows.map(r => ({ id: r[0], n: r[1], df: r[2], bf: r[3], wh: r[4], dh: r[5], fuel: r[6], dt: r[7] || "—" })),
  };
}

const INIT_REPS = [];

// ─── INITIAL PLANS ────────────────────────────────────────────────────────────
// Plan structure: { id, oid, weekStart (YYYY-MM-DD), df, bf, kp, days: [{date, df, bf, kp}] }
// weekStart = Monday of that week
function makeDayPlans(weekStart, df, bf, kp) {
  const days = [];
  const base = new Date(weekStart);
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    days.push({
      date: d.toISOString().slice(0, 10),
      df: Math.round(df / 7),
      bf: Math.round(bf / 7),
      kp,
    });
  }
  // Distribute rounding remainder to first day
  const sumDf = days.reduce((s, d) => s + d.df, 0);
  const sumBf = days.reduce((s, d) => s + d.bf, 0);
  days[0].df += df - sumDf;
  days[0].bf += bf - sumBf;
  return days;
}

const INIT_PLANS = [];

// ─── EAM 1.1 INITIAL NODES ────────────────────────────────────────────────────
// node_type: COMPANY | CATEGORY | ASSET | COMPONENT
// category_type: DRILL_RIG | MIXER | HYDRO | HILUX | TRUCK
const now = new Date().toISOString().slice(0,10);
const INIT_NODES = [
  { id:"root",  parentId:null,      name:"ExSo",                        type:"COMPANY",  catType:null,          desc:"Головная компания",        createdBy:"system", createdAt:now },
  { id:"c1",    parentId:"root",    name:"Буровые станки",               type:"CATEGORY", catType:"DRILL_RIG",   desc:"Буровое оборудование",     createdBy:"system", createdAt:now },
  { id:"c2",    parentId:"root",    name:"Смесительно-зарядные машины",  type:"CATEGORY", catType:"MIXER",       desc:"СЗМ",                      createdBy:"system", createdAt:now },
  { id:"c3",    parentId:"root",    name:"Гидромолоты",  type:"CATEGORY", catType:"HYDRO",  desc:"Гидравлическое оборудование", createdBy:"system", createdAt:now },
  { id:"c6",    parentId:"root",    name:"Экскаваторы",  type:"CATEGORY", catType:"EXCAVATOR", desc:"Экскаваторная техника",      createdBy:"system", createdAt:now },
  { id:"c4",    parentId:"root",    name:"Лёгкие автомобили (Toyota Hilux)", type:"CATEGORY", catType:"HILUX",  desc:"Лёгкий автотранспорт",     createdBy:"system", createdAt:now },
  { id:"c5",    parentId:"root",    name:"Грузовые машины",              type:"CATEGORY", catType:"TRUCK",       desc:"Грузовой автотранспорт",   createdBy:"system", createdAt:now },
  // Drill rigs — assigned to objects
  { id:"a1",  parentId:"c1", name:"ROC 107",  type:"ASSET", catType:null, desc:"", assigned_object_id:1, createdBy:"system", createdAt:now },
  { id:"a2",  parentId:"c1", name:"ROC 108",  type:"ASSET", catType:null, desc:"", assigned_object_id:1, createdBy:"system", createdAt:now },
  { id:"a3",  parentId:"c1", name:"JK 103",   type:"ASSET", catType:null, desc:"", assigned_object_id:1, createdBy:"system", createdAt:now },
  { id:"a4",  parentId:"c1", name:"JK 109",   type:"ASSET", catType:null, desc:"", assigned_object_id:2, createdBy:"system", createdAt:now },
  { id:"a5",  parentId:"c1", name:"JK 110",   type:"ASSET", catType:null, desc:"", assigned_object_id:2, createdBy:"system", createdAt:now },
  { id:"a6",  parentId:"c1", name:"JK 111",   type:"ASSET", catType:null, desc:"", assigned_object_id:2, createdBy:"system", createdAt:now },
  { id:"a7",  parentId:"c1", name:"JK 115",   type:"ASSET", catType:null, desc:"", assigned_object_id:2, createdBy:"system", createdAt:now },
  { id:"a8",  parentId:"c1", name:"JK 177",   type:"ASSET", catType:null, desc:"", assigned_object_id:2, createdBy:"system", createdAt:now },
  { id:"a9",  parentId:"c1", name:"JK 112",   type:"ASSET", catType:null, desc:"", assigned_object_id:3, createdBy:"system", createdAt:now },
  { id:"a10", parentId:"c1", name:"JK 113",   type:"ASSET", catType:null, desc:"", assigned_object_id:3, createdBy:"system", createdAt:now },
  { id:"a11", parentId:"c1", name:"JK 114",   type:"ASSET", catType:null, desc:"", assigned_object_id:3, createdBy:"system", createdAt:now },
  { id:"a12", parentId:"c1", name:"JK 116",   type:"ASSET", catType:null, desc:"", assigned_object_id:3, createdBy:"system", createdAt:now },
  { id:"a13", parentId:"c1", name:"JK 106",   type:"ASSET", catType:null, desc:"", assigned_object_id:3, createdBy:"system", createdAt:now },
  { id:"a14", parentId:"c1", name:"ZEGA 117", type:"ASSET", catType:null, desc:"", assigned_object_id:3, createdBy:"system", createdAt:now },
  { id:"a15", parentId:"c1", name:"JK 119",   type:"ASSET", catType:null, desc:"", assigned_object_id:4, createdBy:"system", createdAt:now },
  { id:"a16", parentId:"c1", name:"JK 120",   type:"ASSET", catType:null, desc:"", assigned_object_id:4, createdBy:"system", createdAt:now },
  { id:"a17", parentId:"c1", name:"JK 121",   type:"ASSET", catType:null, desc:"", assigned_object_id:4, createdBy:"system", createdAt:now },
  // Components for ROC 107
  { id:"k1", parentId:"a1", name:"Двигатель",   type:"COMPONENT", catType:null, desc:"", createdBy:"system", createdAt:now },
  { id:"k2", parentId:"a1", name:"Компрессор",  type:"COMPONENT", catType:null, desc:"", createdBy:"system", createdAt:now },
  { id:"k3", parentId:"a1", name:"Гидравлика",  type:"COMPONENT", catType:null, desc:"", createdBy:"system", createdAt:now },
  // Demo assets for other categories
  { id:"b1", parentId:"c2", name:"СЗМ-01", type:"ASSET", catType:null, desc:"", createdBy:"system", createdAt:now },
  { id:"b2", parentId:"c2", name:"СЗМ-02", type:"ASSET", catType:null, desc:"", createdBy:"system", createdAt:now },
  { id:"h1", parentId:"c3", name:"Гидромолот HB-01",  type:"ASSET", catType:null, desc:"", createdBy:"system", createdAt:now },
  { id:"h2", parentId:"c6", name:"Экскаватор EX-320", type:"ASSET", catType:null, desc:"", createdBy:"system", createdAt:now },
  { id:"v1", parentId:"c4", name:"Hilux-01", type:"ASSET", catType:null, desc:"", createdBy:"system", createdAt:now },
  { id:"v2", parentId:"c4", name:"Hilux-02", type:"ASSET", catType:null, desc:"", createdBy:"system", createdAt:now },
  { id:"t1", parentId:"c5", name:"Камаз-001",  type:"ASSET", catType:null, desc:"", createdBy:"system", createdAt:now },
  { id:"t2", parentId:"c5", name:"Вольво-002", type:"ASSET", catType:null, desc:"", createdBy:"system", createdAt:now },
];

// ─── EAM 1.2 INITIAL DATA ──────────────────────────────────────────────────────
// Asset passport data keyed by node id
const CAT_TYPE_LABEL = { DRILL_RIG:"Буровой станок", MIXER:"СЗМ", HYDRO:"Гидромолот", EXCAVATOR:"Экскаватор", HILUX:"Toyota Hilux", TRUCK:"Грузовой автомобиль" };
const PURPOSE_OPTIONS = ["Бурение","Зарядка","Доставка","Вспомогательные работы","Техническое обслуживание"];
const METER_UNIT_CFG  = { ENGINE_HOURS:"мч", KM:"км", CYCLES:"цикл" };

const INIT_PASSPORTS = {
  a1:  { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"Atlas Copco",      model:"ROC L8",   serial:"SN-2019-107", year:"2019", inventory:"ДС-107", moto_hours:14200 },
  a2:  { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"Atlas Copco",      model:"ROC L8",   serial:"SN-2020-108", year:"2020", inventory:"ДС-108", moto_hours:11800 },
  a3:  { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"Sandvik",          model:"JK590",    serial:"SN-2018-103", year:"2018", inventory:"ДС-103", moto_hours:18500 },
  a4:  { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"Sandvik",          model:"JK590",    serial:"SN-2019-109", year:"2019", inventory:"ДС-109", moto_hours:15300 },
  a5:  { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"Sandvik",          model:"JK590",    serial:"SN-2019-110", year:"2019", inventory:"ДС-110", moto_hours:14900 },
  a6:  { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"Sandvik",          model:"JK590",    serial:"SN-2020-111", year:"2020", inventory:"ДС-111", moto_hours:12400 },
  a7:  { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"Sandvik",          model:"JK590",    serial:"SN-2018-115", year:"2018", inventory:"ДС-115", moto_hours:19100 },
  a8:  { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"Sandvik",          model:"JK590",    serial:"SN-2017-177", year:"2017", inventory:"ДС-177", moto_hours:22600 },
  a9:  { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"Sandvik",          model:"JK590",    serial:"SN-2019-112", year:"2019", inventory:"ДС-112", moto_hours:14700 },
  a10: { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"Sandvik",          model:"JK590",    serial:"SN-2019-113", year:"2019", inventory:"ДС-113", moto_hours:14200 },
  a11: { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"Sandvik",          model:"JK590",    serial:"SN-2020-114", year:"2020", inventory:"ДС-114", moto_hours:13100 },
  a12: { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"Sandvik",          model:"JK590",    serial:"SN-2018-116", year:"2018", inventory:"ДС-116", moto_hours:17800 },
  a13: { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"Sandvik",          model:"JK590",    serial:"SN-2018-106", year:"2018", inventory:"ДС-106", moto_hours:18200 },
  a14: { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"ZEGA",             model:"ZD-117",   serial:"ZG-2021-117", year:"2021", inventory:"ДС-117", moto_hours:8900  },
  a15: { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"Sandvik",          model:"JK590",    serial:"SN-2020-119", year:"2020", inventory:"ДС-119", moto_hours:12300 },
  a16: { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"Sandvik",          model:"JK590",    serial:"SN-2020-120", year:"2020", inventory:"ДС-120", moto_hours:11900 },
  a17: { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"Sandvik",          model:"JK590",    serial:"SN-2021-121", year:"2021", inventory:"ДС-121", moto_hours:9400  },
  b1:  { assetClass:"MIXER",     purpose:"Зарядка",  manufacturer:"НПП ГалоПолимер", model:"СЗМ-30",   serial:"СЗМ-2020-01", year:"2020", inventory:"СЗМ-01", moto_hours:6200  },
  b2:  { assetClass:"MIXER",     purpose:"Зарядка",  manufacturer:"НПП ГалоПолимер", model:"СЗМ-30",   serial:"СЗМ-2020-02", year:"2020", inventory:"СЗМ-02", moto_hours:5800  },
  h1:  { assetClass:"HYDRO",     purpose:"Вспомогательные работы", manufacturer:"Atlas Copco", model:"HB 3600",  serial:"HB-2019-01", year:"2019", inventory:"ГМ-01", moto_hours:9400 },
  h2:  { assetClass:"EXCAVATOR", purpose:"Вспомогательные работы", manufacturer:"Komatsu",     model:"PC320",    serial:"PC-2020-01", year:"2020", inventory:"ЭК-01", moto_hours:11200 },
  v1:  { assetClass:"HILUX",     purpose:"Доставка", manufacturer:"Toyota",           model:"Hilux",    serial:"TH-2021-01", year:"2021", inventory:"АВ-01", moto_hours:0 },
  v2:  { assetClass:"HILUX",     purpose:"Доставка", manufacturer:"Toyota",           model:"Hilux",    serial:"TH-2022-02", year:"2022", inventory:"АВ-02", moto_hours:0 },
  t1:  { assetClass:"TRUCK",     purpose:"Доставка", manufacturer:"КАМАЗ",            model:"65115",    serial:"KM-2018-01", year:"2018", inventory:"ГА-01", moto_hours:0 },
  t2:  { assetClass:"TRUCK",     purpose:"Доставка", manufacturer:"Volvo",            model:"FH 460",   serial:"VL-2019-02", year:"2019", inventory:"ГА-02", moto_hours:0 },
};

const INIT_METERS = {
  // a1 ROC 107
  a1: { type:"ENGINE_HOURS", current:14200, history:[
    { id:"m1", value:14200, delta:null, recordedAt:"2026-03-04", recordedBy:"Асанов Б.М.", note:"Плановый съём" },
    { id:"m2", value:13800, delta:null, recordedAt:"2026-02-01", recordedBy:"Асанов Б.М.", note:"" },
  ]},
  a3: { type:"ENGINE_HOURS", current:18500, history:[
    { id:"m3", value:18500, delta:null, recordedAt:"2026-03-01", recordedBy:"Асанов Б.М.", note:"" },
  ]},
  v1: { type:"KM",           current:87400, history:[
    { id:"m4", value:87400, delta:null, recordedAt:"2026-03-04", recordedBy:"Асанов Б.М.", note:"" },
  ]},
  t1: { type:"KM",           current:142000, history:[
    { id:"m5", value:142000, delta:null, recordedAt:"2026-03-04", recordedBy:"Асанов Б.М.", note:"" },
  ]},
};

// Measurement points: { [assetId]: [{ id, name, unit, dataType, isActive }] }
const INIT_POINTS = {
  a1: [
    { id:"p1", name:"Давление масла",    unit:"bar",  dataType:"NUMBER", isActive:true },
    { id:"p2", name:"Температура ОЖ",    unit:"°C",   dataType:"NUMBER", isActive:true },
    { id:"p3", name:"Уровень гидрожидк.", unit:"%",   dataType:"NUMBER", isActive:true },
    { id:"p4", name:"Заряд АКБ",         unit:"В",    dataType:"NUMBER", isActive:true },
  ],
};

// Measurements: { [pointId]: [{ id, value, measuredAt, recordedBy, note }] }
const INIT_MEASUREMENTS = {
  p1: [
    { id:"ms1", value:"5.2", measuredAt:"2026-03-04 08:00", recordedBy:"Асанов Б.М.", note:"Норма" },
    { id:"ms2", value:"4.8", measuredAt:"2026-02-28 08:00", recordedBy:"Асанов Б.М.", note:"" },
  ],
  p2: [
    { id:"ms3", value:"82", measuredAt:"2026-03-04 08:00", recordedBy:"Асанов Б.М.", note:"" },
  ],
};

// Properties: { [assetId]: [{ id, key, valueType, value }] }
const INIT_PROPERTIES = {
  a1: [
    { id:"pr1", key:"Глубина бурения макс.", valueType:"string", value:"40 м" },
    { id:"pr2", key:"Диаметр долота",         valueType:"string", value:"127–178 мм" },
    { id:"pr3", key:"Масса",                  valueType:"string", value:"18 500 кг" },
    { id:"pr4", key:"Двигатель",              valueType:"string", value:"Caterpillar C9" },
  ],
};


// ─── EAM 1.4 INITIAL DATA ─────────────────────────────────────────────────────
const INIT_LOCATIONS = [
  { id:"loc1", name:"Борлы",           type:"SITE" },
  { id:"loc2", name:"Коскудук",        type:"SITE" },
  { id:"loc3", name:"Бактай",          type:"SITE" },
  { id:"loc4", name:"Жолымбек",        type:"SITE" },
  { id:"loc5", name:"Шыганак",         type:"SITE" },
  { id:"loc6", name:"Сарыопан",        type:"SITE" },
  { id:"loc7", name:"Улькенсай",       type:"SITE" },
  { id:"loc8", name:"Центральный склад", type:"WAREHOUSE" },
  { id:"loc9", name:"АТЦ Алматы",      type:"SERVICE_CENTER" },
  { id:"loc10",name:"Sandvik KZ",       type:"SERVICE_CENTER" },
  { id:"loc11",name:"Epiroc KZ",        type:"SERVICE_CENTER" },
];

const MOVEMENT_TYPE_CFG = {
  TRANSFER:            { label:"Перемещение",       icon:"🚚", color:"#3b82f6" },
  SEND_TO_REPAIR:      { label:"Передача в ремонт", icon:"🔧", color:"#f59e0b" },
  RETURN_FROM_REPAIR:  { label:"Возврат из ремонта",icon:"✅", color:"#10b981" },
  WRITE_OFF:           { label:"Списание",           icon:"🗑", color:"#ef4444" },
  CONSERVATION:        { label:"Консервация",        icon:"📦", color:"#8b5cf6" },
};

const LIFECYCLE_STATUS_CFG = {
  IN_SERVICE:  { label:"В работе",    color:"#10b981" },
  IN_REPAIR:   { label:"В ремонте",   color:"#f59e0b" },
  STORED:      { label:"На хранении", color:"#3b82f6" },
  WRITTEN_OFF: { label:"Списан",      color:"#ef4444" },
  CONSERVED:   { label:"Законсервирован", color:"#8b5cf6" },
};

const LOCATION_TYPE_CFG = {
  SITE:           { label:"Участок",          color:"#10b981" },
  WAREHOUSE:      { label:"Склад",            color:"#3b82f6" },
  SERVICE_CENTER: { label:"Сервис-центр",     color:"#f59e0b" },
  OTHER:          { label:"Другое",           color:"#94a3b8" },
};

// Demo movements
const INIT_MOVEMENTS = [
  { id:"mv1", nodeId:"a1", nodeTypeSnap:"ASSET", movType:"TRANSFER",
    fromLocId:"loc2", toLocId:"loc1", serviceProvider:null,
    reason:"Перевод по производственной необходимости", docRef:"АКТ-2026-001",
    performedAt:"2026-02-15", performedBy:"Асанов Б.М.", comment:"" },
  { id:"mv2", nodeId:"a3", nodeTypeSnap:"ASSET", movType:"SEND_TO_REPAIR",
    fromLocId:"loc1", toLocId:"loc9", serviceProvider:"АТЦ Алматы",
    reason:"Отказ компрессора", docRef:"НАК-2026-012",
    performedAt:"2026-03-01", performedBy:"Асанов Б.М.", comment:"Гарантийный ремонт" },
];

// Current location per node (nodeId -> locId)
const INIT_CUR_LOCATIONS = {
  a1:"loc1", a2:"loc1", a3:"loc1",
  a4:"loc2", a5:"loc2", a6:"loc2", a7:"loc2", a8:"loc2",
  a9:"loc3", a10:"loc3", a11:"loc3", a12:"loc3", a13:"loc3", a14:"loc3",
  a15:"loc4", a16:"loc4", a17:"loc4",
  b1:"loc1", b2:"loc1",
  h1:"loc2", h2:"loc3",
  v1:"loc1", v2:"loc2",
  t1:"loc1", t2:"loc3",
};

// Lifecycle status per node
const INIT_LIFECYCLE = {
  a3:"IN_REPAIR",
};

// ─── EAM 1.5 INITIAL DATA ─────────────────────────────────────────────────────
const WARRANTY_TYPE_CFG = {
  MANUFACTURER: { label:"Производитель", icon:"🏭", color:"#3b82f6" },
  SERVICE:      { label:"Сервис",        icon:"🔧", color:"#10b981" },
};
const WARRANTY_STATUS_CFG = {
  ACTIVE:         { label:"Активна",         color:"#10b981", icon:"✅" },
  EXPIRING_SOON:  { label:"Истекает",        color:"#f59e0b", icon:"⚠️" },
  EXPIRED:        { label:"Истекла",         color:"#ef4444", icon:"❌" },
};
const EXPIRING_THRESHOLD_DAYS = 30;

function calcWarrantyStatus(endDate) {
  const today = new Date(); today.setHours(0,0,0,0);
  const end   = new Date(endDate);
  const diff  = Math.round((end - today) / 86400000);
  if (diff < 0)  return "EXPIRED";
  if (diff <= EXPIRING_THRESHOLD_DAYS) return "EXPIRING_SOON";
  return "ACTIVE";
}

const INIT_W_PROVIDERS = [
  { id:"wp1", type:"MANUFACTURER", name:"Atlas Copco",   contactName:"Сервисный отдел", contactPhone:"+7 727 123 4567", contactEmail:"service@atlascopco.kz", notes:"" },
  { id:"wp2", type:"MANUFACTURER", name:"Sandvik",        contactName:"",                contactPhone:"+7 727 234 5678", contactEmail:"sandvik@kz.sandvik.com", notes:"" },
  { id:"wp3", type:"MANUFACTURER", name:"Epiroc",         contactName:"",                contactPhone:"+7 727 345 6789", contactEmail:"epiroc@kz.epiroc.com",   notes:"" },
  { id:"wp4", type:"MANUFACTURER", name:"Toyota",         contactName:"",                contactPhone:"+7 727 456 7890", contactEmail:"toyota@toyota.kz",        notes:"" },
  { id:"wp5", type:"SERVICE",      name:"АТЦ Алматы",    contactName:"Ержан",           contactPhone:"+7 701 111 2222", contactEmail:"atc@alm.kz",             notes:"Официальный дилер Atlas Copco" },
  { id:"wp6", type:"SERVICE",      name:"Sandvik KZ",     contactName:"",                contactPhone:"+7 701 333 4444", contactEmail:"service@sandvik.kz",     notes:"" },
];

const INIT_WARRANTIES = [
  { id:"w1", nodeId:"a1", providerName:"Atlas Copco", providerId:"wp1", wType:"MANUFACTURER",
    contractRef:"AC-2024-107", startDate:"2024-01-01", endDate:"2026-06-30",
    coverage:"Двигатель, компрессор, гидравлика", exclusions:"Расходные материалы, шины",
    contactPerson:"Сервисный отдел", contactPhone:"+7 727 123 4567", contactEmail:"service@atlascopco.kz",
    notes:"", createdBy:"Асанов Б.М.", createdAt:"2024-01-15", updatedAt:"2024-01-15" },
  { id:"w2", nodeId:"a2", providerName:"Atlas Copco", providerId:"wp1", wType:"MANUFACTURER",
    contractRef:"AC-2024-108", startDate:"2024-06-01", endDate:"2026-12-31",
    coverage:"Полная гарантия производителя", exclusions:"Механические повреждения по вине оператора",
    contactPerson:"", contactPhone:"", contactEmail:"",
    notes:"", createdBy:"Асанов Б.М.", createdAt:"2024-06-15", updatedAt:"2024-06-15" },
  { id:"w3", nodeId:"v1", providerName:"Toyota", providerId:"wp4", wType:"MANUFACTURER",
    contractRef:"TY-2021-01", startDate:"2021-03-01", endDate:"2024-03-01",
    coverage:"Кузов, агрегаты", exclusions:"",
    contactPerson:"", contactPhone:"", contactEmail:"",
    notes:"Истекла", createdBy:"Асанов Б.М.", createdAt:"2021-03-01", updatedAt:"2021-03-01" },
  { id:"w4", nodeId:"a14", providerName:"Epiroc", providerId:"wp3", wType:"MANUFACTURER",
    contractRef:"EP-2022-117", startDate:"2022-03-01", endDate:"2027-03-31",
    coverage:"Полная гарантия 5 лет", exclusions:"",
    contactPerson:"", contactPhone:"", contactEmail:"",
    notes:"", createdBy:"Асанов Б.М.", createdAt:"2022-03-01", updatedAt:"2022-03-01" },
];


// ─── UTILS ────────────────────────────────────────────────────────────────────
function pct(f, p) { return p > 0 ? Math.round(f / p * 100) : null; }
function ktgCalc(w, d) { return (w + d) > 0 ? Math.round(w / (w + d) * 100) : null; }
function genId() { return Date.now() + Math.floor(Math.random() * 10000); }
function toNum(v) { return parseFloat(v) || 0; }
function scoreColor(v, ok, warn, T) {
  if (!T || v === null || v === undefined) return "#718096";
  if (v >= ok)   return T.green;
  if (v >= warn) return T.amber;
  return "#ef4444";
}
const OBJ_COLORS = (T) => [T.red, T.amber, T.cyan, T.violet];
const ROLE_LABEL = { ceo: "CEO", engineer: "Инженер", foreman: "Нач. участка", mechanic: "Механик" };

const STATUS_BADGE = {
  draft:     { bg: "rgba(90,116,153,0.15)",  border: "rgba(90,116,153,0.3)",  color: "#718096", label: "Черновик" },
  submitted: { bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.35)", color: "#60a5fa", label: "На проверке" },
  approved:  { bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.35)", color: "#10b981", label: "Утверждено" },
  rejected:  { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.35)",  color: "#f87171", label: "Отклонено" },
};

// ─── PRIMITIVE COMPONENTS ─────────────────────────────────────────────────────
const KTG_DAY_STATUS = {
  READY:       { label:"Готов",               color:"#10b981", bg:"rgba(16,185,129,0.15)",  icon:"✅" },
  MAINTENANCE: { label:"ТО",                  color:"#f59e0b", bg:"rgba(245,158,11,0.15)",  icon:"🔧" },
  REPAIR:      { label:"Ремонт",              color:"#ef4444", bg:"rgba(239,68,68,0.15)",   icon:"🛠" },
  SPARE_WAIT:  { label:"Ожидание запчастей",  color:"#8b5cf6", bg:"rgba(139,92,246,0.15)", icon:"📦" },
  NONE:        { label:"Не задан",            color:"#5a7499", bg:"transparent",            icon:"—"  },
};

const DEFAULT_MECH_CATS = [
  { key:"DRILL_RIG",  label:"Буровые станки",              icon:"⛏",  color:"#f43f5e" },
  { key:"MIXER",      label:"Смесительно-зарядные машины", icon:"🧪", color:"#8b5cf6" },
  { key:"HYDRO",      label:"Гидромолоты / Экскаваторы",  icon:"💧", color:"#3b82f6" },
  { key:"HILUX",      label:"Лёгкие авто (Hilux)",         icon:"🚙", color:"#10b981" },
  { key:"TRUCK",      label:"Грузовые машины",             icon:"🚛", color:"#f59e0b" },
];

const CAT_ICON_OPTIONS = ["⛏","🧪","💧","🚙","🚛","🏗","⚙","🔧","🛠","🔩","🚜","🏎","🚁","⚡","🔋"];
const CAT_COLOR_OPTIONS = ["#f43f5e","#8b5cf6","#3b82f6","#10b981","#f59e0b","#06b6d4","#ec4899","#84cc16","#f97316","#6366f1"];
function Logo({ size = 34 }) {
  return (
    <svg height={size} viewBox="0 0 140 38" fill="none">
      <rect width="10" height="38" rx="2" fill="#e8212e"/>
      <rect x="13" width="10" height="38" rx="2" fill="#e8212e"/>
      <rect x="26" width="10" height="38" rx="2" fill="#e8212e"/>
      <text x="42" y="28" fontFamily="Oswald,sans-serif" fontSize="26" fontWeight="700" fill="currentColor" letterSpacing="1">ExSo</text>
      <text x="43" y="36" fontFamily="Rajdhani,sans-serif" fontSize="6.5" fontWeight="600" fill="#7a8fa8" letterSpacing="3">DRILL & BLAST CONTROL</text>
    </svg>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_BADGE[status] || STATUS_BADGE.draft;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 3,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      color: cfg.color, fontSize: 12, fontWeight: 700,
      letterSpacing: ".08em", textTransform: "uppercase",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color, display: "inline-block" }} />
      {cfg.label}
    </span>
  );
}

function KTGGauge({ v, plan = 85, size = 72, T }) {
  const r = 26, cx = size / 2, cy = size / 2;
  const ci = 2 * Math.PI * r;
  const pv = v === null ? 0 : Math.min(v, 100);
  const c = scoreColor(v, plan, plan - 12, T);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.border} strokeWidth={5} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={c} strokeWidth={5}
        strokeDasharray={ci} strokeDashoffset={ci * (1 - pv / 100)}
        strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${c})` }} />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        style={{
          fill: c, fontSize: 13, fontWeight: 700,
          transform: `rotate(90deg)`, transformOrigin: `${cx}px ${cy}px`,
          fontFamily: "'Oswald',sans-serif",
        }}>
        {v !== null ? `${v}%` : "—"}
      </text>
    </svg>
  );
}

function ProgressBar({ fact, plan, T }) {
  const p = pct(fact, plan);
  const cc = scoreColor(p, 85, 70, T);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 30, fontWeight: 700, color: T.txt0, fontFamily: "'Oswald',sans-serif" }}>
          {(fact || 0).toLocaleString()}
        </span>
        <span style={{ fontSize: 12, color: T.txt2 }}>/ {(plan || 0).toLocaleString()}</span>
      </div>
      <div style={{ height: 3, background: T.cardSh, borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${Math.min(p || 0, 100)}%`,
          background: cc, borderRadius: 2, transition: "width 0.6s",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 12, color: T.txt2, textTransform: "uppercase" }}>план</span>
        {p !== null && <span style={{ fontSize: 12, fontWeight: 700, color: cc, fontFamily: "'JetBrains Mono',monospace" }}>{p}%</span>}
      </div>
    </div>
  );
}

function Btn({ children, variant = "primary", onClick, disabled, style: ss, fullWidth, T }) {
  const styles = {
    primary:   { background: `linear-gradient(135deg,${T.red},${T.redDim})`, color: "#fff", border: "none", boxShadow: `0 4px 14px ${T.red}40` },
    secondary: { background: T.bg3, color: T.txt1, border: `1px solid ${T.border}`, boxShadow: "none" },
    success:   { background: "linear-gradient(135deg,#059669,#047857)", color: "#fff", border: "none", boxShadow: "0 4px 14px rgba(16,185,129,0.3)" },
    ghost:     { background: "transparent", color: T.txt2, border: `1px solid ${T.borderHi}`, boxShadow: "none" },
    danger:    { background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", boxShadow: "none" },
  };
  const s = styles[variant] || styles.primary;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "9px 20px", borderRadius: 4,
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: 12, fontWeight: 700, letterSpacing: ".1em",
        textTransform: "uppercase", whiteSpace: "nowrap",
        fontFamily: "'Rajdhani',sans-serif",
        width: fullWidth ? "100%" : "auto",
        opacity: disabled ? 0.5 : 1,
        transition: "opacity 0.15s",
        ...s, ...ss,
      }}
    >
      {children}
    </button>
  );
}

function Card({ children, accent, style: ss, T }) {
  return (
    <div style={{
      background: T.bg2,
      border: `1px solid ${T.border}`,
      borderRadius: 6,
      overflow: "hidden",
      borderLeft: accent ? `3px solid ${accent}` : undefined,
      ...ss,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ label, sub, T }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.red, textTransform: "uppercase", letterSpacing: ".25em", marginBottom: 4 }}>▌ {label}</div>
      {sub && <div style={{ fontSize: 24, fontWeight: 700, color: T.txt0, fontFamily: "'Oswald',sans-serif", letterSpacing: "1px" }}>{sub}</div>}
    </div>
  );
}

function Breadcrumb({ items, T }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, fontSize: 12, color: T.txt2, textTransform: "uppercase", letterSpacing: ".07em", flexWrap: "wrap" }}>
      {items.map((it, i) => (
        <span key={it.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {i > 0 && <span>›</span>}
          <span
            style={{ color: it.onClick ? T.amber : T.txt0, cursor: it.onClick ? "pointer" : "default", fontWeight: 700 }}
            onClick={it.onClick}
          >
            {it.label}
          </span>
        </span>
      ))}
    </div>
  );
}

function FieldInput({ label, type = "text", value, onChange, T, style: ss, placeholder }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, ...ss }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: T.txt2, textTransform: "uppercase", letterSpacing: ".08em" }}>
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          padding: "9px 12px", background: T.inputBg,
          border: `1px solid ${T.border}`, borderRadius: 4,
          color: T.txt0, fontSize: 13, fontWeight: 500,
          outline: "none", width: "100%",
          fontFamily: "'Rajdhani',sans-serif",
        }}
      />
    </div>
  );
}

function FieldSelect({ label, value, onChange, children, T, style: ss }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, ...ss }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: T.txt2, textTransform: "uppercase", letterSpacing: ".08em" }}>
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        style={{
          padding: "9px 12px", background: T.inputBg,
          border: `1px solid ${T.border}`, borderRadius: 4,
          color: T.txt0, fontSize: 13, fontWeight: 500,
          outline: "none", width: "100%", cursor: "pointer",
          fontFamily: "'Rajdhani',sans-serif",
        }}
      >
        {children}
      </select>
    </div>
  );
}

// ─── DATA ENTRY TABLE (shared between foreman and engineer) ───────────────────
const TABLE_COLS = [
  { field: "df",   label: "Бурение п.м" },
  { field: "bf",   label: "Взрыв м³" },
  { field: "wh",   label: "Работа ч" },
  { field: "dh",   label: "Простой ч" },
  { field: "fuel", label: "ГСМ т" },
];

function DataTable({ rows, onCell, totals, T }) {
  const colors = [T.red, T.amber, T.blue, "#ef4444", T.violet];
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
        <thead>
          <tr style={{ background: T.rowHdr }}>
            <th style={{ padding: "9px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: T.txt2, textTransform: "uppercase", letterSpacing: ".07em", borderBottom: `1px solid ${T.border}` }}>
              Станок
            </th>
            {TABLE_COLS.map((col, ci) => (
              <th key={col.field} style={{ padding: "9px 10px", textAlign: "center", fontSize: 12, fontWeight: 700, color: colors[ci], textTransform: "uppercase", letterSpacing: ".07em", borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>
                {col.label}
              </th>
            ))}
            <th style={{ padding: "9px 10px", textAlign: "left", fontSize: 12, fontWeight: 700, color: T.txt2, textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, minWidth: 130 }}>
              Примечание
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id} style={{ background: i % 2 ? T.rowAlt : "transparent" }}>
              <td style={{ padding: "8px 14px", fontWeight: 700, color: T.txt0, fontSize: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.red, flexShrink: 0 }} />
                  {row.nm || row.n}
                </div>
              </td>
              {TABLE_COLS.map((col, ci) => (
                <td key={col.field} style={{ padding: "6px 8px", textAlign: "center" }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={row[col.field] === 0 || row[col.field] === "" ? "" : row[col.field]}
                    onChange={(e) => onCell(row.id, col.field, e.target.value)}
                    placeholder="0"
                    style={{
                      width: "100%", padding: "7px 6px",
                      background: T.inputBg, border: `1px solid ${T.border}`,
                      borderBottom: `2px solid ${colors[ci]}60`,
                      borderRadius: 3, fontSize: 13, fontWeight: 600,
                      color: colors[ci], textAlign: "center",
                      outline: "none", fontFamily: "'JetBrains Mono',monospace",
                    }}
                  />
                </td>
              ))}
              <td style={{ padding: "6px 8px" }}>
                <input
                  type="text"
                  placeholder="не было"
                  value={row.dt || ""}
                  onChange={(e) => onCell(row.id, "dt", e.target.value)}
                  style={{
                    width: "100%", padding: "7px 8px",
                    background: T.inputBg, border: `1px solid ${T.border}`,
                    borderRadius: 3, color: T.txt1, fontSize: 12, outline: "none",
                    fontFamily: "'Rajdhani',sans-serif",
                  }}
                />
              </td>
            </tr>
          ))}
          {/* Totals row */}
          <tr style={{ background: `${T.red}12`, borderTop: `1px solid ${T.border}` }}>
            <td style={{ padding: "9px 14px", fontWeight: 900, color: T.txt0, fontSize: 12, textTransform: "uppercase" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.red }} />
                ИТОГО
              </div>
            </td>
            {[totals.df, totals.bf, totals.wh, totals.dh, totals.fuel].map((val, i) => (
              <td key={i} style={{ padding: "9px 10px", textAlign: "center", fontWeight: 900, fontSize: 16, color: colors[i], fontFamily: "'Oswald',sans-serif" }}>
                {val.toLocaleString()}
              </td>
            ))}
            <td style={{ padding: "9px 10px", fontSize: 12, color: T.txt2 }}>
              КТГ: <b style={{ color: scoreColor(ktgCalc(totals.wh, totals.dh), 85, 70, T) }}>
                {ktgCalc(totals.wh, totals.dh) !== null ? `${ktgCalc(totals.wh, totals.dh)}%` : "—"}
              </b>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── SECTION BADGES (Drilling / Explosion / KTG) ──────────────────────────────
function SectionBadges({ T }) {
  return (
    <div style={{ padding: "12px 18px 6px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
      {[
        [T.red,   "⛏ Данные по бурению", "Факт бурения (п.м.)"],
        [T.amber, "💥 Данные по взрыву",  "Факт взрыва (м³)"],
        [T.green, "⚙ Техника / КТГ",      "Работа и простои (ч)"],
      ].map(([color, title, sub]) => (
        <div key={title} style={{ background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 4, padding: "8px 12px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: ".08em" }}>{title}</div>
          <div style={{ fontSize: 12, color: T.txt2, marginTop: 2 }}>{sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ users, onLogin, T }) {
  const [login, setLogin] = useState("");
  const [pw, setPw]       = useState("");
  const [err, setErr]     = useState("");

  function handleLogin() {
    const u = users.find((u) => u.login === login.trim() && u.pw === pw);
    if (u) {
      onLogin(u);
    } else {
      setErr("Неверный логин или пароль");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg0, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ display: "flex", gap: 56, alignItems: "center", maxWidth: 860, width: "100%", flexWrap: "wrap" }}>
        {/* Left panel */}
        <div style={{ flex: "0 0 300px" }}>
          <div style={{ color: T.txt0 }}><Logo size={42} /></div>
          <div style={{ width: 32, height: 2, background: T.red, margin: "18px 0" }} />
          <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1, color: T.txt0, fontFamily: "'Oswald',sans-serif", letterSpacing: "2px" }}>
            DRILL &amp; BLAST<br /><span style={{ color: T.red }}>CONTROL</span>
          </div>
          <div style={{ fontSize: 13, color: T.txt1, marginTop: 14, lineHeight: 1.8 }}>
            Система контроля буровзрывных работ
          </div>
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 5 }}>
            {[["17","Буровых станков"],["7","Рабочих участка"]].map(([num, lbl]) => (
              <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 14px", background: `${T.red}10`, border: `1px solid ${T.red}20`, borderRadius: 4 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: T.red, fontFamily: "'Oswald',sans-serif", minWidth: 28 }}>{num}</span>
                <span style={{ fontSize: 12, color: T.txt2, textTransform: "uppercase", letterSpacing: ".08em" }}>{lbl}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Right panel */}
        <div style={{ flex: "0 0 310px", background: T.bg2, borderRadius: 8, padding: "32px 28px", border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.txt2, textTransform: "uppercase", letterSpacing: ".2em", textAlign: "center", marginBottom: 26 }}>
            Вход в систему
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FieldInput label="Логин" value={login} onChange={(e) => setLogin(e.target.value)} T={T} />
            <FieldInput label="Пароль" type="password" value={pw} onChange={(e) => setPw(e.target.value)} T={T} />
          </div>
          {err && (
            <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 4, fontSize: 12, color: "#f87171", fontWeight: 600 }}>
              ⚠ {err}
            </div>
          )}
          <Btn variant="primary" fullWidth style={{ marginTop: 18 }} onClick={handleLogin} T={T}>
            ВОЙТИ →
          </Btn>
          <div style={{ marginTop: 16, padding: "10px 12px", background: T.bg1, borderRadius: 4, border: `1px solid ${T.border}`, fontSize: 12, color: T.txt2, lineHeight: 2.2, fontFamily: "'JetBrains Mono',monospace", textAlign: "center" }}>
            ceo/ceo123 · engineer/eng123 · mechanic/mech123<br />
            seitkali/foreman1 · mombekov/foreman2 · zhanab/foreman3
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
function Topbar({ user, nav, page, onNav, onOut, onUpdateUser, pending, isDark, toggleTheme, T }) {
  const roleColor = { ceo: "#f43f5e", engineer: T.violet, foreman: T.blue }[user.role] || T.txt2;
  const [showProfile, setShowProfile] = useState(false);
  const [form, setForm]               = useState({ name: "", login: "", pw: "", pw2: "" });
  const [err,  setErr]                = useState("");
  const [ok,   setOk]                 = useState(false);

  function openProfile() {
    setForm({ name: user.name, login: user.login, pw: "", pw2: "" });
    setErr(""); setOk(false); setShowProfile(true);
  }

  function saveProfile() {
    if (!form.name.trim())  { setErr("Введите имя"); return; }
    if (!form.login.trim()) { setErr("Введите логин"); return; }
    if (form.pw && form.pw !== form.pw2) { setErr("Пароли не совпадают"); return; }
    const ini = form.name.trim().split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    onUpdateUser({ ...user, name: form.name.trim(), login: form.login.trim(), ini,
      ...(form.pw ? { pw: form.pw } : {}) });
    setOk(true); setErr("");
    setTimeout(() => setShowProfile(false), 1000);
  }

  return (
    <>
      {/* Profile modal */}
      {showProfile && (
        <div style={{ position:"fixed", inset:0, background:T.modalBg, zIndex:600, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderLeft:`3px solid ${roleColor}`, borderRadius:8, width:"100%", maxWidth:420 }}>
            <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:T.bg3 }}>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:T.txt0, fontFamily:"'Oswald',sans-serif" }}>МОЙ ПРОФИЛЬ</div>
                <div style={{ fontSize:12, color:T.txt2, marginTop:2 }}>{ROLE_LABEL[user.role]}</div>
              </div>
              <button onClick={() => setShowProfile(false)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:22, color:T.txt2 }}>×</button>
            </div>
            <div style={{ padding:"20px", display:"flex", flexDirection:"column", gap:14 }}>
              {/* Avatar preview */}
              <div style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", background:T.bg3, borderRadius:6 }}>
                <div style={{ width:48, height:48, borderRadius:6, background:`${roleColor}20`, border:`2px solid ${roleColor}50`,
                  color:roleColor, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:700, fontFamily:"'Oswald',sans-serif" }}>
                  {form.name ? form.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() : user.ini}
                </div>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color:T.txt0 }}>{form.name || user.name}</div>
                  <div style={{ fontSize:12, color:T.txt2 }}>{form.login || user.login}</div>
                </div>
              </div>
              <FieldInput label="Имя и фамилия" value={form.name}
                onChange={e => setForm(p=>({...p, name:e.target.value}))} T={T} />
              <FieldInput label="Логин" value={form.login}
                onChange={e => setForm(p=>({...p, login:e.target.value}))} T={T} />
              <FieldInput label="Новый пароль (оставьте пустым чтобы не менять)" type="password" value={form.pw}
                onChange={e => setForm(p=>({...p, pw:e.target.value}))} T={T} />
              <FieldInput label="Повторите пароль" type="password" value={form.pw2}
                onChange={e => setForm(p=>({...p, pw2:e.target.value}))} T={T} />
              {err && <div style={{ padding:"8px 12px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:4, fontSize:12, color:"#f87171", fontWeight:600 }}>⚠ {err}</div>}
              {ok  && <div style={{ padding:"8px 12px", background:`${T.green}15`, border:`1px solid ${T.green}30`, borderRadius:4, fontSize:12, color:T.green, fontWeight:600 }}>✓ Профиль обновлён!</div>}
              <div style={{ display:"flex", gap:10 }}>
                <Btn variant="success" style={{ flex:1, padding:"11px" }} onClick={saveProfile} T={T}>💾 Сохранить</Btn>
                <Btn variant="ghost"   style={{ padding:"11px 16px" }}    onClick={() => setShowProfile(false)} T={T}>Отмена</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: T.bg1, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 52, position: "sticky", top: 0, zIndex: 300 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ cursor: "pointer", color: T.txt0 }} onClick={() => onNav("dash")}>
            <Logo size={26} />
          </div>
          <div style={{ width: 1, height: 20, background: T.border }} />
          <nav style={{ display: "flex", gap: 2 }}>
            {nav.map(([key, label]) => (
              <button key={key} onClick={() => onNav(key)}
                style={{ padding: "5px 14px", borderRadius: 3, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase",
                  background: page === key ? `${T.red}18` : "transparent",
                  color: page === key ? T.red : T.txt2,
                  borderBottom: page === key ? `2px solid ${T.red}` : "2px solid transparent",
                  position: "relative" }}>
                {label}
                {key === "inbox" && pending > 0 && (
                  <span style={{ position: "absolute", top: 2, right: 3, background: T.red, color: "#fff", borderRadius: 10, padding: "1px 5px", fontSize: 12, fontWeight: 700 }}>
                    {pending}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={toggleTheme}
            style={{ padding: "5px 12px", borderRadius: 4, border: `1px solid ${T.border}`, background: T.bg3, color: T.txt1, fontSize: 12, cursor: "pointer", fontFamily: "'Rajdhani',sans-serif", fontWeight: 600 }}>
            {isDark ? "☀ Светлая" : "🌙 Тёмная"}
          </button>
          {/* Clickable profile area */}
          <div onClick={openProfile} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", padding:"4px 8px", borderRadius:5,
            border:`1px solid transparent`, transition:"border-color 0.15s" }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=T.border}
            onMouseLeave={e=>e.currentTarget.style.borderColor="transparent"}>
            <div style={{ textAlign: "right", lineHeight: 1.4 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.txt0 }}>{user.name}</div>
              <div style={{ fontSize: 12, color: roleColor, textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 600 }}>{ROLE_LABEL[user.role]}</div>
            </div>
            <div style={{ width: 30, height: 30, borderRadius: 4, background: `${roleColor}20`, border: `1px solid ${roleColor}50`, color: roleColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
              {user.ini}
            </div>
          </div>
          <Btn variant="ghost" onClick={onOut} style={{ padding: "5px 10px", fontSize: 12 }} T={T}>ВЫЙТИ</Btn>
        </div>
      </div>
    </>
  );
}

// ─── CEO DASHBOARD ────────────────────────────────────────────────────────────
function Dashboard({ objs, rigs, reps, plans, onDrillObj, T }) {

  // ── Period state ──────────────────────────────────────────────────────────
  const [mode, setMode] = useState("month");    // month-only Dashboard
  const [anchor, setAnchor] = useState(() => new Date().toISOString().slice(0, 10));

  function fmtD(iso) {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y.slice(2)}`;
  }
  function addDays(iso, n) {
    const d = new Date(iso);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function getMonday(iso) {
    const d = new Date(iso);
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    return d.toISOString().slice(0, 10);
  }
  function getMonthStart(iso) { return iso.slice(0, 7) + "-01"; }
  function getMonthEnd(iso) {
    const [y, m] = iso.split("-").map(Number);
    return new Date(y, m, 0).toISOString().slice(0, 10);
  }

  const { rangeStart, rangeEnd, label } = useMemo(() => {
    if (mode === "day") {
      return { rangeStart: anchor, rangeEnd: anchor, label: fmtD(anchor) };
    }
    if (mode === "week") {
      const mon = getMonday(anchor);
      const sun = addDays(mon, 6);
      return { rangeStart: mon, rangeEnd: sun, label: `${fmtD(mon)} — ${fmtD(sun)}` };
    }
    // month
    const ms = getMonthStart(anchor);
    const me = getMonthEnd(anchor);
    const months = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
    const [y, m] = anchor.split("-");
    return { rangeStart: ms, rangeEnd: me, label: `${months[parseInt(m,10)-1]} ${y}` };
  }, [mode, anchor]);

  function shift(dir) {
    const d = new Date(anchor);
    if (mode === "day")   d.setDate(d.getDate() + dir);
    if (mode === "week")  d.setDate(d.getDate() + dir * 7);
    if (mode === "month") d.setMonth(d.getMonth() + dir);
    setAnchor(d.toISOString().slice(0, 10));
  }

  // ── Filter reps by date range ─────────────────────────────────────────────
  // Normalise any date format to ISO yyyy-mm-dd:
  //   "12.06"        → legacy dd.mm  (year guessed from anchor)
  //   "12.06.2026"   → dd.mm.yyyy
  //   "2026-03-05"   → already ISO
  function repDateToIso(dateStr) {
    if (!dateStr) return "0000-00-00";
    // Already ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // dd.mm.yyyy
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
      const [d, m, y] = dateStr.split(".");
      return `${y}-${m}-${d}`;
    }
    // dd.mm  (legacy — assume anchor year)
    const parts = dateStr.split(".");
    if (parts.length >= 2) {
      const d = parts[0].padStart(2,"0");
      const m = parts[1].padStart(2,"0");
      const y = anchor.slice(0, 4);
      return `${y}-${m}-${d}`;
    }
    return dateStr;
  }

  const filteredReps = useMemo(() => {
    return reps.filter((r) => {
      if (r.status !== "approved") return false;
      const iso = repDateToIso(r.date);
      return iso >= rangeStart && iso <= rangeEnd;
    });
  }, [reps, rangeStart, rangeEnd, anchor]);

  // ── Compute plan for the period (new flat entry structure) ───────────────
  function getPlanForPeriod(oid) {
    let df = 0, bf = 0, kp = 0, kpCount = 0;
    plans.forEach((entry) => {
      if (entry.oid !== oid) return;
      entry.dates.forEach((d) => {
        if (d.date >= rangeStart && d.date <= rangeEnd) {
          if (entry.field === "df") df += d.val;
          if (entry.field === "bf") bf += d.val;
          if (entry.field === "kp") { kp += d.val; kpCount++; }
        }
      });
    });
    return { df, bf, kp: kpCount ? Math.round(kp / kpCount) : null };
  }

  // ── Bar chart data: daily drill fact vs plan ──────────────────────────────
  function getChartData(oid) {
    const factMap = {};
    filteredReps.filter((r) => r.oid === oid).forEach((r) => {
      const iso = repDateToIso(r.date);
      factMap[iso] = (factMap[iso] || 0) + r.df;
    });
    const planMap = {};
    plans.forEach((entry) => {
      if (entry.oid !== oid || entry.field !== "df") return;
      entry.dates.forEach((d) => {
        if (d.date >= rangeStart && d.date <= rangeEnd)
          planMap[d.date] = (planMap[d.date] || 0) + d.val;
      });
    });
    const dates = Array.from(new Set([...Object.keys(factMap), ...Object.keys(planMap)])).sort();
    return dates.map((date) => ({ date, fact: factMap[date] || 0, plan: planMap[date] || 0 }));
  }

  // ── Totals ────────────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const t = { df: 0, bf: 0, fuel: 0, wh: 0, dh: 0 };
    filteredReps.forEach((r) => { t.df += r.df; t.bf += r.bf; t.fuel += r.fuel; t.wh += r.wh; t.dh += r.dh; });
    return t;
  }, [filteredReps]);

  const planTotals = useMemo(() => {
    let df = 0, bf = 0;
    objs.forEach((o) => { const p = getPlanForPeriod(o.id); df += p.df; bf += p.bf; });
    return { df, bf };
  }, [plans, rangeStart, rangeEnd, objs]);

  const totalKtg   = ktgCalc(totals.wh, totals.dh);
  const planAvgKtg = objs.length ? Math.round(objs.reduce((s, o) => s + (o.kp || 85), 0) / objs.length) : 85;
  const colors     = OBJ_COLORS(T);

  // ── Mini bar chart SVG ────────────────────────────────────────────────────
  function MiniBarChart({ data, ac }) {
    if (!data.length) return <div style={{ height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 12, color: T.txt2 }}>Нет данных</span></div>;
    const maxVal = Math.max(...data.map((d) => Math.max(d.fact, d.plan)), 1);
    const w = 100 / data.length;
    return (
      <svg width="100%" height="40" style={{ overflow: "visible" }}>
        {data.map((d, i) => {
          const ph = Math.max(1, (d.plan / maxVal) * 34);
          const fh = Math.max(1, (d.fact / maxVal) * 34);
          const x = i * w;
          return (
            <g key={d.date}>
              <rect x={`${x + w * 0.05}%`} y={40 - ph} width={`${w * 0.42}%`} height={ph} fill={`${T.border}`} rx="1" />
              <rect x={`${x + w * 0.5}%`}  y={40 - fh} width={`${w * 0.42}%`} height={fh} fill={ac} rx="1" opacity="0.85" />
            </g>
          );
        })}
      </svg>
    );
  }

  return (
    <div>
      {/* ── Period selector ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <SectionTitle label="Оперативная сводка" sub="CEO DASHBOARD" T={T} />
      </div>
      {/* ── Month selector ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {/* Month nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => shift(-1)} style={{ padding: "7px 12px", background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 4, color: T.txt1, cursor: "pointer", fontSize: 14, lineHeight: 1, fontFamily:"'Rajdhani',sans-serif" }}>‹</button>
          <div style={{ padding: "7px 18px", background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 14, fontWeight: 700, color: T.txt0, fontFamily: "'Oswald',sans-serif", minWidth: 160, textAlign: "center", letterSpacing: "1px" }}>
            {label}
          </div>
          <button onClick={() => shift(1)} style={{ padding: "7px 12px", background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 4, color: T.txt1, cursor: "pointer", fontSize: 14, lineHeight: 1, fontFamily:"'Rajdhani',sans-serif" }}>›</button>
        </div>
        {/* Month picker */}
        <input type="month" value={anchor.slice(0,7)} onChange={(e) => setAnchor(e.target.value + "-01")}
          style={{ padding: "7px 10px", background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 4, color: T.txt0, fontSize: 12, outline: "none", fontFamily: "'Rajdhani',sans-serif", cursor: "pointer" }} />
        {/* Fact count */}
        <div style={{ fontSize: 12, color: T.txt2, marginLeft: "auto" }}>
          <span style={{ color: T.txt0, fontWeight: 700 }}>{filteredReps.length}</span> отчётов за месяц
        </div>
      </div>

      {/* ── Top KPIs ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10, marginBottom: 20 }}>
        <Card accent={T.red} style={{ padding: "16px 18px" }} T={T}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.red, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 10 }}>⛏ Бурение</div>
          <ProgressBar fact={totals.df} plan={planTotals.df || objs.reduce((s,o)=>s+o.dp,0)} T={T} />
          {planTotals.df > 0 && <div style={{ fontSize: 12, color: T.txt2, marginTop: 6 }}>План периода: <b style={{ color: T.txt0 }}>{planTotals.df.toLocaleString()}</b></div>}
        </Card>
        <Card accent={T.amber} style={{ padding: "16px 18px" }} T={T}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.amber, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 10 }}>💥 Взрывы</div>
          <ProgressBar fact={totals.bf} plan={planTotals.bf || objs.reduce((s,o)=>s+o.bp,0)} T={T} />
          {planTotals.bf > 0 && <div style={{ fontSize: 12, color: T.txt2, marginTop: 6 }}>План периода: <b style={{ color: T.txt0 }}>{planTotals.bf.toLocaleString()}</b></div>}
        </Card>
        <Card accent={T.green} style={{ padding: "16px 18px", display: "flex", gap: 14, alignItems: "center" }} T={T}>
          <KTGGauge v={totalKtg} plan={planAvgKtg} size={78} T={T} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.green, textTransform: "uppercase", marginBottom: 6 }}>КТГ</div>
            <div style={{ fontSize: 12, color: T.txt2, marginBottom: 2 }}>ПЛАН <b style={{ color: T.txt0 }}>{planAvgKtg}%</b></div>
            <div style={{ fontSize: 12, color: T.txt2, marginBottom: 2 }}>РАБОТА <b style={{ color: T.txt0 }}>{totals.wh.toLocaleString()} ч</b></div>
            <div style={{ fontSize: 12, color: T.txt2 }}>ПРОСТОЙ <b style={{ color: "#ef4444" }}>{totals.dh} ч</b></div>
          </div>
        </Card>
        <Card accent={T.violet} style={{ padding: "16px 18px" }} T={T}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.violet, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8 }}>⛽ ГСМ удельный</div>
          <div style={{ fontSize: 34, fontWeight: 700, color: T.txt0, lineHeight: 1, fontFamily: "'Oswald',sans-serif" }}>
            {totals.df > 0 ? (totals.fuel / totals.df).toFixed(3) : "—"}
          </div>
          <div style={{ fontSize: 12, color: T.txt2, marginTop: 5, textTransform: "uppercase" }}>
            т/м · итого <b style={{ color: T.txt0 }}>{totals.fuel.toLocaleString()} т</b>
          </div>
        </Card>
      </div>

      {/* ── Object cards with bar chart ── */}
      <SectionTitle label={`Участки (${objs.length})`} T={T} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 }}>
        {objs.map((obj, i) => {
          const rr  = filteredReps.filter((r) => r.oid === obj.id);
          const df  = rr.reduce((s,r)=>s+r.df,0), bf = rr.reduce((s,r)=>s+r.bf,0);
          const wh  = rr.reduce((s,r)=>s+r.wh,0), dh = rr.reduce((s,r)=>s+r.dh,0), fuel = rr.reduce((s,r)=>s+r.fuel,0);
          const kv  = ktgCalc(wh, dh);
          const ac  = colors[i % colors.length];
          const pp  = getPlanForPeriod(obj.id);
          const dp  = pp.df || obj.dp, bp = pp.bf || obj.bp;
          const pDf = pct(df, dp), pBf = pct(bf, bp);
          const chartData = getChartData(obj.id);
          return (
            <div key={obj.id} onClick={() => onDrillObj(obj.id)}
              style={{ background: T.bg2, borderRadius: 6, border: `1px solid ${T.border}`, borderLeft: `3px solid ${ac}`, cursor: "pointer", overflow: "hidden" }}>
              <div style={{ background: `linear-gradient(90deg,${ac}18,transparent)`, padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.txt0, fontFamily: "'Oswald',sans-serif" }}>{obj.name.toUpperCase()}</div>
                  <div style={{ fontSize: 12, color: T.txt2, marginTop: 2 }}>
                    <span style={{ color: ac, fontWeight: 700 }}>{rigs.filter(r=>r.o===obj.id).length}</span> станков · {rr.length} отчётов
                  </div>
                </div>
                <KTGGauge v={kv} plan={pp.kp || obj.kp} size={60} T={T} />
              </div>
              <div style={{ padding: "12px 16px 14px" }}>
                {[[pDf, dp, df, "⛏ Бурение пог.м", T.red], [pBf, bp, bf, "💥 Взрывы м³", T.amber]].map(([perc, plan, fact, lbl, color]) => {
                  const cc = scoreColor(perc, 85, 70, T);
                  return (
                    <div key={lbl} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.txt2, textTransform: "uppercase" }}>{lbl}</span>
                        {perc !== null && <span style={{ fontSize: 12, fontWeight: 700, color: cc }}>{perc}%</span>}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 4 }}>
                        <div style={{ background: T.bg1, borderRadius: 3, padding: "5px 10px", border: `1px solid ${T.border}` }}>
                          <div style={{ fontSize: 12, color: T.txt2, textTransform: "uppercase", marginBottom: 1 }}>ПЛАН</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: T.txt0, fontFamily: "'Oswald',sans-serif" }}>{(plan||0).toLocaleString()}</div>
                        </div>
                        <div style={{ background: `${color}10`, borderRadius: 3, padding: "5px 10px", border: `1px solid ${color}30` }}>
                          <div style={{ fontSize: 12, color, textTransform: "uppercase", marginBottom: 1, fontWeight: 700 }}>ФАКТ</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color, fontFamily: "'Oswald',sans-serif" }}>{(fact||0).toLocaleString()}</div>
                        </div>
                      </div>
                      <div style={{ height: 2, background: T.cardSh, borderRadius: 2 }}>
                        <div style={{ height: "100%", width: `${Math.min(perc||0,100)}%`, background: cc, borderRadius: 2 }} />
                      </div>
                    </div>
                  );
                })}
                {/* Mini chart: plan vs fact by day */}
                {chartData.length > 0 && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 12, color: T.txt2, textTransform: "uppercase", marginBottom: 3, display: "flex", gap: 10 }}>
                      <span>Бурение по дням</span>
                      <span style={{ color: T.border }}>▪ план</span>
                      <span style={{ color: ac }}>▪ факт</span>
                    </div>
                    <MiniBarChart data={chartData} ac={ac} />
                  </div>
                )}
                <div style={{ display: "flex", gap: 6, paddingTop: 8, borderTop: `1px solid ${T.border}`, marginTop: 4 }}>
                  <div style={{ flex: 1, background: T.bg1, borderRadius: 3, padding: "5px 8px", border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 12, color: T.txt2, textTransform: "uppercase", marginBottom: 2 }}>ГСМ уд.</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.violet, fontFamily: "'Oswald',sans-serif" }}>{df > 0 ? (fuel/df).toFixed(3) : "—"}</div>
                  </div>
                  <div style={{ flex: 1, background: T.bg1, borderRadius: 3, padding: "5px 8px", border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 12, color: T.txt2, textTransform: "uppercase", marginBottom: 2 }}>Простои</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: dh > 0 ? "#ef4444" : T.txt2, fontFamily: "'Oswald',sans-serif" }}>{dh} ч</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── OBJECT DETAIL ────────────────────────────────────────────────────────────
function ObjDetail({ objId, objs, rigs, reps, onDrillRig, onBack, T }) {
  const obj = objs.find((o) => o.id === objId);
  const approved = reps.filter((r) => r.status === "approved" && r.oid === objId);
  if (!obj) return null;

  const tot = { df: 0, bf: 0, wh: 0, dh: 0, fuel: 0 };
  approved.forEach((r) => { tot.df+=r.df; tot.bf+=r.bf; tot.wh+=r.wh; tot.dh+=r.dh; tot.fuel+=r.fuel; });
  const kv = ktgCalc(tot.wh, tot.dh);
  const colors = OBJ_COLORS(T);
  const ac = colors[objs.findIndex((o) => o.id === objId) % colors.length];
  const objRigs = rigs.filter((rg) => rg.o === objId);

  return (
    <div>
      <Breadcrumb items={[{ label: "DASHBOARD", onClick: onBack }, { label: obj.name.toUpperCase() }]} T={T} />
      <div style={{ fontSize: 28, fontWeight: 700, color: T.txt0, fontFamily: "'Oswald',sans-serif", marginBottom: 18 }}>
        {obj.name.toUpperCase()}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(155px,1fr))", gap: 10, marginBottom: 24 }}>
        {[
          [T.red,    "⛏ Бурение", tot.df,   obj.dp, "п.м"],
          [T.amber,  "💥 Взрывы",  tot.bf,   obj.bp, "м³"],
          [T.green,  "КТГ",        kv !== null ? `${kv}%` : "—", null, null],
          [T.violet, "ГСМ",        tot.fuel, null,   "т"],
          ["#ef4444","Простои",    tot.dh,   null,   "ч"],
        ].map(([color, lbl, fact, plan, unit]) => (
          <Card key={lbl} accent={color} style={{ padding: "14px 16px" }} T={T}>
            <div style={{ fontSize: 12, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8 }}>{lbl}</div>
            {plan !== null
              ? <ProgressBar fact={fact} plan={plan} T={T} />
              : <div>
                  <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: "'Oswald',sans-serif", lineHeight: 1 }}>{fact}</div>
                  {unit && <div style={{ fontSize: 12, color: T.txt2, textTransform: "uppercase", marginTop: 3 }}>{unit}</div>}
                </div>
            }
          </Card>
        ))}
      </div>

      {/* Rig cards */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.red, textTransform: "uppercase", letterSpacing: ".25em", marginBottom: 4 }}>▌ Буровые станки</div>
        <div style={{ fontSize: 12, color: T.txt2, marginBottom: 16 }}>Нажмите на станок для просмотра отчётов по сменам</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12, marginBottom: 28 }}>
        {objRigs.map((rg) => {
          const df   = approved.reduce((s,r) => s + (r.rigs?.find(x=>x.id===rg.id)?.df   || 0), 0);
          const bf   = approved.reduce((s,r) => s + (r.rigs?.find(x=>x.id===rg.id)?.bf   || 0), 0);
          const wh   = approved.reduce((s,r) => s + (r.rigs?.find(x=>x.id===rg.id)?.wh   || 0), 0);
          const dh   = approved.reduce((s,r) => s + (r.rigs?.find(x=>x.id===rg.id)?.dh   || 0), 0);
          const fuel = approved.reduce((s,r) => s + (r.rigs?.find(x=>x.id===rg.id)?.fuel || 0), 0);
          const kv2  = ktgCalc(wh, dh);
          const kc   = scoreColor(kv2, obj.kp, obj.kp - 12, T);
          const repCount = approved.filter((r) => r.rigs?.find((x) => x.id === rg.id)).length;
          return (
            <div
              key={rg.id}
              onClick={() => onDrillRig(rg.id)}
              style={{ background: T.bg2, borderRadius: 6, border: `2px solid ${T.border}`, cursor: "pointer", overflow: "hidden" }}
            >
              <div style={{ background: `linear-gradient(135deg,${ac}22,${ac}08)`, padding: "12px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: T.txt0, fontFamily: "'Oswald',sans-serif", letterSpacing: "1px" }}>{rg.n}</div>
                  <div style={{ fontSize: 12, color: T.txt2, marginTop: 2 }}>{repCount} смен · <span style={{ color: ac }}>→ детали</span></div>
                </div>
                <KTGGauge v={kv2} plan={obj.kp} size={52} T={T} />
              </div>
              <div style={{ padding: "10px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[[T.red,"Бурение",df,"п.м"],[T.amber,"Взрыв",bf,"м³"],[T.blue,"Работа",wh,"ч"],["#ef4444","Простой",dh,"ч"]].map(([color,lbl,val,unit]) => (
                  <div key={lbl} style={{ background: T.bg3, borderRadius: 4, padding: "7px 10px", border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 12, color: T.txt2, textTransform: "uppercase", marginBottom: 2 }}>{lbl}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color, fontFamily: "'Oswald',sans-serif", lineHeight: 1 }}>
                      {val.toLocaleString()} <span style={{ fontSize: 12, fontWeight: 400 }}>{unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "0 14px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 12, color: T.txt2 }}>ГСМ: <b style={{ color: T.violet }}>{fuel.toLocaleString()} т</b></div>
                {dh > 0 && <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 700 }}>⚠ {dh} ч простоя</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── RIG DETAIL ───────────────────────────────────────────────────────────────
function RigDetail({ rigId, objId, objs, rigs, reps, onBack, onBackToObj, T }) {
  const rg  = rigs.find((r) => r.id === rigId);
  const obj = objs.find((o) => o.id === objId);
  if (!rg || !obj) return null;

  const colors = OBJ_COLORS(T);
  const ac = colors[objs.findIndex((o) => o.id === objId) % colors.length];
  const approved = reps.filter((r) => r.status === "approved" && r.oid === objId);
  const rigReps  = approved
    .filter((r) => r.rigs?.find((x) => x.id === rigId))
    .map((r)   => ({ rep: r, rd: r.rigs.find((x) => x.id === rigId) }));

  const tot = {
    df:   rigReps.reduce((s, { rd }) => s + rd.df,   0),
    bf:   rigReps.reduce((s, { rd }) => s + rd.bf,   0),
    wh:   rigReps.reduce((s, { rd }) => s + rd.wh,   0),
    dh:   rigReps.reduce((s, { rd }) => s + rd.dh,   0),
    fuel: rigReps.reduce((s, { rd }) => s + rd.fuel, 0),
  };
  const kv = ktgCalc(tot.wh, tot.dh);
  const kc = scoreColor(kv, obj.kp, obj.kp - 12, T);

  return (
    <div>
      <Breadcrumb items={[{ label: "DASHBOARD", onClick: onBack }, { label: obj.name.toUpperCase(), onClick: onBackToObj }, { label: rg.n }]} T={T} />
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <div style={{ padding: "8px 18px", background: `linear-gradient(135deg,${ac}25,${ac}10)`, border: `2px solid ${ac}`, borderRadius: 6 }}>
          <div style={{ fontSize: 12, color: ac, textTransform: "uppercase", letterSpacing: ".15em", marginBottom: 2 }}>Буровой станок</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: T.txt0, fontFamily: "'Oswald',sans-serif", letterSpacing: "2px" }}>{rg.n}</div>
          <div style={{ fontSize: 12, color: T.txt2, marginTop: 2 }}>{obj.name} · {rigReps.length} смен</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <KTGGauge v={kv} plan={obj.kp} size={80} T={T} />
          <div style={{ fontSize: 12, color: T.txt2, textTransform: "uppercase", marginTop: 2 }}>КТГ</div>
        </div>
      </div>

      {/* Rig totals */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 24 }}>
        {[[T.red,"⛏ Бурение",tot.df,"п.м"],[T.amber,"💥 Взрыв",tot.bf,"м³"],[T.blue,"⚙ Работа",tot.wh,"ч"],["#ef4444","⏸ Простой",tot.dh,"ч"],[T.violet,"⛽ ГСМ",tot.fuel,"т"]].map(([color,lbl,val,unit]) => (
          <Card key={lbl} accent={color} style={{ padding: "14px 16px" }} T={T}>
            <div style={{ fontSize: 12, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 6 }}>{lbl}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: "'Oswald',sans-serif", lineHeight: 1 }}>{val.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: T.txt2, marginTop: 3, textTransform: "uppercase" }}>{unit}</div>
          </Card>
        ))}
      </div>

      {/* Per-shift list */}
      <SectionTitle label={`Отчёты по сменам (${rigReps.length})`} T={T} />
      {rigReps.length === 0
        ? <Card style={{ padding: 24, textAlign: "center" }} T={T}><div style={{ fontSize: 12, color: T.txt2 }}>Нет утверждённых отчётов</div></Card>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rigReps.map(({ rep, rd }) => {
              const kv2 = ktgCalc(rd.wh, rd.dh);
              return (
                <Card key={rep.id} accent={ac} style={{ padding: "14px 16px" }} T={T}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.txt0, fontFamily: "'Oswald',sans-serif" }}>
                        {rep.date} · {rep.sh === "day" ? "☀ Дневная" : "☾ Ночная"}
                      </div>
                      <div style={{ fontSize: 12, color: T.txt2, marginTop: 2 }}>{rep.by}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {kv2 !== null && (
                        <span style={{ padding: "3px 10px", borderRadius: 3, fontSize: 12, fontWeight: 700, background: `${kc}18`, color: kc, border: `1px solid ${kc}30` }}>
                          КТГ {kv2}%
                        </span>
                      )}
                      <StatusBadge status={rep.status} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6 }}>
                    {[[T.red,"Бурение",rd.df,"п.м"],[T.amber,"Взрыв",rd.bf,"м³"],[T.blue,"Работа",rd.wh,"ч"],["#ef4444","Простой",rd.dh,"ч"],[T.violet,"ГСМ",rd.fuel,"т"]].map(([color,lbl,val,unit]) => (
                      <div key={lbl} style={{ background: T.bg3, borderRadius: 4, padding: "8px 10px", border: `1px solid ${T.border}`, textAlign: "center" }}>
                        <div style={{ fontSize: 12, color: T.txt2, textTransform: "uppercase", marginBottom: 3 }}>{lbl}</div>
                        <div style={{ fontSize: 17, fontWeight: 700, color, fontFamily: "'Oswald',sans-serif", lineHeight: 1 }}>{val}</div>
                        <div style={{ fontSize: 12, color: T.txt2, marginTop: 2 }}>{unit}</div>
                      </div>
                    ))}
                  </div>
                  {rd.dt && rd.dt !== "—" && (
                    <div style={{ marginTop: 10, padding: "7px 12px", background: `${T.amber}10`, border: `1px solid ${T.amber}25`, borderRadius: 4, fontSize: 12, color: T.amber }}>
                      ⚠ {rd.dt}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )
      }
    </div>
  );
}

// ─── FOREMAN FORM ─────────────────────────────────────────────────────────────
function ForemanForm({ user, objs, rigs, onSubmit, T }) {
  const myObjs = objs.filter((o) => user.oids === "all" || user.oids.includes(o.id));
  function makeRows(oid) {
    return rigs.filter((r) => r.o === Number(oid)).map((r) => ({ id: r.id, nm: r.n, df: "", bf: "", wh: "", dh: "", fuel: "", dt: "" }));
  }

  const [oid,   setOid]   = useState(myObjs[0]?.id || "");
  const [date,  setDate]  = useState("");
  const [shift, setShift] = useState("day");
  const [rows,  setRows]  = useState(() => makeRows(myObjs[0]?.id || ""));
  const [done,  setDone]  = useState(false);
  const [err,   setErr]   = useState("");

  function setCell(id, key, val) {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, [key]: val } : r));
  }

  const totals = {
    df:   rows.reduce((s,r) => s + toNum(r.df),   0),
    bf:   rows.reduce((s,r) => s + toNum(r.bf),   0),
    wh:   rows.reduce((s,r) => s + toNum(r.wh),   0),
    dh:   rows.reduce((s,r) => s + toNum(r.dh),   0),
    fuel: rows.reduce((s,r) => s + toNum(r.fuel), 0),
  };

  function handleSubmit() {
    if (!date) { setErr("Укажите дату"); return; }
    setErr("");
    onSubmit({
      id: genId(), oid: Number(oid), date, sh: shift,
      rigs: rows.map((r) => ({ id: r.id, n: r.nm, df: toNum(r.df), bf: toNum(r.bf), wh: toNum(r.wh), dh: toNum(r.dh), fuel: toNum(r.fuel), dt: r.dt || "—" })),
      df: totals.df, bf: totals.bf, wh: totals.wh, dh: totals.dh, fuel: totals.fuel,
      status: "submitted", by: user.name, submittedAt: new Date().toLocaleString("ru"),
    });
    setDone(true);
    setRows(makeRows(oid));
    setDate("");
    setShift("day");
    setTimeout(() => setDone(false), 5000);
  }

  if (!myObjs.length) {
    return <Card style={{ padding: 30, textAlign: "center" }} T={T}><div style={{ fontSize: 12, color: T.txt2 }}>Нет назначенных участков</div></Card>;
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ background: T.amber, color: "#000", padding: "4px 12px", borderRadius: 3, fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>ЭТАП 1 — НАЧ. УЧАСТКА</div>
        <div style={{ fontSize: 12, color: T.txt2 }}>Заполните данные и отправьте инженеру на проверку</div>
      </div>
      <SectionTitle label="Ввод данных" sub="СМЕННЫЙ ОТЧЁТ" T={T} />
      <Card style={{ marginBottom: 16 }} T={T}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: T.cardSh }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.txt0, textTransform: "uppercase" }}>Новый отчёт</span>
          <StatusBadge status="draft" />
        </div>
        <div style={{ padding: "16px 18px", display: "flex", gap: 12, flexWrap: "wrap", borderBottom: `1px solid ${T.border}` }}>
          <FieldSelect label="Объект" value={oid} onChange={(e) => { setOid(e.target.value); setRows(makeRows(e.target.value)); }} T={T} style={{ flex: "1 1 160px" }}>
            {myObjs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </FieldSelect>
          <FieldInput label="Дата" type="date" value={date} onChange={(e) => setDate(e.target.value)} T={T} style={{ flex: "1 1 140px" }} />
          <FieldSelect label="Смена" value={shift} onChange={(e) => setShift(e.target.value)} T={T} style={{ flex: "1 1 160px" }}>
            <option value="day">☀ Дневная</option>
            <option value="night">☾ Ночная</option>
          </FieldSelect>
        </div>
        <SectionBadges T={T} />
        <DataTable rows={rows} onCell={setCell} totals={totals} T={T} />
        <div style={{ padding: "14px 18px", borderTop: `1px solid ${T.border}` }}>
          {err && <div style={{ marginBottom: 10, padding: "8px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 4, fontSize: 12, color: "#f87171", fontWeight: 600 }}>⚠ {err}</div>}
          {done && <div style={{ marginBottom: 10, padding: "9px 14px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 4, fontSize: 12, color: T.green, fontWeight: 700 }}>✓ Отчёт отправлен инженеру!</div>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, color: T.txt2 }}>Станков: <b style={{ color: T.txt0 }}>{rows.length}</b></div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="secondary" onClick={() => { setRows(makeRows(oid)); setDate(""); setShift("day"); }} T={T}>Очистить</Btn>
              <Btn variant="primary" onClick={handleSubmit} T={T}>📤 Отправить инженеру →</Btn>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── ENGINEER INBOX ───────────────────────────────────────────────────────────
function EngineerInbox({ reps, objs, rigs, onApprove, ktgPlans, setKtgPlans, nodes, T }) {
  const [selObjId, setSelObjId] = useState(null);
  const [tab,      setTab]      = useState("reports"); // "reports" | "ktg"
  const [sel,      setSel]      = useState(null);
  const [confirmed,setConfirmed]= useState(false);
  const [editRows, setEditRows] = useState([]);
  const [editMeta, setEditMeta] = useState({ date:"", sh:"day" });
  const colors = OBJ_COLORS(T);

  const pendingReps = reps.filter(r=>r.status==="submitted");
  const pendingKtg  = (ktgPlans||[]).filter(p=>p.status==="SUBMITTED");

  // ── Group pending reps by object ──────────────────────────────────────────
  function repsByObj(objId) { return reps.filter(r=>r.oid===objId); }
  function pendingByObj(objId) { return pendingReps.filter(r=>r.oid===objId); }
  function ktgByObj(objId) { return (ktgPlans||[]).filter(p=>p.object_id===objId); }
  function pendingKtgByObj(objId) { return pendingKtg.filter(p=>p.object_id===objId); }

  function openReview(r) {
    setSel(r); setConfirmed(false);
    setEditMeta({ date:r.date, sh:r.sh });
    const baseRigs = rigs.filter(rg=>rg.o===r.oid);
    setEditRows(baseRigs.map(rg=>{
      const f=r.rigs?.find(x=>x.id===rg.id)||{};
      return {id:rg.id,nm:rg.n,df:f.df||"",bf:f.bf||"",wh:f.wh||"",dh:f.dh||"",fuel:f.fuel||"",dt:f.dt||""};
    }));
  }
  function setCell(id,key,val){setEditRows(prev=>prev.map(r=>r.id===id?{...r,[key]:val}:r));}
  const totals={
    df:editRows.reduce((s,r)=>s+toNum(r.df),0), bf:editRows.reduce((s,r)=>s+toNum(r.bf),0),
    wh:editRows.reduce((s,r)=>s+toNum(r.wh),0), dh:editRows.reduce((s,r)=>s+toNum(r.dh),0),
    fuel:editRows.reduce((s,r)=>s+toNum(r.fuel),0),
  };
  function doApprove(){
    if(!confirmed)return;
    onApprove(sel.id,{
      ...sel, date:editMeta.date, sh:editMeta.sh,
      df:totals.df,bf:totals.bf,wh:totals.wh,dh:totals.dh,fuel:totals.fuel,
      rigs:editRows.map(r=>({id:r.id,n:r.nm,df:toNum(r.df),bf:toNum(r.bf),wh:toNum(r.wh),dh:toNum(r.dh),fuel:toNum(r.fuel),dt:r.dt||"—"})),
      status:"approved",
    });
    setSel(null); setConfirmed(false);
  }

  // KTG helpers (same as EngineerKTGInbox)
  const [ktgSel,    setKtgSel]    = useState(null);
  const [ktgComment,setKtgComment]= useState("");
  const [ktgComErr, setKtgComErr] = useState("");
  const MON_RU=["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  function monthLabel(ym){const[y,m]=ym.split("-");return`${MON_RU[parseInt(m,10)-1]} ${y}`;}
  function acceptKtg(plan){
    setKtgPlans(prev=>prev.map(p=>p.id===plan.id?{...p,status:"ACCEPTED",decided_at:new Date().toISOString()}:p));
    setKtgSel(null);
  }
  function returnKtg(plan){
    if(!ktgComment.trim()){setKtgComErr("Укажите причину возврата");return;}
    setKtgPlans(prev=>prev.map(p=>p.id===plan.id?{...p,status:"RETURNED",engineer_comment:ktgComment.trim(),decided_at:new Date().toISOString()}:p));
    setKtgSel(null);setKtgComment("");setKtgComErr("");
  }
  function ktgAvg(plan){
    if(!plan?.items)return null;
    const[y,m]=plan.year_month.split("-").map(Number);
    const dim=new Date(y,m,0).getDate();
    const days=Array.from({length:dim},(_,i)=>`${plan.year_month}-${String(i+1).padStart(2,"0")}`);
    const aids=Object.keys(plan.items);
    if(!aids.length)return null;
    return Math.round(days.map(d=>{const r=aids.filter(aid=>(plan.items[aid]||{})[d]==="READY").length;return Math.round(r/aids.length*100);}).reduce((s,v)=>s+v,0)/days.length);
  }

  // ── Overview: object cards ─────────────────────────────────────────────────
  if (!selObjId) {
    return (
      <div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
          <div style={{background:T.blue,color:"#fff",padding:"4px 12px",borderRadius:3,fontSize:12,fontWeight:700,textTransform:"uppercase"}}>ВХОДЯЩИЕ</div>
          <div style={{fontSize:12,color:T.txt2}}>Отчёты от начальников участков и КТГ-планы от механика</div>
          {(pendingReps.length+pendingKtg.length)>0&&(
            <span style={{background:T.red,color:"#fff",borderRadius:10,padding:"3px 10px",fontSize:12,fontWeight:700,marginLeft:4}}>
              {pendingReps.length+pendingKtg.length} на проверке
            </span>
          )}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
          {objs.map((obj,i)=>{
            const ac     = colors[i%colors.length];
            const pReps  = pendingByObj(obj.id).length;
            const pKtg   = pendingKtgByObj(obj.id).length;
            const allReps= repsByObj(obj.id).length;
            const allKtg = ktgByObj(obj.id).length;
            const total  = pReps+pKtg;
            return(
              <div key={obj.id} onClick={()=>setSelObjId(obj.id)}
                style={{borderRadius:8,overflow:"hidden",border:`2px solid ${total>0?ac:T.border}`,
                  background:T.bg2,cursor:"pointer",transition:"all 0.15s",boxShadow:total>0?`0 4px 16px ${ac}30`:`0 2px 8px ${T.cardSh}`}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="none";}}>
                <div style={{height:4,background:`linear-gradient(90deg,${ac},${ac}60)`}}/>
                <div style={{padding:"14px 16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                    <div>
                      <div style={{fontSize:15,fontWeight:700,color:T.txt0,fontFamily:"'Oswald',sans-serif",letterSpacing:"1px"}}>{obj.name.toUpperCase()}</div>
                    </div>
                    {total>0&&(
                      <span style={{background:T.red,color:"#fff",borderRadius:10,padding:"3px 10px",fontSize:13,fontWeight:700}}>{total}</span>
                    )}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                    {[
                      {icon:"📋",lbl:"Отчёты БВР",pending:pReps,total:allReps,c:T.blue},
                      {icon:"⚙",lbl:"КТГ-планы",pending:pKtg,total:allKtg,c:T.green},
                    ].map(({icon,lbl,pending,total,c})=>(
                      <div key={lbl} style={{padding:"8px 10px",background:T.bg3,borderRadius:5,border:`1px solid ${T.border}`}}>
                        <div style={{fontSize:10,color:c,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>{icon} {lbl}</div>
                        {pending>0
                          ?<div style={{fontSize:16,fontWeight:700,color:T.red,fontFamily:"'Oswald',sans-serif"}}>{pending} новых</div>
                          :<div style={{fontSize:12,color:T.txt2}}>Нет новых</div>
                        }
                        <div style={{fontSize:10,color:T.txt2,marginTop:2}}>Всего: {total}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{textAlign:"center",padding:"7px",borderRadius:5,
                    background:total>0?`${ac}15`:`${T.border}20`,border:`1px solid ${total>0?ac+"40":T.border}`}}>
                    <span style={{fontSize:12,fontWeight:700,color:total>0?ac:T.txt2}}>{total>0?"→ Открыть реестр":"→ Посмотреть историю"}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Object detail: two tabs (reports + KTG) ────────────────────────────────
  const obj     = objs.find(o=>o.id===selObjId);
  const objColor= colors[objs.findIndex(o=>o.id===selObjId)%colors.length];
  const objReps = reps.filter(r=>r.oid===selObjId).sort((a,b)=>b.id-a.id);
  const objKtg  = (ktgPlans||[]).filter(p=>p.object_id===selObjId).sort((a,b)=>b.year_month.localeCompare(a.year_month));
  const objPendReps = pendingByObj(selObjId).length;
  const objPendKtg  = pendingKtgByObj(selObjId).length;

  return (
    <div>
      {/* Review modal — reports */}
      {sel&&(
        <div style={{position:"fixed",inset:0,background:T.modalBg,zIndex:500,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:20,overflowY:"auto"}}>
          <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderLeft:`3px solid ${T.blue}`,borderRadius:8,width:"100%",maxWidth:820,marginTop:10,marginBottom:40}}>
            <div style={{padding:"14px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:T.bg2,zIndex:10}}>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:T.txt0,fontFamily:"'Oswald',sans-serif"}}>ПРОВЕРКА · {obj?.name?.toUpperCase()}</div>
                <div style={{fontSize:12,color:T.txt2,marginTop:2}}>{sel.by} · {sel.submittedAt}</div>
              </div>
              <button onClick={()=>{setSel(null);setConfirmed(false);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:T.txt2,lineHeight:1}}>×</button>
            </div>
            <div style={{padding:20,display:"flex",flexDirection:"column",gap:14}}>
              <div style={{display:"flex",gap:12,flexWrap:"wrap",padding:"12px 0",borderBottom:`1px solid ${T.border}`}}>
                <FieldInput label="Дата" type="date" value={editMeta.date} onChange={e=>setEditMeta(p=>({...p,date:e.target.value}))} T={T} style={{flex:"1 1 140px"}}/>
                <FieldSelect label="Смена" value={editMeta.sh} onChange={e=>setEditMeta(p=>({...p,sh:e.target.value}))} T={T} style={{flex:"1 1 160px"}}>
                  <option value="day">☀ Дневная</option>
                  <option value="night">☾ Ночная</option>
                </FieldSelect>
              </div>
              <SectionBadges T={T}/>
              <DataTable rows={editRows} onCell={setCell} totals={totals} T={T}/>
              <div style={{background:`${T.green}10`,border:`1px solid ${T.green}30`,borderRadius:5,padding:"12px 14px",display:"flex",gap:10,alignItems:"flex-start"}}>
                <input type="checkbox" id="confirm-cb" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} style={{width:16,height:16,cursor:"pointer",marginTop:1,flexShrink:0}}/>
                <label htmlFor="confirm-cb" style={{fontSize:12,color:T.green,cursor:"pointer",fontWeight:600,lineHeight:1.6}}>
                  Я проверил данные по объекту, станкам, бурению, взрыву, КТГ, простоям и ГСМ. Данные корректны.
                </label>
              </div>
              <div style={{display:"flex",gap:10}}>
                <Btn variant="success" style={{flex:1,padding:"11px"}} onClick={doApprove} T={T}>✓ УТВЕРДИТЬ → DASHBOARD</Btn>
                <Btn variant="ghost" style={{padding:"11px 16px"}} onClick={()=>{setSel(null);setConfirmed(false);}} T={T}>Отмена</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KTG review modal */}
      {ktgSel&&(
        <div style={{position:"fixed",inset:0,background:T.modalBg,zIndex:500,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:20,overflowY:"auto"}}>
          <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderLeft:`3px solid ${T.green}`,borderRadius:8,width:"100%",maxWidth:900,marginTop:10,marginBottom:40}}>
            <div style={{padding:"14px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:T.bg2,zIndex:10}}>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:T.txt0,fontFamily:"'Oswald',sans-serif"}}>КТГ-ПЛАН · {obj?.name?.toUpperCase()} · {monthLabel(ktgSel.year_month)}</div>
                <div style={{fontSize:12,color:T.txt2,marginTop:2}}>От: {ktgSel.created_by} · {ktgSel.submitted_at?.slice(0,10)||"—"}</div>
              </div>
              <button onClick={()=>{setKtgSel(null);setKtgComment("");setKtgComErr("");}} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:T.txt2,lineHeight:1}}>×</button>
            </div>
            <div style={{padding:20}}>
              {(()=>{const avg=ktgAvg(ktgSel);return avg!==null&&(
                <div style={{marginBottom:16,padding:"14px 20px",borderRadius:6,
                  background:avg>=85?`${T.green}12`:`rgba(245,158,11,0.1)`,
                  border:`1px solid ${avg>=85?T.green+"30":"rgba(245,158,11,0.3)"}`}}>
                  <div style={{fontSize:11,color:T.txt2,textTransform:"uppercase",marginBottom:4}}>Средний КТГ плана</div>
                  <div style={{fontSize:36,fontWeight:700,color:avg>=85?T.green:T.amber,fontFamily:"'Oswald',sans-serif",lineHeight:1}}>{avg}%</div>
                  <div style={{fontSize:12,color:T.txt2,marginTop:4}}>💡 Рекомендуется как целевой КТГ для плана производства</div>
                </div>
              );})()}
              {/* Mini calendar view */}
              {(()=>{
                if(!ktgSel.items)return null;
                const[y,m]=ktgSel.year_month.split("-").map(Number);
                const dim=new Date(y,m,0).getDate();
                const days=Array.from({length:dim},(_,i)=>`${ktgSel.year_month}-${String(i+1).padStart(2,"0")}`);
                const aids=Object.keys(ktgSel.items);
                if(!aids.length)return null;
                return(
                  <div style={{overflowX:"auto",marginBottom:16}}>
                    <table style={{borderCollapse:"collapse",width:"100%",minWidth:dim*30+120}}>
                      <thead>
                        <tr style={{background:T.bg3}}>
                          <th style={{padding:"6px 10px",textAlign:"left",fontSize:11,color:T.txt2,borderBottom:`1px solid ${T.border}`,minWidth:90,position:"sticky",left:0,background:T.bg3,zIndex:2}}>Актив</th>
                          {days.map(d=>{
                            const dn=parseInt(d.slice(8),10);
                            const ktgV=aids.length?Math.round(aids.filter(aid=>(ktgSel.items[aid]||{})[d]==="READY").length/aids.length*100):null;
                            return(<th key={d} style={{padding:"2px 1px",textAlign:"center",fontSize:9,color:T.txt2,borderBottom:`1px solid ${T.border}`,minWidth:26,background:T.bg3}}>
                              <div style={{fontWeight:700}}>{dn}</div>
                              {ktgV!==null&&<div style={{fontSize:8,color:ktgV>=85?T.green:ktgV>=70?T.amber:"#ef4444"}}>{ktgV}%</div>}
                            </th>);
                          })}
                          <th style={{padding:"6px 8px",fontSize:11,color:T.green,textAlign:"center",borderBottom:`1px solid ${T.border}`,minWidth:46}}>КТГ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aids.map((aid,ai)=>{
                          const node=nodes?.find(n=>n.id===aid);
                          const rDays=days.filter(d=>(ktgSel.items[aid]||{})[d]==="READY").length;
                          const ktg=Math.round(rDays/dim*100);
                          return(<tr key={aid} style={{background:ai%2?T.rowAlt:"transparent"}}>
                            <td style={{padding:"4px 10px",fontSize:11,fontWeight:700,color:T.txt0,position:"sticky",left:0,background:ai%2?T.rowAlt:T.bg2,zIndex:1}}>{node?.name||aid}</td>
                            {days.map(d=>{const st=(ktgSel.items[aid]||{})[d]||"NONE";const cfg=KTG_DAY_STATUS[st]||KTG_DAY_STATUS.NONE;
                              return(<td key={d} style={{padding:"1px",textAlign:"center"}}>
                                <div style={{width:22,height:20,borderRadius:3,margin:"0 auto",background:cfg.bg,border:`1px solid ${st==="NONE"?T.border:cfg.color+"40"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10}}>
                                  {st!=="NONE"?cfg.icon:"·"}
                                </div>
                              </td>);
                            })}
                            <td style={{padding:"4px 8px",textAlign:"center",fontWeight:700,fontSize:13,color:ktg>=85?T.green:ktg>=70?T.amber:"#ef4444",fontFamily:"'Oswald',sans-serif"}}>{ktg}%</td>
                          </tr>);
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
              <div style={{padding:"14px 16px",background:T.bg3,borderRadius:6,border:`1px solid ${T.border}`,marginBottom:16}}>
                <div style={{fontSize:13,fontWeight:700,color:T.txt0,marginBottom:8}}>💬 Комментарий (обязателен при возврате)</div>
                <textarea value={ktgComment} onChange={e=>setKtgComment(e.target.value)} rows={3} placeholder="Причина возврата..."
                  style={{width:"100%",padding:"9px 12px",background:T.inputBg,border:`1px solid ${ktgComErr?T.red:T.border}`,borderRadius:4,color:T.txt0,fontSize:13,resize:"vertical",fontFamily:"'Rajdhani',sans-serif",outline:"none"}}/>
                {ktgComErr&&<div style={{fontSize:12,color:"#f87171",marginTop:4}}>⚠ {ktgComErr}</div>}
              </div>
              <div style={{display:"flex",gap:10}}>
                <Btn variant="success" style={{flex:1,padding:"12px"}} onClick={()=>acceptKtg(ktgSel)} T={T}>✓ ПРИНЯТЬ КТГ-ПЛАН</Btn>
                <Btn variant="danger" style={{flex:1,padding:"12px"}} onClick={()=>returnKtg(ktgSel)} T={T}>↩ ВЕРНУТЬ НА ДОРАБОТКУ</Btn>
                <Btn variant="ghost" style={{padding:"12px 16px"}} onClick={()=>{setKtgSel(null);setKtgComment("");setKtgComErr("");}} T={T}>Отмена</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:18,flexWrap:"wrap"}}>
        <button onClick={()=>setSelObjId(null)} style={{padding:"6px 14px",borderRadius:5,border:`1px solid ${T.border}`,background:T.bg2,color:T.txt2,cursor:"pointer",fontSize:12,fontFamily:"'Rajdhani',sans-serif",fontWeight:600}}>← Все объекты</button>
        <span style={{color:T.txt2,fontSize:14}}>›</span>
        <div style={{padding:"5px 14px",borderRadius:5,background:`${objColor}15`,border:`1px solid ${objColor}40`,fontSize:13,fontWeight:700,color:objColor,fontFamily:"'Oswald',sans-serif"}}>{obj?.name}</div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:6,marginBottom:20}}>
        {[
          {k:"reports",l:"📋 Отчёты БВР",badge:objPendReps},
          {k:"ktg",    l:"⚙ КТГ-планы", badge:objPendKtg},
        ].map(({k,l,badge})=>(
          <button key={k} onClick={()=>setTab(k)} style={{
            padding:"8px 20px",borderRadius:5,border:`1px solid ${tab===k?objColor:T.border}`,
            background:tab===k?`${objColor}15`:"transparent",color:tab===k?objColor:T.txt2,
            fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Rajdhani',sans-serif",transition:"all 0.15s"}}>
            {l}
            {badge>0&&<span style={{marginLeft:6,background:T.red,color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:11,fontWeight:700}}>{badge}</span>}
          </button>
        ))}
      </div>

      {/* REPORTS TAB */}
      {tab==="reports"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {objReps.length===0
            ?<Card style={{padding:24,textAlign:"center"}} T={T}><div style={{fontSize:12,color:T.txt2}}>Нет отчётов по этому объекту</div></Card>
            :objReps.map(r=>{
              const isPending=r.status==="submitted";
              return(
                <Card key={r.id} accent={isPending?T.red:T.border} style={{padding:"14px 16px"}} T={T}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                        <span style={{fontSize:15,fontWeight:700,color:T.txt0,fontFamily:"'Oswald',sans-serif"}}>{r.date} · {r.sh==="day"?"☀ Дн":"☾ Ноч"}</span>
                        <StatusBadge status={r.status}/>
                      </div>
                      <div style={{fontSize:12,color:T.txt2,marginBottom:6}}>{r.by} · {r.submittedAt}</div>
                      <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
                        {[["⛏",r.df,"п.м",T.red],["💥",r.bf,"м³",T.amber],["⛽",r.fuel,"т",T.violet]].map(([ic,val,unit,c])=>(
                          <span key={ic} style={{fontSize:12}}><span style={{color:T.txt2}}>{ic} </span><b style={{color:c,fontFamily:"'Oswald',sans-serif"}}>{val}</b><span style={{color:T.txt2,fontSize:10}}> {unit}</span></span>
                        ))}
                      </div>
                    </div>
                    {isPending&&<Btn variant="primary" onClick={()=>openReview(r)} T={T} style={{fontSize:12,padding:"7px 16px"}}>ПРОВЕРИТЬ →</Btn>}
                  </div>
                </Card>
              );
            })
          }
        </div>
      )}

      {/* KTG TAB */}
      {tab==="ktg"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {objKtg.length===0
            ?<Card style={{padding:24,textAlign:"center"}} T={T}><div style={{fontSize:12,color:T.txt2}}>Нет КТГ-планов по этому объекту</div></Card>
            :objKtg.map(plan=>{
              const isPending=plan.status==="SUBMITTED";
              const avg=ktgAvg(plan);
              return(
                <Card key={plan.id} accent={isPending?T.red:T.border} style={{padding:"14px 16px"}} T={T}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                        <span style={{fontSize:15,fontWeight:700,color:T.txt0,fontFamily:"'Oswald',sans-serif"}}>{monthLabel(plan.year_month)}</span>
                        <KTGPlanBadge status={plan.status}/>
                      </div>
                      <div style={{fontSize:12,color:T.txt2,marginBottom:6}}>
                        {plan.created_by} · {plan.submitted_at?.slice(0,10)||"—"}
                      </div>
                      {avg!==null&&(
                        <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:4,
                          background:avg>=85?`${T.green}15`:`rgba(245,158,11,0.12)`,
                          border:`1px solid ${avg>=85?T.green+"40":"rgba(245,158,11,0.3)"}`}}>
                          <span style={{fontSize:18,fontWeight:700,color:avg>=85?T.green:T.amber,fontFamily:"'Oswald',sans-serif"}}>{avg}%</span>
                          <span style={{fontSize:11,color:T.txt2}}>ср. КТГ</span>
                        </div>
                      )}
                      {plan.status==="RETURNED"&&plan.engineer_comment&&(
                        <div style={{fontSize:12,color:"#f87171",marginTop:4}}>↩ {plan.engineer_comment}</div>
                      )}
                    </div>
                    {isPending&&<Btn variant="secondary" onClick={()=>{setKtgSel(plan);setKtgComment("");setKtgComErr("");}} T={T} style={{fontSize:12,padding:"7px 16px"}}>🔍 ПРОВЕРИТЬ →</Btn>}
                  </div>
                </Card>
              );
            })
          }
        </div>
      )}
    </div>
  );
}

// ─── ENGINEER: OBJECTS EDITOR ─────────────────────────────────────────────────
function ObjectsEditor({ objs, setObjs, rigs, setRigs, T }) {
  const [editing, setEditing] = useState(null);
  const [addRig,  setAddRig]  = useState({ oid: "", name: "" });
  const colors = OBJ_COLORS(T);

  function saveObj(edited) {
    setObjs((prev) => prev.map((o) => o.id === edited.id ? edited : o));
    setEditing(null);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ background: T.violet, color: "#fff", padding: "4px 12px", borderRadius: 3, fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>ИНЖЕНЕР</div>
        <div style={{ fontSize: 12, color: T.txt2 }}>Редактирование участков и станков</div>
      </div>
      <SectionTitle label="Управление" sub="УЧАСТКИ И СТАНКИ" T={T} />

      {editing && (
        <div style={{ position: "fixed", inset: 0, background: T.modalBg, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, width: "100%", maxWidth: 500, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.txt0, fontFamily: "'Oswald',sans-serif" }}>РЕДАКТИРОВАТЬ УЧАСТОК</div>
              <button onClick={() => setEditing(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: T.txt2 }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <FieldInput label="Название" value={editing.name} onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))} T={T} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FieldInput label="План бурения (п.м)" value={editing.dp} onChange={(e) => setEditing((p) => ({ ...p, dp: toNum(e.target.value) }))} T={T} />
                <FieldInput label="План взрыва (м³)"  value={editing.bp} onChange={(e) => setEditing((p) => ({ ...p, bp: toNum(e.target.value) }))} T={T} />
              </div>
              <FieldInput label="КТГ план (%)" value={editing.kp} onChange={(e) => setEditing((p) => ({ ...p, kp: toNum(e.target.value) }))} T={T} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <Btn variant="success" style={{ flex: 1 }} onClick={() => saveObj(editing)} T={T}>💾 Сохранить</Btn>
              <Btn variant="ghost" onClick={() => setEditing(null)} T={T}>Отмена</Btn>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {objs.map((obj, i) => {
          const ac       = colors[i % colors.length];
          const objRigs  = rigs.filter((r) => r.o === obj.id);
          return (
            <Card key={obj.id} accent={ac} T={T}>
              <div style={{ background: `${ac}10`, padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.txt0, fontFamily: "'Oswald',sans-serif" }}>{obj.name.toUpperCase()}</div>
                  <div style={{ fontSize: 12, color: T.txt2, marginTop: 2, textTransform: "uppercase" }}>
                    Бурение: <b style={{ color: T.txt0 }}>{obj.dp.toLocaleString()}</b> · Взрыв: <b style={{ color: T.txt0 }}>{obj.bp.toLocaleString()}</b> · КТГ: <b style={{ color: T.txt0 }}>{obj.kp}%</b>
                  </div>
                </div>
                <Btn variant="secondary" onClick={() => setEditing({ ...obj })} style={{ fontSize: 12, padding: "6px 14px" }} T={T}>✏ Редактировать</Btn>
              </div>
              <div style={{ padding: "12px 16px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.txt2, textTransform: "uppercase", marginBottom: 8 }}>Станки ({objRigs.length})</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {objRigs.map((rg) => (
                    <div key={rg.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 3, fontSize: 12, fontWeight: 600, color: T.txt1 }}>
                      <div style={{ width: 3, height: 3, borderRadius: "50%", background: ac }} />
                      {rg.n}
                      <button onClick={() => setRigs((prev) => prev.filter((r) => r.id !== rg.id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 13, lineHeight: 1, marginLeft: 3, padding: 0 }}>×</button>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <FieldInput
                    label="Добавить станок"
                    value={addRig.oid === String(obj.id) ? addRig.name : ""}
                    onChange={(e) => setAddRig({ oid: String(obj.id), name: e.target.value })}
                    placeholder="Название станка"
                    T={T}
                    style={{ flex: 1 }}
                  />
                  <Btn variant="secondary" onClick={() => {
                    if (addRig.name.trim() && addRig.oid === String(obj.id)) {
                      setRigs((prev) => [...prev, { id: genId(), n: addRig.name.trim(), o: obj.id }]);
                      setAddRig({ oid: "", name: "" });
                    }
                  }} T={T} style={{ fontSize: 12, padding: "9px 14px" }}>
                    + Добавить
                  </Btn>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── ENGINEER: USERS EDITOR ───────────────────────────────────────────────────
function UsersEditor({ users, setUsers, objs, T }) {
  const [editing,   setEditing]   = useState(null);     // foreman object being edited
  const [addForm,   setAddForm]   = useState(null);     // null or {} for new foreman form
  const [deleteConf, setDeleteConf] = useState(null);   // user to confirm delete

  const foremen   = users.filter((u) => u.role === "foreman");
  const engineers = users.filter((u) => u.role === "engineer");

  function saveUser(edited) {
    if (edited.id) {
      setUsers((prev) => prev.map((u) => u.id === edited.id ? edited : u));
    } else {
      if (!edited.name || !edited.login || !edited.pw) return;
      setUsers((prev) => [...prev, {
        ...edited,
        id: genId(),
        role: "foreman",
        ini: edited.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
      }]);
    }
    setEditing(null);
    setAddForm(null);
  }

  function confirmDelete() {
    setUsers((prev) => prev.filter((u) => u.id !== deleteConf.id));
    setDeleteConf(null);
  }

  function toggleOid(oid) {
    setEditing((prev) => {
      const cur  = prev.oids === "all" ? objs.map((o) => o.id) : [...prev.oids];
      const next = cur.includes(oid) ? cur.filter((x) => x !== oid) : [...cur, oid];
      return { ...prev, oids: next };
    });
  }
  function toggleOidAdd(oid) {
    setAddForm((prev) => {
      const cur  = (prev.oids || []);
      const next = cur.includes(oid) ? cur.filter((x) => x !== oid) : [...cur, oid];
      return { ...prev, oids: next };
    });
  }

  function UserModal({ data, setData, onSave, onClose, title }) {
    return (
      <div style={{ position: "fixed", inset: 0, background: T.modalBg, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, width: "100%", maxWidth: 500, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.txt0, fontFamily: "'Oswald',sans-serif" }}>{title}</div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: T.txt2 }}>×</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <FieldInput label="ФИО" value={data.name || ""} onChange={(e) => setData((p) => ({ ...p, name: e.target.value }))} T={T} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FieldInput label="Логин" value={data.login || ""} onChange={(e) => setData((p) => ({ ...p, login: e.target.value }))} T={T} />
              <FieldInput label="Пароль" value={data.pw || ""} onChange={(e) => setData((p) => ({ ...p, pw: e.target.value }))} T={T} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.txt2, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Участки</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {objs.map((o) => {
                  const has = data.oids === "all" || (data.oids || []).includes(o.id);
                  return (
                    <div key={o.id}
                      onClick={() => data.id ? toggleOid(o.id) : toggleOidAdd(o.id)}
                      style={{ padding: "5px 12px", background: has ? `${T.blue}20` : T.bg3, border: `1px solid ${has ? T.blue : T.border}`, borderRadius: 3, fontSize: 12, fontWeight: 600, color: has ? T.blue : T.txt2, cursor: "pointer" }}>
                      {o.name}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <Btn variant="success" style={{ flex: 1 }} onClick={() => onSave(data)} T={T}>💾 Сохранить</Btn>
            <Btn variant="ghost" onClick={onClose} T={T}>Отмена</Btn>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ background: T.violet, color: "#fff", padding: "4px 12px", borderRadius: 3, fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>ИНЖЕНЕР</div>
        <div style={{ fontSize: 12, color: T.txt2 }}>Управление начальниками участков</div>
      </div>
      <SectionTitle label="Персонал" sub="ПОЛЬЗОВАТЕЛИ" T={T} />

      {/* Edit modal */}
      {editing && (
        <UserModal data={editing} setData={setEditing} onSave={saveUser} onClose={() => setEditing(null)} title="РЕДАКТИРОВАТЬ НАЧ. УЧАСТКА" />
      )}
      {/* Add modal */}
      {addForm && (
        <UserModal data={addForm} setData={setAddForm} onSave={saveUser} onClose={() => setAddForm(null)} title="НОВЫЙ НАЧ. УЧАСТКА" />
      )}

      {/* Delete confirmation */}
      {deleteConf && (
        <div style={{ position: "fixed", inset: 0, background: T.modalBg, zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: T.bg2, border: "1px solid rgba(239,68,68,0.4)", borderRadius: 8, maxWidth: 400, width: "100%", padding: 28, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.txt0, fontFamily: "'Oswald',sans-serif", marginBottom: 8 }}>ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ</div>
            <div style={{ fontSize: 13, color: T.txt1, marginBottom: 20, lineHeight: 1.6 }}>
              Вы уверены, что хотите удалить пользователя<br />
              <b style={{ color: T.txt0 }}>{deleteConf.name}</b>?<br />
              <span style={{ color: "#f87171", fontSize: 12 }}>Это действие нельзя отменить.</span>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Btn variant="primary" style={{ background: "linear-gradient(135deg,#dc2626,#991b1b)" }} onClick={confirmDelete} T={T}>Да, удалить</Btn>
              <Btn variant="ghost" onClick={() => setDeleteConf(null)} T={T}>Отмена</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Engineers (read-only list) */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.txt2, textTransform: "uppercase", marginBottom: 10 }}>Инженеры</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 10 }}>
          {engineers.map((u) => (
            <Card key={u.id} accent={T.violet} style={{ padding: "14px 16px" }} T={T}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: 5, background: `${T.violet}20`, border: `1px solid ${T.violet}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: T.violet }}>{u.ini}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.txt0 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: T.violet, textTransform: "uppercase", fontWeight: 700 }}>Инженер</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Foremen */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.txt2, textTransform: "uppercase" }}>Начальники участков ({foremen.length})</div>
        <Btn variant="secondary" onClick={() => setAddForm({ name: "", login: "", pw: "", oids: [] })} T={T} style={{ fontSize: 12, padding: "6px 14px" }}>+ Добавить</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 10 }}>
        {foremen.map((u) => {
          const assignedObjs = u.oids === "all" ? objs : objs.filter((o) => u.oids.includes(o.id));
          return (
            <Card key={u.id} accent={T.blue} style={{ padding: "14px 16px" }} T={T}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 5, background: `${T.blue}20`, border: `1px solid ${T.blue}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: T.blue }}>{u.ini}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.txt0 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: T.blue, textTransform: "uppercase", fontWeight: 700 }}>Нач. участка</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn variant="ghost" onClick={() => setEditing({ ...u })} style={{ fontSize: 12, padding: "4px 10px" }} T={T}>✏ Изм.</Btn>
                  <Btn variant="danger" onClick={() => setDeleteConf(u)} style={{ fontSize: 12, padding: "4px 10px" }} T={T}>🗑</Btn>
                </div>
              </div>
              <div style={{ marginTop: 10, background: T.bg1, borderRadius: 3, padding: "6px 10px", border: `1px solid ${T.border}`, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: T.txt2 }}>
                <span style={{ color: T.txt0 }}>{u.login}</span> / {u.pw}
              </div>
              <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
                {assignedObjs.map((o) => (
                  <span key={o.id} style={{ padding: "2px 8px", background: `${T.cyan}15`, border: `1px solid ${T.cyan}30`, borderRadius: 3, fontSize: 12, fontWeight: 600, color: T.cyan }}>{o.name}</span>
                ))}
                {assignedObjs.length === 0 && <span style={{ fontSize: 12, color: T.txt2 }}>Нет участков</span>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── CEO: ENGINEER ASSIGNMENT ─────────────────────────────────────────────────
function EngineerAssign({ users, setUsers, T }) {
  const [tab,        setTab]        = useState("engineers");
  const [addForm,    setAddForm]    = useState(null);
  const [editing,    setEditing]    = useState(null);
  const [deleteConf, setDeleteConf] = useState(null);

  const engineers = users.filter((u) => u.role === "engineer");
  const mechanics = users.filter((u) => u.role === "mechanic");

  const activeRole = tab === "engineers" ? "engineer" : "mechanic";
  const activeColor = tab === "engineers" ? T.violet : "#f59e0b";
  const activeList  = tab === "engineers" ? engineers : mechanics;
  const activeLabel = tab === "engineers" ? "Инженер" : "Механик";

  function addUser(data) {
    if (!data.name || !data.login || !data.pw) return;
    setUsers((prev) => [...prev, {
      id: genId(), name: data.name, login: data.login, pw: data.pw,
      role: activeRole, oids: "all",
      ini: data.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
    }]);
    setAddForm(null);
  }

  function saveEdit(data) {
    setUsers((prev) => prev.map((u) => u.id === data.id
      ? { ...u, name: data.name, login: data.login, pw: data.pw, ini: data.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() }
      : u));
    setEditing(null);
  }

  function confirmDelete() {
    setUsers((prev) => prev.filter((u) => u.id !== deleteConf.id));
    setDeleteConf(null);
  }

  function UserModal({ data, setData, onSave, onClose, title, color }) {
    return (
      <div style={{ position: "fixed", inset: 0, background: T.modalBg, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderLeft: `3px solid ${color}`, borderRadius: 8, width: "100%", maxWidth: 460, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.txt0, fontFamily: "'Oswald',sans-serif" }}>{title}</div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: T.txt2 }}>×</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <FieldInput label="ФИО" value={data.name || ""} onChange={(e) => setData((p) => ({ ...p, name: e.target.value }))} T={T} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FieldInput label="Логин" value={data.login || ""} onChange={(e) => setData((p) => ({ ...p, login: e.target.value }))} T={T} />
              <FieldInput label="Пароль" value={data.pw || ""} onChange={(e) => setData((p) => ({ ...p, pw: e.target.value }))} T={T} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <Btn variant="success" style={{ flex: 1 }} onClick={() => onSave(data)} T={T}>💾 Сохранить</Btn>
            <Btn variant="ghost" onClick={onClose} T={T}>Отмена</Btn>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ background: T.red, color: "#fff", padding: "4px 12px", borderRadius: 3, fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>CEO</div>
        <div style={{ fontSize: 12, color: T.txt2 }}>Управление инженерами и механиками</div>
      </div>
      <SectionTitle label="Персонал" sub="ИНЖЕНЕРЫ И МЕХАНИКИ" T={T} />

      {addForm   && <UserModal data={addForm}  setData={setAddForm}  onSave={addUser}   onClose={() => setAddForm(null)}  title={`НОВЫЙ ${activeLabel.toUpperCase()}`} color={activeColor} />}
      {editing   && <UserModal data={editing}  setData={setEditing}  onSave={saveEdit}  onClose={() => setEditing(null)}  title={`РЕДАКТИРОВАТЬ ${activeLabel.toUpperCase()}`} color={activeColor} />}

      {deleteConf && (
        <div style={{ position: "fixed", inset: 0, background: T.modalBg, zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: T.bg2, border: "1px solid rgba(239,68,68,0.4)", borderRadius: 8, maxWidth: 400, width: "100%", padding: 28, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.txt0, fontFamily: "'Oswald',sans-serif", marginBottom: 8 }}>ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ</div>
            <div style={{ fontSize: 13, color: T.txt1, marginBottom: 20, lineHeight: 1.6 }}>
              Удалить <b style={{ color: activeColor }}>{activeLabel}</b><br />
              <b style={{ color: T.txt0 }}>{deleteConf.name}</b>?<br />
              <span style={{ color: "#f87171", fontSize: 12 }}>Это действие нельзя отменить.</span>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Btn variant="primary" style={{ background: "linear-gradient(135deg,#dc2626,#991b1b)" }} onClick={confirmDelete} T={T}>Да, удалить</Btn>
              <Btn variant="ghost" onClick={() => setDeleteConf(null)} T={T}>Отмена</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 0, background: T.bg3, borderRadius: 5, border: `1px solid ${T.border}`, overflow: "hidden" }}>
          {[["engineers", `Инженеры (${engineers.length})`, T.violet], ["mechanics", `Механики (${mechanics.length})`, "#f59e0b"]].map(([k, l, c]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{ padding: "8px 20px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
                background: tab === k ? c : "transparent",
                color: tab === k ? (k === "mechanics" ? "#000" : "#fff") : T.txt2,
                fontFamily: "'Rajdhani',sans-serif", textTransform: "uppercase" }}>
              {l}
            </button>
          ))}
        </div>
        <Btn variant="primary" style={{ background: `linear-gradient(135deg,${activeColor},${activeColor}cc)`, color: tab === "mechanics" ? "#000" : "#fff" }}
          onClick={() => setAddForm({ name: "", login: "", pw: "" })} T={T}>
          + Добавить {activeLabel.toLowerCase()}
        </Btn>
      </div>

      {activeList.length === 0 ? (
        <Card style={{ padding: 28, textAlign: "center" }} T={T}>
          <div style={{ fontSize: 12, color: T.txt2 }}>Нет {tab === "engineers" ? "инженеров" : "механиков"} — добавьте выше</div>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
          {activeList.map((u) => (
            <Card key={u.id} style={{ padding: 16, borderTop: `3px solid ${activeColor}` }} T={T}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 6, background: `${activeColor}20`, border: `2px solid ${activeColor}50`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: activeColor }}>{u.ini}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.txt0 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: activeColor, textTransform: "uppercase", fontWeight: 700 }}>{activeLabel}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn variant="ghost" onClick={() => setEditing({ ...u })} style={{ fontSize: 12, padding: "4px 10px" }} T={T}>✏</Btn>
                  <Btn variant="danger" onClick={() => setDeleteConf(u)} style={{ fontSize: 12, padding: "4px 10px" }} T={T}>🗑</Btn>
                </div>
              </div>
              <div style={{ marginTop: 12, background: T.bg1, borderRadius: 3, padding: "8px 10px", border: `1px solid ${T.border}`, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: T.txt2 }}>
                <span style={{ color: T.txt0 }}>{u.login}</span> / {u.pw}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: T.txt2 }}>Доступ: <b style={{ color: T.txt0 }}>все участки</b></div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


// ─── PLANNING PAGE (Engineer) ─────────────────────────────────────────────────
// Flow: click object card → pick period (month/week/day) + date → enter total per field
//       → auto-split to days, can adjust each day, remainder shown live

function PlanningPage({ objs, plans, setPlans, ktgPlans, setKtgPlans, nodes, T }) {
  const [activeTab, setActiveTab] = useState("ktg"); // "ktg" | "bvr"

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
        <div style={{background:T.violet,color:"#fff",padding:"4px 12px",borderRadius:3,fontSize:12,fontWeight:700,textTransform:"uppercase"}}>ИНЖЕНЕР</div>
        <div style={{fontSize:12,color:T.txt2}}>Планирование производства</div>
      </div>

      {/* Tab switcher */}
      <div style={{display:"flex",gap:0,marginBottom:24,background:T.bg2,borderRadius:6,border:`1px solid ${T.border}`,padding:4,width:"fit-content"}}>
        {[
          { key:"ktg", label:"📊 КТГ (согласованные)" },
          { key:"bvr", label:"⛏ Планы БВР" },
        ].map(tab=>(
          <button key={tab.key} onClick={()=>setActiveTab(tab.key)} style={{
            padding:"8px 20px",borderRadius:4,border:"none",cursor:"pointer",
            fontSize:13,fontWeight:700,position:"relative",
            background:activeTab===tab.key?`${T.violet}20`:"transparent",
            color:activeTab===tab.key?T.violet:T.txt2,
            borderBottom:activeTab===tab.key?`2px solid ${T.violet}`:"2px solid transparent",
            fontFamily:"'Rajdhani',sans-serif",transition:"all 0.15s",
          }}>
            {tab.label}
            {tab.badge>0&&(
              <span style={{marginLeft:8,background:T.red,color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:11,fontWeight:700}}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab==="ktg"
        ? <PlanningKTGTab ktgPlans={ktgPlans} objs={objs} nodes={nodes} T={T}/>
        : <PlanningBVRTab objs={objs} plans={plans} setPlans={setPlans} ktgPlans={ktgPlans} T={T}/>
      }
    </div>
  );
}

// ── КТГ Tab — only accepted plans (inbox moved to Входящие) ─────────────────
function PlanningKTGTab({ ktgPlans, objs, nodes, T }) {
  const accepted = ktgPlans.filter(p=>p.status==="ACCEPTED");
  return (
    <div>
      <div style={{marginBottom:16,padding:"10px 16px",background:`${T.blue}10`,borderRadius:6,border:`1px solid ${T.blue}30`,fontSize:12,color:T.txt2}}>
        💡 Новые КТГ-планы от механика поступают во <b style={{color:T.blue}}>Входящие</b>. Здесь отображаются только согласованные планы.
      </div>
      <KTGAcceptedView ktgPlans={accepted} objs={objs} nodes={nodes} T={T}/>
    </div>
  );
}

// ── Accepted: rich KTG view with gauges + per-asset breakdown ────────────────
function KTGAcceptedView({ ktgPlans, objs, nodes, T }) {
  const MON_RU=["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  const [selPlanId, setSelPlanId] = useState(null);

  const selPlan = ktgPlans.find(p=>p.id===selPlanId) || ktgPlans[0] || null;

  if(!ktgPlans.length) return(
    <Card style={{padding:"32px 24px",textAlign:"center",border:`2px dashed ${T.border}`}} T={T}>
      <div style={{fontSize:32,marginBottom:12}}>📋</div>
      <div style={{fontSize:13,color:T.txt2}}>Нет согласованных КТГ-планов</div>
      <div style={{fontSize:12,color:T.txt2,marginTop:4}}>Перейдите в «Входящие» чтобы согласовать планы от механика</div>
    </Card>
  );

  function planStats(plan){
    if(!plan?.items) return{avg:null,byAsset:[]};
    const[y,m]=plan.year_month.split("-").map(Number);
    const dim=new Date(y,m,0).getDate();
    const days=Array.from({length:dim},(_,i)=>`${plan.year_month}-${String(i+1).padStart(2,"0")}`);
    const assetIds=Object.keys(plan.items);
    const byAsset=assetIds.map(aid=>{
      const node=nodes.find(n=>n.id===aid);
      const readyDays=days.filter(d=>(plan.items[aid]||{})[d]==="READY").length;
      const maintDays=days.filter(d=>(plan.items[aid]||{})[d]==="MAINTENANCE").length;
      const repairDays=days.filter(d=>(plan.items[aid]||{})[d]==="REPAIR").length;
      const spareDays=days.filter(d=>(plan.items[aid]||{})[d]==="SPARE_WAIT").length;
      const ktg=Math.round(readyDays/dim*100);
      return{id:aid,name:node?.name||aid,ktg,readyDays,maintDays,repairDays,spareDays,dim};
    });
    const avg=byAsset.length?Math.round(byAsset.reduce((s,a)=>s+a.ktg,0)/byAsset.length):null;
    // daily ktg across all assets
    const dailyKtg=days.map(d=>{
      if(!assetIds.length)return{date:d,ktg:null};
      const ready=assetIds.filter(aid=>(plan.items[aid]||{})[d]==="READY").length;
      return{date:d,ktg:Math.round(ready/assetIds.length*100)};
    });
    return{avg,byAsset,dailyKtg,dim,days};
  }

  const stats = selPlan ? planStats(selPlan) : null;

  function monthLabel(ym){const[y,m]=ym.split("-");return`${MON_RU[parseInt(m,10)-1]} ${y}`;}

  // Sparkline — mini bar chart of daily KTG
  function Sparkline({dailyKtg,T}){
    const h=36, w=Math.min(dailyKtg.length*7, 280);
    const barW=Math.floor(w/dailyKtg.length)-1;
    return(
      <svg width={w} height={h} style={{display:"block"}}>
        {dailyKtg.map((d,i)=>{
          const v=d.ktg??0;
          const bh=Math.max(2,Math.round(v/100*h));
          const c=v>=85?T.green:v>=70?T.amber:"#ef4444";
          return<rect key={i} x={i*(barW+1)} y={h-bh} width={barW} height={bh} fill={c} rx={1} opacity={0.85}/>;
        })}
        {/* 85% line */}
        <line x1={0} y1={h-Math.round(85/100*h)} x2={w} y2={h-Math.round(85/100*h)} stroke={T.green} strokeWidth={0.8} strokeDasharray="3,2" opacity={0.5}/>
      </svg>
    );
  }

  return(
    <div>
      <SectionTitle label="Согласованные КТГ-планы" sub="ГОТОВНОСТЬ ТЕХНИКИ" T={T}/>

      {/* Plan selector pills */}
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {ktgPlans.map(plan=>{
          const obj=objs.find(o=>o.id===plan.object_id);
          const isSel=selPlan?.id===plan.id;
          const s=planStats(plan);
          const ac=s.avg>=85?T.green:s.avg>=70?T.amber:"#ef4444";
          return(
            <div key={plan.id} onClick={()=>setSelPlanId(plan.id)}
              style={{padding:"10px 16px",borderRadius:7,cursor:"pointer",
                background:isSel?`${ac}15`:T.bg2,
                border:`2px solid ${isSel?ac:T.border}`,
                minWidth:140,transition:"all 0.15s"}}>
              <div style={{fontSize:13,fontWeight:700,color:T.txt0,fontFamily:"'Oswald',sans-serif"}}>{obj?.name||"—"}</div>
              <div style={{fontSize:11,color:T.txt2,marginBottom:6}}>{monthLabel(plan.year_month)}</div>
              <div style={{fontSize:26,fontWeight:900,color:ac,fontFamily:"'Oswald',sans-serif",lineHeight:1}}>
                {s.avg!==null?`${s.avg}%`:"—"}
              </div>
              <div style={{fontSize:10,color:T.txt2,marginTop:2}}>ср. КТГ</div>
            </div>
          );
        })}
      </div>

      {selPlan&&stats&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {/* Header */}
          <div style={{display:"flex",alignItems:"center",gap:16,padding:"16px 20px",
            background:T.bg2,borderRadius:8,border:`1px solid ${T.border}`,
            borderLeft:`4px solid ${stats.avg>=85?T.green:stats.avg>=70?T.amber:"#ef4444"}`,flexWrap:"wrap"}}>
            <div>
              <div style={{fontSize:11,color:T.txt2,textTransform:"uppercase",letterSpacing:".1em",marginBottom:2}}>
                {objs.find(o=>o.id===selPlan.object_id)?.name} · {monthLabel(selPlan.year_month)}
              </div>
              <div style={{fontSize:11,color:T.txt2}}>Утверждён: {selPlan.decided_at?.slice(0,10)||"—"} · от {selPlan.created_by}</div>
            </div>
            {/* Big KTG gauge */}
            <div style={{textAlign:"center",marginLeft:"auto"}}>
              <KTGGauge v={stats.avg} plan={85} size={80} T={T}/>
              <div style={{fontSize:11,color:T.txt2,marginTop:2}}>Общий КТГ</div>
            </div>
            {/* Summary stats */}
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              {[
                [T.green,"✅ Готов",stats.byAsset.reduce((s,a)=>s+a.readyDays,0),"ст/дн"],
                [T.amber,"🔧 ТО",stats.byAsset.reduce((s,a)=>s+a.maintDays,0),"ст/дн"],
                ["#ef4444","🛠 Ремонт",stats.byAsset.reduce((s,a)=>s+a.repairDays,0),"ст/дн"],
                [T.violet,"📦 Запчасти",stats.byAsset.reduce((s,a)=>s+a.spareDays,0),"ст/дн"],
              ].map(([c,lbl,val,u])=>(
                <div key={lbl} style={{textAlign:"center",padding:"8px 12px",background:`${c}12`,borderRadius:6,border:`1px solid ${c}30`,minWidth:70}}>
                  <div style={{fontSize:11,color:c,fontWeight:700,marginBottom:2}}>{lbl}</div>
                  <div style={{fontSize:20,fontWeight:700,color:c,fontFamily:"'Oswald',sans-serif",lineHeight:1}}>{val}</div>
                  <div style={{fontSize:10,color:T.txt2}}>{u}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily KTG sparkline */}
          <Card T={T} style={{padding:"16px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:700,color:T.txt0,textTransform:"uppercase"}}>📈 КТГ по дням</div>
              <div style={{display:"flex",gap:12,fontSize:11,color:T.txt2}}>
                <span style={{color:T.green}}>▬ ≥85%</span>
                <span style={{color:T.amber}}>▬ 70–84%</span>
                <span style={{color:"#ef4444"}}>▬ &lt;70%</span>
              </div>
            </div>
            <div style={{overflowX:"auto"}}>
              <div style={{display:"flex",gap:0,alignItems:"flex-end",minWidth:stats.dailyKtg?.length*14||200}}>
                {stats.dailyKtg?.map((d,i)=>{
                  const v=d.ktg??0;
                  const c=v>=85?T.green:v>=70?T.amber:"#ef4444";
                  const dayNum=parseInt(d.date.slice(8),10);
                  const dow=new Date(d.date).getDay();
                  return(
                    <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1,minWidth:12}}>
                      <div style={{fontSize:9,color:c,fontWeight:700,marginBottom:2}}>{v>0?`${v}`:"·"}</div>
                      <div style={{width:"100%",maxWidth:18,borderRadius:"2px 2px 0 0",
                        height:Math.max(3,Math.round(v/100*80)),
                        background:c,opacity:0.85,transition:"height 0.3s"}}/>
                      <div style={{fontSize:8,color:dow===0||dow===6?T.amber:T.txt2,marginTop:2}}>{dayNum}</div>
                    </div>
                  );
                })}
              </div>
              {/* 85% target line label */}
              <div style={{fontSize:10,color:T.green,marginTop:4}}>── цель 85%</div>
            </div>
          </Card>

          {/* Per-asset breakdown */}
          <Card T={T}>
            <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,
              display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:12,fontWeight:700,color:T.txt0,textTransform:"uppercase"}}>⚙ Разбивка по станкам</div>
              <div style={{fontSize:11,color:T.txt2}}>{stats.byAsset.length} единиц техники</div>
            </div>
            <div style={{padding:"8px 0"}}>
              {stats.byAsset.sort((a,b)=>b.ktg-a.ktg).map((a,i)=>{
                const c=a.ktg>=85?T.green:a.ktg>=70?T.amber:"#ef4444";
                return(
                  <div key={a.id} style={{
                    display:"flex",alignItems:"center",gap:12,
                    padding:"10px 16px",
                    borderBottom:i<stats.byAsset.length-1?`1px solid ${T.border}`:"none",
                    background:i%2?T.rowAlt:"transparent",
                  }}>
                    {/* Rank */}
                    <div style={{width:24,height:24,borderRadius:"50%",background:`${c}20`,border:`1px solid ${c}40`,
                      display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:c,flexShrink:0}}>
                      {i+1}
                    </div>
                    {/* Name */}
                    <div style={{minWidth:90,fontWeight:700,color:T.txt0,fontSize:13}}>{a.name}</div>
                    {/* KTG bar */}
                    <div style={{flex:1,minWidth:100}}>
                      <div style={{height:6,background:T.border,borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${a.ktg}%`,background:c,borderRadius:3,transition:"width 0.6s"}}/>
                      </div>
                    </div>
                    {/* KTG value */}
                    <div style={{fontSize:18,fontWeight:700,color:c,fontFamily:"'Oswald',sans-serif",minWidth:48,textAlign:"right"}}>{a.ktg}%</div>
                    {/* Day breakdown */}
                    <div style={{display:"flex",gap:6,flexShrink:0}}>
                      {[
                        {c:T.green, icon:"✅", v:a.readyDays},
                        {c:T.amber, icon:"🔧", v:a.maintDays},
                        {c:"#ef4444",icon:"🛠",v:a.repairDays},
                        {c:T.violet,icon:"📦",v:a.spareDays},
                      ].filter(x=>x.v>0).map(x=>(
                        <span key={x.icon} style={{fontSize:11,color:x.c,fontWeight:700,
                          padding:"2px 6px",background:`${x.c}12`,borderRadius:3,border:`1px solid ${x.c}30`}}>
                          {x.icon} {x.v}д
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Summary row */}
            <div style={{padding:"12px 16px",borderTop:`1px solid ${T.border}`,background:T.bg3,
              display:"flex",alignItems:"center",gap:12}}>
              <div style={{flex:1,fontSize:12,fontWeight:700,color:T.txt2,textTransform:"uppercase"}}>СРЕДНЕЕ ПО ПАРКУ</div>
              <div style={{flex:1,minWidth:100}}>
                <div style={{height:6,background:T.border,borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${stats.avg||0}%`,
                    background:stats.avg>=85?T.green:stats.avg>=70?T.amber:"#ef4444",borderRadius:3}}/>
                </div>
              </div>
              <div style={{fontSize:22,fontWeight:700,
                color:stats.avg>=85?T.green:stats.avg>=70?T.amber:"#ef4444",
                fontFamily:"'Oswald',sans-serif",minWidth:48,textAlign:"right"}}>{stats.avg}%</div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── ПЛАНЫ БВР Tab — monthly calendar per object ───────────────────────────────
function PlanningBVRTab({ objs, plans, setPlans, ktgPlans, T }) {
  const MON_RU  = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  const DOW_SH  = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];
  const colors  = OBJ_COLORS(T);

  const [yearMonth, setYearMonth] = useState(() => new Date().toISOString().slice(0,7));
  const [selObjId,  setSelObjId]  = useState(null);
  const [editCell,  setEditCell]  = useState(null); // date string when editing a specific day

  const [yr, mo] = yearMonth.split("-").map(Number);
  const dim = new Date(yr, mo, 0).getDate();
  const days = Array.from({length:dim}, (_,i) => `${yearMonth}-${String(i+1).padStart(2,"0")}`);

  // ── Data helpers ─────────────────────────────────────────────────────────────
  function getPlan(objId, field) {
    return plans.find(p => p.oid===objId && p.field===field && p.mode==="month" && p.periodKey===yearMonth);
  }
  function getVal(objId, date, field) {
    return getPlan(objId,field)?.dates?.find(d=>d.date===date)?.val || 0;
  }
  function getMonthTotal(objId, field) {
    return getPlan(objId,field)?.dates?.reduce((s,d)=>s+d.val,0) || 0;
  }
  function upsertPlan(objId, field, newDates) {
    setPlans(prev => {
      const ex = prev.find(p=>p.oid===objId&&p.field===field&&p.mode==="month"&&p.periodKey===yearMonth);
      if (ex) return prev.map(p=>p.oid===objId&&p.field===field&&p.mode==="month"&&p.periodKey===yearMonth?{...p,dates:newDates}:p);
      return [...prev, {id:genId(),oid:objId,field,mode:"month",periodKey:yearMonth,dates:newDates}];
    });
  }
  // Spread total evenly across all days
  function setMonthTotal(objId, field, totalStr) {
    const total = parseFloat(totalStr)||0;
    const base  = Math.floor(total/dim);
    const rem   = total - base*dim;
    upsertPlan(objId, field, days.map((d,i)=>({date:d,val:i===0?base+rem:base})));
  }
  // Set single day
  function setSingleDay(objId, field, date, val) {
    const v = parseFloat(val)||0;
    const ex = getPlan(objId,field);
    const newDates = days.map(d=>({date:d,val:d===date?v:(ex?.dates?.find(x=>x.date===d)?.val||0)}));
    upsertPlan(objId, field, newDates);
  }

  // КТГ from accepted plan
  function getAcceptedKtgAvg(objId) {
    const plan = ktgPlans.find(p=>p.status==="ACCEPTED"&&p.object_id===objId&&p.year_month===yearMonth);
    if (!plan?.items) return null;
    const aids = Object.keys(plan.items);
    if (!aids.length) return null;
    const ktgs = days.map(d=>{
      const ready = aids.filter(aid=>(plan.items[aid]||{})[d]==="READY").length;
      return Math.round(ready/aids.length*100);
    });
    return Math.round(ktgs.reduce((s,v)=>s+v,0)/ktgs.length);
  }
  function getDayKtg(objId, date) {
    const plan = ktgPlans.find(p=>p.status==="ACCEPTED"&&p.object_id===objId&&p.year_month===yearMonth);
    if (!plan?.items) return null;
    const aids = Object.keys(plan.items);
    if (!aids.length) return null;
    return Math.round(aids.filter(aid=>(plan.items[aid]||{})[date]==="READY").length/aids.length*100);
  }

  function prevMonth(){const d=new Date(yr,mo-2,1);setYearMonth(d.toISOString().slice(0,7));setSelObjId(null);}
  function nextMonth(){const d=new Date(yr,mo,1);setYearMonth(d.toISOString().slice(0,7));setSelObjId(null);}

  // ══════════════════════════════════════════════════════════════════════════════
  // OVERVIEW — grid of object cards
  // ══════════════════════════════════════════════════════════════════════════════
  if (!selObjId) {
    const grandDf = objs.reduce((s,o)=>s+getMonthTotal(o.id,"df"),0);
    const grandBf = objs.reduce((s,o)=>s+getMonthTotal(o.id,"bf"),0);
    return (
      <div>
        {/* Month nav */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}>
          <button onClick={prevMonth} style={{padding:"7px 16px",borderRadius:5,border:`1px solid ${T.border}`,background:T.bg2,color:T.txt1,cursor:"pointer",fontSize:13,fontFamily:"'Rajdhani',sans-serif",fontWeight:600}}>← Пред.</button>
          <div style={{fontSize:18,fontWeight:700,color:T.txt0,fontFamily:"'Oswald',sans-serif",minWidth:140,textAlign:"center",letterSpacing:"1px"}}>
            {MON_RU[mo-1].toUpperCase()} {yr}
          </div>
          <button onClick={nextMonth} style={{padding:"7px 16px",borderRadius:5,border:`1px solid ${T.border}`,background:T.bg2,color:T.txt1,cursor:"pointer",fontSize:13,fontFamily:"'Rajdhani',sans-serif",fontWeight:600}}>След. →</button>
          <input type="month" value={yearMonth} onChange={e=>{setYearMonth(e.target.value);setSelObjId(null);}}
            style={{padding:"7px 12px",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:5,color:T.txt0,fontSize:13,fontFamily:"'Rajdhani',sans-serif",outline:"none",marginLeft:4}}/>
          <div style={{marginLeft:"auto",fontSize:12,color:T.txt2}}>Нажмите на объект для ввода плана по дням</div>
        </div>

        {/* Grand totals */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10,marginBottom:20}}>
          {[
            {c:T.red,   icon:"⛏",  lbl:"Бурение",  val:grandDf, unit:"п.м"},
            {c:T.amber, icon:"💥", lbl:"Взрыв",    val:grandBf, unit:"м³"},
            {c:T.violet,icon:"🏗",  lbl:"Объектов", val:objs.length, unit:"объектов"},
            {c:T.txt2,  icon:"📅", lbl:"Дней",     val:dim, unit:"в месяце"},
          ].map(({c,icon,lbl,val,unit})=>(
            <Card key={lbl} T={T} style={{padding:"12px 16px"}}>
              <div style={{fontSize:10,color:T.txt2,textTransform:"uppercase",marginBottom:4}}>{icon} {lbl}</div>
              <div style={{fontSize:24,fontWeight:700,color:c,fontFamily:"'Oswald',sans-serif",lineHeight:1}}>{val>0?val.toLocaleString():"—"}</div>
              <div style={{fontSize:10,color:T.txt2,marginTop:2}}>{unit}</div>
            </Card>
          ))}
        </div>

        {/* Object cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:12}}>
          {objs.map((obj,i)=>{
            const ac  = colors[i%colors.length];
            const df  = getMonthTotal(obj.id,"df");
            const bf  = getMonthTotal(obj.id,"bf");
            const ktg = getAcceptedKtgAvg(obj.id);
            const hasData = df>0||bf>0;
            return(
              <div key={obj.id} onClick={()=>setSelObjId(obj.id)}
                style={{borderRadius:8,overflow:"hidden",border:`2px solid ${T.border}`,background:T.bg2,
                  cursor:"pointer",transition:"all 0.15s",boxShadow:`0 2px 8px ${T.cardSh}`}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=ac;e.currentTarget.style.boxShadow=`0 4px 16px ${ac}30`;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.boxShadow=`0 2px 8px ${T.cardSh}`;}}>
                <div style={{height:4,background:`linear-gradient(90deg,${ac},${ac}50)`}}/>
                <div style={{padding:"14px 16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                    <div>
                      <div style={{fontSize:15,fontWeight:700,color:T.txt0,fontFamily:"'Oswald',sans-serif",letterSpacing:"1px"}}>{obj.name.toUpperCase()}</div>
                      <div style={{fontSize:11,color:T.txt2,marginTop:2}}>{MON_RU[mo-1]} {yr} · {dim} дней</div>
                    </div>
                    {ktg!==null&&(
                      <div style={{textAlign:"center",padding:"6px 12px",borderRadius:6,
                        background:ktg>=85?`${T.green}15`:`rgba(245,158,11,0.12)`,
                        border:`1px solid ${ktg>=85?T.green+"40":"rgba(245,158,11,0.3)"}`}}>
                        <div style={{fontSize:20,fontWeight:700,color:ktg>=85?T.green:T.amber,fontFamily:"'Oswald',sans-serif",lineHeight:1}}>{ktg}%</div>
                        <div style={{fontSize:9,color:T.txt2,marginTop:2}}>КТГ</div>
                      </div>
                    )}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                    {[
                      {c:T.red,   icon:"⛏", lbl:"Бурение", val:df, unit:"п.м"},
                      {c:T.amber, icon:"💥", lbl:"Взрыв",   val:bf, unit:"м³"},
                    ].map(({c,icon,lbl,val,unit})=>(
                      <div key={lbl} style={{padding:"8px 10px",background:T.bg3,borderRadius:5,border:`1px solid ${T.border}`}}>
                        <div style={{fontSize:10,color:c,fontWeight:700,textTransform:"uppercase",marginBottom:3}}>{icon} {lbl}</div>
                        {val>0
                          ?<><div style={{fontSize:18,fontWeight:700,color:c,fontFamily:"'Oswald',sans-serif",lineHeight:1}}>{val.toLocaleString()}</div>
                            <div style={{fontSize:10,color:T.txt2,marginTop:1}}>{unit}</div></>
                          :<div style={{fontSize:12,color:T.txt2}}>Не задан</div>}
                      </div>
                    ))}
                  </div>
                  <div style={{textAlign:"center",padding:"8px",borderRadius:5,
                    background:hasData?`${ac}12`:`${T.border}20`,border:`1px solid ${hasData?ac+"40":T.border}`}}>
                    <span style={{fontSize:12,fontWeight:700,color:hasData?ac:T.txt2}}>{hasData?"✏ Изменить план":"+ Задать план на месяц"}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DETAIL — monthly calendar for one object
  // ══════════════════════════════════════════════════════════════════════════════
  const obj      = objs.find(o=>o.id===selObjId);
  const objColor = colors[objs.findIndex(o=>o.id===selObjId)%colors.length];
  const totDf    = getMonthTotal(selObjId,"df");
  const totBf    = getMonthTotal(selObjId,"bf");
  const ktgAvg   = getAcceptedKtgAvg(selObjId);
  const ktgPlan  = ktgPlans.find(p=>p.status==="ACCEPTED"&&p.object_id===selObjId&&p.year_month===yearMonth);

  // Cell-level edit modal
  function CellModal() {
    if (!editCell) return null;
    const [dfV, setDfV] = useState(String(getVal(selObjId,editCell,"df")||""));
    const [bfV, setBfV] = useState(String(getVal(selObjId,editCell,"bf")||""));
    const dn  = parseInt(editCell.slice(8),10);
    const dow = new Date(editCell).getDay();
    const dayKtg = getDayKtg(selObjId,editCell);
    function save(){
      setSingleDay(selObjId,"df",editCell,dfV);
      setSingleDay(selObjId,"bf",editCell,bfV);
      setEditCell(null);
    }
    return(
      <div style={{position:"fixed",inset:0,background:T.modalBg,zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderLeft:`4px solid ${objColor}`,borderRadius:8,width:"100%",maxWidth:360}}>
          <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:T.bg3}}>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:T.txt0,fontFamily:"'Oswald',sans-serif"}}>{obj?.name} · {dn} {MON_RU[mo-1]} {yr}</div>
              <div style={{fontSize:11,color:T.txt2,marginTop:2}}>{DOW_SH[dow]}{dayKtg!==null?` · КТГ: ${dayKtg}%`:""}</div>
            </div>
            <button onClick={()=>setEditCell(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:T.txt2,lineHeight:1}}>×</button>
          </div>
          <div style={{padding:18,display:"flex",flexDirection:"column",gap:14}}>
            <FieldInput label="⛏ Бурение (п.м)" type="number" value={dfV} onChange={e=>setDfV(e.target.value)} T={T}/>
            <FieldInput label="💥 Взрыв (м³)" type="number" value={bfV} onChange={e=>setBfV(e.target.value)} T={T}/>
            {dayKtg!==null&&(
              <div style={{padding:"8px 12px",borderRadius:5,background:dayKtg>=85?`${T.green}12`:`rgba(245,158,11,0.1)`,
                border:`1px solid ${dayKtg>=85?T.green+"40":"rgba(245,158,11,0.3)"}`}}>
                <span style={{fontSize:12,color:T.txt2}}>⚙ КТГ план на этот день: </span>
                <span style={{fontSize:14,fontWeight:700,color:dayKtg>=85?T.green:T.amber}}>{dayKtg}%</span>
              </div>
            )}
            <div style={{display:"flex",gap:8}}>
              <Btn variant="success" style={{flex:1,padding:"10px"}} onClick={save} T={T}>✓ Сохранить</Btn>
              <Btn variant="ghost" style={{padding:"10px 16px"}} onClick={()=>setEditCell(null)} T={T}>Отмена</Btn>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return(
    <div>
      <CellModal/>

      {/* Breadcrumb + month nav */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:18,flexWrap:"wrap"}}>
        <button onClick={()=>setSelObjId(null)} style={{padding:"6px 14px",borderRadius:5,border:`1px solid ${T.border}`,background:T.bg2,color:T.txt2,cursor:"pointer",fontSize:12,fontFamily:"'Rajdhani',sans-serif",fontWeight:600}}>← Все объекты</button>
        <span style={{color:T.txt2,fontSize:14}}>›</span>
        <div style={{padding:"5px 14px",borderRadius:5,background:`${objColor}15`,border:`1px solid ${objColor}40`,fontSize:13,fontWeight:700,color:objColor,fontFamily:"'Oswald',sans-serif"}}>{obj?.name}</div>
        <div style={{marginLeft:"auto",display:"flex",gap:6,alignItems:"center"}}>
          <button onClick={prevMonth} style={{padding:"5px 12px",borderRadius:4,border:`1px solid ${T.border}`,background:T.bg2,color:T.txt1,cursor:"pointer",fontSize:14,lineHeight:1}}>←</button>
          <span style={{fontSize:14,fontWeight:700,color:T.txt0,fontFamily:"'Oswald',sans-serif",minWidth:120,textAlign:"center"}}>{MON_RU[mo-1]} {yr}</span>
          <button onClick={nextMonth} style={{padding:"5px 12px",borderRadius:4,border:`1px solid ${T.border}`,background:T.bg2,color:T.txt1,cursor:"pointer",fontSize:14,lineHeight:1}}>→</button>
        </div>
      </div>

      {/* Summary + quick-total inputs */}
      <div style={{display:"flex",gap:12,marginBottom:18,flexWrap:"wrap"}}>
        {/* Drill total input */}
        <Card accent={T.red} style={{padding:"12px 18px",minWidth:180}} T={T}>
          <div style={{fontSize:10,color:T.txt2,textTransform:"uppercase",marginBottom:6,letterSpacing:".1em"}}>⛏ Бурение — план месяца</div>
          <input type="number" value={totDf||""} placeholder="0"
            onChange={e=>setMonthTotal(selObjId,"df",e.target.value)}
            style={{fontSize:28,fontWeight:700,color:T.red,fontFamily:"'Oswald',sans-serif",
              background:"transparent",border:"none",outline:"none",width:"100%",padding:0,lineHeight:1,
              borderBottom:`2px solid ${T.red}50`}}/>
          <div style={{fontSize:11,color:T.txt2,marginTop:6}}>п.м · раскидает равномерно по дням</div>
        </Card>

        {/* Blast total input */}
        <Card accent={T.amber} style={{padding:"12px 18px",minWidth:180}} T={T}>
          <div style={{fontSize:10,color:T.txt2,textTransform:"uppercase",marginBottom:6,letterSpacing:".1em"}}>💥 Взрыв — план месяца</div>
          <input type="number" value={totBf||""} placeholder="0"
            onChange={e=>setMonthTotal(selObjId,"bf",e.target.value)}
            style={{fontSize:28,fontWeight:700,color:T.amber,fontFamily:"'Oswald',sans-serif",
              background:"transparent",border:"none",outline:"none",width:"100%",padding:0,lineHeight:1,
              borderBottom:`2px solid ${T.amber}50`}}/>
          <div style={{fontSize:11,color:T.txt2,marginTop:6}}>м³ · раскидает равномерно по дням</div>
        </Card>

        {/* KTG from mechanic */}
        {ktgAvg!==null?(
          <Card accent={T.green} style={{padding:"12px 18px",minWidth:150}} T={T}>
            <div style={{fontSize:10,color:T.txt2,textTransform:"uppercase",marginBottom:6,letterSpacing:".1em"}}>⚙ КТГ план (механик)</div>
            <div style={{fontSize:32,fontWeight:700,color:ktgAvg>=85?T.green:T.amber,fontFamily:"'Oswald',sans-serif",lineHeight:1}}>{ktgAvg}%</div>
            <div style={{fontSize:11,color:T.txt2,marginTop:6}}>Из согласованного плана</div>
          </Card>
        ):(
          <Card style={{padding:"12px 18px",minWidth:150,border:`2px dashed ${T.border}`}} T={T}>
            <div style={{fontSize:10,color:T.txt2,textTransform:"uppercase",marginBottom:6}}>⚙ КТГ план</div>
            <div style={{fontSize:13,color:T.txt2,fontStyle:"italic"}}>Не согласован</div>
            <div style={{fontSize:11,color:T.txt2,marginTop:4}}>Запросите план у механика</div>
          </Card>
        )}

        {/* Hint card */}
        <Card style={{padding:"12px 18px",flex:1,minWidth:180}} T={T}>
          <div style={{fontSize:10,color:T.txt2,textTransform:"uppercase",marginBottom:8}}>💡 Быстрый ввод</div>
          <div style={{fontSize:12,color:T.txt1,lineHeight:1.7}}>
            <span style={{color:T.txt0,fontWeight:600}}>Итог</span> → введи месячный объём, дни заполнятся равномерно<br/>
            <span style={{color:T.txt0,fontWeight:600}}>Ячейка</span> → нажми на конкретный день для точной правки
          </div>
        </Card>
      </div>

      {/* Monthly calendar table */}
      <Card T={T}>
        <div style={{padding:"10px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:13,fontWeight:700,color:T.txt0,fontFamily:"'Oswald',sans-serif",textTransform:"uppercase"}}>
            📅 Дневной план — {MON_RU[mo-1]} {yr}
          </div>
          <div style={{fontSize:11,color:T.txt2}}>Нажмите на ячейку для правки конкретного дня</div>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{borderCollapse:"collapse",width:"100%",minWidth:Math.max(640,dim*40+180)}}>
            <thead>
              <tr style={{background:T.bg3}}>
                <th style={{padding:"8px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:T.txt2,
                  textTransform:"uppercase",borderBottom:`1px solid ${T.border}`,
                  minWidth:120,position:"sticky",left:0,background:T.bg3,zIndex:3,
                  borderRight:`1px solid ${T.border}`}}>Показатель</th>
                {days.map(d=>{
                  const dn  = parseInt(d.slice(8),10);
                  const dow = new Date(d).getDay();
                  const isWe = dow===0||dow===6;
                  return(
                    <th key={d} style={{padding:"3px 1px",textAlign:"center",fontSize:10,fontWeight:700,
                      color:isWe?T.amber:T.txt2,borderBottom:`1px solid ${T.border}`,minWidth:38,
                      background:isWe?`${T.amber}0A`:T.bg3}}>
                      <div style={{lineHeight:1.4}}>{dn}</div>
                      <div style={{fontSize:8,opacity:0.7,lineHeight:1}}>{DOW_SH[dow]}</div>
                    </th>
                  );
                })}
                <th style={{padding:"8px 10px",textAlign:"center",fontSize:11,fontWeight:700,color:T.txt1,
                  borderBottom:`1px solid ${T.border}`,minWidth:70,
                  position:"sticky",right:0,background:T.bg3,zIndex:3,borderLeft:`2px solid ${T.border}`}}>
                  ИТОГО
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {field:"df",color:T.red,  label:"⛏ Бурение",unit:"п.м"},
                {field:"bf",color:T.amber,label:"💥 Взрыв",  unit:"м³"},
              ].map(({field,color,label,unit},ri)=>{
                const rowTotal = getMonthTotal(selObjId,field);
                return(
                  <tr key={field} style={{background:ri%2?T.rowAlt:"transparent"}}>
                    <td style={{padding:"6px 14px",fontWeight:700,color,fontSize:12,
                      position:"sticky",left:0,background:ri%2?T.rowAlt:T.bg2,zIndex:2,
                      borderRight:`1px solid ${T.border}`,whiteSpace:"nowrap"}}>
                      {label}
                    </td>
                    {days.map(d=>{
                      const v   = getVal(selObjId,d,field);
                      const dow = new Date(d).getDay();
                      const isWe= dow===0||dow===6;
                      return(
                        <td key={d} style={{padding:"2px 1px",textAlign:"center",background:isWe?`${T.amber}06`:"transparent"}}>
                          <div
                            onClick={()=>setEditCell(d)}
                            style={{width:36,height:30,margin:"0 auto",borderRadius:5,cursor:"pointer",
                              background:v>0?`${color}18`:T.bg3,
                              border:`1px solid ${v>0?color+"50":T.border}`,
                              display:"flex",alignItems:"center",justifyContent:"center",
                              fontSize:v>=100?9:10,fontWeight:700,color:v>0?color:T.txt2,
                              transition:"all 0.08s"}}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor=color;e.currentTarget.style.background=`${color}28`;}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor=v>0?color+"50":T.border;e.currentTarget.style.background=v>0?`${color}18`:T.bg3;}}>
                            {v>0?(v>=1000?`${(v/1000).toFixed(1)}k`:v%1===0?v:v.toFixed(1)):"·"}
                          </div>
                        </td>
                      );
                    })}
                    <td style={{padding:"6px 10px",textAlign:"center",fontWeight:700,
                      fontSize:rowTotal>0?18:13,color:rowTotal>0?color:T.txt2,
                      fontFamily:"'Oswald',sans-serif",
                      position:"sticky",right:0,background:ri%2?T.rowAlt:T.bg2,zIndex:2,
                      borderLeft:`2px solid ${T.border}`,whiteSpace:"nowrap"}}>
                      {rowTotal>0?rowTotal.toLocaleString():"—"}
                      {rowTotal>0&&<div style={{fontSize:9,color:T.txt2,fontFamily:"'Rajdhani',sans-serif",fontWeight:400}}>{unit}</div>}
                    </td>
                  </tr>
                );
              })}

              {/* КТГ row — from accepted plan */}
              {(()=>{
                const aids = ktgPlan ? Object.keys(ktgPlan.items||{}) : [];
                const hasPlan = aids.length > 0;
                return(
                  <tr style={{background:`${T.green}06`,borderTop:`2px solid ${T.border}`}}>
                    <td style={{padding:"6px 14px",fontWeight:700,color:T.green,fontSize:12,
                      position:"sticky",left:0,background:`${T.green}06`,zIndex:2,
                      borderRight:`1px solid ${T.border}`,whiteSpace:"nowrap"}}>
                      ⚙ КТГ план
                    </td>
                    {days.map(d=>{
                      const v  = hasPlan ? getDayKtg(selObjId,d) : null;
                      const c  = v===null?null:v>=85?T.green:v>=70?T.amber:"#ef4444";
                      const dow= new Date(d).getDay();
                      return(
                        <td key={d} style={{padding:"2px 1px",textAlign:"center",background:new Date(d).getDay()%6===0?`${T.amber}06`:"transparent"}}>
                          {v!==null?(
                            <div style={{width:36,height:30,margin:"0 auto",borderRadius:5,
                              background:`${c}15`,border:`1px solid ${c}40`,
                              display:"flex",alignItems:"center",justifyContent:"center",
                              fontSize:9,fontWeight:700,color:c}}>
                              {v}%
                            </div>
                          ):(
                            <div style={{width:36,height:30,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"center"}}>
                              <span style={{fontSize:9,color:T.txt2}}>—</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td style={{padding:"6px 10px",textAlign:"center",fontWeight:700,
                      fontSize:ktgAvg!==null?18:13,
                      color:ktgAvg!==null?(ktgAvg>=85?T.green:T.amber):T.txt2,
                      fontFamily:"'Oswald',sans-serif",
                      position:"sticky",right:0,background:`${T.green}06`,zIndex:2,
                      borderLeft:`2px solid ${T.border}`}}>
                      {ktgAvg!==null?`${ktgAvg}%`:"—"}
                      {ktgAvg!==null&&<div style={{fontSize:9,color:T.txt2,fontFamily:"'Rajdhani',sans-serif",fontWeight:400}}>ср.</div>}
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}


// ─── EAM 1.1 ASSET HIERARCHY ──────────────────────────────────────────────────

const NODE_TYPE_CFG = {
  COMPANY:   { label:"Компания",   icon:"🏢", color:"#94a3b8" },
  CATEGORY:  { label:"Категория",  icon:"📁", color:"#3b82f6" },
  ASSET:     { label:"Актив",      icon:"⚙",  color:"#f59e0b" },
  COMPONENT: { label:"Узел",       icon:"🔩", color:"#10b981" },
};

// Get all descendant IDs (for cascade delete)
function getAllDescendants(nodes, id) {
  const children = nodes.filter(n => n.parentId === id);
  return children.reduce((acc, c) => [...acc, c.id, ...getAllDescendants(nodes, c.id)], []);
}

// ── Node Form Modal ───────────────────────────────────────────────────────────
function NodeFormModal({ title, initial, parentNode, nodes, onSave, onClose, T }) {
  const [name,   setName]   = useState(initial?.name  || "");
  const [desc,   setDesc]   = useState(initial?.desc  || "");
  const [type,   setType]   = useState(initial?.type  || (parentNode ? (parentNode.type === "CATEGORY" ? "ASSET" : "COMPONENT") : "CATEGORY"));
  const [newParentId, setNewParentId] = useState(initial?.parentId || parentNode?.id || null);
  const [err,    setErr]    = useState("");
  const isEdit = !!initial?.id;

  // For move: show parent selector only in edit mode
  const eligibleParents = nodes.filter(n => n.id !== initial?.id && !getAllDescendants(nodes, initial?.id||"").includes(n.id));

  const ac = NODE_TYPE_CFG[type]?.color || "#f59e0b";

  function submit() {
    if (!name.trim()) { setErr("Введите название"); return; }
    onSave({ name: name.trim(), desc: desc.trim(), type, parentId: isEdit ? newParentId : (parentNode?.id || null) });
  }

  const TYPE_OPTIONS = parentNode
    ? parentNode.type === "COMPANY"   ? ["CATEGORY"]
    : parentNode.type === "CATEGORY"  ? ["ASSET"]
    : ["COMPONENT"]
    : isEdit ? Object.keys(NODE_TYPE_CFG) : ["CATEGORY"];

  return (
    <div style={{ position:"fixed", inset:0, background:T.modalBg, zIndex:700, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderLeft:`3px solid ${ac}`, borderRadius:8, width:"100%", maxWidth:460 }}>
        <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:T.bg3 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.txt0, fontFamily:"'Oswald',sans-serif" }}>{title}</div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:22, color:T.txt2 }}>×</button>
        </div>
        <div style={{ padding:20, display:"flex", flexDirection:"column", gap:14 }}>
          {/* Type selector (only if multiple options) */}
          {TYPE_OPTIONS.length > 1 && (
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", display:"block", marginBottom:6 }}>Тип узла</label>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {TYPE_OPTIONS.map(t => {
                  const cfg = NODE_TYPE_CFG[t];
                  return (
                    <button key={t} onClick={() => setType(t)}
                      style={{ padding:"6px 14px", borderRadius:4, cursor:"pointer", fontSize:12, fontWeight:700,
                        border:`2px solid ${type===t ? cfg.color : cfg.color+"50"}`,
                        background:type===t ? `${cfg.color}20` : "transparent",
                        color:cfg.color, fontFamily:"'Rajdhani',sans-serif" }}>
                      {cfg.icon} {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Name */}
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", display:"block", marginBottom:6 }}>Название</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Например: JK 119 или Двигатель"
              style={{ width:"100%", padding:"10px 12px", background:T.inputBg, border:`1px solid ${T.border}`, borderBottom:`2px solid ${ac}`, borderRadius:4, color:T.txt0, fontSize:14, outline:"none" }} />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", display:"block", marginBottom:6 }}>Описание (необязательно)</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              style={{ width:"100%", padding:"10px 12px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:13, outline:"none", resize:"vertical" }} />
          </div>

          {/* Parent selector (edit mode — move node) */}
          {isEdit && (
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", display:"block", marginBottom:6 }}>Родительский узел</label>
              <select value={newParentId || ""} onChange={e => setNewParentId(e.target.value || null)}
                style={{ width:"100%", padding:"10px 12px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:13, outline:"none" }}>
                <option value="">— корень (нет родителя) —</option>
                {eligibleParents.map(n => (
                  <option key={n.id} value={n.id}>{NODE_TYPE_CFG[n.type]?.icon} {n.name}</option>
                ))}
              </select>
            </div>
          )}

          {err && <div style={{ padding:"8px 12px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:4, fontSize:12, color:"#f87171" }}>⚠ {err}</div>}

          <div style={{ display:"flex", gap:10 }}>
            <Btn variant="success" style={{ flex:1, padding:"11px" }} onClick={submit} T={T}>💾 Сохранить</Btn>
            <Btn variant="ghost"   style={{ padding:"11px 16px" }}    onClick={onClose} T={T}>Отмена</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteNodeModal({ node, childCount, onConfirm, onClose, T }) {
  return (
    <div style={{ position:"fixed", inset:0, background:T.modalBg, zIndex:700, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:T.bg2, border:"1px solid rgba(239,68,68,0.4)", borderRadius:8, maxWidth:420, width:"100%", padding:28, textAlign:"center" }}>
        <div style={{ fontSize:36, marginBottom:12 }}>⚠️</div>
        <div style={{ fontSize:16, fontWeight:700, color:T.txt0, fontFamily:"'Oswald',sans-serif", marginBottom:8 }}>Удалить узел?</div>
        <div style={{ fontSize:13, color:T.txt1, marginBottom:20, lineHeight:1.7 }}>
          <b style={{ color:T.txt0 }}>{node.name}</b>
          {childCount > 0 && (
            <><br/><span style={{ color:"#f87171", fontSize:12 }}>Вместе с ним будут удалены {childCount} дочерних узлов.</span></>
          )}
          <br/><span style={{ color:"#f87171", fontSize:12 }}>Это действие нельзя отменить.</span>
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <Btn variant="primary" style={{ background:"linear-gradient(135deg,#dc2626,#991b1b)" }} onClick={onConfirm} T={T}>Да, удалить</Btn>
          <Btn variant="ghost" onClick={onClose} T={T}>Отмена</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Tree Node (recursive) ─────────────────────────────────────────────────────
function TreeNode({ node, nodes, selectedId, onSelect, level, searchQ, T }) {
  const children = nodes.filter(n => n.parentId === node.id);
  const hasChildren = children.length > 0;
  const cfg = NODE_TYPE_CFG[node.type] || NODE_TYPE_CFG.COMPONENT;

  // Auto-expand if search matches descendant
  const matchesSelf = node.name.toLowerCase().includes(searchQ.toLowerCase());
  const matchesDesc = searchQ ? getAllDescendants(nodes, node.id).some(id => {
    const n = nodes.find(x => x.id === id);
    return n && n.name.toLowerCase().includes(searchQ.toLowerCase());
  }) : false;

  const [open, setOpen] = useState(level < 2);
  const isSelected = selectedId === node.id;
  const highlight = searchQ && matchesSelf;

  // Auto-open when search matches descendant
  const shouldOpen = open || (searchQ && matchesDesc);

  if (searchQ && !matchesSelf && !matchesDesc) return null;

  return (
    <div style={{ userSelect:"none" }}>
      <div
        onClick={() => { onSelect(node); if (hasChildren) setOpen(o => !o); }}
        style={{
          display:"flex", alignItems:"center", gap:6,
          padding:`5px 8px 5px ${level * 16 + 8}px`,
          borderRadius:4, cursor:"pointer",
          background: isSelected ? `${cfg.color}20` : highlight ? `${cfg.color}10` : "transparent",
          border: isSelected ? `1px solid ${cfg.color}50` : "1px solid transparent",
          marginBottom:2,
        }}
        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = `${cfg.color}08`; }}
        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = highlight ? `${cfg.color}10` : "transparent"; }}
      >
        {/* Expand arrow */}
        <span style={{ fontSize:10, color:T.txt2, width:12, textAlign:"center", flexShrink:0 }}>
          {hasChildren ? (shouldOpen ? "▼" : "▶") : ""}
        </span>
        <span style={{ fontSize:14 }}>{cfg.icon}</span>
        <span style={{ fontSize:13, fontWeight: isSelected ? 700 : 600, color: isSelected ? cfg.color : highlight ? cfg.color : T.txt0, flex:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
          {node.name}
        </span>
        {hasChildren && (
          <span style={{ fontSize:11, color:T.txt2, flexShrink:0 }}>{children.length}</span>
        )}
      </div>
      {shouldOpen && hasChildren && children.map(child => (
        <TreeNode key={child.id} node={child} nodes={nodes} selectedId={selectedId} onSelect={onSelect} level={level + 1} searchQ={searchQ} T={T} />
      ))}
    </div>
  );
}

// ── EAM: Class Manager (editable asset classes) ──────────────────────────────
const CLASS_COLORS = ["#f43f5e","#f59e0b","#10b981","#3b82f6","#8b5cf6","#06b6d4","#ec4899","#84cc16","#f97316","#64748b"];
const CLASS_ICONS  = ["⛏","🧪","💧","🦾","🚙","🚛","🔩","⚙","🏗","🔧","🚜","🛢","🏭","🔌","📡"];

function ClassManagerModal({ assetClasses, setAssetClasses, onClose, T }) {
  const [editing, setEditing]   = useState(null); // id being edited
  const [form,    setForm]      = useState({ key:"", label:"", icon:"⚙", color:"#f59e0b" });
  const [adding,  setAdding]    = useState(false);
  const [delConf, setDelConf]   = useState(null);
  const [err,     setErr]       = useState("");

  function openAdd() {
    setForm({ key:"", label:"", icon:"⚙", color:CLASS_COLORS[Object.keys(assetClasses).length % CLASS_COLORS.length] });
    setAdding(true); setEditing(null); setErr("");
  }

  function openEdit(k) {
    const c = assetClasses[k];
    setForm({ key:k, label:c.label, icon:c.icon, color:c.color });
    setEditing(k); setAdding(true); setErr("");
  }

  function save() {
    if (!form.label.trim()) { setErr("Введите название класса"); return; }
    const key = editing || form.label.trim().toUpperCase().replace(/\s+/g,"_").replace(/[^A-Z0-9_]/g,"");
    if (!editing && assetClasses[key]) { setErr("Такой класс уже существует"); return; }
    setAssetClasses(prev => {
      const next = { ...prev };
      if (editing && editing !== key) delete next[editing];
      next[key] = { label:form.label.trim(), icon:form.icon, color:form.color };
      return next;
    });
    setAdding(false); setEditing(null); setErr("");
  }

  function confirmDelete() {
    setAssetClasses(prev => { const n = { ...prev }; delete n[delConf]; return n; });
    setDelConf(null);
  }

  return (
    <div style={{ position:"fixed", inset:0, background:T.modalBg, zIndex:800, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:20, overflowY:"auto" }}>
      <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderLeft:`3px solid #f59e0b`, borderRadius:8, width:"100%", maxWidth:620, marginTop:20, marginBottom:40 }}>
        {/* Header */}
        <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:T.bg3 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:T.txt0, fontFamily:"'Oswald',sans-serif" }}>⚙ КЛАССЫ ТЕХНИКИ</div>
            <div style={{ fontSize:12, color:T.txt2, marginTop:2 }}>Настройка справочника классификации активов</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:22, color:T.txt2 }}>×</button>
        </div>

        <div style={{ padding:20 }}>
          {/* Delete confirm */}
          {delConf && (
            <div style={{ marginBottom:16, padding:"14px 16px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:6 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#f87171", marginBottom:10 }}>Удалить класс «{assetClasses[delConf]?.label}»?</div>
              <div style={{ display:"flex", gap:8 }}>
                <Btn variant="primary" style={{ background:"linear-gradient(135deg,#dc2626,#991b1b)", fontSize:12 }} onClick={confirmDelete} T={T}>Да, удалить</Btn>
                <Btn variant="ghost" style={{ fontSize:12 }} onClick={() => setDelConf(null)} T={T}>Отмена</Btn>
              </div>
            </div>
          )}

          {/* Add/Edit form */}
          {adding && (
            <div style={{ marginBottom:16, padding:"14px 16px", background:T.bg3, borderRadius:6, border:`1px solid ${form.color}40` }}>
              <div style={{ fontSize:13, fontWeight:700, color:T.txt0, marginBottom:12 }}>{editing ? "Редактировать класс" : "Новый класс"}</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                <FieldInput label="Название класса" value={form.label} onChange={e => setForm(p => ({ ...p, label:e.target.value }))} T={T} />
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", display:"block", marginBottom:6 }}>Иконка</label>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                    {CLASS_ICONS.map(ic => (
                      <button key={ic} onClick={() => setForm(p => ({ ...p, icon:ic }))}
                        style={{ width:32, height:32, borderRadius:4, border:`2px solid ${form.icon===ic?"#f59e0b":T.border}`,
                          background:form.icon===ic?"#f59e0b20":"transparent", cursor:"pointer", fontSize:16 }}>
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", display:"block", marginBottom:6 }}>Цвет</label>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {CLASS_COLORS.map(c => (
                    <button key={c} onClick={() => setForm(p => ({ ...p, color:c }))}
                      style={{ width:28, height:28, borderRadius:"50%", background:c, border:`3px solid ${form.color===c?"#fff":"transparent"}`,
                        outline:form.color===c?`2px solid ${c}`:"none", cursor:"pointer" }} />
                  ))}
                </div>
              </div>
              {err && <div style={{ marginTop:10, padding:"6px 10px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:4, fontSize:12, color:"#f87171" }}>⚠ {err}</div>}
              <div style={{ display:"flex", gap:8, marginTop:12 }}>
                <Btn variant="success" style={{ flex:1 }} onClick={save} T={T}>💾 Сохранить</Btn>
                <Btn variant="ghost"   onClick={() => { setAdding(false); setEditing(null); setErr(""); }} T={T}>Отмена</Btn>
              </div>
            </div>
          )}

          {/* Classes list */}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {Object.entries(assetClasses).map(([k,v]) => (
              <div key={k} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:T.bg3, borderRadius:6, border:`1px solid ${T.border}`, borderLeft:`4px solid ${v.color}` }}>
                <span style={{ fontSize:20 }}>{v.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.txt0 }}>{v.label}</div>
                  <div style={{ fontSize:11, color:T.txt2, fontFamily:"'JetBrains Mono',monospace" }}>{k}</div>
                </div>
                <div style={{ width:16, height:16, borderRadius:"50%", background:v.color, flexShrink:0 }} />
                <Btn variant="ghost"   onClick={() => openEdit(k)}   T={T} style={{ fontSize:12, padding:"4px 10px" }}>✏</Btn>
                <Btn variant="danger"  onClick={() => setDelConf(k)} T={T} style={{ fontSize:12, padding:"4px 10px" }}>🗑</Btn>
              </div>
            ))}
          </div>

          <div style={{ marginTop:14 }}>
            <Btn variant="primary" onClick={openAdd} T={T} style={{ width:"100%", padding:"10px" }}>+ Добавить класс техники</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── EAM 1.2: Asset Classification Badge ──────────────────────────────────────
const ASSET_CLASS_CFG_DEFAULT = {
  DRILL_RIG:  { label:"Буровой станок",    icon:"⛏",  color:"#f43f5e" },
  MIXER:      { label:"СЗМ",               icon:"🧪", color:"#8b5cf6" },
  HYDRO:      { label:"Гидромолот",        icon:"💧", color:"#3b82f6" },
  EXCAVATOR:  { label:"Экскаватор",        icon:"🦾", color:"#06b6d4" },
  HILUX:      { label:"Toyota Hilux",      icon:"🚙", color:"#10b981" },
  TRUCK:      { label:"Грузовой автомобиль",icon:"🚛", color:"#f59e0b" },
};
// Will be overridden by user-editable version stored in state
let ASSET_CLASS_CFG = { ...ASSET_CLASS_CFG_DEFAULT };

// ── EAM 1.2: Overview Tab ─────────────────────────────────────────────────────
function AssetOverviewTab({ nodeId, passport, setPassports, assetClasses, user, T }) {
  const pp = passport || {};
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState({ assetClass:"", purpose:"", manufacturer:"", model:"", serial:"", year:"", inventory:"" });

  function openEdit() {
    setForm({
      assetClass:   pp.assetClass   || "",
      purpose:      pp.purpose      || "",
      manufacturer: pp.manufacturer || "",
      model:        pp.model        || "",
      serial:       pp.serial       || "",
      year:         pp.year         || "",
      inventory:    pp.inventory    || "",
    });
    setEditing(true);
  }

  function saveEdit() {
    setPassports(prev => ({ ...prev, [nodeId]: { ...form } }));
    setEditing(false);
  }

  const cls = assetClasses[pp.assetClass];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {/* Edit modal */}
      {editing && (
        <div style={{ position:"fixed", inset:0, background:T.modalBg, zIndex:700, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderLeft:`3px solid ${T.amber}`, borderRadius:8, width:"100%", maxWidth:500 }}>
            <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:T.bg3 }}>
              <div style={{ fontSize:14, fontWeight:700, color:T.txt0, fontFamily:"'Oswald',sans-serif" }}>ПАСПОРТ АКТИВА</div>
              <button onClick={() => setEditing(false)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:22, color:T.txt2 }}>×</button>
            </div>
            <div style={{ padding:20, display:"flex", flexDirection:"column", gap:12 }}>
              {/* Class */}
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", display:"block", marginBottom:6 }}>Класс техники</label>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {Object.entries(assetClasses).map(([k,v]) => (
                    <button key={k} onClick={() => setForm(p => ({ ...p, assetClass:k }))}
                      style={{ padding:"6px 12px", borderRadius:4, cursor:"pointer", fontSize:12, fontWeight:700,
                        border:`2px solid ${form.assetClass===k ? v.color : v.color+"40"}`,
                        background:form.assetClass===k ? `${v.color}20` : "transparent",
                        color:v.color, fontFamily:"'Rajdhani',sans-serif" }}>
                      {v.icon} {v.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Purpose */}
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", display:"block", marginBottom:6 }}>Назначение</label>
                <select value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose:e.target.value }))}
                  style={{ width:"100%", padding:"9px 12px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:13, outline:"none" }}>
                  <option value="">— не указано —</option>
                  {PURPOSE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <FieldInput label="Производитель" value={form.manufacturer} onChange={e => setForm(p => ({ ...p, manufacturer:e.target.value }))} T={T} />
                <FieldInput label="Модель"        value={form.model}        onChange={e => setForm(p => ({ ...p, model:e.target.value }))}        T={T} />
                <FieldInput label="Серийный №"    value={form.serial}       onChange={e => setForm(p => ({ ...p, serial:e.target.value }))}       T={T} />
                <FieldInput label="Год выпуска"   value={form.year}         onChange={e => setForm(p => ({ ...p, year:e.target.value }))}         T={T} />
                <FieldInput label="Инвентарный №" value={form.inventory}    onChange={e => setForm(p => ({ ...p, inventory:e.target.value }))}    T={T} />
              </div>
              <div style={{ display:"flex", gap:10, marginTop:4 }}>
                <Btn variant="success" style={{ flex:1, padding:"11px" }} onClick={saveEdit} T={T}>💾 Сохранить</Btn>
                <Btn variant="ghost"   style={{ padding:"11px 16px" }}    onClick={() => setEditing(false)} T={T}>Отмена</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Classification card */}
      <div style={{ padding:"14px 16px", background:T.bg3, borderRadius:6, border:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:12, color:T.txt2, textTransform:"uppercase", fontWeight:700, marginBottom:6 }}>Классификация</div>
          {cls ? (
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:22 }}>{cls.icon}</span>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:cls.color }}>{cls.label}</div>
                {pp.purpose && <div style={{ fontSize:12, color:T.txt2 }}>Назначение: <b style={{ color:T.txt0 }}>{pp.purpose}</b></div>}
              </div>
            </div>
          ) : (
            <div style={{ fontSize:13, color:T.txt2 }}>Класс не задан</div>
          )}
        </div>
        <Btn variant="ghost" onClick={openEdit} T={T} style={{ fontSize:12, padding:"6px 14px" }}>✏ Изменить</Btn>
      </div>

      {/* Passport fields */}
      {pp.model || pp.serial || pp.manufacturer || pp.year || pp.inventory ? (
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", marginBottom:8 }}>Паспортные данные</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
            {[
              ["Производитель", pp.manufacturer],
              ["Модель",        pp.model],
              ["Серийный №",    pp.serial],
              ["Год выпуска",   pp.year],
              ["Инвентарный №", pp.inventory],
            ].filter(([,v]) => v).map(([lbl,val]) => (
              <div key={lbl} style={{ padding:"10px 14px", background:T.bg3, borderRadius:5, border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:12, color:T.txt2, marginBottom:4 }}>{lbl}</div>
                <div style={{ fontSize:14, fontWeight:700, color:T.txt0, fontFamily:"'Oswald',sans-serif" }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding:"20px", textAlign:"center", background:T.bg3, borderRadius:6, border:`1px solid ${T.border}` }}>
          <div style={{ fontSize:12, color:T.txt2, marginBottom:10 }}>Паспортные данные не заполнены</div>
          <Btn variant="primary" onClick={openEdit} T={T} style={{ fontSize:12 }}>+ Заполнить паспорт</Btn>
        </div>
      )}
    </div>
  );
}

// ── EAM 1.2: Meter Tab ────────────────────────────────────────────────────────
function AssetMeterTab({ nodeId, meters, setMeters, user, T }) {
  const meter = meters[nodeId] || null;
  const [showForm, setShowForm] = useState(false);
  const [mode,     setMode]     = useState("absolute"); // absolute | delta
  const [mType,    setMType]    = useState(meter?.type || "ENGINE_HOURS");
  const [val,      setVal]      = useState("");
  const [note,     setNote]     = useState("");
  const [err,      setErr]      = useState("");

  function submit() {
    const n = parseFloat(val);
    if (isNaN(n) || n < 0) { setErr("Введите корректное число"); return; }
    const now = new Date();
    const dt  = now.toISOString().slice(0,10);
    const newCurrent = mode === "delta" ? ((meter?.current||0) + n) : n;
    const newEntry   = { id:"m"+genId(), value:newCurrent, delta:mode==="delta"?n:null,
      recordedAt:dt, recordedBy:user?.name||"Механик", note };
    setMeters(prev => ({
      ...prev,
      [nodeId]: {
        type: mType,
        current: newCurrent,
        history: [newEntry, ...(prev[nodeId]?.history||[])],
      },
    }));
    setVal(""); setNote(""); setErr(""); setShowForm(false);
  }

  const unit = METER_UNIT_CFG[meter?.type || mType] || "ед.";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {/* Current value */}
      <div style={{ display:"flex", gap:14, alignItems:"stretch" }}>
        <div style={{ flex:1, padding:"20px", background:T.bg3, borderRadius:6, border:`1px solid ${T.border}`, textAlign:"center" }}>
          <div style={{ fontSize:12, color:T.txt2, textTransform:"uppercase", fontWeight:700, marginBottom:8 }}>Текущая наработка</div>
          <div style={{ fontSize:36, fontWeight:700, color:T.amber, fontFamily:"'Oswald',sans-serif" }}>
            {meter ? meter.current.toLocaleString() : "—"}
          </div>
          <div style={{ fontSize:13, color:T.txt2, marginTop:4 }}>{unit}</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8, justifyContent:"center" }}>
          <Btn variant="success" onClick={() => setShowForm(true)} T={T} style={{ fontSize:12, padding:"10px 16px" }}>+ Обновить наработку</Btn>
        </div>
      </div>

      {/* Update form */}
      {showForm && (
        <div style={{ padding:"16px", background:T.bg3, borderRadius:6, border:`1px solid ${T.amber}40` }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.txt0, marginBottom:12 }}>Обновление наработки</div>
          {/* Meter type */}
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            {Object.entries(METER_UNIT_CFG).map(([k,u]) => (
              <button key={k} onClick={() => setMType(k)}
                style={{ padding:"5px 14px", borderRadius:4, cursor:"pointer", fontSize:12, fontWeight:700,
                  border:`2px solid ${mType===k?T.amber:T.border}`,
                  background:mType===k?`${T.amber}15`:"transparent",
                  color:mType===k?T.amber:T.txt2, fontFamily:"'Rajdhani',sans-serif" }}>
                {u}
              </button>
            ))}
          </div>
          {/* Mode */}
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            {[["absolute","Новое значение"],["delta","+ Добавить к текущему"]].map(([m,l]) => (
              <button key={m} onClick={() => setMode(m)}
                style={{ padding:"5px 14px", borderRadius:4, cursor:"pointer", fontSize:12, fontWeight:700,
                  border:`2px solid ${mode===m?T.green:T.border}`,
                  background:mode===m?`${T.green}15`:"transparent",
                  color:mode===m?T.green:T.txt2, fontFamily:"'Rajdhani',sans-serif" }}>
                {l}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", gap:10, marginBottom:10 }}>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", display:"block", marginBottom:5 }}>
                {mode==="delta" ? `Добавить (${unit})` : `Значение (${unit})`}
              </label>
              <input type="text" inputMode="decimal" value={val} onChange={e => setVal(e.target.value)}
                style={{ width:"100%", padding:"9px 12px", background:T.inputBg, border:`1px solid ${T.border}`, borderBottom:`2px solid ${T.amber}`, borderRadius:4, color:T.amber, fontSize:15, fontWeight:700, outline:"none", fontFamily:"'Oswald',sans-serif" }} />
              {mode==="delta" && meter && (
                <div style={{ fontSize:12, color:T.txt2, marginTop:4 }}>
                  Будет: <b style={{ color:T.amber }}>{((meter.current||0)+(parseFloat(val)||0)).toLocaleString()} {unit}</b>
                </div>
              )}
            </div>
            <FieldInput label="Примечание" value={note} onChange={e => setNote(e.target.value)} T={T} style={{ flex:1 }} />
          </div>
          {err && <div style={{ marginBottom:10, padding:"6px 10px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:4, fontSize:12, color:"#f87171" }}>⚠ {err}</div>}
          <div style={{ display:"flex", gap:8 }}>
            <Btn variant="success" style={{ flex:1 }} onClick={submit} T={T}>💾 Сохранить</Btn>
            <Btn variant="ghost"   onClick={() => { setShowForm(false); setErr(""); }} T={T}>Отмена</Btn>
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <div style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", marginBottom:8 }}>История наработки</div>
        {!meter || meter.history.length === 0 ? (
          <div style={{ padding:16, textAlign:"center", background:T.bg3, borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, color:T.txt2 }}>История пуста</div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr style={{ background:T.bg3 }}>
                  {["Дата","Значение","Изменение","Записал","Примечание"].map(h => (
                    <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontWeight:700, color:T.txt2, borderBottom:`1px solid ${T.border}`, textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {meter.history.map((h, i) => (
                  <tr key={h.id} style={{ background: i%2===0 ? T.bg2 : T.bg3 }}>
                    <td style={{ padding:"8px 12px", color:T.txt2, whiteSpace:"nowrap" }}>{h.recordedAt}</td>
                    <td style={{ padding:"8px 12px", fontWeight:700, color:T.amber, fontFamily:"'Oswald',sans-serif" }}>{h.value.toLocaleString()} {unit}</td>
                    <td style={{ padding:"8px 12px", color:h.delta ? T.green : T.txt2 }}>{h.delta ? `+${h.delta.toLocaleString()}` : "—"}</td>
                    <td style={{ padding:"8px 12px", color:T.txt0 }}>{h.recordedBy}</td>
                    <td style={{ padding:"8px 12px", color:T.txt2 }}>{h.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── EAM 1.2: Measurement Points Tab ──────────────────────────────────────────
function AssetPointsTab({ nodeId, points, setPoints, measurements, setMeasurements, user, T }) {
  const myPoints = points[nodeId] || [];
  const [selPoint,   setSelPoint]   = useState(null);
  const [addPoint,   setAddPoint]   = useState(false);
  const [pForm,      setPForm]      = useState({ name:"", unit:"", dataType:"NUMBER" });
  const [addMeas,    setAddMeas]    = useState(false);
  const [mForm,      setMForm]      = useState({ value:"", note:"" });

  function savePoint() {
    if (!pForm.name.trim()) return;
    const np = { id:"p"+genId(), name:pForm.name.trim(), unit:pForm.unit.trim(), dataType:pForm.dataType, isActive:true };
    setPoints(prev => ({ ...prev, [nodeId]: [...(prev[nodeId]||[]), np] }));
    setPForm({ name:"", unit:"", dataType:"NUMBER" }); setAddPoint(false);
    setSelPoint(np);
  }

  function saveMeas() {
    if (!mForm.value.trim()) return;
    const now = new Date();
    const dt = now.toISOString().slice(0,16).replace("T"," ");
    const nm = { id:"ms"+genId(), value:mForm.value.trim(), measuredAt:dt, recordedBy:user?.name||"Механик", note:mForm.note };
    setMeasurements(prev => ({ ...prev, [selPoint.id]: [nm, ...(prev[selPoint.id]||[])] }));
    setMForm({ value:"", note:"" }); setAddMeas(false);
  }

  function deletePoint(pid) {
    setPoints(prev => ({ ...prev, [nodeId]: (prev[nodeId]||[]).filter(p => p.id !== pid) }));
    if (selPoint?.id === pid) setSelPoint(null);
  }

  const myMeas = selPoint ? (measurements[selPoint.id] || []) : [];

  return (
    <div style={{ display:"flex", gap:14 }}>
      {/* Points list */}
      <div style={{ width:220, flexShrink:0, background:T.bg3, borderRadius:6, border:`1px solid ${T.border}`, overflow:"hidden" }}>
        <div style={{ padding:"10px 12px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase" }}>Точки</span>
          <button onClick={() => setAddPoint(true)}
            style={{ fontSize:11, padding:"3px 8px", borderRadius:3, border:`1px solid ${T.green}50`, background:`${T.green}10`, color:T.green, cursor:"pointer", fontFamily:"'Rajdhani',sans-serif", fontWeight:700 }}>
            + Добавить
          </button>
        </div>

        {/* Add point form */}
        {addPoint && (
          <div style={{ padding:"10px 12px", borderBottom:`1px solid ${T.border}`, background:T.bg2 }}>
            <input placeholder="Название" value={pForm.name} onChange={e => setPForm(p => ({ ...p, name:e.target.value }))}
              style={{ width:"100%", marginBottom:6, padding:"6px 8px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:3, color:T.txt0, fontSize:12, outline:"none" }} />
            <input placeholder="Ед. изм. (bar, °C...)" value={pForm.unit} onChange={e => setPForm(p => ({ ...p, unit:e.target.value }))}
              style={{ width:"100%", marginBottom:6, padding:"6px 8px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:3, color:T.txt0, fontSize:12, outline:"none" }} />
            <select value={pForm.dataType} onChange={e => setPForm(p => ({ ...p, dataType:e.target.value }))}
              style={{ width:"100%", marginBottom:8, padding:"6px 8px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:3, color:T.txt0, fontSize:12, outline:"none" }}>
              <option value="NUMBER">Число</option>
              <option value="TEXT">Текст</option>
              <option value="BOOLEAN">Да/Нет</option>
            </select>
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={savePoint}
                style={{ flex:1, padding:"5px", borderRadius:3, border:`1px solid ${T.green}50`, background:`${T.green}15`, color:T.green, cursor:"pointer", fontSize:12, fontFamily:"'Rajdhani',sans-serif", fontWeight:700 }}>
                ✓
              </button>
              <button onClick={() => setAddPoint(false)}
                style={{ padding:"5px 10px", borderRadius:3, border:`1px solid ${T.border}`, background:"transparent", color:T.txt2, cursor:"pointer", fontSize:12 }}>
                ✕
              </button>
            </div>
          </div>
        )}

        {myPoints.length === 0 && !addPoint ? (
          <div style={{ padding:16, textAlign:"center", fontSize:12, color:T.txt2 }}>Нет точек измерения</div>
        ) : (
          myPoints.map(pt => (
            <div key={pt.id} onClick={() => { setSelPoint(pt); setAddMeas(false); }}
              style={{ padding:"9px 12px", cursor:"pointer", borderBottom:`1px solid ${T.border}`,
                background:selPoint?.id===pt.id?`${T.green}15`:"transparent",
                borderLeft:selPoint?.id===pt.id?`3px solid ${T.green}`:"3px solid transparent" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:selPoint?.id===pt.id?T.green:T.txt0 }}>{pt.name}</div>
                  <div style={{ fontSize:11, color:T.txt2 }}>{pt.unit} · {pt.dataType}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); deletePoint(pt.id); }}
                  style={{ fontSize:11, color:"#ef4444", background:"none", border:"none", cursor:"pointer" }}>🗑</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Measurements panel */}
      <div style={{ flex:1, minWidth:0 }}>
        {!selPoint ? (
          <div style={{ padding:32, textAlign:"center", background:T.bg3, borderRadius:6, border:`1px solid ${T.border}` }}>
            <div style={{ fontSize:12, color:T.txt2 }}>Выберите точку измерения слева</div>
          </div>
        ) : (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:T.green, fontFamily:"'Oswald',sans-serif" }}>{selPoint.name}</div>
                <div style={{ fontSize:12, color:T.txt2 }}>Единица: <b>{selPoint.unit || "—"}</b> · Тип: <b>{selPoint.dataType}</b></div>
              </div>
              <Btn variant="primary" onClick={() => setAddMeas(true)} T={T} style={{ fontSize:12, padding:"6px 14px" }}>+ Замер</Btn>
            </div>

            {/* Add measurement form */}
            {addMeas && (
              <div style={{ padding:"12px 14px", background:T.bg3, borderRadius:6, border:`1px solid ${T.green}40`, marginBottom:12 }}>
                <div style={{ display:"flex", gap:10, marginBottom:8 }}>
                  <div style={{ flex:1 }}>
                    <label style={{ fontSize:12, fontWeight:700, color:T.txt2, display:"block", marginBottom:4 }}>
                      Значение {selPoint.unit ? `(${selPoint.unit})` : ""}
                    </label>
                    {selPoint.dataType === "BOOLEAN" ? (
                      <div style={{ display:"flex", gap:8 }}>
                        {["Да","Нет"].map(v => (
                          <button key={v} onClick={() => setMForm(p => ({ ...p, value:v }))}
                            style={{ flex:1, padding:"8px", borderRadius:4, cursor:"pointer", fontSize:12, fontWeight:700,
                              border:`2px solid ${mForm.value===v?T.green:T.border}`,
                              background:mForm.value===v?`${T.green}15`:"transparent",
                              color:mForm.value===v?T.green:T.txt2, fontFamily:"'Rajdhani',sans-serif" }}>
                            {v}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input value={mForm.value} onChange={e => setMForm(p => ({ ...p, value:e.target.value }))}
                        style={{ width:"100%", padding:"9px 12px", background:T.inputBg, border:`1px solid ${T.border}`, borderBottom:`2px solid ${T.green}`, borderRadius:4, color:T.green, fontSize:15, fontWeight:700, outline:"none", fontFamily:"'Oswald',sans-serif" }} />
                    )}
                  </div>
                  <FieldInput label="Примечание" value={mForm.note} onChange={e => setMForm(p => ({ ...p, note:e.target.value }))} T={T} style={{ flex:1 }} />
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <Btn variant="success" style={{ flex:1 }} onClick={saveMeas} T={T}>💾 Сохранить замер</Btn>
                  <Btn variant="ghost"   onClick={() => setAddMeas(false)} T={T}>Отмена</Btn>
                </div>
              </div>
            )}

            {/* Measurements history table */}
            {myMeas.length === 0 ? (
              <div style={{ padding:20, textAlign:"center", background:T.bg3, borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, color:T.txt2 }}>Нет замеров</div>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr style={{ background:T.bg3 }}>
                      {["Дата/время","Значение","Записал","Примечание"].map(h => (
                        <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontWeight:700, color:T.txt2, borderBottom:`1px solid ${T.border}`, textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {myMeas.map((m, i) => (
                      <tr key={m.id} style={{ background:i%2===0?T.bg2:T.bg3 }}>
                        <td style={{ padding:"8px 12px", color:T.txt2, whiteSpace:"nowrap" }}>{m.measuredAt}</td>
                        <td style={{ padding:"8px 12px", fontWeight:700, color:T.green, fontFamily:"'Oswald',sans-serif" }}>{m.value} {selPoint.unit}</td>
                        <td style={{ padding:"8px 12px", color:T.txt0 }}>{m.recordedBy}</td>
                        <td style={{ padding:"8px 12px", color:T.txt2 }}>{m.note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── EAM 1.2: Properties Tab ───────────────────────────────────────────────────
function AssetPropertiesTab({ nodeId, properties, setProperties, user, T }) {
  const myProps = properties[nodeId] || [];
  const [adding, setAdding] = useState(false);
  const [form,   setForm]   = useState({ key:"", valueType:"string", value:"" });
  const [editId, setEditId] = useState(null);

  function save() {
    if (!form.key.trim() || !form.value.toString().trim()) return;
    if (editId) {
      setProperties(prev => ({ ...prev, [nodeId]: (prev[nodeId]||[]).map(p => p.id===editId ? { ...p, ...form } : p) }));
      setEditId(null);
    } else {
      const np = { id:"pr"+genId(), key:form.key.trim(), valueType:form.valueType, value:form.value.trim() };
      setProperties(prev => ({ ...prev, [nodeId]: [...(prev[nodeId]||[]), np] }));
    }
    setForm({ key:"", valueType:"string", value:"" }); setAdding(false);
  }

  function startEdit(prop) {
    setForm({ key:prop.key, valueType:prop.valueType, value:prop.value });
    setEditId(prop.id); setAdding(true);
  }

  function deleteProp(pid) {
    setProperties(prev => ({ ...prev, [nodeId]: (prev[nodeId]||[]).filter(p => p.id !== pid) }));
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase" }}>Технические свойства (key-value)</div>
        <Btn variant="primary" onClick={() => { setAdding(true); setEditId(null); setForm({ key:"", valueType:"string", value:"" }); }} T={T} style={{ fontSize:12, padding:"6px 14px" }}>+ Свойство</Btn>
      </div>

      {adding && (
        <div style={{ padding:"14px 16px", background:T.bg3, borderRadius:6, border:`1px solid ${T.violet}40`, marginBottom:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 140px 1fr", gap:10, marginBottom:10 }}>
            <FieldInput label="Название свойства" value={form.key} onChange={e => setForm(p => ({ ...p, key:e.target.value }))} T={T} />
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", display:"block", marginBottom:6 }}>Тип</label>
              <select value={form.valueType} onChange={e => setForm(p => ({ ...p, valueType:e.target.value }))}
                style={{ width:"100%", padding:"9px 10px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:12, outline:"none" }}>
                {["string","number","boolean","date"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <FieldInput label="Значение" value={form.value} onChange={e => setForm(p => ({ ...p, value:e.target.value }))} T={T} />
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <Btn variant="success" style={{ flex:1 }} onClick={save} T={T}>💾 {editId ? "Сохранить" : "Добавить"}</Btn>
            <Btn variant="ghost"   onClick={() => { setAdding(false); setEditId(null); }} T={T}>Отмена</Btn>
          </div>
        </div>
      )}

      {myProps.length === 0 ? (
        <div style={{ padding:24, textAlign:"center", background:T.bg3, borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, color:T.txt2 }}>Нет свойств</div>
      ) : (
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ background:T.bg3 }}>
                {["Свойство","Тип","Значение",""].map(h => (
                  <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontWeight:700, color:T.txt2, borderBottom:`1px solid ${T.border}`, textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {myProps.map((p, i) => (
                <tr key={p.id} style={{ background:i%2===0?T.bg2:T.bg3 }}>
                  <td style={{ padding:"9px 12px", fontWeight:700, color:T.txt0 }}>{p.key}</td>
                  <td style={{ padding:"9px 12px", color:T.txt2 }}>{p.valueType}</td>
                  <td style={{ padding:"9px 12px", color:T.violet, fontWeight:600 }}>{String(p.value)}</td>
                  <td style={{ padding:"9px 12px", whiteSpace:"nowrap" }}>
                    <button onClick={() => startEdit(p)} style={{ marginRight:8, fontSize:12, color:T.txt2, background:"none", border:"none", cursor:"pointer" }}>✏</button>
                    <button onClick={() => deleteProp(p.id)} style={{ fontSize:12, color:"#ef4444", background:"none", border:"none", cursor:"pointer" }}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── EAM 1.2: Asset Detail Panel (tabbed) ─────────────────────────────────────
function AssetDetailPanel({ node, nodes, selCfg, selParent, selChildren, setSelected,
  passports, setPassports, meters, setMeters, points, setPoints, measurements, setMeasurements, properties, setProperties,
  assetClasses, locations, setLocations, movements14, setMovements14, curLocations, setCurLocations, lifecycle, setLifecycle,
  warranties, setWarranties, wProviders,
  onEdit, onDelete, onAddChild, user, T }) {

  const [tab, setTab] = useState("overview");
  const isAsset = node.type === "ASSET";
  const [showMovForm, setShowMovForm] = useState(false);
  const TABS = isAsset
    ? [["overview","Обзор"],["meter","Наработка"],["points","Замеры"],["props","Свойства"],["movement","Движение"],["warranty","Гарантии"]]
    : [["overview","Обзор"]];

  // Reset tab when node changes
  const [lastId, setLastId] = useState(node.id);
  if (lastId !== node.id) { setLastId(node.id); setTab("overview"); }

  const ac = selCfg.color;

  // movement save handler
  function handleMovSave(mv) {
    setMovements14(prev => [mv, ...prev]);
    if (mv.toLocId) setCurLocations(prev => ({ ...prev, [mv.nodeId]: mv.toLocId }));
    const statusMap = { SEND_TO_REPAIR:"IN_REPAIR", RETURN_FROM_REPAIR:"IN_SERVICE", WRITE_OFF:"WRITTEN_OFF", CONSERVATION:"CONSERVED" };
    if (statusMap[mv.movType]) setLifecycle(prev => ({ ...prev, [mv.nodeId]: statusMap[mv.movType] }));
    else if (mv.movType === "TRANSFER") {
      const toLoc = locations?.find(l => l.id === mv.toLocId);
      setLifecycle(prev => ({ ...prev, [mv.nodeId]: toLoc?.type === "WAREHOUSE" ? "STORED" : "IN_SERVICE" }));
    }
  }

  return (
    <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderLeft:`3px solid ${ac}`, borderRadius:8, overflow:"hidden" }}>
      {showMovForm && isAsset && (
        <MovementFormModal preNode={node} nodes={nodes} locations={locations||[]}
          curLocations={curLocations||{}} onSave={handleMovSave} onClose={() => setShowMovForm(false)} user={user} T={T} />
      )}
      {/* Header */}
      <div style={{ padding:"16px 20px", background:T.bg3, borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
          <span style={{ fontSize:28 }}>{selCfg.icon}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:18, fontWeight:700, color:T.txt0, fontFamily:"'Oswald',sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{node.name}</div>
            <div style={{ display:"flex", gap:8, marginTop:4, flexWrap:"wrap" }}>
              <span style={{ padding:"2px 10px", borderRadius:3, background:`${ac}20`, border:`1px solid ${ac}40`, color:ac, fontSize:12, fontWeight:700 }}>{selCfg.label}</span>
              {isAsset && lifecycle?.[node.id] && (() => {
              const ls = LIFECYCLE_STATUS_CFG[lifecycle[node.id]];
              return ls ? <span style={{ padding:"2px 10px", borderRadius:3, background:`${ls.color}15`, border:`1px solid ${ls.color}40`, color:ls.color, fontSize:12, fontWeight:700 }}>{ls.label}</span> : null;
            })()}
            {isAsset && passports[node.id]?.assetClass && (() => {
                const cls = assetClasses[passports[node.id].assetClass];
                return cls ? <span style={{ padding:"2px 10px", borderRadius:3, background:`${cls.color}15`, border:`1px solid ${cls.color}40`, color:cls.color, fontSize:12, fontWeight:700 }}>{cls.icon} {cls.label}</span> : null;
              })()}
            </div>
          </div>
        </div>
        {/* Actions */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {node.type !== "COMPANY" && <Btn variant="ghost" onClick={onEdit} T={T} style={{ fontSize:12, padding:"6px 14px" }}>✏ Редактировать</Btn>}
          {(node.type === "CATEGORY" || node.type === "ASSET" || node.type === "COMPONENT") && <Btn variant="primary" onClick={onAddChild} T={T} style={{ fontSize:12, padding:"6px 14px" }}>+ Дочерний</Btn>}
          {node.type !== "COMPANY" && <Btn variant="danger" onClick={onDelete} T={T} style={{ fontSize:12, padding:"6px 14px" }}>🗑 Удалить</Btn>}
        </div>
      </div>

      {/* Tabs */}
      {TABS.length > 1 && (
        <div style={{ display:"flex", background:T.bg3, borderBottom:`1px solid ${T.border}` }}>
          {TABS.map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{ padding:"9px 18px", border:"none", cursor:"pointer", fontSize:12, fontWeight:700,
                background:"transparent", color:tab===k?ac:T.txt2,
                borderBottom:tab===k?`2px solid ${ac}`:"2px solid transparent",
                fontFamily:"'Rajdhani',sans-serif", textTransform:"uppercase" }}>
              {l}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      <div style={{ padding:"16px 20px" }}>
        {tab === "overview" && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {/* If ASSET: show classification */}
            {isAsset && (
              <AssetOverviewTab nodeId={node.id} passport={passports[node.id]} setPassports={setPassports} assetClasses={assetClasses} user={user} T={T} />
            )}
            {/* Common info */}
            <div>
              {!isAsset && <div style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", marginBottom:8 }}>Информация</div>}
              {[
                ["Родитель",      selParent ? `${NODE_TYPE_CFG[selParent.type]?.icon} ${selParent.name}` : "— корень —"],
                ["Описание",      node.desc || "—"],
                ["Создан",        node.createdAt + " · " + node.createdBy],
                ["Дочерних",      selChildren.length > 0 ? String(selChildren.length) : "нет"],
              ].map(([lbl,val]) => (
                <div key={lbl} style={{ display:"flex", gap:16, padding:"9px 14px", background:T.bg3, borderRadius:5, border:`1px solid ${T.border}`, marginBottom:6 }}>
                  <span style={{ fontSize:12, color:T.txt2, minWidth:110, flexShrink:0 }}>{lbl}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:T.txt0 }}>{val}</span>
                </div>
              ))}
            </div>
            {/* Children chips */}
            {selChildren.length > 0 && (
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", marginBottom:8 }}>Дочерние узлы</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {selChildren.map(c => {
                    const ccfg = NODE_TYPE_CFG[c.type] || NODE_TYPE_CFG.COMPONENT;
                    return (
                      <div key={c.id} onClick={() => setSelected(c)}
                        style={{ padding:"6px 14px", borderRadius:4, cursor:"pointer", background:`${ccfg.color}12`, border:`1px solid ${ccfg.color}40`, color:ccfg.color, fontSize:12, fontWeight:700 }}>
                        {ccfg.icon} {c.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Breadcrumb */}
            <div style={{ padding:"10px 14px", background:T.bg3, borderRadius:5, border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:12, color:T.txt2, marginBottom:6, textTransform:"uppercase", fontWeight:700 }}>Путь</div>
              <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                {(() => {
                  const path = []; let cur = node;
                  while (cur) { path.unshift(cur); cur = cur.parentId ? nodes.find(n => n.id === cur.parentId) : null; }
                  return path.map((n, i) => (
                    <span key={n.id} style={{ display:"flex", alignItems:"center", gap:6 }}>
                      {i > 0 && <span style={{ color:T.txt2 }}>→</span>}
                      <span onClick={() => setSelected(n)} style={{ fontSize:12, fontWeight:700, color:NODE_TYPE_CFG[n.type]?.color, cursor:"pointer" }}>
                        {NODE_TYPE_CFG[n.type]?.icon} {n.name}
                      </span>
                    </span>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}
        {tab === "meter" && (
          <AssetMeterTab nodeId={node.id} meters={meters} setMeters={setMeters} user={user} T={T} />
        )}
        {tab === "points" && (
          <AssetPointsTab nodeId={node.id} points={points} setPoints={setPoints} measurements={measurements} setMeasurements={setMeasurements} user={user} T={T} />
        )}
        {tab === "props" && (
          <AssetPropertiesTab nodeId={node.id} properties={properties} setProperties={setProperties} user={user} T={T} />
        )}
        {tab === "movement" && isAsset && (
          <AssetMovementTab
            node={node} movements={movements14||[]} locations={locations||[]}
            curLocations={curLocations||{}} nodes={nodes}
            onNewMovement={() => setShowMovForm(true)} T={T}
          />
        )}
        {tab === "warranty" && (
          <AssetWarrantyTab
            node={node} warranties={warranties||[]} setWarranties={setWarranties}
            providers={wProviders||[]} nodes={nodes} user={user} T={T}
          />
        )}
      </div>
    </div>
  );
}

// ── EAM 1.1 Main Page ─────────────────────────────────────────────────────────
function EAMHierarchyPage({ nodes, setNodes, passports, setPassports, meters, setMeters, points, setPoints, measurements, setMeasurements, properties, setProperties, assetClasses, setAssetClasses, locations, setLocations, movements14, setMovements14, curLocations, setCurLocations, lifecycle, setLifecycle, warranties, setWarranties, wProviders, setWProviders, user, T }) {
  const [selected,   setSelected]   = useState(null);
  const [searchQ,    setSearchQ]    = useState("");
  const [addModal,   setAddModal]   = useState(null); // { parentNode } or null
  const [editModal,  setEditModal]  = useState(null); // node
  const [delModal,   setDelModal]   = useState(null); // node
  const [showClsMgr, setShowClsMgr] = useState(false);

  const rootNodes = nodes.filter(n => n.parentId === null);

  function handleAdd(parentNode) { setAddModal({ parentNode }); }

  function saveAdd({ name, desc, type, parentId }) {
    const newNode = {
      id: "n" + genId(), parentId: addModal.parentNode?.id || null,
      name, desc, type, catType: null,
      createdBy: user?.name || "Механик",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setNodes(prev => [...prev, newNode]);
    setSelected(newNode);
    setAddModal(null);
  }

  function saveEdit({ name, desc, type, parentId }) {
    setNodes(prev => prev.map(n => n.id === editModal.id
      ? { ...n, name, desc, type, parentId }
      : n));
    setSelected(prev => prev?.id === editModal.id ? { ...prev, name, desc, type, parentId } : prev);
    setEditModal(null);
  }

  function confirmDelete() {
    const toDelete = [delModal.id, ...getAllDescendants(nodes, delModal.id)];
    setNodes(prev => prev.filter(n => !toDelete.includes(n.id)));
    if (selected && toDelete.includes(selected.id)) setSelected(null);
    setDelModal(null);
  }

  const selCfg    = selected ? (NODE_TYPE_CFG[selected.type] || NODE_TYPE_CFG.COMPONENT) : null;
  const selParent = selected?.parentId ? nodes.find(n => n.id === selected.parentId) : null;
  const selChildren = selected ? nodes.filter(n => n.parentId === selected.id) : [];
  const childCount  = selected ? getAllDescendants(nodes, selected.id).length : 0;

  return (
    <div>
      {/* Modals */}
      {addModal && (
        <NodeFormModal title={`ДОБАВИТЬ УЗЕЛ${addModal.parentNode ? " в " + addModal.parentNode.name : ""}`}
          initial={null} parentNode={addModal.parentNode} nodes={nodes}
          onSave={saveAdd} onClose={() => setAddModal(null)} T={T} />
      )}
      {editModal && (
        <NodeFormModal title="РЕДАКТИРОВАТЬ УЗЕЛ"
          initial={editModal} parentNode={null} nodes={nodes}
          onSave={saveEdit} onClose={() => setEditModal(null)} T={T} />
      )}
      {delModal && (
        <DeleteNodeModal node={delModal} childCount={childCount}
          onConfirm={confirmDelete} onClose={() => setDelModal(null)} T={T} />
      )}

      {showClsMgr && <ClassManagerModal assetClasses={assetClasses} setAssetClasses={setAssetClasses} onClose={() => setShowClsMgr(false)} T={T} />}

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ background:"#f59e0b", color:"#000", padding:"4px 12px", borderRadius:3, fontSize:12, fontWeight:700, textTransform:"uppercase" }}>МЕХАНИК</div>
          <div style={{ fontSize:12, color:T.txt2 }}>Иерархия производственных активов</div>
        </div>
        <Btn variant="ghost" onClick={() => setShowClsMgr(true)} T={T} style={{ fontSize:12, padding:"6px 14px" }}>⚙ Классы техники</Btn>
      </div>
      <SectionTitle label="EAM 1.1 / 1.2" sub="АКТИВЫ И КЛАССИФИКАЦИЯ" T={T} />

      <div style={{ display:"flex", gap:16, alignItems:"flex-start", minHeight:600 }}>

        {/* ── LEFT PANEL: Tree ── */}
        <div style={{ width:320, flexShrink:0, background:T.bg2, border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden" }}>
          {/* Search + add root */}
          <div style={{ padding:"12px 14px", borderBottom:`1px solid ${T.border}`, background:T.bg3, display:"flex", flexDirection:"column", gap:8 }}>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="🔍 Поиск по названию..."
                style={{ flex:1, padding:"7px 10px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:12, outline:"none" }} />
              {searchQ && (
                <button onClick={() => setSearchQ("")}
                  style={{ padding:"7px 10px", background:"none", border:`1px solid ${T.border}`, borderRadius:4, color:T.txt2, fontSize:12, cursor:"pointer" }}>✕</button>
              )}
            </div>
            <Btn variant="primary" onClick={() => handleAdd(selected?.type === "COMPANY" || selected?.type === "CATEGORY" || selected?.type === "ASSET" ? selected : null)} T={T}
              style={{ fontSize:12, padding:"7px 12px", width:"100%" }}>
              + Добавить {selected ? "в " + selected.name : "узел"}
            </Btn>
          </div>

          {/* Tree */}
          <div style={{ padding:"10px 8px", overflowY:"auto", maxHeight:520 }}>
            {rootNodes.map(node => (
              <TreeNode key={node.id} node={node} nodes={nodes} selectedId={selected?.id}
                onSelect={setSelected} level={0} searchQ={searchQ} T={T} />
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ flex:1, minWidth:0 }}>
          {!selected ? (
            <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderRadius:8, padding:40, textAlign:"center" }}>
              <div style={{ fontSize:36, marginBottom:14 }}>🌳</div>
              <div style={{ fontSize:15, fontWeight:700, color:T.txt0, fontFamily:"'Oswald',sans-serif", marginBottom:8 }}>Выберите узел</div>
              <div style={{ fontSize:12, color:T.txt2, lineHeight:1.8 }}>
                Кликните на любой элемент дерева слева,<br/>чтобы увидеть детали и управлять узлом.
              </div>
            </div>
          ) : (
            <AssetDetailPanel
              node={selected} nodes={nodes} selCfg={selCfg} selParent={selParent}
              selChildren={selChildren} setSelected={setSelected}
              passports={passports} setPassports={setPassports}
              meters={meters} setMeters={setMeters}
              points={points} setPoints={setPoints}
              measurements={measurements} setMeasurements={setMeasurements}
              properties={properties} setProperties={setProperties}
              assetClasses={assetClasses}
              locations={locations} setLocations={setLocations}
              movements14={movements14} setMovements14={setMovements14}
              curLocations={curLocations} setCurLocations={setCurLocations}
              lifecycle={lifecycle} setLifecycle={setLifecycle}
              warranties={warranties} setWarranties={setWarranties}
              wProviders={wProviders}
              onEdit={() => setEditModal({ ...selected })}
              onDelete={() => setDelModal(selected)}
              onAddChild={() => handleAdd(selected)}
              user={user} T={T}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── EAM 1.4: ДВИЖЕНИЕ АКТИВОВ ────────────────────────────────────────────────

// ── Movement Form Modal ───────────────────────────────────────────────────────
function MovementFormModal({ preNode, nodes, locations, curLocations, onSave, onClose, user, T }) {
  const assets = nodes.filter(n => n.type === "ASSET" || n.type === "COMPONENT");
  const [nodeId,    setNodeId]    = useState(preNode?.id || "");
  const [movType,   setMovType]   = useState("TRANSFER");
  const [fromLoc,   setFromLoc]   = useState("");
  const [toLoc,     setToLoc]     = useState("");
  const [provider,  setProvider]  = useState("");
  const [reason,    setReason]    = useState("");
  const [docRef,    setDocRef]    = useState("");
  const [comment,   setComment]   = useState("");
  const [perfAt,    setPerfAt]    = useState(new Date().toISOString().slice(0,10));
  const [err,       setErr]       = useState("");

  // Auto-fill from location when node changes
  function onNodeChange(id) {
    setNodeId(id);
    const curLoc = curLocations[id];
    if (curLoc) setFromLoc(curLoc);
  }

  // On mount if preNode given
  useState(() => { if (preNode?.id) onNodeChange(preNode.id); }, []);

  const cfg = MOVEMENT_TYPE_CFG;

  function validate() {
    if (!nodeId) return "Выберите актив";
    if (!reason.trim()) return "Укажите причину операции";
    if (movType === "TRANSFER" && (!fromLoc || !toLoc)) return "Укажите «Откуда» и «Куда»";
    if (movType === "SEND_TO_REPAIR" && !toLoc) return "Укажите локацию ремонта";
    if (movType === "RETURN_FROM_REPAIR" && (!fromLoc || !toLoc)) return "Укажите откуда и куда возвращается";
    return null;
  }

  function submit() {
    const e = validate();
    if (e) { setErr(e); return; }
    const node = nodes.find(n => n.id === nodeId);
    onSave({
      id: "mv" + genId(),
      nodeId,
      nodeTypeSnap: node?.type || "ASSET",
      movType,
      fromLocId: fromLoc || null,
      toLocId:   toLoc   || null,
      serviceProvider: movType === "SEND_TO_REPAIR" ? provider : null,
      reason: reason.trim(),
      docRef: docRef.trim() || null,
      performedAt: perfAt,
      performedBy: user?.name || "Механик",
      comment: comment.trim() || null,
    });
    onClose();
  }

  const needFrom = ["TRANSFER","SEND_TO_REPAIR","RETURN_FROM_REPAIR"].includes(movType);
  const needTo   = ["TRANSFER","SEND_TO_REPAIR","RETURN_FROM_REPAIR"].includes(movType);

  return (
    <div style={{ position:"fixed", inset:0, background:T.modalBg, zIndex:700, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:20, overflowY:"auto" }}>
      <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderLeft:`3px solid #3b82f6`, borderRadius:8, width:"100%", maxWidth:560, marginTop:20, marginBottom:40 }}>
        <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:T.bg3 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.txt0, fontFamily:"'Oswald',sans-serif" }}>ПРОВЕСТИ ОПЕРАЦИЮ ДВИЖЕНИЯ</div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:22, color:T.txt2 }}>×</button>
        </div>
        <div style={{ padding:20, display:"flex", flexDirection:"column", gap:14 }}>

          {/* Asset selector */}
          {!preNode && (
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", display:"block", marginBottom:6 }}>Актив / Компонент</label>
              <select value={nodeId} onChange={e => onNodeChange(e.target.value)}
                style={{ width:"100%", padding:"9px 12px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:13, outline:"none" }}>
                <option value="">— выберите —</option>
                {assets.map(n => <option key={n.id} value={n.id}>{n.type === "COMPONENT" ? "  └ " : ""}{n.name}</option>)}
              </select>
            </div>
          )}
          {preNode && (
            <div style={{ padding:"10px 14px", background:T.bg3, borderRadius:5, border:`1px solid ${T.border}`, display:"flex", gap:10, alignItems:"center" }}>
              <span style={{ fontSize:16 }}>{NODE_TYPE_CFG[preNode.type]?.icon}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:T.txt0 }}>{preNode.name}</div>
                <div style={{ fontSize:12, color:T.txt2 }}>{NODE_TYPE_CFG[preNode.type]?.label}</div>
              </div>
            </div>
          )}

          {/* Movement type */}
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", display:"block", marginBottom:8 }}>Тип операции</label>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {Object.entries(MOVEMENT_TYPE_CFG).map(([k,v]) => (
                <button key={k} onClick={() => setMovType(k)}
                  style={{ padding:"9px 14px", borderRadius:5, cursor:"pointer", textAlign:"left",
                    border:`2px solid ${movType===k ? v.color : T.border}`,
                    background:movType===k ? `${v.color}18` : "transparent",
                    display:"flex", alignItems:"center", gap:10, fontFamily:"'Rajdhani',sans-serif" }}>
                  <span style={{ fontSize:18 }}>{v.icon}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:movType===k ? v.color : T.txt1 }}>{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Locations */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {needFrom && (
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", display:"block", marginBottom:6 }}>Откуда</label>
                <select value={fromLoc} onChange={e => setFromLoc(e.target.value)}
                  style={{ width:"100%", padding:"9px 12px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:13, outline:"none" }}>
                  <option value="">— не выбрано —</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            )}
            {needTo && (
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", display:"block", marginBottom:6 }}>Куда</label>
                <select value={toLoc} onChange={e => setToLoc(e.target.value)}
                  style={{ width:"100%", padding:"9px 12px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:13, outline:"none" }}>
                  <option value="">— не выбрано —</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name} {LOCATION_TYPE_CFG[l.type] ? `(${LOCATION_TYPE_CFG[l.type].label})` : ""}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Service provider */}
          {movType === "SEND_TO_REPAIR" && (
            <FieldInput label="Сервисная организация (необязательно)" value={provider} onChange={e => setProvider(e.target.value)} T={T} />
          )}

          {/* Reason + doc */}
          <FieldInput label="Причина операции *" value={reason} onChange={e => setReason(e.target.value)} T={T} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <FieldInput label="Номер акта / накладной" value={docRef} onChange={e => setDocRef(e.target.value)} T={T} />
            <FieldInput label="Дата проведения" type="date" value={perfAt} onChange={e => setPerfAt(e.target.value)} T={T} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", display:"block", marginBottom:6 }}>Комментарий</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2}
              style={{ width:"100%", padding:"9px 12px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:13, outline:"none", resize:"vertical" }} />
          </div>

          {err && <div style={{ padding:"8px 12px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:4, fontSize:12, color:"#f87171" }}>⚠ {err}</div>}
          <div style={{ display:"flex", gap:10 }}>
            <Btn variant="success" style={{ flex:1, padding:"11px" }} onClick={submit} T={T}>💾 Провести операцию</Btn>
            <Btn variant="ghost"   style={{ padding:"11px 16px" }}    onClick={onClose} T={T}>Отмена</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Location Manager Modal ────────────────────────────────────────────────────
function LocationManagerModal({ locations, setLocations, onClose, T }) {
  const [form,    setForm]    = useState({ name:"", type:"SITE" });
  const [adding,  setAdding]  = useState(false);
  const [delConf, setDelConf] = useState(null);

  function save() {
    if (!form.name.trim()) return;
    setLocations(prev => [...prev, { id:"loc"+genId(), name:form.name.trim(), type:form.type }]);
    setForm({ name:"", type:"SITE" }); setAdding(false);
  }

  return (
    <div style={{ position:"fixed", inset:0, background:T.modalBg, zIndex:800, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:20, overflowY:"auto" }}>
      <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderLeft:`3px solid #3b82f6`, borderRadius:8, width:"100%", maxWidth:520, marginTop:20, marginBottom:40 }}>
        <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:T.bg3 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.txt0, fontFamily:"'Oswald',sans-serif" }}>📍 СПРАВОЧНИК ЛОКАЦИЙ</div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:22, color:T.txt2 }}>×</button>
        </div>
        <div style={{ padding:20 }}>
          {adding && (
            <div style={{ marginBottom:14, padding:"14px 16px", background:T.bg3, borderRadius:6, border:`1px solid ${T.border}` }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                <FieldInput label="Название" value={form.name} onChange={e => setForm(p => ({ ...p, name:e.target.value }))} T={T} />
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", display:"block", marginBottom:6 }}>Тип</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type:e.target.value }))}
                    style={{ width:"100%", padding:"9px 12px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:13, outline:"none" }}>
                    {Object.entries(LOCATION_TYPE_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <Btn variant="success" style={{ flex:1 }} onClick={save} T={T}>💾 Добавить</Btn>
                <Btn variant="ghost" onClick={() => setAdding(false)} T={T}>Отмена</Btn>
              </div>
            </div>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:14 }}>
            {locations.map(l => {
              const lc = LOCATION_TYPE_CFG[l.type] || LOCATION_TYPE_CFG.OTHER;
              return (
                <div key={l.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 14px", background:T.bg3, borderRadius:5, border:`1px solid ${T.border}`, borderLeft:`4px solid ${lc.color}` }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.txt0 }}>{l.name}</div>
                    <div style={{ fontSize:11, color:lc.color, fontWeight:600 }}>{lc.label}</div>
                  </div>
                  {delConf === l.id ? (
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={() => { setLocations(p => p.filter(x => x.id !== l.id)); setDelConf(null); }}
                        style={{ padding:"4px 10px", borderRadius:3, border:"1px solid rgba(239,68,68,0.4)", background:"rgba(239,68,68,0.1)", color:"#f87171", cursor:"pointer", fontSize:12 }}>Да</button>
                      <button onClick={() => setDelConf(null)}
                        style={{ padding:"4px 10px", borderRadius:3, border:`1px solid ${T.border}`, background:"transparent", color:T.txt2, cursor:"pointer", fontSize:12 }}>Нет</button>
                    </div>
                  ) : (
                    <button onClick={() => setDelConf(l.id)}
                      style={{ fontSize:12, color:"#ef4444", background:"none", border:"none", cursor:"pointer" }}>🗑</button>
                  )}
                </div>
              );
            })}
          </div>
          <Btn variant="primary" onClick={() => setAdding(true)} T={T} style={{ width:"100%", padding:"10px" }}>+ Добавить локацию</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Movement History Tab (inside Asset Card) ──────────────────────────────────
function AssetMovementTab({ node, movements, locations, curLocations, nodes, onNewMovement, T }) {
  const myMovs = movements.filter(m => m.nodeId === node.id).sort((a,b) => b.performedAt.localeCompare(a.performedAt));
  const curLocId = curLocations[node.id];
  const curLoc = curLocId ? locations.find(l => l.id === curLocId) : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Current location + lifecycle */}
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:180, padding:"14px 16px", background:T.bg3, borderRadius:6, border:`1px solid ${T.border}` }}>
          <div style={{ fontSize:12, color:T.txt2, textTransform:"uppercase", fontWeight:700, marginBottom:6 }}>Текущая локация</div>
          <div style={{ fontSize:16, fontWeight:700, color:"#3b82f6", fontFamily:"'Oswald',sans-serif" }}>
            {curLoc ? curLoc.name : "—"}
          </div>
          {curLoc && <div style={{ fontSize:12, color:T.txt2, marginTop:2 }}>{LOCATION_TYPE_CFG[curLoc.type]?.label}</div>}
        </div>
        <div style={{ flex:1, minWidth:180, display:"flex", alignItems:"center", justifyContent:"flex-end" }}>
          <Btn variant="primary" onClick={onNewMovement} T={T} style={{ padding:"10px 20px" }}>🚚 Провести операцию</Btn>
        </div>
      </div>

      {/* History table */}
      <div>
        <div style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", marginBottom:8 }}>
          История движений {myMovs.length > 0 && `(${myMovs.length})`}
        </div>
        {myMovs.length === 0 ? (
          <div style={{ padding:24, textAlign:"center", background:T.bg3, borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, color:T.txt2 }}>Операций не зафиксировано</div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr style={{ background:T.bg3 }}>
                  {["Дата","Операция","Откуда → Куда","Причина","Кто провёл","Документ"].map(h => (
                    <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontWeight:700, color:T.txt2, borderBottom:`1px solid ${T.border}`, textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myMovs.map((m, i) => {
                  const mc = MOVEMENT_TYPE_CFG[m.movType] || MOVEMENT_TYPE_CFG.TRANSFER;
                  const from = m.fromLocId ? locations.find(l => l.id === m.fromLocId)?.name : "—";
                  const to   = m.toLocId   ? locations.find(l => l.id === m.toLocId)?.name   : "—";
                  return (
                    <tr key={m.id} style={{ background:i%2===0?T.bg2:T.bg3 }}>
                      <td style={{ padding:"8px 12px", color:T.txt2, whiteSpace:"nowrap" }}>{m.performedAt}</td>
                      <td style={{ padding:"8px 12px", whiteSpace:"nowrap" }}>
                        <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"2px 8px", borderRadius:3, background:`${mc.color}18`, color:mc.color, fontWeight:700 }}>
                          {mc.icon} {mc.label}
                        </span>
                      </td>
                      <td style={{ padding:"8px 12px", color:T.txt0, whiteSpace:"nowrap" }}>{from} → {to}</td>
                      <td style={{ padding:"8px 12px", color:T.txt1, maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.reason}</td>
                      <td style={{ padding:"8px 12px", color:T.txt2, whiteSpace:"nowrap" }}>{m.performedBy}</td>
                      <td style={{ padding:"8px 12px", color:T.txt2 }}>{m.docRef || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── EAM 1.4: Global Movement Journal Page ────────────────────────────────────
function MovementJournalPage({ movements, setMovements, nodes, locations, setLocations, curLocations, setCurLocations, lifecycle, setLifecycle, user, T }) {
  const [showForm,    setShowForm]    = useState(false);
  const [showLocMgr,  setShowLocMgr]  = useState(false);
  const [filterType,  setFilterType]  = useState("all");
  const [filterLoc,   setFilterLoc]   = useState("all");
  const [searchQ,     setSearchQ]     = useState("");

  function handleSave(mv) {
    setMovements(prev => [mv, ...prev]);
    // Update current location
    if (mv.toLocId) {
      setCurLocations(prev => ({ ...prev, [mv.nodeId]: mv.toLocId }));
    }
    // Update lifecycle status
    const statusMap = {
      SEND_TO_REPAIR:     "IN_REPAIR",
      RETURN_FROM_REPAIR: "IN_SERVICE",
      WRITE_OFF:          "WRITTEN_OFF",
      CONSERVATION:       "CONSERVED",
    };
    if (statusMap[mv.movType]) {
      setLifecycle(prev => ({ ...prev, [mv.nodeId]: statusMap[mv.movType] }));
    } else if (mv.movType === "TRANSFER") {
      const toLoc = locations.find(l => l.id === mv.toLocId);
      if (toLoc?.type === "WAREHOUSE") setLifecycle(prev => ({ ...prev, [mv.nodeId]: "STORED" }));
      else setLifecycle(prev => ({ ...prev, [mv.nodeId]: "IN_SERVICE" }));
    }
  }

  const filtered = movements.filter(m => {
    const node = nodes.find(n => n.id === m.nodeId);
    const matchQ    = !searchQ    || node?.name.toLowerCase().includes(searchQ.toLowerCase());
    const matchType = filterType === "all" || m.movType === filterType;
    const matchLoc  = filterLoc  === "all" || m.fromLocId === filterLoc || m.toLocId === filterLoc;
    return matchQ && matchType && matchLoc;
  }).sort((a,b) => b.performedAt.localeCompare(a.performedAt));

  return (
    <div>
      {showForm && (
        <MovementFormModal preNode={null} nodes={nodes} locations={locations}
          curLocations={curLocations} onSave={handleSave} onClose={() => setShowForm(false)} user={user} T={T} />
      )}
      {showLocMgr && (
        <LocationManagerModal locations={locations} setLocations={setLocations} onClose={() => setShowLocMgr(false)} T={T} />
      )}

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ background:"#f59e0b", color:"#000", padding:"4px 12px", borderRadius:3, fontSize:12, fontWeight:700, textTransform:"uppercase" }}>МЕХАНИК</div>
          <div style={{ fontSize:12, color:T.txt2 }}>Журнал движения активов</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <Btn variant="ghost" onClick={() => setShowLocMgr(true)} T={T} style={{ fontSize:12, padding:"7px 14px" }}>📍 Локации</Btn>
          <Btn variant="primary" onClick={() => setShowForm(true)} T={T} style={{ fontSize:12, padding:"7px 14px" }}>+ Новая операция</Btn>
        </div>
      </div>
      <SectionTitle label="EAM 1.4" sub="ДВИЖЕНИЕ АКТИВОВ" T={T} />

      {/* Summary counters */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:20 }}>
        {Object.entries(MOVEMENT_TYPE_CFG).map(([k,v]) => {
          const cnt = movements.filter(m => m.movType === k).length;
          return (
            <div key={k} style={{ padding:"10px 16px", borderRadius:5, background:`${v.color}12`, border:`1px solid ${v.color}30`, display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:18 }}>{v.icon}</span>
              <div>
                <div style={{ fontSize:18, fontWeight:700, color:v.color, fontFamily:"'Oswald',sans-serif", lineHeight:1 }}>{cnt}</div>
                <div style={{ fontSize:11, color:v.color, fontWeight:600 }}>{v.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
          placeholder="🔍 Поиск по активу..."
          style={{ padding:"8px 12px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:12, outline:"none", minWidth:200 }} />
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ padding:"8px 12px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:12, outline:"none" }}>
          <option value="all">Все типы</option>
          {Object.entries(MOVEMENT_TYPE_CFG).map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        <select value={filterLoc} onChange={e => setFilterLoc(e.target.value)}
          style={{ padding:"8px 12px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:12, outline:"none" }}>
          <option value="all">Все локации</option>
          {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        {(searchQ || filterType !== "all" || filterLoc !== "all") && (
          <button onClick={() => { setSearchQ(""); setFilterType("all"); setFilterLoc("all"); }}
            style={{ padding:"8px 12px", border:`1px solid ${T.border}`, borderRadius:4, background:"transparent", color:T.txt2, cursor:"pointer", fontSize:12 }}>
            ✕ Сбросить
          </button>
        )}
      </div>

      {/* Main table */}
      {filtered.length === 0 ? (
        <div style={{ padding:32, textAlign:"center", background:T.bg2, borderRadius:8, border:`1px solid ${T.border}`, fontSize:12, color:T.txt2 }}>Нет записей</div>
      ) : (
        <div style={{ background:T.bg2, borderRadius:8, border:`1px solid ${T.border}`, overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr style={{ background:T.bg3 }}>
                  {["Дата","Актив","Тип","Откуда","Куда","Причина","Документ","Кто"].map(h => (
                    <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontWeight:700, color:T.txt2, borderBottom:`1px solid ${T.border}`, textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => {
                  const mc = MOVEMENT_TYPE_CFG[m.movType] || MOVEMENT_TYPE_CFG.TRANSFER;
                  const node = nodes.find(n => n.id === m.nodeId);
                  const from = m.fromLocId ? locations.find(l => l.id === m.fromLocId)?.name : "—";
                  const to   = m.toLocId   ? locations.find(l => l.id === m.toLocId)?.name   : "—";
                  return (
                    <tr key={m.id} style={{ background:i%2===0?T.bg2:T.bg3 }}>
                      <td style={{ padding:"9px 14px", color:T.txt2, whiteSpace:"nowrap" }}>{m.performedAt}</td>
                      <td style={{ padding:"9px 14px", fontWeight:700, color:T.txt0 }}>{node?.name || m.nodeId}</td>
                      <td style={{ padding:"9px 14px", whiteSpace:"nowrap" }}>
                        <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 9px", borderRadius:3, background:`${mc.color}18`, color:mc.color, fontWeight:700 }}>
                          {mc.icon} {mc.label}
                        </span>
                      </td>
                      <td style={{ padding:"9px 14px", color:T.txt1 }}>{from}</td>
                      <td style={{ padding:"9px 14px", color:T.txt1 }}>{to}</td>
                      <td style={{ padding:"9px 14px", color:T.txt1, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.reason}</td>
                      <td style={{ padding:"9px 14px", color:T.txt2 }}>{m.docRef || "—"}</td>
                      <td style={{ padding:"9px 14px", color:T.txt2, whiteSpace:"nowrap" }}>{m.performedBy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── EAM 1.5: ГАРАНТИИ ────────────────────────────────────────────────────────

// ── Warranty Form Modal ───────────────────────────────────────────────────────
function WarrantyFormModal({ initial, preNodeId, nodes, providers, onSave, onClose, user, T }) {
  const [nodeId,    setNodeId]    = useState(initial?.nodeId    || preNodeId || "");
  const [wType,     setWType]     = useState(initial?.wType     || "MANUFACTURER");
  const [provName,  setProvName]  = useState(initial?.providerName || "");
  const [providerId,setProviderId]= useState(initial?.providerId || "");
  const [contractRef,setContRef] = useState(initial?.contractRef || "");
  const [startDate, setStart]    = useState(initial?.startDate  || new Date().toISOString().slice(0,10));
  const [endDate,   setEnd]      = useState(initial?.endDate    || "");
  const [coverage,  setCoverage] = useState(initial?.coverage   || "");
  const [exclusions,setExcl]     = useState(initial?.exclusions || "");
  const [cPerson,   setCPerson]  = useState(initial?.contactPerson || "");
  const [cPhone,    setCPhone]   = useState(initial?.contactPhone  || "");
  const [cEmail,    setCEmail]   = useState(initial?.contactEmail  || "");
  const [notes,     setNotes]    = useState(initial?.notes      || "");
  const [err,       setErr]      = useState("");

  const assets = nodes.filter(n => n.type === "ASSET" || n.type === "COMPONENT");

  function fillFromProvider(pid) {
    setProviderId(pid);
    const p = providers.find(x => x.id === pid);
    if (p) { setProvName(p.name); if (p.contactName) setCPerson(p.contactName); if (p.contactPhone) setCPhone(p.contactPhone); if (p.contactEmail) setCEmail(p.contactEmail); }
  }

  function submit() {
    if (!nodeId)          { setErr("Выберите актив"); return; }
    if (!provName.trim()) { setErr("Укажите провайдера"); return; }
    if (!endDate)         { setErr("Укажите дату окончания"); return; }
    if (endDate <= startDate) { setErr("Дата окончания должна быть позже начала"); return; }
    const now = new Date().toISOString().slice(0,10);
    onSave({
      id: initial?.id || "w"+genId(),
      nodeId, wType, providerName: provName.trim(), providerId,
      contractRef: contractRef.trim(), startDate, endDate,
      coverage: coverage.trim(), exclusions: exclusions.trim(),
      contactPerson: cPerson.trim(), contactPhone: cPhone.trim(), contactEmail: cEmail.trim(),
      notes: notes.trim(),
      createdBy: initial?.createdBy || user?.name || "Механик",
      createdAt:  initial?.createdAt || now,
      updatedAt:  now,
    });
    onClose();
  }

  const ac = WARRANTY_TYPE_CFG[wType]?.color || "#3b82f6";

  return (
    <div style={{ position:"fixed", inset:0, background:T.modalBg, zIndex:700, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:20, overflowY:"auto" }}>
      <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderLeft:`3px solid ${ac}`, borderRadius:8, width:"100%", maxWidth:580, marginTop:20, marginBottom:40 }}>
        <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:T.bg3 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.txt0, fontFamily:"'Oswald',sans-serif" }}>{initial ? "РЕДАКТИРОВАТЬ ГАРАНТИЮ" : "ДОБАВИТЬ ГАРАНТИЮ"}</div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:22, color:T.txt2 }}>×</button>
        </div>
        <div style={{ padding:20, display:"flex", flexDirection:"column", gap:13 }}>
          {/* Asset */}
          {!preNodeId && (
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", display:"block", marginBottom:6 }}>Актив / Компонент</label>
              <select value={nodeId} onChange={e => setNodeId(e.target.value)}
                style={{ width:"100%", padding:"9px 12px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:13, outline:"none" }}>
                <option value="">— выберите —</option>
                {assets.map(n => <option key={n.id} value={n.id}>{n.type==="COMPONENT"?"  └ ":""}{n.name}</option>)}
              </select>
            </div>
          )}

          {/* Type */}
          <div style={{ display:"flex", gap:8 }}>
            {Object.entries(WARRANTY_TYPE_CFG).map(([k,v]) => (
              <button key={k} onClick={() => setWType(k)}
                style={{ flex:1, padding:"9px", borderRadius:5, cursor:"pointer", border:`2px solid ${wType===k?v.color:T.border}`,
                  background:wType===k?`${v.color}18`:"transparent", color:wType===k?v.color:T.txt1,
                  fontSize:13, fontWeight:700, fontFamily:"'Rajdhani',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <span>{v.icon}</span> {v.label}
              </button>
            ))}
          </div>

          {/* Provider */}
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", display:"block", marginBottom:6 }}>Провайдер</label>
            <div style={{ display:"flex", gap:8 }}>
              <select value={providerId} onChange={e => fillFromProvider(e.target.value)}
                style={{ flex:1, padding:"9px 12px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:13, outline:"none" }}>
                <option value="">— из справочника —</option>
                {providers.filter(p => p.type === wType).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input value={provName} onChange={e => setProvName(e.target.value)} placeholder="Или введите вручную"
                style={{ flex:1, padding:"9px 12px", background:T.inputBg, border:`1px solid ${T.border}`, borderBottom:`2px solid ${ac}`, borderRadius:4, color:T.txt0, fontSize:13, outline:"none" }} />
            </div>
          </div>

          {/* Dates + contract */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
            <FieldInput label="Дата начала"    type="date" value={startDate} onChange={e => setStart(e.target.value)}    T={T} />
            <FieldInput label="Дата окончания" type="date" value={endDate}   onChange={e => setEnd(e.target.value)}      T={T} />
            <FieldInput label="№ договора"                 value={contractRef} onChange={e => setContRef(e.target.value)} T={T} />
          </div>

          {/* Coverage / exclusions */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", display:"block", marginBottom:6 }}>Что покрывает</label>
              <textarea value={coverage} onChange={e => setCoverage(e.target.value)} rows={2}
                style={{ width:"100%", padding:"9px 12px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:12, outline:"none", resize:"vertical" }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", display:"block", marginBottom:6 }}>Исключения</label>
              <textarea value={exclusions} onChange={e => setExcl(e.target.value)} rows={2}
                style={{ width:"100%", padding:"9px 12px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:12, outline:"none", resize:"vertical" }} />
            </div>
          </div>

          {/* Contacts */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
            <FieldInput label="Контактное лицо" value={cPerson} onChange={e => setCPerson(e.target.value)} T={T} />
            <FieldInput label="Телефон"         value={cPhone}  onChange={e => setCPhone(e.target.value)}  T={T} />
            <FieldInput label="Email"           value={cEmail}  onChange={e => setCEmail(e.target.value)}  T={T} />
          </div>
          <FieldInput label="Примечания" value={notes} onChange={e => setNotes(e.target.value)} T={T} />

          {err && <div style={{ padding:"8px 12px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:4, fontSize:12, color:"#f87171" }}>⚠ {err}</div>}
          <div style={{ display:"flex", gap:10 }}>
            <Btn variant="success" style={{ flex:1, padding:"11px" }} onClick={submit} T={T}>💾 Сохранить</Btn>
            <Btn variant="ghost"   style={{ padding:"11px 16px" }}    onClick={onClose} T={T}>Отмена</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Warranty Card (inline) ────────────────────────────────────────────────────
function WarrantyCard({ w, nodes, onEdit, onDelete, T }) {
  const status = calcWarrantyStatus(w.endDate);
  const sc = WARRANTY_STATUS_CFG[status];
  const tc = WARRANTY_TYPE_CFG[w.wType];
  const node = nodes.find(n => n.id === w.nodeId);
  const today = new Date(); today.setHours(0,0,0,0);
  const daysLeft = Math.round((new Date(w.endDate) - today) / 86400000);

  return (
    <div style={{ background:T.bg3, borderRadius:6, border:`1px solid ${T.border}`, borderLeft:`4px solid ${sc.color}`, marginBottom:10 }}>
      <div style={{ padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4, flexWrap:"wrap" }}>
            <span style={{ fontSize:12, fontWeight:700, padding:"2px 8px", borderRadius:3, background:`${tc.color}18`, color:tc.color }}>{tc.icon} {tc.label}</span>
            <span style={{ fontSize:12, fontWeight:700, padding:"2px 8px", borderRadius:3, background:`${sc.color}18`, color:sc.color }}>{sc.icon} {sc.label}</span>
            {daysLeft >= 0 && <span style={{ fontSize:12, color:sc.color, fontWeight:700 }}>Осталось: {daysLeft} дн.</span>}
            {daysLeft < 0  && <span style={{ fontSize:12, color:"#ef4444" }}>Истекла {Math.abs(daysLeft)} дн. назад</span>}
          </div>
          <div style={{ fontSize:15, fontWeight:700, color:T.txt0, fontFamily:"'Oswald',sans-serif" }}>{w.providerName}</div>
          {w.contractRef && <div style={{ fontSize:12, color:T.txt2, marginTop:2 }}>Договор: <b style={{ color:T.txt0 }}>{w.contractRef}</b></div>}
          <div style={{ fontSize:12, color:T.txt2, marginTop:4 }}>{w.startDate} → <b style={{ color:sc.color }}>{w.endDate}</b></div>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <Btn variant="ghost"  onClick={() => onEdit(w)}   T={T} style={{ fontSize:12, padding:"5px 12px" }}>✏</Btn>
          <Btn variant="danger" onClick={() => onDelete(w)} T={T} style={{ fontSize:12, padding:"5px 12px" }}>🗑</Btn>
        </div>
      </div>
      {(w.coverage || w.exclusions) && (
        <div style={{ padding:"0 16px 12px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {w.coverage   && <div style={{ fontSize:12, color:T.txt2 }}>✓ <b>Покрывает:</b> {w.coverage}</div>}
          {w.exclusions && <div style={{ fontSize:12, color:T.txt2 }}>✗ <b>Исключения:</b> {w.exclusions}</div>}
        </div>
      )}
    </div>
  );
}

// ── Asset Warranty Tab ────────────────────────────────────────────────────────
function AssetWarrantyTab({ node, warranties, setWarranties, providers, nodes, user, T }) {
  const myW = warranties.filter(w => w.nodeId === node.id);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [delConf,  setDelConf]  = useState(null);

  function handleSave(w) {
    setWarranties(prev => editing ? prev.map(x => x.id === w.id ? w : x) : [...prev, w]);
    setShowForm(false); setEditing(null);
  }

  return (
    <div>
      {(showForm || editing) && (
        <WarrantyFormModal initial={editing} preNodeId={node.id} nodes={nodes} providers={providers}
          onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null); }} user={user} T={T} />
      )}
      {delConf && (
        <div style={{ position:"fixed", inset:0, background:T.modalBg, zIndex:800, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:T.bg2, border:"1px solid rgba(239,68,68,0.4)", borderRadius:8, maxWidth:380, width:"100%", padding:28, textAlign:"center" }}>
            <div style={{ fontSize:32, marginBottom:10 }}>⚠️</div>
            <div style={{ fontSize:15, fontWeight:700, color:T.txt0, marginBottom:8 }}>Удалить гарантию?</div>
            <div style={{ fontSize:12, color:T.txt2, marginBottom:20 }}>{delConf.providerName} · {delConf.startDate} – {delConf.endDate}</div>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <Btn variant="primary" style={{ background:"linear-gradient(135deg,#dc2626,#991b1b)" }}
                onClick={() => { setWarranties(p => p.filter(x => x.id !== delConf.id)); setDelConf(null); }} T={T}>Удалить</Btn>
              <Btn variant="ghost" onClick={() => setDelConf(null)} T={T}>Отмена</Btn>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ fontSize:12, color:T.txt2 }}>{myW.length > 0 ? `${myW.length} гарантий` : "Гарантий нет"}</div>
        <Btn variant="primary" onClick={() => setShowForm(true)} T={T} style={{ fontSize:12, padding:"6px 14px" }}>+ Добавить гарантию</Btn>
      </div>

      {myW.length === 0 ? (
        <div style={{ padding:24, textAlign:"center", background:T.bg3, borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, color:T.txt2 }}>Гарантии не зарегистрированы</div>
      ) : (
        myW.map(w => <WarrantyCard key={w.id} w={w} nodes={nodes} onEdit={w => setEditing(w)} onDelete={setDelConf} T={T} />)
      )}
    </div>
  );
}

// ── Provider Manager Modal ────────────────────────────────────────────────────
function ProviderManagerModal({ providers, setProviders, onClose, T }) {
  const [adding, setAdding] = useState(false);
  const [form,   setForm]   = useState({ type:"MANUFACTURER", name:"", contactName:"", contactPhone:"", contactEmail:"", notes:"" });
  const [editId, setEditId] = useState(null);

  function save() {
    if (!form.name.trim()) return;
    if (editId) {
      setProviders(prev => prev.map(p => p.id === editId ? { ...p, ...form, name:form.name.trim() } : p));
      setEditId(null);
    } else {
      setProviders(prev => [...prev, { id:"wp"+genId(), ...form, name:form.name.trim() }]);
    }
    setForm({ type:"MANUFACTURER", name:"", contactName:"", contactPhone:"", contactEmail:"", notes:"" });
    setAdding(false);
  }

  function startEdit(p) { setForm({ type:p.type, name:p.name, contactName:p.contactName||"", contactPhone:p.contactPhone||"", contactEmail:p.contactEmail||"", notes:p.notes||"" }); setEditId(p.id); setAdding(true); }

  return (
    <div style={{ position:"fixed", inset:0, background:T.modalBg, zIndex:800, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:20, overflowY:"auto" }}>
      <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderLeft:`3px solid #3b82f6`, borderRadius:8, width:"100%", maxWidth:580, marginTop:20, marginBottom:40 }}>
        <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:T.bg3 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.txt0, fontFamily:"'Oswald',sans-serif" }}>🏭 СПРАВОЧНИК ПРОВАЙДЕРОВ</div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:22, color:T.txt2 }}>×</button>
        </div>
        <div style={{ padding:20 }}>
          {adding && (
            <div style={{ marginBottom:16, padding:"14px 16px", background:T.bg3, borderRadius:6, border:`1px solid ${T.border}` }}>
              <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                {Object.entries(WARRANTY_TYPE_CFG).map(([k,v]) => (
                  <button key={k} onClick={() => setForm(p => ({ ...p, type:k }))}
                    style={{ flex:1, padding:"7px", borderRadius:4, cursor:"pointer", border:`2px solid ${form.type===k?v.color:T.border}`,
                      background:form.type===k?`${v.color}18`:"transparent", color:form.type===k?v.color:T.txt2,
                      fontSize:12, fontWeight:700, fontFamily:"'Rajdhani',sans-serif" }}>{v.icon} {v.label}</button>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                <FieldInput label="Название *" value={form.name} onChange={e => setForm(p => ({ ...p, name:e.target.value }))} T={T} />
                <FieldInput label="Контактное лицо" value={form.contactName} onChange={e => setForm(p => ({ ...p, contactName:e.target.value }))} T={T} />
                <FieldInput label="Телефон" value={form.contactPhone} onChange={e => setForm(p => ({ ...p, contactPhone:e.target.value }))} T={T} />
                <FieldInput label="Email"   value={form.contactEmail} onChange={e => setForm(p => ({ ...p, contactEmail:e.target.value }))} T={T} />
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <Btn variant="success" style={{ flex:1 }} onClick={save} T={T}>💾 {editId ? "Сохранить" : "Добавить"}</Btn>
                <Btn variant="ghost" onClick={() => { setAdding(false); setEditId(null); }} T={T}>Отмена</Btn>
              </div>
            </div>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
            {providers.map(p => {
              const tc = WARRANTY_TYPE_CFG[p.type];
              return (
                <div key={p.id} style={{ padding:"10px 14px", background:T.bg3, borderRadius:5, border:`1px solid ${T.border}`, borderLeft:`4px solid ${tc.color}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:T.txt0 }}>{tc.icon} {p.name}</div>
                    {p.contactName  && <div style={{ fontSize:12, color:T.txt2 }}>{p.contactName} · {p.contactPhone}</div>}
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={() => startEdit(p)} style={{ fontSize:12, color:T.txt2, background:"none", border:"none", cursor:"pointer" }}>✏</button>
                    <button onClick={() => setProviders(prev => prev.filter(x => x.id !== p.id))} style={{ fontSize:12, color:"#ef4444", background:"none", border:"none", cursor:"pointer" }}>🗑</button>
                  </div>
                </div>
              );
            })}
          </div>
          <Btn variant="primary" onClick={() => { setAdding(true); setEditId(null); setForm({ type:"MANUFACTURER", name:"", contactName:"", contactPhone:"", contactEmail:"", notes:"" }); }} T={T} style={{ width:"100%", padding:"10px" }}>+ Добавить провайдера</Btn>
        </div>
      </div>
    </div>
  );
}

// ── EAM 1.5: Global Warranty Registry Page ────────────────────────────────────
function WarrantyRegistryPage({ warranties, setWarranties, providers, setProviders, nodes, user, T }) {
  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [showProv,  setShowProv]  = useState(false);
  const [filterSt,  setFilterSt]  = useState("all");
  const [filterType,setFilterType]= useState("all");
  const [searchQ,   setSearchQ]   = useState("");

  function handleSave(w) {
    setWarranties(prev => editing ? prev.map(x => x.id === w.id ? w : x) : [...prev, w]);
    setShowForm(false); setEditing(null);
  }

  const enriched = warranties.map(w => ({ ...w, status: calcWarrantyStatus(w.endDate), node: nodes.find(n => n.id === w.nodeId) }));

  const filtered = enriched.filter(w => {
    const matchQ  = !searchQ    || w.node?.name.toLowerCase().includes(searchQ.toLowerCase()) || w.providerName.toLowerCase().includes(searchQ.toLowerCase());
    const matchSt = filterSt   === "all" || w.status === filterSt;
    const matchTy = filterType === "all" || w.wType  === filterType;
    return matchQ && matchSt && matchTy;
  }).sort((a,b) => a.endDate.localeCompare(b.endDate));

  const counts = { ACTIVE:0, EXPIRING_SOON:0, EXPIRED:0 };
  enriched.forEach(w => counts[w.status] = (counts[w.status]||0)+1);

  return (
    <div>
      {(showForm || editing) && (
        <WarrantyFormModal initial={editing} preNodeId={null} nodes={nodes} providers={providers}
          onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null); }} user={user} T={T} />
      )}
      {showProv && <ProviderManagerModal providers={providers} setProviders={setProviders} onClose={() => setShowProv(false)} T={T} />}

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ background:"#f59e0b", color:"#000", padding:"4px 12px", borderRadius:3, fontSize:12, fontWeight:700, textTransform:"uppercase" }}>МЕХАНИК</div>
          <div style={{ fontSize:12, color:T.txt2 }}>Реестр гарантий</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <Btn variant="ghost"   onClick={() => setShowProv(true)}  T={T} style={{ fontSize:12, padding:"7px 14px" }}>🏭 Провайдеры</Btn>
          <Btn variant="primary" onClick={() => setShowForm(true)}  T={T} style={{ fontSize:12, padding:"7px 14px" }}>+ Добавить гарантию</Btn>
        </div>
      </div>
      <SectionTitle label="EAM 1.5" sub="УЧЁТ ГАРАНТИЙ" T={T} />

      {/* Summary */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:20 }}>
        {Object.entries(WARRANTY_STATUS_CFG).map(([k,v]) => (
          <div key={k} style={{ padding:"10px 18px", borderRadius:5, background:`${v.color}12`, border:`1px solid ${v.color}30`, display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}
            onClick={() => setFilterSt(filterSt===k?"all":k)}>
            <span style={{ fontSize:20 }}>{v.icon}</span>
            <div>
              <div style={{ fontSize:22, fontWeight:700, color:v.color, fontFamily:"'Oswald',sans-serif", lineHeight:1 }}>{counts[k]||0}</div>
              <div style={{ fontSize:11, color:v.color, fontWeight:600 }}>{v.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
          placeholder="🔍 Поиск по активу или провайдеру..."
          style={{ padding:"8px 12px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:12, outline:"none", minWidth:240 }} />
        <select value={filterSt} onChange={e => setFilterSt(e.target.value)}
          style={{ padding:"8px 12px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:12, outline:"none" }}>
          <option value="all">Все статусы</option>
          {Object.entries(WARRANTY_STATUS_CFG).map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ padding:"8px 12px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:12, outline:"none" }}>
          <option value="all">Все типы</option>
          {Object.entries(WARRANTY_TYPE_CFG).map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        {(searchQ||filterSt!=="all"||filterType!=="all") && (
          <button onClick={() => { setSearchQ(""); setFilterSt("all"); setFilterType("all"); }}
            style={{ padding:"8px 12px", border:`1px solid ${T.border}`, borderRadius:4, background:"transparent", color:T.txt2, cursor:"pointer", fontSize:12 }}>✕ Сбросить</button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ padding:32, textAlign:"center", background:T.bg2, borderRadius:8, border:`1px solid ${T.border}`, fontSize:12, color:T.txt2 }}>Нет записей</div>
      ) : (
        <div style={{ background:T.bg2, borderRadius:8, border:`1px solid ${T.border}`, overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr style={{ background:T.bg3 }}>
                  {["Статус","Актив","Тип","Провайдер","Начало","Окончание","Осталось","Покрытие",""].map(h => (
                    <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontWeight:700, color:T.txt2, borderBottom:`1px solid ${T.border}`, textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((w, i) => {
                  const sc = WARRANTY_STATUS_CFG[w.status];
                  const tc = WARRANTY_TYPE_CFG[w.wType];
                  const today = new Date(); today.setHours(0,0,0,0);
                  const days = Math.round((new Date(w.endDate) - today) / 86400000);
                  return (
                    <tr key={w.id} style={{ background:i%2===0?T.bg2:T.bg3 }}>
                      <td style={{ padding:"9px 12px" }}>
                        <span style={{ padding:"2px 8px", borderRadius:3, background:`${sc.color}18`, color:sc.color, fontWeight:700 }}>{sc.icon} {sc.label}</span>
                      </td>
                      <td style={{ padding:"9px 12px", fontWeight:700, color:T.txt0 }}>{w.node?.name || w.nodeId}</td>
                      <td style={{ padding:"9px 12px" }}>
                        <span style={{ color:tc.color, fontWeight:700 }}>{tc.icon} {tc.label}</span>
                      </td>
                      <td style={{ padding:"9px 12px", color:T.txt0 }}>{w.providerName}</td>
                      <td style={{ padding:"9px 12px", color:T.txt2, whiteSpace:"nowrap" }}>{w.startDate}</td>
                      <td style={{ padding:"9px 12px", fontWeight:700, color:sc.color, whiteSpace:"nowrap" }}>{w.endDate}</td>
                      <td style={{ padding:"9px 12px", fontWeight:700, color:sc.color, textAlign:"right" }}>{days >= 0 ? `${days} дн.` : `−${Math.abs(days)} дн.`}</td>
                      <td style={{ padding:"9px 12px", color:T.txt2, maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{w.coverage || "—"}</td>
                      <td style={{ padding:"9px 12px", whiteSpace:"nowrap" }}>
                        <button onClick={() => setEditing(w)} style={{ marginRight:8, fontSize:12, color:T.txt2, background:"none", border:"none", cursor:"pointer" }}>✏</button>
                        <button onClick={() => setWarranties(p => p.filter(x => x.id !== w.id))} style={{ fontSize:12, color:"#ef4444", background:"none", border:"none", cursor:"pointer" }}>🗑</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FINANCE STUB ─────────────────────────────────────────────────────────────
function FinancePage({ T }) {
  return (
    <div>
      <SectionTitle label="Финансовый модуль" sub="ФИНАНСЫ" T={T} />
      <Card style={{ padding: "48px 32px", textAlign: "center", border: `2px dashed ${T.amber}40` }} T={T}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏗</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: T.amber, fontFamily: "'Oswald',sans-serif", marginBottom: 8 }}>МОДУЛЬ В РАЗРАБОТКЕ</div>
        <div style={{ fontSize: 13, color: T.txt2, lineHeight: 1.8 }}>
          Будет включать: Бюджет БВР · Себестоимость метра · ГСМ расходы · P&L по участкам
        </div>
      </Card>
    </div>
  );
}

// ─── FOREMAN DASHBOARD ────────────────────────────────────────────────────────
function ForemanDash({ objs, rigs, reps, T }) {
  const approved = reps.filter((r) => r.status === "approved");
  const colors   = OBJ_COLORS(T);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <div style={{ background: T.amber, color: "#000", padding: "4px 12px", borderRadius: 3, fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>ЭТАП 1 — НАЧ. УЧАСТКА</div>
      </div>
      <SectionTitle label="Мои участки" sub="ОБЗОР" T={T} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12 }}>
        {objs.map((obj, i) => {
          const rr = approved.filter((r) => r.oid === obj.id);
          const df = rr.reduce((s,r)=>s+r.df,0), bf = rr.reduce((s,r)=>s+r.bf,0);
          const wh = rr.reduce((s,r)=>s+r.wh,0), dh = rr.reduce((s,r)=>s+r.dh,0);
          const kv = ktgCalc(wh, dh);
          const ac = colors[i % colors.length];
          return (
            <Card key={obj.id} accent={ac} style={{ padding: 16 }} T={T}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.txt0, fontFamily: "'Oswald',sans-serif" }}>{obj.name.toUpperCase()}</div>
                <KTGGauge v={kv} plan={obj.kp} size={52} T={T} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[[T.red,"⛏ Бурение",df,obj.dp,"п.м"],[T.amber,"💥 Взрывы",bf,obj.bp,"м³"]].map(([color,lbl,fact,plan,unit]) => (
                  <div key={lbl} style={{ background: T.bg3, borderRadius: 3, padding: "8px 10px", border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color, textTransform: "uppercase", marginBottom: 4 }}>{lbl}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: "'Oswald',sans-serif" }}>{fact.toLocaleString()}</div>
                    <div style={{ fontSize: 12, color: T.txt2 }}>/ {plan.toLocaleString()} {unit}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: T.txt2 }}>{rigs.filter((r) => r.o === obj.id).length} станков · {rr.length} отчётов</div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── KTG STATUS CONFIG ────────────────────────────────────────────────────────
const KTG_PLAN_STATUS = {
  DRAFT:     { label:"Черновик",    color:"#5a7499", bg:"rgba(90,116,153,0.12)",   border:"rgba(90,116,153,0.3)"   },
  SUBMITTED: { label:"На проверке", color:"#60a5fa", bg:"rgba(59,130,246,0.12)",   border:"rgba(59,130,246,0.35)"  },
  ACCEPTED:  { label:"Принят",      color:"#10b981", bg:"rgba(16,185,129,0.12)",   border:"rgba(16,185,129,0.35)"  },
  RETURNED:  { label:"Возвращён",   color:"#f87171", bg:"rgba(239,68,68,0.12)",    border:"rgba(239,68,68,0.35)"   },
};

function KTGPlanBadge({ status }) {
  const cfg = KTG_PLAN_STATUS[status] || KTG_PLAN_STATUS.DRAFT;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      padding:"3px 10px", borderRadius:3,
      background:cfg.bg, border:`1px solid ${cfg.border}`,
      color:cfg.color, fontSize:12, fontWeight:700,
      letterSpacing:".08em", textTransform:"uppercase",
    }}>
      <span style={{width:5,height:5,borderRadius:"50%",background:cfg.color,display:"inline-block"}}/>
      {cfg.label}
    </span>
  );
}

// ─── MECHANIC ASSETS PAGE ─────────────────────────────────────────────────────
function MechanicAssetsPage({ nodes, setNodes, objs, reps, assetClasses, passports, setPassports, mechCats, setMechCats, user, T }) {
  const cats = mechCats || DEFAULT_MECH_CATS;
  const [selCat,        setSelCat]        = useState(null);
  const [detailNode,    setDetailNode]    = useState(null); // asset detail view
  const [assetModal,    setAssetModal]    = useState(null);
  const [catModal,      setCatModal]      = useState(null);
  const [selNode,       setSelNode]       = useState(null);
  const [deleteConfId,  setDeleteConfId]  = useState(null);
  const [assetForm,     setAssetForm]     = useState({ name:"", category:"DRILL_RIG", assigned_object_id:"", note:"" });
  const [catForm,       setCatForm]       = useState({ key:"", label:"", icon:"⛏", color:"#f43f5e" });
  const [err,           setErr]           = useState("");
  const [passportEdit,  setPassportEdit]  = useState(false);
  const [ppForm,        setPpForm]        = useState({});

  const assets = nodes.filter(n => n.type === "ASSET").map(n => ({
    ...n,
    category: passports[n.id]?.assetClass || "DRILL_RIG",
  }));
  const catAssets = selCat ? assets.filter(a => a.category === selCat) : assets;

  // ── Asset CRUD ──
  function openAddAsset() {
    setAssetForm({ name:"", category: selCat || cats[0]?.key || "DRILL_RIG", assigned_object_id:"", note:"" });
    setErr(""); setAssetModal("add");
  }
  function openEditAsset(a) {
    setSelNode(a);
    setAssetForm({ name:a.name, category:a.category, assigned_object_id:a.assigned_object_id||"", note:a.note||"" });
    setErr(""); setAssetModal("edit");
  }
  function saveAsset() {
    if (!assetForm.name.trim()) { setErr("Введите название актива"); return; }
    const catNode = nodes.find(n => n.catType === assetForm.category);
    if (assetModal === "add") {
      const newNode = {
        id:"ua"+genId(), parentId:catNode?.id||"c1",
        name:assetForm.name.trim(), type:"ASSET", catType:null, desc:assetForm.note||"",
        assigned_object_id: assetForm.assigned_object_id ? Number(assetForm.assigned_object_id) : null,
        note:assetForm.note||"", createdBy:user.name, createdAt:new Date().toISOString().slice(0,10),
      };
      setNodes(prev => [...prev, newNode]);
      setPassports(prev => ({ ...prev, [newNode.id]: { assetClass: assetForm.category, moto_hours: 0 } }));
    } else {
      setNodes(prev => prev.map(n => n.id===selNode.id
        ? { ...n, name:assetForm.name.trim(), assigned_object_id: assetForm.assigned_object_id?Number(assetForm.assigned_object_id):null, note:assetForm.note||"" }
        : n));
      setPassports(prev => ({ ...prev, [selNode.id]: { ...(prev[selNode.id]||{}), assetClass:assetForm.category } }));
      if (detailNode?.id === selNode.id) setDetailNode(prev => prev ? {...prev, name:assetForm.name.trim()} : prev);
    }
    setAssetModal(null); setErr("");
  }
  function confirmDeleteAsset() {
    if (detailNode?.id === deleteConfId) setDetailNode(null);
    setNodes(prev => prev.filter(n => n.id !== deleteConfId));
    setDeleteConfId(null);
  }

  // ── Category CRUD ──
  function openAddCat() { setCatForm({ key:"", label:"", icon:"⛏", color:"#f43f5e" }); setErr(""); setCatModal("add"); }
  function openEditCat(cat) { setCatForm({ key:cat.key, label:cat.label, icon:cat.icon, color:cat.color }); setErr(""); setCatModal("edit_"+cat.key); }
  function saveCat() {
    const key = catForm.key.trim().toUpperCase().replace(/\s+/g,"_");
    if (!key) { setErr("Введите ключ категории"); return; }
    if (!catForm.label.trim()) { setErr("Введите название категории"); return; }
    if (catModal === "add" && cats.find(c=>c.key===key)) { setErr("Категория с таким ключом уже существует"); return; }
    if (catModal === "add") {
      setMechCats(prev => [...prev, { key, label:catForm.label.trim(), icon:catForm.icon, color:catForm.color }]);
    } else {
      const editKey = catModal.replace("edit_","");
      setMechCats(prev => prev.map(c => c.key===editKey ? { key:editKey, label:catForm.label.trim(), icon:catForm.icon, color:catForm.color } : c));
    }
    setCatModal(null); setErr("");
  }
  function deleteCat(key) { setMechCats(prev => prev.filter(c => c.key !== key)); }

  const activeCat = cats.find(c => c.key === selCat);

  // ── ASSET DETAIL VIEW ──────────────────────────────────────────────────────
  if (detailNode) {
    const a   = detailNode;
    const pp  = passports[a.id] || {};
    const cat = cats.find(c => c.key === pp.assetClass) || {icon:"📦", color:T.txt2, label:"—"};
    const obj = objs.find(o => o.id === Number(a.assigned_object_id));
    const log = pp.moto_hours_log || [];
    const mh  = pp.moto_hours || 0;
    const yr  = pp.year ? new Date().getFullYear() - parseInt(pp.year) : null;

    function openPassportEdit() {
      setPpForm({
        manufacturer: pp.manufacturer||"",
        model: pp.model||"",
        year: pp.year||"",
        serial: pp.serial||"",
        inventory: pp.inventory||"",
        moto_hours: String(pp.moto_hours||0),
      });
      setPassportEdit(true);
    }
    function savePassport() {
      setPassports(prev => ({
        ...prev,
        [a.id]: {
          ...(prev[a.id]||{}),
          manufacturer: ppForm.manufacturer,
          model: ppForm.model,
          year: ppForm.year,
          serial: ppForm.serial,
          inventory: ppForm.inventory,
          moto_hours: parseFloat(ppForm.moto_hours)||0,
        }
      }));
      setPassportEdit(false);
    }

    // Status based on hours
    function hoursStatus(h) {
      if (h >= 20000) return { label:"Капремонт", color:"#ef4444" };
      if (h >= 15000) return { label:"ТО-3", color:T.amber };
      if (h >= 10000) return { label:"ТО-2", color:"#f59e0b" };
      if (h >= 5000)  return { label:"ТО-1", color:T.green };
      return { label:"Новое", color:T.cyan };
    }
    const hs = hoursStatus(mh);

    return (
      <div>
        {/* Passport edit modal */}
        {passportEdit && (
          <div style={{position:"fixed",inset:0,background:T.modalBg,zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderLeft:`4px solid ${cat.color}`,borderRadius:8,width:"100%",maxWidth:480}}>
              <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:T.bg3}}>
                <div style={{fontSize:14,fontWeight:700,color:T.txt0,fontFamily:"'Oswald',sans-serif"}}>✏ ПАСПОРТ — {a.name}</div>
                <button onClick={()=>setPassportEdit(false)} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:T.txt2}}>×</button>
              </div>
              <div style={{padding:18,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <FieldInput label="Производитель" value={ppForm.manufacturer} onChange={e=>setPpForm(p=>({...p,manufacturer:e.target.value}))} T={T}/>
                <FieldInput label="Марка / Модель" value={ppForm.model}        onChange={e=>setPpForm(p=>({...p,model:e.target.value}))} T={T}/>
                <FieldInput label="Год выпуска"    value={ppForm.year}         onChange={e=>setPpForm(p=>({...p,year:e.target.value}))} T={T}/>
                <FieldInput label="Серийный №"     value={ppForm.serial}       onChange={e=>setPpForm(p=>({...p,serial:e.target.value}))} T={T}/>
                <FieldInput label="Инвентарный №"  value={ppForm.inventory}    onChange={e=>setPpForm(p=>({...p,inventory:e.target.value}))} T={T}/>
                <FieldInput label="Наработка (мч)" type="number" value={ppForm.moto_hours} onChange={e=>setPpForm(p=>({...p,moto_hours:e.target.value}))} T={T}/>
                <div style={{gridColumn:"1/-1",display:"flex",gap:8,marginTop:4}}>
                  <Btn variant="success" style={{flex:1}} onClick={savePassport} T={T}>✓ Сохранить</Btn>
                  <Btn variant="ghost" onClick={()=>setPassportEdit(false)} T={T}>Отмена</Btn>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Breadcrumb */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20,flexWrap:"wrap"}}>
          <button onClick={()=>setDetailNode(null)} style={{padding:"6px 14px",borderRadius:5,border:`1px solid ${T.border}`,background:T.bg2,color:T.txt2,cursor:"pointer",fontSize:12,fontFamily:"'Rajdhani',sans-serif",fontWeight:600}}>← Все активы</button>
          <span style={{color:T.txt2}}>›</span>
          <div style={{padding:"5px 14px",borderRadius:5,background:`${cat.color}15`,border:`1px solid ${cat.color}40`,fontSize:13,fontWeight:700,color:cat.color,fontFamily:"'Oswald',sans-serif"}}>{cat.icon} {a.name}</div>
          <div style={{marginLeft:"auto",display:"flex",gap:6}}>
            <button onClick={openPassportEdit} style={{padding:"6px 14px",borderRadius:5,border:`1px solid ${T.border}`,background:T.bg2,color:T.txt1,cursor:"pointer",fontSize:12,fontFamily:"'Rajdhani',sans-serif",fontWeight:600}}>✏ Редактировать</button>
            <button onClick={()=>setDeleteConfId(a.id)} style={{padding:"6px 12px",borderRadius:5,border:"1px solid rgba(239,68,68,0.4)",background:"rgba(239,68,68,0.08)",color:"#f87171",cursor:"pointer",fontSize:12}}>🗑</button>
          </div>
        </div>

        {/* Delete confirm */}
        {deleteConfId && (
          <div style={{position:"fixed",inset:0,background:T.modalBg,zIndex:800,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <div style={{background:T.bg2,border:"1px solid rgba(239,68,68,0.4)",borderRadius:8,maxWidth:360,width:"100%",padding:28,textAlign:"center"}}>
              <div style={{fontSize:36,marginBottom:12}}>⚠️</div>
              <div style={{fontSize:15,fontWeight:700,color:T.txt0,fontFamily:"'Oswald',sans-serif",marginBottom:8}}>УДАЛИТЬ {a.name}?</div>
              <div style={{fontSize:13,color:T.txt2,marginBottom:20}}>Это действие нельзя отменить.</div>
              <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                <Btn variant="primary" style={{background:"linear-gradient(135deg,#dc2626,#991b1b)"}} onClick={confirmDeleteAsset} T={T}>Удалить</Btn>
                <Btn variant="ghost" onClick={()=>setDeleteConfId(null)} T={T}>Отмена</Btn>
              </div>
            </div>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {/* LEFT — Passport */}
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {/* Header card */}
            <Card accent={cat.color} T={T} style={{overflow:"hidden",padding:0}}>
              <div style={{height:6,background:`linear-gradient(90deg,${cat.color},${cat.color}60)`}}/>
              <div style={{padding:"16px 20px"}}>
                <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
                  <div style={{width:56,height:56,borderRadius:12,background:`${cat.color}20`,border:`2px solid ${cat.color}40`,
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>
                    {cat.icon}
                  </div>
                  <div>
                    <div style={{fontSize:22,fontWeight:700,color:T.txt0,fontFamily:"'Oswald',sans-serif",letterSpacing:"1px"}}>{a.name}</div>
                    <div style={{fontSize:12,color:cat.color,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em"}}>{cat.label}</div>
                    {obj && <div style={{fontSize:12,color:T.cyan,marginTop:2}}>📍 {obj.name}</div>}
                  </div>
                </div>
                {/* Key specs */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[
                    {lbl:"Производитель", val:pp.manufacturer||"—", icon:"🏭"},
                    {lbl:"Марка/Модель",   val:pp.model||"—",        icon:"🔧"},
                    {lbl:"Год выпуска",    val:pp.year ? `${pp.year} г. (${yr} лет)` : "—", icon:"📅"},
                    {lbl:"Серийный №",     val:pp.serial||"—",       icon:"🔢"},
                    {lbl:"Инвент. №",      val:pp.inventory||"—",    icon:"📋"},
                    {lbl:"Объект",         val:obj?.name||"Не назначен", icon:"📍"},
                  ].map(({lbl,val,icon})=>(
                    <div key={lbl} style={{padding:"8px 10px",background:T.bg3,borderRadius:5,border:`1px solid ${T.border}`}}>
                      <div style={{fontSize:10,color:T.txt2,textTransform:"uppercase",marginBottom:3}}>{icon} {lbl}</div>
                      <div style={{fontSize:13,fontWeight:700,color:T.txt0}}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT — Moto hours */}
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {/* Hours gauge card */}
            <Card accent={hs.color} T={T} style={{padding:"16px 20px"}}>
              <div style={{fontSize:11,color:T.txt2,textTransform:"uppercase",letterSpacing:".1em",marginBottom:10}}>⏱ Наработка</div>
              <div style={{display:"flex",alignItems:"flex-end",gap:12,marginBottom:12}}>
                <div style={{fontSize:48,fontWeight:700,color:hs.color,fontFamily:"'Oswald',sans-serif",lineHeight:1}}>
                  {mh.toLocaleString()}
                </div>
                <div style={{fontSize:16,color:T.txt2,marginBottom:8}}>мч</div>
              </div>
              {/* Progress toward next service */}
              {(()=>{
                const milestones = [5000,10000,15000,20000];
                const next = milestones.find(m => m > mh);
                if (!next) return <div style={{fontSize:12,color:"#ef4444",fontWeight:700}}>⚠ Требуется капитальный ремонт</div>;
                const prev = milestones[milestones.indexOf(next)-1] || 0;
                const pct  = Math.round((mh - prev) / (next - prev) * 100);
                return (
                  <div>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <div style={{fontSize:11,color:T.txt2}}>До следующего ТО ({next.toLocaleString()} мч)</div>
                      <div style={{fontSize:11,fontWeight:700,color:hs.color}}>{(next-mh).toLocaleString()} мч</div>
                    </div>
                    <div style={{height:8,background:T.border,borderRadius:4,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:hs.color,borderRadius:4,transition:"width 0.6s"}}/>
                    </div>
                    <div style={{fontSize:10,color:T.txt2,marginTop:4}}>{pct}% до ТО</div>
                  </div>
                );
              })()}
              <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
                {[{v:5000,l:"ТО-1"},{v:10000,l:"ТО-2"},{v:15000,l:"ТО-3"},{v:20000,l:"Кап"}].map(({v,l})=>(
                  <div key={v} style={{fontSize:10,padding:"2px 8px",borderRadius:3,
                    background:mh>=v?`${hs.color}20`:`${T.border}20`,
                    border:`1px solid ${mh>=v?hs.color+"50":T.border}`,
                    color:mh>=v?hs.color:T.txt2,fontWeight:700}}>
                    {l} {mh>=v?"✓":v.toLocaleString()}
                  </div>
                ))}
              </div>
            </Card>

            {/* Hours log */}
            <Card T={T}>
              <div style={{padding:"10px 14px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:12,fontWeight:700,color:T.txt0,textTransform:"uppercase"}}>📒 История наработки</div>
                <div style={{fontSize:11,color:T.txt2}}>{log.length} записей</div>
              </div>
              {log.length === 0 ? (
                <div style={{padding:"20px 14px",textAlign:"center",fontSize:12,color:T.txt2}}>
                  Наработка пока не накапливалась<br/>
                  <span style={{fontSize:11,opacity:0.7}}>Увеличивается при утверждении отчётов нач. участка</span>
                </div>
              ) : (
                <div style={{maxHeight:240,overflowY:"auto"}}>
                  {[...log].reverse().map((entry,i)=>(
                    <div key={entry.id} style={{
                      display:"flex",justifyContent:"space-between",alignItems:"center",
                      padding:"8px 14px",
                      borderBottom:i<log.length-1?`1px solid ${T.border}`:"none",
                      background:i%2?T.rowAlt:"transparent",
                    }}>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:T.txt0}}>{entry.date}</div>
                        <div style={{fontSize:11,color:T.txt2}}>{entry.by}</div>
                      </div>
                      <div style={{fontSize:16,fontWeight:700,color:T.green,fontFamily:"'Oswald',sans-serif"}}>
                        +{entry.wh} мч
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ── GRID VIEW (list of assets) ─────────────────────────────────────────────
  return (
    <div>
      {/* Delete confirm modal */}
      {deleteConfId && (
        <div style={{position:"fixed",inset:0,background:T.modalBg,zIndex:800,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:T.bg2,border:"1px solid rgba(239,68,68,0.4)",borderRadius:8,maxWidth:360,width:"100%",padding:28,textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:12}}>⚠️</div>
            <div style={{fontSize:15,fontWeight:700,color:T.txt0,fontFamily:"'Oswald',sans-serif",marginBottom:8}}>УДАЛИТЬ АКТИВ?</div>
            <div style={{fontSize:13,color:T.txt2,marginBottom:20}}>Это действие нельзя отменить.</div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <Btn variant="primary" style={{background:"linear-gradient(135deg,#dc2626,#991b1b)"}} onClick={confirmDeleteAsset} T={T}>Удалить</Btn>
              <Btn variant="ghost" onClick={()=>setDeleteConfId(null)} T={T}>Отмена</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Asset form modal */}
      {assetModal && (
        <div style={{position:"fixed",inset:0,background:T.modalBg,zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:8,width:"100%",maxWidth:440}}>
            <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:T.bg3}}>
              <div style={{fontSize:14,fontWeight:700,color:T.txt0,fontFamily:"'Oswald',sans-serif"}}>{assetModal==="add"?"+ ДОБАВИТЬ АКТИВ":"✏ РЕДАКТИРОВАТЬ АКТИВ"}</div>
              <button onClick={()=>{setAssetModal(null);setErr("");}} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:T.txt2}}>×</button>
            </div>
            <div style={{padding:16,display:"flex",flexDirection:"column",gap:12}}>
              <FieldInput label="Название" value={assetForm.name} onChange={e=>setAssetForm(p=>({...p,name:e.target.value}))} T={T}/>
              <FieldSelect label="Категория" value={assetForm.category} onChange={e=>setAssetForm(p=>({...p,category:e.target.value}))} T={T}>
                {cats.map(c=><option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
              </FieldSelect>
              <FieldSelect label="Объект" value={assetForm.assigned_object_id} onChange={e=>setAssetForm(p=>({...p,assigned_object_id:e.target.value}))} T={T}>
                <option value="">— Не назначен —</option>
                {objs.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
              </FieldSelect>
              <FieldInput label="Примечание" value={assetForm.note} onChange={e=>setAssetForm(p=>({...p,note:e.target.value}))} T={T}/>
              {err && <div style={{fontSize:12,color:"#f87171"}}>⚠ {err}</div>}
              <div style={{display:"flex",gap:8}}>
                <Btn variant="success" style={{flex:1}} onClick={saveAsset} T={T}>✓ Сохранить</Btn>
                <Btn variant="ghost" onClick={()=>{setAssetModal(null);setErr("");}} T={T}>Отмена</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category modal */}
      {catModal && (
        <div style={{position:"fixed",inset:0,background:T.modalBg,zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:8,width:"100%",maxWidth:420}}>
            <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:T.bg3}}>
              <div style={{fontSize:14,fontWeight:700,color:T.txt0,fontFamily:"'Oswald',sans-serif"}}>{catModal==="add"?"+ КАТЕГОРИЯ":"✏ КАТЕГОРИЯ"}</div>
              <button onClick={()=>{setCatModal(null);setErr("");}} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:T.txt2}}>×</button>
            </div>
            <div style={{padding:16,display:"flex",flexDirection:"column",gap:12}}>
              {catModal==="add" && <FieldInput label="Ключ (DRILL_RIG, MIXER…)" value={catForm.key} onChange={e=>setCatForm(p=>({...p,key:e.target.value}))} T={T}/>}
              <FieldInput label="Название" value={catForm.label} onChange={e=>setCatForm(p=>({...p,label:e.target.value}))} T={T}/>
              <div style={{display:"flex",gap:10}}>
                <FieldInput label="Иконка (emoji)" value={catForm.icon} onChange={e=>setCatForm(p=>({...p,icon:e.target.value}))} T={T} style={{flex:1}}/>
                <FieldInput label="Цвет (#hex)" value={catForm.color} onChange={e=>setCatForm(p=>({...p,color:e.target.value}))} T={T} style={{flex:1}}/>
                <div style={{width:40,height:40,borderRadius:8,background:catForm.color,border:`1px solid ${T.border}`,alignSelf:"flex-end",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{catForm.icon}</div>
              </div>
              {err && <div style={{fontSize:12,color:"#f87171"}}>⚠ {err}</div>}
              <div style={{display:"flex",gap:8}}>
                <Btn variant="success" style={{flex:1}} onClick={saveCat} T={T}>✓ Сохранить</Btn>
                <Btn variant="ghost" onClick={()=>{setCatModal(null);setErr("");}} T={T}>Отмена</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
        <SectionTitle label="Активы" sub="РЕЕСТР ТЕХНИКИ" T={T}/>
        <div style={{display:"flex",gap:8}}>
          <Btn variant="ghost" onClick={openAddCat} T={T} style={{fontSize:12}}>+ Категория</Btn>
          <Btn variant="primary" onClick={openAddAsset} T={T} style={{fontSize:12}}>+ Актив</Btn>
        </div>
      </div>

      {/* Category cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8,marginBottom:20}}>
        <div onClick={()=>setSelCat(null)} style={{
          padding:"14px 16px",borderRadius:7,cursor:"pointer",
          background:!selCat?`${T.red}15`:T.bg2,
          border:`2px solid ${!selCat?T.red:T.border}`,
          borderTop:`4px solid ${!selCat?T.red:T.border}`,transition:"all 0.15s",
        }}>
          <div style={{fontSize:22,marginBottom:4}}>📋</div>
          <div style={{fontSize:12,fontWeight:700,color:!selCat?T.red:T.txt0}}>Все активы</div>
          <div style={{fontSize:22,fontWeight:900,color:!selCat?T.red:T.txt1,fontFamily:"'Oswald',sans-serif",lineHeight:1,marginTop:4}}>{assets.length}</div>
        </div>
        {cats.map(cat=>{
          const cnt = assets.filter(a=>a.category===cat.key).length;
          const isActive = selCat===cat.key;
          return(
            <div key={cat.key} style={{
              padding:"14px 16px",borderRadius:7,cursor:"pointer",position:"relative",
              background:isActive?`${cat.color}15`:T.bg2,
              border:`2px solid ${isActive?cat.color:T.border}`,
              borderTop:`4px solid ${cat.color}`,transition:"all 0.15s",
            }} onClick={()=>setSelCat(isActive?null:cat.key)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{fontSize:22}}>{cat.icon}</div>
                <div style={{display:"flex",gap:2}}>
                  <button onClick={e=>{e.stopPropagation();openEditCat(cat);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,color:T.txt2,padding:"2px 3px"}}>✏</button>
                  <button onClick={e=>{e.stopPropagation();deleteCat(cat.key);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,color:"#ef4444",padding:"2px 3px"}}>🗑</button>
                </div>
              </div>
              <div style={{fontSize:11,fontWeight:700,color:isActive?cat.color:T.txt0,marginTop:4,lineHeight:1.3}}>{cat.label}</div>
              <div style={{fontSize:24,fontWeight:900,color:cat.color,fontFamily:"'Oswald',sans-serif",lineHeight:1,marginTop:4}}>{cnt}</div>
            </div>
          );
        })}
      </div>

      {/* Assets header row */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:700,color:T.txt0,textTransform:"uppercase",fontFamily:"'Oswald',sans-serif"}}>
          {activeCat?<span>{activeCat.icon} {activeCat.label}</span>:"Все активы"}
          <span style={{fontSize:12,color:T.txt2,fontFamily:"'Rajdhani',sans-serif",fontWeight:400,marginLeft:8}}>({catAssets.length})</span>
        </div>
        <div style={{fontSize:11,color:T.txt2}}>Нажмите на карточку для просмотра паспорта</div>
      </div>

      {catAssets.length === 0 ? (
        <Card style={{padding:32,textAlign:"center"}} T={T}>
          <div style={{fontSize:32,marginBottom:12}}>🏗</div>
          <div style={{fontSize:13,color:T.txt2}}>Нет активов{selCat?" в этой категории":""}</div>
          <Btn variant="primary" onClick={openAddAsset} T={T} style={{marginTop:14,fontSize:12}}>+ Добавить актив</Btn>
        </Card>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>
          {catAssets.map(a=>{
            const cat    = cats.find(c=>c.key===a.category)||{icon:"📦",color:T.txt2,label:"Другое"};
            const obj    = objs.find(o=>o.id===Number(a.assigned_object_id));
            const pp     = passports[a.id]||{};
            const mh     = pp.moto_hours||0;
            const hs     = mh>=20000?{c:"#ef4444",l:"Кап"}: mh>=15000?{c:T.amber,l:"ТО-3"}: mh>=10000?{c:"#f59e0b",l:"ТО-2"}: mh>=5000?{c:T.green,l:"ТО-1"}:{c:T.cyan,l:"Новое"};
            return(
              <div key={a.id}
                onClick={()=>setDetailNode(a)}
                style={{borderRadius:8,overflow:"hidden",border:`1px solid ${T.border}`,
                  background:T.bg2,boxShadow:`0 2px 8px ${T.cardSh}`,cursor:"pointer",transition:"all 0.15s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=cat.color;e.currentTarget.style.transform="translateY(-2px)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="none";}}>
                <div style={{height:4,background:`linear-gradient(90deg,${cat.color},${cat.color}80)`}}/>
                <div style={{padding:"12px 14px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:36,height:36,borderRadius:8,background:`${cat.color}20`,border:`1px solid ${cat.color}40`,
                        display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{cat.icon}</div>
                      <div>
                        <div style={{fontSize:14,fontWeight:700,color:T.txt0,fontFamily:"'Oswald',sans-serif"}}>{a.name}</div>
                        <div style={{fontSize:11,color:cat.color,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em"}}>{cat.label}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:2}} onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>openEditAsset(a)} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:4,cursor:"pointer",fontSize:11,color:T.txt2,padding:"3px 7px"}}>✏</button>
                      <button onClick={()=>setDeleteConfId(a.id)} style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:4,cursor:"pointer",fontSize:11,color:"#f87171",padding:"3px 7px"}}>🗑</button>
                    </div>
                  </div>

                  {/* Specs row */}
                  {(pp.manufacturer||pp.model||pp.year) && (
                    <div style={{fontSize:11,color:T.txt2,marginBottom:8}}>
                      {[pp.manufacturer,pp.model,pp.year&&`${pp.year}г`].filter(Boolean).join(" · ")}
                    </div>
                  )}

                  {/* Moto hours + status */}
                  {mh > 0 && (
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <div style={{flex:1,height:5,background:T.border,borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${Math.min(100,Math.round(mh/20000*100))}%`,background:hs.c,borderRadius:3}}/>
                      </div>
                      <div style={{fontSize:12,fontWeight:700,color:hs.c,fontFamily:"'Oswald',sans-serif",whiteSpace:"nowrap"}}>
                        {mh.toLocaleString()} мч
                      </div>
                      <div style={{fontSize:10,padding:"2px 6px",borderRadius:3,background:`${hs.c}18`,border:`1px solid ${hs.c}40`,color:hs.c,fontWeight:700}}>{hs.l}</div>
                    </div>
                  )}

                  {/* Object */}
                  <div style={{padding:"6px 10px",borderRadius:5,
                    background:obj?`${T.cyan}12`:`${T.border}20`,border:`1px solid ${obj?T.cyan+"40":T.border}`}}>
                    {obj
                      ?<div style={{fontSize:12,fontWeight:700,color:T.cyan}}>📍 {obj.name}</div>
                      :<div style={{fontSize:12,color:T.txt2,fontStyle:"italic"}}>Не назначен на объект</div>
                    }
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
// Default categories (editable at runtime via assetCategories state in App)


// ─── MECHANIC KTG CALENDAR PAGE ───────────────────────────────────────────────
function MechanicKTGPage({ nodes, objs, mechCats, passports, ktgPlans, setKtgPlans, user, T }) {
  const cats = mechCats || DEFAULT_MECH_CATS;
  const today = new Date().toISOString().slice(0,10);
  const [selObjId,   setSelObjId]   = useState(objs[0]?.id || null);
  const [yearMonth,  setYearMonth]  = useState(today.slice(0,7));
  const [toast,      setToast]      = useState(null);
  // For quick-assign: selected status to "paint" with
  const [paintStatus, setPaintStatus] = useState("READY");

  function showToast(msg, type="ok") {
    setToast({msg,type}); setTimeout(()=>setToast(null),3000);
  }

  const objAssets = nodes.filter(n =>
    n.type === "ASSET" && Number(n.assigned_object_id) === Number(selObjId)
  );
  const plan = ktgPlans.find(p => p.object_id===selObjId && p.year_month===yearMonth);
  const planStatus = plan?.status || "DRAFT";
  const isLocked = planStatus==="SUBMITTED" || planStatus==="ACCEPTED";

  const [yr, mo] = yearMonth.split("-").map(Number);
  const daysInMonth = new Date(yr, mo, 0).getDate();
  const days = Array.from({length:daysInMonth},(_,i)=>`${yearMonth}-${String(i+1).padStart(2,"0")}`);

  function getStatus(assetId, date) {
    return plan?.items?.[assetId]?.[date] || "NONE";
  }
  function setStatus(assetId, date, status) {
    if (isLocked) return;
    setKtgPlans(prev => {
      const existing = prev.find(p=>p.object_id===selObjId&&p.year_month===yearMonth);
      if (existing) {
        return prev.map(p=>p.object_id===selObjId&&p.year_month===yearMonth
          ? {...p, items:{...p.items,[assetId]:{...(p.items[assetId]||{}),[date]:status}}}
          : p);
      }
      return [...prev,{
        id:"kp"+genId(), object_id:selObjId, year_month:yearMonth,
        status:"DRAFT", created_by:user.name, engineer_comment:"", submitted_at:null, decided_at:null,
        items:{[assetId]:{[date]:status}}
      }];
    });
  }

  // Fill entire row with paintStatus
  function fillRow(assetId) {
    if (isLocked) return;
    days.forEach(d => setStatus(assetId, d, paintStatus));
  }
  // Fill entire column (day) with paintStatus
  function fillCol(date) {
    if (isLocked) return;
    objAssets.forEach(a => setStatus(a.id, date, paintStatus));
  }
  // Fill all cells
  function fillAll() {
    if (isLocked) return;
    objAssets.forEach(a => days.forEach(d => setStatus(a.id, d, paintStatus)));
  }

  function ktgForDay(date) {
    if (!plan||objAssets.length===0) return null;
    const ready = objAssets.filter(a=>getStatus(a.id,date)==="READY").length;
    return Math.round(ready/objAssets.length*100);
  }
  const avgKtg = (() => {
    const vals = days.map(d=>ktgForDay(d)).filter(v=>v!==null);
    return vals.length ? Math.round(vals.reduce((s,v)=>s+v,0)/vals.length) : null;
  })();

  function saveDraft() {
    if (!plan) {
      setKtgPlans(prev=>[...prev,{
        id:"kp"+genId(),object_id:selObjId,year_month:yearMonth,
        status:"DRAFT",created_by:user.name,engineer_comment:"",submitted_at:null,decided_at:null,items:{}
      }]);
    }
    showToast("✓ Черновик сохранён");
  }
  function submitPlan() {
    if (objAssets.length===0){showToast("Нет техники на объекте","err");return;}
    if (!plan){showToast("Сначала заполните план","err");return;}
    setKtgPlans(prev=>prev.map(p=>p.object_id===selObjId&&p.year_month===yearMonth
      ?{...p,status:"SUBMITTED",submitted_at:new Date().toISOString()}:p));
    showToast("✓ КТГ-план отправлен инженеру!");
  }

  const MON_RU=["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  const monthLabel=`${MON_RU[mo-1]} ${yr}`;
  const stepLabels={DRAFT:"Черновик",SUBMITTED:"На проверке",ACCEPTED:"Принят",RETURNED:"Возвращён"};

  return (
    <div>
      {toast&&(
        <div style={{position:"fixed",top:70,right:24,zIndex:900,padding:"12px 20px",borderRadius:6,
          background:toast.type==="err"?"rgba(239,68,68,0.95)":"rgba(16,185,129,0.95)",
          color:"#fff",fontSize:13,fontWeight:700,boxShadow:"0 4px 20px rgba(0,0,0,0.3)",animation:"fadeUp 0.2s ease"}}>
          {toast.msg}
        </div>
      )}

      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
        <div style={{background:T.green,color:"#fff",padding:"4px 12px",borderRadius:3,fontSize:12,fontWeight:700,textTransform:"uppercase"}}>МЕХАНИК — КТГ</div>
        <div style={{fontSize:12,color:T.txt2}}>Планирование готовности техники по объекту</div>
      </div>

      {/* Status pipeline */}
      <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:18,padding:"8px 14px",background:T.bg2,borderRadius:6,border:`1px solid ${T.border}`,flexWrap:"wrap"}}>
        {["DRAFT","SUBMITTED","ACCEPTED","RETURNED"].map((s,i)=>{
          const isCur=planStatus===s; const cfg=KTG_PLAN_STATUS[s];
          return(
            <div key={s} style={{display:"flex",alignItems:"center",gap:4}}>
              {i>0&&<span style={{color:T.txt2,fontSize:11}}>→</span>}
              <span style={{padding:"3px 10px",borderRadius:3,fontSize:12,fontWeight:700,
                background:isCur?cfg.bg:"transparent",border:`1px solid ${isCur?cfg.border:T.border}`,
                color:isCur?cfg.color:T.txt2}}>{stepLabels[s]}</span>
            </div>
          );
        })}
        <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
          {plan&&<KTGPlanBadge status={planStatus}/>}
        </div>
      </div>

      {/* Controls row */}
      <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap",alignItems:"flex-end"}}>
        <FieldSelect label="Объект" value={selObjId||""} onChange={e=>setSelObjId(Number(e.target.value))} T={T} style={{minWidth:160}}>
          {objs.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
        </FieldSelect>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          <label style={{fontSize:12,fontWeight:600,color:T.txt2,textTransform:"uppercase",letterSpacing:".08em"}}>Месяц</label>
          <input type="month" value={yearMonth} onChange={e=>setYearMonth(e.target.value)} disabled={isLocked}
            style={{padding:"9px 12px",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:4,color:T.txt0,fontSize:13,fontFamily:"'Rajdhani',sans-serif",outline:"none"}}/>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"flex-end"}}>
          {!isLocked&&<>
            <Btn variant="secondary" onClick={saveDraft} T={T} style={{fontSize:12}}>💾 Сохранить</Btn>
            <Btn variant="primary" onClick={submitPlan} T={T} style={{fontSize:12}}>📤 Отправить →</Btn>
          </>}
        </div>
      </div>

      {/* Returned comment */}
      {planStatus==="RETURNED"&&plan?.engineer_comment&&(
        <div style={{marginBottom:14,padding:"12px 16px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:6}}>
          <div style={{fontSize:12,fontWeight:700,color:"#f87171",marginBottom:4}}>↩ Возвращён инженером:</div>
          <div style={{fontSize:13,color:T.txt1,marginBottom:10}}>{plan.engineer_comment}</div>
          <Btn variant="secondary" onClick={()=>setKtgPlans(prev=>prev.map(p=>p.id===plan.id?{...p,status:"DRAFT",engineer_comment:""}:p))} T={T} style={{fontSize:12}}>✏ Исправить и переотправить</Btn>
        </div>
      )}

      {/* Summary cards */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <Card accent={T.green} style={{padding:"12px 16px",minWidth:140}} T={T}>
          <div style={{fontSize:11,color:T.txt2,textTransform:"uppercase",marginBottom:4}}>⚙ КТГ средний</div>
          <div style={{fontSize:28,fontWeight:700,color:avgKtg>=85?T.green:avgKtg>=70?T.amber:"#ef4444",fontFamily:"'Oswald',sans-serif",lineHeight:1}}>
            {avgKtg!==null?`${avgKtg}%`:"—"}
          </div>
        </Card>
        <Card style={{padding:"12px 16px",minWidth:130}} T={T}>
          <div style={{fontSize:11,color:T.txt2,textTransform:"uppercase",marginBottom:4}}>🏗 Техника</div>
          <div style={{fontSize:28,fontWeight:700,color:T.txt0,fontFamily:"'Oswald',sans-serif",lineHeight:1}}>{objAssets.length}</div>
        </Card>
        <Card style={{padding:"12px 16px",minWidth:130}} T={T}>
          <div style={{fontSize:11,color:T.txt2,textTransform:"uppercase",marginBottom:4}}>📅 Период</div>
          <div style={{fontSize:18,fontWeight:700,color:T.txt0,fontFamily:"'Oswald',sans-serif",lineHeight:1.2}}>{monthLabel}</div>
        </Card>
      </div>

      {/* Quick-assign panel */}
      {!isLocked&&(
        <div style={{marginBottom:14,padding:"12px 16px",background:T.bg2,borderRadius:6,border:`1px solid ${T.border}`}}>
          <div style={{fontSize:12,fontWeight:700,color:T.txt2,textTransform:"uppercase",marginBottom:10}}>⚡ Быстрое заполнение</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            <div style={{fontSize:12,color:T.txt2,marginRight:4}}>Режим кисти:</div>
            {Object.entries(KTG_DAY_STATUS).filter(([k])=>k!=="NONE").map(([k,v])=>(
              <button key={k} onClick={()=>setPaintStatus(k)}
                style={{padding:"6px 12px",borderRadius:5,cursor:"pointer",fontSize:12,fontWeight:700,
                  background:paintStatus===k?v.bg:"transparent",
                  border:`2px solid ${paintStatus===k?v.color:T.border}`,
                  color:paintStatus===k?v.color:T.txt2,
                  fontFamily:"'Rajdhani',sans-serif",transition:"all 0.1s"}}>
                {v.icon} {v.label}
              </button>
            ))}
            <button onClick={()=>setPaintStatus("NONE")}
              style={{padding:"6px 12px",borderRadius:5,cursor:"pointer",fontSize:12,fontWeight:700,
                background:paintStatus==="NONE"?"rgba(90,116,153,0.15)":"transparent",
                border:`2px solid ${paintStatus==="NONE"?"#5a7499":T.border}`,
                color:paintStatus==="NONE"?"#9db3d4":T.txt2,fontFamily:"'Rajdhani',sans-serif"}}>
              ✕ Очистить
            </button>
            <div style={{width:1,height:28,background:T.border,margin:"0 4px"}}/>
            <button onClick={fillAll}
              style={{padding:"6px 14px",borderRadius:5,cursor:"pointer",fontSize:12,fontWeight:700,
                background:`${T.violet}15`,border:`1px solid ${T.violet}40`,color:T.violet,
                fontFamily:"'Rajdhani',sans-serif"}}>
              ⚡ Заполнить всё
            </button>
          </div>
          <div style={{fontSize:11,color:T.txt2,marginTop:8}}>
            Нажмите на ячейку — установит выбранный статус. Стрелка у строки/столбца — заполняет всю строку/столбец.
          </div>
        </div>
      )}

      {objAssets.length===0?(
        <Card style={{padding:32,textAlign:"center"}} T={T}>
          <div style={{fontSize:32,marginBottom:12}}>⚙</div>
          <div style={{fontSize:14,color:T.txt2}}>Нет техники на объекте <b style={{color:T.txt0}}>{objs.find(o=>o.id===selObjId)?.name}</b></div>
          <div style={{fontSize:12,color:T.txt2,marginTop:6}}>Назначьте активы в разделе «Активы»</div>
        </Card>
      ):(
        <Card T={T} style={{overflowX:"auto"}}>
          {/* Legend */}
          <div style={{padding:"10px 14px",borderBottom:`1px solid ${T.border}`,display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
            {Object.entries(KTG_DAY_STATUS).filter(([k])=>k!=="NONE").map(([k,v])=>(
              <span key={k} style={{display:"flex",alignItems:"center",gap:4,fontSize:12}}>
                <span style={{padding:"2px 7px",background:v.bg,border:`1px solid ${v.color}50`,borderRadius:3,color:v.color,fontWeight:700}}>
                  {v.icon} {v.label}
                </span>
              </span>
            ))}
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:Math.max(700,daysInMonth*36+200)}}>
              <thead>
                <tr style={{background:T.bg3}}>
                  <th style={{padding:"8px 12px",textAlign:"left",fontSize:11,fontWeight:700,color:T.txt2,
                    textTransform:"uppercase",borderBottom:`1px solid ${T.border}`,minWidth:150,
                    position:"sticky",left:0,background:T.bg3,zIndex:2}}>
                    Актив
                  </th>
                  {days.map(d=>{
                    const dayNum=parseInt(d.slice(8),10);
                    const dow=new Date(d).getDay();
                    const isWe=dow===0||dow===6;
                    const ktgV=ktgForDay(d);
                    return(
                      <th key={d} style={{padding:"2px 1px",textAlign:"center",fontSize:10,borderBottom:`1px solid ${T.border}`,minWidth:34,background:T.bg3}}>
                        <div style={{
                          color:isWe?T.amber:T.txt2,fontWeight:700,fontSize:11,
                          cursor:isLocked?"default":"pointer",padding:"2px 0",
                          borderRadius:3,
                        }} onClick={()=>fillCol(d)} title={isLocked?"":"Заполнить весь столбец"}>
                          {dayNum}
                        </div>
                        {ktgV!==null&&(
                          <div style={{fontSize:9,fontWeight:700,color:ktgV>=85?T.green:ktgV>=70?T.amber:"#ef4444"}}>
                            {ktgV}%
                          </div>
                        )}
                      </th>
                    );
                  })}
                  <th style={{padding:"8px 8px",textAlign:"center",fontSize:11,fontWeight:700,color:T.green,
                    borderBottom:`1px solid ${T.border}`,minWidth:56,whiteSpace:"nowrap"}}>КТГ</th>
                </tr>
              </thead>
              <tbody>
                {objAssets.map((asset,ai)=>{
                  const cat=cats.find(c=>{const pp=passports?.[asset.id]; return pp&&pp.assetClass===c.key;})||{color:T.txt2};
                  const readyDays=days.filter(d=>getStatus(asset.id,d)==="READY").length;
                  const assetKtg=Math.round(readyDays/daysInMonth*100);
                  return(
                    <tr key={asset.id} style={{background:ai%2?T.rowAlt:"transparent"}}>
                      <td style={{padding:"5px 12px",fontWeight:700,color:T.txt0,fontSize:12,
                        position:"sticky",left:0,background:ai%2?T.rowAlt:T.bg2,zIndex:1,
                        borderRight:`1px solid ${T.border}`,cursor:isLocked?"default":"pointer"}}
                        onClick={()=>fillRow(asset.id)}
                        title={isLocked?"":"Заполнить всю строку"}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div style={{width:4,height:28,borderRadius:2,background:T.red,flexShrink:0}}/>
                          {asset.name}
                          {!isLocked&&<span style={{fontSize:9,color:T.txt2,marginLeft:"auto"}}>→</span>}
                        </div>
                      </td>
                      {days.map(d=>{
                        const st=getStatus(asset.id,d);
                        const cfg=KTG_DAY_STATUS[st]||KTG_DAY_STATUS.NONE;
                        return(
                          <td key={d} style={{padding:"2px 1px",textAlign:"center"}}>
                            <div
                              onClick={()=>!isLocked&&setStatus(asset.id,d,paintStatus)}
                              title={cfg.label}
                              style={{
                                width:30,height:28,borderRadius:4,margin:"0 auto",
                                background:cfg.bg,
                                border:`1px solid ${st==="NONE"?T.border:cfg.color+"60"}`,
                                display:"flex",alignItems:"center",justifyContent:"center",
                                fontSize:13,cursor:isLocked?"default":"pointer",
                                transition:"all 0.08s",
                              }}>
                              {st!=="NONE"?cfg.icon:<span style={{fontSize:8,color:T.txt2}}>·</span>}
                            </div>
                          </td>
                        );
                      })}
                      <td style={{padding:"5px 8px",textAlign:"center",fontWeight:700,fontSize:14,
                        color:assetKtg>=85?T.green:assetKtg>=70?T.amber:"#ef4444",
                        fontFamily:"'Oswald',sans-serif"}}>
                        {assetKtg}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── ENGINEER KTG INBOX ───────────────────────────────────────────────────────
function EngineerKTGInbox({ ktgPlans, setKtgPlans, objs, nodes, T }) {
  const [selPlan,    setSelPlan]    = useState(null);
  const [comment,    setComment]    = useState("");
  const [commentErr, setCommentErr] = useState("");

  const submitted = ktgPlans.filter(p=>p.status==="SUBMITTED");
  const decided   = ktgPlans.filter(p=>p.status==="ACCEPTED"||p.status==="RETURNED");

  const MON_RU=["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  function monthLabel(ym){const[y,m]=ym.split("-");return `${MON_RU[parseInt(m,10)-1]} ${y}`;}

  function accept(plan){
    setKtgPlans(prev=>prev.map(p=>p.id===plan.id?{...p,status:"ACCEPTED",decided_at:new Date().toISOString()}:p));
    setSelPlan(null);
  }
  function returnPlan(plan){
    if(!comment.trim()){setCommentErr("Укажите причину возврата");return;}
    setKtgPlans(prev=>prev.map(p=>p.id===plan.id?{...p,status:"RETURNED",engineer_comment:comment.trim(),decided_at:new Date().toISOString()}:p));
    setSelPlan(null);setComment("");setCommentErr("");
  }

  function planAvgKtg(plan){
    if(!plan.items)return null;
    const[y,m]=plan.year_month.split("-").map(Number);
    const dim=new Date(y,m,0).getDate();
    const days=Array.from({length:dim},(_,i)=>`${plan.year_month}-${String(i+1).padStart(2,"0")}`);
    const assetIds=Object.keys(plan.items);
    if(!assetIds.length)return null;
    const dayKtgs=days.map(d=>{
      const ready=assetIds.filter(aid=>plan.items[aid]?.[d]==="READY").length;
      return Math.round(ready/assetIds.length*100);
    });
    return Math.round(dayKtgs.reduce((s,v)=>s+v,0)/dayKtgs.length);
  }

  function KTGCalendarView({plan,T}){
    const[y,m]=plan.year_month.split("-").map(Number);
    const dim=new Date(y,m,0).getDate();
    const days=Array.from({length:dim},(_,i)=>`${plan.year_month}-${String(i+1).padStart(2,"0")}`);
    const assetIds=Object.keys(plan.items||{});
    if(!assetIds.length)return<div style={{padding:16,color:T.txt2,fontSize:12}}>Нет данных по активам</div>;
    return(
      <div style={{overflowX:"auto",marginTop:12}}>
        <table style={{borderCollapse:"collapse",width:"100%"}}>
          <thead>
            <tr style={{background:T.bg3}}>
              <th style={{padding:"6px 12px",fontSize:11,color:T.txt2,textAlign:"left",borderBottom:`1px solid ${T.border}`,minWidth:90,position:"sticky",left:0,background:T.bg3,zIndex:2}}>Актив</th>
              {days.map(d=>{
                const dayNum=parseInt(d.slice(8),10);
                const ktgV=assetIds.length?Math.round(assetIds.filter(aid=>(plan.items[aid]||{})[d]==="READY").length/assetIds.length*100):null;
                return(
                  <th key={d} style={{padding:"2px 1px",fontSize:9,color:T.txt2,textAlign:"center",borderBottom:`1px solid ${T.border}`,minWidth:28,background:T.bg3}}>
                    <div style={{fontWeight:700}}>{dayNum}</div>
                    {ktgV!==null&&<div style={{fontSize:8,color:ktgV>=85?T.green:ktgV>=70?T.amber:"#ef4444"}}>{ktgV}%</div>}
                  </th>
                );
              })}
              <th style={{padding:"6px 8px",fontSize:11,color:T.green,textAlign:"center",borderBottom:`1px solid ${T.border}`,minWidth:50}}>КТГ</th>
            </tr>
          </thead>
          <tbody>
            {assetIds.map((aid,ai)=>{
              const assetNode=nodes.find(n=>n.id===aid);
              const readyDays=days.filter(d=>(plan.items[aid]||{})[d]==="READY").length;
              const ktg=Math.round(readyDays/dim*100);
              return(
                <tr key={aid} style={{background:ai%2?T.rowAlt:"transparent"}}>
                  <td style={{padding:"4px 12px",fontSize:11,fontWeight:700,color:T.txt0,position:"sticky",left:0,background:ai%2?T.rowAlt:T.bg2,zIndex:1}}>{assetNode?.name||aid}</td>
                  {days.map(d=>{
                    const st=(plan.items[aid]||{})[d]||"NONE";
                    const cfg=KTG_DAY_STATUS[st]||KTG_DAY_STATUS.NONE;
                    return(
                      <td key={d} style={{padding:"1px",textAlign:"center"}}>
                        <div style={{width:24,height:22,borderRadius:3,margin:"0 auto",background:cfg.bg,
                          border:`1px solid ${st==="NONE"?T.border:cfg.color+"50"}`,
                          display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>
                          {st!=="NONE"?cfg.icon:"·"}
                        </div>
                      </td>
                    );
                  })}
                  <td style={{padding:"4px 8px",textAlign:"center",fontWeight:700,fontSize:13,
                    color:ktg>=85?T.green:ktg>=70?T.amber:"#ef4444",fontFamily:"'Oswald',sans-serif"}}>
                    {ktg}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if(submitted.length===0&&decided.length===0){
    return(
      <Card style={{padding:"24px 20px",textAlign:"center",border:`2px dashed ${T.border}`,marginBottom:0}} T={T}>
        <div style={{fontSize:32,marginBottom:10}}>📭</div>
        <div style={{fontSize:13,color:T.txt2}}>Нет КТГ-планов от механика</div>
        <div style={{fontSize:12,color:T.txt2,marginTop:4}}>Когда механик отправит план, он появится здесь</div>
      </Card>
    );
  }

  return(
    <div>
      {/* Review modal */}
      {selPlan&&(
        <div style={{position:"fixed",inset:0,background:T.modalBg,zIndex:600,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:20,overflowY:"auto"}}>
          <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderLeft:`3px solid ${T.violet}`,borderRadius:8,width:"100%",maxWidth:960,marginTop:10,marginBottom:40}}>
            <div style={{padding:"14px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:T.bg3,position:"sticky",top:0,zIndex:10}}>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:T.txt0,fontFamily:"'Oswald',sans-serif"}}>
                  КТГ-ПЛАН · {objs.find(o=>o.id===selPlan.object_id)?.name?.toUpperCase()} · {monthLabel(selPlan.year_month)}
                </div>
                <div style={{fontSize:12,color:T.txt2,marginTop:2}}>От: {selPlan.created_by} · Отправлен: {selPlan.submitted_at?.slice(0,10)||"—"}</div>
              </div>
              <button onClick={()=>{setSelPlan(null);setComment("");setCommentErr("");}} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:T.txt2}}>×</button>
            </div>
            <div style={{padding:20}}>
              {/* KTG avg block */}
              {(()=>{
                const avg=planAvgKtg(selPlan);
                return avg!==null&&(
                  <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
                    <div style={{padding:"14px 20px",background:avg>=85?`${T.green}12`:`rgba(245,158,11,0.1)`,borderRadius:6,border:`1px solid ${avg>=85?T.green+"30":"rgba(245,158,11,0.3)"}`}}>
                      <div style={{fontSize:12,color:T.txt2,textTransform:"uppercase",marginBottom:4}}>Средний КТГ плана</div>
                      <div style={{fontSize:32,fontWeight:700,color:avg>=85?T.green:avg>=70?T.amber:"#ef4444",fontFamily:"'Oswald',sans-serif",lineHeight:1}}>{avg}%</div>
                      <div style={{fontSize:12,color:T.txt2,marginTop:4}}>💡 Рекомендуется как целевой КТГ для плана производства</div>
                    </div>
                  </div>
                );
              })()}
              <KTGCalendarView plan={selPlan} T={T}/>
              {/* Return comment */}
              <div style={{marginTop:20,padding:"14px 16px",background:T.bg3,borderRadius:6,border:`1px solid ${T.border}`}}>
                <div style={{fontSize:13,fontWeight:700,color:T.txt0,marginBottom:8}}>💬 Комментарий при возврате (обязателен)</div>
                <textarea value={comment} onChange={e=>setComment(e.target.value)} rows={3}
                  placeholder="Укажите что нужно исправить..."
                  style={{width:"100%",padding:"9px 12px",background:T.inputBg,border:`1px solid ${commentErr?T.red:T.border}`,
                    borderRadius:4,color:T.txt0,fontSize:13,resize:"vertical",fontFamily:"'Rajdhani',sans-serif",outline:"none"}}/>
                {commentErr&&<div style={{fontSize:12,color:"#f87171",marginTop:4}}>⚠ {commentErr}</div>}
              </div>
              <div style={{display:"flex",gap:10,marginTop:16}}>
                <Btn variant="success" style={{flex:1,padding:"12px"}} onClick={()=>accept(selPlan)} T={T}>✓ ПРИНЯТЬ КТГ-ПЛАН</Btn>
                <Btn variant="danger" style={{flex:1,padding:"12px"}} onClick={()=>returnPlan(selPlan)} T={T}>↩ ВЕРНУТЬ НА ДОРАБОТКУ</Btn>
                <Btn variant="ghost" style={{padding:"12px 16px"}} onClick={()=>{setSelPlan(null);setComment("");setCommentErr("");}} T={T}>Отмена</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submitted */}
      {submitted.length>0&&(
        <div style={{marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <div style={{fontSize:12,fontWeight:700,color:T.txt0,textTransform:"uppercase"}}>На проверке</div>
            <span style={{background:T.red,color:"#fff",borderRadius:10,padding:"2px 8px",fontSize:12,fontWeight:700}}>{submitted.length}</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {submitted.map(plan=>{
              const obj=objs.find(o=>o.id===plan.object_id);
              const avg=planAvgKtg(plan);
              return(
                <div key={plan.id} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",
                  background:T.bg2,border:`1px solid ${T.border}`,borderLeft:`4px solid ${T.blue}`,borderRadius:6,flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:140}}>
                    <div style={{fontSize:14,fontWeight:700,color:T.txt0,fontFamily:"'Oswald',sans-serif"}}>{obj?.name||"—"}</div>
                    <div style={{fontSize:12,color:T.txt2}}>{monthLabel(plan.year_month)} · от {plan.created_by}</div>
                  </div>
                  {avg!==null&&(
                    <div style={{textAlign:"center",padding:"8px 14px",background:`${avg>=85?T.green:"#f59e0b"}12`,borderRadius:5,border:`1px solid ${avg>=85?T.green+"30":"rgba(245,158,11,0.3)"}`}}>
                      <div style={{fontSize:22,fontWeight:700,color:avg>=85?T.green:T.amber,fontFamily:"'Oswald',sans-serif",lineHeight:1}}>{avg}%</div>
                      <div style={{fontSize:10,color:T.txt2,marginTop:2}}>КТГ план</div>
                    </div>
                  )}
                  <KTGPlanBadge status={plan.status}/>
                  <Btn variant="secondary" onClick={()=>{setSelPlan(plan);setComment("");setCommentErr("");}} T={T} style={{fontSize:12,padding:"7px 16px"}}>🔍 Просмотр и решение</Btn>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History */}
      {decided.length>0&&(
        <div>
          <div style={{fontSize:12,fontWeight:700,color:T.txt2,textTransform:"uppercase",marginBottom:8}}>История ({decided.length})</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {decided.map(plan=>{
              const obj=objs.find(o=>o.id===plan.object_id);
              const avg=planAvgKtg(plan);
              return(
                <div key={plan.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",
                  background:T.bg2,border:`1px solid ${T.border}`,borderRadius:6,opacity:0.75,flexWrap:"wrap"}}>
                  <div style={{flex:1}}>
                    <span style={{fontSize:13,fontWeight:700,color:T.txt0}}>{obj?.name||"—"}</span>
                    <span style={{fontSize:12,color:T.txt2,marginLeft:8}}>{monthLabel(plan.year_month)}</span>
                    {plan.engineer_comment&&<div style={{fontSize:11,color:"#f87171",marginTop:2}}>↩ {plan.engineer_comment}</div>}
                  </div>
                  {avg!==null&&<span style={{fontSize:14,fontWeight:700,color:T.txt2,fontFamily:"'Oswald',sans-serif"}}>{avg}% КТГ</span>}
                  <KTGPlanBadge status={plan.status}/>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [isDark, setIsDark] = useState(true);
  const T = isDark ? DARK : LIGHT;

  const [user,    setUser]    = useState(null);
  const [subPage, setSubPage] = useState("dash");
  const [view,    setView]    = useState({ type: "dash" }); // type: dash | obj | rig

  const [objs,       setObjs]       = useState(INIT_OBJS);
  const [rigs,       setRigs]       = useState(INIT_RIGS);
  const [users,      setUsers]      = useState(INIT_USERS);
  const [reps,       setReps]       = useState(INIT_REPS);
  const [plans,      setPlans]      = useState(INIT_PLANS);
  const [nodes,        setNodes]        = useState(INIT_NODES);
  const [assetClasses,  setAssetClasses]  = useState(ASSET_CLASS_CFG_DEFAULT);
  const [locations,     setLocations]     = useState(INIT_LOCATIONS);
  const [movements14,   setMovements14]   = useState(INIT_MOVEMENTS);
  const [curLocations,  setCurLocations]  = useState(INIT_CUR_LOCATIONS);
  const [lifecycle,     setLifecycle]     = useState(INIT_LIFECYCLE);
  const [warranties,   setWarranties]   = useState(INIT_WARRANTIES);
  const [wProviders,   setWProviders]   = useState(INIT_W_PROVIDERS);
  const [ktgPlans,     setKtgPlans]     = useState([]);
  const [mechCats,     setMechCats]     = useState(DEFAULT_MECH_CATS);
  const [passports,    setPassports]    = useState(INIT_PASSPORTS);
  const [meters,       setMeters]       = useState(INIT_METERS);
  const [points,       setPoints]       = useState(INIT_POINTS);
  const [measurements, setMeasurements] = useState(INIT_MEASUREMENTS);
  const [properties,   setProperties]   = useState(INIT_PROPERTIES);

  const pending = reps.filter((r) => r.status === "submitted").length + ktgPlans.filter(p=>p.status==="SUBMITTED").length;

  function goPage(p) { setSubPage(p); setView({ type: "dash" }); }
  function goDash()  { setSubPage("dash"); setView({ type: "dash" }); }

  function handleLogin(u) { setUser(u); setSubPage("dash"); setView({ type: "dash" }); }
  function handleLogout()  { setUser(null); setSubPage("dash"); setView({ type: "dash" }); }
  function handleApprove(id, edited) {
    setReps((prev) => prev.map((r) => r.id === id ? { ...edited, id, status: "approved" } : r));
    // Increment moto_hours for each rig that has wh > 0
    if (edited.rigs && edited.rigs.length > 0) {
      setPassports(prev => {
        const updated = { ...prev };
        edited.rigs.forEach(rig => {
          const wh = parseFloat(rig.wh) || 0;
          if (wh <= 0) return;
          // Find matching node by name
          const matchNode = nodes.find(n => n.type === "ASSET" && n.name === rig.n);
          if (!matchNode) return;
          const existing = updated[matchNode.id] || {};
          updated[matchNode.id] = {
            ...existing,
            moto_hours: (existing.moto_hours || 0) + wh,
            moto_hours_log: [
              ...((existing.moto_hours_log) || []),
              { id: genId(), wh, date: edited.date, by: edited.by, rep_id: id },
            ],
          };
        });
        return updated;
      });
    }
  }

  const navCEO  = [["dash","Dashboard"],["finance","Финансы"],["engineers","Инженеры"]];
  const navEng  = [["dash","Dashboard"],["planning","Планирование"],["inbox","Входящие"],["users","Персонал"]];
  const navFor  = [["dash","Dashboard"],["enter","Ввод данных"]];
  const navMech = [["assets","Активы"],["ktgplan","КТГ"]];
  const nav     = !user ? [] : user.role === "ceo" ? navCEO : user.role === "engineer" ? navEng : user.role === "mechanic" ? navMech : navFor;

  const vObjs = !user ? objs : user.role === "foreman" ? objs.filter((o) => user.oids === "all" || user.oids.includes(o.id)) : objs;
  const vReps = !user ? reps : user.role === "foreman" ? reps.filter((r) => user.oids === "all" || user.oids.includes(r.oid)) : reps;

  const css = [
    "@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Oswald:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');",
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}",
    `body{background:${T.bg0};color:${T.txt0};font-family:'Rajdhani',sans-serif;}`,
    `::-webkit-scrollbar{width:4px;height:4px;}`,
    `::-webkit-scrollbar-track{background:${T.bg1};}`,
    `::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px;}`,
    `input,select,textarea{font-family:'Rajdhani',sans-serif;}`,
    `input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}`,
    `input[type=number]{-moz-appearance:textfield;}`,
    `select option{background:${T.bg2};color:${T.txt0};}`,
    `@keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}`,
  ].join("\n");

  // Render logic — NO early returns before this
  let content = null;
  if (!user) {
    content = <Login users={users} onLogin={handleLogin} T={T} />;
  } else if (subPage === "dash" && view.type === "rig") {
    content = (
      <RigDetail
        rigId={view.rigId} objId={view.objId}
        objs={objs} rigs={rigs} reps={reps}
        onBack={goDash}
        onBackToObj={() => setView({ type: "obj", objId: view.objId })}
        T={T}
      />
    );
  } else if (subPage === "dash" && view.type === "obj") {
    content = (
      <ObjDetail
        objId={view.objId}
        objs={objs} rigs={rigs} reps={reps}
        onDrillRig={(rigId) => setView({ type: "rig", rigId, objId: view.objId })}
        onBack={goDash}
        T={T}
      />
    );
  } else if (subPage === "dash") {
    content = user.role === "foreman"
      ? <ForemanDash objs={vObjs} rigs={rigs} reps={vReps} T={T} />
      : <Dashboard objs={objs} rigs={rigs} reps={reps} plans={plans} onDrillObj={(id) => setView({ type: "obj", objId: id })} T={T} />;
  } else if (subPage === "enter") {
    content = <ForemanForm user={user} objs={vObjs} rigs={rigs} onSubmit={(r) => setReps((p) => [...p, r])} T={T} />;
  } else if (subPage === "planning") {
    content = <PlanningPage objs={objs} plans={plans} setPlans={setPlans} ktgPlans={ktgPlans} setKtgPlans={setKtgPlans} nodes={nodes} T={T} />;
  } else if (subPage === "inbox") {
    content = <EngineerInbox reps={reps} objs={objs} rigs={rigs} onApprove={handleApprove} ktgPlans={ktgPlans} setKtgPlans={setKtgPlans} nodes={nodes} T={T} />;
  } else if (subPage === "objects") {
    content = <ObjectsEditor objs={objs} setObjs={setObjs} rigs={rigs} setRigs={setRigs} T={T} />;
  } else if (subPage === "users") {
    content = <UsersEditor users={users} setUsers={setUsers} objs={objs} T={T} />;
  } else if (subPage === "engineers") {
    content = <EngineerAssign users={users} setUsers={setUsers} T={T} />;
  } else if (subPage === "finance") {
    content = <FinancePage T={T} />;
  } else if (subPage === "ktgplan" && user.role === "mechanic") {
    content = <MechanicKTGPage nodes={nodes} objs={objs} mechCats={mechCats} passports={passports} ktgPlans={ktgPlans} setKtgPlans={setKtgPlans} user={user} T={T} />;
  } else if (subPage === "assets" && user.role === "mechanic") {
    content = <MechanicAssetsPage nodes={nodes} setNodes={setNodes} objs={objs} reps={reps} assetClasses={assetClasses} mechCats={mechCats} setMechCats={setMechCats} passports={passports} setPassports={setPassports} user={user} T={T} />;
  } else if (user.role === "mechanic") {
    content = <MechanicAssetsPage nodes={nodes} setNodes={setNodes} objs={objs} reps={reps} assetClasses={assetClasses} mechCats={mechCats} setMechCats={setMechCats} passports={passports} setPassports={setPassports} user={user} T={T} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg0, fontFamily: "'Rajdhani',sans-serif", color: T.txt0, display: "flex", flexDirection: "column" }}>
      <style>{css}</style>
      {!user ? content : (
        <>
          <Topbar user={user} nav={nav} page={subPage} onNav={goPage} onOut={handleLogout} onUpdateUser={(u) => { setUser(u); setUsers(prev => prev.map(x => x.id === u.id ? u : x)); }} pending={pending} isDark={isDark} toggleTheme={() => setIsDark((d) => !d)} T={T} />
          <div style={{ flex: 1, padding: 24, maxWidth: 1440, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
            {content}
          </div>
          <div style={{ borderTop: `1px solid ${T.border}`, padding: "8px 24px", background: T.bg1, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: T.txt2, textTransform: "uppercase" }}>ExSo Drill & Blast Control · v10.0</span>
            <span style={{ fontSize: 12, color: T.txt2, textTransform: "uppercase" }}>© 2025 ExSo Explosion Solutions</span>
          </div>
        </>
      )}
    </div>
  );
}
