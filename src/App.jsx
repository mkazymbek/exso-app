import { useState, useMemo, useEffect } from "react";
import supabase, { getObjects, getRigs, getReports, getPlans, getKtgPlans, submitReport as apiSubmitReport, approveReport as apiApproveReport, deleteReport as apiDeleteReport, updateReport as apiUpdateReport, login as supabaseLogin, savePlanToDB, saveKtgPlanToDB, updateKtgPlanStatus, adminCreateUser, adminUpdatePassword, adminDeleteUser, adminListUsers } from "./api.js";

// ─── THEMES ───────────────────────────────────────────────────────────────────
const DARK = {
  bg0: "#16181d", bg1: "#1e2128", bg2: "#242830", bg3: "#2c3040",
  border: "#343846", borderHi: "#4a5268",
  red: "#d93040", redDim: "#a82030",
  amber: "#d48818", green: "#12a068", blue: "#2d7de0",
  violet: "#7050e0", cyan: "#0898c0",
  txt0: "#e2e4ec", txt1: "#818ea8", txt2: "#4e5870",
  rowAlt: "rgba(255,255,255,0.025)", rowHdr: "rgba(0,0,0,0.2)",
  inputBg: "#1e2128", inputBgFocus: "#242830",
  cardSh: "rgba(0,0,0,0.3)", modalBg: "rgba(3,4,10,0.88)",
};
const LIGHT = {
  bg0: "#eceef2", bg1: "#f5f6f8", bg2: "#ffffff", bg3: "#f5f6f9",
  border: "#dde0e8", borderHi: "#b8bfcc",
  red: "#b81c28", redDim: "#8f1520",
  amber: "#b86c08", green: "#0a7a4e", blue: "#1558b8",
  violet: "#4828a8", cyan: "#056080",
  txt0: "#0f1623", txt1: "#3c4554", txt2: "#707a90",
  rowAlt: "rgba(0,0,0,0.02)", rowHdr: "rgba(0,0,0,0.045)",
  inputBg: "#ffffff", inputBgFocus: "#f8f9fb",
  cardSh: "rgba(0,0,0,0.07)", modalBg: "rgba(5,8,20,0.7)",
};

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────
const INIT_OBJS = [
  { id: 4, name: "Жолымбет",   dp: 0, bp: 0, kp: 0 },  // Пилотный объект
  { id: 1, name: "Борлы",      dp: 0, bp: 0, kp: 0 },
  { id: 2, name: "Коскудук",   dp: 0, bp: 0, kp: 0 },
  { id: 3, name: "Бактай",     dp: 0, bp: 0, kp: 0 },
  { id: 5, name: "Шыганак",    dp: 0, bp: 0, kp: 0 },
  { id: 6, name: "Сарыопан",   dp: 0, bp: 0, kp: 0 },
  { id: 7, name: "Улькенсай",  dp: 0, bp: 0, kp: 0 },
];
const INIT_RIGS = [
  // Борлы (o:1)
  { id:  3, n: "ROC-107",  o: 1 },
  { id:  4, n: "ROC-108",  o: 1 },
  // Коскудук (o:2) — порядок как в файле: 109, 110, 111, 115, 117
  { id:  9, n: "JK-109",   o: 2 },
  { id:  5, n: "JK-110",   o: 2 },
  { id:  6, n: "JK-111",   o: 2 },
  { id:  8, n: "JK-115",   o: 2 },
  { id: 20, n: "JK-117",   o: 2 },
  // Бактай (o:3) — порядок как в файле: 112, 113, 114, 115, 116, 118, 106, 122, 123
  { id: 10, n: "JK-112",   o: 3 },
  { id: 11, n: "JK-113",   o: 3 },
  { id: 12, n: "JK-114",   o: 3 },
  { id: 13, n: "JK-115",   o: 3 },
  { id: 14, n: "JK-116",   o: 3 },
  { id: 23, n: "JK-118",   o: 3 },
  { id: 19, n: "JK-106",   o: 3 },
  { id: 24, n: "JK-122",   o: 3 },
  { id: 25, n: "JK-123",   o: 3 },
  // Жолымбет (o:4) — 119, 120, 121
  { id: 16, n: "JK-119",   o: 4 },
  { id: 17, n: "JK-120",   o: 4 },
  { id: 18, n: "JK-121",   o: 4 },
];
const INIT_USERS = [
  { id: 1,  name: "Жукенов Е.С.",   login: "ceo",      pw: "ceo123",   role: "ceo",      oids: "all", ini: "ЖЕ" },
  { id: 2,  name: "Иванов Н.С.",    login: "engineer", pw: "eng123",   role: "engineer", oids: "all", ini: "ИН" },
  { id: 5,  name: "Жанабеков К.А.", login: "zhanab",   pw: "foreman3", role: "foreman",  oids: [4],   ini: "ЖК" },  // Жолымбет
  { id: 3,  name: "Сейткали Е.Б.",  login: "seitkali", pw: "foreman1", role: "foreman",  oids: [1],   ini: "СЕ" },  // Борлы
  { id: 4,  name: "Момбеков Т.Р.",  login: "mombekov", pw: "foreman2", role: "foreman",  oids: [2],   ini: "МТ" },  // Коскудук
  { id: 7,  name: "Нач. участка",   login: "foreman4", pw: "foreman4", role: "foreman",  oids: [3],   ini: "НУ" },  // Бактай
  { id: 8,  name: "Нач. участка",   login: "foreman5", pw: "foreman5", role: "foreman",  oids: [5],   ini: "НУ" },  // Шыганак
  { id: 9,  name: "Нач. участка",   login: "foreman6", pw: "foreman6", role: "foreman",  oids: [6],   ini: "НУ" },  // Сарыопан
  { id: 10, name: "Нач. участка",   login: "foreman7", pw: "foreman7", role: "foreman",  oids: [7],   ini: "НУ" },  // Улькенсай
  { id: 6,  name: "Асанов Б.М.",    login: "mechanic", pw: "mech123",  role: "mechanic", oids: "all", ini: "АБ" },
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

const INIT_REPS = [
  {id:10000,oid:1,date:"2026-03-01",sh:"day",status:"approved",by:"seitkali",submittedAt:"2026-03-01T08:00:00",approvedAt:"2026-03-01T09:00:00",comment:"",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:0,overDrill:0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[],rigEntries:[]},
  {id:10001,oid:1,date:"2026-03-01",sh:"night",status:"approved",by:"seitkali",submittedAt:"2026-03-01T08:00:00",approvedAt:"2026-03-01T09:00:00",comment:"",fuel:0,fuel_kg:0,df:0,bf:0,wh:7.0,dh:4.0,overDrill:51.0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:0,bf:0,wh:7.0,dh:4.0,fuel:0,dt:"",overDrill:51.0,downtime:4.0,operator:"Черенков В"}],downtime_events:[{reason:"Простой",hours:4.0}],rigEntries:[]},
  {id:10002,oid:1,date:"2026-03-02",sh:"day",status:"approved",by:"seitkali",submittedAt:"2026-03-02T08:00:00",approvedAt:"2026-03-02T09:00:00",comment:"",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:0,overDrill:0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[],rigEntries:[]},
  {id:10003,oid:1,date:"2026-03-02",sh:"night",status:"approved",by:"seitkali",submittedAt:"2026-03-02T08:00:00",approvedAt:"2026-03-02T09:00:00",comment:"",fuel:480,fuel_kg:0,df:0,bf:0,wh:11,dh:0,overDrill:123.0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:0,bf:0,wh:11,dh:0,fuel:480,dt:"",overDrill:123.0,downtime:0,operator:"Черенков В"}],downtime_events:[],rigEntries:[]},
  {id:10004,oid:1,date:"2026-03-03",sh:"day",status:"approved",by:"seitkali",submittedAt:"2026-03-03T08:00:00",approvedAt:"2026-03-03T09:00:00",comment:"",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:0,overDrill:0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[],rigEntries:[]},
  {id:10005,oid:1,date:"2026-03-03",sh:"night",status:"approved",by:"seitkali",submittedAt:"2026-03-03T08:00:00",approvedAt:"2026-03-03T09:00:00",comment:"Замена стартера, генератора",fuel:550,fuel_kg:0,df:0,bf:0,wh:7.0,dh:4.0,overDrill:165.0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:0,bf:0,wh:7.0,dh:4.0,fuel:550,dt:"Замена стартера, генератора",overDrill:165.0,downtime:4.0,operator:"Черенков В"}],downtime_events:[{reason:"Замена стартера, генератора",hours:4.0}],rigEntries:[]},
  {id:10006,oid:1,date:"2026-03-04",sh:"day",status:"approved",by:"seitkali",submittedAt:"2026-03-04T08:00:00",approvedAt:"2026-03-04T09:00:00",comment:"",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:0,overDrill:70.0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:70.0,downtime:0,operator:"Толеухан А"}],downtime_events:[],rigEntries:[]},
  {id:10007,oid:1,date:"2026-03-04",sh:"night",status:"approved",by:"seitkali",submittedAt:"2026-03-04T08:00:00",approvedAt:"2026-03-04T09:00:00",comment:"",fuel:388,fuel_kg:0,df:0,bf:0,wh:11,dh:0,overDrill:65.0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:0,bf:0,wh:11,dh:0,fuel:388,dt:"",overDrill:65.0,downtime:0,operator:"Черенков В"}],downtime_events:[],rigEntries:[]},
  {id:10008,oid:1,date:"2026-03-05",sh:"day",status:"approved",by:"seitkali",submittedAt:"2026-03-05T08:00:00",approvedAt:"2026-03-05T09:00:00",comment:"",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:0,overDrill:98.0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:98.0,downtime:0,operator:"Толеухан А"}],downtime_events:[],rigEntries:[]},
  {id:10009,oid:1,date:"2026-03-05",sh:"night",status:"approved",by:"seitkali",submittedAt:"2026-03-05T08:00:00",approvedAt:"2026-03-05T09:00:00",comment:"",fuel:451,fuel_kg:0,df:0,bf:0,wh:11,dh:0,overDrill:70.0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:0,bf:0,wh:11,dh:0,fuel:451,dt:"",overDrill:70.0,downtime:0,operator:"Черенков В"}],downtime_events:[],rigEntries:[]},
  {id:10010,oid:1,date:"2026-03-06",sh:"day",status:"approved",by:"seitkali",submittedAt:"2026-03-06T08:00:00",approvedAt:"2026-03-06T09:00:00",comment:"",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:0,overDrill:46.0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:46.0,downtime:0,operator:"Толеухан А"}],downtime_events:[],rigEntries:[]},
  {id:10011,oid:1,date:"2026-03-06",sh:"night",status:"approved",by:"seitkali",submittedAt:"2026-03-06T08:00:00",approvedAt:"2026-03-06T09:00:00",comment:"",fuel:395,fuel_kg:0,df:86.4,bf:0,wh:11,dh:0,overDrill:0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:86.4,bf:0,wh:11,dh:0,fuel:395,dt:"",overDrill:0,downtime:0,operator:"Черенков В"}],downtime_events:[],rigEntries:[]},
  {id:10012,oid:1,date:"2026-03-07",sh:"day",status:"approved",by:"seitkali",submittedAt:"2026-03-07T08:00:00",approvedAt:"2026-03-07T09:00:00",comment:"",fuel:0,fuel_kg:0,df:271.9,bf:0,wh:11,dh:0,overDrill:0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:271.9,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Толеухан А"}],downtime_events:[],rigEntries:[]},
  {id:10013,oid:1,date:"2026-03-07",sh:"night",status:"approved",by:"seitkali",submittedAt:"2026-03-07T08:00:00",approvedAt:"2026-03-07T09:00:00",comment:"",fuel:611,fuel_kg:0,df:206.8,bf:0,wh:11,dh:0,overDrill:0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:206.8,bf:0,wh:11,dh:0,fuel:611,dt:"",overDrill:0,downtime:0,operator:"Черенков В"}],downtime_events:[],rigEntries:[]},
  {id:10014,oid:1,date:"2026-03-08",sh:"day",status:"approved",by:"seitkali",submittedAt:"2026-03-08T08:00:00",approvedAt:"2026-03-08T09:00:00",comment:"",fuel:0,fuel_kg:0,df:276.2,bf:0,wh:11,dh:0,overDrill:0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:276.2,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Толеухан А"}],downtime_events:[],rigEntries:[]},
  {id:10015,oid:1,date:"2026-03-08",sh:"night",status:"approved",by:"seitkali",submittedAt:"2026-03-08T08:00:00",approvedAt:"2026-03-08T09:00:00",comment:"",fuel:627,fuel_kg:0,df:275.3,bf:0,wh:11,dh:0,overDrill:0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:275.3,bf:0,wh:11,dh:0,fuel:627,dt:"",overDrill:0,downtime:0,operator:"Черенков В"}],downtime_events:[],rigEntries:[]},
  {id:10016,oid:1,date:"2026-03-09",sh:"day",status:"approved",by:"seitkali",submittedAt:"2026-03-09T08:00:00",approvedAt:"2026-03-09T09:00:00",comment:"",fuel:0,fuel_kg:0,df:211.8,bf:0,wh:11,dh:0,overDrill:0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:211.8,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Толеухан А"}],downtime_events:[],rigEntries:[]},
  {id:10017,oid:1,date:"2026-03-09",sh:"night",status:"approved",by:"seitkali",submittedAt:"2026-03-09T08:00:00",approvedAt:"2026-03-09T09:00:00",comment:"",fuel:327,fuel_kg:0,df:90.0,bf:0,wh:11,dh:0,overDrill:0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:90.0,bf:0,wh:11,dh:0,fuel:327,dt:"",overDrill:0,downtime:0,operator:"Черенков В"}],downtime_events:[],rigEntries:[]},
  {id:10018,oid:1,date:"2026-03-10",sh:"day",status:"approved",by:"seitkali",submittedAt:"2026-03-10T08:00:00",approvedAt:"2026-03-10T09:00:00",comment:"",fuel:0,fuel_kg:0,df:284.6,bf:0,wh:11,dh:0,overDrill:0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:284.6,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Толеухан А"}],downtime_events:[],rigEntries:[]},
  {id:10019,oid:1,date:"2026-03-10",sh:"night",status:"approved",by:"seitkali",submittedAt:"2026-03-10T08:00:00",approvedAt:"2026-03-10T09:00:00",comment:"ОФР",fuel:0,fuel_kg:0,df:119.7,bf:0,wh:8.0,dh:3.0,overDrill:0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:119.7,bf:0,wh:8.0,dh:3.0,fuel:0,dt:"ОФР",overDrill:0,downtime:3.0,operator:"Черенков В"}],downtime_events:[{reason:"ОФР",hours:3.0}],rigEntries:[]},
  {id:10020,oid:1,date:"2026-03-11",sh:"day",status:"approved",by:"seitkali",submittedAt:"2026-03-11T08:00:00",approvedAt:"2026-03-11T09:00:00",comment:"ОФР",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:11.0,overDrill:0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Толеухан А"}],downtime_events:[{reason:"ОФР",hours:11.0}],rigEntries:[]},
  {id:10021,oid:1,date:"2026-03-11",sh:"night",status:"approved",by:"seitkali",submittedAt:"2026-03-11T08:00:00",approvedAt:"2026-03-11T09:00:00",comment:"ОФР. Перегон",fuel:339,fuel_kg:0,df:22.8,bf:0,wh:6.0,dh:5.0,overDrill:0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:22.8,bf:0,wh:6.0,dh:5.0,fuel:339,dt:"ОФР. Перегон",overDrill:0,downtime:5.0,operator:"Черенков В"}],downtime_events:[{reason:"ОФР. Перегон",hours:5.0}],rigEntries:[]},
  {id:10022,oid:1,date:"2026-03-12",sh:"day",status:"approved",by:"seitkali",submittedAt:"2026-03-12T08:00:00",approvedAt:"2026-03-12T09:00:00",comment:"",fuel:0,fuel_kg:0,df:162.2,bf:0,wh:11,dh:0,overDrill:0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:162.2,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Толеухан А"}],downtime_events:[],rigEntries:[]},
  {id:10023,oid:1,date:"2026-03-12",sh:"night",status:"approved",by:"seitkali",submittedAt:"2026-03-12T08:00:00",approvedAt:"2026-03-12T09:00:00",comment:"ТО станка, компрессора",fuel:507,fuel_kg:0,df:176.7,bf:0,wh:7.0,dh:4.0,overDrill:0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:176.7,bf:0,wh:7.0,dh:4.0,fuel:507,dt:"ТО станка, компрессора",overDrill:0,downtime:4.0,operator:"Черенков В"}],downtime_events:[{reason:"ТО станка, компрессора",hours:4.0}],rigEntries:[]},
  {id:10024,oid:1,date:"2026-03-13",sh:"day",status:"approved",by:"seitkali",submittedAt:"2026-03-13T08:00:00",approvedAt:"2026-03-13T09:00:00",comment:"",fuel:0,fuel_kg:0,df:223.8,bf:0,wh:11,dh:0,overDrill:0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:223.8,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Толеухан А"}],downtime_events:[],rigEntries:[]},
  {id:10025,oid:1,date:"2026-03-13",sh:"night",status:"approved",by:"seitkali",submittedAt:"2026-03-13T08:00:00",approvedAt:"2026-03-13T09:00:00",comment:"",fuel:520,fuel_kg:0,df:214.0,bf:0,wh:9.0,dh:2.0,overDrill:0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:214.0,bf:0,wh:9.0,dh:2.0,fuel:520,dt:"",overDrill:0,downtime:2.0,operator:"Черенков В"}],downtime_events:[{reason:"Простой",hours:2.0}],rigEntries:[]},
  {id:10026,oid:1,date:"2026-03-14",sh:"day",status:"approved",by:"seitkali",submittedAt:"2026-03-14T08:00:00",approvedAt:"2026-03-14T09:00:00",comment:"",fuel:0,fuel_kg:0,df:247.3,bf:0,wh:11,dh:0,overDrill:0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:247.3,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Толеухан А"}],downtime_events:[],rigEntries:[]},
  {id:10027,oid:1,date:"2026-03-14",sh:"night",status:"approved",by:"seitkali",submittedAt:"2026-03-14T08:00:00",approvedAt:"2026-03-14T09:00:00",comment:"",fuel:593,fuel_kg:0,df:291.5,bf:0,wh:11,dh:0,overDrill:0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:291.5,bf:0,wh:11,dh:0,fuel:593,dt:"",overDrill:0,downtime:0,operator:"Черенков В"}],downtime_events:[],rigEntries:[]},
  {id:10028,oid:1,date:"2026-03-15",sh:"day",status:"approved",by:"seitkali",submittedAt:"2026-03-15T08:00:00",approvedAt:"2026-03-15T09:00:00",comment:"ОФР",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:11.0,overDrill:0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Толеухан А"}],downtime_events:[{reason:"ОФР",hours:11.0}],rigEntries:[]},
  {id:10029,oid:1,date:"2026-03-15",sh:"night",status:"approved",by:"seitkali",submittedAt:"2026-03-15T08:00:00",approvedAt:"2026-03-15T09:00:00",comment:"ОФР",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:11.0,overDrill:0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Толеухан А"}],downtime_events:[{reason:"ОФР",hours:11.0}],rigEntries:[]},
  {id:10030,oid:1,date:"2026-03-16",sh:"day",status:"approved",by:"seitkali",submittedAt:"2026-03-16T08:00:00",approvedAt:"2026-03-16T09:00:00",comment:"ОФР",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:11.0,overDrill:0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:""}],downtime_events:[{reason:"ОФР",hours:11.0}],rigEntries:[]},
  {id:10031,oid:1,date:"2026-03-16",sh:"night",status:"approved",by:"seitkali",submittedAt:"2026-03-16T08:00:00",approvedAt:"2026-03-16T09:00:00",comment:"ОФР",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:11.0,overDrill:0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:""}],downtime_events:[{reason:"ОФР",hours:11.0}],rigEntries:[]},
  {id:10032,oid:1,date:"2026-03-17",sh:"day",status:"approved",by:"seitkali",submittedAt:"2026-03-17T08:00:00",approvedAt:"2026-03-17T09:00:00",comment:"",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:0,overDrill:0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[],rigEntries:[]},
  {id:10033,oid:1,date:"2026-03-17",sh:"night",status:"approved",by:"seitkali",submittedAt:"2026-03-17T08:00:00",approvedAt:"2026-03-17T09:00:00",comment:"Замерз шланг РВД",fuel:167,fuel_kg:0,df:21.8,bf:0,wh:7.0,dh:4.0,overDrill:0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:21.8,bf:0,wh:7.0,dh:4.0,fuel:167,dt:"Замерз шланг РВД",overDrill:0,downtime:4.0,operator:"Назарбек Ж"}],downtime_events:[{reason:"Замерз шланг РВД",hours:4.0}],rigEntries:[]},
  {id:10034,oid:1,date:"2026-03-18",sh:"day",status:"approved",by:"seitkali",submittedAt:"2026-03-18T08:00:00",approvedAt:"2026-03-18T09:00:00",comment:"Отсутствие МБУ",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:11.0,overDrill:0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"Отсутствие МБУ",overDrill:0,downtime:11.0,operator:""}],downtime_events:[{reason:"Отсутствие МБУ",hours:11.0}],rigEntries:[]},
  {id:10035,oid:1,date:"2026-03-18",sh:"night",status:"approved",by:"seitkali",submittedAt:"2026-03-18T08:00:00",approvedAt:"2026-03-18T09:00:00",comment:"",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:0,overDrill:0,rigs:[{id:3,n:"ROC-107",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:4,n:"ROC-108",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[],rigEntries:[]},
  {id:12000,oid:2,date:"2026-03-01",sh:"day",status:"approved",by:"mombekov",submittedAt:"2026-03-01T08:00:00",approvedAt:"2026-03-01T09:00:00",comment:"ОФР",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:55.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Нестеренко В"},{id:5,n:"JK-110",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Есенжулов А"},{id:6,n:"JK-111",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Дустаев А"},{id:8,n:"JK-115",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Базарбаев А"},{id:20,n:"JK-117",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Елисеев Ю"}],downtime_events:[{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0}],rigEntries:[]},
  {id:12001,oid:2,date:"2026-03-01",sh:"night",status:"approved",by:"mombekov",submittedAt:"2026-03-01T08:00:00",approvedAt:"2026-03-01T09:00:00",comment:"ОФР; ОФР. Ремонт мачты",fuel:462,fuel_kg:0,df:0,bf:0,wh:0,dh:55.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:0,bf:0,wh:0,dh:11.0,fuel:100,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Жариков И."},{id:5,n:"JK-110",df:0,bf:0,wh:0,dh:11.0,fuel:62,dt:"ОФР. Ремонт мачты",overDrill:0,downtime:11.0,operator:"Бектазим К"},{id:6,n:"JK-111",df:0,bf:0,wh:0,dh:11.0,fuel:100,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Сагындыков Ж"},{id:8,n:"JK-115",df:0,bf:0,wh:0,dh:11.0,fuel:100,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Толеутаев А"},{id:20,n:"JK-117",df:0,bf:0,wh:0,dh:11.0,fuel:100,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Ертис Х"}],downtime_events:[{reason:"ОФР",hours:11.0},{reason:"ОФР. Ремонт мачты",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0}],rigEntries:[]},
  {id:12002,oid:2,date:"2026-03-02",sh:"day",status:"approved",by:"mombekov",submittedAt:"2026-03-02T08:00:00",approvedAt:"2026-03-02T09:00:00",comment:"ОФР",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:55.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Нестеренко В"},{id:5,n:"JK-110",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Есенжулов А"},{id:6,n:"JK-111",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Дустаев А"},{id:8,n:"JK-115",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Базарбаев А"},{id:20,n:"JK-117",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Елисеев Ю"}],downtime_events:[{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0}],rigEntries:[]},
  {id:12003,oid:2,date:"2026-03-02",sh:"night",status:"approved",by:"mombekov",submittedAt:"2026-03-02T08:00:00",approvedAt:"2026-03-02T09:00:00",comment:"ОФР; ОФР. Перегон",fuel:460,fuel_kg:0,df:128.2,bf:0,wh:7.0,dh:48.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:128.2,bf:0,wh:7.0,dh:4.0,fuel:460,dt:"ОФР. Перегон",overDrill:0,downtime:4.0,operator:"Жариков И."},{id:5,n:"JK-110",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Бектазим К"},{id:6,n:"JK-111",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Сагындыков Ж"},{id:8,n:"JK-115",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Толеутаев А"},{id:20,n:"JK-117",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Ертис Х"}],downtime_events:[{reason:"ОФР. Перегон",hours:4.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0}],rigEntries:[]},
  {id:12004,oid:2,date:"2026-03-03",sh:"day",status:"approved",by:"mombekov",submittedAt:"2026-03-03T08:00:00",approvedAt:"2026-03-03T09:00:00",comment:"Перегон; ОФР",fuel:0,fuel_kg:0,df:315.8,bf:0,wh:20.0,dh:35.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:160.2,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Нестеренко В"},{id:5,n:"JK-110",df:155.6,bf:0,wh:9.0,dh:2.0,fuel:0,dt:"Перегон",overDrill:0,downtime:2.0,operator:"Есенжулов А"},{id:6,n:"JK-111",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Дустаев А"},{id:8,n:"JK-115",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Базарбаев А"},{id:20,n:"JK-117",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Елисеев Ю"}],downtime_events:[{reason:"Перегон",hours:2.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0}],rigEntries:[]},
  {id:12005,oid:2,date:"2026-03-03",sh:"night",status:"approved",by:"mombekov",submittedAt:"2026-03-03T08:00:00",approvedAt:"2026-03-03T09:00:00",comment:"ОФР; Перегон. ОФР; Прегон. ОФР",fuel:460,fuel_kg:0,df:112.8,bf:0,wh:12.0,dh:43.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:79.3,bf:0,wh:6.0,dh:5.0,fuel:230,dt:"Перегон. ОФР",overDrill:0,downtime:5.0,operator:"Жариков И."},{id:5,n:"JK-110",df:33.5,bf:0,wh:6.0,dh:5.0,fuel:230,dt:"Прегон. ОФР",overDrill:0,downtime:5.0,operator:"Бектазим К"},{id:6,n:"JK-111",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Сагындыков Ж"},{id:8,n:"JK-115",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Толеутаев А"},{id:20,n:"JK-117",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Ертис Х"}],downtime_events:[{reason:"Перегон. ОФР",hours:5.0},{reason:"Прегон. ОФР",hours:5.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0}],rigEntries:[]},
  {id:12006,oid:2,date:"2026-03-04",sh:"day",status:"approved",by:"mombekov",submittedAt:"2026-03-04T08:00:00",approvedAt:"2026-03-04T09:00:00",comment:"ОФР",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:55.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Нестеренко В"},{id:5,n:"JK-110",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Есенжулов А"},{id:6,n:"JK-111",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Дустаев А"},{id:8,n:"JK-115",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Базарбаев А"},{id:20,n:"JK-117",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Елисеев Ю"}],downtime_events:[{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0}],rigEntries:[]},
  {id:12007,oid:2,date:"2026-03-04",sh:"night",status:"approved",by:"mombekov",submittedAt:"2026-03-04T08:00:00",approvedAt:"2026-03-04T09:00:00",comment:"ОФР; Сбой моточасов на станке. Перегон. ОФР",fuel:1752,fuel_kg:0,df:151.6,bf:0,wh:23.0,dh:32.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:24.1,bf:0,wh:4.0,dh:7.0,fuel:400,dt:"ОФР",overDrill:0,downtime:7.0,operator:"Жариков И."},{id:5,n:"JK-110",df:10.0,bf:0,wh:4.0,dh:7.0,fuel:400,dt:"Сбой моточасов на станке. Перегон. ОФР",overDrill:0,downtime:7.0,operator:"Бектазим К"},{id:6,n:"JK-111",df:19.0,bf:0,wh:6.0,dh:5.0,fuel:300,dt:"ОФР",overDrill:0,downtime:5.0,operator:"Сагындыков Ж"},{id:8,n:"JK-115",df:37.6,bf:0,wh:4.0,dh:7.0,fuel:302,dt:"ОФР",overDrill:0,downtime:7.0,operator:"Толеутаев А"},{id:20,n:"JK-117",df:60.9,bf:0,wh:5.0,dh:6.0,fuel:350,dt:"ОФР",overDrill:0,downtime:6.0,operator:"Ертис Х"}],downtime_events:[{reason:"ОФР",hours:7.0},{reason:"Сбой моточасов на станке. Перегон. ОФР",hours:7.0},{reason:"ОФР",hours:5.0},{reason:"ОФР",hours:7.0},{reason:"ОФР",hours:6.0}],rigEntries:[]},
  {id:12008,oid:2,date:"2026-03-05",sh:"day",status:"approved",by:"mombekov",submittedAt:"2026-03-05T08:00:00",approvedAt:"2026-03-05T09:00:00",comment:"Перегон",fuel:0,fuel_kg:0,df:972.9,bf:0,wh:54.0,dh:1.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:177.1,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Нестеренко В"},{id:5,n:"JK-110",df:189.1,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Есенжулов А"},{id:6,n:"JK-111",df:204.0,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Дустаев А"},{id:8,n:"JK-115",df:189.5,bf:0,wh:10.0,dh:1.0,fuel:0,dt:"Перегон",overDrill:0,downtime:1.0,operator:"Базарбаев А"},{id:20,n:"JK-117",df:213.2,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Елисеев Ю"}],downtime_events:[{reason:"Перегон",hours:1.0}],rigEntries:[]},
  {id:12009,oid:2,date:"2026-03-05",sh:"night",status:"approved",by:"mombekov",submittedAt:"2026-03-05T08:00:00",approvedAt:"2026-03-05T09:00:00",comment:"Ремонт диффузора на компрессоре; Замена баллона",fuel:1270,fuel_kg:0,df:490.7,bf:0,wh:44.0,dh:11.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:85.0,bf:0,wh:5.0,dh:6.0,fuel:250,dt:"",overDrill:0,downtime:6.0,operator:"Жариков И."},{id:5,n:"JK-110",df:130.8,bf:0,wh:11,dh:0,fuel:300,dt:"",overDrill:0,downtime:0,operator:"Бектазим К"},{id:6,n:"JK-111",df:85.2,bf:0,wh:9.0,dh:2.0,fuel:250,dt:"Ремонт диффузора на компрессоре",overDrill:0,downtime:2.0,operator:"Сагындыков Ж"},{id:8,n:"JK-115",df:99.5,bf:0,wh:11,dh:0,fuel:250,dt:"",overDrill:0,downtime:0,operator:"Толеутаев А"},{id:20,n:"JK-117",df:90.2,bf:0,wh:8.0,dh:3.0,fuel:220,dt:"Замена баллона",overDrill:0,downtime:3.0,operator:"Ертис Х"}],downtime_events:[{reason:"Простой",hours:6.0},{reason:"Ремонт диффузора на компрессоре",hours:2.0},{reason:"Замена баллона",hours:3.0}],rigEntries:[]},
  {id:12010,oid:2,date:"2026-03-06",sh:"day",status:"approved",by:"mombekov",submittedAt:"2026-03-06T08:00:00",approvedAt:"2026-03-06T09:00:00",comment:"Перегон",fuel:0,fuel_kg:0,df:751.1,bf:0,wh:51.0,dh:4.0,overDrill:11.0,rigs:[{id:9,n:"JK-109",df:102.1,bf:0,wh:9.0,dh:2.0,fuel:0,dt:"",overDrill:11.0,downtime:2.0,operator:"Нестеренко В"},{id:5,n:"JK-110",df:181.6,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Есенжулов А"},{id:6,n:"JK-111",df:127.6,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Дустаев А"},{id:8,n:"JK-115",df:164.1,bf:0,wh:10.0,dh:1.0,fuel:0,dt:"Перегон",overDrill:0,downtime:1.0,operator:"Базарбаев А"},{id:20,n:"JK-117",df:175.7,bf:0,wh:10.0,dh:1.0,fuel:0,dt:"Перегон",overDrill:0,downtime:1.0,operator:"Елисеев Ю"}],downtime_events:[{reason:"Простой",hours:2.0},{reason:"Перегон",hours:1.0},{reason:"Перегон",hours:1.0}],rigEntries:[]},
  {id:12011,oid:2,date:"2026-03-06",sh:"night",status:"approved",by:"mombekov",submittedAt:"2026-03-06T08:00:00",approvedAt:"2026-03-06T09:00:00",comment:"Перегон",fuel:2205,fuel_kg:0,df:1123.0,bf:0,wh:44.0,dh:11.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:142.0,bf:0,wh:9.0,dh:2.0,fuel:400,dt:"Перегон",overDrill:0,downtime:2.0,operator:"Жариков И."},{id:5,n:"JK-110",df:191.1,bf:0,wh:6.0,dh:5.0,fuel:405,dt:"Перегон",overDrill:0,downtime:5.0,operator:"Бектазим К"},{id:6,n:"JK-111",df:175.0,bf:0,wh:7.0,dh:4.0,fuel:400,dt:"Перегон",overDrill:0,downtime:4.0,operator:"Сагындыков Ж"},{id:8,n:"JK-115",df:307.9,bf:0,wh:11,dh:0,fuel:500,dt:"",overDrill:0,downtime:0,operator:"Толеутаев А"},{id:20,n:"JK-117",df:307.0,bf:0,wh:11,dh:0,fuel:500,dt:"",overDrill:0,downtime:0,operator:"Ертис Х"}],downtime_events:[{reason:"Перегон",hours:2.0},{reason:"Перегон",hours:5.0},{reason:"Перегон",hours:4.0}],rigEntries:[]},
  {id:12012,oid:2,date:"2026-03-07",sh:"day",status:"approved",by:"mombekov",submittedAt:"2026-03-07T08:00:00",approvedAt:"2026-03-07T09:00:00",comment:"ОФР",fuel:0,fuel_kg:0,df:1417.2,bf:0,wh:49.0,dh:6.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:248.9,bf:0,wh:8.0,dh:3.0,fuel:0,dt:"ОФР",overDrill:0,downtime:3.0,operator:"Нестеренко В"},{id:5,n:"JK-110",df:298.8,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Есенжулов А"},{id:6,n:"JK-111",df:304.9,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Дустаев А"},{id:8,n:"JK-115",df:254.3,bf:0,wh:8.0,dh:3.0,fuel:0,dt:"ОФР",overDrill:0,downtime:3.0,operator:"Базарбаев А"},{id:20,n:"JK-117",df:310.3,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Елисеев Ю"}],downtime_events:[{reason:"ОФР",hours:3.0},{reason:"ОФР",hours:3.0}],rigEntries:[]},
  {id:12013,oid:2,date:"2026-03-07",sh:"night",status:"approved",by:"mombekov",submittedAt:"2026-03-07T08:00:00",approvedAt:"2026-03-07T09:00:00",comment:"Перегон; ОФР",fuel:2355,fuel_kg:0,df:1144.8,bf:0,wh:40.0,dh:15.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:237.7,bf:0,wh:8.0,dh:3.0,fuel:470,dt:"Перегон",overDrill:0,downtime:3.0,operator:"Жариков И."},{id:5,n:"JK-110",df:227.1,bf:0,wh:7.0,dh:4.0,fuel:470,dt:"ОФР",overDrill:0,downtime:4.0,operator:"Бектазим К"},{id:6,n:"JK-111",df:228.7,bf:0,wh:9.0,dh:2.0,fuel:470,dt:"Перегон",overDrill:0,downtime:2.0,operator:"Сагындыков Ж"},{id:8,n:"JK-115",df:250.5,bf:0,wh:8.0,dh:3.0,fuel:470,dt:"Перегон",overDrill:0,downtime:3.0,operator:"Толеутаев А"},{id:20,n:"JK-117",df:200.8,bf:0,wh:8.0,dh:3.0,fuel:475,dt:"Перегон",overDrill:0,downtime:3.0,operator:"Ертис Х"}],downtime_events:[{reason:"Перегон",hours:3.0},{reason:"ОФР",hours:4.0},{reason:"Перегон",hours:2.0},{reason:"Перегон",hours:3.0},{reason:"Перегон",hours:3.0}],rigEntries:[]},
  {id:12014,oid:2,date:"2026-03-08",sh:"day",status:"approved",by:"mombekov",submittedAt:"2026-03-08T08:00:00",approvedAt:"2026-03-08T09:00:00",comment:"ОФР; Перегон",fuel:0,fuel_kg:0,df:875.3,bf:0,wh:40.0,dh:15.0,overDrill:3.0,rigs:[{id:9,n:"JK-109",df:103.8,bf:0,wh:5.0,dh:6.0,fuel:0,dt:"ОФР",overDrill:0,downtime:6.0,operator:"Нестеренко В"},{id:5,n:"JK-110",df:220.9,bf:0,wh:10.0,dh:1.0,fuel:0,dt:"Перегон",overDrill:0,downtime:1.0,operator:"Есенжулов А"},{id:6,n:"JK-111",df:64.5,bf:0,wh:5.0,dh:6.0,fuel:0,dt:"ОФР",overDrill:3.0,downtime:6.0,operator:"Дустаев А"},{id:8,n:"JK-115",df:219.4,bf:0,wh:10.0,dh:1.0,fuel:0,dt:"Перегон",overDrill:0,downtime:1.0,operator:"Базарбаев А"},{id:20,n:"JK-117",df:266.7,bf:0,wh:10.0,dh:1.0,fuel:0,dt:"Перегон",overDrill:0,downtime:1.0,operator:"Елисеев Ю"}],downtime_events:[{reason:"ОФР",hours:6.0},{reason:"Перегон",hours:1.0},{reason:"ОФР",hours:6.0},{reason:"Перегон",hours:1.0},{reason:"Перегон",hours:1.0}],rigEntries:[]},
  {id:12015,oid:2,date:"2026-03-08",sh:"night",status:"approved",by:"mombekov",submittedAt:"2026-03-08T08:00:00",approvedAt:"2026-03-08T09:00:00",comment:"ОФР; Ремонт станка",fuel:1270,fuel_kg:0,df:712.2,bf:0,wh:37.0,dh:18.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:0,bf:0,wh:0,dh:11.0,fuel:70,dt:"Ремонт станка",overDrill:0,downtime:11.0,operator:"Жариков И."},{id:5,n:"JK-110",df:164.8,bf:0,wh:8.0,dh:3.0,fuel:300,dt:"ОФР",overDrill:0,downtime:3.0,operator:"Бектазим К"},{id:6,n:"JK-111",df:236.6,bf:0,wh:10.0,dh:1.0,fuel:300,dt:"ОФР",overDrill:0,downtime:1.0,operator:"Сагындыков Ж"},{id:8,n:"JK-115",df:155.8,bf:0,wh:11,dh:0,fuel:300,dt:"",overDrill:0,downtime:0,operator:"Толеутаев А"},{id:20,n:"JK-117",df:155.0,bf:0,wh:8.0,dh:3.0,fuel:300,dt:"ОФР",overDrill:0,downtime:3.0,operator:"Ертис Х"}],downtime_events:[{reason:"Ремонт станка",hours:11.0},{reason:"ОФР",hours:3.0},{reason:"ОФР",hours:1.0},{reason:"ОФР",hours:3.0}],rigEntries:[]},
  {id:12016,oid:2,date:"2026-03-09",sh:"day",status:"approved",by:"mombekov",submittedAt:"2026-03-09T08:00:00",approvedAt:"2026-03-09T09:00:00",comment:"ОФР; Перегон; ТО станка, компрессора",fuel:0,fuel_kg:0,df:682.1,bf:0,wh:33.0,dh:22.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:245.0,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Нестеренко В"},{id:5,n:"JK-110",df:0,bf:0,wh:1.0,dh:10.0,fuel:0,dt:"ОФР",overDrill:0,downtime:10.0,operator:"Есенжулов А"},{id:6,n:"JK-111",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ТО станка, компрессора",overDrill:0,downtime:11.0,operator:"Дустаев А"},{id:8,n:"JK-115",df:212.2,bf:0,wh:10.0,dh:1.0,fuel:0,dt:"Перегон",overDrill:0,downtime:1.0,operator:"Базарбаев А"},{id:20,n:"JK-117",df:224.9,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Елисеев Ю"}],downtime_events:[{reason:"ОФР",hours:10.0},{reason:"ТО станка, компрессора",hours:11.0},{reason:"Перегон",hours:1.0}],rigEntries:[]},
  {id:12017,oid:2,date:"2026-03-09",sh:"night",status:"approved",by:"mombekov",submittedAt:"2026-03-09T08:00:00",approvedAt:"2026-03-09T09:00:00",comment:"ОФР; Перегон. ОФР",fuel:750,fuel_kg:0,df:178.7,bf:0,wh:15.0,dh:40.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:52.7,bf:0,wh:6.0,dh:5.0,fuel:200,dt:"ОФР",overDrill:0,downtime:5.0,operator:"Жариков И."},{id:5,n:"JK-110",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Бектазим К"},{id:6,n:"JK-111",df:60.2,bf:0,wh:3.0,dh:8.0,fuel:200,dt:"Перегон. ОФР",overDrill:0,downtime:8.0,operator:"Сагындыков Ж"},{id:8,n:"JK-115",df:44.3,bf:0,wh:3.0,dh:8.0,fuel:200,dt:"Перегон. ОФР",overDrill:0,downtime:8.0,operator:"Толеутаев А"},{id:20,n:"JK-117",df:21.5,bf:0,wh:3.0,dh:8.0,fuel:150,dt:"Перегон. ОФР",overDrill:0,downtime:8.0,operator:"Ертис Х"}],downtime_events:[{reason:"ОФР",hours:5.0},{reason:"ОФР",hours:11.0},{reason:"Перегон. ОФР",hours:8.0},{reason:"Перегон. ОФР",hours:8.0},{reason:"Перегон. ОФР",hours:8.0}],rigEntries:[]},
  {id:12018,oid:2,date:"2026-03-10",sh:"day",status:"approved",by:"mombekov",submittedAt:"2026-03-10T08:00:00",approvedAt:"2026-03-10T09:00:00",comment:"ОФР",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:55.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Нестеренко В"},{id:5,n:"JK-110",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Есенжулов А"},{id:6,n:"JK-111",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Дустаев А"},{id:8,n:"JK-115",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Базарбаев А"},{id:20,n:"JK-117",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Елисеев Ю"}],downtime_events:[{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0}],rigEntries:[]},
  {id:12019,oid:2,date:"2026-03-10",sh:"night",status:"approved",by:"mombekov",submittedAt:"2026-03-10T08:00:00",approvedAt:"2026-03-10T09:00:00",comment:"ОФР. Перегон; Перегон. ОФР",fuel:1330,fuel_kg:0,df:346.4,bf:0,wh:27.0,dh:28.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:95.3,bf:0,wh:6.0,dh:5.0,fuel:300,dt:"ОФР. Перегон",overDrill:0,downtime:5.0,operator:"Жариков И."},{id:5,n:"JK-110",df:94.3,bf:0,wh:4.0,dh:7.0,fuel:300,dt:"ОФР. Перегон",overDrill:0,downtime:7.0,operator:"Бектазим К"},{id:6,n:"JK-111",df:45.3,bf:0,wh:6.0,dh:5.0,fuel:215,dt:"Перегон. ОФР",overDrill:0,downtime:5.0,operator:"Сагындыков Ж"},{id:8,n:"JK-115",df:37.7,bf:0,wh:6.0,dh:5.0,fuel:215,dt:"Перегон. ОФР",overDrill:0,downtime:5.0,operator:"Толеутаев А"},{id:20,n:"JK-117",df:73.8,bf:0,wh:5.0,dh:6.0,fuel:300,dt:"Перегон. ОФР",overDrill:0,downtime:6.0,operator:"Ертис Х"}],downtime_events:[{reason:"ОФР. Перегон",hours:5.0},{reason:"ОФР. Перегон",hours:7.0},{reason:"Перегон. ОФР",hours:5.0},{reason:"Перегон. ОФР",hours:5.0},{reason:"Перегон. ОФР",hours:6.0}],rigEntries:[]},
  {id:12020,oid:2,date:"2026-03-11",sh:"day",status:"approved",by:"mombekov",submittedAt:"2026-03-11T08:00:00",approvedAt:"2026-03-11T09:00:00",comment:"Перегон",fuel:0,fuel_kg:0,df:1278.0,bf:0,wh:54.0,dh:1.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:272.9,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Нестеренко В"},{id:5,n:"JK-110",df:245.1,bf:0,wh:10.0,dh:1.0,fuel:0,dt:"Перегон",overDrill:0,downtime:1.0,operator:"Есенжулов А"},{id:6,n:"JK-111",df:216.8,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Дустаев А"},{id:8,n:"JK-115",df:282.2,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Базарбаев А"},{id:20,n:"JK-117",df:261.0,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Елисеев Ю"}],downtime_events:[{reason:"Перегон",hours:1.0}],rigEntries:[]},
  {id:12021,oid:2,date:"2026-03-11",sh:"night",status:"approved",by:"mombekov",submittedAt:"2026-03-11T08:00:00",approvedAt:"2026-03-11T09:00:00",comment:"Замена шланга на компрессор; Перегон",fuel:2240,fuel_kg:0,df:836.2,bf:0,wh:47.0,dh:8.0,overDrill:2.0,rigs:[{id:9,n:"JK-109",df:153.0,bf:0,wh:8.0,dh:3.0,fuel:440,dt:"Замена шланга на компрессор",overDrill:0,downtime:3.0,operator:"Жариков И."},{id:5,n:"JK-110",df:167.8,bf:0,wh:11,dh:0,fuel:450,dt:"",overDrill:2.0,downtime:0,operator:"Бектазим К"},{id:6,n:"JK-111",df:180.5,bf:0,wh:11,dh:0,fuel:450,dt:"",overDrill:0,downtime:0,operator:"Сагындыков Ж"},{id:8,n:"JK-115",df:168.8,bf:0,wh:8.0,dh:3.0,fuel:450,dt:"Перегон",overDrill:0,downtime:3.0,operator:"Толеутаев А"},{id:20,n:"JK-117",df:166.1,bf:0,wh:9.0,dh:2.0,fuel:450,dt:"Перегон",overDrill:0,downtime:2.0,operator:"Ертис Х"}],downtime_events:[{reason:"Замена шланга на компрессор",hours:3.0},{reason:"Перегон",hours:3.0},{reason:"Перегон",hours:2.0}],rigEntries:[]},
  {id:12022,oid:2,date:"2026-03-12",sh:"day",status:"approved",by:"mombekov",submittedAt:"2026-03-12T08:00:00",approvedAt:"2026-03-12T09:00:00",comment:"Перегон; Перегон. ТО компрессора",fuel:0,fuel_kg:0,df:915.5,bf:0,wh:50.0,dh:5.0,overDrill:7.0,rigs:[{id:9,n:"JK-109",df:95.4,bf:0,wh:8.0,dh:3.0,fuel:0,dt:"Перегон. ТО компрессора",overDrill:0,downtime:3.0,operator:"Нестеренко В"},{id:5,n:"JK-110",df:93.1,bf:0,wh:10.0,dh:1.0,fuel:0,dt:"Перегон",overDrill:7.0,downtime:1.0,operator:"Есенжулов А"},{id:6,n:"JK-111",df:249.9,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Дустаев А"},{id:8,n:"JK-115",df:234.3,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Базарбаев А"},{id:20,n:"JK-117",df:242.8,bf:0,wh:10.0,dh:1.0,fuel:0,dt:"Перегон",overDrill:0,downtime:1.0,operator:"Елисеев Ю"}],downtime_events:[{reason:"Перегон. ТО компрессора",hours:3.0},{reason:"Перегон",hours:1.0},{reason:"Перегон",hours:1.0}],rigEntries:[]},
  {id:12023,oid:2,date:"2026-03-12",sh:"night",status:"approved",by:"mombekov",submittedAt:"2026-03-12T08:00:00",approvedAt:"2026-03-12T09:00:00",comment:"Перегон. Сварочные работы. Замена форсунок; Замена РВД шланга; Перегон",fuel:2090,fuel_kg:0,df:536.4,bf:0,wh:44.0,dh:11.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:133.8,bf:0,wh:9.0,dh:2.0,fuel:450,dt:"Замена РВД шланга",overDrill:0,downtime:2.0,operator:"Жариков И."},{id:5,n:"JK-110",df:57.2,bf:0,wh:4.0,dh:7.0,fuel:290,dt:"Перегон. Сварочные работы. Замена форсунок",overDrill:0,downtime:7.0,operator:"Бектазим К"},{id:6,n:"JK-111",df:114.7,bf:0,wh:11,dh:0,fuel:450,dt:"",overDrill:0,downtime:0,operator:"Сагындыков Ж"},{id:8,n:"JK-115",df:130.7,bf:0,wh:9.0,dh:2.0,fuel:450,dt:"Перегон",overDrill:0,downtime:2.0,operator:"Толеутаев А"},{id:20,n:"JK-117",df:100.0,bf:0,wh:11,dh:0,fuel:450,dt:"",overDrill:0,downtime:0,operator:"Ертис Х"}],downtime_events:[{reason:"Замена РВД шланга",hours:2.0},{reason:"Перегон. Сварочные работы. Замена форсунок",hours:7.0},{reason:"Перегон",hours:2.0}],rigEntries:[]},
  {id:12024,oid:2,date:"2026-03-13",sh:"day",status:"approved",by:"mombekov",submittedAt:"2026-03-13T08:00:00",approvedAt:"2026-03-13T09:00:00",comment:"Перегон",fuel:0,fuel_kg:0,df:923.2,bf:0,wh:48.0,dh:7.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:139.8,bf:0,wh:10.0,dh:1.0,fuel:0,dt:"Перегон",overDrill:0,downtime:1.0,operator:"Нестеренко В"},{id:5,n:"JK-110",df:213.1,bf:0,wh:9.0,dh:2.0,fuel:0,dt:"Перегон",overDrill:0,downtime:2.0,operator:"Есенжулов А"},{id:6,n:"JK-111",df:203.5,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Дустаев А"},{id:8,n:"JK-115",df:196.8,bf:0,wh:8.0,dh:3.0,fuel:0,dt:"Перегон",overDrill:0,downtime:3.0,operator:"Базарбаев А"},{id:20,n:"JK-117",df:170.0,bf:0,wh:10.0,dh:1.0,fuel:0,dt:"Перегон",overDrill:0,downtime:1.0,operator:"Елисеев Ю"}],downtime_events:[{reason:"Перегон",hours:1.0},{reason:"Перегон",hours:2.0},{reason:"Перегон",hours:3.0},{reason:"Перегон",hours:1.0}],rigEntries:[]},
  {id:12025,oid:2,date:"2026-03-13",sh:"night",status:"approved",by:"mombekov",submittedAt:"2026-03-13T08:00:00",approvedAt:"2026-03-13T09:00:00",comment:"Перегон. Ремонт. ОФР; Перегон. ОФР; Перегон; Ремонт станка; ОФР",fuel:1155,fuel_kg:0,df:648.7,bf:0,wh:34.0,dh:21.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:82.6,bf:0,wh:7.0,dh:4.0,fuel:205,dt:"Ремонт станка",overDrill:0,downtime:4.0,operator:"Жариков И."},{id:5,n:"JK-110",df:73.4,bf:0,wh:4.0,dh:7.0,fuel:200,dt:"Перегон. Ремонт. ОФР",overDrill:0,downtime:7.0,operator:"Бектазим К"},{id:6,n:"JK-111",df:185.2,bf:0,wh:7.0,dh:4.0,fuel:250,dt:"Перегон. ОФР",overDrill:0,downtime:4.0,operator:"Сагындыков Ж"},{id:8,n:"JK-115",df:154.3,bf:0,wh:8.0,dh:3.0,fuel:250,dt:"ОФР",overDrill:0,downtime:3.0,operator:"Толеутаев А"},{id:20,n:"JK-117",df:153.2,bf:0,wh:8.0,dh:3.0,fuel:250,dt:"Перегон",overDrill:0,downtime:3.0,operator:"Ертис Х"}],downtime_events:[{reason:"Ремонт станка",hours:4.0},{reason:"Перегон. Ремонт. ОФР",hours:7.0},{reason:"Перегон. ОФР",hours:4.0},{reason:"ОФР",hours:3.0},{reason:"Перегон",hours:3.0}],rigEntries:[]},
  {id:12026,oid:2,date:"2026-03-14",sh:"day",status:"approved",by:"mombekov",submittedAt:"2026-03-14T08:00:00",approvedAt:"2026-03-14T09:00:00",comment:"ОФР",fuel:0,fuel_kg:0,df:156.0,bf:0,wh:6.0,dh:49.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Нестеренко В"},{id:5,n:"JK-110",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Есенжулов А"},{id:6,n:"JK-111",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Дустаев А"},{id:8,n:"JK-115",df:80.0,bf:0,wh:3.0,dh:8.0,fuel:0,dt:"ОФР",overDrill:0,downtime:8.0,operator:"Базарбаев А"},{id:20,n:"JK-117",df:76.0,bf:0,wh:3.0,dh:8.0,fuel:0,dt:"ОФР",overDrill:0,downtime:8.0,operator:"Елисеев Ю"}],downtime_events:[{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:8.0},{reason:"ОФР",hours:8.0}],rigEntries:[]},
  {id:12027,oid:2,date:"2026-03-14",sh:"night",status:"approved",by:"mombekov",submittedAt:"2026-03-14T08:00:00",approvedAt:"2026-03-14T09:00:00",comment:"ОФР; Перегон; Перегон. ТО станка, компрессора",fuel:745,fuel_kg:0,df:406.4,bf:0,wh:14.0,dh:41.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Жариков И."},{id:5,n:"JK-110",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Бектазим К"},{id:6,n:"JK-111",df:135.0,bf:0,wh:4.0,dh:7.0,fuel:250,dt:"Перегон",overDrill:0,downtime:7.0,operator:"Сагындыков Ж"},{id:8,n:"JK-115",df:139.0,bf:0,wh:5.0,dh:6.0,fuel:250,dt:"Перегон. ТО станка, компрессора",overDrill:0,downtime:6.0,operator:"Толеутаев А"},{id:20,n:"JK-117",df:132.4,bf:0,wh:5.0,dh:6.0,fuel:245,dt:"ОФР",overDrill:0,downtime:6.0,operator:"Ертис Х"}],downtime_events:[{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"Перегон",hours:7.0},{reason:"Перегон. ТО станка, компрессора",hours:6.0},{reason:"ОФР",hours:6.0}],rigEntries:[]},
  {id:12028,oid:2,date:"2026-03-15",sh:"day",status:"approved",by:"mombekov",submittedAt:"2026-03-15T08:00:00",approvedAt:"2026-03-15T09:00:00",comment:"ОФР",fuel:0,fuel_kg:0,df:151.0,bf:0,wh:5.0,dh:50.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Нестеренко В"},{id:5,n:"JK-110",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Есенжулов А"},{id:6,n:"JK-111",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Дустаев А"},{id:8,n:"JK-115",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Базарбаев А"},{id:20,n:"JK-117",df:151.0,bf:0,wh:5.0,dh:6.0,fuel:0,dt:"ОФР",overDrill:0,downtime:6.0,operator:"Елисеев Ю"}],downtime_events:[{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:6.0}],rigEntries:[]},
  {id:12029,oid:2,date:"2026-03-15",sh:"night",status:"approved",by:"mombekov",submittedAt:"2026-03-15T08:00:00",approvedAt:"2026-03-15T09:00:00",comment:"ОФР",fuel:105,fuel_kg:0,df:29.8,bf:0,wh:3.0,dh:52.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Жариков И."},{id:5,n:"JK-110",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Бектазим К"},{id:6,n:"JK-111",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Сагындыков Ж"},{id:8,n:"JK-115",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Толеутаев А"},{id:20,n:"JK-117",df:29.8,bf:0,wh:3.0,dh:8.0,fuel:105,dt:"ОФР",overDrill:0,downtime:8.0,operator:"Ертис Х"}],downtime_events:[{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:8.0}],rigEntries:[]},
  {id:12030,oid:2,date:"2026-03-16",sh:"day",status:"approved",by:"mombekov",submittedAt:"2026-03-16T08:00:00",approvedAt:"2026-03-16T09:00:00",comment:"ОФР",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:55.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Нестеренко В"},{id:5,n:"JK-110",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Есенжулов А"},{id:6,n:"JK-111",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Дустаев А"},{id:8,n:"JK-115",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Базарбаев А"},{id:20,n:"JK-117",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Елисеев Ю"}],downtime_events:[{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0}],rigEntries:[]},
  {id:12031,oid:2,date:"2026-03-16",sh:"night",status:"approved",by:"mombekov",submittedAt:"2026-03-16T08:00:00",approvedAt:"2026-03-16T09:00:00",comment:"ОФР",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:55.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Жариков И."},{id:5,n:"JK-110",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Бектазим К"},{id:6,n:"JK-111",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Сагындыков Ж"},{id:8,n:"JK-115",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Толеутаев А"},{id:20,n:"JK-117",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Ертис Х"}],downtime_events:[{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0}],rigEntries:[]},
  {id:12032,oid:2,date:"2026-03-17",sh:"day",status:"approved",by:"mombekov",submittedAt:"2026-03-17T08:00:00",approvedAt:"2026-03-17T09:00:00",comment:"Перегон",fuel:0,fuel_kg:0,df:665.8,bf:0,wh:41.0,dh:14.0,overDrill:0,rigs:[{id:9,n:"JK-109",df:116.4,bf:0,wh:7.0,dh:4.0,fuel:0,dt:"Перегон",overDrill:0,downtime:4.0,operator:"Вебер П"},{id:5,n:"JK-110",df:147.3,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Абишев К"},{id:6,n:"JK-111",df:136.2,bf:0,wh:6.0,dh:5.0,fuel:0,dt:"Перегон",overDrill:0,downtime:5.0,operator:"Кусаинов Б"},{id:8,n:"JK-115",df:110.0,bf:0,wh:9.0,dh:2.0,fuel:0,dt:"Перегон",overDrill:0,downtime:2.0,operator:"Камзаев С"},{id:20,n:"JK-117",df:155.9,bf:0,wh:8.0,dh:3.0,fuel:0,dt:"Перегон",overDrill:0,downtime:3.0,operator:"Соловьев С"}],downtime_events:[{reason:"Перегон",hours:4.0},{reason:"Перегон",hours:5.0},{reason:"Перегон",hours:2.0},{reason:"Перегон",hours:3.0}],rigEntries:[]},
  {id:12033,oid:2,date:"2026-03-17",sh:"night",status:"approved",by:"mombekov",submittedAt:"2026-03-17T08:00:00",approvedAt:"2026-03-17T09:00:00",comment:"Неисправность компрессора",fuel:1563,fuel_kg:0,df:944.7,bf:0,wh:51.0,dh:4.0,overDrill:5.0,rigs:[{id:9,n:"JK-109",df:201.0,bf:0,wh:11,dh:0,fuel:300,dt:"",overDrill:0,downtime:0,operator:"Медетов У"},{id:5,n:"JK-110",df:156.9,bf:0,wh:7.0,dh:4.0,fuel:300,dt:"Неисправность компрессора",overDrill:0,downtime:4.0,operator:"Альжанов Т"},{id:6,n:"JK-111",df:161.0,bf:0,wh:11,dh:0,fuel:300,dt:"",overDrill:5.0,downtime:0,operator:"Калмыков Б"},{id:8,n:"JK-115",df:237.0,bf:0,wh:11,dh:0,fuel:300,dt:"",overDrill:0,downtime:0,operator:"Ташкараев Р"},{id:20,n:"JK-117",df:188.8,bf:0,wh:11,dh:0,fuel:363,dt:"",overDrill:0,downtime:0,operator:"Турсынов И"}],downtime_events:[{reason:"Неисправность компрессора",hours:4.0}],rigEntries:[]},
  {id:12034,oid:2,date:"2026-03-18",sh:"day",status:"approved",by:"mombekov",submittedAt:"2026-03-18T08:00:00",approvedAt:"2026-03-18T09:00:00",comment:"",fuel:0,fuel_kg:0,df:975.0,bf:0,wh:55,dh:0,overDrill:0,rigs:[{id:9,n:"JK-109",df:200.6,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Вебер П"},{id:5,n:"JK-110",df:193.0,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Абишев К"},{id:6,n:"JK-111",df:204.5,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Кусаинов Б"},{id:8,n:"JK-115",df:231.0,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Камзаев С"},{id:20,n:"JK-117",df:145.9,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Соловьев С"}],downtime_events:[],rigEntries:[]},
  {id:12035,oid:2,date:"2026-03-18",sh:"night",status:"approved",by:"mombekov",submittedAt:"2026-03-18T08:00:00",approvedAt:"2026-03-18T09:00:00",comment:"",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:0,overDrill:0,rigs:[{id:9,n:"JK-109",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:5,n:"JK-110",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:6,n:"JK-111",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:8,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:20,n:"JK-117",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[],rigEntries:[]},
  {id:11000,oid:3,date:"2026-03-01",sh:"day",status:"approved",by:"foreman4",submittedAt:"2026-03-01T08:00:00",approvedAt:"2026-03-01T09:00:00",comment:"Перегон; Заболел помощник. Прогрев; Тех уход; Замена форсунок",fuel:296,fuel_kg:0,df:1145.1,bf:0,wh:52.0,dh:14.0,overDrill:0,rigs:[{id:10,n:"JK-112",df:228.7,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Кудряшов К"},{id:11,n:"JK-113",df:240.4,bf:0,wh:10.0,dh:1.0,fuel:153,dt:"Перегон",overDrill:0,downtime:1.0,operator:"Литвиненко Е"},{id:12,n:"JK-114",df:133.1,bf:0,wh:6.0,dh:5.0,fuel:0,dt:"Замена форсунок",overDrill:0,downtime:5.0,operator:"Тергеубаев Р"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:220.2,bf:0,wh:9.0,dh:2.0,fuel:143,dt:"",overDrill:0,downtime:2.0,operator:"Ешмухаметов Ф"},{id:23,n:"JK-118",df:225.8,bf:0,wh:9.0,dh:2.0,fuel:0,dt:"Тех уход",overDrill:0,downtime:2.0,operator:"Жоламанулы А"},{id:19,n:"JK-106",df:96.9,bf:0,wh:7.0,dh:4.0,fuel:0,dt:"Заболел помощник. Прогрев",overDrill:0,downtime:4.0,operator:"Толеухан А"},{id:24,n:"JK-122",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"Перегон",hours:1.0},{reason:"Замена форсунок",hours:5.0},{reason:"Простой",hours:2.0},{reason:"Тех уход",hours:2.0},{reason:"Заболел помощник. Прогрев",hours:4.0}],rigEntries:[]},
  {id:11001,oid:3,date:"2026-03-01",sh:"night",status:"approved",by:"foreman4",submittedAt:"2026-03-01T08:00:00",approvedAt:"2026-03-01T09:00:00",comment:"Перегон; Замена адаптера",fuel:1062,fuel_kg:0,df:1547.5,bf:0,wh:58.0,dh:8.0,overDrill:0,rigs:[{id:10,n:"JK-112",df:324.3,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Сорвачев А"},{id:11,n:"JK-113",df:278.6,bf:0,wh:9.0,dh:2.0,fuel:0,dt:"Замена адаптера",overDrill:0,downtime:2.0,operator:"Рябцев А"},{id:12,n:"JK-114",df:213.6,bf:0,wh:7.0,dh:4.0,fuel:174,dt:"Перегон",overDrill:0,downtime:4.0,operator:"Жогин А"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:336.6,bf:0,wh:11,dh:0,fuel:294,dt:"",overDrill:0,downtime:0,operator:"Балтабеков А"},{id:23,n:"JK-118",df:267.5,bf:0,wh:11,dh:0,fuel:280,dt:"",overDrill:0,downtime:0,operator:"Жогин А"},{id:19,n:"JK-106",df:126.9,bf:0,wh:9.0,dh:2.0,fuel:314,dt:"Перегон",overDrill:0,downtime:2.0,operator:"Мизанов Б"},{id:24,n:"JK-122",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"Замена адаптера",hours:2.0},{reason:"Перегон",hours:4.0},{reason:"Перегон",hours:2.0}],rigEntries:[]},
  {id:11002,oid:3,date:"2026-03-02",sh:"day",status:"approved",by:"foreman4",submittedAt:"2026-03-02T08:00:00",approvedAt:"2026-03-02T09:00:00",comment:"ОФР",fuel:699,fuel_kg:0,df:1385.1,bf:0,wh:39.0,dh:27.0,overDrill:0,rigs:[{id:10,n:"JK-112",df:186.8,bf:0,wh:6.0,dh:5.0,fuel:0,dt:"ОФР",overDrill:0,downtime:5.0,operator:"Кудряшов К"},{id:11,n:"JK-113",df:157.9,bf:0,wh:6.0,dh:5.0,fuel:336,dt:"ОФР",overDrill:0,downtime:5.0,operator:"Литвиненко Е"},{id:12,n:"JK-114",df:285.4,bf:0,wh:6.0,dh:5.0,fuel:0,dt:"ОФР",overDrill:0,downtime:5.0,operator:"Тергеубаев Р"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:261.0,bf:0,wh:6.0,dh:5.0,fuel:195,dt:"",overDrill:0,downtime:5.0,operator:"Ешмухаметов Ф"},{id:23,n:"JK-118",df:326.7,bf:0,wh:6.0,dh:5.0,fuel:0,dt:"ОФР",overDrill:0,downtime:5.0,operator:"Жоламанулы А"},{id:19,n:"JK-106",df:167.3,bf:0,wh:9.0,dh:2.0,fuel:168,dt:"ОФР",overDrill:0,downtime:2.0,operator:"Толеухан А"},{id:24,n:"JK-122",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"ОФР",hours:5.0},{reason:"ОФР",hours:5.0},{reason:"ОФР",hours:5.0},{reason:"Простой",hours:5.0},{reason:"ОФР",hours:5.0},{reason:"ОФР",hours:2.0}],rigEntries:[]},
  {id:11003,oid:3,date:"2026-03-02",sh:"night",status:"approved",by:"foreman4",submittedAt:"2026-03-02T08:00:00",approvedAt:"2026-03-02T09:00:00",comment:"Перегон; ТО станка. Неисправность стартера; ОФР; Бурение козлов",fuel:1151,fuel_kg:0,df:1015.7,bf:0,wh:46.0,dh:20.0,overDrill:0,rigs:[{id:10,n:"JK-112",df:156.1,bf:0,wh:9.0,dh:2.0,fuel:128,dt:"Перегон",overDrill:0,downtime:2.0,operator:"Сорвачев А"},{id:11,n:"JK-113",df:0,bf:0,wh:2.0,dh:9.0,fuel:0,dt:"Бурение козлов",overDrill:0,downtime:9.0,operator:"Рябцев А"},{id:12,n:"JK-114",df:215.4,bf:0,wh:8.0,dh:3.0,fuel:210,dt:"ТО станка. Неисправность стартера",overDrill:0,downtime:3.0,operator:"Жогин А"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:345.6,bf:0,wh:11,dh:0,fuel:419,dt:"",overDrill:0,downtime:0,operator:"Балтабеков А"},{id:23,n:"JK-118",df:226.9,bf:0,wh:11,dh:0,fuel:186,dt:"",overDrill:0,downtime:0,operator:"Жогин А"},{id:19,n:"JK-106",df:71.7,bf:0,wh:5.0,dh:6.0,fuel:208,dt:"ОФР",overDrill:0,downtime:6.0,operator:"Мезенцев Д"},{id:24,n:"JK-122",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"Перегон",hours:2.0},{reason:"Бурение козлов",hours:9.0},{reason:"ТО станка. Неисправность стартера",hours:3.0},{reason:"ОФР",hours:6.0}],rigEntries:[]},
  {id:11004,oid:3,date:"2026-03-03",sh:"day",status:"approved",by:"foreman4",submittedAt:"2026-03-03T08:00:00",approvedAt:"2026-03-03T09:00:00",comment:"Перегон",fuel:583,fuel_kg:0,df:1028.7,bf:0,wh:62.0,dh:4.0,overDrill:14.0,rigs:[{id:10,n:"JK-112",df:186.0,bf:0,wh:11,dh:0,fuel:170,dt:"",overDrill:0,downtime:0,operator:"Кудряшов К"},{id:11,n:"JK-113",df:65.0,bf:0,wh:10.0,dh:1.0,fuel:213,dt:"Перегон",overDrill:0,downtime:1.0,operator:"Литвиненко Е"},{id:12,n:"JK-114",df:259.1,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Тергеубаев Р"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:235.8,bf:0,wh:8.0,dh:3.0,fuel:0,dt:"",overDrill:0,downtime:3.0,operator:"Ешмухаметов Ф"},{id:23,n:"JK-118",df:123.2,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:14.0,downtime:0,operator:"Жоламанулы А"},{id:19,n:"JK-106",df:159.6,bf:0,wh:11,dh:0,fuel:200,dt:"",overDrill:0,downtime:0,operator:"Мизанов Б"},{id:24,n:"JK-122",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"Перегон",hours:1.0},{reason:"Простой",hours:3.0}],rigEntries:[]},
  {id:11005,oid:3,date:"2026-03-03",sh:"night",status:"approved",by:"foreman4",submittedAt:"2026-03-03T08:00:00",approvedAt:"2026-03-03T09:00:00",comment:"ОФР; Перегон",fuel:780,fuel_kg:0,df:1418.9,bf:0,wh:61.0,dh:5.0,overDrill:0,rigs:[{id:10,n:"JK-112",df:274.3,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Сорвачев А"},{id:11,n:"JK-113",df:262.2,bf:0,wh:10.0,dh:1.0,fuel:0,dt:"ОФР",overDrill:0,downtime:1.0,operator:"Рябцев А"},{id:12,n:"JK-114",df:276.6,bf:0,wh:9.0,dh:2.0,fuel:320,dt:"ОФР",overDrill:0,downtime:2.0,operator:"Жогин А"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:310.0,bf:0,wh:10.0,dh:1.0,fuel:460,dt:"",overDrill:0,downtime:1.0,operator:"Балтабеков А"},{id:23,n:"JK-118",df:185.2,bf:0,wh:10.0,dh:1.0,fuel:0,dt:"Перегон",overDrill:0,downtime:1.0,operator:"Жогин А"},{id:19,n:"JK-106",df:110.6,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Мезенцев Д"},{id:24,n:"JK-122",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"ОФР",hours:1.0},{reason:"ОФР",hours:2.0},{reason:"Простой",hours:1.0},{reason:"Перегон",hours:1.0}],rigEntries:[]},
  {id:11006,oid:3,date:"2026-03-04",sh:"day",status:"approved",by:"foreman4",submittedAt:"2026-03-04T08:00:00",approvedAt:"2026-03-04T09:00:00",comment:"ОФР; Замена патрубка на антифриз; ТО станка, компрессора",fuel:407,fuel_kg:0,df:1059.8,bf:0,wh:53.0,dh:13.0,overDrill:17.0,rigs:[{id:10,n:"JK-112",df:117.7,bf:0,wh:6.0,dh:5.0,fuel:0,dt:"ТО станка, компрессора",overDrill:0,downtime:5.0,operator:"Кудряшов К"},{id:11,n:"JK-113",df:179.8,bf:0,wh:8.0,dh:3.0,fuel:187,dt:"ОФР",overDrill:0,downtime:3.0,operator:"Литвиненко Е"},{id:12,n:"JK-114",df:212.8,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Тергеубаев Р"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:344.8,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Ешмухаметов Ф"},{id:23,n:"JK-118",df:204.7,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Жоламанулы А"},{id:19,n:"JK-106",df:0,bf:0,wh:6.0,dh:5.0,fuel:220,dt:"Замена патрубка на антифриз",overDrill:17.0,downtime:5.0,operator:"Мизанов Б"},{id:24,n:"JK-122",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"ТО станка, компрессора",hours:5.0},{reason:"ОФР",hours:3.0},{reason:"Замена патрубка на антифриз",hours:5.0}],rigEntries:[]},
  {id:11007,oid:3,date:"2026-03-04",sh:"night",status:"approved",by:"foreman4",submittedAt:"2026-03-04T08:00:00",approvedAt:"2026-03-04T09:00:00",comment:"Перегон; ТО станка; ОФР",fuel:788,fuel_kg:0,df:674.1,bf:0,wh:40.0,dh:15.0,overDrill:50.0,rigs:[{id:10,n:"JK-112",df:156.4,bf:0,wh:9.0,dh:2.0,fuel:141,dt:"Перегон",overDrill:0,downtime:2.0,operator:"Сорвачев А"},{id:11,n:"JK-113",df:226.8,bf:0,wh:11,dh:0,fuel:260,dt:"",overDrill:0,downtime:0,operator:"Рябцев А"},{id:12,n:"JK-114",df:100.5,bf:0,wh:4.0,dh:7.0,fuel:110,dt:"ТО станка",overDrill:0,downtime:7.0,operator:"Жогин А"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:0,bf:0,wh:11,dh:0,fuel:137,dt:"",overDrill:38.0,downtime:0,operator:"Балтабеков А"},{id:23,n:"JK-118",df:190.4,bf:0,wh:5.0,dh:6.0,fuel:140,dt:"ОФР",overDrill:0,downtime:6.0,operator:"Жогин А"},{id:19,n:"JK-106",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:12.0,downtime:0,operator:"Мезенцев Д"},{id:24,n:"JK-122",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"Перегон",hours:2.0},{reason:"ТО станка",hours:7.0},{reason:"ОФР",hours:6.0}],rigEntries:[]},
  {id:11008,oid:3,date:"2026-03-05",sh:"day",status:"approved",by:"foreman4",submittedAt:"2026-03-05T08:00:00",approvedAt:"2026-03-05T09:00:00",comment:"Ошибка 679-07 на компрессоре; Порвало ремень на станке",fuel:349,fuel_kg:0,df:1201.4,bf:0,wh:48.0,dh:7.0,overDrill:59.0,rigs:[{id:10,n:"JK-112",df:323.8,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Кудряшов К"},{id:11,n:"JK-113",df:223.0,bf:0,wh:10.0,dh:1.0,fuel:149,dt:"Ошибка 679-07 на компрессоре",overDrill:0,downtime:1.0,operator:"Литвиненко Е"},{id:12,n:"JK-114",df:313.6,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Тергеубаев Р"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:38.0,downtime:0,operator:"Ешмухаметов Ф"},{id:23,n:"JK-118",df:341.0,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Жоламанулы А"},{id:19,n:"JK-106",df:0,bf:0,wh:5.0,dh:6.0,fuel:200,dt:"Порвало ремень на станке",overDrill:21.0,downtime:6.0,operator:"Мизанов Б"},{id:24,n:"JK-122",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"Ошибка 679-07 на компрессоре",hours:1.0},{reason:"Порвало ремень на станке",hours:6.0}],rigEntries:[]},
  {id:11009,oid:3,date:"2026-03-05",sh:"night",status:"approved",by:"foreman4",submittedAt:"2026-03-05T08:00:00",approvedAt:"2026-03-05T09:00:00",comment:"Лопнул шланг РВД",fuel:988,fuel_kg:0,df:1424.8,bf:0,wh:51.0,dh:15.0,overDrill:8.0,rigs:[{id:10,n:"JK-112",df:299.2,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Сорвачев А"},{id:11,n:"JK-113",df:352.5,bf:0,wh:11,dh:0,fuel:260,dt:"",overDrill:0,downtime:0,operator:"Рябцев А"},{id:12,n:"JK-114",df:327.8,bf:0,wh:11,dh:0,fuel:290,dt:"",overDrill:0,downtime:0,operator:"Жогин А"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:121.9,bf:0,wh:5.0,dh:6.0,fuel:225,dt:"",overDrill:0,downtime:6.0,operator:"Балтабеков А"},{id:23,n:"JK-118",df:279.0,bf:0,wh:6.0,dh:5.0,fuel:213,dt:"Лопнул шланг РВД",overDrill:0,downtime:5.0,operator:"Жогин А"},{id:19,n:"JK-106",df:44.4,bf:0,wh:7.0,dh:4.0,fuel:0,dt:"",overDrill:8.0,downtime:4.0,operator:"Мезенцев Д"},{id:24,n:"JK-122",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"Простой",hours:6.0},{reason:"Лопнул шланг РВД",hours:5.0},{reason:"Простой",hours:4.0}],rigEntries:[]},
  {id:11010,oid:3,date:"2026-03-06",sh:"day",status:"approved",by:"foreman4",submittedAt:"2026-03-06T08:00:00",approvedAt:"2026-03-06T09:00:00",comment:"Отсутствие ДТ; Плоха зачищен блок. большое количество воды",fuel:300,fuel_kg:0,df:853.6,bf:0,wh:43.0,dh:12.0,overDrill:0,rigs:[{id:10,n:"JK-112",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"ТО станка, компрессора",overDrill:0,downtime:0,operator:"Кудряшов К"},{id:11,n:"JK-113",df:0,bf:0,wh:4.0,dh:7.0,fuel:0,dt:"Плоха зачищен блок. большое количество воды",overDrill:0,downtime:7.0,operator:"Литвиненко Е"},{id:12,n:"JK-114",df:193.5,bf:0,wh:7.0,dh:4.0,fuel:0,dt:"Отсутствие ДТ",overDrill:0,downtime:4.0,operator:"Тергеубаев Р"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:301.7,bf:0,wh:10.0,dh:1.0,fuel:0,dt:"",overDrill:0,downtime:1.0,operator:"Ешмухаметов Ф"},{id:23,n:"JK-118",df:179.2,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Жоламанулы А"},{id:19,n:"JK-106",df:179.2,bf:0,wh:11,dh:0,fuel:300,dt:"",overDrill:0,downtime:0,operator:"Мизанов Б"},{id:24,n:"JK-122",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"Плоха зачищен блок. большое количество воды",hours:7.0},{reason:"Отсутствие ДТ",hours:4.0},{reason:"Простой",hours:1.0}],rigEntries:[]},
  {id:11011,oid:3,date:"2026-03-06",sh:"night",status:"approved",by:"foreman4",submittedAt:"2026-03-06T08:00:00",approvedAt:"2026-03-06T09:00:00",comment:"ОФР; ОФР. ТО станка; Перегон.",fuel:805,fuel_kg:0,df:786.3,bf:0,wh:33.0,dh:33.0,overDrill:0,rigs:[{id:10,n:"JK-112",df:100.7,bf:0,wh:3.0,dh:8.0,fuel:0,dt:"ОФР",overDrill:0,downtime:8.0,operator:"Сорвачев А"},{id:11,n:"JK-113",df:48.6,bf:0,wh:3.0,dh:8.0,fuel:0,dt:"ОФР. ТО станка",overDrill:0,downtime:8.0,operator:"Рябцев А"},{id:12,n:"JK-114",df:55.7,bf:0,wh:3.0,dh:8.0,fuel:140,dt:"ОФР",overDrill:0,downtime:8.0,operator:"Жогин А"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:185.5,bf:0,wh:11,dh:0,fuel:255,dt:"",overDrill:0,downtime:0,operator:"Балтабеков А"},{id:23,n:"JK-118",df:209.7,bf:0,wh:2.0,dh:9.0,fuel:140,dt:"Перегон.",overDrill:0,downtime:9.0,operator:"Жогин А"},{id:19,n:"JK-106",df:186.1,bf:0,wh:11,dh:0,fuel:270,dt:"",overDrill:0,downtime:0,operator:"Мезенцев Д"},{id:24,n:"JK-122",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"ОФР",hours:8.0},{reason:"ОФР. ТО станка",hours:8.0},{reason:"ОФР",hours:8.0},{reason:"Перегон.",hours:9.0}],rigEntries:[]},
  {id:11012,oid:3,date:"2026-03-07",sh:"day",status:"approved",by:"foreman4",submittedAt:"2026-03-07T08:00:00",approvedAt:"2026-03-07T09:00:00",comment:"Ошибка на компрессоре 1349-14; ОФР",fuel:270,fuel_kg:0,df:1121.7,bf:0,wh:57.0,dh:9.0,overDrill:0,rigs:[{id:10,n:"JK-112",df:211.7,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Кудряшов К"},{id:11,n:"JK-113",df:0,bf:0,wh:3.0,dh:8.0,fuel:0,dt:"Ошибка на компрессоре 1349-14",overDrill:0,downtime:8.0,operator:"Литвиненко Е"},{id:12,n:"JK-114",df:242.1,bf:0,wh:10.0,dh:1.0,fuel:0,dt:"ОФР",overDrill:0,downtime:1.0,operator:"Тергеубаев Р"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:267.4,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Ешмухаметов Ф"},{id:23,n:"JK-118",df:258.5,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Жоламанулы А"},{id:19,n:"JK-106",df:142.0,bf:0,wh:11,dh:0,fuel:270,dt:"",overDrill:0,downtime:0,operator:"Мизанов Б"},{id:24,n:"JK-122",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"Ошибка на компрессоре 1349-14",hours:8.0},{reason:"ОФР",hours:1.0}],rigEntries:[]},
  {id:11013,oid:3,date:"2026-03-07",sh:"night",status:"approved",by:"foreman4",submittedAt:"2026-03-07T08:00:00",approvedAt:"2026-03-07T09:00:00",comment:"ОФР; Перегон; Замена РВД. Перегон; Ремонт станка",fuel:190,fuel_kg:0,df:514.3,bf:0,wh:31.0,dh:35.0,overDrill:5.0,rigs:[{id:10,n:"JK-112",df:143.2,bf:0,wh:7.0,dh:4.0,fuel:0,dt:"ОФР",overDrill:0,downtime:4.0,operator:"Сорвачев А"},{id:11,n:"JK-113",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"Ремонт станка",overDrill:0,downtime:11.0,operator:"Рябцев А"},{id:12,n:"JK-114",df:115.6,bf:0,wh:6.0,dh:5.0,fuel:0,dt:"Перегон",overDrill:4.0,downtime:5.0,operator:"Жогин А"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:95.2,bf:0,wh:5.0,dh:6.0,fuel:190,dt:"",overDrill:0,downtime:6.0,operator:"Балтабеков А"},{id:23,n:"JK-118",df:97.7,bf:0,wh:4.0,dh:7.0,fuel:0,dt:"Замена РВД. Перегон",overDrill:0,downtime:7.0,operator:"Жогин А"},{id:19,n:"JK-106",df:62.6,bf:0,wh:9.0,dh:2.0,fuel:0,dt:"Перегон",overDrill:1.0,downtime:2.0,operator:"Мезенцев Д"},{id:24,n:"JK-122",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"ОФР",hours:4.0},{reason:"Ремонт станка",hours:11.0},{reason:"Перегон",hours:5.0},{reason:"Простой",hours:6.0},{reason:"Замена РВД. Перегон",hours:7.0},{reason:"Перегон",hours:2.0}],rigEntries:[]},
  {id:11014,oid:3,date:"2026-03-08",sh:"day",status:"approved",by:"foreman4",submittedAt:"2026-03-08T08:00:00",approvedAt:"2026-03-08T09:00:00",comment:"",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:0,overDrill:0,rigs:[{id:10,n:"JK-112",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:11,n:"JK-113",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:12,n:"JK-114",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:23,n:"JK-118",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:19,n:"JK-106",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:24,n:"JK-122",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[],rigEntries:[]},
  {id:11015,oid:3,date:"2026-03-08",sh:"night",status:"approved",by:"foreman4",submittedAt:"2026-03-08T08:00:00",approvedAt:"2026-03-08T09:00:00",comment:"",fuel:712,fuel_kg:0,df:1252.9,bf:0,wh:66,dh:0,overDrill:0,rigs:[{id:10,n:"JK-112",df:247.3,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Сорвачев А"},{id:11,n:"JK-113",df:110.0,bf:0,wh:11,dh:0,fuel:250,dt:"",overDrill:0,downtime:0,operator:"Рябцев А"},{id:12,n:"JK-114",df:290.3,bf:0,wh:11,dh:0,fuel:172,dt:"",overDrill:0,downtime:0,operator:"Жогин А"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:330.0,bf:0,wh:11,dh:0,fuel:290,dt:"",overDrill:0,downtime:0,operator:"Балтабеков А"},{id:23,n:"JK-118",df:91.8,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Жогин А"},{id:19,n:"JK-106",df:183.5,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Мезенцев Д"},{id:24,n:"JK-122",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[],rigEntries:[]},
  {id:11016,oid:3,date:"2026-03-09",sh:"day",status:"approved",by:"foreman4",submittedAt:"2026-03-09T08:00:00",approvedAt:"2026-03-09T09:00:00",comment:"",fuel:330,fuel_kg:0,df:1427.9,bf:0,wh:66,dh:0,overDrill:0,rigs:[{id:10,n:"JK-112",df:221.4,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Кудряшов К"},{id:11,n:"JK-113",df:256.7,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Литвиненко Е"},{id:12,n:"JK-114",df:282.1,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Тергеубаев Р"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:290.8,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Ешмухаметов Ф"},{id:23,n:"JK-118",df:202.5,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Жоламанулы А"},{id:19,n:"JK-106",df:174.4,bf:0,wh:11,dh:0,fuel:330,dt:"",overDrill:0,downtime:0,operator:"Мизанов Б"},{id:24,n:"JK-122",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[],rigEntries:[]},
  {id:11017,oid:3,date:"2026-03-09",sh:"night",status:"approved",by:"foreman4",submittedAt:"2026-03-09T08:00:00",approvedAt:"2026-03-09T09:00:00",comment:"ОФР; Подбурки",fuel:350,fuel_kg:0,df:1157.0,bf:0,wh:60.0,dh:6.0,overDrill:0,rigs:[{id:10,n:"JK-112",df:250.9,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Сорвачев А"},{id:11,n:"JK-113",df:223.6,bf:0,wh:11,dh:0,fuel:300,dt:"",overDrill:0,downtime:0,operator:"Рябцев А"},{id:12,n:"JK-114",df:208.5,bf:0,wh:8.0,dh:3.0,fuel:0,dt:"ОФР",overDrill:0,downtime:3.0,operator:"Жогин А"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:287.3,bf:0,wh:11,dh:0,fuel:50,dt:"",overDrill:0,downtime:0,operator:"Балтабеков А"},{id:23,n:"JK-118",df:186.7,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Жогин А"},{id:19,n:"JK-106",df:0,bf:0,wh:8.0,dh:3.0,fuel:0,dt:"Подбурки",overDrill:0,downtime:3.0,operator:"Мезенцев Д"},{id:24,n:"JK-122",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"ОФР",hours:3.0},{reason:"Подбурки",hours:3.0}],rigEntries:[]},
  {id:11018,oid:3,date:"2026-03-10",sh:"day",status:"approved",by:"foreman4",submittedAt:"2026-03-10T08:00:00",approvedAt:"2026-03-10T09:00:00",comment:"ОФР",fuel:280,fuel_kg:0,df:855.5,bf:0,wh:44.0,dh:22.0,overDrill:8.0,rigs:[{id:10,n:"JK-112",df:151.5,bf:0,wh:7.0,dh:4.0,fuel:0,dt:"ОФР",overDrill:0,downtime:4.0,operator:"Кудряшов К"},{id:11,n:"JK-113",df:143.9,bf:0,wh:9.0,dh:2.0,fuel:0,dt:"ОФР",overDrill:0,downtime:2.0,operator:"Литвиненко Е"},{id:12,n:"JK-114",df:193.5,bf:0,wh:6.0,dh:5.0,fuel:0,dt:"ОФР",overDrill:0,downtime:5.0,operator:"Тергеубаев Р"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:113.9,bf:0,wh:7.0,dh:4.0,fuel:0,dt:"",overDrill:8.0,downtime:4.0,operator:"Ешмухаметов Ф"},{id:23,n:"JK-118",df:156.2,bf:0,wh:8.0,dh:3.0,fuel:0,dt:"ОФР",overDrill:0,downtime:3.0,operator:"Жоламанулы А"},{id:19,n:"JK-106",df:96.5,bf:0,wh:7.0,dh:4.0,fuel:280,dt:"ОФР",overDrill:0,downtime:4.0,operator:"Мизанов Б"},{id:24,n:"JK-122",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"ОФР",hours:4.0},{reason:"ОФР",hours:2.0},{reason:"ОФР",hours:5.0},{reason:"Простой",hours:4.0},{reason:"ОФР",hours:3.0},{reason:"ОФР",hours:4.0}],rigEntries:[]},
  {id:11019,oid:3,date:"2026-03-10",sh:"night",status:"approved",by:"foreman4",submittedAt:"2026-03-10T08:00:00",approvedAt:"2026-03-10T09:00:00",comment:"",fuel:665,fuel_kg:0,df:1336.3,bf:0,wh:55,dh:0,overDrill:0,rigs:[{id:10,n:"JK-112",df:304.2,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Сорвачев А"},{id:11,n:"JK-113",df:267.5,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Рябцев А"},{id:12,n:"JK-114",df:281.3,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Жогин А"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:368.0,bf:0,wh:11,dh:0,fuel:665,dt:"",overDrill:0,downtime:0,operator:"Балтабеков А"},{id:23,n:"JK-118",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"Подбурки",overDrill:0,downtime:0,operator:"Жогин А"},{id:19,n:"JK-106",df:115.3,bf:0,wh:11,dh:0,fuel:0,dt:"ТО станка",overDrill:0,downtime:0,operator:"Мезенцев Д"},{id:24,n:"JK-122",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[],rigEntries:[]},
  {id:11020,oid:3,date:"2026-03-11",sh:"day",status:"approved",by:"foreman4",submittedAt:"2026-03-11T08:00:00",approvedAt:"2026-03-11T09:00:00",comment:"Перегон",fuel:150,fuel_kg:0,df:1214.3,bf:0,wh:59.0,dh:7.0,overDrill:0,rigs:[{id:10,n:"JK-112",df:205.2,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Кудряшов К"},{id:11,n:"JK-113",df:220.3,bf:0,wh:9.0,dh:2.0,fuel:0,dt:"",overDrill:0,downtime:2.0,operator:"Литвиненко Е"},{id:12,n:"JK-114",df:221.4,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Тергеубаев Р"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:284.2,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Ешмухаметов Ф"},{id:23,n:"JK-118",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:19,n:"JK-106",df:149.6,bf:0,wh:11,dh:0,fuel:150,dt:"",overDrill:0,downtime:0,operator:"Мизанов Б"},{id:24,n:"JK-122",df:133.6,bf:0,wh:6.0,dh:5.0,fuel:0,dt:"Перегон",overDrill:0,downtime:5.0,operator:"Жоламанулы А"},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"Простой",hours:2.0},{reason:"Перегон",hours:5.0}],rigEntries:[]},
  {id:11021,oid:3,date:"2026-03-11",sh:"night",status:"approved",by:"foreman4",submittedAt:"2026-03-11T08:00:00",approvedAt:"2026-03-11T09:00:00",comment:"Отогрев. Замерзло ДТ",fuel:963,fuel_kg:0,df:1345.7,bf:0,wh:63.0,dh:3.0,overDrill:0,rigs:[{id:10,n:"JK-112",df:200.2,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Сорвачев А"},{id:11,n:"JK-113",df:220.0,bf:0,wh:11,dh:0,fuel:300,dt:"",overDrill:0,downtime:0,operator:"Рябцев А"},{id:12,n:"JK-114",df:302.5,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Жогин А"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:315.5,bf:0,wh:11,dh:0,fuel:545,dt:"",overDrill:0,downtime:0,operator:"Балтабеков А"},{id:23,n:"JK-118",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:19,n:"JK-106",df:157.4,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Мезенцев Д"},{id:24,n:"JK-122",df:150.1,bf:0,wh:8.0,dh:3.0,fuel:118,dt:"Отогрев. Замерзло ДТ",overDrill:0,downtime:3.0,operator:"Жогин А"},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"Отогрев. Замерзло ДТ",hours:3.0}],rigEntries:[]},
  {id:11022,oid:3,date:"2026-03-12",sh:"day",status:"approved",by:"foreman4",submittedAt:"2026-03-12T08:00:00",approvedAt:"2026-03-12T09:00:00",comment:"ОФР",fuel:280,fuel_kg:0,df:1332.4,bf:0,wh:62.0,dh:4.0,overDrill:0,rigs:[{id:10,n:"JK-112",df:82.0,bf:0,wh:9.0,dh:2.0,fuel:0,dt:"ОФР",overDrill:0,downtime:2.0,operator:"Кудряшов К"},{id:11,n:"JK-113",df:286.8,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Литвиненко Е"},{id:12,n:"JK-114",df:261.7,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Тергеубаев Р"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:237.1,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Ешмухаметов Ф"},{id:23,n:"JK-118",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:19,n:"JK-106",df:233.1,bf:0,wh:11,dh:0,fuel:280,dt:"",overDrill:0,downtime:0,operator:"Мизанов Б"},{id:24,n:"JK-122",df:231.7,bf:0,wh:9.0,dh:2.0,fuel:0,dt:"ОФР",overDrill:0,downtime:2.0,operator:"Жоламанулы А"},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"ОФР",hours:2.0},{reason:"ОФР",hours:2.0}],rigEntries:[]},
  {id:11023,oid:3,date:"2026-03-12",sh:"night",status:"approved",by:"foreman4",submittedAt:"2026-03-12T08:00:00",approvedAt:"2026-03-12T09:00:00",comment:"ОФР",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:66.0,overDrill:0,rigs:[{id:10,n:"JK-112",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Сорвачев А"},{id:11,n:"JK-113",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Рябцев А"},{id:12,n:"JK-114",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Жогин А"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"",overDrill:0,downtime:11.0,operator:"Балтабеков А"},{id:23,n:"JK-118",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:19,n:"JK-106",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Мезенцев Д"},{id:24,n:"JK-122",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Жогин А"},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"Простой",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0}],rigEntries:[]},
  {id:11024,oid:3,date:"2026-03-13",sh:"day",status:"approved",by:"foreman4",submittedAt:"2026-03-13T08:00:00",approvedAt:"2026-03-13T09:00:00",comment:"ОФР",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:66.0,overDrill:0,rigs:[{id:10,n:"JK-112",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Кудряшов К"},{id:11,n:"JK-113",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Литвиненко Е"},{id:12,n:"JK-114",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Тергеубаев Р"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"",overDrill:0,downtime:11.0,operator:"Ешмухаметов Ф"},{id:23,n:"JK-118",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:19,n:"JK-106",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Мизанов Б"},{id:24,n:"JK-122",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Жоламанулы А"},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"Простой",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0}],rigEntries:[]},
  {id:11025,oid:3,date:"2026-03-13",sh:"night",status:"approved",by:"foreman4",submittedAt:"2026-03-13T08:00:00",approvedAt:"2026-03-13T09:00:00",comment:"ОФР; Перебуры. ОФР",fuel:0,fuel_kg:0,df:0,bf:0,wh:6.0,dh:60.0,overDrill:35.0,rigs:[{id:10,n:"JK-112",df:0,bf:0,wh:1.0,dh:10.0,fuel:0,dt:"Перебуры. ОФР",overDrill:15.0,downtime:10.0,operator:"Сорвачев А"},{id:11,n:"JK-113",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Рябцев А"},{id:12,n:"JK-114",df:0,bf:0,wh:4.0,dh:7.0,fuel:0,dt:"ОФР",overDrill:10.0,downtime:7.0,operator:"Жогин А"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:0,bf:0,wh:1.0,dh:10.0,fuel:0,dt:"",overDrill:10.0,downtime:10.0,operator:"Балтабеков А"},{id:23,n:"JK-118",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:19,n:"JK-106",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Мезенцев Д"},{id:24,n:"JK-122",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Жогин А"},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"Перебуры. ОФР",hours:10.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:7.0},{reason:"Простой",hours:10.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0}],rigEntries:[]},
  {id:11026,oid:3,date:"2026-03-14",sh:"day",status:"approved",by:"foreman4",submittedAt:"2026-03-14T08:00:00",approvedAt:"2026-03-14T09:00:00",comment:"ОФР",fuel:0,fuel_kg:0,df:218.3,bf:0,wh:15.0,dh:40.0,overDrill:0,rigs:[{id:10,n:"JK-112",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Кудряшов К"},{id:11,n:"JK-113",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Литвиненко Е"},{id:12,n:"JK-114",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Тергеубаев Р"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:130.5,bf:0,wh:6.0,dh:5.0,fuel:0,dt:"",overDrill:0,downtime:5.0,operator:"Ешмухаметов Ф"},{id:23,n:"JK-118",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:19,n:"JK-106",df:87.8,bf:0,wh:5.0,dh:6.0,fuel:0,dt:"ОФР",overDrill:0,downtime:6.0,operator:"Мизанов Б"},{id:24,n:"JK-122",df:0,bf:0,wh:4.0,dh:7.0,fuel:0,dt:"ОФР",overDrill:0,downtime:7.0,operator:"Жоламанулы А"},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"Простой",hours:5.0},{reason:"ОФР",hours:6.0},{reason:"ОФР",hours:7.0}],rigEntries:[]},
  {id:11027,oid:3,date:"2026-03-14",sh:"night",status:"approved",by:"foreman4",submittedAt:"2026-03-14T08:00:00",approvedAt:"2026-03-14T09:00:00",comment:"ОФР",fuel:400,fuel_kg:0,df:1125.0,bf:0,wh:56.0,dh:10.0,overDrill:4.0,rigs:[{id:10,n:"JK-112",df:145.1,bf:0,wh:6.0,dh:5.0,fuel:0,dt:"",overDrill:0,downtime:5.0,operator:"Сорвачев А"},{id:11,n:"JK-113",df:151.2,bf:0,wh:11,dh:0,fuel:100,dt:"",overDrill:0,downtime:0,operator:"Рябцев А"},{id:12,n:"JK-114",df:118.4,bf:0,wh:6.0,dh:5.0,fuel:0,dt:"ОФР",overDrill:0,downtime:5.0,operator:"Жогин А"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:242.7,bf:0,wh:11,dh:0,fuel:300,dt:"",overDrill:4.0,downtime:0,operator:"Балтабеков А"},{id:23,n:"JK-118",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:19,n:"JK-106",df:159.6,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Мезенцев Д"},{id:24,n:"JK-122",df:308.0,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Жогин А"},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"Простой",hours:5.0},{reason:"ОФР",hours:5.0}],rigEntries:[]},
  {id:11028,oid:3,date:"2026-03-15",sh:"day",status:"approved",by:"foreman4",submittedAt:"2026-03-15T08:00:00",approvedAt:"2026-03-15T09:00:00",comment:"ОФР",fuel:0,fuel_kg:0,df:1212.7,bf:0,wh:38.0,dh:6.0,overDrill:30.0,rigs:[{id:10,n:"JK-112",df:402.5,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Кудряшов К"},{id:11,n:"JK-113",df:285.7,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Литвиненко Е"},{id:12,n:"JK-114",df:376.0,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Тергеубаев Р"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:16.0,downtime:0,operator:"Ешмухаметов Ф"},{id:23,n:"JK-118",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:19,n:"JK-106",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:14.0,downtime:0,operator:"Мизанов Б"},{id:24,n:"JK-122",df:148.5,bf:0,wh:5.0,dh:6.0,fuel:0,dt:"ОФР",overDrill:0,downtime:6.0,operator:"Жоламанулы А"},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"ОФР",hours:6.0}],rigEntries:[]},
  {id:11029,oid:3,date:"2026-03-15",sh:"night",status:"approved",by:"foreman4",submittedAt:"2026-03-15T08:00:00",approvedAt:"2026-03-15T09:00:00",comment:"ОФР; Продувка, смазка, протирка",fuel:188,fuel_kg:0,df:323.7,bf:0,wh:27.0,dh:39.0,overDrill:0,rigs:[{id:10,n:"JK-112",df:50.8,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Сорвачев А"},{id:11,n:"JK-113",df:38.5,bf:0,wh:4.0,dh:7.0,fuel:0,dt:"ОФР",overDrill:0,downtime:7.0,operator:"Рябцев А"},{id:12,n:"JK-114",df:56.1,bf:0,wh:3.0,dh:8.0,fuel:0,dt:"ОФР",overDrill:0,downtime:8.0,operator:"Жогин А"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"",overDrill:0,downtime:11.0,operator:"Балтабеков А"},{id:23,n:"JK-118",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:19,n:"JK-106",df:6.4,bf:0,wh:2.0,dh:9.0,fuel:0,dt:"ОФР",overDrill:0,downtime:9.0,operator:"Мезенцев Д"},{id:24,n:"JK-122",df:171.9,bf:0,wh:7.0,dh:4.0,fuel:188,dt:"Продувка, смазка, протирка",overDrill:0,downtime:4.0,operator:"Жогин А"},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"ОФР",hours:7.0},{reason:"ОФР",hours:8.0},{reason:"Простой",hours:11.0},{reason:"ОФР",hours:9.0},{reason:"Продувка, смазка, протирка",hours:4.0}],rigEntries:[]},
  {id:11030,oid:3,date:"2026-03-16",sh:"day",status:"approved",by:"foreman4",submittedAt:"2026-03-16T08:00:00",approvedAt:"2026-03-16T09:00:00",comment:"ОФР; Ремонт",fuel:330,fuel_kg:0,df:606.9,bf:0,wh:43.0,dh:23.0,overDrill:0,rigs:[{id:10,n:"JK-112",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"Ремонт",overDrill:0,downtime:11.0,operator:"Кудряшов К"},{id:11,n:"JK-113",df:257.9,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Литвиненко Е"},{id:12,n:"JK-114",df:129.2,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Тергеубаев Р"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:79.1,bf:0,wh:6.0,dh:5.0,fuel:0,dt:"",overDrill:0,downtime:5.0,operator:"Ешмухаметов Ф"},{id:23,n:"JK-118",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:19,n:"JK-106",df:58.2,bf:0,wh:4.0,dh:7.0,fuel:330,dt:"ОФР",overDrill:0,downtime:7.0,operator:"Мизанов Б"},{id:24,n:"JK-122",df:82.5,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Жоламанулы А"},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"Ремонт",hours:11.0},{reason:"Простой",hours:5.0},{reason:"ОФР",hours:7.0}],rigEntries:[]},
  {id:11031,oid:3,date:"2026-03-16",sh:"night",status:"approved",by:"foreman4",submittedAt:"2026-03-16T08:00:00",approvedAt:"2026-03-16T09:00:00",comment:"ОФР",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:66.0,overDrill:0,rigs:[{id:10,n:"JK-112",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:""},{id:11,n:"JK-113",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:""},{id:12,n:"JK-114",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:""},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"",overDrill:0,downtime:11.0,operator:""},{id:23,n:"JK-118",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:19,n:"JK-106",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:""},{id:24,n:"JK-122",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:""},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"Простой",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0}],rigEntries:[]},
  {id:11032,oid:3,date:"2026-03-17",sh:"day",status:"approved",by:"foreman4",submittedAt:"2026-03-17T08:00:00",approvedAt:"2026-03-17T09:00:00",comment:"ОФР",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:66.0,overDrill:0,rigs:[{id:10,n:"JK-112",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:""},{id:11,n:"JK-113",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:""},{id:12,n:"JK-114",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:""},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"",overDrill:0,downtime:11.0,operator:""},{id:23,n:"JK-118",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:19,n:"JK-106",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:""},{id:24,n:"JK-122",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:""},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"Простой",hours:11.0},{reason:"ОФР",hours:11.0},{reason:"ОФР",hours:11.0}],rigEntries:[]},
  {id:11033,oid:3,date:"2026-03-17",sh:"night",status:"approved",by:"foreman4",submittedAt:"2026-03-17T08:00:00",approvedAt:"2026-03-17T09:00:00",comment:"ОФР; Перегон. ОФР",fuel:250,fuel_kg:0,df:360.8,bf:0,wh:10.0,dh:56.0,overDrill:0,rigs:[{id:10,n:"JK-112",df:55.0,bf:0,wh:2.0,dh:9.0,fuel:90,dt:"ОФР",overDrill:0,downtime:9.0,operator:"Дружинин П"},{id:11,n:"JK-113",df:170.3,bf:0,wh:3.0,dh:8.0,fuel:160,dt:"ОФР",overDrill:0,downtime:8.0,operator:"Абдыкаримов А"},{id:12,n:"JK-114",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Небога О"},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:53.0,bf:0,wh:2.0,dh:9.0,fuel:0,dt:"",overDrill:0,downtime:9.0,operator:"Гутов В"},{id:23,n:"JK-118",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:19,n:"JK-106",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:24,n:"JK-122",df:82.5,bf:0,wh:3.0,dh:8.0,fuel:0,dt:"ОФР",overDrill:0,downtime:8.0,operator:"Шандалимов Р"},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"Перегон. ОФР",overDrill:0,downtime:11.0,operator:"Леутин Д"}],downtime_events:[{reason:"ОФР",hours:9.0},{reason:"ОФР",hours:8.0},{reason:"ОФР",hours:11.0},{reason:"Простой",hours:9.0},{reason:"ОФР",hours:8.0},{reason:"Перегон. ОФР",hours:11.0}],rigEntries:[]},
  {id:11034,oid:3,date:"2026-03-18",sh:"day",status:"approved",by:"foreman4",submittedAt:"2026-03-18T08:00:00",approvedAt:"2026-03-18T09:00:00",comment:"ОФР; Перегон. ОФР",fuel:0,fuel_kg:0,df:1005.8,bf:0,wh:34.0,dh:32.0,overDrill:0,rigs:[{id:10,n:"JK-112",df:198.4,bf:0,wh:7.0,dh:4.0,fuel:0,dt:"ОФР",overDrill:0,downtime:4.0,operator:"Хорев А"},{id:11,n:"JK-113",df:218.4,bf:0,wh:7.0,dh:4.0,fuel:0,dt:"Перегон. ОФР",overDrill:0,downtime:4.0,operator:"Калыгин Г"},{id:12,n:"JK-114",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:""},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:202.7,bf:0,wh:7.0,dh:4.0,fuel:0,dt:"",overDrill:0,downtime:4.0,operator:"Ахметов М"},{id:23,n:"JK-118",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:19,n:"JK-106",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:24,n:"JK-122",df:157.0,bf:0,wh:6.0,dh:5.0,fuel:0,dt:"Перегон. ОФР",overDrill:0,downtime:5.0,operator:"Жанболатов Е"},{id:25,n:"JK-123",df:229.3,bf:0,wh:7.0,dh:4.0,fuel:0,dt:"ОФР",overDrill:0,downtime:4.0,operator:"Морозов В"}],downtime_events:[{reason:"ОФР",hours:4.0},{reason:"Перегон. ОФР",hours:4.0},{reason:"ОФР",hours:11.0},{reason:"Простой",hours:4.0},{reason:"Перегон. ОФР",hours:5.0},{reason:"ОФР",hours:4.0}],rigEntries:[]},
  {id:11035,oid:3,date:"2026-03-18",sh:"night",status:"approved",by:"foreman4",submittedAt:"2026-03-18T08:00:00",approvedAt:"2026-03-18T09:00:00",comment:"",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:0,overDrill:0,rigs:[{id:10,n:"JK-112",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:11,n:"JK-113",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:12,n:"JK-114",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:13,n:"JK-115",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:14,n:"JK-116",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:23,n:"JK-118",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:19,n:"JK-106",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:24,n:"JK-122",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:25,n:"JK-123",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[],rigEntries:[]},
  {id:13000,oid:4,date:"2026-03-01",sh:"day",status:"approved",by:"zhanab",submittedAt:"2026-03-01T08:00:00",approvedAt:"2026-03-01T09:00:00",comment:"Перегон; Замерзла трубка капиляра",fuel:872,fuel_kg:0,df:345.3,bf:0,wh:26.0,dh:7.0,overDrill:0,rigs:[{id:16,n:"JK-119",df:63.7,bf:0,wh:10.0,dh:1.0,fuel:421,dt:"Перегон",overDrill:0,downtime:1.0,operator:"Курышин О"},{id:17,n:"JK-120",df:264.0,bf:0,wh:11,dh:0,fuel:353,dt:"",overDrill:0,downtime:0,operator:"Тихомиров В"},{id:18,n:"JK-121",df:17.6,bf:0,wh:5.0,dh:6.0,fuel:98,dt:"Замерзла трубка капиляра",overDrill:0,downtime:6.0,operator:"Есимханов Ж"}],downtime_events:[{reason:"Перегон",hours:1.0},{reason:"Замерзла трубка капиляра",hours:6.0}],rigEntries:[]},
  {id:13001,oid:4,date:"2026-03-01",sh:"night",status:"approved",by:"zhanab",submittedAt:"2026-03-01T08:00:00",approvedAt:"2026-03-01T09:00:00",comment:"",fuel:308,fuel_kg:0,df:444.7,bf:0,wh:33,dh:0,overDrill:0,rigs:[{id:16,n:"JK-119",df:99.4,bf:0,wh:11,dh:0,fuel:308,dt:"",overDrill:0,downtime:0,operator:"Бочкарев С"},{id:17,n:"JK-120",df:241.8,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Шакенов Р"},{id:18,n:"JK-121",df:103.5,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Есимханов Е"}],downtime_events:[],rigEntries:[]},
  {id:13002,oid:4,date:"2026-03-02",sh:"day",status:"approved",by:"zhanab",submittedAt:"2026-03-02T08:00:00",approvedAt:"2026-03-02T09:00:00",comment:"",fuel:731,fuel_kg:0,df:640.8,bf:0,wh:33,dh:0,overDrill:0,rigs:[{id:16,n:"JK-119",df:115.4,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Курышин О"},{id:17,n:"JK-120",df:436.0,bf:0,wh:11,dh:0,fuel:205,dt:"",overDrill:0,downtime:0,operator:"Тихомиров В"},{id:18,n:"JK-121",df:89.4,bf:0,wh:11,dh:0,fuel:526,dt:"",overDrill:0,downtime:0,operator:"Есимханов Ж"}],downtime_events:[],rigEntries:[]},
  {id:13003,oid:4,date:"2026-03-02",sh:"night",status:"approved",by:"zhanab",submittedAt:"2026-03-02T08:00:00",approvedAt:"2026-03-02T09:00:00",comment:"",fuel:0,fuel_kg:0,df:385.0,bf:0,wh:33,dh:0,overDrill:0,rigs:[{id:16,n:"JK-119",df:107.8,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Бочкарев С"},{id:17,n:"JK-120",df:178.4,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Шакенов Р"},{id:18,n:"JK-121",df:98.8,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Есимханов Е"}],downtime_events:[],rigEntries:[]},
  {id:13004,oid:4,date:"2026-03-03",sh:"day",status:"approved",by:"zhanab",submittedAt:"2026-03-03T08:00:00",approvedAt:"2026-03-03T09:00:00",comment:"",fuel:922,fuel_kg:0,df:435.7,bf:0,wh:33,dh:0,overDrill:69.0,rigs:[{id:16,n:"JK-119",df:92.7,bf:0,wh:11,dh:0,fuel:378,dt:"",overDrill:0,downtime:0,operator:"Курышин О"},{id:17,n:"JK-120",df:343.0,bf:0,wh:11,dh:0,fuel:174,dt:"",overDrill:0,downtime:0,operator:"Тихомиров В"},{id:18,n:"JK-121",df:0,bf:0,wh:11,dh:0,fuel:370,dt:"",overDrill:69.0,downtime:0,operator:"Есимханов Ж"}],downtime_events:[],rigEntries:[]},
  {id:13005,oid:4,date:"2026-03-03",sh:"night",status:"approved",by:"zhanab",submittedAt:"2026-03-03T08:00:00",approvedAt:"2026-03-03T09:00:00",comment:"",fuel:1211,fuel_kg:0,df:294.4,bf:0,wh:33,dh:0,overDrill:57.0,rigs:[{id:16,n:"JK-119",df:0,bf:0,wh:11,dh:0,fuel:685,dt:"ТО станка",overDrill:0,downtime:0,operator:"Бочкарев С"},{id:17,n:"JK-120",df:280.4,bf:0,wh:11,dh:0,fuel:414,dt:"",overDrill:0,downtime:0,operator:"Шакенов Р"},{id:18,n:"JK-121",df:14.0,bf:0,wh:11,dh:0,fuel:112,dt:"",overDrill:57.0,downtime:0,operator:"Есимханов Е"}],downtime_events:[],rigEntries:[]},
  {id:13006,oid:4,date:"2026-03-04",sh:"day",status:"approved",by:"zhanab",submittedAt:"2026-03-04T08:00:00",approvedAt:"2026-03-04T09:00:00",comment:"",fuel:610,fuel_kg:0,df:563.0,bf:0,wh:30.0,dh:3.0,overDrill:36.0,rigs:[{id:16,n:"JK-119",df:0,bf:0,wh:11,dh:0,fuel:240,dt:"",overDrill:36.0,downtime:0,operator:"Курышин О"},{id:17,n:"JK-120",df:447.0,bf:0,wh:8.0,dh:3.0,fuel:0,dt:"",overDrill:0,downtime:3.0,operator:"Тихомиров В"},{id:18,n:"JK-121",df:116.0,bf:0,wh:11,dh:0,fuel:370,dt:"",overDrill:0,downtime:0,operator:"Есимханов Ж"}],downtime_events:[{reason:"Простой",hours:3.0}],rigEntries:[]},
  {id:13007,oid:4,date:"2026-03-04",sh:"night",status:"approved",by:"zhanab",submittedAt:"2026-03-04T08:00:00",approvedAt:"2026-03-04T09:00:00",comment:"ТО компрессора",fuel:881,fuel_kg:0,df:341.9,bf:0,wh:31.0,dh:2.0,overDrill:6.0,rigs:[{id:16,n:"JK-119",df:58.3,bf:0,wh:11,dh:0,fuel:227,dt:"",overDrill:6.0,downtime:0,operator:"Бочкарев С"},{id:17,n:"JK-120",df:180.0,bf:0,wh:11,dh:0,fuel:314,dt:"",overDrill:0,downtime:0,operator:"Шакенов Р"},{id:18,n:"JK-121",df:103.6,bf:0,wh:9.0,dh:2.0,fuel:340,dt:"ТО компрессора",overDrill:0,downtime:2.0,operator:"Есимханов Е"}],downtime_events:[{reason:"ТО компрессора",hours:2.0}],rigEntries:[]},
  {id:13008,oid:4,date:"2026-03-05",sh:"day",status:"approved",by:"zhanab",submittedAt:"2026-03-05T08:00:00",approvedAt:"2026-03-05T09:00:00",comment:"",fuel:976,fuel_kg:0,df:287.6,bf:0,wh:27.0,dh:6.0,overDrill:0,rigs:[{id:16,n:"JK-119",df:0,bf:0,wh:11,dh:0,fuel:320,dt:"",overDrill:0,downtime:0,operator:"Курышин О"},{id:17,n:"JK-120",df:176.0,bf:0,wh:5.0,dh:6.0,fuel:156,dt:"",overDrill:0,downtime:6.0,operator:"Тихомиров В"},{id:18,n:"JK-121",df:111.6,bf:0,wh:11,dh:0,fuel:500,dt:"",overDrill:0,downtime:0,operator:"Есимханов Ж"}],downtime_events:[{reason:"Простой",hours:6.0}],rigEntries:[]},
  {id:13009,oid:4,date:"2026-03-05",sh:"night",status:"approved",by:"zhanab",submittedAt:"2026-03-05T08:00:00",approvedAt:"2026-03-05T09:00:00",comment:"",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:0,overDrill:0,rigs:[{id:16,n:"JK-119",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Бочкарев С"},{id:17,n:"JK-120",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Шакенов Р"},{id:18,n:"JK-121",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Есимханов Е"}],downtime_events:[],rigEntries:[]},
  {id:13010,oid:4,date:"2026-03-06",sh:"day",status:"approved",by:"zhanab",submittedAt:"2026-03-06T08:00:00",approvedAt:"2026-03-06T09:00:00",comment:"",fuel:1060,fuel_kg:0,df:499.5,bf:0,wh:31.0,dh:2.0,overDrill:0,rigs:[{id:16,n:"JK-119",df:66.4,bf:0,wh:11,dh:0,fuel:440,dt:"",overDrill:0,downtime:0,operator:"Курышин О"},{id:17,n:"JK-120",df:389.0,bf:0,wh:9.0,dh:2.0,fuel:150,dt:"",overDrill:0,downtime:2.0,operator:"Тихомиров В"},{id:18,n:"JK-121",df:44.1,bf:0,wh:11,dh:0,fuel:470,dt:"",overDrill:0,downtime:0,operator:"Есимханов Ж"}],downtime_events:[{reason:"Простой",hours:2.0}],rigEntries:[]},
  {id:13011,oid:4,date:"2026-03-06",sh:"night",status:"approved",by:"zhanab",submittedAt:"2026-03-06T08:00:00",approvedAt:"2026-03-06T09:00:00",comment:"ОФР",fuel:623,fuel_kg:0,df:258.3,bf:0,wh:15.0,dh:18.0,overDrill:16.0,rigs:[{id:16,n:"JK-119",df:0,bf:0,wh:6.0,dh:5.0,fuel:200,dt:"ОФР",overDrill:7.0,downtime:5.0,operator:"Бочкарев С"},{id:17,n:"JK-120",df:258.3,bf:0,wh:7.0,dh:4.0,fuel:329,dt:"",overDrill:0,downtime:4.0,operator:"Шакенов Р"},{id:18,n:"JK-121",df:0,bf:0,wh:2.0,dh:9.0,fuel:94,dt:"ОФР",overDrill:9.0,downtime:9.0,operator:"Есимханов Е"}],downtime_events:[{reason:"ОФР",hours:5.0},{reason:"Простой",hours:4.0},{reason:"ОФР",hours:9.0}],rigEntries:[]},
  {id:13012,oid:4,date:"2026-03-07",sh:"day",status:"approved",by:"zhanab",submittedAt:"2026-03-07T08:00:00",approvedAt:"2026-03-07T09:00:00",comment:"ОФР",fuel:710,fuel_kg:0,df:507.6,bf:0,wh:28.0,dh:5.0,overDrill:0,rigs:[{id:16,n:"JK-119",df:70.9,bf:0,wh:10.0,dh:1.0,fuel:370,dt:"ОФР",overDrill:0,downtime:1.0,operator:"Курышин О"},{id:17,n:"JK-120",df:360.0,bf:0,wh:8.0,dh:3.0,fuel:140,dt:"",overDrill:0,downtime:3.0,operator:"Тихомиров В"},{id:18,n:"JK-121",df:76.7,bf:0,wh:10.0,dh:1.0,fuel:200,dt:"ОФР",overDrill:0,downtime:1.0,operator:"Есимханов Ж"}],downtime_events:[{reason:"ОФР",hours:1.0},{reason:"Простой",hours:3.0},{reason:"ОФР",hours:1.0}],rigEntries:[]},
  {id:13013,oid:4,date:"2026-03-07",sh:"night",status:"approved",by:"zhanab",submittedAt:"2026-03-07T08:00:00",approvedAt:"2026-03-07T09:00:00",comment:"ОФР; Перегон. Дорога закрыта",fuel:778,fuel_kg:0,df:243.8,bf:0,wh:16.0,dh:17.0,overDrill:0,rigs:[{id:16,n:"JK-119",df:33.0,bf:0,wh:4.0,dh:7.0,fuel:197,dt:"Перегон. Дорога закрыта",overDrill:0,downtime:7.0,operator:"Бочкарев С"},{id:17,n:"JK-120",df:165.2,bf:0,wh:8.0,dh:3.0,fuel:383,dt:"",overDrill:0,downtime:3.0,operator:"Шакенов Р"},{id:18,n:"JK-121",df:45.6,bf:0,wh:4.0,dh:7.0,fuel:198,dt:"ОФР",overDrill:0,downtime:7.0,operator:"Есимханов Е"}],downtime_events:[{reason:"Перегон. Дорога закрыта",hours:7.0},{reason:"Простой",hours:3.0},{reason:"ОФР",hours:7.0}],rigEntries:[]},
  {id:13014,oid:4,date:"2026-03-08",sh:"day",status:"approved",by:"zhanab",submittedAt:"2026-03-08T08:00:00",approvedAt:"2026-03-08T09:00:00",comment:"Зачистка, Перегон; Ожидание зачистки дороги",fuel:380,fuel_kg:0,df:395.3,bf:0,wh:21.0,dh:12.0,overDrill:0,rigs:[{id:16,n:"JK-119",df:56.6,bf:0,wh:7.0,dh:4.0,fuel:110,dt:"Зачистка, Перегон",overDrill:0,downtime:4.0,operator:"Курышин О"},{id:17,n:"JK-120",df:269.9,bf:0,wh:7.0,dh:4.0,fuel:0,dt:"",overDrill:0,downtime:4.0,operator:"Тихомиров В"},{id:18,n:"JK-121",df:68.8,bf:0,wh:7.0,dh:4.0,fuel:270,dt:"Ожидание зачистки дороги",overDrill:0,downtime:4.0,operator:"Есимханов Ж"}],downtime_events:[{reason:"Зачистка, Перегон",hours:4.0},{reason:"Простой",hours:4.0},{reason:"Ожидание зачистки дороги",hours:4.0}],rigEntries:[]},
  {id:13015,oid:4,date:"2026-03-08",sh:"night",status:"approved",by:"zhanab",submittedAt:"2026-03-08T08:00:00",approvedAt:"2026-03-08T09:00:00",comment:"Перегон",fuel:597,fuel_kg:0,df:389.9,bf:0,wh:30.0,dh:3.0,overDrill:0,rigs:[{id:16,n:"JK-119",df:104.5,bf:0,wh:11,dh:0,fuel:206,dt:"",overDrill:0,downtime:0,operator:"Бочкарев С"},{id:17,n:"JK-120",df:177.0,bf:0,wh:9.0,dh:2.0,fuel:200,dt:"",overDrill:0,downtime:2.0,operator:"Тихомиров В"},{id:18,n:"JK-121",df:108.4,bf:0,wh:10.0,dh:1.0,fuel:191,dt:"Перегон",overDrill:0,downtime:1.0,operator:"Есимханов Е"}],downtime_events:[{reason:"Простой",hours:2.0},{reason:"Перегон",hours:1.0}],rigEntries:[]},
  {id:13016,oid:4,date:"2026-03-09",sh:"day",status:"approved",by:"zhanab",submittedAt:"2026-03-09T08:00:00",approvedAt:"2026-03-09T09:00:00",comment:"",fuel:0,fuel_kg:0,df:351.8,bf:0,wh:33,dh:0,overDrill:0,rigs:[{id:16,n:"JK-119",df:95.3,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Курышин О"},{id:17,n:"JK-120",df:141.2,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Шакенов Р"},{id:18,n:"JK-121",df:115.3,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Есимханов Ж"}],downtime_events:[],rigEntries:[]},
  {id:13017,oid:4,date:"2026-03-09",sh:"night",status:"approved",by:"zhanab",submittedAt:"2026-03-09T08:00:00",approvedAt:"2026-03-09T09:00:00",comment:"",fuel:888,fuel_kg:0,df:249.3,bf:0,wh:26.0,dh:7.0,overDrill:0,rigs:[{id:16,n:"JK-119",df:0,bf:0,wh:11,dh:0,fuel:194,dt:"",overDrill:0,downtime:0,operator:"Бочкарев С"},{id:17,n:"JK-120",df:155.0,bf:0,wh:4.0,dh:7.0,fuel:448,dt:"",overDrill:0,downtime:7.0,operator:"Тихомиров В"},{id:18,n:"JK-121",df:94.3,bf:0,wh:11,dh:0,fuel:246,dt:"",overDrill:0,downtime:0,operator:"Есимханов Е"}],downtime_events:[{reason:"Простой",hours:7.0}],rigEntries:[]},
  {id:13018,oid:4,date:"2026-03-10",sh:"day",status:"approved",by:"zhanab",submittedAt:"2026-03-10T08:00:00",approvedAt:"2026-03-10T09:00:00",comment:"ОФР",fuel:960,fuel_kg:0,df:452.0,bf:0,wh:28.0,dh:5.0,overDrill:0,rigs:[{id:16,n:"JK-119",df:26.0,bf:0,wh:6.0,dh:5.0,fuel:360,dt:"ОФР",overDrill:0,downtime:5.0,operator:"Курышин О"},{id:17,n:"JK-120",df:218.7,bf:0,wh:11,dh:0,fuel:150,dt:"",overDrill:0,downtime:0,operator:"Шакенов Р"},{id:18,n:"JK-121",df:207.3,bf:0,wh:11,dh:0,fuel:450,dt:"",overDrill:0,downtime:0,operator:"Есимханов Ж"}],downtime_events:[{reason:"ОФР",hours:5.0}],rigEntries:[]},
  {id:13019,oid:4,date:"2026-03-10",sh:"night",status:"approved",by:"zhanab",submittedAt:"2026-03-10T08:00:00",approvedAt:"2026-03-10T09:00:00",comment:"Отсутствие дороги на заправку",fuel:185,fuel_kg:0,df:533.7,bf:0,wh:31.0,dh:2.0,overDrill:12.0,rigs:[{id:16,n:"JK-119",df:30.0,bf:0,wh:11,dh:0,fuel:185,dt:"",overDrill:12.0,downtime:0,operator:"Бочкарев С"},{id:17,n:"JK-120",df:216.0,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Тихомиров В"},{id:18,n:"JK-121",df:287.7,bf:0,wh:9.0,dh:2.0,fuel:0,dt:"Отсутствие дороги на заправку",overDrill:0,downtime:2.0,operator:"Есимханов Е"}],downtime_events:[{reason:"Отсутствие дороги на заправку",hours:2.0}],rigEntries:[]},
  {id:13020,oid:4,date:"2026-03-11",sh:"day",status:"approved",by:"zhanab",submittedAt:"2026-03-11T08:00:00",approvedAt:"2026-03-11T09:00:00",comment:"ОФР; ОФР. Перегон",fuel:740,fuel_kg:0,df:0,bf:0,wh:5.0,dh:28.0,overDrill:0,rigs:[{id:16,n:"JK-119",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Курышин О"},{id:17,n:"JK-120",df:0,bf:0,wh:0,dh:11.0,fuel:480,dt:"",overDrill:0,downtime:11.0,operator:"Шакенов Р"},{id:18,n:"JK-121",df:0,bf:0,wh:5.0,dh:6.0,fuel:260,dt:"ОФР. Перегон",overDrill:0,downtime:6.0,operator:"Есимханов Ж"}],downtime_events:[{reason:"ОФР",hours:11.0},{reason:"Простой",hours:11.0},{reason:"ОФР. Перегон",hours:6.0}],rigEntries:[]},
  {id:13021,oid:4,date:"2026-03-11",sh:"night",status:"approved",by:"zhanab",submittedAt:"2026-03-11T08:00:00",approvedAt:"2026-03-11T09:00:00",comment:"ОФР",fuel:0,fuel_kg:0,df:152.0,bf:0,wh:6.0,dh:27.0,overDrill:0,rigs:[{id:16,n:"JK-119",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Бочкарев С"},{id:17,n:"JK-120",df:152.0,bf:0,wh:6.0,dh:5.0,fuel:0,dt:"",overDrill:0,downtime:5.0,operator:"Тихомиров В"},{id:18,n:"JK-121",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Есимханов Е"}],downtime_events:[{reason:"ОФР",hours:11.0},{reason:"Простой",hours:5.0},{reason:"ОФР",hours:11.0}],rigEntries:[]},
  {id:13022,oid:4,date:"2026-03-12",sh:"day",status:"approved",by:"zhanab",submittedAt:"2026-03-12T08:00:00",approvedAt:"2026-03-12T09:00:00",comment:"ОФР",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:33.0,overDrill:0,rigs:[{id:16,n:"JK-119",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Курышин О"},{id:17,n:"JK-120",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"",overDrill:0,downtime:11.0,operator:"Шакенов Р"},{id:18,n:"JK-121",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Есимханов Ж"}],downtime_events:[{reason:"ОФР",hours:11.0},{reason:"Простой",hours:11.0},{reason:"ОФР",hours:11.0}],rigEntries:[]},
  {id:13023,oid:4,date:"2026-03-12",sh:"night",status:"approved",by:"zhanab",submittedAt:"2026-03-12T08:00:00",approvedAt:"2026-03-12T09:00:00",comment:"ТО станка. ОФР; ТО станка",fuel:300,fuel_kg:0,df:82.5,bf:0,wh:9.0,dh:24.0,overDrill:0,rigs:[{id:16,n:"JK-119",df:10.0,bf:0,wh:3.0,dh:8.0,fuel:300,dt:"ТО станка",overDrill:0,downtime:8.0,operator:"Бочкарев С"},{id:17,n:"JK-120",df:72.5,bf:0,wh:3.0,dh:8.0,fuel:0,dt:"",overDrill:0,downtime:8.0,operator:"Тихомиров В"},{id:18,n:"JK-121",df:0,bf:0,wh:3.0,dh:8.0,fuel:0,dt:"ТО станка. ОФР",overDrill:0,downtime:8.0,operator:"Есимханов Е"}],downtime_events:[{reason:"ТО станка",hours:8.0},{reason:"Простой",hours:8.0},{reason:"ТО станка. ОФР",hours:8.0}],rigEntries:[]},
  {id:13024,oid:4,date:"2026-03-13",sh:"day",status:"approved",by:"zhanab",submittedAt:"2026-03-13T08:00:00",approvedAt:"2026-03-13T09:00:00",comment:"",fuel:830,fuel_kg:0,df:476.5,bf:0,wh:28.0,dh:5.0,overDrill:0,rigs:[{id:16,n:"JK-119",df:194.0,bf:0,wh:11,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:"Курышин О"},{id:17,n:"JK-120",df:106.6,bf:0,wh:6.0,dh:5.0,fuel:500,dt:"",overDrill:0,downtime:5.0,operator:"Шакенов Р"},{id:18,n:"JK-121",df:175.9,bf:0,wh:11,dh:0,fuel:330,dt:"",overDrill:0,downtime:0,operator:"Есимханов Ж"}],downtime_events:[{reason:"Простой",hours:5.0}],rigEntries:[]},
  {id:13025,oid:4,date:"2026-03-13",sh:"night",status:"approved",by:"zhanab",submittedAt:"2026-03-13T08:00:00",approvedAt:"2026-03-13T09:00:00",comment:"",fuel:729,fuel_kg:0,df:422.1,bf:0,wh:26.0,dh:7.0,overDrill:0,rigs:[{id:16,n:"JK-119",df:146.8,bf:0,wh:11,dh:0,fuel:369,dt:"",overDrill:0,downtime:0,operator:"Бочкарев С"},{id:17,n:"JK-120",df:102.0,bf:0,wh:4.0,dh:7.0,fuel:0,dt:"",overDrill:0,downtime:7.0,operator:"Тихомиров В"},{id:18,n:"JK-121",df:173.3,bf:0,wh:11,dh:0,fuel:360,dt:"",overDrill:0,downtime:0,operator:"Есимханов Е"}],downtime_events:[{reason:"Простой",hours:7.0}],rigEntries:[]},
  {id:13026,oid:4,date:"2026-03-14",sh:"day",status:"approved",by:"zhanab",submittedAt:"2026-03-14T08:00:00",approvedAt:"2026-03-14T09:00:00",comment:"ОФР",fuel:1035,fuel_kg:0,df:499.9,bf:0,wh:27.0,dh:6.0,overDrill:0,rigs:[{id:16,n:"JK-119",df:182.7,bf:0,wh:11,dh:0,fuel:385,dt:"",overDrill:0,downtime:0,operator:"Курышин О"},{id:17,n:"JK-120",df:109.0,bf:0,wh:7.0,dh:4.0,fuel:150,dt:"",overDrill:0,downtime:4.0,operator:"Шакенов Р"},{id:18,n:"JK-121",df:208.2,bf:0,wh:9.0,dh:2.0,fuel:500,dt:"ОФР",overDrill:0,downtime:2.0,operator:"Есимханов Ж"}],downtime_events:[{reason:"Простой",hours:4.0},{reason:"ОФР",hours:2.0}],rigEntries:[]},
  {id:13027,oid:4,date:"2026-03-14",sh:"night",status:"approved",by:"zhanab",submittedAt:"2026-03-14T08:00:00",approvedAt:"2026-03-14T09:00:00",comment:"Перегон",fuel:657,fuel_kg:0,df:648.7,bf:0,wh:28.0,dh:5.0,overDrill:8.0,rigs:[{id:16,n:"JK-119",df:154.1,bf:0,wh:9.0,dh:2.0,fuel:47,dt:"Перегон",overDrill:8.0,downtime:2.0,operator:"Бочкарев С"},{id:17,n:"JK-120",df:347.0,bf:0,wh:9.0,dh:2.0,fuel:334,dt:"",overDrill:0,downtime:2.0,operator:"Тихомиров В"},{id:18,n:"JK-121",df:147.6,bf:0,wh:10.0,dh:1.0,fuel:276,dt:"Перегон",overDrill:0,downtime:1.0,operator:"Есимханов Е"}],downtime_events:[{reason:"Перегон",hours:2.0},{reason:"Простой",hours:2.0},{reason:"Перегон",hours:1.0}],rigEntries:[]},
  {id:13028,oid:4,date:"2026-03-15",sh:"day",status:"approved",by:"zhanab",submittedAt:"2026-03-15T08:00:00",approvedAt:"2026-03-15T09:00:00",comment:"ОФР",fuel:485,fuel_kg:0,df:219.9,bf:0,wh:7.0,dh:26.0,overDrill:0,rigs:[{id:16,n:"JK-119",df:0,bf:0,wh:0,dh:11.0,fuel:250,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Курышин О"},{id:17,n:"JK-120",df:219.9,bf:0,wh:7.0,dh:4.0,fuel:175,dt:"",overDrill:0,downtime:4.0,operator:"Шакенов Р"},{id:18,n:"JK-121",df:0,bf:0,wh:0,dh:11.0,fuel:60,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Есимханов Ж"}],downtime_events:[{reason:"ОФР",hours:11.0},{reason:"Простой",hours:4.0},{reason:"ОФР",hours:11.0}],rigEntries:[]},
  {id:13029,oid:4,date:"2026-03-15",sh:"night",status:"approved",by:"zhanab",submittedAt:"2026-03-15T08:00:00",approvedAt:"2026-03-15T09:00:00",comment:"ОФР",fuel:0,fuel_kg:0,df:66.0,bf:0,wh:7.0,dh:26.0,overDrill:0,rigs:[{id:16,n:"JK-119",df:0,bf:0,wh:5.0,dh:6.0,fuel:0,dt:"ОФР",overDrill:0,downtime:6.0,operator:"Бочкарев С"},{id:17,n:"JK-120",df:66.0,bf:0,wh:2.0,dh:9.0,fuel:0,dt:"",overDrill:0,downtime:9.0,operator:"Тихомиров В"},{id:18,n:"JK-121",df:0,bf:0,wh:0,dh:11.0,fuel:0,dt:"ОФР",overDrill:0,downtime:11.0,operator:"Есимханов Е"}],downtime_events:[{reason:"ОФР",hours:6.0},{reason:"Простой",hours:9.0},{reason:"ОФР",hours:11.0}],rigEntries:[]},
  {id:13030,oid:4,date:"2026-03-16",sh:"day",status:"approved",by:"zhanab",submittedAt:"2026-03-16T08:00:00",approvedAt:"2026-03-16T09:00:00",comment:"",fuel:690,fuel_kg:0,df:485.4,bf:0,wh:30.0,dh:3.0,overDrill:0,rigs:[{id:16,n:"JK-119",df:106.4,bf:0,wh:11,dh:0,fuel:200,dt:"",overDrill:0,downtime:0,operator:"Курышин О"},{id:17,n:"JK-120",df:273.6,bf:0,wh:8.0,dh:3.0,fuel:240,dt:"",overDrill:0,downtime:3.0,operator:"Шакенов Р"},{id:18,n:"JK-121",df:105.4,bf:0,wh:11,dh:0,fuel:250,dt:"",overDrill:0,downtime:0,operator:"Есимханов Ж"}],downtime_events:[{reason:"Простой",hours:3.0}],rigEntries:[]},
  {id:13031,oid:4,date:"2026-03-16",sh:"night",status:"approved",by:"zhanab",submittedAt:"2026-03-16T08:00:00",approvedAt:"2026-03-16T09:00:00",comment:"",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:0,overDrill:0,rigs:[{id:16,n:"JK-119",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:17,n:"JK-120",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:18,n:"JK-121",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[],rigEntries:[]},
  {id:13032,oid:4,date:"2026-03-17",sh:"day",status:"approved",by:"zhanab",submittedAt:"2026-03-17T08:00:00",approvedAt:"2026-03-17T09:00:00",comment:"",fuel:929,fuel_kg:0,df:245.8,bf:0,wh:30.0,dh:3.0,overDrill:0,rigs:[{id:16,n:"JK-119",df:60.3,bf:0,wh:8.0,dh:3.0,fuel:260,dt:"",overDrill:0,downtime:3.0,operator:"Касенов А."},{id:17,n:"JK-120",df:108.5,bf:0,wh:11,dh:0,fuel:290,dt:"",overDrill:0,downtime:0,operator:"Иванов М"},{id:18,n:"JK-121",df:77.0,bf:0,wh:11,dh:0,fuel:379,dt:"",overDrill:0,downtime:0,operator:"Алмас Г"}],downtime_events:[{reason:"Простой",hours:3.0}],rigEntries:[]},
  {id:13033,oid:4,date:"2026-03-17",sh:"night",status:"approved",by:"zhanab",submittedAt:"2026-03-17T08:00:00",approvedAt:"2026-03-17T09:00:00",comment:"",fuel:804,fuel_kg:0,df:357.0,bf:0,wh:31.0,dh:2.0,overDrill:0,rigs:[{id:16,n:"JK-119",df:96.4,bf:0,wh:11,dh:0,fuel:381,dt:"",overDrill:0,downtime:0,operator:"Грешин А"},{id:17,n:"JK-120",df:170.8,bf:0,wh:9.0,dh:2.0,fuel:171,dt:"",overDrill:0,downtime:2.0,operator:"Гурецкий А"},{id:18,n:"JK-121",df:89.8,bf:0,wh:11,dh:0,fuel:252,dt:"",overDrill:0,downtime:0,operator:"Абикенулы А"}],downtime_events:[{reason:"Простой",hours:2.0}],rigEntries:[]},
  {id:13034,oid:4,date:"2026-03-18",sh:"day",status:"approved",by:"zhanab",submittedAt:"2026-03-18T08:00:00",approvedAt:"2026-03-18T09:00:00",comment:"",fuel:1043,fuel_kg:0,df:365.4,bf:0,wh:30.0,dh:3.0,overDrill:0,rigs:[{id:16,n:"JK-119",df:85.8,bf:0,wh:11,dh:0,fuel:316,dt:"",overDrill:0,downtime:0,operator:"Касенов А."},{id:17,n:"JK-120",df:208.1,bf:0,wh:8.0,dh:3.0,fuel:271,dt:"",overDrill:0,downtime:3.0,operator:"Иванов М"},{id:18,n:"JK-121",df:71.5,bf:0,wh:11,dh:0,fuel:456,dt:"",overDrill:0,downtime:0,operator:"Алмас Г"}],downtime_events:[{reason:"Простой",hours:3.0}],rigEntries:[]},
  {id:13035,oid:4,date:"2026-03-18",sh:"night",status:"approved",by:"zhanab",submittedAt:"2026-03-18T08:00:00",approvedAt:"2026-03-18T09:00:00",comment:"",fuel:0,fuel_kg:0,df:0,bf:0,wh:0,dh:0,overDrill:0,rigs:[{id:16,n:"JK-119",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:17,n:"JK-120",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""},{id:18,n:"JK-121",df:0,bf:0,wh:0,dh:0,fuel:0,dt:"",overDrill:0,downtime:0,operator:""}],downtime_events:[],rigEntries:[]}
];
const INIT_EXPLOSIVES_STOCK = [
  { id:"es1", site_id:1, type:"АНФО",     qty:2400, updated:"2025-01-15" },
  { id:"es2", site_id:1, type:"Эмульсия", qty:800,  updated:"2025-01-15" },
  { id:"es3", site_id:2, type:"АНФО",     qty:1800, updated:"2025-01-14" },
  { id:"es4", site_id:3, type:"Граммонит 79/21", qty:600, updated:"2025-01-13" },
];
const INIT_EXPLOSIVES_TXN = [];
const INIT_MAINTENANCE = [];
const INIT_REPAIR_REQUESTS = [];
const INIT_DOWNTIME_LOG = [];

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
  { id:"root", parentId:null,   name:"ExSo",                          type:"COMPANY",  catType:null,        desc:"Головная компания",        createdBy:"system", createdAt:now },
  { id:"c1",   parentId:"root", name:"Буровые станки",                type:"CATEGORY", catType:"DRILL_RIG", desc:"Буровое оборудование",     createdBy:"system", createdAt:now },
  { id:"c2",   parentId:"root", name:"Смесительно-зарядные машины",   type:"CATEGORY", catType:"MIXER",     desc:"СЗМ",                      createdBy:"system", createdAt:now },
  { id:"c3",   parentId:"root", name:"Гидромолоты",                   type:"CATEGORY", catType:"HYDRO",     desc:"Гидравлическое оборудование", createdBy:"system", createdAt:now },
  { id:"c6",   parentId:"root", name:"Экскаваторы",                   type:"CATEGORY", catType:"EXCAVATOR", desc:"Экскаваторная техника",    createdBy:"system", createdAt:now },
  { id:"c4",   parentId:"root", name:"Лёгкие автомобили",             type:"CATEGORY", catType:"HILUX",     desc:"Лёгкий автотранспорт",     createdBy:"system", createdAt:now },
  { id:"c5",   parentId:"root", name:"Грузовые / прицепы",            type:"CATEGORY", catType:"TRUCK",     desc:"Грузовой автотранспорт",   createdBy:"system", createdAt:now },
  { id:"c7",   parentId:"root", name:"Компрессоры",                   type:"CATEGORY", catType:null,        desc:"Воздушные компрессоры",    createdBy:"system", createdAt:now },
  { id:"c8",   parentId:"root", name:"Погрузчики",                    type:"CATEGORY", catType:null,        desc:"Погрузочная техника",      createdBy:"system", createdAt:now },

  // ── Буровые станки ──────────────────────────────────────────────────────────
  { id:"a1",  parentId:"c1", name:"Kaishan KG-920B", type:"ASSET", catType:null, serialNo:"№101", fuelRate:16.7, desc:"Kaishan KG 920B с компрессором Sanrock SR550-17, серийный №19081701, введён 2019 г.",           assigned_object_id:1, createdBy:"system", createdAt:now },
  { id:"a2",  parentId:"c1", name:"Kaishan-102",     type:"ASSET", catType:null, serialNo:"№102", fuelRate:16.7, desc:"Kaishan KG-920B, введён май 2022 г.",                                                           assigned_object_id:null, createdBy:"system", createdAt:now },
  { id:"a3",  parentId:"c1", name:"Kaishan-103",     type:"ASSET", catType:null, serialNo:"№103", fuelRate:16.7, desc:"Kaishan-103, введён окт 2022 г., Борлы/Коскудук/Шыганак",                                      assigned_object_id:1, createdBy:"system", createdAt:now },
  { id:"a4",  parentId:"c1", name:"KG-590-104",      type:"ASSET", catType:null, serialNo:"№104", fuelRate:16.7, desc:"Буровой станок KG-590 в комплекте с ЗИП, введён янв 2024 г.",                                  assigned_object_id:null, createdBy:"system", createdAt:now },
  { id:"a5",  parentId:"c1", name:"JK-115",          type:"ASSET", catType:null, serialNo:"№115", fuelRate:16.7, desc:"Гидравлическая буровая установка JK590BC-2A, Коскудук",  assigned_object_id:2, createdBy:"system", createdAt:now },
  { id:"a6",  parentId:"c1", name:"JK-106",          type:"ASSET", catType:null, serialNo:"№106", fuelRate:16.7, desc:"Гидравлическая буровая установка JK590, шасси JK2302079L, пасп. AJ2300302, 2023 г., Бактай",  assigned_object_id:3, createdBy:"system", createdAt:now },
  { id:"a7",  parentId:"c1", name:"ROC-107",         type:"ASSET", catType:null, serialNo:"№107", fuelRate:16.7, desc:"Буровая установка SANROCK R68, введён май 2025 г., Борлы",                                     assigned_object_id:1, createdBy:"system", createdAt:now },
  { id:"a8",  parentId:"c1", name:"ROC-108",         type:"ASSET", catType:null, serialNo:"№108", fuelRate:16.7, desc:"Буровая установка SANROCK R68, введён май 2025 г., Борлы",                                     assigned_object_id:1, createdBy:"system", createdAt:now },
  { id:"a9",  parentId:"c1", name:"JK-109",          type:"ASSET", catType:null, serialNo:"№109", fuelRate:16.7, desc:"Гидравлическая буровая установка JK590, шасси JK2202561, 2023 г., Коскудук",                   assigned_object_id:2, createdBy:"system", createdAt:now },
  { id:"a10", parentId:"c1", name:"JK-110",          type:"ASSET", catType:null, serialNo:"№110", fuelRate:16.7, desc:"Гидравлическая буровая установка JK590, серийный JK2302253L, 2023 г., Коскудук",               assigned_object_id:2, createdBy:"system", createdAt:now },
  { id:"a11", parentId:"c1", name:"JK-111",          type:"ASSET", catType:null, serialNo:"№111", fuelRate:16.7, desc:"Гидравлическая буровая установка JK590BC-2A, серийный JK2502202L, пасп. SNA2500301, 2025 г.",  assigned_object_id:2, createdBy:"system", createdAt:now },
  { id:"a12", parentId:"c1", name:"JK-112",          type:"ASSET", catType:null, serialNo:"№112", fuelRate:16.7, desc:"Гидравлическая буровая установка JK590BC-2A, шасси JK2502083L, пасп. AJ2501004, 2025 г.",      assigned_object_id:3, createdBy:"system", createdAt:now },
  { id:"a13", parentId:"c1", name:"JK-113",          type:"ASSET", catType:null, serialNo:"№113", fuelRate:16.7, desc:"Гидравлическая буровая установка JK590BC-2A, серийный JK2502197L, 2025 г., Бактай",            assigned_object_id:3, createdBy:"system", createdAt:now },
  { id:"a14", parentId:"c1", name:"JK-114",          type:"ASSET", catType:null, serialNo:"№114", fuelRate:16.7, desc:"Гидравлическая буровая установка JK590BC-2A, серийный JK2502208L, 2025 г., Бактай",            assigned_object_id:3, createdBy:"system", createdAt:now },
  { id:"a15", parentId:"c1", name:"JK-115",          type:"ASSET", catType:null, serialNo:"№115", fuelRate:16.7, desc:"Гидравлическая буровая установка JK590BC-2A, серийный JK2502207L, пасп. SNA2500312, 2025 г.",  assigned_object_id:3, createdBy:"system", createdAt:now },
  { id:"a16", parentId:"c1", name:"JK-116",          type:"ASSET", catType:null, serialNo:"№116", fuelRate:16.7, desc:"Гидравлическая буровая установка JK590BC-2A, серийный JK2502200L, пасп. SNA2500311, 2025 г.",  assigned_object_id:3, createdBy:"system", createdAt:now },
  { id:"a17", parentId:"c1", name:"JK-118",          type:"ASSET", catType:null, serialNo:"№118", fuelRate:16.7, desc:"Буровая установка ZEGA D545H (инв. №118), 2025 г., Бактай",                                               assigned_object_id:3, createdBy:"system", createdAt:now },
  { id:"a18", parentId:"c1", name:"JK-117",          type:"ASSET", catType:null, serialNo:"№117", fuelRate:16.7, desc:"Гидравлическая буровая установка JK590BC-2A, Коскудук",  assigned_object_id:2, createdBy:"system", createdAt:now },
  { id:"a22", parentId:"c1", name:"JK-122",          type:"ASSET", catType:null, serialNo:"№122", fuelRate:16.7, desc:"Гидравлическая буровая установка JK590BC-2A, Бактай",    assigned_object_id:3, createdBy:"system", createdAt:now },
  { id:"a23", parentId:"c1", name:"JK-123",          type:"ASSET", catType:null, serialNo:"№123", fuelRate:16.7, desc:"Гидравлическая буровая установка JK590BC-2A, Бактай",    assigned_object_id:3, createdBy:"system", createdAt:now },
  { id:"a19", parentId:"c1", name:"JK-119",          type:"ASSET", catType:null, serialNo:"№119", fuelRate:16.7, desc:"JK590BC-2A, пасп. AY250403, 2026 г., Жолымбет",                                               assigned_object_id:4, createdBy:"system", createdAt:now },
  { id:"a20", parentId:"c1", name:"JK-120",          type:"ASSET", catType:null, serialNo:"№120", fuelRate:16.7, desc:"JK590BC-2A, пасп. AY250404, 2026 г., Жолымбет",                                               assigned_object_id:4, createdBy:"system", createdAt:now },
  { id:"a21", parentId:"c1", name:"JK-121",          type:"ASSET", catType:null, serialNo:"№121", fuelRate:16.7, desc:"JK590BC-2A, пасп. AY250401, 2026 г., Жолымбет",                                               assigned_object_id:4, createdBy:"system", createdAt:now },

  // ── Компрессоры ─────────────────────────────────────────────────────────────
  { id:"comp1",  parentId:"c7", name:"Компрессор-201", type:"ASSET", catType:null, serialNo:"№201", desc:"Воздушный компрессор SR550-17, Борлы/Коскудук, 6736 мч нач.2025",             assigned_object_id:1, createdBy:"system", createdAt:now },
  { id:"comp2",  parentId:"c7", name:"Компрессор-202", type:"ASSET", catType:null, serialNo:"№202", desc:"Воздушный компрессор SR550-17, введён 06.05.2022",                             assigned_object_id:null, createdBy:"system", createdAt:now },
  { id:"comp3",  parentId:"c7", name:"Компрессор-203", type:"ASSET", catType:null, serialNo:"№203", desc:"Воздушный компрессор SR550-17, Борлы, введён 17.10.2022, 12079 мч кон.2025",   assigned_object_id:1, createdBy:"system", createdAt:now },
  { id:"comp4",  parentId:"c7", name:"Компрессор-204", type:"ASSET", catType:null, serialNo:"№204", desc:"Воздушный компрессор, Борлы/Коскудук, 2250 мч нач.2025",                       assigned_object_id:1, createdBy:"system", createdAt:now },
  { id:"comp5",  parentId:"c7", name:"Компрессор-205", type:"ASSET", catType:null, serialNo:"№205", desc:"Воздушный компрессор, Борлы/Коскудук, 5344 мч нач.2025",                       assigned_object_id:1, createdBy:"system", createdAt:now },
  { id:"comp6",  parentId:"c7", name:"Компрессор-206", type:"ASSET", catType:null, serialNo:"№206", desc:"Компрессор винтовой LGCY-18/17, 18 м³/мин, введён 10.01.2024",                 assigned_object_id:1, createdBy:"system", createdAt:now },
  { id:"comp7",  parentId:"c7", name:"Компрессор-207", type:"ASSET", catType:null, serialNo:"№207", desc:"Воздушный компрессор LUY180-19, Коскудук, введён 05.05.2025",                  assigned_object_id:2, createdBy:"system", createdAt:now },
  { id:"comp8",  parentId:"c7", name:"Компрессор-208", type:"ASSET", catType:null, serialNo:"№208", desc:"Воздушный компрессор LUY180-19, Коскудук, введён 05.05.2025",                  assigned_object_id:2, createdBy:"system", createdAt:now },
  { id:"comp9",  parentId:"c7", name:"Компрессор-209", type:"ASSET", catType:null, serialNo:"№209", desc:"Компрессор LGCY17/18-18/15T, Борлы/Коскудук, введён 10.04.2025",               assigned_object_id:1, createdBy:"system", createdAt:now },
  { id:"comp10", parentId:"c7", name:"Компрессор-210", type:"ASSET", catType:null, serialNo:"№210", desc:"Компрессор LGCY17/18-18/15T, Борлы, введён 08.11.2025",                        assigned_object_id:1, createdBy:"system", createdAt:now },
  { id:"comp11", parentId:"c7", name:"Компрессор-211", type:"ASSET", catType:null, serialNo:"№211", desc:"Компрессор LGCY17/18-18/15T, Борлы, введён 08.11.2025",                        assigned_object_id:1, createdBy:"system", createdAt:now },
  { id:"comp12", parentId:"c7", name:"Компрессор-212", type:"ASSET", catType:null, serialNo:"№212", desc:"Компрессор LGCY17/18-18/15T №1, введён 10.04.2025",                            assigned_object_id:null, createdBy:"system", createdAt:now },
  { id:"comp13", parentId:"c7", name:"Компрессор-213", type:"ASSET", catType:null, serialNo:"№213", desc:"Компрессор LGCY17/18-18/15T №3, Коскудук, введён 10.04.2025",                  assigned_object_id:2, createdBy:"system", createdAt:now },
  { id:"comp14", parentId:"c7", name:"Компрессор-214", type:"ASSET", catType:null, serialNo:"№214", desc:"Компрессор LGCY17/18-18/15T, введён 25.11.2025",                               assigned_object_id:null, createdBy:"system", createdAt:now },
  { id:"comp15", parentId:"c7", name:"Компрессор-215", type:"ASSET", catType:null, serialNo:"№215", desc:"Компрессор LGCY17/18-18/15T, серийный 17182508010А, введён 31.12.2025",        assigned_object_id:null, createdBy:"system", createdAt:now },
  { id:"comp16", parentId:"c7", name:"Компрессор-216", type:"ASSET", catType:null, serialNo:"№216", desc:"Компрессор LGCY17/18-18/15T, серийный 17182508002А, введён 31.12.2025",        assigned_object_id:null, createdBy:"system", createdAt:now },
  { id:"comp17", parentId:"c7", name:"Компрессор-217", type:"ASSET", catType:null, serialNo:"№217", desc:"Воздушный компрессор, Жолымбет", assigned_object_id:4, createdBy:"system", createdAt:now },
  { id:"comp18", parentId:"c7", name:"Компрессор-218", type:"ASSET", catType:null, serialNo:"№218", desc:"Воздушный компрессор, Жолымбет", assigned_object_id:4, createdBy:"system", createdAt:now },
  { id:"comp19", parentId:"c7", name:"Компрессор-219", type:"ASSET", catType:null, serialNo:"№219", desc:"Воздушный компрессор, Жолымбет", assigned_object_id:4, createdBy:"system", createdAt:now },

  // ── СЗМ ─────────────────────────────────────────────────────────────────────
  { id:"szm1", parentId:"c2", name:"СЗМ КАМАЗ-301",    type:"ASSET", catType:null, serialNo:"№301", desc:"КАМАЗ СЗМ, г/н 633 BG 09, дв.11760 куб, 2006 г., пасп. MI00000664, введён 13.01.2021", assigned_object_id:null, createdBy:"system", createdAt:now },
  { id:"szm2", parentId:"c2", name:"СЗМ HOWO-302",     type:"ASSET", catType:null, serialNo:"№302", desc:"HOWO СЗМ, г/н 601 AQ 09, дв.9726 куб, 2017 г., пасп. MI99997820, введён 08.08.2023, Бактай", assigned_object_id:3, createdBy:"system", createdAt:now },
  { id:"szm3", parentId:"c2", name:"СЗМ Mercedes-303", type:"ASSET", catType:null, serialNo:"№303", desc:"Mercedes-Benz СЗМ, г/н 346 BJ 09, дв.6374 куб, 2014 г., пасп. MI99883348, введён 12.03.2025, Бактай", assigned_object_id:3, createdBy:"system", createdAt:now },
  { id:"szm4", parentId:"c2", name:"СЗМ КРАЗ-304",     type:"ASSET", catType:null, serialNo:"№304", desc:"КРАЗ СЗМ, г/н 369 AI 09, дв.14860 куб, 2004 г., пасп. MI00005465, введён 17.06.2022, ремонт", assigned_object_id:null, createdBy:"system", createdAt:now },

  // ── Лёгкие автомобили ───────────────────────────────────────────────────────
  { id:"v1",  parentId:"c4", name:"Nissan Pickup-501",    type:"ASSET", catType:null, serialNo:"№501", desc:"Nissan Pick-Up, г/н 175 BR 09, 2500 куб, 1999 г., пасп. MF06993403, введён 02.04.2024, Борлы",           assigned_object_id:1, createdBy:"system", createdAt:now },
  { id:"v2",  parentId:"c4", name:"Toyota Hilux-502",     type:"ASSET", catType:null, serialNo:"№502", desc:"Toyota Hilux, г/н 346 AQV 09, 2982 куб, 2014 г., пасп. MQ99975430, введён 22.08.2024, аренда/механики",  assigned_object_id:null, createdBy:"system", createdAt:now },
  { id:"v3",  parentId:"c4", name:"Toyota Hilux SURF-503",type:"ASSET", catType:null, serialNo:"№503", desc:"Toyota Hilux SURF, г/н 732 BH 09, 2440 куб, 1993 г., пасп. AK99919098, введён 10.09.2024, Коскудук",     assigned_object_id:2, createdBy:"system", createdAt:now },
  { id:"v4",  parentId:"c4", name:"Toyota LC100-504",     type:"ASSET", catType:null, serialNo:"№504", desc:"Toyota LC100VX, г/н 010 ZZ 09, 4664 куб, 2006 г., пасп. MW99999928, введён 09.10.2024, город",            assigned_object_id:null, createdBy:"system", createdAt:now },
  { id:"v5",  parentId:"c4", name:"Lexus LX570-505",      type:"ASSET", catType:null, serialNo:"№505", desc:"LEXUS LX 570, г/н 090 ES 09, 5663 куб, 2012 г., пасп. MI99884935, введён 31.10.2024, город",             assigned_object_id:null, createdBy:"system", createdAt:now },
  { id:"v6",  parentId:"c4", name:"Toyota Hilux-506",     type:"ASSET", catType:null, serialNo:"№506", desc:"Toyota Hilux, г/н 104 APJ 09, 2492 куб, 2007 г., пасп. YA99801193, введён 16.11.2024, аренда/Коскудук",  assigned_object_id:2, createdBy:"system", createdAt:now },
  { id:"v7",  parentId:"c4", name:"Nissan Pickup-507",    type:"ASSET", catType:null, serialNo:"№507", desc:"Nissan Pick-Up, г/н 350 AJ 09, 3000 куб, 2005 г., пасп. KF00000066, введён 01.12.2022, ремонт/Коскудук", assigned_object_id:2, createdBy:"system", createdAt:now },
  { id:"v8",  parentId:"c4", name:"Toyota Hilux-508",     type:"ASSET", catType:null, serialNo:"№508", desc:"Toyota Hilux, г/н 746 BQ 09, 2500 куб, 2010 г., пасп. HY99801326, введён 16.01.2025, Коскудук/Шыганак",  assigned_object_id:2, createdBy:"system", createdAt:now },
  { id:"v9",  parentId:"c4", name:"Toyota Hilux-509",     type:"ASSET", catType:null, serialNo:"№509", desc:"Toyota Hilux, г/н 175 ATB 09, 2500 куб, 2006 г., пасп. MJ99777832, введён 17.01.2025, Бактай/аренда",    assigned_object_id:3, createdBy:"system", createdAt:now },
  { id:"v10", parentId:"c4", name:"BYD Leopard 8-510",    type:"ASSET", catType:null, serialNo:"№510", desc:"BYD Leopard 8, г/н 850 BQ 09, 1997 куб, 2025 г., пасп. MI99880610, введён 06.11.2025, город",             assigned_object_id:null, createdBy:"system", createdAt:now },
  { id:"v11", parentId:"c4", name:"Toyota Hilux-511",     type:"ASSET", catType:null, serialNo:"№511", desc:"Toyota Hilux Pick Up, г/н 135 BT 09, 2500 куб, 2013 г., введён 24.01.2026, Жолымбет",                    assigned_object_id:4, createdBy:"system", createdAt:now },

  // ── Грузовые / автобус / прицепы ────────────────────────────────────────────
  { id:"t1",  parentId:"c5", name:"ПАЗ-401",             type:"ASSET", catType:null, serialNo:"№401", desc:"ПАЗ автобус, г/н 145 BR 09, дв.4750 куб, 2007 г., пасп. MI99880429, введён 21.11.2025, Бактай",             assigned_object_id:3, createdBy:"system", createdAt:now },
  { id:"t2",  parentId:"c5", name:"MAN F2000-402",        type:"ASSET", catType:null, serialNo:"№402", desc:"MAN F2000, г/н 457 AZ 09, дв.11967 куб, 1995 г., пасп. MI00000252, введён 12.07.2022, перевозка ВМ/АС",     assigned_object_id:null, createdBy:"system", createdAt:now },
  { id:"t3",  parentId:"c5", name:"Газель 3302-403",      type:"ASSET", catType:null, serialNo:"№403", desc:"Газель 3302, г/н 047 AEL 09, дв.2464 куб, 2007 г., пасп. MJ00109239, введён 12.07.2022, аренда/перевозка ВМ", assigned_object_id:null, createdBy:"system", createdAt:now },
  { id:"t4",  parentId:"c5", name:"FOTON-404",             type:"ASSET", catType:null, serialNo:"№404", desc:"FOTON, г/н P028402, дв.8500 куб, 2024 г., пасп. AL99882370, введён 01.11.2024, перевозка ВМ",               assigned_object_id:null, createdBy:"system", createdAt:now },
  { id:"t5",  parentId:"c5", name:"XCMG Тягач-405",       type:"ASSET", catType:null, serialNo:"№405", desc:"XCMG тягач, г/н 833 BQ 09, дв.10520 куб, 2023 г., пасп. MJ99794019, введён 06.11.2024, перевозка ВМ/АС",    assigned_object_id:null, createdBy:"system", createdAt:now },
  { id:"t6",  parentId:"c5", name:"КАМАЗ 55102-406",      type:"ASSET", catType:null, serialNo:"№406", desc:"КАМАЗ 55102, г/н 068 BI 09, дв.10850 куб, 1992 г., пасп. MI99882193, введён 29.06.2025, склад Бактай",        assigned_object_id:3, createdBy:"system", createdAt:now },
  { id:"t7",  parentId:"c5", name:"Mercedes Actros-407",  type:"ASSET", catType:null, serialNo:"№407", desc:"Daimler Chrysler Actros (Mercedes-Benz), г/н 721 BQ 09, дв.11946 куб, 2000 г., пасп. MI99879963, введён 23.12.2025, перевозка ВМ/АС", assigned_object_id:null, createdBy:"system", createdAt:now },
  { id:"t8",  parentId:"c5", name:"Прицеп Schmitz-601",   type:"ASSET", catType:null, serialNo:"№601", desc:"Schmitz, г/н 50 ADQ 09, 2005 г., пасп. MJ99979419, введён 11.09.2023, аренда/перевозка",                     assigned_object_id:null, createdBy:"system", createdAt:now },
  { id:"t9",  parentId:"c5", name:"Прицеп-трал-602",      type:"ASSET", catType:null, serialNo:"№602", desc:"XINHONGDONG LHD9404TDP трал, г/н Н35202, 2024 г., пасп. AP99876715, введён 03.12.2024",                       assigned_object_id:null, createdBy:"system", createdAt:now },
  { id:"t10", parentId:"c5", name:"Прицеп Krone-603",     type:"ASSET", catType:null, serialNo:"№603", desc:"Krone SD, г/н 82 AFD 09, 2007 г., пасп. MI99882859, введён 30.04.2025",                                      assigned_object_id:null, createdBy:"system", createdAt:now },

  // ── Экскаваторы ─────────────────────────────────────────────────────────────
  { id:"ex1", parentId:"c6", name:"Экскаватор LONKING-702", type:"ASSET", catType:null, serialNo:"№702", desc:"Гусеничный экскаватор LONKING CDM6336 (Гидромолот), VIN LSW306E3VR0022008, 2024 г., пасп. ASAY2404008, введён 01.03.2025, Коскудук", assigned_object_id:2, createdBy:"system", createdAt:now },
  { id:"ex2", parentId:"c6", name:"Экскаватор LONKING-703", type:"ASSET", catType:null, serialNo:"№703", desc:"Гусеничный экскаватор LONKING CDM6336 (Гидромолот), VIN LSW306E3VS0013508, 2025 г., пасп. ASAY250710, введён 01.07.2025, Борлы",   assigned_object_id:1, createdBy:"system", createdAt:now },

  // ── Погрузчики ──────────────────────────────────────────────────────────────
  { id:"pl1", parentId:"c8", name:"Погрузчик-701",       type:"ASSET", catType:null, serialNo:"№701", desc:"Погрузчик, г/н AUD 482 M, 2021 г., Завод",          assigned_object_id:null, createdBy:"system", createdAt:now },
  { id:"pl2", parentId:"c8", name:"Погрузчик Мамонт-704",type:"ASSET", catType:null, serialNo:"№704", desc:"Погрузчик Мамонт, 2025 г., Бактай",                  assigned_object_id:3, createdBy:"system", createdAt:now },
];

// ─── EAM 1.2 INITIAL DATA ──────────────────────────────────────────────────────
// Asset passport data keyed by node id
const CAT_TYPE_LABEL = { DRILL_RIG:"Буровой станок", COMPRESSOR:"Компрессор", MIXER:"СЗМ", HYDRO:"Гидромолот", EXCAVATOR:"Экскаватор", HILUX:"Легковой авт.", TRUCK:"Грузовой авт.", COMPRESSOR:"Компрессор", LOADER:"Погрузчик" };
const PURPOSE_OPTIONS = ["Бурение","Зарядка","Доставка","Вспомогательные работы","Техническое обслуживание"];
const METER_UNIT_CFG  = { ENGINE_HOURS:"мч", KM:"км", CYCLES:"цикл" };

const INIT_PASSPORTS = {
  // ── Буровые станки ────────────────────────────────────────────────────────
  a1:  { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"Kaishan",  model:"KG-920B",    serial:"19081701",   year:"2019", inventory:"№101", commissioned:"2019",      location:"Борлы, Шыганак",           avg_monthly:null, total_hours:0,  fuel_rate:null , toSchedule:[{name:"ТО-250",interval:250,duration_hrs:2}], },
  a2:  { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"Kaishan",  model:"KG-920B",    serial:"",           year:"2022", inventory:"№102", commissioned:"2022-05",   location:"Город",                    avg_monthly:null, total_hours:null,  fuel_rate:null , toSchedule:[{name:"ТО-250",interval:250,duration_hrs:2}], },
  a3:  { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"Kaishan",  model:"KG-920B",    serial:"",           year:"2022", inventory:"№103", commissioned:"2022-10",   location:"Борлы, Коскудук, Шыганак", avg_monthly:null, total_hours:0,  fuel_rate:null , toSchedule:[{name:"ТО-250",interval:250,duration_hrs:2}], },
  a4:  { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"Kaishan",  model:"KG-590",     serial:"",           year:"2024", inventory:"№104", commissioned:"2024-01",   location:"",                         avg_monthly:null, total_hours:null,  fuel_rate:null , toSchedule:[{name:"ТО-250",interval:250,duration_hrs:2}], },
  a5:  { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"JK Boart", model:"JK590",      serial:"JK2202566",  year:"2023", inventory:"№105", commissioned:"2024-04",   location:"Коскудук",                 avg_monthly:null, total_hours:0,  fuel_rate:null , toSchedule:[{name:"ТО-250",interval:250,duration_hrs:2}], },
  a6:  { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"JK Boart", model:"JK590",      serial:"JK2302079L", year:"2023", inventory:"№106", commissioned:"2024-04",   location:"Шыганак",                  avg_monthly:null, total_hours:0,  fuel_rate:16.7 , toSchedule:[{name:"ТО-250",interval:250,duration_hrs:2}], },
  a7:  { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"Sanrock",  model:"R68",        serial:"",           year:"2025", inventory:"№107", commissioned:"2025-05",   location:"Борлы",                    avg_monthly:null, total_hours:0,  fuel_rate:null , toSchedule:[{name:"ТО-250",interval:250,duration_hrs:2}], },
  a8:  { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"Sanrock",  model:"R68",        serial:"",           year:"2025", inventory:"№108", commissioned:"2025-05",   location:"Борлы",                    avg_monthly:null, total_hours:0,  fuel_rate:null , toSchedule:[{name:"ТО-250",interval:250,duration_hrs:2}], },
  a9:  { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"JK Boart", model:"JK590",      serial:"JK2202561",  year:"2023", inventory:"№109", commissioned:"2024-08",   location:"Коскудук",                 avg_monthly:null, total_hours:0,  fuel_rate:16.7 , toSchedule:[{name:"ТО-250",interval:250,duration_hrs:2}], },
  a10: { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"JK Boart", model:"JK590",      serial:"JK2302253L", year:"2023", inventory:"№110", commissioned:"2024-08",   location:"Коскудук",                 avg_monthly:null, total_hours:0,   fuel_rate:16.7 , toSchedule:[{name:"ТО-250",interval:250,duration_hrs:2}], },
  a11: { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"JK Boart", model:"JK590BC-2A", serial:"JK2502202L", year:"2025", inventory:"№111", commissioned:"2025-08-13",location:"Борлы, Коскудук, Шыганак", avg_monthly:null, total_hours:0,    fuel_rate:16.7 , toSchedule:[{name:"ТО-250",interval:250,duration_hrs:2}], },
  a12: { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"JK Boart", model:"JK590BC-2A", serial:"JK2502083L", year:"2025", inventory:"№112", commissioned:"2025-08-22",location:"Бактай",                   avg_monthly:null, total_hours:2834,  fuel_rate:16.7 , toSchedule:[{name:"ТО-250",interval:250,duration_hrs:2}], },
  a13: { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"JK Boart", model:"JK590BC-2A", serial:"JK2502197L", year:"2025", inventory:"№113", commissioned:"2025-08-22",location:"Бактай",                   avg_monthly:null, total_hours:3099,  fuel_rate:16.7 , toSchedule:[{name:"ТО-250",interval:250,duration_hrs:2}], },
  a14: { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"JK Boart", model:"JK590BC-2A", serial:"JK2502208L", year:"2025", inventory:"№114", commissioned:"2025-08-22",location:"Бактай",                   avg_monthly:null, total_hours:3017,  fuel_rate:16.7 , toSchedule:[{name:"ТО-250",interval:250,duration_hrs:2}], },
  a15: { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"JK Boart", model:"JK590BC-2A", serial:"JK2502207L", year:"2025", inventory:"№115", commissioned:"2025-09-10",location:"Бактай, Коскудук",          avg_monthly:null, total_hours:null,  fuel_rate:16.7 , toSchedule:[{name:"ТО-250",interval:250,duration_hrs:2}], },
  a16: { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"JK Boart", model:"JK590BC-2A", serial:"JK2502200L", year:"2025", inventory:"№116", commissioned:"2025-09-10",location:"Бактай",                   avg_monthly:null, total_hours:0,  fuel_rate:16.7 , toSchedule:[{name:"ТО-250",interval:250,duration_hrs:2}], },
  a17: { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"ZEGA",     model:"D545H",      serial:"",           year:"2025", inventory:"№117", commissioned:"",          location:"Бактай",                   avg_monthly:null, total_hours:1462,   fuel_rate:16.7 , toSchedule:[{name:"ТО-250",interval:250,duration_hrs:2}], },
  a18: { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"JK Boart", model:"JK590BC-2A", serial:"JK2502198L", year:"2025", inventory:"№118", commissioned:"2025-12-18",location:"Коскудук",                 avg_monthly:null, total_hours:null,  fuel_rate:16.7 , toSchedule:[{name:"ТО-250",interval:250,duration_hrs:2}], },
  a19: { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"JK Boart", model:"JK590BC-2A", serial:"AY250403",   year:"2026", inventory:"№119", commissioned:"2026-01",   location:"Жолымбет",                 avg_monthly:250,  total_hours:798,   fuel_rate:16.7, toSchedule:[{name:"ТО-250",interval:250,duration_hrs:2}], },
  a20: { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"JK Boart", model:"JK590BC-2A", serial:"AY250404",   year:"2026", inventory:"№120", commissioned:"2026-01",   location:"Жолымбет",                 avg_monthly:250,  total_hours:820,   fuel_rate:16.7, toSchedule:[{name:"ТО-250",interval:250,duration_hrs:2}], },
  a21: { assetClass:"DRILL_RIG", purpose:"Бурение", manufacturer:"JK Boart", model:"JK590BC-2A", serial:"AY250401",   year:"2026", inventory:"№121", commissioned:"2026-01",   location:"Жолымбет",                 avg_monthly:250,  total_hours:800,   fuel_rate:16.7, toSchedule:[{name:"ТО-250",interval:250,duration_hrs:2}], },

  // ── Компрессоры ───────────────────────────────────────────────────────────
  comp1:  { assetClass:"COMPRESSOR", purpose:"Вспомогательные работы", manufacturer:"Sanrock", model:"SR550-17",        serial:"",              year:"",   inventory:"№201", commissioned:"",          location:"Борлы, Коскудук",           avg_monthly:null, total_hours:0,  fuel_rate:null , toSchedule:[], },
  comp2:  { assetClass:"COMPRESSOR", purpose:"Вспомогательные работы", manufacturer:"Sanrock", model:"SR550-17",        serial:"",              year:"",   inventory:"№202", commissioned:"2022-05-06",location:"",                          avg_monthly:null, total_hours:null,  fuel_rate:null , toSchedule:[], },
  comp3:  { assetClass:"COMPRESSOR", purpose:"Вспомогательные работы", manufacturer:"Sanrock", model:"SR550-17",        serial:"",              year:"",   inventory:"№203", commissioned:"2022-10-17",location:"Борлы",                     avg_monthly:null, total_hours:0, fuel_rate:null , toSchedule:[], },
  comp4:  { assetClass:"COMPRESSOR", purpose:"Вспомогательные работы", manufacturer:"",        model:"",                serial:"",              year:"",   inventory:"№204", commissioned:"",          location:"Борлы, Коскудук, Шыганак",  avg_monthly:null, total_hours:0,  fuel_rate:null , toSchedule:[], },
  comp5:  { assetClass:"COMPRESSOR", purpose:"Вспомогательные работы", manufacturer:"",        model:"",                serial:"",              year:"",   inventory:"№205", commissioned:"",          location:"Борлы, Коскудук",           avg_monthly:null, total_hours:0,  fuel_rate:null , toSchedule:[], },
  comp6:  { assetClass:"COMPRESSOR", purpose:"Вспомогательные работы", manufacturer:"LGCY",    model:"LGCY-18/17",      serial:"",              year:"",   inventory:"№206", commissioned:"2024-01-10",location:"Борлы, Шыганак, Коскудук",  avg_monthly:null, total_hours:0,  fuel_rate:null , toSchedule:[], },
  comp7:  { assetClass:"COMPRESSOR", purpose:"Вспомогательные работы", manufacturer:"LUY",     model:"LUY180-19",       serial:"",              year:"",   inventory:"№207", commissioned:"2025-05-05",location:"Коскудук",                  avg_monthly:null, total_hours:0,  fuel_rate:null , toSchedule:[], },
  comp8:  { assetClass:"COMPRESSOR", purpose:"Вспомогательные работы", manufacturer:"LUY",     model:"LUY180-19",       serial:"",              year:"",   inventory:"№208", commissioned:"2025-05-05",location:"Коскудук",                  avg_monthly:null, total_hours:0,  fuel_rate:null , toSchedule:[], },
  comp9:  { assetClass:"COMPRESSOR", purpose:"Вспомогательные работы", manufacturer:"LGCY",    model:"LGCY17/18-18/15T",serial:"",              year:"",   inventory:"№209", commissioned:"2025-04-10",location:"Борлы, Коскудук",           avg_monthly:null, total_hours:null,  fuel_rate:null , toSchedule:[], },
  comp10: { assetClass:"COMPRESSOR", purpose:"Вспомогательные работы", manufacturer:"LGCY",    model:"LGCY17/18-18/15T",serial:"",              year:"",   inventory:"№210", commissioned:"2025-11-08",location:"Борлы",                     avg_monthly:null, total_hours:null,  fuel_rate:null , toSchedule:[], },
  comp11: { assetClass:"COMPRESSOR", purpose:"Вспомогательные работы", manufacturer:"LGCY",    model:"LGCY17/18-18/15T",serial:"",              year:"",   inventory:"№211", commissioned:"2025-11-08",location:"Борлы",                     avg_monthly:null, total_hours:null,  fuel_rate:null , toSchedule:[], },
  comp12: { assetClass:"COMPRESSOR", purpose:"Вспомогательные работы", manufacturer:"LGCY",    model:"LGCY17/18-18/15T",serial:"",              year:"",   inventory:"№212", commissioned:"2025-04-10",location:"",                          avg_monthly:null, total_hours:null,  fuel_rate:null , toSchedule:[], },
  comp13: { assetClass:"COMPRESSOR", purpose:"Вспомогательные работы", manufacturer:"LGCY",    model:"LGCY17/18-18/15T",serial:"",              year:"",   inventory:"№213", commissioned:"2025-04-10",location:"Коскудук",                  avg_monthly:null, total_hours:null,  fuel_rate:null , toSchedule:[], },
  comp14: { assetClass:"COMPRESSOR", purpose:"Вспомогательные работы", manufacturer:"LGCY",    model:"LGCY17/18-18/15T",serial:"",              year:"",   inventory:"№214", commissioned:"2025-11-25",location:"",                          avg_monthly:null, total_hours:null,  fuel_rate:null , toSchedule:[], },
  comp15: { assetClass:"COMPRESSOR", purpose:"Вспомогательные работы", manufacturer:"LGCY",    model:"LGCY17/18-18/15T",serial:"17182508010А",  year:"",   inventory:"№215", commissioned:"2025-12-31",location:"",                          avg_monthly:null, total_hours:null,  fuel_rate:null , toSchedule:[], },
  comp16: { assetClass:"COMPRESSOR", purpose:"Вспомогательные работы", manufacturer:"LGCY",    model:"LGCY17/18-18/15T",serial:"17182508002А",  year:"",   inventory:"№216", commissioned:"2025-12-31",location:"",                          avg_monthly:null, total_hours:null,  fuel_rate:null , toSchedule:[], },

  // ── СЗМ ──────────────────────────────────────────────────────────────────
  szm1: { assetClass:"MIXER", purpose:"Зарядка", manufacturer:"КАМАЗ",        model:"СЗМ", serial:"MI00000664", year:"2006", inventory:"№301", reg_plate:"633 BG 09",  engine_vol:11760, commissioned:"2021-01-13", location:"Город",         avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },
  szm2: { assetClass:"MIXER", purpose:"Зарядка", manufacturer:"HOWO",         model:"СЗМ", serial:"MI99997820", year:"2017", inventory:"№302", reg_plate:"601 AQ 09",  engine_vol:9726,  commissioned:"2023-08-08", location:"Бактай",        avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },
  szm3: { assetClass:"MIXER", purpose:"Зарядка", manufacturer:"Mercedes-Benz",model:"СЗМ", serial:"MI99883348", year:"2014", inventory:"№303", reg_plate:"346 BJ 09",  engine_vol:6374,  commissioned:"2025-03-12", location:"Бактай",        avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },
  szm4: { assetClass:"MIXER", purpose:"Зарядка", manufacturer:"КРАЗ",         model:"СЗМ", serial:"MI00005465", year:"2004", inventory:"№304", reg_plate:"369 AI 09",  engine_vol:14860, commissioned:"2022-06-17", location:"Ремонт (город)",avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },

  // ── Лёгкие автомобили ────────────────────────────────────────────────────
  v1:  { assetClass:"HILUX", purpose:"Доставка", manufacturer:"Nissan",       model:"Pick-Up",    serial:"MF06993403", year:"1999", inventory:"№501", reg_plate:"175 BR 09",  engine_vol:2500, commissioned:"2024-04-02", location:"Борлы",                              avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },
  v2:  { assetClass:"HILUX", purpose:"Доставка", manufacturer:"Toyota",       model:"Hilux",      serial:"MQ99975430", year:"2014", inventory:"№502", reg_plate:"346 AQV 09", engine_vol:2982, commissioned:"2024-08-22", location:"Механики (Договор аренды)",          avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },
  v3:  { assetClass:"HILUX", purpose:"Доставка", manufacturer:"Toyota",       model:"Hilux SURF", serial:"AK99919098", year:"1993", inventory:"№503", reg_plate:"732 BH 09",  engine_vol:2440, commissioned:"2024-09-10", location:"Коскудук",                           avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },
  v4:  { assetClass:"HILUX", purpose:"Доставка", manufacturer:"Toyota",       model:"LC100VX",    serial:"MW99999928", year:"2006", inventory:"№504", reg_plate:"010 ZZ 09",  engine_vol:4664, commissioned:"2024-10-09", location:"Город",                              avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },
  v5:  { assetClass:"HILUX", purpose:"Доставка", manufacturer:"Lexus",        model:"LX 570",     serial:"MI99884935", year:"2012", inventory:"№505", reg_plate:"090 ES 09",  engine_vol:5663, commissioned:"2024-10-31", location:"Город",                              avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },
  v6:  { assetClass:"HILUX", purpose:"Доставка", manufacturer:"Toyota",       model:"Hilux",      serial:"YA99801193", year:"2007", inventory:"№506", reg_plate:"104 APJ 09", engine_vol:2492, commissioned:"2024-11-16", location:"Ремонт (город), аренда, Коскудук",   avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },
  v7:  { assetClass:"HILUX", purpose:"Доставка", manufacturer:"Nissan",       model:"Pick-Up",    serial:"KF00000066", year:"2005", inventory:"№507", reg_plate:"350 AJ 09",  engine_vol:3000, commissioned:"2022-12-01", location:"Ремонт (город), Коскудук",           avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },
  v8:  { assetClass:"HILUX", purpose:"Доставка", manufacturer:"Toyota",       model:"Hilux",      serial:"HY99801326", year:"2010", inventory:"№508", reg_plate:"746 BQ 09",  engine_vol:2500, commissioned:"2025-01-16", location:"Коскудук, Шыганак",                  avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },
  v9:  { assetClass:"HILUX", purpose:"Доставка", manufacturer:"Toyota",       model:"Hilux",      serial:"MJ99777832", year:"2006", inventory:"№509", reg_plate:"175 ATB 09", engine_vol:2500, commissioned:"2025-01-17", location:"Бактай (Договор аренды), Город",     avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },
  v10: { assetClass:"HILUX", purpose:"Доставка", manufacturer:"BYD",          model:"Leopard 8",  serial:"MI99880610", year:"2025", inventory:"№510", reg_plate:"850 BQ 09",  engine_vol:1997, commissioned:"2025-11-06", location:"Город",                              avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },
  v11: { assetClass:"HILUX", purpose:"Доставка", manufacturer:"Toyota",       model:"Hilux",      serial:"",           year:"2013", inventory:"№511", reg_plate:"135 BT 09",  engine_vol:2500, commissioned:"2026-01-24", location:"Жолымбет",                           avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },

  // ── Грузовые / прицепы ───────────────────────────────────────────────────
  t1:  { assetClass:"TRUCK", purpose:"Доставка", manufacturer:"ПАЗ",          model:"Автобус",         serial:"MI99880429", year:"2007", inventory:"№401", reg_plate:"145 BR 09",  engine_vol:4750,  commissioned:"2025-11-21", location:"Бактай",                                                       avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },
  t2:  { assetClass:"TRUCK", purpose:"Доставка", manufacturer:"MAN",          model:"F2000",           serial:"MI00000252", year:"1995", inventory:"№402", reg_plate:"457 AZ 09",  engine_vol:11967, commissioned:"2022-07-12", location:"Перевозка ИЗО танк-контейнер (эмульсия) и аммиачной селитры", avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },
  t3:  { assetClass:"TRUCK", purpose:"Доставка", manufacturer:"ГАЗ",          model:"Газель 3302",     serial:"MJ00109239", year:"2007", inventory:"№403", reg_plate:"047 AEL 09", engine_vol:2464,  commissioned:"2022-07-12", location:"Перевозка ВМ/ТМЦ (аренда)",                                   avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },
  t4:  { assetClass:"TRUCK", purpose:"Доставка", manufacturer:"FOTON",        model:"",                serial:"AL99882370", year:"2024", inventory:"№404", reg_plate:"P028402",    engine_vol:8500,  commissioned:"2024-11-01", location:"Перевозка ВМ",                                                 avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },
  t5:  { assetClass:"TRUCK", purpose:"Доставка", manufacturer:"XCMG",         model:"Тягач",           serial:"MJ99794019", year:"2023", inventory:"№405", reg_plate:"833 BQ 09",  engine_vol:10520, commissioned:"2024-11-06", location:"Перевозка ИЗО танк-контейнер (эмульсия) и аммиачной селитры", avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },
  t6:  { assetClass:"TRUCK", purpose:"Доставка", manufacturer:"КАМАЗ",        model:"55102",           serial:"MI99882193", year:"1992", inventory:"№406", reg_plate:"068 BI 09",  engine_vol:10850, commissioned:"2025-06-29", location:"Склад Бактай",                                                 avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },
  t7:  { assetClass:"TRUCK", purpose:"Доставка", manufacturer:"Mercedes-Benz",model:"Actros",          serial:"MI99879963", year:"2000", inventory:"№407", reg_plate:"721 BQ 09",  engine_vol:11946, commissioned:"2025-12-23", location:"Перевозка ИЗО танк-контейнер (эмульсия) и аммиачной селитры", avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },
  t8:  { assetClass:"TRUCK", purpose:"Доставка", manufacturer:"Schmitz",      model:"Прицеп",          serial:"MJ99979419", year:"2005", inventory:"№601", reg_plate:"50 ADQ 09",  engine_vol:null,  commissioned:"2023-09-11", location:"Перевозка (аренда)",                                           avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },
  t9:  { assetClass:"TRUCK", purpose:"Доставка", manufacturer:"XINHONGDONG",  model:"LHD9404TDP трал", serial:"AP99876715", year:"2024", inventory:"№602", reg_plate:"Н35202",     engine_vol:null,  commissioned:"2024-12-03", location:"Перевозка",                                                    avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },
  t10: { assetClass:"TRUCK", purpose:"Доставка", manufacturer:"Krone",        model:"SD прицеп",       serial:"MI99882859", year:"2007", inventory:"№603", reg_plate:"82 AFD 09",  engine_vol:null,  commissioned:"2025-04-30", location:"Перевозка",                                                    avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },

  // ── Экскаваторы ──────────────────────────────────────────────────────────
  ex1: { assetClass:"EXCAVATOR", purpose:"Вспомогательные работы", manufacturer:"LONKING", model:"CDM6336", serial:"LSW306E3VR0022008", year:"2024", inventory:"№702", reg_plate:"", engine_vol:null, commissioned:"2025-03-01", location:"Коскудук", avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },
  ex2: { assetClass:"EXCAVATOR", purpose:"Вспомогательные работы", manufacturer:"LONKING", model:"CDM6336", serial:"LSW306E3VS0013508", year:"2025", inventory:"№703", reg_plate:"", engine_vol:null, commissioned:"2025-07-01", location:"Борлы",    avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },

  // ── Погрузчики ───────────────────────────────────────────────────────────
  pl1: { assetClass:"LOADER", purpose:"Вспомогательные работы", manufacturer:"", model:"Погрузчик", serial:"AUD482M",  year:"2021", inventory:"№701", reg_plate:"AUD 482 M", engine_vol:null, commissioned:"",          location:"Завод",  avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },
  pl2: { assetClass:"LOADER", purpose:"Вспомогательные работы", manufacturer:"", model:"Мамонт",    serial:"",         year:"2025", inventory:"№704", reg_plate:"",          engine_vol:null, commissioned:"",          location:"Бактай", avg_monthly:null, total_hours:null, fuel_rate:null , toSchedule:[], },
};

const INIT_METERS = {
  // Жолымбет — наработка на 12.03.2026 (из сообщения ОМТС)
  a19:   { type:"ENGINE_HOURS", current:798, history:[{date:"2026-03-01",value:609,note:"Начало месяца"},{date:"2026-03-12",value:798,note:"Снятие показаний ОМТС"}] },
  a20:   { type:"ENGINE_HOURS", current:820, history:[{date:"2026-03-01",value:638,note:"Начало месяца"},{date:"2026-03-12",value:820,note:"Снятие показаний ОМТС"}] },
  a21:   { type:"ENGINE_HOURS", current:800, history:[{date:"2026-03-01",value:597,note:"Начало месяца"},{date:"2026-03-12",value:800,note:"Снятие показаний ОМТС"}] },
  comp17:{ type:"ENGINE_HOURS", current:466, history:[{date:"2026-03-01",value:400,note:"Начало месяца"},{date:"2026-03-04",value:466,note:"Снятие показаний ОМТС"}] },
  comp18:{ type:"ENGINE_HOURS", current:450, history:[{date:"2026-03-01",value:387,note:"Начало месяца"},{date:"2026-03-04",value:450,note:"Снятие показаний ОМТС"}] },
  comp19:{ type:"ENGINE_HOURS", current:452, history:[{date:"2026-03-01",value:398,note:"Начало месяца"},{date:"2026-03-03",value:452,note:"Снятие показаний ОМТС"}] },
  // Бактай — наработка из сообщения ОМТС
  a12:   { type:"ENGINE_HOURS", current:2834, history:[{date:"2026-03-04",value:2834,note:"Снятие показаний ОМТС"}] },
  a13:   { type:"ENGINE_HOURS", current:3099, history:[{date:"2026-03-05",value:3099,note:"Снятие показаний ОМТС"}] },
  a14:   { type:"ENGINE_HOURS", current:3017, history:[{date:"2026-03-04",value:3017,note:"Снятие показаний ОМТС"}] },
  a17:   { type:"ENGINE_HOURS", current:1462, history:[{date:"2026-02-24",value:1462,note:"Снятие показаний ОМТС (не записан ранее)"}] },
  comp10:{ type:"ENGINE_HOURS", current:4215, history:[{date:"2026-03-12",value:4215,note:"Снятие показаний ОМТС"}] },
  comp11:{ type:"ENGINE_HOURS", current:3887, history:[{date:"2026-03-12",value:3887,note:"Снятие показаний ОМТС"}] },
  comp14:{ type:"ENGINE_HOURS", current:2155, history:[{date:"2026-03-04",value:2155,note:"Снятие показаний ОМТС"}] },
  // Остальные — не заданы
  a1:    { type:"ENGINE_HOURS", current:0, history:[] },
  a3:    { type:"ENGINE_HOURS", current:0, history:[] },
  a5:    { type:"ENGINE_HOURS", current:0, history:[] },
  a6:    { type:"ENGINE_HOURS", current:0, history:[] },
  a7:    { type:"ENGINE_HOURS", current:0, history:[] },
  a8:    { type:"ENGINE_HOURS", current:0, history:[] },
  a9:    { type:"ENGINE_HOURS", current:0, history:[] },
  a10:   { type:"ENGINE_HOURS", current:0, history:[] },
  a11:   { type:"ENGINE_HOURS", current:0, history:[] },
  a12:   { type:"ENGINE_HOURS", current:0, history:[] },
  a13:   { type:"ENGINE_HOURS", current:0, history:[] },
  a14:   { type:"ENGINE_HOURS", current:0, history:[] },
  a16:   { type:"ENGINE_HOURS", current:0, history:[] },
  a17:   { type:"ENGINE_HOURS", current:0, history:[] },
  comp1: { type:"ENGINE_HOURS", current:0, history:[] },
  comp3: { type:"ENGINE_HOURS", current:0, history:[] },
  comp4: { type:"ENGINE_HOURS", current:0, history:[] },
  comp5: { type:"ENGINE_HOURS", current:0, history:[] },
  comp6: { type:"ENGINE_HOURS", current:0, history:[] },
  comp7: { type:"ENGINE_HOURS", current:0, history:[] },
  comp8: { type:"ENGINE_HOURS", current:0, history:[] },
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
  { id:"loc4", name:"Жолымбет",        type:"SITE" },
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
// ─── КТГ: правильная методология ПФВ / КФВ ────────────────────────────────────
// Старая формула была: WH / (WH + DH) — НЕВЕРНО (смешивала типы простоев)
// Правильно: КТГ = (КФВ − тех.простои) / КФВ

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate(); // month: 1..12
}

// Суммирует технические простои из массива событий downtime_events
// Технические: cat === "mechanical" | "scheduled" → снижают КТГ
// Организационные и внешние — производственные потери, КТГ не трогают
// Технические простои (снижают КТГ и КИО)
// Категория "technical" в DOWNTIME_CATS имеет affectsKtg: true
function techDowntimeHours(events) {
  return (events || [])
    .filter(ev => {
      const cat = ev.category || ev.cat || "";
      return cat === "technical" || cat === "mechanical" || cat === "scheduled";
    })
    .reduce((s, ev) => s + toNum(ev.durationHours || ev.hrs || ev.hours || 0), 0);
}

// Все простои (снижают КИО)
function allDowntimeHours(events) {
  return (events || [])
    .reduce((s, ev) => s + toNum(ev.durationHours || ev.hrs || ev.hours || 0), 0);
}

// КТГ по списку отчётов (календарное время = сумма смен)
// КТГ = (КВ - тех.простои) / КВ × 100
// КИО = фактическая работа / КВ × 100
function calcKtgKio(repsList) {
  if (!repsList || !repsList.length) return { ktg: null, kio: null, calHrs: 0, techDH: 0, allDH: 0, workHrs: 0 };
  let calHrs = 0, techDH = 0, allDH = 0, workHrs = 0;
  repsList.forEach(rep => {
    const shiftDur = toNum(rep.shiftDurationHours || rep.shift_duration_hrs || 11);
    calHrs += shiftDur;
    // Считаем простои из downtime_events
    const events = rep.downtime_events || rep.rigEntries?.flatMap(e => e.downtimes || []) || [];
    techDH  += techDowntimeHours(events);
    allDH   += allDowntimeHours(events);
    workHrs += toNum(rep.wh);
  });
  const ktg = calHrs > 0 ? Math.round((calHrs - techDH) / calHrs * 100) : null;
  const kio = calHrs > 0 ? Math.min(100, Math.round(workHrs / calHrs * 100)) : null;
  return { ktg, kio, calHrs, techDH, allDH, workHrs };
}

// Обратная совместимость — КТГ по одному отчёту (работа + все простои)
function calcRigKtgKio(wh, techDh, allDh, shiftDur) {
  const cal = shiftDur || (wh + allDh);
  if (cal <= 0) return { ktg: null, kio: null };
  return {
    ktg: Math.round((cal - techDh) / cal * 100),
    kio: Math.min(100, Math.round(wh / cal * 100)),
  };
}

// Основной расчёт КТГ для списка отчётов за период year/month
// Возвращает { ktg, calHrs, pfv, techDH } или { ktg: null } если данных нет
// Устаревшая функция — оставлена для совместимости
function ktgCalcNew(repsList) {
  return calcKtgKio(repsList);
}

// Обратная совместимость для мест где ещё нет downtime_events
// (старые отчёты, сменные данные без событий)
// Используй только для совместимости где нет downtime_events.
// Для правильного КТГ используй calcKtgKio или repKtg/repKio
function ktgCalc(w, d) { return (w + d) > 0 ? Math.round(w / (w + d) * 100) : null; }

// Извлечь техпростои из одного отчёта
function repTechDH(rep) {
  const events = rep?.downtime_events || rep?.rigEntries?.flatMap(e=>e.downtimes||[]) || [];
  return techDowntimeHours(events);
}
// КТГ одного отчёта: (calHrs - techDH) / calHrs
// calHrs = shiftDurationHours; если нет — используем wh+dh
function repKtg(rep) {
  const cal = toNum(rep.shiftDurationHours || rep.shift_duration_hrs) || (toNum(rep.wh) + toNum(rep.dh));
  if (cal <= 0) return null;
  const techDH = repTechDH(rep);
  return Math.min(100, Math.round((cal - techDH) / cal * 100));
}
// КИО одного отчёта: wh / calHrs
function repKio(rep) {
  const cal = toNum(rep.shiftDurationHours || rep.shift_duration_hrs) || (toNum(rep.wh) + toNum(rep.dh));
  if (cal <= 0) return null;
  return Math.min(100, Math.round(toNum(rep.wh) / cal * 100));
}
// КТГ/КИО списка отчётов с агрегацией по периоду
function repsKtgKio(reps) {
  let calHrs = 0, techDH = 0, wh = 0;
  (reps||[]).forEach(r => {
    const cal = toNum(r.shiftDurationHours || r.shift_duration_hrs) || (toNum(r.wh) + toNum(r.dh));
    calHrs += cal;
    techDH += repTechDH(r);
    wh += toNum(r.wh);
  });
  return {
    ktg: calHrs > 0 ? Math.min(100, Math.round((calHrs - techDH) / calHrs * 100)) : null,
    kio: calHrs > 0 ? Math.min(100, Math.round(wh / calHrs * 100)) : null,
    calHrs, techDH, wh,
  };
}
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
  { key:"DRILL_RIG",   label:"Буровые станки",              icon:"⛏",  color:"#f43f5e" },
  { key:"COMPRESSOR",  label:"Компрессоры",                 icon:"💨", color:"#06b6d4" },
  { key:"MIXER",       label:"Смесительно-зарядные машины", icon:"🧪", color:"#8b5cf6" },
  { key:"HYDRO",       label:"Гидромолоты / Экскаваторы",  icon:"💧", color:"#3b82f6" },
  { key:"HILUX",       label:"Лёгкие авто (Hilux)",         icon:"🚙", color:"#10b981" },
  { key:"TRUCK",       label:"Грузовые машины",             icon:"🚛", color:"#f59e0b" },
];

const CAT_ICON_OPTIONS = ["⛏","🧪","💧","🚙","🚛","🏗","⚙","🔧","🛠","🔩","🚜","🏎","🚁","⚡","🔋"];
const CAT_COLOR_OPTIONS = ["#f43f5e","#8b5cf6","#3b82f6","#10b981","#f59e0b","#06b6d4","#ec4899","#84cc16","#f97316","#6366f1"];
function Logo({ size = 34 }) {
  return (
    <svg height={size} viewBox="0 0 140 38" fill="none">
      <rect width="10" height="38" rx="2" fill="#e8212e"/>
      <rect x="13" width="10" height="38" rx="2" fill="#e8212e"/>
      <rect x="26" width="10" height="38" rx="2" fill="#e8212e"/>
      <text x="42" y="28" fontFamily="Inter,sans-serif" fontSize="26" fontWeight="700" fill="currentColor" letterSpacing="1">ExSo</text>
      <text x="43" y="36" fontFamily="Inter,sans-serif" fontSize="6.5" fontWeight="600" fill="#7a8fa8" letterSpacing="3">DRILL & BLAST CONTROL</text>
    </svg>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_BADGE[status] || STATUS_BADGE.draft;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 5,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      color: cfg.color, fontSize:12, fontWeight: 600,
      letterSpacing: 0,
    }}>
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: cfg.color, display: "inline-block" }} />
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
          fontFamily: "'Inter',sans-serif",
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
        <span style={{ fontSize: 28, fontWeight: 700, color: T.txt0, fontFamily: "'JetBrains Mono',monospace" }}>
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
        fontSize: 12, fontWeight: 700, letterSpacing: ".04em",
        textTransform: "uppercase", whiteSpace: "nowrap",
        fontFamily: "'Inter',sans-serif",
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
      {sub && <div style={{ fontSize: 20, fontWeight: 600, color: T.txt0, letterSpacing: "-0.3px" }}>{sub}</div>}
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
        <label style={{ fontSize: 12, fontWeight: 500, color: T.txt2 }}>
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
          border: `1px solid ${T.border}`, borderRadius: 6,
          color: T.txt0, fontSize: 13, fontWeight: 500,
          outline: "none", width: "100%",
          fontFamily: "'Inter',sans-serif",
        }}
      />
    </div>
  );
}

function FieldSelect({ label, value, onChange, children, T, style: ss }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, ...ss }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 500, color: T.txt2 }}>
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        style={{
          padding: "9px 12px", background: T.inputBg,
          border: `1px solid ${T.border}`, borderRadius: 6,
          color: T.txt0, fontSize: 13, fontWeight: 500,
          outline: "none", width: "100%", cursor: "pointer",
          fontFamily: "'Inter',sans-serif",
        }}
      >
        {children}
      </select>
    </div>
  );
}

// ─── DATA ENTRY TABLE (shared between foreman and engineer) ───────────────────
// bf/fuel_kg — уровень участка, вводятся отдельно
const TABLE_COLS = [
  { field: "df",   label: "Бурение п.м" },
  { field: "wh",   label: "Работа ч" },
  { field: "dh",   label: "Простой ч" },
  { field: "fuel", label: "ГСМ л" },
];

function DataTable({ rows, onCell, totals, T }) {
  const colors = [T.red, T.blue, "#ef4444", T.violet];
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
                    value={row[col.field] === 0 || row[col.field] === "" || row[col.field] == null ? "" : String(row[col.field])}
                    onChange={(e) => onCell(row.id, col.field, e.target.value)}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasted = e.clipboardData.getData("text").trim().replace(/[^0-9.]/g, "");
                      if (pasted) onCell(row.id, col.field, pasted);
                    }}
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
                    fontFamily: "'Inter',sans-serif",
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
            {[totals.df, totals.wh, totals.dh, totals.fuel].map((val, i) => (
              <td key={i} style={{ padding: "9px 10px", textAlign: "center", fontWeight: 900, fontSize: 16, color: colors[i], fontFamily: "'Inter',sans-serif" }}>
                {val.toLocaleString()}
              </td>
            ))}
            <td style={{ padding: "9px 10px", fontSize: 11, color: T.txt2 }}>
              <div>КТГ <b style={{ color: scoreColor(shiftKtg, 85, 70, T) }}>{shiftKtg !== null ? `${shiftKtg}%` : "—"}</b></div>
              <div>КИО <b style={{ color: scoreColor(shiftKio, 75, 60, T) }}>{shiftKio !== null ? `${shiftKio}%` : "—"}</b></div>
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
    <div style={{ padding: "12px 18px 6px", display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
      {[
        [T.red,   "Данные по бурению", "Факт бурения (п.м.)"],
        [T.green, "Техника / КТГ",      "Работа и простои (ч)"],
      ].map(([color, title, sub]) => (
        <div key={title} style={{ background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 4, padding: "8px 12px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: ".04em" }}>{title}</div>
          <div style={{ fontSize: 12, color: T.txt2, marginTop: 2 }}>{sub}</div>
        </div>
      ))}
    </div>
  );
}


// ─── DOWNTIME CATEGORIES ──────────────────────────────────────────────────────
// ─── EXPLOSIVE TYPES ──────────────────────────────────────────────────────────
const INITIATION_TYPES = ["Неэл. детонаторы (СИНВ)","Электродетонаторы","Электронные детонаторы","Детонирующий шнур"];
const MAINT_INTERVALS = { TO1:250, TO2:500, TO3:1000 };

// ─── BLAST PASSPORT PAGE ─────────────────────────────────────────────────────
// ─── EXPLOSIVES INVENTORY ─────────────────────────────────────────────────────
// ─── MAINTENANCE PAGE ─────────────────────────────────────────────────────────
// ─── DOWNTIME LOGGER (embeds into ForemanForm) ────────────────────────────────
function DowntimeLogger({ downtimeLog, setDowntimeLog, siteRigs, rigs, T }) {
  const [form, setForm] = useState({ rig_id:siteRigs[0]?.id||"", cat:"mechanical", sub:"", hours:"" });
  const subs = DOWNTIME_CATS[form.cat]?.subs||[];
  function add() {
    if(!form.hours) return;
    setDowntimeLog(p=>[{...form, id:genId(), rig_id:Number(form.rig_id), hours:toNum(form.hours), ts:Date.now()},...p]);
    setForm(p=>({...p,hours:"",sub:""}));
  }
  const siteLog = downtimeLog.filter(d=>siteRigs.some(r=>r.id===d.rig_id));
  return (
    <div style={{ padding:"12px 18px", borderBottom:`1px solid ${T.border}`, background:`${T.blue}06` }}>
      <div style={{ fontSize:12, fontWeight:700, color:T.blue, textTransform:"uppercase", letterSpacing:".1em", marginBottom:8 }}>⏱ Классификация простоев</div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"flex-end" }}>
        <div style={{ flex:"1 1 120px" }}>
          <label style={{ display:"block", fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", marginBottom:3 }}>Станок</label>
          <select value={form.rig_id} onChange={e=>setForm(p=>({...p,rig_id:e.target.value}))} style={{ width:"100%", padding:"6px 8px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:12 }}>
            {siteRigs.map(r=><option key={r.id} value={r.id}>{r.n}</option>)}
          </select>
        </div>
        <div style={{ flex:"1 1 150px" }}>
          <label style={{ display:"block", fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", marginBottom:3 }}>Категория</label>
          <select value={form.cat} onChange={e=>setForm(p=>({...p,cat:e.target.value,sub:""}))} style={{ width:"100%", padding:"6px 8px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:DOWNTIME_CATS[form.cat]?.color||T.txt0, fontSize:12, fontWeight:700 }}>
            {Object.entries(DOWNTIME_CATS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div style={{ flex:"1 1 170px" }}>
          <label style={{ display:"block", fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", marginBottom:3 }}>Подкатегория</label>
          <select value={form.sub} onChange={e=>setForm(p=>({...p,sub:e.target.value}))} style={{ width:"100%", padding:"6px 8px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:12 }}>
            <option value="">— выберите —</option>
            {subs.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ flex:"0 0 80px" }}>
          <label style={{ display:"block", fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", marginBottom:3 }}>Часов</label>
          <input type="number" value={form.hours} onChange={e=>setForm(p=>({...p,hours:e.target.value}))} placeholder="2.5" style={{ width:"100%", padding:"6px 8px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:12, fontFamily:"'JetBrains Mono',monospace" }} />
        </div>
        <button onClick={add} style={{ padding:"7px 12px", borderRadius:5, background:T.blue, color:"#fff", border:"none", fontSize:12, fontWeight:700, cursor:"pointer", alignSelf:"flex-end" }}>+</button>
      </div>
      {siteLog.length>0&&(
        <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:3 }}>
          {siteLog.slice(0,4).map(d=>(
            <div key={d.id} style={{ display:"flex", gap:8, fontSize:12, alignItems:"center" }}>
              <span style={{ color:DOWNTIME_CATS[d.cat]?.color||T.txt2, fontWeight:700, minWidth:20 }}>●</span>
              <span style={{ color:T.txt1 }}>{DOWNTIME_CATS[d.cat]?.label}</span>
              {d.sub&&<span style={{ color:T.txt2 }}>— {d.sub}</span>}
              <span style={{ color:T.txt0, fontFamily:"'JetBrains Mono',monospace", marginLeft:"auto" }}>{d.hours}ч</span>
              <span style={{ color:T.txt2 }}>{rigs.find(r=>r.id===d.rig_id)?.n}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CEO ANALYTICS PANEL ─────────────────────────────────────────────────────
function Login({ users, onLogin, T }) {
  const [login, setLogin] = useState("");
  const [pw, setPw]       = useState("");
  const [err, setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setErr(""); setLoading(true);
    try {
      const u = await supabaseLogin(login.trim(), pw);
      onLogin(u);
      return;
    } catch(e) {
      const u = users.find((u) => u.login === login.trim() && u.pw === pw);
      if (u) { onLogin(u); setLoading(false); return; }
      setErr("Неверный логин или пароль");
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg0, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ display: "flex", gap: 56, alignItems: "center", maxWidth: 860, width: "100%", flexWrap: "wrap" }}>
        {/* Left panel */}
        <div style={{ flex: "0 0 300px" }}>
          <div style={{ color: T.txt0 }}><Logo size={42} /></div>
          <div style={{ width: 32, height: 2, background: T.red, margin: "18px 0" }} />
          <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1, color: T.txt0, fontFamily: "'Inter',sans-serif", letterSpacing: "2px" }}>
            DRILL &amp; BLAST<br /><span style={{ color: T.red }}>CONTROL</span>
          </div>
          <div style={{ fontSize: 13, color: T.txt1, marginTop: 14, lineHeight: 1.8 }}>
            Система контроля буровзрывных работ
          </div>
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 5 }}>
            {[["17","Буровых станков"],["7","Рабочих участка"]].map(([num, lbl]) => (
              <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 14px", background: `${T.red}10`, border: `1px solid ${T.red}20`, borderRadius: 4 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: T.red, fontFamily: "'Inter',sans-serif", minWidth: 28 }}>{num}</span>
                <span style={{ fontSize: 12, color: T.txt2, textTransform: "uppercase", letterSpacing: ".04em" }}>{lbl}</span>
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
            {loading ? "Входим..." : "ВОЙТИ →"}
          </Btn>

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

  async function saveProfile() {
    if (!form.name.trim())  { setErr("Введите имя"); return; }
    if (!form.login.trim()) { setErr("Введите логин"); return; }
    if (form.pw && form.pw !== form.pw2) { setErr("Пароли не совпадают"); return; }
    if (form.pw && form.pw.length < 6)   { setErr("Пароль минимум 6 символов"); return; }
    setErr("");
    try {
      // Меняем пароль через Supabase Auth если введён
      if (form.pw) {
        const { error } = await supabase.auth.updateUser({ password: form.pw });
        if (error) throw error;
      }
      const ini = form.name.trim().split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
      onUpdateUser({ ...user, name: form.name.trim(), login: form.login.trim(), ini });
      setOk(true);
      setTimeout(() => setShowProfile(false), 1200);
    } catch(e) {
      setErr("Ошибка: " + e.message);
    }
  }

  return (
    <>
      {/* Profile modal */}
      {showProfile && (
        <div style={{ position:"fixed", inset:0, background:T.modalBg, zIndex:600, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderLeft:`3px solid ${roleColor}`, borderRadius:8, width:"100%", maxWidth:420 }}>
            <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:T.bg3 }}>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:T.txt0, fontFamily:"'Inter',sans-serif" }}>Мой профиль</div>
                <div style={{ fontSize:12, color:T.txt2, marginTop:2 }}>{ROLE_LABEL[user.role]}</div>
              </div>
              <button onClick={() => setShowProfile(false)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:22, color:T.txt2 }}>×</button>
            </div>
            <div style={{ padding:"20px", display:"flex", flexDirection:"column", gap:14 }}>
              {/* Avatar preview */}
              <div style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", background:T.bg3, borderRadius:6 }}>
                <div style={{ width:48, height:48, borderRadius:6, background:`${roleColor}20`, border:`2px solid ${roleColor}50`,
                  color:roleColor, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:700, fontFamily:"'Inter',sans-serif" }}>
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
                <Btn variant="success" style={{ flex:1, padding:"11px" }} onClick={saveProfile} T={T}>Сохранить</Btn>
                <Btn variant="ghost"   style={{ padding:"11px 16px" }}    onClick={() => setShowProfile(false)} T={T}>Отмена</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: T.bg2, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 56, position: "sticky", top: 0, zIndex: 300 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ cursor: "pointer", color: T.txt0 }} onClick={() => onNav("dash")}>
            <Logo size={26} />
          </div>
          <div style={{ width: 1, height: 20, background: T.border }} />
          <nav style={{ display: "flex", gap: 2 }}>
            {nav.map(([key, label]) => (
              <button key={key} onClick={() => onNav(key)}
                style={{ padding: "16px 14px 14px", borderRadius: 0, border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: page === key ? 600 : 400,
                  background: "transparent",
                  color: page === key ? T.txt0 : T.txt2,
                  borderBottom: page === key ? `2px solid ${T.red}` : "2px solid transparent",
                  position: "relative", transition: "color .1s", marginBottom: "-1px" }}>
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
            style={{ padding: "5px 12px", borderRadius: 4, border: `1px solid ${T.border}`, background: T.bg3, color: T.txt1, fontSize: 12, cursor: "pointer", fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>
            {isDark ? "☀ Светлая" : "🌙 Тёмная"}
          </button>
          {/* Clickable profile area */}
          <div onClick={openProfile} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", padding:"4px 8px", borderRadius:5,
            border:`1px solid transparent`, transition:"border-color 0.15s" }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=T.border}
            onMouseLeave={e=>e.currentTarget.style.borderColor="transparent"}>
            <div style={{ textAlign: "right", lineHeight: 1.4 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.txt0 }}>{user.name}</div>
              <div style={{ fontSize: 12, color: roleColor, textTransform: "uppercase", letterSpacing: ".04em", fontWeight: 600 }}>{ROLE_LABEL[user.role]}</div>
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
// Глобальная утилита — используется в Dashboard, ObjDetail, RigDetail
function repDateToIso(dateStr, anchorYear) {
  if (!dateStr) return "0000-00-00";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split(".");
    return `${y}-${m}-${d}`;
  }
  const parts = dateStr.split(".");
  if (parts.length >= 2) {
    const d = parts[0].padStart(2,"0");
    const m = parts[1].padStart(2,"0");
    const y = anchorYear || new Date().getFullYear().toString();
    return `${y}-${m}-${d}`;
  }
  return dateStr;
}

function Dashboard({ objs, rigs, reps, plans, ktgPlans, nodes, onDrillObj, T }) {

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

  // Доля месяца прошедшая на сегодня (для пропорционального плана)
  // Используем завершённые дни (вчера включительно) — данные за сегодня ещё не утверждены
  const { todayPlanFraction, completedDays } = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const curMonthStart = getMonthStart(todayIso);
    if (mode !== "month" || rangeStart !== curMonthStart) return { todayPlanFraction: 1, completedDays: null };
    const [y, m] = rangeStart.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const todayDay = new Date().getDate();
    const cd = Math.max(1, todayDay - 1);
    return { todayPlanFraction: cd / daysInMonth, completedDays: cd };
  }, [mode, rangeStart]);

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
  function repDateToIsoLocal(dateStr) { return repDateToIso(dateStr, anchor.slice(0,4)); }

  const filteredReps = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const curMonthStart = getMonthStart(todayIso);
    const isCurrentMonth = mode === "month" && rangeStart === curMonthStart;
    // Для текущего месяца факт — только до completedDays (как и план)
    const effectiveEnd = isCurrentMonth
      ? (() => { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10); })()
      : rangeEnd;
    return reps.filter((r) => {
      if (r.status === "draft") return false;
      const iso = repDateToIsoLocal(r.date);
      return iso >= rangeStart && iso <= effectiveEnd;
    });
  }, [reps, rangeStart, rangeEnd, anchor, mode]);

  // ── Compute plan for the period ──────────────────────────────────────────
  // Для текущего месяца — используем monthTotal × completedDays/daysInMonth (точная пропорция)
  // Для прошлых/будущих месяцев — суммируем план по всем дням
  function getPlanForPeriod(oid) {
    const todayIso       = new Date().toISOString().slice(0, 10);
    const curMonthStart  = getMonthStart(todayIso);
    const isCurrentMonth = mode === "month" && rangeStart === curMonthStart;

    if (isCurrentMonth) {
      // Точная пропорция: monthTotal × completedDays / daysInMonth
      const [y, m]    = rangeStart.split("-").map(Number);
      const daysInMonth = new Date(y, m, 0).getDate();
      const todayDay  = new Date().getDate();
      const cd        = Math.max(1, todayDay - 1);  // завершённые дни

      let df = 0, bf = 0, kp = 0, kpCount = 0;
      plans.forEach((entry) => {
        if (entry.oid !== oid) return;
        if (entry.mode !== "month" || entry.periodKey !== rangeStart.slice(0, 7)) return;
        if (entry.field === "df") {
          const mt = entry.monthTotal != null ? entry.monthTotal : (entry.dates || []).reduce((s,d)=>s+d.val,0);
          df = mt * cd / daysInMonth;
        }
        if (entry.field === "bf") {
          const mt = entry.monthTotal != null ? entry.monthTotal : (entry.dates || []).reduce((s,d)=>s+d.val,0);
          bf = mt * cd / daysInMonth;
        }
        if (entry.field === "kp") {
          const dayVals = (entry.dates||[]).filter(d=>d.date>=rangeStart&&d.date<=todayIso);
          dayVals.forEach(d=>{kp+=d.val;kpCount++;});
        }
      });
      return { df, bf, kp: kpCount ? Math.round(kp / kpCount) : null };
    }

    // Прошлые/будущие месяцы — суммируем все дни периода
    let df = 0, bf = 0, kp = 0, kpCount = 0;
    plans.forEach((entry) => {
      if (entry.oid !== oid) return;
      (entry.dates || []).forEach((d) => {
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
      const iso = repDateToIsoLocal(r.date);
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
    const t = { df: 0, bf: 0, fuel: 0, wh: 0, dh: 0, overDrill: 0, techDH: 0, calHrs: 0 };
    filteredReps.forEach((r) => {
      t.df += r.df; t.bf += r.bf; t.fuel += r.fuel; t.wh += r.wh; t.dh += r.dh;
      t.overDrill += (r.rigs||[]).reduce((s,rig) => s + (toNum(rig.overDrill)||0), 0);
      // Календарное время = сумма смен
      t.calHrs += toNum(r.shiftDurationHours || r.shift_duration_hrs || 11);
      // Технические простои
      const events = r.downtime_events || r.rigEntries?.flatMap(e=>e.downtimes||[]) || [];
      t.techDH += techDowntimeHours(events);
    });
    return t;
  }, [filteredReps]);

  // КТГ и КИО по всем отчётам периода
  const totalKtg = totals.calHrs > 0 ? Math.round((totals.calHrs - totals.techDH) / totals.calHrs * 100) : null;
  const totalKio = totals.calHrs > 0 ? Math.min(100, Math.round(totals.wh / totals.calHrs * 100)) : null;

  const planTotals = useMemo(() => {
    let df = 0, bf = 0;
    objs.forEach((o) => { const p = getPlanForPeriod(o.id); df += p.df; bf += p.bf; });
    return { df, bf };
  }, [plans, rangeStart, rangeEnd, objs, mode]);

  // Полный месячный план (независимо от completedDays) — для отображения рядом с пропорциональным
  const fullMonthPlanTotals = useMemo(() => {
    const [y, m] = rangeStart.split("-").map(Number);
    let df = 0, bf = 0;
    objs.forEach((o) => {
      const objPlans = (plans||[]).filter(p=>p.oid===o.id&&p.year===y&&p.month===m);
      objPlans.forEach(p=>{
        const mt = p.monthTotal != null ? p.monthTotal : (p.dates||[]).reduce((s,d)=>s+d.val,0);
        if (p.field==="df") df += mt;
        if (p.field==="bf") bf += mt;
      });
      if (!objPlans.find(p=>p.field==="df")) df += o.dp||0;
      if (!objPlans.find(p=>p.field==="bf")) bf += o.bp||0;
    });
    return { df: Math.round(df), bf: Math.round(bf) };
  }, [plans, rangeStart, objs]);

  // totalKtg и totalKio вычислены выше в useMemo

  // Плановый КТГ — из принятых КТГ-планов за текущий месяц
  // items[assetId][date] = число часов (0–22)
  const DAY_CAP = 22;
  const planAvgKtg = useMemo(() => {
    const ym = rangeStart.slice(0,7);
    const accepted = (ktgPlans||[]).filter(p => p.status==="ACCEPTED" && p.year_month===ym);
    if (!accepted.length) return null;
    let totalH=0, maxH=0;
    accepted.forEach(plan => {
      const aids = Object.keys(plan.items||{});
      aids.forEach(aid => {
        const dayVals = Object.values(plan.items[aid]||{});
        dayVals.forEach(v => {
          const h = Number(v);
          totalH += h;
          maxH   += DAY_CAP;
        });
      });
    });
    return maxH>0 ? Math.round(totalH/maxH*100) : null;
  }, [ktgPlans, rangeStart]);
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

  // КТГ план по объекту из принятых KTG-планов за текущий месяц
  function ktgPlanForObj(objId) {
    const ym = rangeStart.slice(0,7);
    const plan = (ktgPlans||[]).find(p => p.status==="ACCEPTED" && p.object_id===objId && p.year_month===ym);
    if (!plan?.items) return null;
    let totalH=0, maxH=0;
    Object.keys(plan.items).forEach(aid => {
      Object.values(plan.items[aid]||{}).forEach(v => {
        totalH += Number(v)||0;
        maxH   += DAY_CAP;
      });
    });
    return maxH>0 ? Math.round(totalH/maxH*100) : null;
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
          <button onClick={() => shift(-1)} style={{ padding: "7px 12px", background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 4, color: T.txt1, cursor: "pointer", fontSize: 14, lineHeight: 1, fontFamily:"'Inter',sans-serif" }}>‹</button>
          <div style={{ padding: "7px 18px", background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 14, fontWeight: 700, color: T.txt0, fontFamily: "'Inter',sans-serif", minWidth: 160, textAlign: "center", letterSpacing: "1px" }}>
            {label}
          </div>
          <button onClick={() => shift(1)} style={{ padding: "7px 12px", background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 4, color: T.txt1, cursor: "pointer", fontSize: 14, lineHeight: 1, fontFamily:"'Inter',sans-serif" }}>›</button>
        </div>
        {/* Month picker */}
        <input type="month" value={anchor.slice(0,7)} onChange={(e) => setAnchor(e.target.value + "-01")}
          style={{ padding: "7px 10px", background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 4, color: T.txt0, fontSize: 12, outline: "none", fontFamily: "'Inter',sans-serif", cursor: "pointer" }} />
        {/* Fact count */}
        <div style={{ fontSize: 12, color: T.txt2, marginLeft: "auto" }}>
          <span style={{ color: T.txt0, fontWeight: 700 }}>{filteredReps.length}</span> отчётов за месяц
        </div>
      </div>

      {/* ── Top KPIs ── */}
      {(()=>{
        const planLabel = completedDays ? `по ${completedDays} число` : "за период";
        const fraction = todayPlanFraction > 0 ? todayPlanFraction : 1;
        const fullDf = completedDays && planTotals.df > 0 ? Math.round(planTotals.df / fraction) : 0;
        const fullBf = completedDays && planTotals.bf > 0 ? Math.round(planTotals.bf / fraction) : 0;
        const dfPctFull = fullDf > 0 ? Math.round(totals.df / fullDf * 100) : null;
        const bfPctFull = fullBf > 0 && totals.bf > 0 ? Math.round(totals.bf / fullBf * 100) : null;
        return (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10, marginBottom: 20 }}>
            <Card accent={T.red} style={{ padding: "16px 18px" }} T={T}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.red, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>⛏ Бурение</div>
              <ProgressBar fact={totals.df} plan={planTotals.df || objs.reduce((s,o)=>s+o.dp,0)} T={T} />
              {planTotals.df > 0 && <div style={{ fontSize:12, color: T.txt2, marginTop: 6 }}>
                План {planLabel}: <b style={{ color: T.txt0 }}>{planTotals.df.toLocaleString()}</b>
              </div>}
              {fullDf > 0 && <div style={{ fontSize:12, color: T.blue, marginTop: 4, display:"flex", justifyContent:"space-between" }}>
                <span>План на месяц: <b>{fullDf.toLocaleString()}</b></span>
                {dfPctFull !== null && <b style={{color: dfPctFull>=100?T.green:dfPctFull>=70?T.amber:"#ef4444"}}>{dfPctFull}%</b>}
              </div>}
            </Card>
            <Card accent={T.amber} style={{ padding: "16px 18px" }} T={T}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.amber, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>💥 Взрывы</div>
              <ProgressBar fact={totals.bf} plan={planTotals.bf || objs.reduce((s,o)=>s+o.bp,0)} T={T} />
              {planTotals.bf > 0 && <div style={{ fontSize:12, color: T.txt2, marginTop: 6 }}>
                План {planLabel}: <b style={{ color: T.txt0 }}>{planTotals.bf.toLocaleString()}</b>
              </div>}
              {fullBf > 0 && <div style={{ fontSize:12, color: T.blue, marginTop: 4, display:"flex", justifyContent:"space-between" }}>
                <span>План на месяц: <b>{fullBf.toLocaleString()}</b></span>
                {bfPctFull !== null && <b style={{color: bfPctFull>=100?T.green:bfPctFull>=70?T.amber:"#ef4444"}}>{bfPctFull}%</b>}
              </div>}
            </Card>
            <Card accent={T.green} style={{ padding: "16px 18px" }} T={T}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.green, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>⚙ КТГ / КИО</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
                <div style={{ background: T.bg1, borderRadius: 3, padding: "5px 10px", border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, color: T.txt2, textTransform: "uppercase", marginBottom: 1 }}>КТГ ПЛАН</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: planAvgKtg!==null?T.txt0:"#5a7499", fontFamily: "'Inter',sans-serif" }}>
                    {planAvgKtg!==null?`${planAvgKtg}%`:"—"}
                  </div>
                </div>
                <div style={{ background: `${T.green}10`, borderRadius: 3, padding: "5px 10px", border: `1px solid ${T.green}30` }}>
                  <div style={{ fontSize: 11, color: T.green, textTransform: "uppercase", marginBottom: 1, fontWeight: 700 }}>КТГ ФАКТ</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: totalKtg!==null?scoreColor(totalKtg,85,70,T):"#5a7499", fontFamily: "'Inter',sans-serif" }}>
                    {totalKtg!==null?`${totalKtg}%`:"—"}
                  </div>
                </div>
                <div style={{ background: T.bg1, borderRadius: 3, padding: "5px 10px", border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, color: T.txt2, textTransform: "uppercase", marginBottom: 1 }}>КИО</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: totalKio!==null?scoreColor(totalKio,75,60,T):"#5a7499", fontFamily: "'Inter',sans-serif" }}>
                    {totalKio!==null?`${totalKio}%`:"—"}
                  </div>
                </div>
                <div style={{ background: T.bg1, borderRadius: 3, padding: "5px 10px", border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, color: T.txt2, textTransform: "uppercase", marginBottom: 1 }}>КВ (ч)</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: T.txt0, fontFamily: "'Inter',sans-serif" }}>
                    {totals.calHrs > 0 ? totals.calHrs.toLocaleString() : "—"}
                  </div>
                </div>
              </div>
            </Card>
            <Card accent={T.violet} style={{ padding: "16px 18px" }} T={T}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.violet, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>⛽ ГСМ удельный</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ background: T.bg1, borderRadius: 4, padding: "8px 10px", border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 12, color: T.txt2, textTransform: "uppercase", marginBottom: 3 }}>Бурение</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: totals.fuel > 0 && totals.df > 0 ? T.red : T.txt2, fontFamily: "'Inter',sans-serif", lineHeight: 1 }}>
                    {totals.fuel > 0 && totals.df > 0 ? (totals.df / totals.fuel).toFixed(2) : "—"}
                  </div>
                  <div style={{ fontSize: 12, color: T.txt2, marginTop: 3 }}>п.м. / л</div>
                </div>
                <div style={{ background: T.bg1, borderRadius: 4, padding: "8px 10px", border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 12, color: T.txt2, textTransform: "uppercase", marginBottom: 3 }}>Взрывы</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: totals.fuel > 0 && totals.bf > 0 ? T.amber : T.txt2, fontFamily: "'Inter',sans-serif", lineHeight: 1 }}>
                    {totals.fuel > 0 && totals.bf > 0 ? (totals.bf / totals.fuel).toFixed(2) : "—"}
                  </div>
                  <div style={{ fontSize: 12, color: T.txt2, marginTop: 3 }}>м³ / л</div>
                </div>
              </div>
              {totals.fuel > 0 && <div style={{ fontSize: 12, color: T.txt2, marginTop: 8 }}>
                Итого ГСМ: <b style={{ color: T.txt0 }}>{totals.fuel.toLocaleString()} л</b>
              </div>}
            </Card>
          </div>
        );
      })()}

      <SectionTitle label={`Участки (${objs.length})`} T={T} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 }}>
        {objs.map((obj, i) => {
          const rr  = filteredReps.filter((r) => r.oid === obj.id);
          const df  = rr.reduce((s,r)=>s+r.df,0), bf = rr.reduce((s,r)=>s+r.bf,0);
          const wh  = rr.reduce((s,r)=>s+r.wh,0), dh = rr.reduce((s,r)=>s+r.dh,0), fuel = rr.reduce((s,r)=>s+r.fuel,0);
          const overDrill = rr.reduce((s,r)=>s+(r.rigs||[]).reduce((ss,rig)=>ss+(toNum(rig.overDrill)||0),0), 0);
          // КТГ и КИО по объекту (kv — для совместимости, используем objKtg)
          const kv  = null; // заменён на objKtg ниже
          const objRepsForKtg = filteredReps.filter(r => r.oid === obj.id);
          const objCalHrs = objRepsForKtg.reduce((s,r) => s + toNum(r.shiftDurationHours || r.shift_duration_hrs || 11), 0);
          const objTechDH = objRepsForKtg.reduce((s,r) => {
            const evs = r.downtime_events || r.rigEntries?.flatMap(e=>e.downtimes||[]) || [];
            return s + techDowntimeHours(evs);
          }, 0);
          const objWh = wh;
          const objKtg = objCalHrs > 0 ? Math.round((objCalHrs - objTechDH) / objCalHrs * 100) : null;
          const objKio = objCalHrs > 0 ? Math.min(100, Math.round(objWh / objCalHrs * 100)) : null;
          const ac  = colors[i % colors.length];
          const pp  = getPlanForPeriod(obj.id);
          const dp  = pp.df || obj.dp, bp = pp.bf || obj.bp;
          const pDf = pct(df, dp), pBf = pct(bf, bp);
          const chartData = getChartData(obj.id);
          const planLabel = completedDays ? `по ${completedDays} число` : "за период";
          // Полный месячный план для этого объекта (из пропорционального через fraction)
          const objPlanFull = (() => {
            const frac = todayPlanFraction > 0 ? todayPlanFraction : 1;
            return { df: dp > 0 ? Math.round(dp / frac) : 0, bf: bp > 0 ? Math.round(bp / frac) : 0 };
          })();
          return (
            <div key={obj.id} onClick={() => onDrillObj(obj.id)}
              style={{ background: T.bg2, borderRadius: 6, border: `1px solid ${T.border}`, borderLeft: `3px solid ${ac}`, cursor: "pointer", overflow: "hidden" }}>
              <div style={{ background: `linear-gradient(90deg,${ac}18,transparent)`, padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.txt0, fontFamily: "'Inter',sans-serif" }}>{obj.name.toUpperCase()}</div>
                  <div style={{ fontSize: 12, color: T.txt2, marginTop: 2 }}>
                    <span style={{ color: ac, fontWeight: 700 }}>{rigs.filter(r=>r.o===obj.id).length}</span> станков · {rr.length} отчётов
                  </div>
                </div>
              </div>
              <div style={{ padding: "12px 16px 14px" }}>
                {[[pDf, dp, df, "Бурение пог.м", T.red, objPlanFull.df], [pBf, bp, bf, "Взрывы м³", T.amber, objPlanFull.bf]].map(([perc, plan, fact, lbl, color, fullPlan]) => {
                  const cc = scoreColor(perc, 85, 70, T);
                  const pctFull = fullPlan > 0 ? Math.round(fact/fullPlan*100) : null;
                  return (
                    <div key={lbl} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: T.txt2, textTransform: "uppercase" }}>{lbl}</span>
                          {todayPlanFraction < 1 && plan > 0 && (
                            <span style={{ fontSize:12, color: T.amber, marginLeft: 5, fontWeight:600 }}>план {planLabel}</span>
                          )}
                        </div>
                        {perc !== null && <span style={{ fontSize: 12, fontWeight: 700, color: cc }}>{perc}%</span>}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 4 }}>
                        <div style={{ background: T.bg1, borderRadius: 3, padding: "5px 10px", border: `1px solid ${T.border}` }}>
                          <div style={{ fontSize: 11, color: T.amber, textTransform: "uppercase", marginBottom: 1, fontWeight:700 }}>
                            ПЛАН {completedDays ? `по ${completedDays}` : ""}
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: T.txt0, fontFamily: "'Inter',sans-serif" }}>{(plan||0).toLocaleString()}</div>
                          {completedDays && fullPlan > 0 && (
                            <div style={{ fontSize:11, color:T.blue, marginTop:3, fontWeight:600 }}>
                              мес: {fullPlan.toLocaleString()}
                            </div>
                          )}
                        </div>
                        <div style={{ background: `${color}10`, borderRadius: 3, padding: "5px 10px", border: `1px solid ${color}30` }}>
                          <div style={{ fontSize: 12, color, textTransform: "uppercase", marginBottom: 1, fontWeight: 700 }}>ФАКТ</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color, fontFamily: "'Inter',sans-serif" }}>{(fact||0).toLocaleString()}</div>
                          {completedDays && pctFull !== null && (
                            <div style={{ fontSize:11, color: pctFull>=100?T.green:pctFull>=60?T.amber:"#ef4444", marginTop:3, fontWeight:600 }}>
                              {pctFull}% от мес.
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ height: 2, background: T.cardSh, borderRadius: 2 }}>
                        <div style={{ height: "100%", width: `${Math.min(perc||0,100)}%`, background: cc, borderRadius: 2 }} />
                      </div>
                    </div>
                  );
                })}
                {/* КТГ план/факт по объекту */}
                {(()=>{
                  const ktgPlan = ktgPlanForObj(obj.id);
                  const ktgFact = objKtg;
                  const ktgPerc = ktgFact !== null && ktgPlan !== null ? Math.round(ktgFact/ktgPlan*100) : null;
                  const cc = ktgFact !== null ? scoreColor(ktgFact, 85, 70, T) : T.txt2;
                  return (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.txt2, textTransform: "uppercase" }}>⚙ КТГ</span>
                        {ktgFact !== null && <span style={{ fontSize: 12, fontWeight: 700, color: cc }}>{ktgFact}%</span>}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 4 }}>
                        <div style={{ background: T.bg1, borderRadius: 3, padding: "5px 10px", border: `1px solid ${T.border}` }}>
                          <div style={{ fontSize: 12, color: T.txt2, textTransform: "uppercase", marginBottom: 1 }}>ПЛАН</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: ktgPlan !== null ? T.txt0 : T.txt2, fontFamily: "'Inter',sans-serif" }}>
                            {ktgPlan !== null ? `${ktgPlan}%` : "—"}
                          </div>
                        </div>
                        <div style={{ background: `${T.green}10`, borderRadius: 3, padding: "5px 10px", border: `1px solid ${T.green}30` }}>
                          <div style={{ fontSize: 12, color: T.green, textTransform: "uppercase", marginBottom: 1, fontWeight: 700 }}>ФАКТ</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: ktgFact !== null ? cc : T.txt2, fontFamily: "'Inter',sans-serif" }}>
                            {ktgFact !== null ? `${ktgFact}%` : "—"}
                          </div>
                        </div>
                      </div>
                      <div style={{ height: 2, background: T.cardSh, borderRadius: 2 }}>
                        <div style={{ height: "100%", width: `${Math.min(ktgFact||0,100)}%`, background: cc, borderRadius: 2 }} />
                      </div>
                    </div>
                  );
                })()}
                <div style={{ display: "flex", gap: 6, paddingTop: 8, borderTop: `1px solid ${T.border}`, marginTop: 4 }}>
                  <div style={{ flex: 1, background: T.bg1, borderRadius: 3, padding: "5px 8px", border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize:12, color: T.txt2, textTransform: "uppercase", marginBottom: 2 }}>⛽ Бур./ГСМ</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: fuel > 0 && df > 0 ? T.red : T.txt2, fontFamily: "'Inter',sans-serif" }}>
                      {fuel > 0 && df > 0 ? (df / fuel).toFixed(2) : "—"}
                      {fuel > 0 && df > 0 && <span style={{ fontSize:12, color: T.txt2, fontWeight: 400 }}> п.м./л</span>}
                    </div>
                  </div>
                  <div style={{ flex: 1, background: T.bg1, borderRadius: 3, padding: "5px 8px", border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize:12, color: T.txt2, textTransform: "uppercase", marginBottom: 2 }}>⛽ Взр./ГСМ</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: fuel > 0 && bf > 0 ? T.amber : T.txt2, fontFamily: "'Inter',sans-serif" }}>
                      {fuel > 0 && bf > 0 ? (bf / fuel).toFixed(2) : "—"}
                      {fuel > 0 && bf > 0 && <span style={{ fontSize:12, color: T.txt2, fontWeight: 400 }}> м³/л</span>}
                    </div>
                    {fuel > 0 && <div style={{ fontSize:12, color: T.txt2, marginTop: 1 }}>{fuel.toLocaleString()} л</div>}
                  </div>
                  {overDrill > 0 && (
                    <div style={{ flex: 1, background: T.bg1, borderRadius: 3, padding: "5px 8px", border: `1px solid ${T.border}` }}>
                      <div style={{ fontSize:12, color: T.txt2, textTransform: "uppercase", marginBottom: 2 }}>📏 Перебур</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.cyan, fontFamily: "'Inter',sans-serif" }}>{overDrill.toLocaleString()} <span style={{ fontSize:12, fontWeight: 400 }}>м</span></div>
                    </div>
                  )}
                  <div style={{ flex: 1, background: T.bg1, borderRadius: 3, padding: "5px 8px", border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize:12, color: T.txt2, textTransform: "uppercase", marginBottom: 2 }}>⏸ Простои</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: dh > 0 ? "#ef4444" : T.txt2, fontFamily: "'Inter',sans-serif" }}>{dh} ч</div>
                    {wh > 0 && dh > 0 && <div style={{ fontSize:12, color: "#ef4444", marginTop: 1 }}>{Math.round(dh/(wh+dh)*100)}% от раб.</div>}
                  </div>
                  {objKio !== null && (
                    <div style={{ flex: 1, background: T.bg1, borderRadius: 3, padding: "5px 8px", border: `1px solid ${T.border}` }}>
                      <div style={{ fontSize:12, color: T.txt2, textTransform: "uppercase", marginBottom: 2 }}>⚙ КИО</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: scoreColor(objKio, 75, 60, T), fontFamily: "'Inter',sans-serif" }}>{objKio}%</div>
                    </div>
                  )}
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
  if (!obj) return null;
  const approved = reps.filter((r) => r.status !== "draft" && r.oid === objId);

  const tot = { df: 0, bf: 0, wh: 0, dh: 0, fuel: 0, overDrill: 0, calHrs: 0, techDH: 0 };
  approved.forEach((r) => {
    tot.df+=r.df; tot.bf+=(r.bf||0); tot.wh+=r.wh; tot.dh+=r.dh; tot.fuel+=r.fuel;
    tot.overDrill += (r.rigs||[]).reduce((s,rig) => s + (toNum(rig.overDrill)||0), 0);
    tot.calHrs += toNum(r.shiftDurationHours || r.shift_duration_hrs || 11);
    const evs = r.downtime_events || r.rigEntries?.flatMap(e=>e.downtimes||[]) || [];
    tot.techDH += techDowntimeHours(evs);
  });
  const kv    = repsKtgKio(approved).ktg;
  const kvKio = tot.calHrs > 0 ? Math.min(100, Math.round(tot.wh / tot.calHrs * 100)) : null;
  const fuelPerM3 = tot.bf > 0 ? (tot.fuel / tot.bf).toFixed(1) : null;
  const colors = OBJ_COLORS(T);
  const ac = colors[objs.findIndex((o) => o.id === objId) % colors.length];
  const objRigs = rigs.filter((rg) => rg.o === objId);

  return (
    <div>
      <Breadcrumb items={[{ label: "DASHBOARD", onClick: onBack }, { label: obj.name.toUpperCase() }]} T={T} />
      <div style={{ fontSize: 28, fontWeight: 700, color: T.txt0, fontFamily: "'Inter',sans-serif", marginBottom: 18 }}>
        {obj.name.toUpperCase()}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(155px,1fr))", gap: 10, marginBottom: 24 }}>
        {[
          [T.red,    "Бурение", tot.df,   obj.dp, "п.м"],
          [T.amber,  "Взрывы",  tot.bf,   obj.bp, "м³"],
          [T.green,  "КТГ",     kv !== null ? `${kv}%` : "—", null, null],
          [T.cyan,   "КИО",     kvKio !== null ? `${kvKio}%` : "—", null, null],
          [T.violet, "ГСМ",     tot.fuel, null,   "л"],
          ["#ef4444","Простои", tot.dh,   null,   "ч"],
        ].map(([color, lbl, fact, plan, unit]) => (
          <Card key={lbl} accent={color} style={{ padding: "14px 16px" }} T={T}>
            <div style={{ fontSize: 12, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>{lbl}</div>
            {plan !== null
              ? <ProgressBar fact={fact} plan={plan} T={T} />
              : <div>
                  <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: "'Inter',sans-serif", lineHeight: 1 }}>{fact}</div>
                  {unit && <div style={{ fontSize: 12, color: T.txt2, textTransform: "uppercase", marginTop: 3 }}>{unit}</div>}
                </div>
            }
          </Card>
        ))}
        {/* Удельный ГСМ */}
        <Card accent={T.violet} style={{ padding: "14px 16px" }} T={T}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.violet, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>⛽ ГСМ уд.</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: fuelPerM3 ? T.violet : T.txt2, fontFamily: "'Inter',sans-serif", lineHeight: 1 }}>
            {fuelPerM3 || "—"}
          </div>
          <div style={{ fontSize: 12, color: T.txt2, textTransform: "uppercase", marginTop: 3 }}>л/м³</div>
        </Card>
        {/* Перебур (если есть) */}
        {tot.overDrill > 0 && (
          <Card accent={T.cyan} style={{ padding: "14px 16px" }} T={T}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.cyan, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>📏 Перебур</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: T.cyan, fontFamily: "'Inter',sans-serif", lineHeight: 1 }}>{tot.overDrill.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: T.txt2, textTransform: "uppercase", marginTop: 3 }}>м</div>
          </Card>
        )}
      </div>

      {/* Rig cards */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.red, textTransform: "uppercase", letterSpacing: ".25em", marginBottom: 4 }}>▌ Буровые станки</div>
        <div style={{ fontSize: 12, color: T.txt2, marginBottom: 16 }}>Нажмите на станок для просмотра отчётов по сменам</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12, marginBottom: 28 }}>
        {objRigs.map((rg) => {
          const df        = approved.reduce((s,r) => s + (r.rigs?.find(x=>x.id===rg.id)?.df        || 0), 0);
          const wh        = approved.reduce((s,r) => s + (r.rigs?.find(x=>x.id===rg.id)?.wh        || 0), 0);
          const dh        = approved.reduce((s,r) => s + (r.rigs?.find(x=>x.id===rg.id)?.dh        || 0), 0);
          const fuel      = approved.reduce((s,r) => s + (r.rigs?.find(x=>x.id===rg.id)?.fuel      || 0), 0);
          const overDrill = approved.reduce((s,r) => s + (toNum(r.rigs?.find(x=>x.id===rg.id)?.overDrill) || 0), 0);
          // КТГ по станку: берём отчёты где этот станок участвовал
          const rigRepsList = approved.filter(r => r.rigs?.find(x => x.id === rg.id));
          const kv2  = repsKtgKio(rigRepsList).ktg;
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
                  <div style={{ fontSize: 15, fontWeight: 900, color: T.txt0, fontFamily: "'Inter',sans-serif", letterSpacing: "1px" }}>{rg.n}</div>
                  <div style={{ fontSize: 12, color: T.txt2, marginTop: 2 }}>{repCount} смен · <span style={{ color: ac }}>→ детали</span></div>
                </div>
                <KTGGauge v={kv2} plan={obj.kp} size={52} T={T} />
              </div>
              <div style={{ padding: "10px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[[T.red,"Бурение",df,"п.м"],[T.blue,"Работа",wh,"ч"],["#ef4444","Простой",dh,"ч"]].map(([color,lbl,val,unit]) => (
                  <div key={lbl} style={{ background: T.bg3, borderRadius: 4, padding: "7px 10px", border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 12, color: T.txt2, textTransform: "uppercase", marginBottom: 2 }}>{lbl}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color, fontFamily: "'Inter',sans-serif", lineHeight: 1 }}>
                      {val.toLocaleString()} <span style={{ fontSize: 12, fontWeight: 400 }}>{unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "0 14px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                <div style={{ fontSize: 12, color: T.txt2 }}>ГСМ: <b style={{ color: T.violet }}>{fuel.toLocaleString()} л</b></div>
                {overDrill > 0 && <div style={{ fontSize: 12, color: T.cyan, fontWeight: 700 }}>📏 Перебур: {overDrill.toLocaleString()} м</div>}
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
  const approved = reps.filter((r) => r.status !== "draft" && r.oid === objId);
  const rigReps  = approved
    .filter((r) => r.rigs?.find((x) => x.id === rigId))
    .map((r)   => ({ rep: r, rd: r.rigs.find((x) => x.id === rigId) }));

  const tot = {
    df:   rigReps.reduce((s, { rd }) => s + rd.df,   0),

    wh:   rigReps.reduce((s, { rd }) => s + rd.wh,   0),
    dh:   rigReps.reduce((s, { rd }) => s + rd.dh,   0),
    fuel: rigReps.reduce((s, { rd }) => s + rd.fuel, 0),
  };
  const kv = repsKtgKio(approved).ktg;
  const kc = scoreColor(kv, obj.kp, obj.kp - 12, T);

  return (
    <div>
      <Breadcrumb items={[{ label: "DASHBOARD", onClick: onBack }, { label: obj.name.toUpperCase(), onClick: onBackToObj }, { label: rg.n }]} T={T} />
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <div style={{ padding: "8px 18px", background: `linear-gradient(135deg,${ac}25,${ac}10)`, border: `2px solid ${ac}`, borderRadius: 6 }}>
          <div style={{ fontSize: 12, color: ac, textTransform: "uppercase", letterSpacing: ".15em", marginBottom: 2 }}>Буровой станок</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: T.txt0, fontFamily: "'Inter',sans-serif", letterSpacing: "2px" }}>{rg.n}</div>
          <div style={{ fontSize: 12, color: T.txt2, marginTop: 2 }}>{obj.name} · {rigReps.length} смен</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <KTGGauge v={kv} plan={obj.kp} size={80} T={T} />
          <div style={{ fontSize: 12, color: T.txt2, textTransform: "uppercase", marginTop: 2 }}>КТГ</div>
        </div>
      </div>

      {/* Rig totals */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 24 }}>
        {[[T.red,"Бурение",tot.df,"п.м"],[T.blue,"Работа",tot.wh,"ч"],["#ef4444","⏸ Простой",tot.dh,"ч"],[T.violet,"⛽ ГСМ",tot.fuel,"л"]].map(([color,lbl,val,unit]) => (
          <Card key={lbl} accent={color} style={{ padding: "14px 16px" }} T={T}>
            <div style={{ fontSize: 12, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 }}>{lbl}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: "'Inter',sans-serif", lineHeight: 1 }}>{val.toLocaleString()}</div>
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
              const kv2 = repKtg(rd);
              return (
                <Card key={rep.id} accent={ac} style={{ padding: "14px 16px" }} T={T}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.txt0, fontFamily: "'Inter',sans-serif" }}>
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
                    {[[T.red,"Бурение",rd.df,"п.м"],[T.blue,"Работа",rd.wh,"ч"],["#ef4444","Простой",rd.dh,"ч"],[T.violet,"ГСМ",rd.fuel,"л"]].map(([color,lbl,val,unit]) => (
                      <div key={lbl} style={{ background: T.bg3, borderRadius: 4, padding: "8px 10px", border: `1px solid ${T.border}`, textAlign: "center" }}>
                        <div style={{ fontSize: 12, color: T.txt2, textTransform: "uppercase", marginBottom: 3 }}>{lbl}</div>
                        <div style={{ fontSize: 17, fontWeight: 700, color, fontFamily: "'Inter',sans-serif", lineHeight: 1 }}>{val}</div>
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

// ═══════════════════════════════════════════════════════════════════════════════
// SHIFT REPORT 2.0  —  ForemanForm (полная замена, обратная совместимость)
// Новая модель: rigEntries[] с downtimes[] per станок + валидация
// ═══════════════════════════════════════════════════════════════════════════════

// ── Справочник простоев 2.0 ──────────────────────────────────────────────────
const SR_DOWNTIME_CFG = {
  technical: {
    label: "⚙ Техническая", color: "#ef4444",
    reasons: [
      { key: "repair",        label: "Ремонт" },
      { key: "maintenance",   label: "Плановое ТО" },
      { key: "waiting_parts", label: "Ожидание запчастей" },
      { key: "hydraulics",    label: "Гидросистема" },
      { key: "engine",        label: "Двигатель" },
      { key: "electrics",     label: "Электрика" },
      { key: "other_tech",    label: "Прочее техническое" },
    ],
  },
  organizational: {
    label: "⏳ Организационная", color: "#f59e0b",
    reasons: [
      { key: "no_work_front",  label: "Нет фронта работ" },
      { key: "shift_change",   label: "Пересменка" },
      { key: "no_operator",    label: "Нет оператора" },
      { key: "no_explosives",  label: "Нет ВВ / СВ" },
      { key: "surveyor_wait",  label: "Ожидание маркшейдера" },
      { key: "other_org",      label: "Прочее организационное" },
    ],
  },
  external: {
    label: "🌩 Внешняя", color: "#3b82f6",
    reasons: [
      { key: "weather",       label: "Погодные условия" },
      { key: "blast_zone",    label: "Зона отчуждения (взрыв)" },
      { key: "road_blocked",  label: "Дорога заблокирована" },
      { key: "power_outage",  label: "Отключение электроэнергии" },
      { key: "other_ext",     label: "Прочее внешнее" },
    ],
  },
};

// ── Utility functions ─────────────────────────────────────────────────────────
function getDowntimeTotal(downtimes) {
  return (downtimes || []).reduce((s, d) => s + toNum(d.durationHours), 0);
}

function getRigEntryTotalHours(entry) {
  return toNum(entry.workingHours) + getDowntimeTotal(entry.downtimes);
}

function validateRigEntry(entry, shiftDurationHours = 11) {
  const errors = [];
  if (toNum(entry.drillingMeters) < 0)  errors.push("Метраж не может быть отрицательным");
  if (toNum(entry.fuelLiters) < 0)      errors.push("ГСМ не может быть отрицательным");
  // Проверяем что простои не превышают смену
  const dh = getDowntimeTotal(entry.downtimes);
  if (dh > shiftDurationHours)
    errors.push(`Простои (${dh.toFixed(1)}ч) превышают длительность смены (${shiftDurationHours}ч)`);
  (entry.downtimes || []).forEach((d, i) => {
    if (toNum(d.durationHours) <= 0) errors.push(`Простой #${i+1}: укажите продолжительность`);
    if (!d.category)                 errors.push(`Простой #${i+1}: выберите категорию`);
    if (!d.reason)                   errors.push(`Простой #${i+1}: выберите причину`);
  });
  return errors;
}

function validateShiftReport(report) {
  const errors = [];
  if (!report.date)   errors.push("Укажите дату");
  if (!report.siteId) errors.push("Выберите участок");
  if (!report.rigEntries || report.rigEntries.length === 0)
    errors.push("Добавьте хотя бы один станок");

  // Проверка дублей
  const rigIds = report.rigEntries.map(e => e.rigId);
  if (new Set(rigIds).size !== rigIds.length) errors.push("Станок не должен дублироваться в отчёте");

  report.rigEntries.forEach(entry => {
    const eName = entry.rigName || entry.rigId;
    const errs = validateRigEntry(entry, report.shiftDurationHours || 11);
    errs.forEach(e => errors.push(`[${eName}] ${e}`));
  });
  return errors;
}

// ── Downtime Editor (модальное окно per станок) ───────────────────────────────
function SR_DowntimeEditor({ rigName, downtimes, shiftDurationHours, workingHours, onSave, onClose, T }) {
  const [items,   setItems]   = useState(downtimes.map(d => ({ ...d })));
  const [adding,  setAdding]  = useState(false);
  const [draft,   setDraft]   = useState({ category: "technical", reason: "", customReason: "", durationHours: "", comment: "" });
  const [draftErr, setDraftErr] = useState("");

  const usedHours   = items.reduce((s, d) => s + toNum(d.durationHours), 0);
  const totalHours  = toNum(workingHours) + usedHours;
  const remaining   = (shiftDurationHours || 11) - totalHours;
  const overLimit   = totalHours > (shiftDurationHours || 11);

  const catCfg = SR_DOWNTIME_CFG[draft.category];

  function addItem() {
    const effectiveReason = draft.reason === "custom" ? (draft.customReason || "").trim() : draft.reason;
    if (!effectiveReason)                   { setDraftErr("Выберите или введите причину"); return; }
    if (toNum(draft.durationHours) <= 0)    { setDraftErr("Укажите продолжительность"); return; }
    if (remaining < 0 && toNum(draft.durationHours) > 0)
      { setDraftErr(`Превышена длительность смены (${shiftDurationHours}ч)`); return; }
    setItems(prev => [...prev, { id: genId(), category: draft.category, reason: effectiveReason, durationHours: toNum(draft.durationHours), comment: draft.comment }]);
    setDraft({ category: draft.category, reason: "", customReason: "", durationHours: "", comment: "" });
    setDraftErr("");
    setAdding(false);
  }

  function removeItem(id) { setItems(prev => prev.filter(x => x.id !== id)); }

  return (
    <div style={{ position:"fixed", inset:0, background:T.modalBg, zIndex:1100, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:20, overflowY:"auto" }}>
      <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderLeft:`3px solid #ef4444`, borderRadius:8, width:"100%", maxWidth:520, marginTop:20, marginBottom:40 }}>
        {/* Header */}
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:T.bg3 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:T.txt0, fontFamily:"'Inter',sans-serif" }}>⏸ Простои — {rigName}</div>
            <div style={{ fontSize:12, color:T.txt2, marginTop:2 }}>
              Смена {shiftDurationHours}ч · Работа {toNum(workingHours)}ч · Простои {usedHours.toFixed(1)}ч
              {overLimit
                ? <span style={{ color:"#ef4444", fontWeight:700 }}> · ⚠ Превышение!</span>
                : <span style={{ color:T.green }}> · Остаток {Math.max(0,remaining).toFixed(1)}ч</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:T.txt2, fontSize:20, cursor:"pointer", lineHeight:1 }}>×</button>
        </div>

        <div style={{ padding:"16px 18px", display:"flex", flexDirection:"column", gap:10 }}>
          {/* Hour balance bar */}
          <div style={{ height:6, background:T.bg3, borderRadius:3, overflow:"hidden" }}>
            {(() => {
              const sh = shiftDurationHours || 11;
              const wPct  = Math.min(toNum(workingHours) / sh * 100, 100);
              const dtPct = Math.min(usedHours / sh * 100, 100 - wPct);
              return (<>
                <div style={{ position:"relative", height:"100%", display:"flex" }}>
                  <div style={{ width:`${wPct}%`, background:T.blue, transition:"width 0.3s" }} />
                  <div style={{ width:`${dtPct}%`, background:"#ef4444", transition:"width 0.3s" }} />
                </div>
              </>);
            })()}
          </div>
          <div style={{ display:"flex", gap:14, fontSize:12, color:T.txt2 }}>
            <span><span style={{ color:T.blue }}>■</span> Работа {toNum(workingHours)}ч</span>
            <span><span style={{ color:"#ef4444" }}>■</span> Простои {usedHours.toFixed(1)}ч</span>
            <span style={{ marginLeft:"auto", color: overLimit ? "#ef4444" : T.txt2, fontWeight: overLimit ? 700 : 400 }}>
              {overLimit ? `⚠ +${(totalHours - shiftDurationHours).toFixed(1)}ч` : `≤ ${shiftDurationHours}ч ✓`}
            </span>
          </div>

          {/* Existing items */}
          {items.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              {items.map(item => {
                const cc = SR_DOWNTIME_CFG[item.category];
                const rLabel = cc?.reasons.find(r => r.key === item.reason)?.label || item.reason;
                return (
                  <div key={item.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:T.bg3, borderRadius:5, border:`1px solid ${T.border}`, borderLeft:`3px solid ${cc?.color||T.border}` }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:T.txt0 }}>{rLabel}</div>
                      <div style={{ fontSize:12, color:T.txt2 }}>{cc?.label}{item.comment ? ` · ${item.comment}` : ""}</div>
                    </div>
                    <div style={{ fontSize:14, fontWeight:700, color:cc?.color||T.txt0, fontFamily:"'JetBrains Mono',monospace", minWidth:38, textAlign:"right" }}>{item.durationHours}ч</div>
                    <button onClick={() => removeItem(item.id)} style={{ background:"none", border:"none", color:T.txt2, fontSize:16, cursor:"pointer", padding:"0 2px", lineHeight:1 }}>×</button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add form */}
          {adding ? (
            <div style={{ padding:"12px 14px", background:`${T.bg1}`, borderRadius:6, border:`1px solid ${T.border}`, display:"flex", flexDirection:"column", gap:10 }}>
              {/* Category */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:5 }}>
                {Object.entries(SR_DOWNTIME_CFG).map(([k,v]) => (
                  <button key={k} onClick={() => setDraft(p => ({ ...p, category:k, reason:"" }))}
                    style={{ padding:"7px 8px", borderRadius:5, border:`1.5px solid ${draft.category===k ? v.color : T.border}`,
                      background: draft.category===k ? `${v.color}18` : "transparent",
                      color: draft.category===k ? v.color : T.txt2, fontSize:12, fontWeight:700, cursor:"pointer", textAlign:"center" }}>
                    {v.label}
                  </button>
                ))}
              </div>
              {/* Reasons */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {catCfg.reasons.map(r => (
                  <button key={r.key} onClick={() => setDraft(p => ({ ...p, reason:r.key, customReason:"" }))}
                    style={{ padding:"5px 10px", borderRadius:4, border:`1px solid ${draft.reason===r.key ? catCfg.color : T.border}`,
                      background: draft.reason===r.key ? `${catCfg.color}18` : T.bg3,
                      color: draft.reason===r.key ? catCfg.color : T.txt1, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                    {r.label}
                  </button>
                ))}
                {/* Кнопка "Другое" */}
                <button onClick={() => setDraft(p => ({ ...p, reason:"custom", customReason:"" }))}
                  style={{ padding:"5px 10px", borderRadius:4, border:`1px solid ${draft.reason==="custom" ? catCfg.color : T.border}`,
                    background: draft.reason==="custom" ? `${catCfg.color}18` : T.bg3,
                    color: draft.reason==="custom" ? catCfg.color : T.txt2, fontSize:12, fontWeight:600, cursor:"pointer", fontStyle:"italic" }}>
                  ✏ Другое
                </button>
              </div>
              {/* Поле ввода своей причины */}
              {draft.reason === "custom" && (
                <input autoFocus type="text" value={draft.customReason || ""}
                  onChange={e => setDraft(p => ({ ...p, customReason: e.target.value }))}
                  placeholder="Введите причину простоя..."
                  style={{ width:"100%", padding:"8px 10px", background:T.inputBg, border:`1px solid ${catCfg.color}60`, borderRadius:4, color:T.txt0, fontSize:12, fontWeight:600, outline:"none", fontFamily:"'Inter',sans-serif" }} />
              )}
              {/* Hours + Comment */}
              <div style={{ display:"grid", gridTemplateColumns:"110px 1fr", gap:8 }}>
                <FieldInput label="Часов" value={draft.durationHours}
                  onChange={e => setDraft(p => ({ ...p, durationHours: e.target.value }))}
                  placeholder="0.5" T={T} />
                <FieldInput label="Комментарий (необяз.)" value={draft.comment}
                  onChange={e => setDraft(p => ({ ...p, comment: e.target.value }))}
                  placeholder="детали..." T={T} />
              </div>
              {draftErr && <div style={{ fontSize:12, color:"#f87171", fontWeight:600 }}>⚠ {draftErr}</div>}
              <div style={{ display:"flex", gap:8 }}>
                <Btn variant="success" style={{ flex:1 }} onClick={addItem} T={T}>Добавить</Btn>
                <Btn variant="ghost"   onClick={() => { setAdding(false); setDraftErr(""); }} T={T}>Отмена</Btn>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)}
              style={{ padding:"9px", borderRadius:5, border:`1.5px dashed ${T.borderHi}`, background:"transparent", color:T.txt2, fontSize:12, fontWeight:600, cursor:"pointer", width:"100%", textAlign:"center" }}>
              + Добавить простой
            </button>
          )}
        </div>

        <div style={{ padding:"12px 18px", borderTop:`1px solid ${T.border}`, display:"flex", gap:8, justifyContent:"flex-end" }}>
          <Btn variant="ghost" onClick={onClose} T={T}>Отмена</Btn>
          <Btn variant="success" onClick={() => onSave(items)} T={T}>Сохранить</Btn>
        </div>
      </div>
    </div>
  );
}

// ── ForemanForm (Shift Report 2.0) ────────────────────────────────────────────
function ForemanForm({ user, objs, rigs, reps=[], onSubmit, onUpdate=()=>{}, setExplosives=()=>{}, downtimeLog=[], setDowntimeLog=()=>{}, T }) {
  const myObjs = objs.filter(o => user.oids === "all" || user.oids.includes(o.id));

  // Создать пустую rigEntry для станка
  function makeEntry(rig) {
    return { id: genId(), rigId: rig.id, rigName: rig.n, workingHours: "", drillingMeters: "", overDrill: "", fuelLiters: "", notes: "", downtimes: [] };
  }

  // Инициализация начального участка
  const initOid = String(myObjs[0]?.id || "");
  const initEntries = () => rigs.filter(r => r.o === Number(initOid)).map(makeEntry);

  const [siteId,    setSiteId]    = useState(initOid);
  const [date,      setDate]      = useState(() => new Date().toISOString().slice(0, 10));
  const [shiftType, setShiftType] = useState("day");
  const [shiftDur,  setShiftDur]  = useState(11);
  const [bf,        setBf]        = useState("");
  const [fuelKg,    setFuelKg]    = useState("");
  const [comment,   setComment]   = useState("");
  const [entries,   setEntries]   = useState(initEntries);
  const [dtEditor,  setDtEditor]  = useState(null);  // rigId открытого редактора
  const [errors,    setErrors]    = useState([]);
  const [done,      setDone]      = useState(false);
  const [step,      setStep]      = useState("form");   // "form" | "preview"
  const [editRepId, setEditRepId] = useState(null);     // id редактируемого отчёта
  const [editingStatus, setEditingStatus] = useState(null); // статус редактируемого отчёта

  // При смене участка — пересобрать список станков
  function changeSite(newOid) {
    setSiteId(newOid);
    setEntries(rigs.filter(r => r.o === Number(newOid)).map(makeEntry));
    setErrors([]);
  }

  // Обновить поле конкретной записи
  function updateEntry(id, field, value) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  }

  // Сохранить простои для станка
  function saveDowntimes(entryId, items) {
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, downtimes: items } : e));
    setDtEditor(null);
  }

  // Загрузить существующий отчёт в форму для редактирования
  function loadRepForEdit(rep) {
    setSiteId(String(rep.oid));
    setDate(rep.date);
    setShiftType(rep.sh);
    setBf(rep.bf != null ? String(rep.bf) : "");
    setFuelKg(rep.fuel_kg != null ? String(rep.fuel_kg) : "");
    setComment(rep.comment || "");
    const loadedEntries = (rep.rigEntries || []).length > 0
      ? rep.rigEntries
      : (rep.rigs || []).map(r => ({
          id: genId(), rigId: r.id, rigName: r.n,
          workingHours:   r.wh   ?? 0,
          drillingMeters: r.df   ?? 0,
          overDrill:      r.overDrill ?? 0,
          fuelLiters:     r.fuel ?? 0,
          notes: r.dt||"", downtimes: r.downtimes || [],
        }));
    setEntries(loadedEntries.length > 0 ? loadedEntries : rigs.filter(r=>r.o===rep.oid).map(makeEntry));
    setEditRepId(rep.id);
    setEditingStatus(rep.status || null);
    setStep("form");
    setErrors([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Итоги по всем станкам
  const totals = {
    wh:        entries.reduce((s,e) => s + Math.max(0, shiftDur - getDowntimeTotal(e.downtimes)), 0),
    df:        entries.reduce((s,e) => s + toNum(e.drillingMeters), 0),
    overDrill: entries.reduce((s,e) => s + toNum(e.overDrill),    0),
    fuel:      entries.reduce((s,e) => s + toNum(e.fuelLiters), 0),
    dh:        entries.reduce((s,e) => s + getDowntimeTotal(e.downtimes), 0),
    // Технические простои (для КТГ)
    techDH:    entries.reduce((s,e) => s + (e.downtimes||[]).filter(d=>d.category==="technical").reduce((ss,d)=>ss+toNum(d.durationHours),0), 0),
    bf:        toNum(bf),
    fuelKg:    toNum(fuelKg),
  };
  // КТГ и КИО для текущей смены
  const calHrsShift = entries.length * shiftDur;
  const shiftKtg = calHrsShift > 0 ? Math.round((calHrsShift - totals.techDH) / calHrsShift * 100) : null;
  const shiftKio = calHrsShift > 0 ? Math.min(100, Math.round(totals.wh / calHrsShift * 100)) : null;

  // Отправка
  function handleSubmit() {
    const report = { siteId, date, shiftType, shiftDurationHours: shiftDur, rigEntries: entries };
    const errs = validateShiftReport(report);
    if (errs.length) { setErrors(errs); setStep("form"); return; }

    // Проверка дубликата: тот же объект + дата + смена
    if (!editRepId) {
      const dup = reps.find(r =>
        r.status !== "draft" &&
        Number(r.oid) === Number(siteId) &&
        r.date === date &&
        r.sh === shiftType
      );
      if (dup) {
        setErrors([`Рапорт за ${date} (${shiftType === "day" ? "дневная" : "ночная"} смена) уже отправлен. Чтобы исправить — найдите его в истории и нажмите «Редактировать».`]);
        setStep("form");
        return;
      }
    }

    setErrors([]);

    const repObj = {
      id:   editRepId || genId(),
      oid:  Number(siteId),
      date,
      sh:   shiftType,
      shiftDurationHours: shiftDur,
      comment,
      df:      totals.df,
      bf:      totals.bf,
      wh:      totals.wh,
      dh:      totals.dh,
      fuel:    totals.fuel,
      fuel_kg: totals.fuelKg,
      rigs: entries.map(e => ({
        id:        e.rigId,
        n:         e.rigName,
        df:        toNum(e.drillingMeters),
        overDrill: toNum(e.overDrill),
        wh:        Math.max(0, shiftDur - getDowntimeTotal(e.downtimes)),
        dh:        getDowntimeTotal(e.downtimes),
        fuel:      toNum(e.fuelLiters), // литры
        dt:        e.notes || "—",
      })),
      rigEntries:      entries,
      downtime_events: entries.flatMap(e =>
        (e.downtimes || []).map(d => ({
          ...d, rig_id: e.rigId, rig_name: e.rigName,
          cat: d.category, sub: d.reason, hrs: d.durationHours,
        }))
      ),
      status: "submitted",
      explosives_written: toNum(fuelKg) > 0,
      by:     user.name,
      submittedAt: new Date().toLocaleString("ru"),
    };

    if (editRepId) {
      onUpdate(repObj);
    } else {
      onSubmit(repObj);
    }

    setDone(true);
    setEditRepId(null);
    setEditingStatus(null);
    setStep("form");
    setEntries(rigs.filter(r => r.o === Number(siteId)).map(makeEntry));
    setDate(new Date().toISOString().slice(0, 10)); setComment(""); setBf(""); setFuelKg("");

    const fuelKgNum = toNum(fuelKg);
    if (fuelKgNum > 0 && !editRepId) {
      setExplosives(prev => [...prev, {
        id:           genId(),
        txn_type:     "writeoff",
        oid:          Number(siteId),
        exp_type:     "Анфо",
        qty:          fuelKgNum,
        date,
        cert_no:      "",
        passport_ref: `Смена ${shiftType === "day" ? "день" : "ночь"} · ${date}`,
        recorded_by:  user.name,
        auto:         true,
      }]);
    }

    setTimeout(() => setDone(false), 5000);
  }

  if (!myObjs.length) {
    return <Card style={{ padding:30, textAlign:"center" }} T={T}><div style={{ fontSize:12, color:T.txt2 }}>Нет назначенных участков</div></Card>;
  }

  // Найти текущую открытую запись для редактора простоев
  const activeEntry = dtEditor ? entries.find(e => e.id === dtEditor) : null;

  return (
    <div>
      {/* Заголовок */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:700, color:T.amber, textTransform:"uppercase", letterSpacing:".18em", marginBottom:4 }}>▌ СМЕННЫЕ ОТЧЁТЫ</div>
        <div style={{ fontSize:22, fontWeight:700, color:T.txt0, fontFamily:"'Inter',sans-serif" }}>
          {myObjs.find(o=>o.id===Number(siteId))?.name || "—"}
        </div>
      </div>

      {/* Модальный редактор простоев */}
      {activeEntry && (
        <SR_DowntimeEditor
          rigName={activeEntry.rigName}
          downtimes={activeEntry.downtimes}
          shiftDurationHours={shiftDur}
          workingHours={activeEntry.workingHours}
          onSave={items => saveDowntimes(activeEntry.id, items)}
          onClose={() => setDtEditor(null)}
          T={T}
        />
      )}

      <Card style={{ marginBottom:16 }} T={T}>
        {/* Шапка карточки */}
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:T.cardSh }}>
          <span style={{ fontSize:13, fontWeight:700, color:T.txt0, textTransform:"uppercase" }}>Новый отчёт</span>
          <StatusBadge status="draft" />
        </div>

        {/* Мета-поля */}
        <div style={{ padding:"16px 18px", display:"flex", gap:12, flexWrap:"wrap", alignItems:"flex-end", borderBottom:`1px solid ${T.border}` }}>
          <FieldSelect label="Участок" value={siteId} onChange={e => changeSite(e.target.value)} T={T} style={{ flex:"1 1 160px" }}>
            {myObjs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </FieldSelect>
          <FieldInput label="Дата" type="date" value={date} onChange={e => setDate(e.target.value)} T={T} style={{ flex:"1 1 140px" }} />
          {/* Красивый переключатель смены */}
          <div style={{ flex:"1 1 200px" }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", letterSpacing:".06em", marginBottom:6 }}>Смена</div>
            <div style={{ display:"flex", gap:0, borderRadius:6, overflow:"hidden", border:`1px solid ${T.border}`, height:38 }}>
              {[
                { val:"day",   icon:"☀", label:"Дневная", activeColor:"#f59e0b", activeBg:"rgba(245,158,11,0.15)" },
                { val:"night", icon:"☾", label:"Ночная",  activeColor:"#818cf8", activeBg:"rgba(129,140,248,0.15)" },
              ].map(({ val, icon, label, activeColor, activeBg }) => (
                <button key={val} onClick={() => setShiftType(val)}
                  style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                    background: shiftType === val ? activeBg : T.bg3,
                    color:      shiftType === val ? activeColor : T.txt2,
                    border:"none", borderRight: val === "day" ? `1px solid ${T.border}` : "none",
                    fontSize:13, fontWeight:700, cursor:"pointer",
                    transition:"background 0.15s, color 0.15s",
                    boxShadow: shiftType === val ? `inset 0 -2px 0 ${activeColor}` : "none" }}>
                  <span style={{ fontSize:15 }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <FieldSelect label="Длит. смены" value={String(shiftDur)} onChange={e => setShiftDur(Number(e.target.value))} T={T} style={{ flex:"0 0 110px" }}>
            <option value="8">8 ч</option>
            <option value="10">10 ч</option>
            <option value="11">11 ч</option>
            <option value="12">12 ч</option>
          </FieldSelect>
        </div>

        {/* Взрывные работы — уровень участка */}
        {/* Предупреждение о дубликате */}
        {!editRepId && (() => {
          const dup = reps.find(r =>
            r.status !== "draft" &&
            Number(r.oid) === Number(siteId) &&
            r.date === date &&
            r.sh === shiftType
          );
          if (!dup) return null;
          const statusLabel = dup.status === "approved" ? "утверждён" : "отправлен на проверку";
          return (
            <div style={{ margin:"0 18px 4px", padding:"10px 14px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.35)", borderRadius:5 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#f87171", marginBottom:2 }}>
                ⚠ Рапорт за этот день и смену уже {statusLabel}
              </div>
              <div style={{ fontSize:12, color:T.txt1 }}>
                Чтобы исправить данные — найдите его ниже в «История отчётов» и нажмите <b>Редактировать</b>.
              </div>
            </div>
          );
        })()}
        <div style={{ padding:"12px 18px", borderBottom:`1px solid ${T.border}`, background:`${T.amber}08` }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.amber, textTransform:"uppercase", letterSpacing:".04em", marginBottom:8 }}>
            💥 Взрывные работы — данные по участку в целом
            <span style={{ marginLeft:10, fontWeight:400, color:T.txt2, textTransform:"none", letterSpacing:"normal" }}>
              · ВВ кг будет автоматически списано со склада Анфо
            </span>
          </div>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"flex-end" }}>
            <div style={{ flex:"1 1 180px" }}>
              <label style={{ display:"block", fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", marginBottom:5 }}>Взрыв м³</label>
              <input type="text" inputMode="numeric" value={bf} onChange={e => setBf(e.target.value)}
                onPaste={e => { e.preventDefault(); const v = e.clipboardData.getData("text").trim().replace(/[^0-9.]/g,""); if(v) setBf(v); }}
                placeholder="0"
                style={{ width:"100%", padding:"8px 12px", background:T.inputBg, border:`1px solid ${T.border}`, borderBottom:`2px solid ${T.amber}80`, borderRadius:4, fontSize:14, fontWeight:700, color:T.amber, fontFamily:"'JetBrains Mono',monospace", outline:"none" }} />
            </div>
            <div style={{ flex:"1 1 180px" }}>
              <label style={{ display:"block", fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", marginBottom:5 }}>ВВ кг</label>
              <input type="text" inputMode="numeric" value={fuelKg} onChange={e => setFuelKg(e.target.value)}
                onPaste={e => { e.preventDefault(); const v = e.clipboardData.getData("text").trim().replace(/[^0-9.]/g,""); if(v) setFuelKg(v); }}
                placeholder="0"
                style={{ width:"100%", padding:"8px 12px", background:T.inputBg, border:`1px solid ${T.border}`, borderBottom:`2px solid ${T.cyan}80`, borderRadius:4, fontSize:14, fontWeight:700, color:T.cyan, fontFamily:"'JetBrains Mono',monospace", outline:"none" }} />
            </div>
            {(toNum(bf) > 0 || toNum(fuelKg) > 0) && (
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", paddingBottom:2 }}>
                {toNum(bf) > 0     && <span style={{ fontSize:12, color:T.txt2 }}>Взрыв: <b style={{ color:T.amber }}>{toNum(bf).toLocaleString()} м³</b></span>}
                {toNum(fuelKg) > 0 && <span style={{ fontSize:12, color:T.txt2 }}>ВВ: <b style={{ color:T.cyan }}>{toNum(fuelKg).toLocaleString()} кг</b></span>}
                {toNum(bf) > 0 && toNum(fuelKg) > 0 && <span style={{ fontSize:12, color:T.txt2 }}>Уд.: <b style={{ color:T.txt0 }}>{(toNum(fuelKg)/toNum(bf)).toFixed(2)} кг/м³</b></span>}
              </div>
            )}
          </div>
        </div>

        {/* Таблица станков 2.0 */}
        <div style={{ padding:"8px 18px 0", background:`${T.red}06`, borderBottom:`1px solid ${T.border}` }}>
          <span style={{ fontSize:12, fontWeight:700, color:T.red, textTransform:"uppercase", letterSpacing:".04em" }}>⛏ Буровые станки</span>
          <span style={{ fontSize:12, color:T.txt2, marginLeft:10 }}>Кликните на простои чтобы открыть редактор</span>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:720 }}>
            <thead>
              <tr style={{ background:T.rowHdr }}>
                {[
                  ["Станок",          T.txt2,    "left",   "auto"],
                  ["Работа ч (авто)", T.blue,    "center", 120],
                  ["Бурение п.м",     T.red,     "center", 110],
                  ["Перебур м",       T.cyan,    "center", 100],
                  ["ГСМ л",           T.violet,  "center", 90],
                  ["Простои",         "#ef4444", "center", 130],
                  ["Итого ч",         T.txt2,    "center", 80],
                  ["Заметки",         T.txt2,    "left",   130],
                ].map(([lbl, col, align, w]) => (
                  <th key={lbl} style={{ padding:"9px 10px", textAlign:align, fontSize:12, fontWeight:700, color:col, textTransform:"uppercase", letterSpacing:".06em", borderBottom:`1px solid ${T.border}`, width:w, whiteSpace:"nowrap" }}>
                    {lbl}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => {
                const dtTotal = getDowntimeTotal(entry.downtimes);
                const autoWh  = Math.max(0, shiftDur - dtTotal);
                // Авто-синхронизация workingHours = shiftDur - dh
                if (toNum(entry.workingHours) !== autoWh) {
                  // обновляем без ре-рендера через прямое значение в entry
                  entry = { ...entry, workingHours: autoWh };
                }
                const total   = autoWh + dtTotal;
                const over    = Math.abs(total - shiftDur) > 0.01;
                const rowErrs = validateRigEntry({ ...entry, workingHours: autoWh }, shiftDur);
                return (
                  <tr key={entry.id} style={{ background: i % 2 ? T.rowAlt : "transparent", borderLeft: over ? "3px solid #ef4444" : "3px solid transparent" }}>
                    {/* Станок */}
                    <td style={{ padding:"8px 14px", fontWeight:700, color:T.txt0, fontSize:12 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ width:5, height:5, borderRadius:"50%", background:T.red, flexShrink:0 }} />
                        {entry.rigName}
                        {rowErrs.length > 0 && <span title={rowErrs.join("\n")} style={{ color:"#ef4444", fontSize:14, cursor:"help" }}>⚠</span>}
                      </div>
                    </td>
                    {/* Работа ч — авто = смена − простои */}
                    <td style={{ padding:"6px 6px", textAlign:"center" }}>
                      <div style={{ width:"100%", padding:"7px 6px", background:`${T.blue}10`, border:`1px solid ${T.border}`, borderBottom:`2px solid ${T.blue}70`, borderRadius:3, fontSize:13, fontWeight:700, color:T.blue, textAlign:"center", fontFamily:"'JetBrains Mono',monospace", userSelect:"none" }}>
                        {autoWh.toFixed(1)}
                      </div>
                    </td>
                    {/* Бурение */}
                    <td style={{ padding:"6px 6px", textAlign:"center" }}>
                      <input type="text" inputMode="numeric"
                        value={entry.drillingMeters === 0 || entry.drillingMeters === "" || entry.drillingMeters == null ? "" : String(entry.drillingMeters)}
                        onChange={e => updateEntry(entry.id, "drillingMeters", e.target.value)}
                        onPaste={e => { e.preventDefault(); const v = e.clipboardData.getData("text").trim().replace(/[^0-9.]/g,""); if(v) updateEntry(entry.id, "drillingMeters", v); }}
                        placeholder="0"
                        style={{ width:"100%", padding:"7px 6px", background:T.inputBg, border:`1px solid ${T.border}`, borderBottom:`2px solid ${T.red}70`, borderRadius:3, fontSize:13, fontWeight:600, color:T.red, textAlign:"center", outline:"none", fontFamily:"'JetBrains Mono',monospace" }} />
                    </td>
                    {/* Перебур */}
                    <td style={{ padding:"6px 6px", textAlign:"center" }}>
                      <input type="text" inputMode="numeric"
                        value={entry.overDrill === 0 || entry.overDrill === "" || entry.overDrill == null ? "" : String(entry.overDrill)}
                        onChange={e => updateEntry(entry.id, "overDrill", e.target.value)}
                        onPaste={e => { e.preventDefault(); const v = e.clipboardData.getData("text").trim().replace(/[^0-9.]/g,""); if(v) updateEntry(entry.id, "overDrill", v); }}
                        placeholder="0"
                        style={{ width:"100%", padding:"7px 6px", background:T.inputBg, border:`1px solid ${T.border}`, borderBottom:`2px solid ${T.cyan}70`, borderRadius:3, fontSize:13, fontWeight:600, color:T.cyan, textAlign:"center", outline:"none", fontFamily:"'JetBrains Mono',monospace" }} />
                    </td>
                    {/* ГСМ */}
                    <td style={{ padding:"6px 6px", textAlign:"center" }}>
                      <input type="text" inputMode="numeric"
                        value={entry.fuelLiters === 0 || entry.fuelLiters === "" || entry.fuelLiters == null ? "" : String(entry.fuelLiters)}
                        onChange={e => updateEntry(entry.id, "fuelLiters", e.target.value)}
                        onPaste={e => { e.preventDefault(); const v = e.clipboardData.getData("text").trim().replace(/[^0-9.]/g,""); if(v) updateEntry(entry.id, "fuelLiters", v); }}
                        placeholder="0"
                        style={{ width:"100%", padding:"7px 6px", background:T.inputBg, border:`1px solid ${T.border}`, borderBottom:`2px solid ${T.violet}70`, borderRadius:3, fontSize:13, fontWeight:600, color:T.violet, textAlign:"center", outline:"none", fontFamily:"'JetBrains Mono',monospace" }} />
                    </td>
                    {/* Простои — кликабельная ячейка */}
                    <td style={{ padding:"6px 8px", textAlign:"center" }}>
                      <button onClick={() => setDtEditor(entry.id)}
                        style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:5,
                          border:`1px solid ${entry.downtimes.length > 0 ? "#ef444450" : T.border}`,
                          background: entry.downtimes.length > 0 ? "rgba(239,68,68,0.08)" : T.bg3,
                          color: entry.downtimes.length > 0 ? "#ef4444" : T.txt2,
                          fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
                        {entry.downtimes.length > 0
                          ? <>{entry.downtimes.length} · {dtTotal.toFixed(1)}ч</>
                          : <span style={{ opacity:0.6 }}>+ добавить</span>}
                      </button>
                    </td>
                    {/* Итого */}
                    <td style={{ padding:"6px 8px", textAlign:"center", fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color: T.green }}>
                      {shiftDur.toFixed(1)}
                    </td>
                    {/* Заметки */}
                    <td style={{ padding:"6px 6px" }}>
                      <input type="text" value={entry.notes || ""}
                        onChange={e => updateEntry(entry.id, "notes", e.target.value)}
                        placeholder="не было"
                        style={{ width:"100%", padding:"7px 8px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:3, color:T.txt1, fontSize:12, outline:"none", fontFamily:"'Inter',sans-serif" }} />
                    </td>
                  </tr>
                );
              })}
              {/* Итоговая строка */}
              <tr style={{ background:`${T.red}10`, borderTop:`1px solid ${T.border}` }}>
                <td style={{ padding:"9px 14px", fontWeight:900, fontSize:12, color:T.txt0, textTransform:"uppercase" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ width:5, height:5, borderRadius:"50%", background:T.red }} /> ИТОГО
                  </div>
                </td>
                <td style={{ padding:"9px 10px", textAlign:"center", fontWeight:900, fontSize:15, color:T.blue, fontFamily:"'Inter',sans-serif" }}>{totals.wh.toLocaleString()}</td>
                <td style={{ padding:"9px 10px", textAlign:"center", fontWeight:900, fontSize:15, color:T.red,  fontFamily:"'Inter',sans-serif" }}>{totals.df.toLocaleString()}</td>
                <td style={{ padding:"9px 10px", textAlign:"center", fontWeight:900, fontSize:15, color:T.cyan, fontFamily:"'Inter',sans-serif" }}>{totals.overDrill > 0 ? totals.overDrill.toLocaleString() : "—"}</td>
                <td style={{ padding:"9px 10px", textAlign:"center", fontWeight:900, fontSize:15, color:T.violet, fontFamily:"'Inter',sans-serif" }}>{totals.fuel.toLocaleString()}</td>
                <td style={{ padding:"9px 10px", textAlign:"center", fontWeight:900, fontSize:15, color:"#ef4444", fontFamily:"'Inter',sans-serif" }}>{totals.dh.toFixed(1)} ч</td>
                <td style={{ padding:"9px 10px", textAlign:"center", fontSize:11, color:T.txt2 }}>
                  <div>КТГ <b style={{ color:scoreColor(shiftKtg, 85, 70, T) }}>{shiftKtg !== null ? `${shiftKtg}%` : "—"}</b></div>
                  <div>КИО <b style={{ color:scoreColor(shiftKio, 75, 60, T) }}>{shiftKio !== null ? `${shiftKio}%` : "—"}</b></div>
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>

        {/* Комментарий */}
        <div style={{ padding:"12px 18px", borderTop:`1px solid ${T.border}` }}>
          <label style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:5 }}>Комментарий к смене</label>
          <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2} placeholder="Особые условия, замечания..."
            style={{ width:"100%", padding:"8px 12px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt1, fontSize:12, resize:"vertical", fontFamily:"'Inter',sans-serif", outline:"none" }} />
        </div>

        {/* Ошибки валидации */}
        {errors.length > 0 && (
          <div style={{ margin:"0 18px 12px", padding:"10px 14px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:5 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#f87171", marginBottom:6 }}>⚠ Исправьте ошибки перед отправкой:</div>
            {errors.map((e,i) => <div key={i} style={{ fontSize:12, color:"#f87171", paddingLeft:8 }}>· {e}</div>)}
          </div>
        )}

        {/* Кнопки */}
        <div style={{ padding:"14px 18px", borderTop:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
          {done && <div style={{ fontSize:12, color:T.green, fontWeight:700 }}>✓ {editRepId ? "Отчёт обновлён!" : "Отчёт отправлен инженеру!"}</div>}
          {!done && editRepId && editingStatus==="approved" && (
            <div style={{ fontSize:12, color:T.blue, fontWeight:600 }}>
              ⚠ Утверждённый отчёт — после сохранения вернётся на проверку инженеру
            </div>
          )}
          {!done && (!editRepId || editingStatus!=="approved") && <div style={{ fontSize:12, color:T.txt2 }}>
            Станков: <b style={{ color:T.txt0 }}>{entries.length}</b> ·
            Бурение: <b style={{ color:T.red }}>{totals.df.toLocaleString()} п.м</b> ·
            Простои: <b style={{ color:"#ef4444" }}>{totals.dh.toFixed(1)} ч</b>
          </div>}
          <div style={{ display:"flex", gap:8 }}>
            <Btn variant="secondary" onClick={() => {
              setEntries(rigs.filter(r => r.o === Number(siteId)).map(makeEntry));
              setDate(new Date().toISOString().slice(0,10)); setBf(""); setFuelKg(""); setComment(""); setErrors([]); setEditRepId(null); setEditingStatus(null);
            }} T={T}>Очистить</Btn>
            <Btn variant="primary" onClick={() => {
              const report = { siteId, date, shiftType, shiftDurationHours: shiftDur, rigEntries: entries };
              const errs = validateShiftReport(report);
              if (errs.length) { setErrors(errs); return; }
              setErrors([]);
              setStep("preview");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }} T={T}>Проверить перед отправкой →</Btn>
          </div>
        </div>
      </Card>

      {/* ── Preview-экран перед отправкой ── */}
      {step === "preview" && (
        <div style={{ position:"fixed", inset:0, background:T.modalBg, zIndex:600, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"16px", overflowY:"auto" }}>
          <div style={{ background:T.bg1, border:`1px solid ${T.border}`, borderRadius:10, width:"100%", maxWidth:700, marginTop:16, marginBottom:40 }}>
            {/* Шапка */}
            <div style={{ padding:"16px 22px", borderBottom:`1px solid ${T.border}`, background:`${T.amber}10`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:T.amber, textTransform:"uppercase", letterSpacing:".1em", marginBottom:3 }}>
                  📋 ПРОВЕРЬТЕ ДАННЫЕ ПЕРЕД ОТПРАВКОЙ
                </div>
                <div style={{ fontSize:16, fontWeight:700, color:T.txt0 }}>
                  {myObjs.find(o=>o.id===Number(siteId))?.name} · {date} · {shiftType==="day"?"☀ Дневная":"☾ Ночная"} смена
                </div>
                {editRepId && <div style={{ fontSize:12, color: editingStatus==="approved" ? T.blue : T.amber, marginTop:2 }}>
                  {editingStatus==="approved" ? "⚠ Исправление утверждённого отчёта — после сохранения вернётся на проверку инженеру" : "✏ Редактирование отчёта"}
                </div>}
              </div>
              <button onClick={() => setStep("form")} style={{ background:"none", border:"none", fontSize:22, color:T.txt2, cursor:"pointer" }}>×</button>
            </div>

            <div style={{ padding:"18px 22px", display:"flex", flexDirection:"column", gap:16 }}>
              {/* Итоги */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))", gap:8 }}>
                {[
                  [T.red,     "⛏ Бурение",    totals.df,      "п.м"],
                  [T.amber,   "💥 Взрывы",     totals.bf,      "м³"],
                  [T.blue,    "⏱ Работа",     totals.wh,      "ч"],
                  ["#ef4444", "⏸ Простои",    totals.dh,      "ч"],
                  [T.violet,  "⛽ ГСМ",        totals.fuel,    "л"],
                  [T.cyan,    "💣 ВВ",         totals.fuelKg,  "кг"],
                ].filter(([,,v])=>v>0).map(([c,lbl,val,unit])=>(
                  <div key={lbl} style={{ background:T.bg2, border:`1px solid ${T.border}`, borderTop:`3px solid ${c}`, borderRadius:6, padding:"10px 12px", textAlign:"center" }}>
                    <div style={{ fontSize:12, color:c, fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>{lbl}</div>
                    <div style={{ fontSize:22, fontWeight:700, color:c, fontFamily:"'Inter',sans-serif" }}>{val.toLocaleString()}</div>
                    <div style={{ fontSize:12, color:T.txt2 }}>{unit}</div>
                  </div>
                ))}
              </div>

              {/* Таблица по станкам */}
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", letterSpacing:".07em", marginBottom:8 }}>По станкам</div>
                <div style={{ border:`1px solid ${T.border}`, borderRadius:6, overflow:"hidden", overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", minWidth:480 }}>
                    <thead>
                      <tr style={{ background:T.rowHdr }}>
                        {["Станок","Работа ч","Бурение п.м","Перебур м","ГСМ л","Простои"].map(h=>(
                          <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", borderBottom:`1px solid ${T.border}`, whiteSpace:"nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((e,i)=>{
                        const dh = getDowntimeTotal(e.downtimes);
                        const dtItems = e.downtimes||[];
                        return (
                          <tr key={e.id} style={{ background:i%2?T.rowAlt:"transparent" }}>
                            <td style={{ padding:"8px 12px", fontWeight:700, fontSize:12, color:T.txt0 }}>{e.rigName}</td>
                            <td style={{ padding:"8px 12px", fontSize:12, color:T.blue, textAlign:"right", fontFamily:"'JetBrains Mono',monospace" }}>{toNum(e.workingHours)||"—"}</td>
                            <td style={{ padding:"8px 12px", fontSize:12, color:T.red, textAlign:"right", fontFamily:"'JetBrains Mono',monospace" }}>{toNum(e.drillingMeters)||"—"}</td>
                            <td style={{ padding:"8px 12px", fontSize:12, color:T.cyan, textAlign:"right", fontFamily:"'JetBrains Mono',monospace" }}>{toNum(e.overDrill)||"—"}</td>
                            <td style={{ padding:"8px 12px", fontSize:12, color:T.violet, textAlign:"right", fontFamily:"'JetBrains Mono',monospace" }}>{toNum(e.fuelLiters) || "—"}</td>
                            <td style={{ padding:"8px 12px" }}>
                              {dtItems.length>0
                                ? <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                                    {dtItems.map((d,di)=>{
                                      const cc = (d.category||d.cat)==="technical"?"#ef4444":(d.category||d.cat)==="organizational"?"#f59e0b":"#3b82f6";
                                      return <span key={di} style={{ fontSize:12, color:cc, fontWeight:600 }}>{d.reason} {d.durationHours}ч</span>;
                                    })}
                                  </div>
                                : <span style={{ fontSize:12, color:T.txt2 }}>—</span>
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Взрывные работы */}
              {(totals.bf>0||totals.fuelKg>0) && (
                <div style={{ padding:"10px 14px", background:`${T.amber}12`, border:`1px solid ${T.amber}30`, borderRadius:6, display:"flex", gap:14, flexWrap:"wrap", alignItems:"center" }}>
                  <span style={{ fontSize:12, fontWeight:700, color:T.amber }}>💥 ВЗРЫВНЫЕ РАБОТЫ</span>
                  {totals.bf>0 && <span style={{ fontSize:12, color:T.txt1 }}>Взрыв: <b style={{ color:T.amber }}>{totals.bf} м³</b></span>}
                  {totals.fuelKg>0 && <span style={{ fontSize:12, color:T.txt1 }}>ВВ: <b style={{ color:T.cyan }}>{totals.fuelKg} кг</b></span>}
                </div>
              )}

              {/* Комментарий */}
              {comment && (
                <div style={{ padding:"10px 14px", background:T.bg3, border:`1px solid ${T.border}`, borderRadius:6, fontSize:12, color:T.txt1 }}>
                  💬 {comment}
                </div>
              )}
            </div>

            {/* Кнопки preview */}
            <div style={{ padding:"14px 22px", borderTop:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:T.bg2 }}>
              <Btn variant="ghost" onClick={() => setStep("form")} T={T}>← Вернуться и исправить</Btn>
              <Btn variant="primary" onClick={handleSubmit} T={T}
                style={{ background:T.green, borderColor:T.green, padding:"10px 28px", fontSize:13 }}>
                {editRepId ? "✓ Сохранить изменения" : "✓ Отправить инженеру"}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── Список отчётов по дням ── */}
      {(()=>{
        const curOid  = Number(siteId);
        const curObj  = myObjs.find(o=>o.id===curOid);
        const curRigs = rigs.filter(r=>r.o===curOid);
        const objReps = reps
          .filter(r=>r.oid===curOid)
          .sort((a,b)=>b.date.localeCompare(a.date)||(b.sh==="night"?-1:1));

        if (!objReps.length) return null;

        return (
          <ReportHistoryList
            reps={objReps}
            obj={curObj}
            rigs={curRigs}
            onEdit={loadRepForEdit}
            T={T}
          />
        );
      })()}
    </div>
  );
}

// ── Компонент списка/детали отчётов форманa ──────────────────────────────────
function ReportHistoryList({ reps, obj, rigs, onEdit=()=>{}, T }) {
  const [openRep, setOpenRep] = useState(null);
  const colors = OBJ_COLORS(T);
  const ac     = obj ? colors[0] : T.blue;

  const STATUS = {
    approved:  { label:"Утверждён",   color:T.green,  icon:"✓",  bg:`${T.green}15`  },
    submitted: { label:"На проверке", color:T.amber,  icon:"⏳", bg:`${T.amber}15`  },
    draft:     { label:"Черновик",    color:T.txt2,   icon:"✎",  bg:`${T.bg3}`      },
  };

  // Группировка по дате
  const byDate = {};
  reps.forEach(r => { if(!byDate[r.date]) byDate[r.date]=[]; byDate[r.date].push(r); });
  const dates = Object.keys(byDate).sort((a,b)=>b.localeCompare(a));
  const today = new Date().toISOString().slice(0,10);

  const approvedCnt  = reps.filter(r=>r.status==="approved").length;
  const submittedCnt = reps.filter(r=>r.status==="submitted").length;

  return (
    <div style={{ marginTop:24 }}>

      {/* Шапка секции */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.txt0 }}>История отчётов</div>
        <div style={{ display:"flex", gap:8 }}>
          <span style={{ fontSize:12, padding:"3px 10px", borderRadius:10, background:`${T.green}18`, color:T.green, fontWeight:700 }}>✓ {approvedCnt}</span>
          {submittedCnt>0 && <span style={{ fontSize:12, padding:"3px 10px", borderRadius:10, background:`${T.amber}18`, color:T.amber, fontWeight:700 }}>⏳ {submittedCnt}</span>}
          <span style={{ fontSize:12, padding:"3px 10px", borderRadius:10, background:T.bg3, color:T.txt2 }}>Всего {reps.length}</span>
        </div>
      </div>

      {/* Список */}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {dates.map(date => {
          const dayReps = byDate[date];
          const d = new Date(date+"T12:00:00");
          const DOW_RU = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];
          const MON_RU = ["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"];
          const isToday = date===today;

          return (
            <div key={date} style={{ background:T.bg2, border:`1px solid ${isToday?T.amber:T.border}`, borderRadius:8, overflow:"hidden" }}>
              {/* Строка-заголовок дня */}
              <div style={{ padding:"8px 16px", background:isToday?`${T.amber}10`:T.bg3, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:8 }}>
                {isToday && <span style={{ fontSize:12, background:T.amber, color:"#000", padding:"2px 6px", borderRadius:2, fontWeight:900, letterSpacing:".06em" }}>СЕГОДНЯ</span>}
                <span style={{ fontSize:12, fontWeight:700, color:isToday?T.amber:T.txt0 }}>
                  {DOW_RU[d.getDay()]}, {d.getDate()} {MON_RU[d.getMonth()]} {d.getFullYear()}
                </span>
                <span style={{ fontSize:12, color:T.txt2, marginLeft:"auto" }}>{dayReps.length} {dayReps.length===1?"смена":"смены"}</span>
              </div>

              {/* Смены этого дня */}
              {dayReps.map((r, ri) => {
                const sc   = STATUS[r.status] || STATUS.draft;
                const kv   = repKtg(r);
                const dtAll = (r.rigEntries||[]).flatMap(e=>e.downtimes||[]);
                const dtH   = dtAll.reduce((s,d)=>s+toNum(d.durationHours),0);
                const canEdit = r.status === "submitted" || r.status === "approved";

                return (
                  <div key={r.id} style={{
                    padding:"12px 16px",
                    borderTop: ri>0 ? `1px solid ${T.border}` : "none",
                    display:"flex", alignItems:"center", gap:12, flexWrap:"wrap"
                  }}>
                    {/* Смена + статус */}
                    <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:160 }}>
                      <div style={{ fontSize:20 }}>{r.sh==="day"?"☀":"🌙"}</div>
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:T.txt0 }}>
                          {r.sh==="day"?"Дневная":"Ночная"} смена
                        </div>
                        <div style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop:2,
                          padding:"2px 8px", borderRadius:10, background:sc.bg,
                          border:`1px solid ${sc.color}30`, fontSize:12, fontWeight:700, color:sc.color }}>
                          {sc.icon} {sc.label}
                        </div>
                      </div>
                    </div>

                    {/* Данные смены */}
                    <div style={{ display:"flex", gap:12, flex:1, flexWrap:"wrap", alignItems:"center" }}>
                      {r.df>0 && (
                        <div style={{ textAlign:"center" }}>
                          <div style={{ fontSize:18, fontWeight:700, color:ac, lineHeight:1 }}>{r.df.toLocaleString()}</div>
                          <div style={{ fontSize:12, color:T.txt2, textTransform:"uppercase", marginTop:1 }}>п.м бурение</div>
                        </div>
                      )}
                      {r.bf>0 && (
                        <div style={{ textAlign:"center" }}>
                          <div style={{ fontSize:18, fontWeight:700, color:T.amber, lineHeight:1 }}>{r.bf.toLocaleString()}</div>
                          <div style={{ fontSize:12, color:T.txt2, textTransform:"uppercase", marginTop:1 }}>м³ взрыв</div>
                        </div>
                      )}
                      {kv!==null && (
                        <div style={{ textAlign:"center" }}>
                          <div style={{ fontSize:18, fontWeight:700, color:T.green, lineHeight:1 }}>{kv}%</div>
                          <div style={{ fontSize:12, color:T.txt2, textTransform:"uppercase", marginTop:1 }}>КТГ</div>
                        </div>
                      )}
                      {dtH>0 && (
                        <div style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 10px", background:"#ef444415", border:"1px solid #ef444430", borderRadius:5 }}>
                          <span style={{ fontSize:12, color:"#ef4444", fontWeight:700 }}>⚠ {dtH.toFixed(1)} ч простоев</span>
                          {dtAll.length>0 && <span style={{ fontSize:12, color:"#ef4444" }}>· {dtAll.length} событий</span>}
                        </div>
                      )}
                    </div>

                    {/* Кнопки */}
                    <div style={{ display:"flex", gap:6, flexShrink:0, alignItems:"center" }}>
                      {canEdit && (
                        <button onClick={() => onEdit(r)}
                          style={{ padding:"6px 14px", borderRadius:5,
                            border:`1.5px solid ${r.status==="approved" ? T.blue : T.amber}`,
                            background:`${r.status==="approved" ? T.blue : T.amber}10`,
                            color: r.status==="approved" ? T.blue : T.amber,
                            fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}
                          title={r.status==="approved" ? "Отчёт вернётся на проверку инженеру" : ""}>
                          ✏ {r.status==="approved" ? "Исправить" : "Редактировать"}
                        </button>
                      )}
                      {!canEdit && r.status==="approved" && (
                        <span style={{ fontSize:12, color:T.txt2, padding:"4px 8px", border:`1px solid ${T.border}`, borderRadius:5 }}
                          title="Редактирование доступно только в течение 24 ч после утверждения">
                          🔒 Заблокировано
                        </span>
                      )}
                      <button onClick={() => setOpenRep(r)}
                        style={{ padding:"6px 14px", borderRadius:5, border:`1px solid ${T.border}`, background:T.bg3,
                          color:T.txt1, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                        Подробнее →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ── Модалка просмотра отчёта ── */}
      {openRep && (
        <div style={{ position:"fixed", inset:0, background:T.modalBg, zIndex:600, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:16, overflowY:"auto" }}>
          <div style={{ background:T.bg1, border:`1px solid ${T.border}`, borderRadius:10, width:"100%", maxWidth:720, marginTop:16, marginBottom:40 }}>

            {/* Шапка */}
            <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, background:T.bg1, zIndex:10 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:T.txt0 }}>
                  {obj?.name} · {openRep.date} · {openRep.sh==="day"?"☀ Дневная":"🌙 Ночная"}
                </div>
                <div style={{ fontSize:12, color:T.txt2, marginTop:3, display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
                  {openRep.by && <span>Отправил: <b style={{ color:T.txt1 }}>{openRep.by}</b></span>}
                  {openRep.submittedAt && <span>{openRep.submittedAt}</span>}
                  <span style={{ fontWeight:700, color:STATUS[openRep.status]?.color }}>
                    {STATUS[openRep.status]?.icon} {STATUS[openRep.status]?.label}
                  </span>
                </div>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                {(openRep.status==="submitted" || openRep.status==="approved") && (
                  <button onClick={() => { setOpenRep(null); onEdit(openRep); }}
                    style={{ padding:"7px 16px", borderRadius:5,
                      border:`1.5px solid ${openRep.status==="approved" ? T.blue : T.amber}`,
                      background:`${openRep.status==="approved" ? T.blue : T.amber}12`,
                      color: openRep.status==="approved" ? T.blue : T.amber,
                      fontSize:12, fontWeight:700, cursor:"pointer" }}
                    title={openRep.status==="approved" ? "Отчёт вернётся на проверку инженеру" : ""}>
                    ✏ {openRep.status==="approved" ? "Исправить" : "Редактировать"}
                  </button>
                )}
                <button onClick={()=>setOpenRep(null)} style={{ background:"none", border:"none", fontSize:22, color:T.txt2, cursor:"pointer" }}>×</button>
              </div>
            </div>

            <div style={{ padding:"18px 20px", display:"flex", flexDirection:"column", gap:14 }}>

              {/* КПИ */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))", gap:8 }}>
                {[
                  [ac,        "⛏ Бурение",  openRep.df||0,      "п.м"],
                  [T.amber,   "💥 Взрывы",   openRep.bf||0,      "м³"],
                  [T.blue,    "⏱ Работа",   openRep.wh||0,      "ч"],
                  ["#ef4444", "⏸ Простои",  openRep.dh||0,      "ч"],
                  [T.violet,  "⛽ ГСМ",      openRep.fuel||0,    "л"],
                  [T.cyan,    "💣 ВВ",       openRep.fuel_kg||0, "кг"],
                ].filter(([,,v])=>v>0).map(([c,lbl,val,unit])=>(
                  <div key={lbl} style={{ background:T.bg2, border:`1px solid ${T.border}`, borderTop:`2px solid ${c}`, borderRadius:5, padding:"10px 12px", textAlign:"center" }}>
                    <div style={{ fontSize:12, color:c, fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>{lbl}</div>
                    <div style={{ fontSize:20, fontWeight:700, color:c }}>{typeof val==="number"?val.toLocaleString():val}</div>
                    <div style={{ fontSize:12, color:T.txt2 }}>{unit}</div>
                  </div>
                ))}
              </div>

              {/* По станкам */}
              {(openRep.rigEntries||openRep.rigs) && (
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", letterSpacing:".07em", marginBottom:6 }}>По станкам</div>
                  <div style={{ border:`1px solid ${T.border}`, borderRadius:5, overflow:"hidden", overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", minWidth:480 }}>
                      <thead>
                        <tr style={{ background:T.rowHdr }}>
                          {["Станок","Работа ч","Бурение п.м","Перебур м","ГСМ л","Простои ч"].map(h=>(
                            <th key={h} style={{ padding:"7px 10px", textAlign:"left", fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", borderBottom:`1px solid ${T.border}`, whiteSpace:"nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(openRep.rigEntries || openRep.rigs?.map(r=>({
                          rigName:r.n, workingHours:r.wh, drillingMeters:r.df, overDrill:r.overDrill||0,
                          fuelLiters:r.fuel, notes:r.dt, downtimes:[]
                        })) || []).map((e,i)=>{
                          const dh = (e.downtimes||[]).reduce((s,d)=>s+toNum(d.durationHours),0);
                          return (
                            <tr key={i} style={{ background:i%2?T.rowAlt:"transparent" }}>
                              <td style={{ padding:"7px 10px", fontWeight:700, fontSize:12, color:T.txt0 }}>{e.rigName||e.n}</td>
                              <td style={{ padding:"7px 10px", fontSize:12, color:T.blue, textAlign:"right", fontFamily:"'JetBrains Mono',monospace" }}>{toNum(e.workingHours||e.wh)||"—"}</td>
                              <td style={{ padding:"7px 10px", fontSize:12, color:ac, textAlign:"right", fontFamily:"'JetBrains Mono',monospace" }}>{toNum(e.drillingMeters||e.df)||"—"}</td>
                              <td style={{ padding:"7px 10px", fontSize:12, color:T.cyan, textAlign:"right", fontFamily:"'JetBrains Mono',monospace" }}>{toNum(e.overDrill)||"—"}</td>
                              <td style={{ padding:"7px 10px", fontSize:12, color:T.violet, textAlign:"right", fontFamily:"'JetBrains Mono',monospace" }}>{toNum(e.fuelLiters||e.fuel)||"—"}</td>
                              <td style={{ padding:"7px 10px", fontSize:12, color:dh>0?"#ef4444":T.txt2, textAlign:"right", fontFamily:"'JetBrains Mono',monospace" }}>{dh||"—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Простои */}
              {(()=>{
                const dt = (openRep.rigEntries||[]).flatMap(e=>(e.downtimes||[]).map(d=>({...d,rigName:e.rigName})));
                if(!dt.length) return null;
                const catColors = { technical:"#ef4444", organizational:"#f59e0b", external:"#3b82f6" };
                const catLabels = { technical:"Техн.", organizational:"Орг.", external:"Внешн." };
                return (
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", letterSpacing:".07em", marginBottom:6 }}>
                      Простои · {dt.reduce((s,d)=>s+toNum(d.durationHours),0).toFixed(1)} ч
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                      {dt.map((d,i)=>{
                        const cc = catColors[d.category]||T.txt2;
                        return (
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 12px",
                            background:i%2?T.rowAlt:"transparent", borderLeft:`3px solid ${cc}`, borderRadius:3 }}>
                            <span style={{ fontSize:12, fontWeight:700, color:cc, background:`${cc}18`, padding:"1px 5px", borderRadius:2, minWidth:36, textAlign:"center" }}>{catLabels[d.category]||"—"}</span>
                            <span style={{ fontSize:12, color:T.txt2, minWidth:80 }}>{d.rigName}</span>
                            <span style={{ fontSize:12, fontWeight:600, color:T.txt0, flex:1 }}>{d.reason}</span>
                            {d.comment&&<span style={{ fontSize:12, color:T.txt2, fontStyle:"italic" }}>{d.comment}</span>}
                            <span style={{ fontSize:13, fontWeight:700, color:cc, fontFamily:"'JetBrains Mono',monospace" }}>{d.durationHours}ч</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Комментарий */}
              {openRep.comment && (
                <div style={{ padding:"10px 14px", background:T.bg3, border:`1px solid ${T.border}`, borderRadius:5, fontSize:12, color:T.txt1 }}>
                  💬 {openRep.comment}
                </div>
              )}
            </div>

            <div style={{ padding:"12px 20px", borderTop:`1px solid ${T.border}`, display:"flex", justifyContent:"flex-end" }}>
              <Btn variant="ghost" onClick={()=>setOpenRep(null)} T={T}>Закрыть</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ENGINEER INBOX ───────────────────────────────────────────────────────────
function EngineerInbox({ reps, objs, rigs, onApprove, onDelete=()=>{}, onUpdate=()=>{}, ktgPlans, setKtgPlans, nodes, setExplosives=()=>{}, T }) {
  const [selObjId, setSelObjId] = useState(null);
  const [tab,      setTab]      = useState("reports");
  const [sel,      setSel]      = useState(null);
  const [confirmed,setConfirmed]= useState(false);
  const [editRows, setEditRows] = useState([]);
  const [editMeta, setEditMeta] = useState({ date:"", sh:"day" });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [editingRep, setEditingRep] = useState(null);
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
      const f=r.rigs?.find(x=>x.id===rg.id||(x.n&&x.n.replace(/[\s\-]/g,"").toLowerCase()===rg.n.replace(/[\s\-]/g,"").toLowerCase()))||{};
      const dtNote = f.dt || (r.downtime_events?.length===1 ? r.downtime_events[0].reason : "") || "";
      return {id:rg.id,nm:rg.n,df:f.df??0,wh:f.wh??0,dh:f.dh??(f.downtime??0),fuel:f.fuel??0,dt:dtNote,overDrill:f.overDrill??0};
    }));
  }
  function setCell(id,key,val){
    const num = val === "" ? 0 : key === "dt" ? val : (isNaN(Number(val)) ? 0 : Number(val));
    setEditRows(prev=>prev.map(r=>r.id===id?{...r,[key]: key==="dt" ? val : num}:r));
  }
  const totals={
    df:editRows.reduce((s,r)=>s+toNum(r.df),0), bf:editRows.reduce((s,r)=>s+toNum(r.bf),0),
    wh:editRows.reduce((s,r)=>s+toNum(r.wh),0), dh:editRows.reduce((s,r)=>s+toNum(r.dh),0),
    fuel:editRows.reduce((s,r)=>s+toNum(r.fuel),0),
    overDrill:editRows.reduce((s,r)=>s+toNum(r.overDrill),0),
  };
  function doApprove(){
    const approved = {
      ...sel, date:editMeta.date, sh:editMeta.sh,
      df:totals.df, bf:totals.bf||sel?.bf||0, wh:totals.wh, dh:totals.dh, fuel:totals.fuel, fuel_kg:toNum(editMeta.fuel_kg??sel?.fuel_kg)??0,
      rigs:editRows.map(r=>({id:r.id,n:r.nm,df:toNum(r.df),bf:toNum(r.bf),wh:toNum(r.wh),dh:toNum(r.dh),fuel:toNum(r.fuel),dt:r.dt||"—",overDrill:toNum(r.overDrill)})),
      rigEntries: sel?.rigEntries || [],
      downtime_events: sel?.downtime_events || [],
      status:"approved",
      approvedAt: new Date().toISOString(),
    };
    onApprove(sel.id, approved);

    // Списание ВВ со склада по участку при наличии взрывных работ
    // (форман уже мог списать при отправке — списываем только если не было авто-списания)
    const fuelKgToWrite = sel?.fuel_kg || 0;
    const alreadyAutoWritten = sel?.explosives_written || false;
    if (fuelKgToWrite > 0 && !alreadyAutoWritten) {
      setExplosives(prev => [...prev, {
        id:           genId(),
        txn_type:     "writeoff",
        oid:          sel.oid,
        exp_type:     "Анфо",
        qty:          fuelKgToWrite,
        date:         editMeta.date,
        cert_no:      "",
        passport_ref: `Утверждение отчёта · ${sel.by} · ${editMeta.date}`,
        recorded_by:  "Инженер (авто)",
        auto:         true,
      }]);
    }

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
    updateKtgPlanStatus(plan.object_id, plan.year_month, "ACCEPTED", {decided_at:new Date().toISOString()}).catch(e=>console.warn("KTG accept error:",e.message));
    setKtgSel(null);
  }
  function returnKtg(plan){
    if(!ktgComment.trim()){setKtgComErr("Укажите причину возврата");return;}
    setKtgPlans(prev=>prev.map(p=>p.id===plan.id?{...p,status:"RETURNED",engineer_comment:ktgComment.trim(),decided_at:new Date().toISOString()}:p));
    updateKtgPlanStatus(plan.object_id, plan.year_month, "RETURNED", {decided_at:new Date().toISOString()}).catch(e=>console.warn("KTG return error:",e.message));
    setKtgSel(null);setKtgComment("");setKtgComErr("");
  }
  function ktgAvg(plan){
    if(!plan?.items)return null;
    const DAY_CAP=22;
    const[y,m]=plan.year_month.split("-").map(Number);
    const dim=new Date(y,m,0).getDate();
    const days=Array.from({length:dim},(_,i)=>`${plan.year_month}-${String(i+1).padStart(2,"0")}`);
    const aids=Object.keys(plan.items);
    if(!aids.length)return null;
    const dayKtgs=days.map(d=>{
      const filled=aids.filter(aid=>(plan.items[aid]||{})[d]!=null);
      if(!filled.length)return null;
      const sumH=filled.reduce((s,aid)=>s+(Number((plan.items[aid]||{})[d])||0),0);
      return Math.round(sumH/(filled.length*DAY_CAP)*100);
    }).filter(v=>v!==null);
    return dayKtgs.length?Math.round(dayKtgs.reduce((s,v)=>s+v,0)/dayKtgs.length):null;
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
                      <div style={{fontSize:15,fontWeight:700,color:T.txt0,fontFamily:"'Inter',sans-serif",letterSpacing:"1px"}}>{obj.name.toUpperCase()}</div>
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
                        <div style={{fontSize:12,color:c,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>{icon} {lbl}</div>
                        {pending>0
                          ?<div style={{fontSize:16,fontWeight:700,color:T.red,fontFamily:"'Inter',sans-serif"}}>{pending} новых</div>
                          :<div style={{fontSize:12,color:T.txt2}}>Нет новых</div>
                        }
                        <div style={{fontSize:12,color:T.txt2,marginTop:2}}>Всего: {total}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{textAlign:"center",padding:"7px",borderRadius:5,
                    background:total>0?`${ac}15`:`${T.border}20`,border:`1px solid ${total>0?ac+"40":T.border}`}}>
                    <span style={{fontSize:12,fontWeight:700,color:total>0?ac:T.txt2}}>{total>0?"Открыть реестр":"Посмотреть историю"}</span>
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
                <div style={{fontSize:14,fontWeight:700,color:T.txt0,fontFamily:"'Inter',sans-serif"}}>ПРОВЕРКА · {obj?.name?.toUpperCase()}</div>
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
              {/* Взрывные работы участка — только для просмотра */}
              {(sel?.bf > 0 || sel?.fuel_kg > 0) && (
                <div style={{padding:"10px 14px",background:`${T.amber}10`,border:`1px solid ${T.amber}25`,borderRadius:5,display:"flex",gap:16,flexWrap:"wrap"}}>
                  <span style={{fontSize:12,fontWeight:700,color:T.amber,textTransform:"uppercase"}}>💥 Взрывные работы участка</span>
                  {sel?.bf > 0 && <span style={{fontSize:12,color:T.txt1}}>Взрыв: <b style={{color:T.amber}}>{sel.bf.toLocaleString()} м³</b></span>}
                  {sel?.fuel_kg > 0 && <span style={{fontSize:12,color:T.txt1}}>ВВ: <b style={{color:T.cyan}}>{sel.fuel_kg.toLocaleString()} кг</b></span>}
                  {sel?.bf > 0 && sel?.fuel_kg > 0 && <span style={{fontSize:12,color:T.txt2}}>Уд.: <b style={{color:T.txt0}}>{(sel.fuel_kg/sel.bf).toFixed(2)} кг/м³</b></span>}
                </div>
              )}
              <DataTable rows={editRows} onCell={setCell} totals={totals} T={T}/>

              {/* Простои по станкам (из rigEntries 2.0) */}
              {(()=>{
                const allDowntimes = (sel?.rigEntries || []).flatMap(e =>
                  (e.downtimes || []).map(d => ({ ...d, rigName: e.rigName }))
                );
                if (allDowntimes.length === 0) return null;
                const catColors = { technical:"#ef4444", organizational:"#f59e0b", external:"#3b82f6" };
                const catLabels = { technical:"Техн.", organizational:"Орг.", external:"Внешн." };
                const dtTotal = allDowntimes.reduce((s,d) => s + toNum(d.durationHours), 0);
                return (
                  <div style={{border:`1px solid #ef444430`,borderRadius:6,overflow:"hidden"}}>
                    <div style={{padding:"8px 14px",background:"rgba(239,68,68,0.07)",borderBottom:`1px solid #ef444425`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <span style={{fontSize:12,fontWeight:700,color:"#ef4444",textTransform:"uppercase",letterSpacing:".05em"}}>⏸ Простои · {allDowntimes.length} событий</span>
                      <span style={{fontSize:13,fontWeight:700,color:"#ef4444",fontFamily:"'JetBrains Mono',monospace"}}>{dtTotal.toFixed(1)} ч</span>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:0}}>
                      {allDowntimes.map((d,i) => {
                        const cc = catColors[d.category] || T.txt2;
                        return (
                          <div key={d.id||i} style={{
                            display:"flex",alignItems:"center",gap:10,padding:"8px 14px",
                            background:i%2 ? T.rowAlt : "transparent",
                            borderLeft:`3px solid ${cc}`,
                          }}>
                            <span style={{fontSize:12,fontWeight:700,color:cc,background:`${cc}18`,padding:"2px 6px",borderRadius:3,whiteSpace:"nowrap",minWidth:38,textAlign:"center"}}>
                              {catLabels[d.category]||d.category}
                            </span>
                            <span style={{fontSize:12,color:T.txt2,minWidth:70,whiteSpace:"nowrap"}}>{d.rigName}</span>
                            <span style={{fontSize:12,fontWeight:600,color:T.txt0,flex:1}}>{d.reason}</span>
                            {d.comment && <span style={{fontSize:12,color:T.txt2,fontStyle:"italic"}}>{d.comment}</span>}
                            <span style={{fontSize:13,fontWeight:700,color:cc,fontFamily:"'JetBrains Mono',monospace",minWidth:38,textAlign:"right"}}>{toNum(d.durationHours)}ч</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
              <div style={{background:`${T.green}10`,border:`1px solid ${T.green}30`,borderRadius:5,padding:"12px 14px",display:"flex",gap:10,alignItems:"flex-start"}}>
                <input type="checkbox" id={`confirm-cb-${sel?.id}`} checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} style={{width:16,height:16,cursor:"pointer",marginTop:1,flexShrink:0}}/>
                <label htmlFor={`confirm-cb-${sel?.id}`} style={{fontSize:12,color:T.green,cursor:"pointer",fontWeight:600,lineHeight:1.6}}>
                  Я проверил данные по объекту, станкам, бурению, взрыву, КТГ, простоям и ГСМ. Данные корректны.
                </label>
              </div>
              <div style={{display:"flex",gap:10}}>
                <Btn variant="success" style={{flex:1,padding:"11px",opacity:confirmed?1:0.4}} onClick={()=>{if(confirmed)doApprove();}} T={T}>✓ УТВЕРДИТЬ → DASHBOARD</Btn>
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
                <div style={{fontSize:14,fontWeight:700,color:T.txt0,fontFamily:"'Inter',sans-serif"}}>КТГ-ПЛАН · {obj?.name?.toUpperCase()} · {monthLabel(ktgSel.year_month)}</div>
                <div style={{fontSize:12,color:T.txt2,marginTop:2}}>От: {ktgSel.created_by} · {ktgSel.submitted_at?.slice(0,10)||"—"}</div>
              </div>
              <button onClick={()=>{setKtgSel(null);setKtgComment("");setKtgComErr("");}} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:T.txt2,lineHeight:1}}>×</button>
            </div>
            <div style={{padding:20}}>
              {(()=>{const avg=ktgAvg(ktgSel);return avg!==null&&(
                <div style={{marginBottom:16,padding:"14px 20px",borderRadius:6,
                  background:avg>=85?`${T.green}12`:`rgba(245,158,11,0.1)`,
                  border:`1px solid ${avg>=85?T.green+"30":"rgba(245,158,11,0.3)"}`}}>
                  <div style={{fontSize:12,color:T.txt2,textTransform:"uppercase",marginBottom:4}}>Средний КТГ плана</div>
                  <div style={{fontSize:36,fontWeight:700,color:avg>=85?T.green:T.amber,fontFamily:"'Inter',sans-serif",lineHeight:1}}>{avg}%</div>
                  <div style={{fontSize:12,color:T.txt2,marginTop:4}}>💡 Рекомендуется как целевой КТГ для плана производства</div>
                </div>
              );})()}
              {/* Mini calendar view */}
              {(()=>{
                if(!ktgSel.items)return null;
                const DAY_CAP=22;
                const[y,m]=ktgSel.year_month.split("-").map(Number);
                const dim=new Date(y,m,0).getDate();
                const days=Array.from({length:dim},(_,i)=>`${ktgSel.year_month}-${String(i+1).padStart(2,"0")}`);
                const aids=Object.keys(ktgSel.items);
                if(!aids.length)return null;
                function cellCfg(h,toName){
                  if(h==null)      return{bg:"transparent",               border:T.border,                  icon:"·"};
                  if(h===0&&toName)return{bg:"rgba(245,158,11,0.15)",     border:"rgba(245,158,11,0.4)",     icon:"🔧"};
                  if(h===0)        return{bg:"rgba(239,68,68,0.18)",      border:"rgba(239,68,68,0.4)",      icon:"🛠"};
                  if(h===DAY_CAP)  return{bg:"rgba(16,185,129,0.12)",     border:"rgba(16,185,129,0.35)",    icon:"✅"};
                  const pct=h/DAY_CAP;
                  if(pct>=0.8)     return{bg:"rgba(16,185,129,0.08)",     border:"rgba(16,185,129,0.25)",    icon:"✅"};
                  if(pct>=0.5)     return{bg:"rgba(245,158,11,0.12)",     border:"rgba(245,158,11,0.3)",     icon:"🔧"};
                  return                {bg:"rgba(239,68,68,0.10)",       border:"rgba(249,115,22,0.3)",     icon:"⚠"};
                }
                return(
                  <div style={{overflowX:"auto",marginBottom:16}}>
                    <table style={{borderCollapse:"collapse",width:"100%",minWidth:dim*30+120}}>
                      <thead>
                        <tr style={{background:T.bg3}}>
                          <th style={{padding:"6px 10px",textAlign:"left",fontSize:12,color:T.txt2,borderBottom:`1px solid ${T.border}`,minWidth:90,position:"sticky",left:0,background:T.bg3,zIndex:2}}>Актив</th>
                          {days.map(d=>{
                            const dn=parseInt(d.slice(8),10);
                            const filled=aids.filter(aid=>(ktgSel.items[aid]||{})[d]!=null);
                            const ktgV=filled.length?Math.round(filled.reduce((s,aid)=>s+(Number((ktgSel.items[aid]||{})[d])||0),0)/(filled.length*DAY_CAP)*100):null;
                            return(<th key={d} style={{padding:"2px 1px",textAlign:"center",fontSize:12,color:T.txt2,borderBottom:`1px solid ${T.border}`,minWidth:26,background:T.bg3}}>
                              <div style={{fontWeight:700}}>{dn}</div>
                              {ktgV!==null&&<div style={{fontSize:12,color:ktgV>=85?T.green:ktgV>=70?T.amber:"#ef4444"}}>{ktgV}%</div>}
                            </th>);
                          })}
                          <th style={{padding:"6px 8px",fontSize:12,color:T.green,textAlign:"center",borderBottom:`1px solid ${T.border}`,minWidth:46}}>КТГ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aids.map((aid,ai)=>{
                          const node=nodes?.find(n=>n.id===aid);
                          const filledDays=days.filter(d=>(ktgSel.items[aid]||{})[d]!=null);
                          const totalH=filledDays.reduce((s,d)=>s+(Number((ktgSel.items[aid]||{})[d])||0),0);
                          const ktg=filledDays.length?Math.round(totalH/(filledDays.length*DAY_CAP)*100):0;
                          return(<tr key={aid} style={{background:ai%2?T.rowAlt:"transparent"}}>
                            <td style={{padding:"4px 10px",fontSize:12,fontWeight:700,color:T.txt0,position:"sticky",left:0,background:ai%2?T.rowAlt:T.bg2,zIndex:1,whiteSpace:"nowrap"}}>{node?.name||aid}</td>
                            {days.map(d=>{
                              const rawH=(ktgSel.items[aid]||{})[d];
                              const h=(rawH==null)?null:Number(rawH);
                              const toName=(ktgSel.to_info?.[aid]||{})[d]||null;
                              const cfg=cellCfg(h,toName);
                              return(<td key={d} style={{padding:"1px",textAlign:"center"}}>
                                <div title={toName||(h!=null?`${h}ч`:"—")} style={{width:22,height:20,borderRadius:3,margin:"0 auto",background:cfg.bg,border:`1px solid ${cfg.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>
                                  {h==null?"·":cfg.icon}
                                </div>
                              </td>);
                            })}
                            <td style={{padding:"4px 8px",textAlign:"center",fontWeight:700,fontSize:13,color:ktg>=85?T.green:ktg>=70?T.amber:"#ef4444",fontFamily:"'Inter',sans-serif"}}>{filledDays.length?`${ktg}%`:"—"}</td>
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
                  style={{width:"100%",padding:"9px 12px",background:T.inputBg,border:`1px solid ${ktgComErr?T.red:T.border}`,borderRadius:4,color:T.txt0,fontSize:13,resize:"vertical",fontFamily:"'Inter',sans-serif",outline:"none"}}/>
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
        <button onClick={()=>setSelObjId(null)} style={{padding:"6px 14px",borderRadius:5,border:`1px solid ${T.border}`,background:T.bg2,color:T.txt2,cursor:"pointer",fontSize:12,fontFamily:"'Inter',sans-serif",fontWeight:600}}>← Все объекты</button>
        <span style={{color:T.txt2,fontSize:14}}>›</span>
        <div style={{padding:"5px 14px",borderRadius:5,background:`${objColor}15`,border:`1px solid ${objColor}40`,fontSize:13,fontWeight:700,color:objColor,fontFamily:"'Inter',sans-serif"}}>{obj?.name}</div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:6,marginBottom:20}}>
        {[
          {k:"reports",l:"Отчёты БВР",badge:objPendReps},
          {k:"ktg",    l:"КТГ-планы", badge:objPendKtg},
        ].map(({k,l,badge})=>(
          <button key={k} onClick={()=>setTab(k)} style={{
            padding:"8px 20px",borderRadius:5,border:`1px solid ${tab===k?objColor:T.border}`,
            background:tab===k?`${objColor}15`:"transparent",color:tab===k?objColor:T.txt2,
            fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all 0.15s"}}>
            {l}
            {badge>0&&<span style={{marginLeft:6,background:T.red,color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:12,fontWeight:700}}>{badge}</span>}
          </button>
        ))}
      </div>

      {/* REPORTS TAB */}
      {tab==="reports"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>

          {/* Модалка подтверждения удаления */}
          {deleteConfirmId&&(
            <div style={{position:"fixed",inset:0,background:T.modalBg,zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
              <div style={{background:T.bg2,border:`1px solid ${T.red}`,borderRadius:8,maxWidth:420,width:"100%",padding:24}}>
                <div style={{fontSize:15,fontWeight:700,color:T.txt0,marginBottom:8}}>Удалить отчёт?</div>
                <div style={{fontSize:13,color:T.txt2,marginBottom:20}}>
                  Это действие необратимо. Отчёт будет удалён из системы.
                </div>
                <div style={{display:"flex",gap:10}}>
                  <Btn variant="danger" style={{flex:1}} onClick={()=>{onDelete(deleteConfirmId);setDeleteConfirmId(null);}} T={T}>🗑 Удалить</Btn>
                  <Btn variant="ghost" style={{flex:1}} onClick={()=>setDeleteConfirmId(null)} T={T}>Отмена</Btn>
                </div>
              </div>
            </div>
          )}

          {/* Модалка редактирования отчёта инженером */}
          {editingRep&&(
            <div style={{position:"fixed",inset:0,background:T.modalBg,zIndex:600,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:20,overflowY:"auto"}}>
              <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderLeft:`3px solid ${T.amber}`,borderRadius:8,width:"100%",maxWidth:820,marginTop:10,marginBottom:40}}>
                <div style={{padding:"14px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:T.bg2,zIndex:10}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:T.txt0}}>✏ РЕДАКТИРОВАНИЕ · {objs.find(o=>o.id===editingRep.oid)?.name?.toUpperCase()}</div>
                    <div style={{fontSize:12,color:T.amber,marginTop:2}}>Изменения сохраняются без смены статуса</div>
                  </div>
                  <button onClick={()=>setEditingRep(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:T.txt2,lineHeight:1}}>×</button>
                </div>
                <div style={{padding:20,display:"flex",flexDirection:"column",gap:14}}>
                  <div style={{display:"flex",gap:12,flexWrap:"wrap",padding:"12px 0",borderBottom:`1px solid ${T.border}`}}>
                    <FieldInput label="Дата" type="date" value={editingRep.date} onChange={e=>setEditingRep(p=>({...p,date:e.target.value}))} T={T} style={{flex:"1 1 140px"}}/>
                    <FieldSelect label="Смена" value={editingRep.sh} onChange={e=>setEditingRep(p=>({...p,sh:e.target.value}))} T={T} style={{flex:"1 1 160px"}}>
                      <option value="day">☀ Дневная</option>
                      <option value="night">☾ Ночная</option>
                    </FieldSelect>
                  </div>
                  <DataTable
                    rows={editingRep._editRows||[]}
                    onCell={(id,key,val)=>setEditingRep(p=>({...p,_editRows:p._editRows.map(r=>r.id===id?{...r,[key]: key==="dt" ? val : (val===""?0:(isNaN(Number(val))?0:Number(val)))}:r)}))}
                    totals={(editingRep._editRows||[]).reduce((t,r)=>({
                      df:t.df+toNum(r.df),bf:t.bf+toNum(r.bf),wh:t.wh+toNum(r.wh),dh:t.dh+toNum(r.dh),fuel:t.fuel+toNum(r.fuel),overDrill:t.overDrill+toNum(r.overDrill)
                    }),{df:0,bf:0,wh:0,dh:0,fuel:0,overDrill:0})}
                    T={T}
                  />
                  <div style={{display:"flex",gap:10,paddingTop:8}}>
                    <Btn variant="primary" style={{flex:1,padding:"11px"}} onClick={()=>{
                      const rows = editingRep._editRows||[];
                      const updated = {
                        ...editingRep,
                        date: editingRep.date, sh: editingRep.sh,
                        df: rows.reduce((s,r)=>s+toNum(r.df),0),
                        bf: rows.reduce((s,r)=>s+toNum(r.bf),0),
                        wh: rows.reduce((s,r)=>s+toNum(r.wh),0),
                        dh: rows.reduce((s,r)=>s+toNum(r.dh),0),
                        fuel: rows.reduce((s,r)=>s+toNum(r.fuel),0),
                        rigs: rows.map(r=>({id:r.id,n:r.nm,df:toNum(r.df),bf:toNum(r.bf),wh:toNum(r.wh),dh:toNum(r.dh),fuel:toNum(r.fuel),dt:r.dt||"—",overDrill:toNum(r.overDrill)})),
                      };
                      delete updated._editRows;
                      onUpdate(updated);
                      setEditingRep(null);
                    }} T={T}>✓ Сохранить изменения</Btn>
                    <Btn variant="ghost" style={{padding:"11px 16px"}} onClick={()=>setEditingRep(null)} T={T}>Отмена</Btn>
                  </div>
                </div>
              </div>
            </div>
          )}

          {objReps.length===0
            ?<Card style={{padding:24,textAlign:"center"}} T={T}><div style={{fontSize:12,color:T.txt2}}>Нет отчётов по этому объекту</div></Card>
            :objReps.map(r=>{
              const isPending=r.status==="submitted";
              return(
                <Card key={r.id} accent={isPending?T.red:T.border} style={{padding:"14px 16px"}} T={T}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                        <span style={{fontSize:15,fontWeight:700,color:T.txt0,fontFamily:"'Inter',sans-serif"}}>{r.date} · {r.sh==="day"?"☀ Дн":"☾ Ноч"}</span>
                        <StatusBadge status={r.status}/>
                      </div>
                      <div style={{fontSize:12,color:T.txt2,marginBottom:6}}>{r.by} · {r.submittedAt}</div>
                      <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
                        {[["⛏",r.df,"п.м",T.red],["💥",r.bf,"м³",T.amber],["⛽",r.fuel,"л",T.violet]].map(([ic,val,unit,c])=>(
                          <span key={ic} style={{fontSize:12}}><span style={{color:T.txt2}}>{ic} </span><b style={{color:c,fontFamily:"'Inter',sans-serif"}}>{val}</b><span style={{color:T.txt2,fontSize:12}}> {unit}</span></span>
                        ))}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                      {isPending&&<Btn variant="primary" onClick={()=>openReview(r)} T={T} style={{fontSize:12,padding:"7px 16px"}}>ПРОВЕРИТЬ →</Btn>}
                      <button onClick={()=>{
                        const baseRigs = rigs.filter(rg=>rg.o===r.oid);
                        const rows = baseRigs.map(rg=>{
                          const f=r.rigs?.find(x=>x.id===rg.id||(x.n&&x.n.replace(/[\s\-]/g,"").toLowerCase()===rg.n.replace(/[\s\-]/g,"").toLowerCase()))||{};
                          // Берём простой из downtime_events если он один станок, иначе из поля riga
                          const dtHours = f.downtime??0;
                          const dtNote = f.dt || (r.downtime_events?.length===1 ? r.downtime_events[0].reason : "") || "";
                          return{id:rg.id,nm:rg.n,df:f.df??0,bf:f.bf??0,wh:f.wh??0,dh:f.dh??dtHours,fuel:f.fuel??0,dt:dtNote,downtime:dtHours,overDrill:f.overDrill??0};
                        });
                        setEditingRep({...r, _editRows: rows});
                      }} style={{padding:"6px 14px",borderRadius:5,border:`1.5px solid ${T.amber}`,background:`${T.amber}10`,color:T.amber,fontSize:12,fontWeight:700,cursor:"pointer"}}>
                        ✏ Редактировать
                      </button>
                      <button onClick={()=>setDeleteConfirmId(r.id)}
                        style={{padding:"6px 14px",borderRadius:5,border:`1.5px solid ${T.red}`,background:`${T.red}10`,color:T.red,fontSize:12,fontWeight:700,cursor:"pointer"}}>
                        🗑 Удалить
                      </button>
                    </div>
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
                        <span style={{fontSize:15,fontWeight:700,color:T.txt0,fontFamily:"'Inter',sans-serif"}}>{monthLabel(plan.year_month)}</span>
                        <KTGPlanBadge status={plan.status}/>
                      </div>
                      <div style={{fontSize:12,color:T.txt2,marginBottom:6}}>
                        {plan.created_by} · {plan.submitted_at?.slice(0,10)||"—"}
                      </div>
                      {avg!==null&&(
                        <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:4,
                          background:avg>=85?`${T.green}15`:`rgba(245,158,11,0.12)`,
                          border:`1px solid ${avg>=85?T.green+"40":"rgba(245,158,11,0.3)"}`}}>
                          <span style={{fontSize:18,fontWeight:700,color:avg>=85?T.green:T.amber,fontFamily:"'Inter',sans-serif"}}>{avg}%</span>
                          <span style={{fontSize:12,color:T.txt2}}>ср. КТГ</span>
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
function ObjectsEditor({ objs, setObjs, rigs, setRigs, nodes, setNodes, T }) {
  const [moveModal,   setMoveModal]   = useState(null); // { nodeId, nodeName, currentOid }
  const [selObjId,    setSelObjId]    = useState(null); // drill into object
  const [filterCat,   setFilterCat]   = useState("all");
  const colors = OBJ_COLORS(T);

  const assets = nodes.filter(n => n.type === "ASSET");

  // Category list from assets
  const catTypes = [...new Set(assets.map(a => a.parentId))].map(pid => {
    const catNode = nodes.find(n => n.id === pid);
    return catNode ? { id: pid, name: catNode.name } : null;
  }).filter(Boolean);

  function doMove(newOid) {
    setNodes(prev => prev.map(n =>
      n.id === moveModal.nodeId ? { ...n, assigned_object_id: newOid } : n
    ));
    setMoveModal(null);
  }

  // ── Move modal ────────────────────────────────────────────
  const MoveModal = moveModal ? (
    <div style={{position:"fixed",inset:0,background:T.modalBg,zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderLeft:`4px solid ${T.cyan}`,borderRadius:8,width:"100%",maxWidth:400}}>
        <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:T.txt0}}>Переместить актив</div>
            <div style={{fontSize:12,color:T.cyan,marginTop:2}}>{moveModal.nodeName}</div>
          </div>
          <button onClick={()=>setMoveModal(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:T.txt2}}>×</button>
        </div>
        <div style={{padding:16,display:"flex",flexDirection:"column",gap:8}}>
          <div style={{fontSize:12,fontWeight:700,color:T.txt2,textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>Выберите объект</div>
          <div onClick={()=>doMove(null)}
            style={{padding:"10px 14px",borderRadius:6,cursor:"pointer",border:`1.5px solid ${moveModal.currentOid===null?T.amber:T.border}`,
              background:moveModal.currentOid===null?`${T.amber}12`:"transparent",display:"flex",alignItems:"center",justifyContent:"space-between"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=T.amber}
            onMouseLeave={e=>e.currentTarget.style.borderColor=moveModal.currentOid===null?T.amber:T.border}>
            <span style={{fontSize:13,color:moveModal.currentOid===null?T.amber:T.txt2,fontStyle:"italic"}}>— Не назначен (резерв)</span>
            {moveModal.currentOid===null&&<span style={{fontSize:12,color:T.amber,fontWeight:700}}>текущий</span>}
          </div>
          {objs.map(obj=>{
            const isCurrent = Number(moveModal.currentOid) === obj.id;
            return (
              <div key={obj.id} onClick={()=>!isCurrent&&doMove(obj.id)}
                style={{padding:"10px 14px",borderRadius:6,cursor:isCurrent?"default":"pointer",
                  border:`1.5px solid ${isCurrent?T.cyan:T.border}`,background:isCurrent?`${T.cyan}12`:"transparent",
                  display:"flex",alignItems:"center",justifyContent:"space-between"}}
                onMouseEnter={e=>{if(!isCurrent)e.currentTarget.style.borderColor=T.cyan;}}
                onMouseLeave={e=>{if(!isCurrent)e.currentTarget.style.borderColor=T.border;}}>
                <span style={{fontSize:13,fontWeight:isCurrent?700:400,color:isCurrent?T.cyan:T.txt0}}>📍 {obj.name}</span>
                {isCurrent&&<span style={{fontSize:12,color:T.cyan,fontWeight:700}}>текущий</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  ) : null;

  // ── Object detail view ────────────────────────────────────
  if (selObjId !== null) {
    const obj = objs.find(o=>o.id===selObjId);
    const objAssets = assets.filter(a=>Number(a.assigned_object_id)===selObjId);
    const unassigned = assets.filter(a=>!a.assigned_object_id);
    const ac = colors[objs.findIndex(o=>o.id===selObjId) % colors.length];

    // Group by parent category
    const grouped = catTypes.map(cat => ({
      ...cat,
      items: objAssets.filter(a => a.parentId === cat.id)
    })).filter(g => g.items.length > 0);

    return (
      <div>
        {MoveModal}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20,flexWrap:"wrap"}}>
          <button onClick={()=>setSelObjId(null)} style={{padding:"6px 14px",borderRadius:5,border:`1px solid ${T.border}`,background:T.bg2,color:T.txt2,cursor:"pointer",fontSize:12,fontWeight:600}}>← Все объекты</button>
          <span style={{color:T.txt2}}>›</span>
          <div style={{padding:"5px 14px",borderRadius:5,background:`${ac}15`,border:`1px solid ${ac}40`,fontSize:13,fontWeight:700,color:ac}}>{obj?.name}</div>
          <div style={{marginLeft:"auto",fontSize:12,color:T.txt2}}>{objAssets.length} активов</div>
        </div>

        {grouped.length === 0 ? (
          <Card style={{padding:32,textAlign:"center"}} T={T}>
            <div style={{fontSize:32,marginBottom:12}}>🏗</div>
            <div style={{fontSize:13,color:T.txt2,marginBottom:16}}>На объекте нет активов</div>
            <div style={{fontSize:12,color:T.txt2}}>Переместите активы из резерва или других объектов через раздел «Активы» или кнопку ↔ на карточке</div>
          </Card>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {grouped.map(cat=>(
              <div key={cat.id}>
                <div style={{fontSize:12,fontWeight:700,color:T.txt2,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8,paddingLeft:4,borderLeft:`2px solid ${ac}`}}>{cat.name} ({cat.items.length})</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:8}}>
                  {cat.items.map(a=>(
                    <div key={a.id} style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:7,padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:700,color:T.txt0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</div>
                        {a.serialNo && <div style={{fontSize:12,color:T.txt2,marginTop:2}}>{a.serialNo}</div>}
                      </div>
                      <button onClick={()=>setMoveModal({nodeId:a.id,nodeName:a.name,currentOid:a.assigned_object_id})}
                        title="Переместить на другой объект"
                        style={{padding:"5px 10px",borderRadius:4,border:`1px solid ${T.cyan}40`,background:`${T.cyan}10`,color:T.cyan,fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0}}>
                        ↔
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Unassigned assets panel */}
        {unassigned.length > 0 && (
          <div style={{marginTop:24,padding:"14px 16px",background:T.bg3,border:`1px solid ${T.border}`,borderRadius:8}}>
            <div style={{fontSize:12,fontWeight:700,color:T.txt2,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>
              📦 Резерв (не назначены) — {unassigned.length} активов
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {unassigned.map(a=>(
                <div key={a.id} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",background:T.bg2,border:`1px solid ${T.border}`,borderRadius:4}}>
                  <span style={{fontSize:12,color:T.txt1,fontWeight:600}}>{a.name}</span>
                  <button onClick={()=>setMoveModal({nodeId:a.id,nodeName:a.name,currentOid:null})}
                    style={{background:"none",border:"none",cursor:"pointer",color:T.cyan,fontSize:13,fontWeight:700,padding:0}}>↔</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Main list view ────────────────────────────────────────
  const allCatTypes = [
    {id:"all", name:"Все категории"},
    ...catTypes
  ];

  return (
    <div>
      {MoveModal}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:T.cyan,textTransform:"uppercase",letterSpacing:".18em",marginBottom:4}}>▌ УЧАСТКИ</div>
          <div style={{fontSize:22,fontWeight:700,color:T.txt0}}>Распределение активов</div>
        </div>
        <div style={{marginLeft:"auto",fontSize:12,color:T.txt2}}>{assets.length} активов · {objs.length} объектов</div>
      </div>

      {/* Category filter */}
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        {allCatTypes.map(c=>(
          <button key={c.id} onClick={()=>setFilterCat(c.id)}
            style={{padding:"5px 12px",borderRadius:4,border:`1px solid ${filterCat===c.id?T.cyan:T.border}`,
              background:filterCat===c.id?`${T.cyan}15`:"transparent",color:filterCat===c.id?T.cyan:T.txt2,
              fontSize:12,fontWeight:600,cursor:"pointer"}}>
            {c.name}
          </button>
        ))}
      </div>

      {/* Object cards */}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {objs.map((obj, i) => {
          const ac = colors[i % colors.length];
          const objAssets = assets.filter(a =>
            Number(a.assigned_object_id) === obj.id &&
            (filterCat === "all" || a.parentId === filterCat)
          );
          const totalForObj = assets.filter(a => Number(a.assigned_object_id) === obj.id).length;
          return (
            <div key={obj.id} style={{background:T.bg2,border:`1px solid ${T.border}`,borderLeft:`3px solid ${ac}`,borderRadius:8,overflow:"hidden"}}>
              <div onClick={()=>setSelObjId(obj.id)}
                style={{padding:"12px 16px",background:`${ac}08`,borderBottom:`1px solid ${T.border}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}
                onMouseEnter={e=>e.currentTarget.style.background=`${ac}15`}
                onMouseLeave={e=>e.currentTarget.style.background=`${ac}08`}>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:T.txt0,fontFamily:"'Inter',sans-serif"}}>{obj.name.toUpperCase()}</div>
                  <div style={{fontSize:12,color:T.txt2,marginTop:2}}>{totalForObj} активов всего</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  {objAssets.length > 0 && <span style={{fontSize:12,color:T.txt2}}>{filterCat!=="all"?`${objAssets.length} в категории`:""}</span>}
                  <span style={{fontSize:13,color:ac,fontWeight:700}}>→</span>
                </div>
              </div>

              {objAssets.length > 0 && (
                <div style={{padding:"10px 16px",display:"flex",flexWrap:"wrap",gap:6}}>
                  {objAssets.slice(0,12).map(a=>(
                    <div key={a.id} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",background:T.bg3,border:`1px solid ${T.border}`,borderRadius:3}}>
                      <div style={{width:4,height:4,borderRadius:"50%",background:ac,flexShrink:0}}/>
                      <span style={{fontSize:12,fontWeight:600,color:T.txt1}}>{a.name}</span>
                      <button onClick={e=>{e.stopPropagation();setMoveModal({nodeId:a.id,nodeName:a.name,currentOid:a.assigned_object_id});}}
                        title="Переместить" style={{background:"none",border:"none",cursor:"pointer",color:T.cyan,fontSize:13,fontWeight:700,padding:0,lineHeight:1}}>↔</button>
                    </div>
                  ))}
                  {objAssets.length > 12 && <span style={{fontSize:12,color:T.txt2,padding:"4px 8px"}}>+{objAssets.length-12} ещё</span>}
                </div>
              )}
            </div>
          );
        })}

        {/* Unassigned */}
        {(()=>{
          const unassigned = assets.filter(a =>
            !a.assigned_object_id &&
            (filterCat === "all" || a.parentId === filterCat)
          );
          if (!unassigned.length) return null;
          return (
            <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:8,overflow:"hidden",opacity:0.85}}>
              <div style={{padding:"12px 16px",background:T.bg3,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:T.txt2}}>📦 Резерв</div>
                  <div style={{fontSize:12,color:T.txt2,marginTop:2}}>Не назначены на объект · {unassigned.length} активов</div>
                </div>
              </div>
              <div style={{padding:"10px 16px",display:"flex",flexWrap:"wrap",gap:6}}>
                {unassigned.map(a=>(
                  <div key={a.id} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",background:T.bg3,border:`1px solid ${T.border}`,borderRadius:3}}>
                    <span style={{fontSize:12,fontWeight:600,color:T.txt2,fontStyle:"italic"}}>{a.name}</span>
                    <button onClick={()=>setMoveModal({nodeId:a.id,nodeName:a.name,currentOid:null})}
                      title="Назначить на объект" style={{background:"none",border:"none",cursor:"pointer",color:T.cyan,fontSize:13,fontWeight:700,padding:0,lineHeight:1}}>↔</button>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ─── ENGINEER: USERS EDITOR ───────────────────────────────────────────────────
function UserModalForm({ data, setData, onSave, onClose, title, objs, toggleOid, T }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: T.modalBg, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, width: "100%", maxWidth: 500, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.txt0, fontFamily: "'Inter',sans-serif" }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: T.txt2 }}>×</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <FieldInput label="ФИО" value={data.name || ""} onChange={(e) => setData((p) => ({ ...p, name: e.target.value }))} T={T} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FieldInput label="Логин" value={data.login || ""} onChange={(e) => setData((p) => ({ ...p, login: e.target.value }))} T={T} />
            <FieldInput label="Пароль" value={data.pw || ""} onChange={(e) => setData((p) => ({ ...p, pw: e.target.value }))} T={T} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: T.txt2, display: "block", marginBottom: 6 }}>Участки</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {objs.map((o) => {
                const has = data.oids === "all" || (data.oids || []).includes(o.id);
                return (
                  <div key={o.id} onClick={() => toggleOid(o.id)}
                    style={{ padding: "5px 12px", background: has ? `${T.blue}20` : T.bg3, border: `1px solid ${has ? T.blue : T.border}`, borderRadius: 3, fontSize: 12, fontWeight: 600, color: has ? T.blue : T.txt2, cursor: "pointer" }}>
                    {o.name}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <Btn variant="success" style={{ flex: 1 }} onClick={() => onSave(data)} T={T}>Сохранить</Btn>
          <Btn variant="ghost" onClick={onClose} T={T}>Отмена</Btn>
        </div>
      </div>
    </div>
  );
}

function UsersEditor({ users, setUsers, objs, T }) {
  const [editing,    setEditing]   = useState(null);
  const [addForm,    setAddForm]   = useState(null);
  const [deleteConf, setDeleteConf] = useState(null);
  const [saving,     setSaving]    = useState(false);
  const [msg,        setMsg]       = useState("");

  const foremen   = users.filter((u) => u.role === "foreman");
  const engineers = users.filter((u) => u.role === "engineer");

  async function saveUser(edited) {
    setSaving(true); setMsg("");
    try {
      if (edited.auth_id) {
        // Обновляем пароль если введён
        if (edited.newPw) await adminUpdatePassword(edited.auth_id, edited.newPw);
        setUsers(prev => prev.map(u => u.id === edited.id ? { ...edited } : u));
      } else {
        // Создаём нового пользователя
        if (!edited.login || !edited.pw) { setMsg("Заполните логин и пароль"); setSaving(false); return; }
        await adminCreateUser({
          login: edited.login, password: edited.pw,
          name: edited.name || "Нач. участка", role: "foreman",
          ini: edited.name ? edited.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() : "НУ",
          objectIds: edited.oids || [],
        });
        // Перезагружаем список
        const fresh = await adminListUsers();
        setUsers(fresh);
      }
      setMsg("✓ Сохранено");
    } catch(e) {
      setMsg("⚠ Ошибка: " + e.message);
    }
    setSaving(false);
    setEditing(null); setAddForm(null);
  }

  async function confirmDelete() {
    setSaving(true);
    try {
      await adminDeleteUser(deleteConf.auth_id);
      setUsers(prev => prev.filter(u => u.id !== deleteConf.id));
      setMsg("✓ Удалён");
    } catch(e) {
      setMsg("⚠ Ошибка: " + e.message);
    }
    setSaving(false);
    setDeleteConf(null);
  }

  function toggleEditOid(oid) {
    setEditing((prev) => {
      const cur  = prev.oids === "all" ? objs.map((o) => o.id) : [...prev.oids];
      const next = cur.includes(oid) ? cur.filter((x) => x !== oid) : [...cur, oid];
      return { ...prev, oids: next };
    });
  }
  function toggleAddOid(oid) {
    setAddForm((prev) => {
      const cur  = (prev.oids || []);
      const next = cur.includes(oid) ? cur.filter((x) => x !== oid) : [...cur, oid];
      return { ...prev, oids: next };
    });
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ background: T.violet, color: "#fff", padding: "4px 12px", borderRadius: 3, fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>ИНЖЕНЕР</div>
        <div style={{ fontSize: 12, color: T.txt2 }}>Управление начальниками участков</div>
      </div>
      <SectionTitle label="Персонал" sub="ПОЛЬЗОВАТЕЛИ" T={T} />

      {editing && (
        <UserModalForm data={editing} setData={setEditing} onSave={saveUser} onClose={() => setEditing(null)}
          title="РЕДАКТИРОВАТЬ НАЧ. УЧАСТКА" objs={objs} toggleOid={toggleEditOid} T={T} />
      )}
      {addForm && (
        <UserModalForm data={addForm} setData={setAddForm} onSave={saveUser} onClose={() => setAddForm(null)}
          title="НОВЫЙ НАЧ. УЧАСТКА" objs={objs} toggleOid={toggleAddOid} T={T} />
      )}

      {deleteConf && (
        <div style={{ position: "fixed", inset: 0, background: T.modalBg, zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: T.bg2, border: "1px solid rgba(239,68,68,0.4)", borderRadius: 8, maxWidth: 400, width: "100%", padding: 28, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.txt0, fontFamily: "'Inter',sans-serif", marginBottom: 8 }}>ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ</div>
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
        {msg && <span style={{ fontSize:12, color: msg.startsWith("✓") ? T.green : "#f87171", fontWeight:700 }}>{msg}</span>}
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
                    <div style={{ fontSize: 12, color: T.blue, textTransform: "uppercase", fontWeight: 700 }}>Нач. участка</div>
                    <div style={{ fontSize:12, color: T.txt2, fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>{u.login}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn variant="ghost" onClick={() => setEditing({ ...u })} style={{ fontSize: 12, padding: "4px 10px" }} T={T}>✏ Изм.</Btn>
                  <Btn variant="danger" onClick={() => setDeleteConf(u)} style={{ fontSize: 12, padding: "4px 10px" }} T={T}>🗑</Btn>
                </div>
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

  async function addUser(data) {
    if (!data.name || !data.login || !data.pw) return;
    try {
      await adminCreateUser({
        login: data.login, password: data.pw,
        name: data.name, role: activeRole, oids: "all",
        ini: data.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(),
      });
      const fresh = await adminListUsers();
      setUsers(fresh);
    } catch(e) {
      console.warn("Create user error:", e.message);
      setUsers(prev => [...prev, { id:genId(), name:data.name, login:data.login, pw:data.pw, role:activeRole, oids:"all", ini:data.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() }]);
    }
    setAddForm(null);
  }

  async function saveEdit(data) {
    try {
      if (data.auth_id && data.pw) await adminUpdatePassword(data.auth_id, data.pw);
      setUsers(prev => prev.map(u => u.id === data.id
        ? { ...u, name:data.name, login:data.login, ini:data.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() }
        : u));
    } catch(e) {
      console.warn("Update user error:", e.message);
    }
    setEditing(null);
  }

  async function confirmDelete() {
    try {
      if (deleteConf.auth_id) await adminDeleteUser(deleteConf.auth_id);
      setUsers(prev => prev.filter(u => u.id !== deleteConf.id));
    } catch(e) {
      console.warn("Delete user error:", e.message);
    }
    setDeleteConf(null);
  }

  function UserModal({ data, setData, onSave, onClose, title, color }) {
    return (
      <div style={{ position: "fixed", inset: 0, background: T.modalBg, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderLeft: `3px solid ${color}`, borderRadius: 8, width: "100%", maxWidth: 460, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.txt0, fontFamily: "'Inter',sans-serif" }}>{title}</div>
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
            <Btn variant="success" style={{ flex: 1 }} onClick={() => onSave(data)} T={T}>Сохранить</Btn>
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
            <div style={{ fontSize: 16, fontWeight: 700, color: T.txt0, fontFamily: "'Inter',sans-serif", marginBottom: 8 }}>ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ</div>
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
                fontFamily: "'Inter',sans-serif", textTransform: "uppercase" }}>
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
            <Card key={u.id} style={{ padding: 16 }} T={T}>
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
          { key:"bvr", label:"Планы БВР" },
        ].map(tab=>(
          <button key={tab.key} onClick={()=>setActiveTab(tab.key)} style={{
            padding:"8px 20px",borderRadius:4,border:"none",cursor:"pointer",
            fontSize:13,fontWeight:700,position:"relative",
            background:activeTab===tab.key?`${T.violet}20`:"transparent",
            color:activeTab===tab.key?T.violet:T.txt2,
            borderBottom:activeTab===tab.key?`2px solid ${T.violet}`:"2px solid transparent",
            fontFamily:"'Inter',sans-serif",transition:"all 0.15s",
          }}>
            {tab.label}
            {tab.badge>0&&(
              <span style={{marginLeft:8,background:T.red,color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:12,fontWeight:700}}>
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
    if(!plan?.items) return{avg:null,byAsset:[],dailyKtg:[],dim:31,days:[]};
    const DAY_CAP=22;
    const[y,m]=plan.year_month.split("-").map(Number);
    const dim=new Date(y,m,0).getDate();
    const days=Array.from({length:dim},(_,i)=>`${plan.year_month}-${String(i+1).padStart(2,"0")}`);
    const assetIds=Object.keys(plan.items);
    const byAsset=assetIds.map(aid=>{
      const node=nodes.find(n=>n.id===aid);
      const filledDays=days.filter(d=>(plan.items[aid]||{})[d]!=null);
      const totalH=filledDays.reduce((s,d)=>s+(Number((plan.items[aid]||{})[d])||0),0);
      const ktg=filledDays.length?Math.round(totalH/(filledDays.length*DAY_CAP)*100):0;
      const maintDays=filledDays.filter(d=>Number((plan.items[aid]||{})[d])===0&&!!((plan.to_info?.[aid]||{})[d])).length;
      const downtimeDays=filledDays.filter(d=>Number((plan.items[aid]||{})[d])===0&&!((plan.to_info?.[aid]||{})[d])).length;
      const readyDays=filledDays.filter(d=>Number((plan.items[aid]||{})[d])>0).length;
      return{id:aid,name:node?.name||aid,ktg,readyDays,maintDays,downtimeDays,dim:filledDays.length};
    });
    const avg=byAsset.length?Math.round(byAsset.reduce((s,a)=>s+a.ktg,0)/byAsset.length):null;
    const dailyKtg=days.map(d=>{
      const filled=assetIds.filter(aid=>(plan.items[aid]||{})[d]!=null);
      if(!filled.length)return{date:d,ktg:null};
      const sumH=filled.reduce((s,aid)=>s+(Number((plan.items[aid]||{})[d])||0),0);
      return{date:d,ktg:Math.round(sumH/(filled.length*DAY_CAP)*100)};
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
              <div style={{fontSize:13,fontWeight:700,color:T.txt0,fontFamily:"'Inter',sans-serif"}}>{obj?.name||"—"}</div>
              <div style={{fontSize:12,color:T.txt2,marginBottom:6}}>{monthLabel(plan.year_month)}</div>
              <div style={{fontSize:26,fontWeight:900,color:ac,fontFamily:"'Inter',sans-serif",lineHeight:1}}>
                {s.avg!==null?`${s.avg}%`:"—"}
              </div>
              <div style={{fontSize:12,color:T.txt2,marginTop:2}}>ср. КТГ</div>
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
              <div style={{fontSize:12,color:T.txt2,textTransform:"uppercase",letterSpacing:".1em",marginBottom:2}}>
                {objs.find(o=>o.id===selPlan.object_id)?.name} · {monthLabel(selPlan.year_month)}
              </div>
              <div style={{fontSize:12,color:T.txt2}}>Утверждён: {selPlan.decided_at?.slice(0,10)||"—"} · от {selPlan.created_by}</div>
            </div>
            {/* Big KTG gauge */}
            <div style={{textAlign:"center",marginLeft:"auto"}}>
              <KTGGauge v={stats.avg} plan={85} size={80} T={T}/>
              <div style={{fontSize:12,color:T.txt2,marginTop:2}}>Общий КТГ</div>
            </div>
            {/* Summary stats */}
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              {[
                [T.green,"✅ Готов",  stats.byAsset.reduce((s,a)=>s+a.readyDays,0),   "ст/дн"],
                [T.amber,"🔧 ТО",    stats.byAsset.reduce((s,a)=>s+a.maintDays,0),   "ст/дн"],
                ["#ef4444","🛠 Простой",stats.byAsset.reduce((s,a)=>s+a.downtimeDays,0),"ст/дн"],
              ].map(([c,lbl,val,u])=>(
                <div key={lbl} style={{textAlign:"center",padding:"8px 12px",background:`${c}12`,borderRadius:6,border:`1px solid ${c}30`,minWidth:70}}>
                  <div style={{fontSize:12,color:c,fontWeight:700,marginBottom:2}}>{lbl}</div>
                  <div style={{fontSize:20,fontWeight:700,color:c,fontFamily:"'Inter',sans-serif",lineHeight:1}}>{val}</div>
                  <div style={{fontSize:12,color:T.txt2}}>{u}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily KTG sparkline */}
          <Card T={T} style={{padding:"16px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:700,color:T.txt0,textTransform:"uppercase"}}>📈 КТГ по дням</div>
              <div style={{display:"flex",gap:12,fontSize:12,color:T.txt2}}>
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
                      <div style={{fontSize:12,color:c,fontWeight:700,marginBottom:2}}>{v>0?`${v}`:"·"}</div>
                      <div style={{width:"100%",maxWidth:18,borderRadius:"2px 2px 0 0",
                        height:Math.max(3,Math.round(v/100*80)),
                        background:c,opacity:0.85,transition:"height 0.3s"}}/>
                      <div style={{fontSize:12,color:dow===0||dow===6?T.amber:T.txt2,marginTop:2}}>{dayNum}</div>
                    </div>
                  );
                })}
              </div>
              {/* 85% target line label */}
              <div style={{fontSize:12,color:T.green,marginTop:4}}>── цель 85%</div>
            </div>
          </Card>

          {/* Per-asset breakdown */}
          <Card T={T}>
            <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,
              display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:12,fontWeight:700,color:T.txt0,textTransform:"uppercase"}}>⚙ Разбивка по станкам</div>
              <div style={{fontSize:12,color:T.txt2}}>{stats.byAsset.length} единиц техники</div>
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
                      display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:c,flexShrink:0}}>
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
                    <div style={{fontSize:18,fontWeight:700,color:c,fontFamily:"'Inter',sans-serif",minWidth:48,textAlign:"right"}}>{a.ktg}%</div>
                    {/* Day breakdown */}
                    <div style={{display:"flex",gap:6,flexShrink:0}}>
                      {[
                        {c:T.green,   icon:"✅", lbl:"Раб",     v:a.readyDays},
                        {c:T.amber,   icon:"🔧", lbl:"ТО",      v:a.maintDays},
                        {c:"#ef4444", icon:"🛠", lbl:"Простой", v:a.downtimeDays},
                      ].filter(x=>x.v>0).map(x=>(
                        <span key={x.lbl} title={x.lbl} style={{fontSize:12,color:x.c,fontWeight:700,
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
                fontFamily:"'Inter',sans-serif",minWidth:48,textAlign:"right"}}>{stats.avg}%</div>
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
  function upsertPlan(objId, field, newDates, monthTotal) {
    const patch = monthTotal !== undefined ? { dates: newDates, monthTotal } : { dates: newDates };
    setPlans(prev => {
      const ex = prev.find(p=>p.oid===objId&&p.field===field&&p.mode==="month"&&p.periodKey===yearMonth);
      if (ex) return prev.map(p=>p.oid===objId&&p.field===field&&p.mode==="month"&&p.periodKey===yearMonth?{...p,...patch}:p);
      return [...prev, {id:genId(),oid:objId,field,mode:"month",periodKey:yearMonth,dates:newDates,...patch}];
    });
    // Сохраняем в БД
    savePlanToDB({ oid:objId, field, mode:"month", periodKey:yearMonth, dates:newDates, ...patch })
      .catch(e => console.warn("Plan save error:", e.message));
  }
  // Spread total evenly across all days, store monthTotal for accurate pro-rata
  function setMonthTotal(objId, field, totalStr) {
    const total = parseFloat(totalStr) || 0;
    const base  = Math.floor(total / dim);
    const extra = Math.round(total - base * dim);
    upsertPlan(objId, field, days.map((d, i) => ({ date: d, val: i < extra ? base + 1 : base })), total);
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
      const ready = aids.filter(aid=>((plan.items[aid]||{})[d]??-1)>0).length;
      return Math.round(ready/aids.length*100);
    });
    return Math.round(ktgs.reduce((s,v)=>s+v,0)/ktgs.length);
  }
  function getDayKtg(objId, date) {
    const plan = ktgPlans.find(p=>p.status==="ACCEPTED"&&p.object_id===objId&&p.year_month===yearMonth);
    if (!plan?.items) return null;
    const aids = Object.keys(plan.items);
    if (!aids.length) return null;
    return Math.round(aids.filter(aid=>((plan.items[aid]||{})[date]??-1)>0).length/aids.length*100);
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
          <button onClick={prevMonth} style={{padding:"7px 16px",borderRadius:5,border:`1px solid ${T.border}`,background:T.bg2,color:T.txt1,cursor:"pointer",fontSize:13,fontFamily:"'Inter',sans-serif",fontWeight:600}}>← Пред.</button>
          <div style={{fontSize:18,fontWeight:700,color:T.txt0,fontFamily:"'Inter',sans-serif",minWidth:140,textAlign:"center",letterSpacing:"1px"}}>
            {MON_RU[mo-1].toUpperCase()} {yr}
          </div>
          <button onClick={nextMonth} style={{padding:"7px 16px",borderRadius:5,border:`1px solid ${T.border}`,background:T.bg2,color:T.txt1,cursor:"pointer",fontSize:13,fontFamily:"'Inter',sans-serif",fontWeight:600}}>След. →</button>
          <input type="month" value={yearMonth} onChange={e=>{setYearMonth(e.target.value);setSelObjId(null);}}
            style={{padding:"7px 12px",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:5,color:T.txt0,fontSize:13,fontFamily:"'Inter',sans-serif",outline:"none",marginLeft:4}}/>
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
              <div style={{fontSize:12,color:T.txt2,textTransform:"uppercase",marginBottom:4}}>{icon} {lbl}</div>
              <div style={{fontSize:24,fontWeight:700,color:c,fontFamily:"'Inter',sans-serif",lineHeight:1}}>{val>0?val.toLocaleString():"—"}</div>
              <div style={{fontSize:12,color:T.txt2,marginTop:2}}>{unit}</div>
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
                      <div style={{fontSize:15,fontWeight:700,color:T.txt0,fontFamily:"'Inter',sans-serif",letterSpacing:"1px"}}>{obj.name.toUpperCase()}</div>
                      <div style={{fontSize:12,color:T.txt2,marginTop:2}}>{MON_RU[mo-1]} {yr} · {dim} дней</div>
                    </div>
                    {ktg!==null&&(
                      <div style={{textAlign:"center",padding:"6px 12px",borderRadius:6,
                        background:ktg>=85?`${T.green}15`:`rgba(245,158,11,0.12)`,
                        border:`1px solid ${ktg>=85?T.green+"40":"rgba(245,158,11,0.3)"}`}}>
                        <div style={{fontSize:20,fontWeight:700,color:ktg>=85?T.green:T.amber,fontFamily:"'Inter',sans-serif",lineHeight:1}}>{ktg}%</div>
                        <div style={{fontSize:12,color:T.txt2,marginTop:2}}>КТГ</div>
                      </div>
                    )}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                    {[
                      {c:T.red,   icon:"⛏", lbl:"Бурение", val:df, unit:"п.м"},
                      {c:T.amber, icon:"💥", lbl:"Взрыв",   val:bf, unit:"м³"},
                    ].map(({c,icon,lbl,val,unit})=>(
                      <div key={lbl} style={{padding:"8px 10px",background:T.bg3,borderRadius:5,border:`1px solid ${T.border}`}}>
                        <div style={{fontSize:12,color:c,fontWeight:700,textTransform:"uppercase",marginBottom:3}}>{icon} {lbl}</div>
                        {val>0
                          ?<><div style={{fontSize:18,fontWeight:700,color:c,fontFamily:"'Inter',sans-serif",lineHeight:1}}>{val.toLocaleString()}</div>
                            <div style={{fontSize:12,color:T.txt2,marginTop:1}}>{unit}</div></>
                          :<div style={{fontSize:12,color:T.txt2}}>Не задан</div>}
                      </div>
                    ))}
                  </div>
                  <div style={{textAlign:"center",padding:"8px",borderRadius:5,
                    background:hasData?`${ac}12`:`${T.border}20`,border:`1px solid ${hasData?ac+"40":T.border}`}}>
                    <span style={{fontSize:12,fontWeight:700,color:hasData?ac:T.txt2}}>{hasData?"Изменить план":"+ Задать план на месяц"}</span>
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
              <div style={{fontSize:15,fontWeight:700,color:T.txt0,fontFamily:"'Inter',sans-serif"}}>{obj?.name} · {dn} {MON_RU[mo-1]} {yr}</div>
              <div style={{fontSize:12,color:T.txt2,marginTop:2}}>{DOW_SH[dow]}{dayKtg!==null?` · КТГ: ${dayKtg}%`:""}</div>
            </div>
            <button onClick={()=>setEditCell(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:T.txt2,lineHeight:1}}>×</button>
          </div>
          <div style={{padding:18,display:"flex",flexDirection:"column",gap:14}}>
            <FieldInput label="Бурение (п.м)" type="number" value={dfV} onChange={e=>setDfV(e.target.value)} T={T}/>
            <FieldInput label="Взрыв (м³)" type="number" value={bfV} onChange={e=>setBfV(e.target.value)} T={T}/>
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
        <button onClick={()=>setSelObjId(null)} style={{padding:"6px 14px",borderRadius:5,border:`1px solid ${T.border}`,background:T.bg2,color:T.txt2,cursor:"pointer",fontSize:12,fontFamily:"'Inter',sans-serif",fontWeight:600}}>← Все объекты</button>
        <span style={{color:T.txt2,fontSize:14}}>›</span>
        <div style={{padding:"5px 14px",borderRadius:5,background:`${objColor}15`,border:`1px solid ${objColor}40`,fontSize:13,fontWeight:700,color:objColor,fontFamily:"'Inter',sans-serif"}}>{obj?.name}</div>
        <div style={{marginLeft:"auto",display:"flex",gap:6,alignItems:"center"}}>
          <button onClick={prevMonth} style={{padding:"5px 12px",borderRadius:4,border:`1px solid ${T.border}`,background:T.bg2,color:T.txt1,cursor:"pointer",fontSize:14,lineHeight:1}}>←</button>
          <span style={{fontSize:14,fontWeight:700,color:T.txt0,fontFamily:"'Inter',sans-serif",minWidth:120,textAlign:"center"}}>{MON_RU[mo-1]} {yr}</span>
          <button onClick={nextMonth} style={{padding:"5px 12px",borderRadius:4,border:`1px solid ${T.border}`,background:T.bg2,color:T.txt1,cursor:"pointer",fontSize:14,lineHeight:1}}>→</button>
        </div>
      </div>

      {/* Summary + quick-total inputs */}
      <div style={{display:"flex",gap:12,marginBottom:18,flexWrap:"wrap"}}>
        {/* Drill total input */}
        <Card accent={T.red} style={{padding:"12px 18px",minWidth:180}} T={T}>
          <div style={{fontSize:12,color:T.txt2,textTransform:"uppercase",marginBottom:6,letterSpacing:".1em"}}>⛏ Бурение — план месяца</div>
          <input type="number" value={totDf||""} placeholder="0"
            onChange={e=>setMonthTotal(selObjId,"df",e.target.value)}
            style={{fontSize:28,fontWeight:700,color:T.red,fontFamily:"'Inter',sans-serif",
              background:"transparent",border:"none",outline:"none",width:"100%",padding:0,lineHeight:1,
              borderBottom:`2px solid ${T.red}50`}}/>
          <div style={{fontSize:12,color:T.txt2,marginTop:6}}>п.м · раскидает равномерно по дням</div>
        </Card>

        {/* Blast total input */}
        <Card accent={T.amber} style={{padding:"12px 18px",minWidth:180}} T={T}>
          <div style={{fontSize:12,color:T.txt2,textTransform:"uppercase",marginBottom:6,letterSpacing:".1em"}}>💥 Взрыв — план месяца</div>
          <input type="number" value={totBf||""} placeholder="0"
            onChange={e=>setMonthTotal(selObjId,"bf",e.target.value)}
            style={{fontSize:28,fontWeight:700,color:T.amber,fontFamily:"'Inter',sans-serif",
              background:"transparent",border:"none",outline:"none",width:"100%",padding:0,lineHeight:1,
              borderBottom:`2px solid ${T.amber}50`}}/>
          <div style={{fontSize:12,color:T.txt2,marginTop:6}}>м³ · раскидает равномерно по дням</div>
        </Card>

        {/* KTG from mechanic */}
        {ktgAvg!==null?(
          <Card accent={T.green} style={{padding:"12px 18px",minWidth:150}} T={T}>
            <div style={{fontSize:12,color:T.txt2,textTransform:"uppercase",marginBottom:6,letterSpacing:".1em"}}>⚙ КТГ план (механик)</div>
            <div style={{fontSize:32,fontWeight:700,color:ktgAvg>=85?T.green:T.amber,fontFamily:"'Inter',sans-serif",lineHeight:1}}>{ktgAvg}%</div>
            <div style={{fontSize:12,color:T.txt2,marginTop:6}}>Из согласованного плана</div>
          </Card>
        ):(
          <Card style={{padding:"12px 18px",minWidth:150,border:`2px dashed ${T.border}`}} T={T}>
            <div style={{fontSize:12,color:T.txt2,textTransform:"uppercase",marginBottom:6}}>⚙ КТГ план</div>
            <div style={{fontSize:13,color:T.txt2,fontStyle:"italic"}}>Не согласован</div>
            <div style={{fontSize:12,color:T.txt2,marginTop:4}}>Запросите план у механика</div>
          </Card>
        )}

        {/* Hint card */}
        <Card style={{padding:"12px 18px",flex:1,minWidth:180}} T={T}>
          <div style={{fontSize:12,color:T.txt2,textTransform:"uppercase",marginBottom:8}}>💡 Быстрый ввод</div>
          <div style={{fontSize:12,color:T.txt1,lineHeight:1.7}}>
            <span style={{color:T.txt0,fontWeight:600}}>Итог</span> → введи месячный объём, дни заполнятся равномерно<br/>
            <span style={{color:T.txt0,fontWeight:600}}>Ячейка</span> → нажми на конкретный день для точной правки
          </div>
        </Card>
      </div>

      {/* Monthly calendar table */}
      <Card T={T}>
        <div style={{padding:"10px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:13,fontWeight:700,color:T.txt0,fontFamily:"'Inter',sans-serif",textTransform:"uppercase"}}>
            📅 Дневной план — {MON_RU[mo-1]} {yr}
          </div>
          <div style={{fontSize:12,color:T.txt2}}>Нажмите на ячейку для правки конкретного дня</div>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{borderCollapse:"collapse",width:"100%",minWidth:Math.max(640,dim*40+180)}}>
            <thead>
              <tr style={{background:T.bg3}}>
                <th style={{padding:"8px 14px",textAlign:"left",fontSize:12,fontWeight:700,color:T.txt2,
                  textTransform:"uppercase",borderBottom:`1px solid ${T.border}`,
                  minWidth:120,position:"sticky",left:0,background:T.bg3,zIndex:3,
                  borderRight:`1px solid ${T.border}`}}>Показатель</th>
                {days.map(d=>{
                  const dn  = parseInt(d.slice(8),10);
                  const dow = new Date(d).getDay();
                  const isWe = dow===0||dow===6;
                  return(
                    <th key={d} style={{padding:"3px 1px",textAlign:"center",fontSize:12,fontWeight:700,
                      color:isWe?T.amber:T.txt2,borderBottom:`1px solid ${T.border}`,minWidth:38,
                      background:isWe?`${T.amber}0A`:T.bg3}}>
                      <div style={{lineHeight:1.4}}>{dn}</div>
                      <div style={{fontSize:12,opacity:0.7,lineHeight:1}}>{DOW_SH[dow]}</div>
                    </th>
                  );
                })}
                <th style={{padding:"8px 10px",textAlign:"center",fontSize:12,fontWeight:700,color:T.txt1,
                  borderBottom:`1px solid ${T.border}`,minWidth:70,
                  position:"sticky",right:0,background:T.bg3,zIndex:3,borderLeft:`2px solid ${T.border}`}}>
                  ИТОГО
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {field:"df",color:T.red,  label:"Бурение",unit:"п.м"},
                {field:"bf",color:T.amber,label:"Взрыв",  unit:"м³"},
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
                      fontFamily:"'Inter',sans-serif",
                      position:"sticky",right:0,background:ri%2?T.rowAlt:T.bg2,zIndex:2,
                      borderLeft:`2px solid ${T.border}`,whiteSpace:"nowrap"}}>
                      {rowTotal>0?rowTotal.toLocaleString():"—"}
                      {rowTotal>0&&<div style={{fontSize:12,color:T.txt2,fontFamily:"'Inter',sans-serif",fontWeight:400}}>{unit}</div>}
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
                              fontSize:12,fontWeight:700,color:c}}>
                              {v}%
                            </div>
                          ):(
                            <div style={{width:36,height:30,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"center"}}>
                              <span style={{fontSize:12,color:T.txt2}}>—</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td style={{padding:"6px 10px",textAlign:"center",fontWeight:700,
                      fontSize:ktgAvg!==null?18:13,
                      color:ktgAvg!==null?(ktgAvg>=85?T.green:T.amber):T.txt2,
                      fontFamily:"'Inter',sans-serif",
                      position:"sticky",right:0,background:`${T.green}06`,zIndex:2,
                      borderLeft:`2px solid ${T.border}`}}>
                      {ktgAvg!==null?`${ktgAvg}%`:"—"}
                      {ktgAvg!==null&&<div style={{fontSize:12,color:T.txt2,fontFamily:"'Inter',sans-serif",fontWeight:400}}>ср.</div>}
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
          <div style={{ fontSize:14, fontWeight:700, color:T.txt0, fontFamily:"'Inter',sans-serif" }}>{title}</div>
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
                        color:cfg.color, fontFamily:"'Inter',sans-serif" }}>
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
            <Btn variant="success" style={{ flex:1, padding:"11px" }} onClick={submit} T={T}>Сохранить</Btn>
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
        <div style={{ fontSize:16, fontWeight:700, color:T.txt0, fontFamily:"'Inter',sans-serif", marginBottom:8 }}>Удалить узел?</div>
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
        <span style={{ fontSize:12, color:T.txt2, width:12, textAlign:"center", flexShrink:0 }}>
          {hasChildren ? (shouldOpen ? "▼" : "▶") : ""}
        </span>
        <span style={{ fontSize:14 }}>{cfg.icon}</span>
        <span style={{ fontSize:13, fontWeight: isSelected ? 700 : 600, color: isSelected ? cfg.color : highlight ? cfg.color : T.txt0, flex:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
          {node.name}
        </span>
        {hasChildren && (
          <span style={{ fontSize:12, color:T.txt2, flexShrink:0 }}>{children.length}</span>
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
            <div style={{ fontSize:15, fontWeight:700, color:T.txt0, fontFamily:"'Inter',sans-serif" }}>⚙ КЛАССЫ ТЕХНИКИ</div>
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
                <Btn variant="success" style={{ flex:1 }} onClick={save} T={T}>Сохранить</Btn>
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
                  <div style={{ fontSize:12, color:T.txt2, fontFamily:"'JetBrains Mono',monospace" }}>{k}</div>
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
  COMPRESSOR: { label:"Компрессор",         icon:"💨", color:"#06b6d4" },
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
  const [form,    setForm]    = useState({
    assetClass:"", purpose:"", manufacturer:"", model:"", serial:"", year:"", inventory:"",
    reg_plate:"", engine_vol:"", commissioned:"", location:"", avg_monthly:"", total_hours:"", fuel_rate:"",
  });

  function openEdit() {
    setForm({
      assetClass:   pp.assetClass   || "",
      purpose:      pp.purpose      || "",
      manufacturer: pp.manufacturer || "",
      model:        pp.model        || "",
      serial:       pp.serial       || "",
      year:         pp.year         || "",
      inventory:    pp.inventory    || "",
      reg_plate:    pp.reg_plate    || "",
      engine_vol:   pp.engine_vol   != null ? String(pp.engine_vol) : "",
      commissioned: pp.commissioned || "",
      location:     pp.location     || "",
      avg_monthly:  pp.avg_monthly  != null ? String(pp.avg_monthly) : "",
      total_hours:  pp.total_hours  != null ? String(pp.total_hours) : "",
      fuel_rate:    pp.fuel_rate    != null ? String(pp.fuel_rate)   : "",
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
              <div style={{ fontSize:14, fontWeight:700, color:T.txt0, fontFamily:"'Inter',sans-serif" }}>ПАСПОРТ АКТИВА</div>
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
                        color:v.color, fontFamily:"'Inter',sans-serif" }}>
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
                <FieldInput label="Производитель"   value={form.manufacturer} onChange={e => setForm(p => ({ ...p, manufacturer:e.target.value }))} T={T} />
                <FieldInput label="Модель"           value={form.model}        onChange={e => setForm(p => ({ ...p, model:e.target.value }))}        T={T} />
                <FieldInput label="Серийный №"       value={form.serial}       onChange={e => setForm(p => ({ ...p, serial:e.target.value }))}       T={T} />
                <FieldInput label="Год выпуска"      value={form.year}         onChange={e => setForm(p => ({ ...p, year:e.target.value }))}         T={T} />
                <FieldInput label="Инвентарный №"    value={form.inventory}    onChange={e => setForm(p => ({ ...p, inventory:e.target.value }))}    T={T} />
                <FieldInput label="Гос. номер"       value={form.reg_plate}    onChange={e => setForm(p => ({ ...p, reg_plate:e.target.value }))}    T={T} />
                <FieldInput label="Объём двигателя"  value={form.engine_vol}   onChange={e => setForm(p => ({ ...p, engine_vol:e.target.value }))}   T={T} placeholder="куб.см" />
                <FieldInput label="Год ввода в экспл." value={form.commissioned} onChange={e => setForm(p => ({ ...p, commissioned:e.target.value }))} T={T} />
                <FieldInput label="Дислокация"       value={form.location}     onChange={e => setForm(p => ({ ...p, location:e.target.value }))}     T={T} style={{ gridColumn:"1/-1" }} />
                <FieldInput label="Ср. наработка/мес, мч" value={form.avg_monthly} onChange={e => setForm(p => ({ ...p, avg_monthly:e.target.value }))} T={T} />
                <FieldInput label="Наработка с ввода, мч" value={form.total_hours} onChange={e => setForm(p => ({ ...p, total_hours:e.target.value }))} T={T} />
                <FieldInput label="Норма расхода топлива" value={form.fuel_rate}   onChange={e => setForm(p => ({ ...p, fuel_rate:e.target.value }))}   T={T} placeholder="л/мч или л/100км" />
              </div>
              <div style={{ display:"flex", gap:10, marginTop:4 }}>
                <Btn variant="success" style={{ flex:1, padding:"11px" }} onClick={saveEdit} T={T}>Сохранить</Btn>
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
      {pp.model || pp.serial || pp.manufacturer || pp.year || pp.inventory || pp.reg_plate ? (
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", marginBottom:8 }}>Паспортные данные</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
            {[
              ["Производитель",          pp.manufacturer],
              ["Модель",                 pp.model],
              ["Серийный №",             pp.serial],
              ["Год выпуска",            pp.year],
              ["Инвентарный №",          pp.inventory],
              ["Гос. номер",             pp.reg_plate],
              ["Объём двигателя",        pp.engine_vol ? `${Number(pp.engine_vol).toLocaleString()} куб.см` : null],
              ["Год ввода в эксплуатацию", pp.commissioned],
            ].filter(([,v]) => v).map(([lbl,val]) => (
              <div key={lbl} style={{ padding:"10px 14px", background:T.bg3, borderRadius:5, border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:12, color:T.txt2, marginBottom:4 }}>{lbl}</div>
                <div style={{ fontSize:14, fontWeight:700, color:T.txt0, fontFamily:"'Inter',sans-serif" }}>{val}</div>
              </div>
            ))}
            {pp.location && (
              <div style={{ padding:"10px 14px", background:T.bg3, borderRadius:5, border:`1px solid ${T.border}`, gridColumn:"1/-1" }}>
                <div style={{ fontSize:12, color:T.txt2, marginBottom:4 }}>Дислокация / Назначение</div>
                <div style={{ fontSize:13, fontWeight:700, color:T.txt0 }}>{pp.location}</div>
              </div>
            )}
          </div>

          {/* Наработка и топливо */}
          {(pp.avg_monthly || pp.total_hours || pp.fuel_rate) && (
            <div style={{ marginTop:10 }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", marginBottom:8 }}>Наработка и расход</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
                {[
                  ["Ср. наработка / мес", pp.avg_monthly ? `${Number(pp.avg_monthly).toLocaleString()} мч` : null, T.blue],
                  ["Наработка с ввода",   pp.total_hours  ? `${Number(pp.total_hours).toLocaleString()} мч`  : null, T.amber],
                  ["Норма расхода",       pp.fuel_rate    ? `${pp.fuel_rate} л/мч`                           : null, T.green],
                ].filter(([,v]) => v).map(([lbl,val,ac]) => (
                  <div key={lbl} style={{ padding:"10px 14px", background:`${ac}10`, borderRadius:5, border:`1px solid ${ac}40` }}>
                    <div style={{ fontSize:12, color:T.txt2, marginBottom:4 }}>{lbl}</div>
                    <div style={{ fontSize:16, fontWeight:700, color:ac, fontFamily:"'Inter',sans-serif" }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
          <div style={{ fontSize:36, fontWeight:700, color:T.amber, fontFamily:"'Inter',sans-serif" }}>
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
                  color:mType===k?T.amber:T.txt2, fontFamily:"'Inter',sans-serif" }}>
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
                  color:mode===m?T.green:T.txt2, fontFamily:"'Inter',sans-serif" }}>
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
                style={{ width:"100%", padding:"9px 12px", background:T.inputBg, border:`1px solid ${T.border}`, borderBottom:`2px solid ${T.amber}`, borderRadius:4, color:T.amber, fontSize:15, fontWeight:700, outline:"none", fontFamily:"'Inter',sans-serif" }} />
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
            <Btn variant="success" style={{ flex:1 }} onClick={submit} T={T}>Сохранить</Btn>
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
                    <td style={{ padding:"8px 12px", fontWeight:700, color:T.amber, fontFamily:"'Inter',sans-serif" }}>{h.value.toLocaleString()} {unit}</td>
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
            style={{ fontSize:12, padding:"3px 8px", borderRadius:3, border:`1px solid ${T.green}50`, background:`${T.green}10`, color:T.green, cursor:"pointer", fontFamily:"'Inter',sans-serif", fontWeight:700 }}>
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
                style={{ flex:1, padding:"5px", borderRadius:3, border:`1px solid ${T.green}50`, background:`${T.green}15`, color:T.green, cursor:"pointer", fontSize:12, fontFamily:"'Inter',sans-serif", fontWeight:700 }}>
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
                  <div style={{ fontSize:12, color:T.txt2 }}>{pt.unit} · {pt.dataType}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); deletePoint(pt.id); }}
                  style={{ fontSize:12, color:"#ef4444", background:"none", border:"none", cursor:"pointer" }}>🗑</button>
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
                <div style={{ fontSize:14, fontWeight:700, color:T.green, fontFamily:"'Inter',sans-serif" }}>{selPoint.name}</div>
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
                              color:mForm.value===v?T.green:T.txt2, fontFamily:"'Inter',sans-serif" }}>
                            {v}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input value={mForm.value} onChange={e => setMForm(p => ({ ...p, value:e.target.value }))}
                        style={{ width:"100%", padding:"9px 12px", background:T.inputBg, border:`1px solid ${T.border}`, borderBottom:`2px solid ${T.green}`, borderRadius:4, color:T.green, fontSize:15, fontWeight:700, outline:"none", fontFamily:"'Inter',sans-serif" }} />
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
                        <td style={{ padding:"8px 12px", fontWeight:700, color:T.green, fontFamily:"'Inter',sans-serif" }}>{m.value} {selPoint.unit}</td>
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

// ── EAM: Asset Maintenance Tab ────────────────────────────────────────────────
const TO_TYPES = ["ТО-1","ТО-2","ТО-3","Капремонт","Внеплановое"];
const TO_INTERVAL_HRS = 250;

function AssetMaintenanceTab({ nodeId, nodeName, passport, meters, maintRecords, setMaintRecords, setPassports, user, T }) {
  const records      = (maintRecords[nodeId] || []).slice().sort((a,b) => b.date.localeCompare(a.date));
  const currentHours = meters[nodeId]?.current || parseFloat(passport?.total_hours) || 0;

  // Schedule from passport — array of {name, interval}
  const defSchedule = [
    {name:"ТО-1", interval:250, duration_hrs:2},
    {name:"ТО-2", interval:500, duration_hrs:4},
    {name:"ТО-3", interval:1000, duration_hrs:8},
    {name:"Капремонт", interval:5000, duration_hrs:72},
  ];
  const schedule = (passport?.toSchedule && passport.toSchedule.length > 0) ? passport.toSchedule : defSchedule;
  const scheduleTypes = schedule.map(s => s.name);

  // UI state
  const [showForm,    setShowForm]    = useState(false);
  const [showConfig,  setShowConfig]  = useState(false);
  const [form,        setForm]        = useState({ date: new Date().toISOString().slice(0,10), type: schedule[0]?.name||"ТО-1", hours:"", note:"" });
  const [cfgRows,     setCfgRows]     = useState(schedule.map(s=>({...s})));
  const [err,         setErr]         = useState("");

  const typeColors = { "ТО-1":T.green, "ТО-2":T.amber, "ТО-3":"#f97316", "Капремонт":"#ef4444", "Внеплановое":T.violet };
  function tColor(name) { return typeColors[name] || T.violet; }

  // For each schedule item: find last done, calc remaining
  function scheduleStatus(item) {
    const done = records.filter(r => r.type === item.name).sort((a,b) => b.hours - a.hours);
    const lastAt = done[0] ? parseFloat(done[0].hours) : 0;
    // next occurrence = lastAt + interval (or next multiple of interval from 0)
    const nextAt = lastAt > 0
      ? lastAt + item.interval
      : Math.ceil((currentHours + 1) / item.interval) * item.interval;
    const rem  = Math.max(0, nextAt - currentHours);
    const pct  = lastAt > 0
      ? Math.min(100, Math.round((currentHours - lastAt) / item.interval * 100))
      : Math.min(100, Math.round(currentHours / item.interval * 100));
    const overdue = currentHours >= nextAt;
    const urgent  = rem <= Math.round(item.interval * 0.1);  // last 10%
    const color   = overdue ? "#ef4444" : urgent ? T.amber : T.green;
    return { lastAt, nextAt, rem, pct, overdue, color, lastDate: done[0]?.date };
  }

  function save() {
    const h = parseFloat(form.hours);
    if (!form.date) { setErr("Укажите дату"); return; }
    if (isNaN(h) || h < 0) { setErr("Укажите наработку (мч)"); return; }
    const rec = { id:"mr"+genId(), date:form.date, type:form.type, hours:h, note:form.note.trim(), by:user?.name||"Механик" };
    setMaintRecords(prev => ({ ...prev, [nodeId]: [rec, ...(prev[nodeId]||[])] }));
    setShowForm(false);
    setForm({ date:new Date().toISOString().slice(0,10), type:schedule[0]?.name||"ТО-1", hours:"", note:"" });
    setErr("");
  }

  function saveConfig() {
    const valid = cfgRows.filter(r => r.name.trim() && Number(r.interval) > 0);
    if (valid.length === 0) { setErr("Добавьте хотя бы один вид ТО с интервалом > 0"); return; }
    if (setPassports) {
      setPassports(prev => ({
        ...prev,
        [nodeId]: { ...(prev[nodeId]||{}), toSchedule: valid.map(r=>({
          name: r.name.trim(),
          interval: Number(r.interval),
          duration_hrs: r.duration_hrs ? Number(r.duration_hrs) : null,
        })) }
      }));
    }
    setShowConfig(false);
    setErr("");
  }

  function addCfgRow()        { setCfgRows(p=>[...p, {name:"", interval:250, duration_hrs:""}]); }
  function removeCfgRow(i)    { setCfgRows(p=>p.filter((_,idx)=>idx!==i)); }
  function updateCfgRow(i,k,v){ setCfgRows(p=>p.map((r,idx)=>idx===i?{...r,[k]:v}:r)); }

  const inputStyle = { width:"100%", padding:"8px 10px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:13, boxSizing:"border-box", fontFamily:"'Inter',sans-serif" };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

      {/* ── CONFIG MODAL ─────────────────────────────────────────── */}
      {showConfig && (
        <div style={{position:"fixed",inset:0,background:T.modalBg,zIndex:800,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderLeft:`4px solid ${T.violet}`,borderRadius:8,width:"100%",maxWidth:480,padding:24}}>
            <div style={{fontSize:15,fontWeight:700,color:T.txt0,marginBottom:4}}>⚙ Настройка плановых ТО</div>
            <div style={{fontSize:12,color:T.txt2,marginBottom:18}}>
              Укажите виды ТО и интервал в моточасах для <b style={{color:T.txt0}}>{nodeName}</b>
            </div>

            {/* Header row */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 120px 110px 32px",gap:8,marginBottom:6}}>
              <div style={{fontSize:12,fontWeight:700,color:T.txt2,textTransform:"uppercase"}}>Вид ТО</div>
              <div style={{fontSize:12,fontWeight:700,color:T.txt2,textTransform:"uppercase"}}>Интервал (мч)</div>
              <div style={{fontSize:12,fontWeight:700,color:T.violet,textTransform:"uppercase"}}>Длит-ть (ч)</div>
              <div/>
            </div>

            {cfgRows.map((row, i) => (
              <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 120px 110px 32px",gap:8,marginBottom:8,alignItems:"center"}}>
                <input value={row.name} onChange={e=>updateCfgRow(i,"name",e.target.value)}
                  placeholder="напр. ТО-1" style={inputStyle}/>
                <input type="number" min="1" value={row.interval} onChange={e=>updateCfgRow(i,"interval",e.target.value)}
                  style={inputStyle}/>
                <input type="number" min="0" step="0.5" value={row.duration_hrs||""} onChange={e=>updateCfgRow(i,"duration_hrs",e.target.value)}
                  placeholder="часов" style={{...inputStyle,borderColor:T.violet+"60"}}/>
                <button onClick={()=>removeCfgRow(i)}
                  style={{width:32,height:36,background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:4,color:"#f87171",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  ×
                </button>
              </div>
            ))}

            <Btn variant="ghost" onClick={addCfgRow} T={T} style={{fontSize:12,marginBottom:16}}>+ Добавить вид ТО</Btn>

            {err && <div style={{fontSize:12,color:"#f87171",marginBottom:10}}>⚠ {err}</div>}

            <div style={{display:"flex",gap:10}}>
              <Btn variant="primary" onClick={saveConfig} T={T} style={{flex:1}}>✓ Сохранить настройки</Btn>
              <Btn variant="ghost"   onClick={()=>{setShowConfig(false);setCfgRows(schedule.map(s=>({...s})));setErr("");}} T={T}>Отмена</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ROW ───────────────────────────────────────────── */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
        <div style={{fontSize:12,fontWeight:700,color:T.txt0}}>
          ⏱ Текущая наработка: <span style={{color:T.cyan}}>{currentHours.toLocaleString()} мч</span>
        </div>
        <Btn variant="ghost" onClick={()=>{setCfgRows(schedule.map(s=>({...s})));setShowConfig(true);}} T={T} style={{fontSize:12,padding:"5px 12px"}}>
          ⚙ Настроить план ТО
        </Btn>
      </div>

      {/* ── SCHEDULE STATUS CARDS ─────────────────────────────────── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:10}}>
        {schedule.map(item => {
          const st = scheduleStatus(item);
          return (
            <div key={item.name} style={{padding:"12px 14px",background:T.bg3,borderRadius:6,
              border:`1px solid ${st.color}40`,borderLeft:`3px solid ${st.color}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{fontSize:13,fontWeight:700,color:tColor(item.name)}}>{item.name}</div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.txt2}}>каждые {item.interval} мч</div>
                  {item.duration_hrs && <div style={{fontSize:12,color:T.violet,fontWeight:700}}>⏱ {item.duration_hrs} ч простоя</div>}
                </div>
              </div>
              <div style={{fontSize:st.overdue?14:22,fontWeight:700,color:st.color,fontFamily:"'Inter',sans-serif",lineHeight:1,marginBottom:6}}>
                {st.overdue ? "⚠ ПРОСРОЧЕНО" : `${st.rem.toLocaleString()} мч`}
              </div>
              <div style={{height:5,background:T.border,borderRadius:3,overflow:"hidden",marginBottom:5}}>
                <div style={{height:"100%",width:`${st.pct}%`,background:st.color,borderRadius:3}}/>
              </div>
              <div style={{fontSize:12,color:T.txt2}}>
                {st.lastDate ? `Последнее: ${st.lastDate}` : "Не выполнялось"}
                {" · "}след.: {st.nextAt.toLocaleString()} мч
              </div>
            </div>
          );
        })}
      </div>

      {/* ── ADD RECORD FORM ──────────────────────────────────────── */}
      {showForm ? (
        <div style={{padding:"14px 16px",background:T.bg2,borderRadius:6,border:`1px solid ${T.border}`}}>
          <div style={{fontSize:13,fontWeight:700,color:T.txt0,marginBottom:12}}>+ Записать выполненное ТО</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:T.txt2,textTransform:"uppercase",display:"block",marginBottom:5}}>Дата</label>
              <input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} style={inputStyle}/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:T.txt2,textTransform:"uppercase",display:"block",marginBottom:5}}>Тип ТО</label>
              <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} style={inputStyle}>
                {[...scheduleTypes,"Внеплановое"].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <FieldInput label="Наработка на момент ТО (мч)" type="number" value={form.hours}
              onChange={e=>setForm(p=>({...p,hours:e.target.value}))}
              placeholder={`текущая: ${currentHours}`} T={T}/>
            <FieldInput label="Комментарий" value={form.note}
              onChange={e=>setForm(p=>({...p,note:e.target.value}))}
              placeholder="что сделано..." T={T}/>
          </div>
          {err && <div style={{fontSize:12,color:"#f87171",marginBottom:8}}>⚠ {err}</div>}
          <div style={{display:"flex",gap:8}}>
            <Btn variant="success" onClick={save} T={T}>✓ Сохранить</Btn>
            <Btn variant="ghost" onClick={()=>{setShowForm(false);setErr("");}} T={T}>Отмена</Btn>
          </div>
        </div>
      ) : (
        <Btn variant="primary" onClick={()=>{ setForm(p=>({...p,hours:String(currentHours),type:schedule[0]?.name||"ТО-1"})); setShowForm(true); }} T={T}>
          + Записать выполненное ТО
        </Btn>
      )}

      {/* ── HISTORY ──────────────────────────────────────────────── */}
      <div>
        <div style={{fontSize:12,fontWeight:700,color:T.txt2,textTransform:"uppercase",marginBottom:8}}>
          📋 История ТО{records.length>0 && ` · ${records.length} записей`}
        </div>
        {records.length === 0 ? (
          <div style={{padding:"20px",textAlign:"center",background:T.bg3,borderRadius:6,border:`1px solid ${T.border}`}}>
            <div style={{fontSize:12,color:T.txt2}}>История пуста — добавьте первую запись выше</div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {records.map((r,i) => (
              <div key={r.id} style={{padding:"12px 14px",background:i===0?`${tColor(r.type)}10`:T.bg3,
                borderRadius:6,border:`1px solid ${i===0?tColor(r.type)+"40":T.border}`,
                display:"flex",gap:14,alignItems:"flex-start"}}>
                <div style={{width:4,borderRadius:2,background:tColor(r.type),alignSelf:"stretch",flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                    <span style={{fontSize:13,fontWeight:700,color:tColor(r.type)}}>{r.type}</span>
                    <span style={{fontSize:12,color:T.txt2}}>{r.date}</span>
                    <span style={{fontSize:12,padding:"1px 7px",borderRadius:3,background:`${tColor(r.type)}15`,color:tColor(r.type),fontWeight:700}}>
                      {Number(r.hours).toLocaleString()} мч
                    </span>
                    {i===0 && <span style={{fontSize:12,padding:"1px 6px",borderRadius:3,background:`${T.green}20`,color:T.green,fontWeight:700}}>ПОСЛЕДНЕЕ</span>}
                  </div>
                  {r.note && <div style={{fontSize:12,color:T.txt1}}>{r.note}</div>}
                  <div style={{fontSize:12,color:T.txt2,marginTop:2}}>Записал: {r.by}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── EAM 1.2: Asset Detail Panel (tabbed) ─────────────────────────────────────
function AssetDetailPanel({ node, nodes, selCfg, selParent, selChildren, setSelected,
  passports, setPassports, meters, setMeters, points, setPoints, measurements, setMeasurements, properties, setProperties,
  assetClasses, locations, setLocations, movements14, setMovements14, curLocations, setCurLocations, lifecycle, setLifecycle,
  warranties, setWarranties, wProviders, maintRecords, setMaintRecords,
  onEdit, onDelete, onAddChild, user, T }) {

  const [tab, setTab] = useState("overview");
  const isAsset = node.type === "ASSET";
  const [showMovForm, setShowMovForm] = useState(false);
  const TABS = isAsset
    ? [["overview","Обзор"],["meter","Наработка"],["maint","ТО"],["points","Замеры"],["props","Свойства"],["movement","Движение"],["warranty","Гарантии"]]
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
            <div style={{ fontSize:18, fontWeight:700, color:T.txt0, fontFamily:"'Inter',sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{node.name}</div>
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
                fontFamily:"'Inter',sans-serif", textTransform:"uppercase" }}>
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
        {tab === "maint" && (
          <AssetMaintenanceTab nodeId={node.id} nodeName={node.name} passport={passports[node.id]} meters={meters} maintRecords={maintRecords} setMaintRecords={setMaintRecords} setPassports={setPassports} user={user} T={T} />
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
function EAMHierarchyPage({ nodes, setNodes, passports, setPassports, meters, setMeters, points, setPoints, measurements, setMeasurements, properties, setProperties, assetClasses, setAssetClasses, locations, setLocations, movements14, setMovements14, curLocations, setCurLocations, lifecycle, setLifecycle, warranties, setWarranties, wProviders, setWProviders, maintRecords, setMaintRecords, user, T }) {
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
              <div style={{ fontSize:15, fontWeight:700, color:T.txt0, fontFamily:"'Inter',sans-serif", marginBottom:8 }}>Выберите узел</div>
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
              maintRecords={maintRecords} setMaintRecords={setMaintRecords}
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
          <div style={{ fontSize:14, fontWeight:700, color:T.txt0, fontFamily:"'Inter',sans-serif" }}>ПРОВЕСТИ ОПЕРАЦИЮ ДВИЖЕНИЯ</div>
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
                    display:"flex", alignItems:"center", gap:10, fontFamily:"'Inter',sans-serif" }}>
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
          <div style={{ fontSize:14, fontWeight:700, color:T.txt0, fontFamily:"'Inter',sans-serif" }}>📍 СПРАВОЧНИК ЛОКАЦИЙ</div>
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
                    <div style={{ fontSize:12, color:lc.color, fontWeight:600 }}>{lc.label}</div>
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
          <div style={{ fontSize:16, fontWeight:700, color:"#3b82f6", fontFamily:"'Inter',sans-serif" }}>
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
                <div style={{ fontSize:18, fontWeight:700, color:v.color, fontFamily:"'Inter',sans-serif", lineHeight:1 }}>{cnt}</div>
                <div style={{ fontSize:12, color:v.color, fontWeight:600 }}>{v.label}</div>
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
          <div style={{ fontSize:14, fontWeight:700, color:T.txt0, fontFamily:"'Inter',sans-serif" }}>{initial ? "РЕДАКТИРОВАТЬ ГАРАНТИЮ" : "ДОБАВИТЬ ГАРАНТИЮ"}</div>
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
                  fontSize:13, fontWeight:700, fontFamily:"'Inter',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
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
            <Btn variant="success" style={{ flex:1, padding:"11px" }} onClick={submit} T={T}>Сохранить</Btn>
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
          <div style={{ fontSize:15, fontWeight:700, color:T.txt0, fontFamily:"'Inter',sans-serif" }}>{w.providerName}</div>
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
          <div style={{ fontSize:14, fontWeight:700, color:T.txt0, fontFamily:"'Inter',sans-serif" }}>🏭 СПРАВОЧНИК ПРОВАЙДЕРОВ</div>
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
                      fontSize:12, fontWeight:700, fontFamily:"'Inter',sans-serif" }}>{v.icon} {v.label}</button>
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
              <div style={{ fontSize:22, fontWeight:700, color:v.color, fontFamily:"'Inter',sans-serif", lineHeight:1 }}>{counts[k]||0}</div>
              <div style={{ fontSize:12, color:v.color, fontWeight:600 }}>{v.label}</div>
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
        <div style={{ fontSize: 20, fontWeight: 700, color: T.amber, fontFamily: "'Inter',sans-serif", marginBottom: 8 }}>МОДУЛЬ В РАЗРАБОТКЕ</div>
        <div style={{ fontSize: 13, color: T.txt2, lineHeight: 1.8 }}>
          Будет включать: Бюджет БВР · Себестоимость метра · ГСМ расходы · P&L по участкам
        </div>
      </Card>
    </div>
  );
}

// ─── FOREMAN DASHBOARD ────────────────────────────────────────────────────────
function ForemanDash({ user, objs, rigs, reps, plans, T }) {
  const myObjs  = objs.filter(o => user.oids === "all" || user.oids.includes(o.id));
  const colors  = OBJ_COLORS(T);
  const today   = new Date().toISOString().slice(0,10);
  const curMonth = today.slice(0,7);

  return (
    <div>
      {/* Шапка */}
      <div style={{ marginBottom:22 }}>
        <div style={{ fontSize:12, fontWeight:700, color:T.amber, textTransform:"uppercase", letterSpacing:".18em", marginBottom:4 }}>
          ▌ ПРОИЗВОДСТВЕННАЯ СВОДКА
        </div>
        <div style={{ fontSize:24, fontWeight:700, color:T.txt0, fontFamily:"'Inter',sans-serif", letterSpacing:"-0.5px" }}>
          {myObjs.map(o=>o.name).join(" · ")}
        </div>
        <div style={{ fontSize:12, color:T.txt2, marginTop:3 }}>
          {user.name} · {new Date().toLocaleDateString("ru",{day:"numeric",month:"long",year:"numeric"})}
        </div>
      </div>

      {myObjs.map((obj, oi) => {
        const ac       = colors[oi % colors.length];
        const approved = reps.filter(r => r.oid===obj.id && r.status!=="draft");
        const allMonth = approved.filter(r => r.date?.slice(0,7) === curMonth);
        const objRigs  = rigs.filter(r => r.o === obj.id);

        // Все время
        const tot = {
          df:   approved.reduce((s,r)=>s+r.df,0),
          bf:   approved.reduce((s,r)=>s+(r.bf||0),0),
          wh:   approved.reduce((s,r)=>s+r.wh,0),
          dh:   approved.reduce((s,r)=>s+r.dh,0),
          fuel: approved.reduce((s,r)=>s+r.fuel,0),
          fuelKg: approved.reduce((s,r)=>s+(r.fuel_kg||0),0),
        };
        // Текущий месяц
        const mon = {
          df:   allMonth.reduce((s,r)=>s+r.df,0),
          bf:   allMonth.reduce((s,r)=>s+(r.bf||0),0),
          wh:   allMonth.reduce((s,r)=>s+r.wh,0),
          dh:   allMonth.reduce((s,r)=>s+r.dh,0),
          fuel: allMonth.reduce((s,r)=>s+r.fuel,0),
        };

        const plan  = plans?.find(p=>p.oid===obj.id);
        const pDf   = plan?.dp || obj.dp || 0;
        const pBf   = plan?.bp || obj.bp || 0;
        const { ktg: kv } = repsKtgKio(approved);
        const { ktg: kvMon } = repsKtgKio(allMonth);

        // 30-дневный тренд бурения
        const last30 = Array.from({length:30}, (_,i)=>{
          const d = new Date(); d.setDate(d.getDate()-29+i);
          const ds = d.toISOString().slice(0,10);
          const fact = approved.filter(r=>r.date===ds).reduce((s,r)=>s+r.df,0);
          return { ds, day:d.getDate(), mon:d.getMonth(), fact };
        });
        const maxFact = Math.max(1,...last30.map(d=>d.fact));

        // Техника: станки + другая
        const drillRigs = objRigs;
        const otherRigs = rigs.filter(r=>r.o===obj.id && r.type && r.type!=="drill"); // если есть type

        return (
          <div key={obj.id} style={{ marginBottom: oi<myObjs.length-1 ? 36 : 0 }}>

            {/* ══ КПИ-карточки ══ */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:10, marginBottom:16 }}>

              {/* Бурение */}
              {(()=>{
                const perc = pDf>0 ? Math.round(tot.df/pDf*100) : null;
                const cc   = perc!==null ? (perc>=100?T.green:perc>=80?T.amber:"#ef4444") : ac;
                return (
                  <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderTop:`3px solid ${cc}`, borderRadius:7, padding:"14px 16px" }}>
                    <div style={{ fontSize:12, fontWeight:700, color:cc, textTransform:"uppercase", letterSpacing:".1em", marginBottom:6 }}>⛏ Бурение</div>
                    <div style={{ fontSize:26, fontWeight:700, color:cc, fontFamily:"'Inter',sans-serif", lineHeight:1 }}>{tot.df.toLocaleString()}</div>
                    <div style={{ fontSize:12, color:T.txt2, marginTop:3 }}>п.м всего</div>
                    {pDf>0 && <>
                      <div style={{ fontSize:12, color:T.txt2, marginTop:5 }}>план: <b style={{ color:T.txt1 }}>{pDf.toLocaleString()}</b></div>
                      <div style={{ height:3, background:T.bg3, borderRadius:2, marginTop:4 }}>
                        <div style={{ height:"100%", width:`${Math.min(perc||0,100)}%`, background:cc, borderRadius:2 }}/>
                      </div>
                      <div style={{ fontSize:12, fontWeight:700, color:cc, marginTop:3 }}>{perc}%</div>
                    </>}
                  </div>
                );
              })()}

              {/* Взрывы */}
              {(()=>{
                const perc = pBf>0 ? Math.round(tot.bf/pBf*100) : null;
                const cc   = perc!==null ? (perc>=100?T.green:perc>=80?T.amber:"#ef4444") : T.amber;
                return (
                  <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderTop:`3px solid ${cc}`, borderRadius:7, padding:"14px 16px" }}>
                    <div style={{ fontSize:12, fontWeight:700, color:cc, textTransform:"uppercase", letterSpacing:".1em", marginBottom:6 }}>💥 Взрывы</div>
                    <div style={{ fontSize:26, fontWeight:700, color:cc, fontFamily:"'Inter',sans-serif", lineHeight:1 }}>{tot.bf.toLocaleString()}</div>
                    <div style={{ fontSize:12, color:T.txt2, marginTop:3 }}>м³ всего</div>
                    {pBf>0 && <>
                      <div style={{ fontSize:12, color:T.txt2, marginTop:5 }}>план: <b style={{ color:T.txt1 }}>{pBf.toLocaleString()}</b></div>
                      <div style={{ height:3, background:T.bg3, borderRadius:2, marginTop:4 }}>
                        <div style={{ height:"100%", width:`${Math.min(perc||0,100)}%`, background:cc, borderRadius:2 }}/>
                      </div>
                      <div style={{ fontSize:12, fontWeight:700, color:cc, marginTop:3 }}>{perc}%</div>
                    </>}
                  </div>
                );
              })()}

              {/* КТГ */}
              <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderTop:`3px solid ${T.green}`, borderRadius:7, padding:"14px 16px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                <div style={{ fontSize:12, fontWeight:700, color:T.green, textTransform:"uppercase", letterSpacing:".1em", marginBottom:8 }}>КТГ</div>
                <KTGGauge v={kv} plan={obj.kp} size={66} T={T} />
                <div style={{ fontSize:12, color:T.txt2, marginTop:6, textAlign:"center" }}>план {obj.kp}%</div>
              </div>

              {/* Этот месяц */}
              <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderTop:`3px solid ${T.blue}`, borderRadius:7, padding:"14px 16px" }}>
                <div style={{ fontSize:12, fontWeight:700, color:T.blue, textTransform:"uppercase", letterSpacing:".1em", marginBottom:6 }}>📅 Этот месяц</div>
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:12, color:T.txt2 }}>Бурение</span>
                    <span style={{ fontSize:12, fontWeight:700, color:ac }}>{mon.df.toLocaleString()} п.м</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:12, color:T.txt2 }}>Взрывы</span>
                    <span style={{ fontSize:12, fontWeight:700, color:T.amber }}>{mon.bf.toLocaleString()} м³</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:12, color:T.txt2 }}>КТГ</span>
                    <span style={{ fontSize:12, fontWeight:700, color:kvMon!==null?scoreColor(kvMon,obj.kp,obj.kp-12,T):T.txt2 }}>{kvMon!==null?kvMon+"%":"—"}</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:12, color:T.txt2 }}>Простои</span>
                    <span style={{ fontSize:12, fontWeight:700, color:mon.dh>0?"#ef4444":T.txt2 }}>{mon.dh} ч</span>
                  </div>
                </div>
              </div>

              {/* Простои */}
              <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderTop:`3px solid #ef4444`, borderRadius:7, padding:"14px 16px" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#ef4444", textTransform:"uppercase", letterSpacing:".1em", marginBottom:6 }}>⏸ Простои</div>
                <div style={{ fontSize:26, fontWeight:700, color:tot.dh>0?"#ef4444":T.txt2, fontFamily:"'Inter',sans-serif", lineHeight:1 }}>{tot.dh}</div>
                <div style={{ fontSize:12, color:T.txt2, marginTop:3 }}>часов всего</div>
                {tot.wh>0 && <div style={{ fontSize:12, color:T.txt2, marginTop:5 }}>
                  от раб.времени: <b style={{ color:"#ef4444" }}>{Math.round(tot.dh/(tot.wh+tot.dh)*100)}%</b>
                </div>}
              </div>

              {/* ГСМ */}
              <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderTop:`3px solid ${T.violet}`, borderRadius:7, padding:"14px 16px" }}>
                <div style={{ fontSize:12, fontWeight:700, color:T.violet, textTransform:"uppercase", letterSpacing:".1em", marginBottom:6 }}>⛽ ГСМ</div>
                <div style={{ fontSize:22, fontWeight:700, color:T.violet, fontFamily:"'Inter',sans-serif", lineHeight:1 }}>{tot.fuel.toLocaleString()}</div>
                <div style={{ fontSize:12, color:T.txt2, marginTop:3 }}>л дизель</div>
                <div style={{ marginTop:6, fontSize:12, color:T.txt2 }}>
                  уд: <b style={{ color:T.violet }}>{tot.bf>0?(tot.fuel/tot.bf).toFixed(1):"—"}</b> л/м³
                </div>
                {tot.fuelKg>0 && <div style={{ fontSize:12, color:T.txt2, marginTop:3 }}>
                  ВВ: <b style={{ color:T.cyan }}>{tot.fuelKg.toLocaleString()} кг</b>
                </div>}
              </div>
            </div>

            {/* ══ Тренд бурения 30 дней ══ */}
            <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderRadius:7, padding:"14px 18px", marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", letterSpacing:".06em", marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span>📊 Бурение — 30 дней</span>
                {allMonth.length>0 && <span style={{ fontSize:12, color:T.txt0 }}>
                  <b style={{ color:ac }}>{mon.df.toLocaleString()} п.м</b> за месяц · {allMonth.length} смен
                </span>}
              </div>
              <div style={{ display:"flex", gap:1, alignItems:"flex-end", height:52 }}>
                {last30.map((d,i) => {
                  const h = d.fact>0 ? Math.max(3, Math.round(d.fact/maxFact*48)) : 2;
                  const isToday = d.ds===today;
                  const isNewMon = i>0 && d.mon!==last30[i-1].mon;
                  return (
                    <div key={d.ds} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:1, position:"relative" }}>
                      {isNewMon && <div style={{ position:"absolute", top:0, left:0, bottom:0, width:1, background:`${T.border}`, opacity:.5 }}/>}
                      <div title={`${d.ds}: ${d.fact} п.м`}
                        style={{ width:"100%", height:h, background:d.fact>0?(isToday?`${ac}`:`${ac}90`):`${ac}18`,
                          borderRadius:"2px 2px 0 0", border:isToday?`1px solid ${ac}`:undefined }}>
                      </div>
                      {(d.day===1||d.day===10||d.day===20||isToday) && (
                        <div style={{ fontSize:12, color:isToday?ac:T.txt2, fontWeight:isToday?700:400, whiteSpace:"nowrap" }}>{d.day}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ══ Техника ══ */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", letterSpacing:".06em", marginBottom:8 }}>
                🚜 Техника · {drillRigs.length} буровых станков
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:8 }}>
                {drillRigs.map(rg => {
                  const rgApp  = approved.filter(r=>r.rigs?.find(x=>x.id===rg.id));
                  const rgDf   = rgApp.reduce((s,r)=>s+(r.rigs?.find(x=>x.id===rg.id)?.df||0),0);
                  const rgWh   = rgApp.reduce((s,r)=>s+(r.rigs?.find(x=>x.id===rg.id)?.wh||0),0);
                  const rgDh   = rgApp.reduce((s,r)=>s+(r.rigs?.find(x=>x.id===rg.id)?.dh||0),0);
                  const rgFuel = rgApp.reduce((s,r)=>s+(r.rigs?.find(x=>x.id===rg.id)?.fuel||0),0);
                  const rgKv   = repKtg({wh:rgWh, dh:rgDh, downtime_events:[]});
                  const kc     = rgKv!==null ? scoreColor(rgKv,obj.kp,obj.kp-12,T) : T.txt2;
                  // последняя смена
                  const lastRep = rgApp.sort((a,b)=>b.date.localeCompare(a.date))[0];
                  return (
                    <div key={rg.id} style={{ background:T.bg2, border:`1px solid ${T.border}`, borderRadius:6, overflow:"hidden" }}>
                      <div style={{ padding:"9px 12px", background:`${ac}12`, borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div style={{ fontSize:14, fontWeight:900, color:T.txt0, letterSpacing:"1.5px" }}>{rg.n}</div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:13, fontWeight:700, color:kc }}>{rgKv!==null?rgKv+"%":"—"}</div>
                          <div style={{ fontSize:12, color:T.txt2 }}>КТГ</div>
                        </div>
                      </div>
                      <div style={{ padding:"8px 12px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
                        <div>
                          <div style={{ fontSize:12, color:T.txt2, textTransform:"uppercase" }}>Бурение</div>
                          <div style={{ fontSize:14, fontWeight:700, color:ac }}>{rgDf.toLocaleString()}<span style={{ fontSize:12, color:T.txt2 }}> п.м</span></div>
                        </div>
                        <div>
                          <div style={{ fontSize:12, color:T.txt2, textTransform:"uppercase" }}>Работа</div>
                          <div style={{ fontSize:14, fontWeight:700, color:T.blue }}>{rgWh.toFixed(0)}<span style={{ fontSize:12, color:T.txt2 }}> ч</span></div>
                        </div>
                        <div>
                          <div style={{ fontSize:12, color:T.txt2, textTransform:"uppercase" }}>ГСМ</div>
                          <div style={{ fontSize:14, fontWeight:700, color:T.violet }}>{rgFuel}<span style={{ fontSize:12, color:T.txt2 }}> т</span></div>
                        </div>
                        <div>
                          <div style={{ fontSize:12, color:T.txt2, textTransform:"uppercase" }}>Простои</div>
                          <div style={{ fontSize:14, fontWeight:700, color:rgDh>0?"#ef4444":T.txt2 }}>{rgDh}<span style={{ fontSize:12, color:T.txt2 }}> ч</span></div>
                        </div>
                      </div>
                      {lastRep && <div style={{ padding:"4px 12px 7px", fontSize:12, color:T.txt2 }}>
                        Посл. смена: <b style={{ color:T.txt1 }}>{lastRep.date}</b>
                      </div>}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        );
      })}
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
function MechanicAssetsPage({ nodes, setNodes, objs, reps, assetClasses, passports, setPassports, mechCats, setMechCats, maintRecords, setMaintRecords, user, T }) {
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

  const [moveModal,     setMoveModal]    = useState(null); // { nodeId, nodeName, currentOid }

  function openMoveAsset(a, e) {
    if (e) e.stopPropagation();
    setMoveModal({ nodeId: a.id, nodeName: a.name, currentOid: a.assigned_object_id ?? null });
  }
  function doMoveAsset(newOid) {
    setNodes(prev => prev.map(n => n.id === moveModal.nodeId
      ? { ...n, assigned_object_id: newOid }
      : n
    ));
    if (detailNode?.id === moveModal.nodeId) {
      setDetailNode(prev => prev ? { ...prev, assigned_object_id: newOid } : prev);
    }
    setMoveModal(null);
  }

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

  // ── MOVE MODAL ────────────────────────────────────────────────────────────────
  const MoveModal = moveModal ? (
    <div style={{position:"fixed",inset:0,background:T.modalBg,zIndex:800,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderLeft:`4px solid ${T.cyan}`,borderRadius:8,width:"100%",maxWidth:400}}>
        <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:T.txt0}}>📦 Переместить актив</div>
            <div style={{fontSize:12,color:T.cyan,marginTop:2}}>{moveModal.nodeName}</div>
          </div>
          <button onClick={()=>setMoveModal(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:T.txt2}}>×</button>
        </div>
        <div style={{padding:16,display:"flex",flexDirection:"column",gap:8}}>
          <div style={{fontSize:12,color:T.txt2,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>Выберите объект назначения</div>
          <div onClick={()=>doMoveAsset(null)}
            style={{padding:"10px 14px",borderRadius:6,cursor:"pointer",border:`1.5px solid ${moveModal.currentOid===null?T.amber:T.border}`,
              background:moveModal.currentOid===null?`${T.amber}12`:"transparent",
              display:"flex",alignItems:"center",justifyContent:"space-between",transition:"all 0.12s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=T.amber}
            onMouseLeave={e=>e.currentTarget.style.borderColor=moveModal.currentOid===null?T.amber:T.border}>
            <span style={{fontSize:13,color:moveModal.currentOid===null?T.amber:T.txt2,fontStyle:"italic"}}>— Не назначен (на склад)</span>
            {moveModal.currentOid===null && <span style={{fontSize:12,color:T.amber,fontWeight:700}}>текущий</span>}
          </div>
          {objs.map(obj=>{
            const isCurrent = Number(moveModal.currentOid) === obj.id;
            return (
              <div key={obj.id} onClick={()=>!isCurrent && doMoveAsset(obj.id)}
                style={{padding:"10px 14px",borderRadius:6,
                  cursor:isCurrent?"default":"pointer",
                  border:`1.5px solid ${isCurrent?T.cyan:T.border}`,
                  background:isCurrent?`${T.cyan}12`:"transparent",
                  display:"flex",alignItems:"center",justifyContent:"space-between",transition:"all 0.12s",
                  opacity:isCurrent?1:0.9}}
                onMouseEnter={e=>{if(!isCurrent)e.currentTarget.style.borderColor=T.cyan;}}
                onMouseLeave={e=>{if(!isCurrent)e.currentTarget.style.borderColor=T.border;}}>
                <span style={{fontSize:13,fontWeight:isCurrent?700:400,color:isCurrent?T.cyan:T.txt0}}>📍 {obj.name}</span>
                {isCurrent && <span style={{fontSize:12,color:T.cyan,fontWeight:700}}>текущий</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  ) : null;

  // ── ASSET DETAIL VIEW ──────────────────────────────────────────────────────
  if (detailNode) {
    const a   = detailNode;
    const pp  = passports[a.id] || {};
    const cat = cats.find(c => c.key === pp.assetClass) || {icon:"📦", color:T.txt2, label:"—"};
    const obj = objs.find(o => o.id === Number(a.assigned_object_id));
    const log = pp.moto_hours_log || [];
    const mh  = pp.total_hours || pp.moto_hours || 0;
    const yr  = pp.year ? new Date().getFullYear() - parseInt(pp.year) : null;

    function openPassportEdit() {
      setPpForm({
        manufacturer: pp.manufacturer||"",
        model: pp.model||"",
        year: pp.year||"",
        serial: pp.serial||"",
        inventory: pp.inventory||"",
        reg_plate: pp.reg_plate||"",
        engine_vol: pp.engine_vol ? String(pp.engine_vol) : "",
        commissioned: pp.commissioned||"",
        location: pp.location||"",
        avg_monthly: pp.avg_monthly ? String(pp.avg_monthly) : "",
        total_hours: pp.total_hours ? String(pp.total_hours) : "",
        fuel_rate: pp.fuel_rate ? String(pp.fuel_rate) : "",
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
          reg_plate: ppForm.reg_plate,
          engine_vol: parseFloat(ppForm.engine_vol)||null,
          commissioned: ppForm.commissioned,
          location: ppForm.location,
          avg_monthly: parseFloat(ppForm.avg_monthly)||null,
          total_hours: parseFloat(ppForm.total_hours)||null,
          fuel_rate: parseFloat(ppForm.fuel_rate)||null,
        }
      }));
      setPassportEdit(false);
    }

    // Status based on toSchedule — nearest upcoming TO
    const sched = pp.toSchedule && pp.toSchedule.length > 0
      ? pp.toSchedule
      : [{name:"ТО-1",interval:250,duration_hrs:2},{name:"ТО-2",interval:500,duration_hrs:4},{name:"ТО-3",interval:1000,duration_hrs:8},{name:"Капремонт",interval:5000,duration_hrs:72}];

    // For each schedule item: find last done record, calc next
    const assetRecs = (maintRecords?.[a.id] || []).sort((x,y)=>y.hours-x.hours);
    const schedStatus = sched.map(item => {
      const done   = assetRecs.filter(r=>r.type===item.name);
      const lastAt = done[0] ? parseFloat(done[0].hours) : 0;
      const nextAt = lastAt > 0 ? lastAt + item.interval : item.interval;
      const rem    = Math.max(0, nextAt - mh);
      const pct    = lastAt > 0
        ? Math.min(100, Math.round((mh - lastAt) / item.interval * 100))
        : Math.min(100, Math.round(mh / item.interval * 100));
      const overdue = mh >= nextAt;
      const urgent  = !overdue && rem <= Math.round(item.interval * 0.1);
      const color   = overdue ? "#ef4444" : urgent ? T.amber : T.green;
      return { ...item, lastAt, nextAt, rem, pct, overdue, color };
    });
    // Nearest = smallest rem (or first overdue)
    const nearest = schedStatus.slice().sort((a,b) => a.rem - b.rem)[0];
    const hs = nearest
      ? { label: nearest.name, color: nearest.color }
      : { label:"Норма", color: T.green };

    return (
      <div>
        {/* Passport edit modal */}
        {passportEdit && (
          <div style={{position:"fixed",inset:0,background:T.modalBg,zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderLeft:`4px solid ${cat.color}`,borderRadius:8,width:"100%",maxWidth:480}}>
              <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:T.bg3}}>
                <div style={{fontSize:14,fontWeight:700,color:T.txt0,fontFamily:"'Inter',sans-serif"}}>✏ ПАСПОРТ — {a.name}</div>
                <button onClick={()=>setPassportEdit(false)} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:T.txt2}}>×</button>
              </div>
              <div style={{padding:18,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <FieldInput label="Производитель"       value={ppForm.manufacturer} onChange={e=>setPpForm(p=>({...p,manufacturer:e.target.value}))} T={T}/>
                <FieldInput label="Марка / Модель"      value={ppForm.model}        onChange={e=>setPpForm(p=>({...p,model:e.target.value}))} T={T}/>
                <FieldInput label="Год выпуска"         value={ppForm.year}         onChange={e=>setPpForm(p=>({...p,year:e.target.value}))} T={T}/>
                <FieldInput label="Серийный №"          value={ppForm.serial}       onChange={e=>setPpForm(p=>({...p,serial:e.target.value}))} T={T}/>
                <FieldInput label="Инвентарный №"       value={ppForm.inventory}    onChange={e=>setPpForm(p=>({...p,inventory:e.target.value}))} T={T}/>
                <FieldInput label="Гос. номер"          value={ppForm.reg_plate}    onChange={e=>setPpForm(p=>({...p,reg_plate:e.target.value}))} T={T}/>
                <FieldInput label="Объём двигателя"     value={ppForm.engine_vol}   onChange={e=>setPpForm(p=>({...p,engine_vol:e.target.value}))} T={T} placeholder="куб.см"/>
                <FieldInput label="Год ввода в экспл."  value={ppForm.commissioned} onChange={e=>setPpForm(p=>({...p,commissioned:e.target.value}))} T={T}/>
                <FieldInput label="Наработка с ввода, мч" type="number" value={ppForm.total_hours} onChange={e=>setPpForm(p=>({...p,total_hours:e.target.value}))} T={T}/>
                <FieldInput label="Ср. наработка/мес"   type="number" value={ppForm.avg_monthly}  onChange={e=>setPpForm(p=>({...p,avg_monthly:e.target.value}))}  T={T}/>
                <FieldInput label="Норма расхода топлива" value={ppForm.fuel_rate}  onChange={e=>setPpForm(p=>({...p,fuel_rate:e.target.value}))} T={T} placeholder="л/мч"/>
                <FieldInput label="Дислокация"          value={ppForm.location}     onChange={e=>setPpForm(p=>({...p,location:e.target.value}))}     T={T} style={{gridColumn:"1/-1"}}/>
                <div style={{gridColumn:"1/-1",display:"flex",gap:8,marginTop:4}}>
                  <Btn variant="success" style={{flex:1}} onClick={savePassport} T={T}>✓ Сохранить</Btn>
                  <Btn variant="ghost" onClick={()=>setPassportEdit(false)} T={T}>Отмена</Btn>
                </div>
              </div>
            </div>
          </div>
        )}

        {MoveModal}

        {/* Breadcrumb */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20,flexWrap:"wrap"}}>
          <button onClick={()=>setDetailNode(null)} style={{padding:"6px 14px",borderRadius:5,border:`1px solid ${T.border}`,background:T.bg2,color:T.txt2,cursor:"pointer",fontSize:12,fontFamily:"'Inter',sans-serif",fontWeight:600}}>← Все активы</button>
          <span style={{color:T.txt2}}>›</span>
          <div style={{padding:"5px 14px",borderRadius:5,background:`${cat.color}15`,border:`1px solid ${cat.color}40`,fontSize:13,fontWeight:700,color:cat.color,fontFamily:"'Inter',sans-serif"}}>{cat.icon} {a.name}</div>
          <div style={{marginLeft:"auto",display:"flex",gap:6}}>
            <button onClick={()=>openMoveAsset(a)} style={{padding:"6px 14px",borderRadius:5,border:`1.5px solid ${T.cyan}`,background:`${T.cyan}10`,color:T.cyan,cursor:"pointer",fontSize:12,fontFamily:"'Inter',sans-serif",fontWeight:700}}>📦 Переместить</button>
            <button onClick={openPassportEdit} style={{padding:"6px 14px",borderRadius:5,border:`1px solid ${T.border}`,background:T.bg2,color:T.txt1,cursor:"pointer",fontSize:12,fontFamily:"'Inter',sans-serif",fontWeight:600}}>✏ Редактировать</button>
            <button onClick={()=>setDeleteConfId(a.id)} style={{padding:"6px 12px",borderRadius:5,border:"1px solid rgba(239,68,68,0.4)",background:"rgba(239,68,68,0.08)",color:"#f87171",cursor:"pointer",fontSize:12}}>🗑</button>
          </div>
        </div>

        {/* Delete confirm */}
        {deleteConfId && (
          <div style={{position:"fixed",inset:0,background:T.modalBg,zIndex:800,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <div style={{background:T.bg2,border:"1px solid rgba(239,68,68,0.4)",borderRadius:8,maxWidth:360,width:"100%",padding:28,textAlign:"center"}}>
              <div style={{fontSize:36,marginBottom:12}}>⚠️</div>
              <div style={{fontSize:15,fontWeight:700,color:T.txt0,fontFamily:"'Inter',sans-serif",marginBottom:8}}>УДАЛИТЬ {a.name}?</div>
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
                    <div style={{fontSize:22,fontWeight:700,color:T.txt0,fontFamily:"'Inter',sans-serif",letterSpacing:"1px"}}>{a.name}</div>
                    <div style={{fontSize:12,color:cat.color,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em"}}>{cat.label}</div>
                    {obj && <div style={{fontSize:12,color:T.cyan,marginTop:2}}>📍 {obj.name}</div>}
                  </div>
                </div>
                {/* Key specs */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[
                    {lbl:"Производитель",      val:pp.manufacturer||"—",                                icon:"🏭"},
                    {lbl:"Марка/Модель",        val:pp.model||"—",                                       icon:"🔧"},
                    {lbl:"Год выпуска",         val:pp.year ? `${pp.year} г. (${yr} лет)` : "—",         icon:"📅"},
                    {lbl:"Серийный №",          val:pp.serial||"—",                                      icon:"🔢"},
                    {lbl:"Инвент. №",           val:pp.inventory||"—",                                   icon:"📋"},
                    {lbl:"Гос. номер",          val:pp.reg_plate||"—",                                   icon:"🚗"},
                    {lbl:"Объём двигателя",     val:pp.engine_vol ? `${Number(pp.engine_vol).toLocaleString()} куб.см` : "—", icon:"⚙️"},
                    {lbl:"Год ввода в экспл.",  val:pp.commissioned||"—",                                icon:"🗓"},
                    {lbl:"Норма расхода",       val:pp.fuel_rate ? `${pp.fuel_rate} л/мч` : "—",         icon:"⛽"},
                    {lbl:"Ср. наработка/мес",   val:pp.avg_monthly ? `${Number(pp.avg_monthly).toLocaleString()} мч` : "—", icon:"📈"},
                    {lbl:"Объект",              val:obj?.name||"Не назначен",                            icon:"📍"},
                    {lbl:"Дислокация",          val:pp.location||"—",                                    icon:"🗺"},
                  ].map(({lbl,val,icon})=>(
                    <div key={lbl} style={{padding:"8px 10px",background:T.bg3,borderRadius:5,border:`1px solid ${T.border}`}}>
                      <div style={{fontSize:12,color:T.txt2,textTransform:"uppercase",marginBottom:3}}>{icon} {lbl}</div>
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
              <div style={{fontSize:12,color:T.txt2,textTransform:"uppercase",letterSpacing:".1em",marginBottom:10}}>⏱ Наработка</div>
              <div style={{display:"flex",alignItems:"flex-end",gap:12,marginBottom:12}}>
                <div style={{fontSize:48,fontWeight:700,color:hs.color,fontFamily:"'Inter',sans-serif",lineHeight:1}}>
                  {mh.toLocaleString()}
                </div>
                <div style={{fontSize:16,color:T.txt2,marginBottom:8}}>мч</div>
              </div>
              {/* Progress toward next service — from toSchedule */}
              {nearest && (
                <div style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <div style={{fontSize:12,color:T.txt2}}>
                      До {nearest.name} ({nearest.nextAt.toLocaleString()} мч)
                      {nearest.duration_hrs ? <span style={{marginLeft:6,color:T.violet}}>· {nearest.duration_hrs} ч простоя</span> : ""}
                    </div>
                    <div style={{fontSize:12,fontWeight:700,color:nearest.color}}>
                      {nearest.overdue ? "ПРОСРОЧЕНО" : `${nearest.rem.toLocaleString()} мч`}
                    </div>
                  </div>
                  <div style={{height:8,background:T.border,borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${nearest.pct}%`,background:nearest.color,borderRadius:4,transition:"width 0.6s"}}/>
                  </div>
                  <div style={{fontSize:12,color:T.txt2,marginTop:4}}>{nearest.pct}% до {nearest.name}</div>
                </div>
              )}
              {/* All schedule items as chips */}
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:4}}>
                {schedStatus.map(s=>(
                  <div key={s.name} style={{fontSize:12,padding:"2px 8px",borderRadius:3,
                    background:s.overdue?`#ef444420`:`${s.color}15`,
                    border:`1px solid ${s.overdue?"#ef444450":s.color+"50"}`,
                    color:s.overdue?"#ef4444":s.color,fontWeight:700,
                    title:`${s.name}: каждые ${s.interval} мч`}}>
                    {s.name} {s.overdue ? "⚠" : s.pct >= 90 ? "⚡" : ""}
                    {s.duration_hrs ? ` (${s.duration_hrs}ч)` : ""}
                  </div>
                ))}
              </div>
            </Card>

            {/* Hours log */}
            <Card T={T}>
              <div style={{padding:"10px 14px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:12,fontWeight:700,color:T.txt0,textTransform:"uppercase"}}>📒 История наработки</div>
                <div style={{fontSize:12,color:T.txt2}}>{log.length} записей</div>
              </div>
              {log.length === 0 ? (
                <div style={{padding:"20px 14px",textAlign:"center",fontSize:12,color:T.txt2}}>
                  Наработка пока не накапливалась<br/>
                  <span style={{fontSize:12,opacity:0.7}}>Увеличивается при утверждении отчётов нач. участка</span>
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
                        <div style={{fontSize:12,color:T.txt2}}>{entry.by}</div>
                      </div>
                      <div style={{fontSize:16,fontWeight:700,color:T.green,fontFamily:"'Inter',sans-serif"}}>
                        +{entry.wh} мч
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* ТО секция */}
        <div style={{marginTop:16}}>
          <AssetMaintenanceTab
            nodeId={a.id} nodeName={a.name}
            passport={pp} meters={{ [a.id]: { current: Number(mh) } }}
            maintRecords={maintRecords} setMaintRecords={setMaintRecords}
            setPassports={setPassports}
            user={user} T={T}
          />
        </div>
      </div>
    );
  }
  return (
    <div>
      {/* Delete confirm modal */}
      {deleteConfId && (
        <div style={{position:"fixed",inset:0,background:T.modalBg,zIndex:800,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:T.bg2,border:"1px solid rgba(239,68,68,0.4)",borderRadius:8,maxWidth:360,width:"100%",padding:28,textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:12}}>⚠️</div>
            <div style={{fontSize:15,fontWeight:700,color:T.txt0,fontFamily:"'Inter',sans-serif",marginBottom:8}}>УДАЛИТЬ АКТИВ?</div>
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
              <div style={{fontSize:14,fontWeight:700,color:T.txt0,fontFamily:"'Inter',sans-serif"}}>{assetModal==="add"?"+ ДОБАВИТЬ АКТИВ":"РЕДАКТИРОВАТЬ АКТИВ"}</div>
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
              <div style={{fontSize:14,fontWeight:700,color:T.txt0,fontFamily:"'Inter',sans-serif"}}>{catModal==="add"?"+ КАТЕГОРИЯ":"КАТЕГОРИЯ"}</div>
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
          border:`2px solid ${!selCat?T.red:T.border}`,transition:"all 0.15s",
        }}>
          <div style={{fontSize:22,marginBottom:4}}>📋</div>
          <div style={{fontSize:12,fontWeight:700,color:!selCat?T.red:T.txt0}}>Все активы</div>
          <div style={{fontSize:22,fontWeight:900,color:!selCat?T.red:T.txt1,fontFamily:"'Inter',sans-serif",lineHeight:1,marginTop:4}}>{assets.length}</div>
        </div>
        {cats.map(cat=>{
          const cnt = assets.filter(a=>a.category===cat.key).length;
          const isActive = selCat===cat.key;
          return(
            <div key={cat.key} style={{
              padding:"14px 16px",borderRadius:7,cursor:"pointer",position:"relative",
              background:isActive?`${cat.color}15`:T.bg2,
              border:`2px solid ${isActive?cat.color:T.border}`,transition:"all 0.15s",
            }} onClick={()=>setSelCat(isActive?null:cat.key)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{fontSize:22}}>{cat.icon}</div>
                <div style={{display:"flex",gap:2}}>
                  <button onClick={e=>{e.stopPropagation();openEditCat(cat);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:T.txt2,padding:"2px 3px"}}>✏</button>
                  <button onClick={e=>{e.stopPropagation();deleteCat(cat.key);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#ef4444",padding:"2px 3px"}}>🗑</button>
                </div>
              </div>
              <div style={{fontSize:12,fontWeight:700,color:isActive?cat.color:T.txt0,marginTop:4,lineHeight:1.3}}>{cat.label}</div>
              <div style={{fontSize:24,fontWeight:900,color:cat.color,fontFamily:"'Inter',sans-serif",lineHeight:1,marginTop:4}}>{cnt}</div>
            </div>
          );
        })}
      </div>

      {/* Assets header row */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:700,color:T.txt0,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>
          {activeCat?<span>{activeCat.icon} {activeCat.label}</span>:"Все активы"}
          <span style={{fontSize:12,color:T.txt2,fontFamily:"'Inter',sans-serif",fontWeight:400,marginLeft:8}}>({catAssets.length})</span>
        </div>
        <div style={{fontSize:12,color:T.txt2}}>Нажмите на карточку для просмотра паспорта</div>
      </div>

      {catAssets.length === 0 ? (
        <Card style={{padding:32,textAlign:"center"}} T={T}>
          <div style={{fontSize:32,marginBottom:12}}>🏗</div>
          <div style={{fontSize:13,color:T.txt2}}>Нет активов{selCat?" в этой категории":""}</div>
          <Btn variant="primary" onClick={openAddAsset} T={T} style={{marginTop:14,fontSize:12}}>+ Добавить актив</Btn>
        </Card>
      ) : (
        <>
          {MoveModal}
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
                        <div style={{fontSize:14,fontWeight:700,color:T.txt0,fontFamily:"'Inter',sans-serif"}}>{a.name}</div>
                        <div style={{fontSize:12,color:cat.color,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em"}}>{cat.label}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:2}} onClick={e=>e.stopPropagation()}>
                      <button onClick={e=>openMoveAsset(a,e)} title="Переместить на другой объект"
                        style={{background:`${T.cyan}12`,border:`1px solid ${T.cyan}40`,borderRadius:4,cursor:"pointer",fontSize:12,color:T.cyan,padding:"3px 7px",fontWeight:700}}>↔</button>
                      <button onClick={()=>openEditAsset(a)} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:4,cursor:"pointer",fontSize:12,color:T.txt2,padding:"3px 7px"}}>✏</button>
                      <button onClick={()=>setDeleteConfId(a.id)} style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:4,cursor:"pointer",fontSize:12,color:"#f87171",padding:"3px 7px"}}>🗑</button>
                    </div>
                  </div>

                  {/* Specs row */}
                  {(pp.manufacturer||pp.model||pp.year) && (
                    <div style={{fontSize:12,color:T.txt2,marginBottom:8}}>
                      {[pp.manufacturer,pp.model,pp.year&&`${pp.year}г`].filter(Boolean).join(" · ")}
                    </div>
                  )}

                  {/* Moto hours + status */}
                  {mh > 0 && (
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <div style={{flex:1,height:5,background:T.border,borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${Math.min(100,Math.round(mh/20000*100))}%`,background:hs.c,borderRadius:3}}/>
                      </div>
                      <div style={{fontSize:12,fontWeight:700,color:hs.c,fontFamily:"'Inter',sans-serif",whiteSpace:"nowrap"}}>
                        {mh.toLocaleString()} мч
                      </div>
                      <div style={{fontSize:12,padding:"2px 6px",borderRadius:3,background:`${hs.c}18`,border:`1px solid ${hs.c}40`,color:hs.c,fontWeight:700}}>{hs.l}</div>
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
        </>
      )}
    </div>
  );
}
// Default categories (editable at runtime via assetCategories state in App)


// ─── MECHANIC KTG CALENDAR PAGE ───────────────────────────────────────────────
function MechanicKTGPage({ nodes, objs, mechCats, passports, meters, ktgPlans, setKtgPlans, user, T }) {
  const cats  = mechCats || DEFAULT_MECH_CATS;
  const today = new Date().toISOString().slice(0,10);
  const [selObjId,  setSelObjId]  = useState(objs[0]?.id || null);
  const [yearMonth, setYearMonth] = useState(today.slice(0,7));
  const [toast,     setToast]     = useState(null);
  const [paintHours, setPaintHours] = useState(22);
  const DAY_CAPACITY = 22;

  function showToast(msg, type="ok") {
    setToast({msg,type}); setTimeout(()=>setToast(null),3000);
  }

  const objAssets = nodes.filter(n =>
    n.type==="ASSET" && Number(n.assigned_object_id)===Number(selObjId)
  );
  const plan       = ktgPlans.find(p => p.object_id===selObjId && p.year_month===yearMonth);
  const planStatus = plan?.status || "DRAFT";
  const isLocked   = planStatus==="SUBMITTED" || planStatus==="ACCEPTED";

  const [yr, mo] = yearMonth.split("-").map(Number);
  const daysInMonth = new Date(yr, mo, 0).getDate();
  const days = Array.from({length:daysInMonth},(_,i)=>`${yearMonth}-${String(i+1).padStart(2,"0")}`);

  function getHours(assetId, date) {
    const v = plan?.items?.[assetId]?.[date];
    return (v === undefined || v === null) ? null : Number(v);
  }

  // ── Пересчёт ТО для одного актива поверх текущих items ───────────────────
  function recalcTO(assetId, items, toInfo, colorInfo, pinnedDays) {
    const pinned = pinnedDays || new Set();
    const pp    = passports?.[assetId] || {};
    const sched = (pp.toSchedule && pp.toSchedule.length > 0)
      ? pp.toSchedule
      : [{name:"ТО-250", interval:250, duration_hrs:2, color:"#f59e0b"}];

    if (!items[assetId]) {
      items[assetId] = {};
      days.forEach(d => { items[assetId][d] = DAY_CAPACITY; });
    }

    // Сбрасываем старые ТО-ячейки обратно в 22 (кроме pinnedDays)
    const oldTo = toInfo[assetId] || {};
    Object.keys(oldTo).forEach(d => {
      if (!pinned.has(d)) {
        items[assetId][d] = DAY_CAPACITY;
      }
    });

    const newTo  = {};
    const newClr = {};

    sched.forEach(item => {
      const dur       = item.duration_hrs || 2;
      const workHrsTO = Math.max(0, DAY_CAPACITY - dur);

      let hoursToNext = item.interval - ((parseFloat(meters?.[assetId]?.current ?? pp.total_hours) || 0) % item.interval);
      if (hoursToNext === 0) hoursToNext = item.interval;

      for (let i = 0; i < daysInMonth; i++) {
        const ds = days[i];

        // Уже помечен ТО в этом проходе — пропускаем
        if (newTo[ds]) continue;

        // Зафиксированный пользователем день — накапливаем часы, не трогаем ТО
        if (pinned.has(ds)) {
          hoursToNext -= Number(items[assetId][ds] ?? DAY_CAPACITY);
          continue;
        }

        const h = Number(items[assetId][ds] ?? DAY_CAPACITY);

        if (hoursToNext <= h) {
          // ТО наступает в этот день
          items[assetId][ds] = workHrsTO;
          newTo[ds]  = item.name;
          newClr[ds] = item.color || "#f59e0b";
          hoursToNext = item.interval; // сброс до следующего ТО
        } else {
          hoursToNext -= h;
        }
      }
    });

    toInfo[assetId]    = newTo;
    // Полностью пересоздаём colorInfo для этого актива
    colorInfo[assetId] = newClr;
  }

  // ── Инициализировать план с 22ч + авто-ТО ────────────────────────────────
  function initPlan() {
    if (isLocked || objAssets.length === 0) return;
    const newItems     = {};
    const newToInfo    = {};
    const newColorInfo = {};
    // 1. Все ячейки = 22
    objAssets.forEach(a => {
      newItems[a.id] = {};
      days.forEach(d => { newItems[a.id][d] = DAY_CAPACITY; });
    });
    // 2. Расставить ТО
    objAssets.forEach(a => recalcTO(a.id, newItems, newToInfo, newColorInfo));

    setKtgPlans(prev => {
      const existing = prev.find(p=>p.object_id===selObjId&&p.year_month===yearMonth);
      const base = { id:"kp"+genId(), object_id:selObjId, year_month:yearMonth,
        status:"DRAFT", created_by:user.name, engineer_comment:"",
        submitted_at:null, decided_at:null };
      if (existing) return prev.map(p=>p.object_id===selObjId&&p.year_month===yearMonth
        ? {...p, items:newItems, to_info:newToInfo, color_info:newColorInfo} : p);
      return [...prev, {...base, items:newItems, to_info:newToInfo, color_info:newColorInfo}];
    });
    showToast("План инициализирован: 22ч/день + авто-ТО");
  }

  // ── Применить кисть к ячейке + пересчитать ТО для этого актива ───────────
  function setHours(assetId, date, h) {
    if (isLocked) return;
    const val = Math.max(0, Math.min(DAY_CAPACITY, Math.round(Number(h))));
    setKtgPlans(prev => {
      const existing = prev.find(p=>p.object_id===selObjId&&p.year_month===yearMonth);
      const newItems     = existing ? JSON.parse(JSON.stringify(existing.items||{}))      : {};
      const newToInfo    = existing ? JSON.parse(JSON.stringify(existing.to_info||{}))    : {};
      const newColorInfo = existing ? JSON.parse(JSON.stringify(existing.color_info||{})) : {};

      if (!newItems[assetId]) {
        newItems[assetId] = {};
        days.forEach(d => { newItems[assetId][d] = DAY_CAPACITY; });
      }
      // Ставим значение кисти
      newItems[assetId][date] = val;
      // Пересчитываем ТО; этот день зафиксирован — ТО его не перезапишет
      recalcTO(assetId, newItems, newToInfo, newColorInfo, new Set([date]));

      const base = { id:"kp"+genId(), object_id:selObjId, year_month:yearMonth,
        status:"DRAFT", created_by:user.name, engineer_comment:"",
        submitted_at:null, decided_at:null };
      if (existing) return prev.map(p=>p.object_id===selObjId&&p.year_month===yearMonth
        ? {...p, items:newItems, to_info:newToInfo, color_info:newColorInfo} : p);
      return [...prev, {...base, items:newItems, to_info:newToInfo, color_info:newColorInfo}];
    });
  }

  function fillRow(assetId) {
    if (isLocked) return;
    setKtgPlans(prev => {
      const existing = prev.find(p=>p.object_id===selObjId&&p.year_month===yearMonth);
      const newItems     = existing ? JSON.parse(JSON.stringify(existing.items||{}))      : {};
      const newToInfo    = existing ? JSON.parse(JSON.stringify(existing.to_info||{}))    : {};
      const newColorInfo = existing ? JSON.parse(JSON.stringify(existing.color_info||{})) : {};
      if (!newItems[assetId]) newItems[assetId] = {};
      days.forEach(d => { newItems[assetId][d] = paintHours; });
      // Сброс ТО-меток строки
      newToInfo[assetId]    = {};
      if (newColorInfo[assetId]) {
        days.forEach(d => delete newColorInfo[assetId][d]);
      }
      // Пересчёт ТО
      recalcTO(assetId, newItems, newToInfo, newColorInfo);
      const base = { id:"kp"+genId(), object_id:selObjId, year_month:yearMonth,
        status:"DRAFT", created_by:user.name, engineer_comment:"",
        submitted_at:null, decided_at:null };
      if (existing) return prev.map(p=>p.object_id===selObjId&&p.year_month===yearMonth
        ? {...p, items:newItems, to_info:newToInfo, color_info:newColorInfo} : p);
      return [...prev, {...base, items:newItems, to_info:newToInfo, color_info:newColorInfo}];
    });
  }

  function fillCol(date) {
    if (isLocked) return;
    setKtgPlans(prev => {
      const existing = prev.find(p=>p.object_id===selObjId&&p.year_month===yearMonth);
      const newItems     = existing ? JSON.parse(JSON.stringify(existing.items||{}))      : {};
      const newToInfo    = existing ? JSON.parse(JSON.stringify(existing.to_info||{}))    : {};
      const newColorInfo = existing ? JSON.parse(JSON.stringify(existing.color_info||{})) : {};
      objAssets.forEach(a => {
        if (!newItems[a.id]) {
          newItems[a.id] = {};
          days.forEach(d => { newItems[a.id][d] = DAY_CAPACITY; });
        }
        newItems[a.id][date] = paintHours;
        if (newToInfo[a.id])    delete newToInfo[a.id][date];
        if (newColorInfo[a.id]) delete newColorInfo[a.id][date];
        recalcTO(a.id, newItems, newToInfo, newColorInfo);
      });
      const base = { id:"kp"+genId(), object_id:selObjId, year_month:yearMonth,
        status:"DRAFT", created_by:user.name, engineer_comment:"",
        submitted_at:null, decided_at:null };
      if (existing) return prev.map(p=>p.object_id===selObjId&&p.year_month===yearMonth
        ? {...p, items:newItems, to_info:newToInfo, color_info:newColorInfo} : p);
      return [...prev, {...base, items:newItems, to_info:newToInfo, color_info:newColorInfo}];
    });
  }

  function cellCfg(h, toName) {
    if (h === null)         return { bg:"transparent",            color:"#5a7499", label:"Не задан",       icon:null,  textColor:"#5a7499" };
    if (h === 0 && toName)  return { bg:"rgba(245,158,11,0.18)",  color:"#f59e0b", label:`${toName}`,       icon:"🔧",  textColor:"#fbbf24" };
    if (h === 0)            return { bg:"rgba(239,68,68,0.18)",   color:"#ef4444", label:"Простой 0ч",     icon:"🛠",  textColor:"#f87171" };
    if (toName)             return { bg:"rgba(245,158,11,0.15)",  color:"#f59e0b", label:`${toName}: ${h}ч`,icon:"🔧", textColor:"#fbbf24" };
    if (h === DAY_CAPACITY) return { bg:"rgba(99,120,160,0.12)",  color:"#6378a0", label:`${h}ч`,          icon:null,  textColor:"#8899bb" };
    const pct = h / DAY_CAPACITY;
    if (pct >= 0.8) return { bg:"rgba(99,120,160,0.10)",  color:"#6378a0", label:`${h}ч`, icon:null, textColor:"#8899bb" };
    if (pct >= 0.5) return { bg:"rgba(245,158,11,0.15)",  color:"#f59e0b", label:`${h}ч`, icon:"🔧", textColor:"#fbbf24" };
    return               { bg:"rgba(239,68,68,0.12)",    color:"#f97316", label:`${h}ч`, icon:"🔧", textColor:"#fb923c" };
  }

  function ktgForDay(date) {
    if (!plan || objAssets.length===0) return null;
    const setA = objAssets.filter(a=>getHours(a.id,date)!==null);
    if (!setA.length) return null;
    const total = setA.reduce((s,a)=>s+getHours(a.id,date),0);
    return Math.round(total / (setA.length * DAY_CAPACITY) * 100);
  }
  function ktgForAsset(assetId) {
    const setD = days.filter(d=>getHours(assetId,d)!==null);
    if (!setD.length) return null;
    const total = setD.reduce((s,d)=>s+getHours(assetId,d),0);
    return Math.round(total / (setD.length * DAY_CAPACITY) * 100);
  }
  const avgKtg = (() => {
    const vals = days.map(d=>ktgForDay(d)).filter(v=>v!==null);
    return vals.length ? Math.round(vals.reduce((s,v)=>s+v,0)/vals.length) : null;
  })();

  // ── Кисть: настраиваемые пресеты ─────────────────────────────────────────
  const toTypes = [...new Map(
    objAssets.flatMap(a=>(passports?.[a.id]?.toSchedule||[]).map(s=>[s.name,s]))
  ).values()];
  const defaultPresets = useMemo(()=>[
    { id:"p_full", label:"Полный день", hours:22, color:"#6378a0", icon:"🔵", locked:true  },
    ...toTypes.map((s,i)=>{
      const dur=s.duration_hrs||2;
      const work=Math.max(0, DAY_CAPACITY-dur);
      return { id:`p_to_${i}`, label:s.name, hours:work, color:"#f59e0b", icon:"🔧", locked:false };
    }),
    { id:"p_stop", label:"Простой",    hours:0,  color:"#ef4444", icon:"🛠", locked:true  },
  ], [selObjId]);
  const [brushPresets,   setBrushPresets]   = useState(defaultPresets);
  const [showBrushEdit,  setShowBrushEdit]  = useState(false);
  const [editPresets,    setEditPresets]    = useState(defaultPresets);
  function openBrushEdit()  { setEditPresets(brushPresets.map(p=>({...p}))); setShowBrushEdit(true); }
  function saveBrushEdit()  { setBrushPresets(editPresets.filter(p=>p.label.trim()&&p.hours>=0&&p.hours<=22)); setShowBrushEdit(false); }
  function updateEP(id,k,v) { setEditPresets(prev=>prev.map(p=>p.id===id?{...p,[k]:v}:p)); }
  function removeEP(id)     { setEditPresets(prev=>prev.filter(p=>p.id!==id||p.locked)); }
  function addEP()          { setEditPresets(prev=>[...prev,{id:"p_"+genId(),label:"",hours:22,color:"#10b981",icon:"🔧",locked:false}]); }

  // Заполнить всё выбранным значением + пересчёт ТО
  function fillAll() {
    if (isLocked) return;
    setKtgPlans(prev => {
      const existing = prev.find(p=>p.object_id===selObjId&&p.year_month===yearMonth);
      const newItems     = existing ? JSON.parse(JSON.stringify(existing.items||{}))      : {};
      const newToInfo    = existing ? JSON.parse(JSON.stringify(existing.to_info||{}))    : {};
      const newColorInfo = existing ? JSON.parse(JSON.stringify(existing.color_info||{})) : {};
      objAssets.forEach(a => {
        newItems[a.id]  = {};
        newToInfo[a.id] = {};
        if (newColorInfo[a.id]) days.forEach(d=>delete newColorInfo[a.id][d]);
        days.forEach(d => { newItems[a.id][d] = paintHours; });
        recalcTO(a.id, newItems, newToInfo, newColorInfo);
      });
      const base = {id:"kp"+genId(),object_id:selObjId,year_month:yearMonth,status:"DRAFT",created_by:user.name,engineer_comment:"",submitted_at:null,decided_at:null};
      if (existing) return prev.map(p=>p.object_id===selObjId&&p.year_month===yearMonth?{...p,items:newItems,to_info:newToInfo,color_info:newColorInfo}:p);
      return [...prev,{...base,items:newItems,to_info:newToInfo,color_info:newColorInfo}];
    });
    showToast(`Заполнено ${paintHours}ч + ТО пересчитано`);
  }

  const [confirmModal, setConfirmModal] = useState(false);

  function saveDraft() {
    const base = {id:"kp"+genId(),object_id:selObjId,year_month:yearMonth,status:"DRAFT",created_by:user.name,engineer_comment:"",submitted_at:null,decided_at:null,items:{},to_info:{}};
    if (!plan) setKtgPlans(prev=>[...prev, base]);
    const savePlan = plan || base;
    saveKtgPlanToDB(savePlan).catch(e=>console.warn("KTG draft save error:", e.message));
    showToast("Черновик сохранён");
  }
  function openSubmitConfirm() {
    if (!objAssets.length){showToast("Нет техники","err");return;}
    if (!plan){showToast("Сначала заполните план","err");return;}
    setConfirmModal(true);
  }
  function confirmSubmit() {
    setKtgPlans(prev=>prev.map(p=>p.object_id===selObjId&&p.year_month===yearMonth?{...p,status:"SUBMITTED",submitted_at:new Date().toISOString()}:p));
    // Сохраняем в БД
    const curPlan = (window.__ktgPlansRef||[]).find(p=>p.object_id===selObjId&&p.year_month===yearMonth);
    if (curPlan) {
      saveKtgPlanToDB({...curPlan, status:"SUBMITTED"})
        .catch(e=>console.warn("KTG save error:", e.message));
    }
    setConfirmModal(false);
    showToast("КТГ-план отправлен инженеру!");
  }

  const MON_RU=["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  const monthLabel=`${MON_RU[mo-1]} ${yr}`;
  const stepLabels={DRAFT:"Черновик",SUBMITTED:"На проверке",ACCEPTED:"Принят",RETURNED:"Возвращён"};

  return (
    <div>
      {confirmModal&&(()=>{
        const totalWH = objAssets.reduce((s,a)=>s+days.reduce((ss,d)=>ss+(getHours(a.id,d)||0),0),0);
        const maxWH   = objAssets.length*daysInMonth*DAY_CAPACITY;
        const planKtg = maxWH>0?Math.round(totalWH/maxWH*100):0;
        const toCount = Object.values(plan?.to_info||{}).reduce((s,v)=>s+Object.keys(v).length,0);
        const setDays = [...new Set(days.filter(d=>objAssets.some(a=>getHours(a.id,d)!==null)))].length;
        return(
          <div style={{position:"fixed",inset:0,background:T.modalBg,zIndex:800,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderLeft:`4px solid ${T.green}`,borderRadius:8,width:"100%",maxWidth:420,padding:28}}>
              <div style={{fontSize:15,fontWeight:700,color:T.txt0,marginBottom:4}}>📤 Отправить КТГ-план?</div>
              <div style={{fontSize:12,color:T.txt2,marginBottom:20}}>После отправки план нельзя редактировать до возврата инженером.</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
                {[["Объект",objs.find(o=>o.id===selObjId)?.name||"—"],["Период",monthLabel],["Техника",`${objAssets.length} ед.`],["Ср. КТГ план",`${planKtg}%`],["Заполнено дней",`${setDays} / ${daysInMonth}`],["ТО по расписанию",toCount?`${toCount} ячеек`:"—"]].map(([l,v])=>(
                  <div key={l} style={{padding:"8px 12px",background:T.bg3,borderRadius:5,border:`1px solid ${T.border}`}}>
                    <div style={{fontSize:12,color:T.txt2,marginBottom:2}}>{l}</div>
                    <div style={{fontSize:13,fontWeight:700,color:T.txt0}}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:10}}>
                <Btn variant="success" style={{flex:1,padding:"11px"}} onClick={confirmSubmit} T={T}>✓ Подтвердить</Btn>
                <Btn variant="ghost" style={{padding:"11px 16px"}} onClick={()=>setConfirmModal(false)} T={T}>Отмена</Btn>
              </div>
            </div>
          </div>
        );
      })()}

      {toast&&<div style={{position:"fixed",top:70,right:24,zIndex:900,padding:"12px 20px",borderRadius:6,background:toast.type==="err"?"rgba(239,68,68,0.95)":"rgba(16,185,129,0.95)",color:"#fff",fontSize:13,fontWeight:700,boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>{toast.msg}</div>}

      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
        <div style={{background:T.green,color:"#fff",padding:"4px 12px",borderRadius:3,fontSize:12,fontWeight:700,textTransform:"uppercase"}}>МЕХАНИК — КТГ</div>
        <div style={{fontSize:12,color:T.txt2}}>Планирование рабочих часов — {DAY_CAPACITY}ч/день</div>
      </div>

      <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:18,padding:"8px 14px",background:T.bg2,borderRadius:6,border:`1px solid ${T.border}`,flexWrap:"wrap"}}>
        {["DRAFT","SUBMITTED","ACCEPTED","RETURNED"].map((s,i)=>{
          const isCur=planStatus===s; const cfg=KTG_PLAN_STATUS[s];
          return(<div key={s} style={{display:"flex",alignItems:"center",gap:4}}>{i>0&&<span style={{color:T.txt2,fontSize:12}}>→</span>}<span style={{padding:"3px 10px",borderRadius:3,fontSize:12,fontWeight:700,background:isCur?cfg.bg:"transparent",border:`1px solid ${isCur?cfg.border:T.border}`,color:isCur?cfg.color:T.txt2}}>{stepLabels[s]}</span></div>);
        })}
        <div style={{marginLeft:"auto"}}>{plan&&<KTGPlanBadge status={planStatus}/>}</div>
      </div>

      <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap",alignItems:"flex-end"}}>
        <FieldSelect label="Объект" value={selObjId||""} onChange={e=>setSelObjId(Number(e.target.value))} T={T} style={{minWidth:160}}>
          {objs.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
        </FieldSelect>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          <label style={{fontSize:12,fontWeight:600,color:T.txt2,textTransform:"uppercase",letterSpacing:".08em"}}>Месяц</label>
          <input type="month" value={yearMonth} onChange={e=>setYearMonth(e.target.value)} disabled={isLocked}
            style={{padding:"9px 12px",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:4,color:T.txt0,fontSize:13,fontFamily:"'Inter',sans-serif",outline:"none"}}/>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"flex-end"}}>
          {!isLocked&&<><Btn variant="secondary" onClick={saveDraft} T={T} style={{fontSize:12}}>Сохранить</Btn><Btn variant="primary" onClick={openSubmitConfirm} T={T} style={{fontSize:12}}>📤 Отправить →</Btn></>}
        </div>
      </div>

      {planStatus==="RETURNED"&&plan?.engineer_comment&&(
        <div style={{marginBottom:14,padding:"12px 16px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:6}}>
          <div style={{fontSize:12,fontWeight:700,color:"#f87171",marginBottom:4}}>↩ Возвращён инженером:</div>
          <div style={{fontSize:13,color:T.txt1,marginBottom:10}}>{plan.engineer_comment}</div>
          <Btn variant="secondary" onClick={()=>setKtgPlans(prev=>prev.map(p=>p.id===plan.id?{...p,status:"DRAFT",engineer_comment:""}:p))} T={T} style={{fontSize:12}}>✏ Исправить и переотправить</Btn>
        </div>
      )}

      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <Card accent={T.green} style={{padding:"12px 16px",minWidth:130}} T={T}>
          <div style={{fontSize:12,color:T.txt2,textTransform:"uppercase",marginBottom:4}}>⚙ КТГ план</div>
          <div style={{fontSize:28,fontWeight:700,color:avgKtg===null?"#5a7499":avgKtg>=85?T.green:avgKtg>=70?T.amber:"#ef4444",fontFamily:"'Inter',sans-serif",lineHeight:1}}>{avgKtg!==null?`${avgKtg}%`:"—"}</div>
          <div style={{fontSize:12,color:T.txt2,marginTop:2}}>по заполненным дням</div>
        </Card>
        <Card style={{padding:"12px 16px",minWidth:100}} T={T}>
          <div style={{fontSize:12,color:T.txt2,textTransform:"uppercase",marginBottom:4}}>🏗 Техника</div>
          <div style={{fontSize:28,fontWeight:700,color:T.txt0,fontFamily:"'Inter',sans-serif",lineHeight:1}}>{objAssets.length}</div>
        </Card>
        <Card style={{padding:"12px 16px",minWidth:100}} T={T}>
          <div style={{fontSize:12,color:T.txt2,textTransform:"uppercase",marginBottom:4}}>⏱ Часов/день</div>
          <div style={{fontSize:28,fontWeight:700,color:T.cyan,fontFamily:"'Inter',sans-serif",lineHeight:1}}>{DAY_CAPACITY}</div>
        </Card>
        <Card style={{padding:"12px 16px",minWidth:110}} T={T}>
          <div style={{fontSize:12,color:T.txt2,textTransform:"uppercase",marginBottom:4}}>📅 Период</div>
          <div style={{fontSize:18,fontWeight:700,color:T.txt0,fontFamily:"'Inter',sans-serif",lineHeight:1.2}}>{monthLabel}</div>
        </Card>
      </div>

      {/* ── Brush edit modal ── */}
      {showBrushEdit&&(
        <div style={{position:"fixed",inset:0,background:T.modalBg,zIndex:800,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderLeft:`4px solid ${T.cyan}`,borderRadius:8,width:"100%",maxWidth:500,padding:24,maxHeight:"80vh",overflowY:"auto"}}>
            <div style={{fontSize:15,fontWeight:700,color:T.txt0,marginBottom:4}}>🎨 Настройка кисти</div>
            <div style={{fontSize:12,color:T.txt2,marginBottom:18}}>Задайте пресеты — метки и количество рабочих часов (0–22)</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 60px 36px 36px 32px",gap:8,marginBottom:6}}>
              {["Название","Часы","Иконка","Цвет",""].map(h=>(
                <div key={h} style={{fontSize:12,fontWeight:700,color:T.txt2,textTransform:"uppercase"}}>{h}</div>
              ))}
            </div>
            {editPresets.map(p=>{
              const iS={width:"100%",padding:"7px 10px",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:4,color:T.txt0,fontSize:13,fontFamily:"'Inter',sans-serif",boxSizing:"border-box"};
              return(
                <div key={p.id} style={{display:"grid",gridTemplateColumns:"1fr 60px 36px 36px 32px",gap:8,marginBottom:8,alignItems:"center"}}>
                  <input value={p.label} onChange={e=>updateEP(p.id,"label",e.target.value)} placeholder="Название" style={iS} disabled={p.locked}/>
                  <input type="number" min="0" max="22" value={p.hours} onChange={e=>updateEP(p.id,"hours",Math.max(0,Math.min(22,Number(e.target.value))))} style={{...iS,textAlign:"center"}}/>
                  <select value={p.icon} onChange={e=>updateEP(p.id,"icon",e.target.value)} style={{...iS,padding:"7px 4px",textAlign:"center"}}>
                    {["🔵","✅","🔧","🛠","📦","⚙","🔩","⏸","🚫","🟢","🟡","🔴"].map(ic=><option key={ic} value={ic}>{ic}</option>)}
                  </select>
                  <div style={{position:"relative",width:36,height:34}}>
                    <input type="color" value={p.color||"#6378a0"} onChange={e=>updateEP(p.id,"color",e.target.value)} disabled={p.locked}
                      style={{position:"absolute",inset:0,width:"100%",height:"100%",padding:2,border:`1px solid ${T.border}`,borderRadius:4,cursor:p.locked?"default":"pointer",background:T.inputBg,opacity:p.locked?0.4:1}}/>
                  </div>
                  {p.locked
                    ? <div style={{width:32}}/>
                    : <button onClick={()=>removeEP(p.id)} style={{width:32,height:34,background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:4,color:"#f87171",cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>}
                </div>
              );
            })}
            <Btn variant="ghost" onClick={addEP} T={T} style={{fontSize:12,marginBottom:16}}>+ Добавить пресет</Btn>
            <div style={{display:"flex",gap:10}}>
              <Btn variant="primary" onClick={saveBrushEdit} T={T} style={{flex:1}}>✓ Сохранить</Btn>
              <Btn variant="ghost" onClick={()=>setShowBrushEdit(false)} T={T}>Отмена</Btn>
            </div>
          </div>
        </div>
      )}

      {!isLocked&&(
        <div style={{marginBottom:14,padding:"14px 16px",background:T.bg2,borderRadius:6,border:`1px solid ${T.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap"}}>
            <div style={{fontSize:12,fontWeight:700,color:T.txt2,textTransform:"uppercase"}}>⚡ Кисть</div>
            <div style={{fontSize:12,color:T.txt2}}>— нажмите ячейку или заголовок строки/столбца</div>
            <div style={{marginLeft:"auto",display:"flex",gap:6,flexWrap:"wrap"}}>
              <button onClick={openBrushEdit} style={{padding:"5px 12px",borderRadius:5,cursor:"pointer",fontSize:12,fontWeight:700,background:"transparent",border:`1px solid ${T.cyan}`,color:T.cyan,fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",gap:4}}>🎨 Настроить</button>
              <button onClick={fillAll} style={{padding:"5px 12px",borderRadius:5,cursor:"pointer",fontSize:12,fontWeight:700,background:"rgba(99,120,160,0.12)",border:`1px solid rgba(99,120,160,0.4)`,color:"#8899bb",fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",gap:4}}>▦ Заполнить всё</button>
              <button onClick={initPlan} style={{padding:"5px 14px",borderRadius:5,cursor:"pointer",fontSize:12,fontWeight:700,background:"rgba(16,185,129,0.12)",border:`1px solid rgba(16,185,129,0.5)`,color:T.green,fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",gap:5}}>🗓 Инициализировать</button>
            </div>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
            {brushPresets.map(p=>{
              const active=paintHours===p.hours;
              return(
                <button key={p.id} onClick={()=>setPaintHours(p.hours)}
                  style={{padding:"6px 12px",borderRadius:5,cursor:"pointer",fontSize:12,fontWeight:700,
                    background:active?`${p.color}25`:"transparent",border:`2px solid ${active?p.color:T.border}`,
                    color:active?p.color:T.txt1,fontFamily:"'Inter',sans-serif",transition:"all 0.1s",display:"flex",alignItems:"center",gap:5}}>
                  <span>{p.icon}</span><span>{p.label}</span>
                  <span style={{fontSize:12,opacity:.7,fontWeight:400}}>{p.hours}ч</span>
                </button>
              );
            })}
            <div style={{display:"flex",alignItems:"center",gap:5,marginLeft:4,padding:"4px 10px",background:T.bg3,borderRadius:5,border:`1px solid ${T.border}`}}>
              <span style={{fontSize:12,color:T.txt2}}>Custom:</span>
              <input type="number" min="0" max="22" value={paintHours}
                onChange={e=>setPaintHours(Math.max(0,Math.min(22,Number(e.target.value))))}
                style={{width:44,padding:"3px 6px",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:4,color:T.txt0,fontSize:13,fontFamily:"'Inter',sans-serif",textAlign:"center"}}/>
              <span style={{fontSize:12,color:T.txt2}}>ч</span>
            </div>
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
        <Card T={T} style={{padding:0}}>
          <div style={{padding:"10px 14px",borderBottom:`1px solid ${T.border}`,display:"flex",gap:14,flexWrap:"wrap",alignItems:"center"}}>
            {[{h:22,label:"Полный день (22ч)",color:"#10b981"},{h:18,label:"ТО лёгкое (−4ч)",color:"#34d399"},{h:14,label:"ТО среднее (−8ч)",color:"#fbbf24"},{h:0,label:"Простой",color:"#ef4444"},{h:null,label:"Не задан",color:"#5a7499"}].map(({h,label,color})=>(
              <span key={label} style={{display:"flex",alignItems:"center",gap:5,fontSize:12}}>
                <span style={{width:14,height:14,borderRadius:3,background:cellCfg(h).bg,border:`1px solid ${color}60`,display:"inline-block"}}/>
                <span style={{color:T.txt2}}>{label}</span>
              </span>
            ))}
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:Math.max(700,daysInMonth*36+220)}}>
              <thead>
                <tr style={{background:T.bg3}}>
                  <th style={{padding:"8px 12px",textAlign:"left",fontSize:12,fontWeight:700,color:T.txt2,textTransform:"uppercase",borderBottom:`1px solid ${T.border}`,minWidth:160,position:"sticky",left:0,background:T.bg3,zIndex:2}}>Актив</th>
                  {days.map(d=>{
                    const dayNum=parseInt(d.slice(8),10);
                    const dow=new Date(d).getDay();
                    const isWe=dow===0||dow===6;
                    const ktgV=ktgForDay(d);
                    return(
                      <th key={d} style={{padding:"2px 1px",textAlign:"center",fontSize:12,borderBottom:`1px solid ${T.border}`,minWidth:34,background:T.bg3}}>
                        <div style={{color:isWe?T.amber:T.txt2,fontWeight:700,fontSize:12,cursor:isLocked?"default":"pointer",padding:"2px 0",borderRadius:3}}
                          onClick={()=>fillCol(d)} title={isLocked?"":"Заполнить весь столбец"}>{dayNum}</div>
                        {ktgV!==null&&<div style={{fontSize:12,fontWeight:700,color:ktgV>=85?T.green:ktgV>=70?T.amber:"#ef4444"}}>{ktgV}%</div>}
                      </th>
                    );
                  })}
                  <th style={{padding:"8px 6px",textAlign:"center",fontSize:12,fontWeight:700,color:T.green,borderBottom:`1px solid ${T.border}`,minWidth:52,whiteSpace:"nowrap"}}>КТГ</th>
                  <th style={{padding:"8px 4px",textAlign:"center",fontSize:12,fontWeight:700,color:T.txt2,borderBottom:`1px solid ${T.border}`,minWidth:36,whiteSpace:"nowrap"}}>ч/д</th>
                </tr>
              </thead>
              <tbody>
                {objAssets.map((asset,ai)=>{
                  const cat   = cats.find(c=>{const pp=passports?.[asset.id];return pp&&pp.assetClass===c.key;})||{color:T.txt2};
                  const assetK= ktgForAsset(asset.id);
                  const setD  = days.filter(d=>getHours(asset.id,d)!==null);
                  const avgH  = setD.length ? Math.round(setD.reduce((s,d)=>s+getHours(asset.id,d),0)/setD.length*10)/10 : null;
                  return(
                    <tr key={asset.id} style={{background:ai%2?T.rowAlt:"transparent"}}>
                      <td style={{padding:"5px 12px",fontWeight:700,color:T.txt0,fontSize:12,position:"sticky",left:0,background:ai%2?T.rowAlt:T.bg2,zIndex:1,borderRight:`1px solid ${T.border}`,cursor:isLocked?"default":"pointer"}}
                        onClick={()=>fillRow(asset.id)} title={isLocked?"":"Заполнить всю строку"}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div style={{width:4,height:28,borderRadius:2,background:cat.color||T.red,flexShrink:0}}/>
                          {asset.name}
                          {!isLocked&&<span style={{fontSize:12,color:T.txt2,marginLeft:"auto"}}>→</span>}
                        </div>
                      </td>
                      {days.map(d=>{
                        const h      = getHours(asset.id,d);
                        const toName   = plan?.to_info?.[asset.id]?.[d]||null;
                        const cellClr  = plan?.color_info?.[asset.id]?.[d]||null;
                        const baseCfg  = cellCfg(h, toName);
                        const cfg      = cellClr ? {...baseCfg, bg:`${cellClr}22`, color:cellClr, textColor:cellClr} : baseCfg;
                        return(
                          <td key={d} style={{padding:"2px 1px",textAlign:"center"}}>
                            <div onClick={()=>!isLocked&&setHours(asset.id,d,paintHours)}
                              title={toName?`${toName}: ${h}ч работы`:cfg.label}
                              style={{width:30,height:28,borderRadius:4,margin:"0 auto",background:cfg.bg,border:`1px solid ${cfg.color}60`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:isLocked?"default":"pointer",transition:"background 0.08s",gap:0}}>
                              {h===null?(
                                <span style={{fontSize:12,color:"#5a7499"}}>·</span>
                              ):(
                                <>
                                  {cfg.icon&&<span style={{fontSize:12,lineHeight:1}}>{cfg.icon}</span>}
                                  <span style={{fontSize:12,fontWeight:700,color:cfg.textColor,lineHeight:1}}>{toName||h}</span>
                                </>
                              )}
                            </div>
                          </td>
                        );
                      })}
                      <td style={{padding:"5px 6px",textAlign:"center",fontWeight:700,fontSize:13,color:assetK===null?"#5a7499":assetK>=85?"#8899bb":assetK>=70?T.amber:"#ef4444",fontFamily:"'Inter',sans-serif"}}>{assetK!==null?`${assetK}%`:"—"}</td>
                      <td style={{padding:"5px 4px",textAlign:"center",fontSize:12,color:T.txt2,fontFamily:"'Inter',sans-serif"}}>{avgH!==null?avgH:"—"}</td>
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

// ─── MECHANIC KTG FACT PAGE ───────────────────────────────────────────────────
// Факт КТГ считается по утверждённым сменным отчётам форманов.
// КТГ станка за день = wh / (wh + dh) × 100% (суммируем все смены дня)
// КТГ объекта за день = среднее по станкам у которых есть данные
function MechanicKTGFactPage({ nodes, objs, reps, rigs, passports, T }) {
  const today = new Date().toISOString().slice(0,10);
  const [selObjId,  setSelObjId]  = useState(objs[0]?.id || null);
  const [yearMonth, setYearMonth] = useState(today.slice(0,7));

  const [yr, mo] = yearMonth.split("-").map(Number);
  const daysInMonth = new Date(yr, mo, 0).getDate();
  const days = Array.from({length:daysInMonth}, (_,i) => `${yearMonth}-${String(i+1).padStart(2,"0")}`);
  const MON_RU = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];

  // Буровые на объекте (через INIT_RIGS → node)
  const objRigs = rigs.filter(r => Number(r.o) === Number(selObjId));

  // Утверждённые отчёты по объекту за выбранный месяц
  const monthReps = reps.filter(r =>
    r.status === "approved" &&
    Number(r.oid) === Number(selObjId) &&
    r.date?.startsWith(yearMonth)
  );

  // Для каждого станка и каждого дня считаем КТГ
  // Матчинг: rig.n (из INIT_RIGS) === rep.rigs[i].n (имя в отчёте)
  function getRigDayKtg(rigName, date) {
    const dayReps = monthReps.filter(r => r.date === date);
    if (dayReps.length === 0) return null;
    let totalWh = 0, totalDh = 0, found = false;
    dayReps.forEach(rep => {
      const rigEntry = (rep.rigs || []).find(r => r.n === rigName);
      if (rigEntry) {
        totalWh += parseFloat(rigEntry.wh) || 0;
        totalDh += parseFloat(rigEntry.dh) || 0;
        found = true;
      }
    });
    if (!found) return null;
    const total = totalWh + totalDh;
    return total > 0 ? Math.round(totalWh / total * 100) : null;
  }

  // КТГ объекта за день = среднее по станкам у которых есть данные
  function getObjDayKtg(date) {
    const vals = objRigs.map(r => getRigDayKtg(r.n, date)).filter(v => v !== null);
    if (vals.length === 0) return null;
    return Math.round(vals.reduce((s,v) => s+v, 0) / vals.length);
  }

  // Средний КТГ за месяц
  const monthVals = days.map(d => getObjDayKtg(d)).filter(v => v !== null);
  const monthAvg  = monthVals.length ? Math.round(monthVals.reduce((s,v)=>s+v,0)/monthVals.length) : null;

  function ktgColor(v) {
    if (v === null) return T.txt2;
    if (v >= 85) return T.green;
    if (v >= 70) return T.amber;
    return "#ef4444";
  }
  function ktgBg(v) {
    if (v === null) return "transparent";
    if (v >= 85) return "rgba(16,185,129,0.15)";
    if (v >= 70) return "rgba(245,158,11,0.15)";
    return "rgba(239,68,68,0.15)";
  }

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
        <div style={{background:T.cyan,color:"#fff",padding:"4px 12px",borderRadius:3,fontSize:12,fontWeight:700,textTransform:"uppercase"}}>МЕХАНИК — ФАКТ КТГ</div>
        <div style={{fontSize:12,color:T.txt2}}>Из утверждённых сменных отчётов. КТГ = wh / (wh + dh)</div>
      </div>

      {/* Controls */}
      <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap",alignItems:"flex-end"}}>
        <FieldSelect label="Объект" value={selObjId||""} onChange={e=>setSelObjId(Number(e.target.value))} T={T} style={{minWidth:160}}>
          {objs.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
        </FieldSelect>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          <label style={{fontSize:12,fontWeight:600,color:T.txt2,textTransform:"uppercase",letterSpacing:".08em"}}>Месяц</label>
          <input type="month" value={yearMonth} onChange={e=>setYearMonth(e.target.value)}
            style={{padding:"9px 12px",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:4,color:T.txt0,fontSize:13,fontFamily:"'Inter',sans-serif",outline:"none"}}/>
        </div>
      </div>

      {/* Summary */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <Card accent={T.cyan} style={{padding:"12px 16px",minWidth:140}} T={T}>
          <div style={{fontSize:12,color:T.txt2,textTransform:"uppercase",marginBottom:4}}>⚙ КТГ факт (мес)</div>
          <div style={{fontSize:28,fontWeight:700,fontFamily:"'Inter',sans-serif",lineHeight:1,color:ktgColor(monthAvg)}}>
            {monthAvg !== null ? `${monthAvg}%` : "—"}
          </div>
        </Card>
        <Card style={{padding:"12px 16px",minWidth:130}} T={T}>
          <div style={{fontSize:12,color:T.txt2,textTransform:"uppercase",marginBottom:4}}>📋 Отчётов</div>
          <div style={{fontSize:28,fontWeight:700,color:T.txt0,fontFamily:"'Inter',sans-serif",lineHeight:1}}>{monthReps.length}</div>
        </Card>
        <Card style={{padding:"12px 16px",minWidth:130}} T={T}>
          <div style={{fontSize:12,color:T.txt2,textTransform:"uppercase",marginBottom:4}}>🏗 Буровых</div>
          <div style={{fontSize:28,fontWeight:700,color:T.txt0,fontFamily:"'Inter',sans-serif",lineHeight:1}}>{objRigs.length}</div>
        </Card>
        <Card style={{padding:"12px 16px",minWidth:130}} T={T}>
          <div style={{fontSize:12,color:T.txt2,textTransform:"uppercase",marginBottom:4}}>📅 Дней с данными</div>
          <div style={{fontSize:28,fontWeight:700,color:T.txt0,fontFamily:"'Inter',sans-serif",lineHeight:1}}>{monthVals.length}</div>
        </Card>
      </div>

      {objRigs.length === 0 ? (
        <Card style={{padding:32,textAlign:"center"}} T={T}>
          <div style={{fontSize:32,marginBottom:12}}>📋</div>
          <div style={{fontSize:14,color:T.txt2}}>Нет буровых станков на объекте <b style={{color:T.txt0}}>{objs.find(o=>o.id===selObjId)?.name}</b></div>
        </Card>
      ) : monthReps.length === 0 ? (
        <Card style={{padding:32,textAlign:"center"}} T={T}>
          <div style={{fontSize:32,marginBottom:12}}>📭</div>
          <div style={{fontSize:14,color:T.txt2,marginBottom:6}}>Нет утверждённых отчётов за <b style={{color:T.txt0}}>{MON_RU[mo-1]} {yr}</b></div>
          <div style={{fontSize:12,color:T.txt2}}>Факт КТГ формируется из сменных отчётов начальников вахты</div>
        </Card>
      ) : (
        <Card T={T} style={{overflowX:"auto"}}>
          {/* Legend */}
          <div style={{padding:"10px 14px",borderBottom:`1px solid ${T.border}`,display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>
            {[["≥85% — норма",T.green],["70–84% — внимание",T.amber],["<70% — нарушение","#ef4444"],["— нет данных",T.txt2]]
              .map(([l,c])=>(
                <span key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:12}}>
                  <span style={{width:10,height:10,borderRadius:2,background:c,display:"inline-block"}}/>
                  <span style={{color:T.txt2}}>{l}</span>
                </span>
              ))}
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:Math.max(700,daysInMonth*36+200)}}>
              <thead>
                <tr style={{background:T.bg3}}>
                  <th style={{padding:"8px 12px",textAlign:"left",fontSize:12,fontWeight:700,color:T.txt2,
                    textTransform:"uppercase",borderBottom:`1px solid ${T.border}`,minWidth:160,
                    position:"sticky",left:0,background:T.bg3,zIndex:2}}>
                    Станок
                  </th>
                  {days.map(d=>{
                    const dayNum = parseInt(d.slice(8),10);
                    const dow    = new Date(d).getDay();
                    const isWe   = dow===0||dow===6;
                    const objV   = getObjDayKtg(d);
                    return (
                      <th key={d} style={{padding:"2px 1px",textAlign:"center",fontSize:12,borderBottom:`1px solid ${T.border}`,minWidth:34,background:T.bg3}}>
                        <div style={{color:isWe?T.amber:T.txt2,fontWeight:700,fontSize:12,padding:"2px 0"}}>
                          {dayNum}
                        </div>
                        {objV !== null && (
                          <div style={{fontSize:12,fontWeight:700,color:ktgColor(objV)}}>
                            {objV}%
                          </div>
                        )}
                      </th>
                    );
                  })}
                  <th style={{padding:"8px 8px",textAlign:"center",fontSize:12,fontWeight:700,color:T.cyan,
                    borderBottom:`1px solid ${T.border}`,minWidth:60,whiteSpace:"nowrap"}}>Ср. КТГ</th>
                </tr>
              </thead>
              <tbody>
                {objRigs.map((rig, ri) => {
                  const rigVals = days.map(d => getRigDayKtg(rig.n, d)).filter(v => v !== null);
                  const rigAvg  = rigVals.length ? Math.round(rigVals.reduce((s,v)=>s+v,0)/rigVals.length) : null;
                  return (
                    <tr key={rig.id} style={{background:ri%2?T.rowAlt:"transparent"}}>
                      <td style={{padding:"5px 12px",fontWeight:700,color:T.txt0,fontSize:12,
                        position:"sticky",left:0,background:ri%2?T.rowAlt:T.bg2,zIndex:1,
                        borderRight:`1px solid ${T.border}`}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div style={{width:4,height:28,borderRadius:2,background:T.red,flexShrink:0}}/>
                          {rig.n}
                        </div>
                      </td>
                      {days.map(d => {
                        const v = getRigDayKtg(rig.n, d);
                        return (
                          <td key={d} style={{padding:"2px 1px",textAlign:"center"}}>
                            <div style={{
                              width:30,height:28,borderRadius:4,margin:"0 auto",
                              background:ktgBg(v),
                              border:`1px solid ${v!==null ? ktgColor(v)+"50" : T.border}`,
                              display:"flex",alignItems:"center",justifyContent:"center",
                              fontSize:v!==null?10:8,fontWeight:700,
                              color:v!==null?ktgColor(v):T.txt2,
                            }}>
                              {v !== null ? `${v}%` : <span style={{fontSize:12}}>·</span>}
                            </div>
                          </td>
                        );
                      })}
                      <td style={{padding:"5px 8px",textAlign:"center",fontWeight:700,fontSize:14,
                        color:ktgColor(rigAvg),fontFamily:"'Inter',sans-serif"}}>
                        {rigAvg !== null ? `${rigAvg}%` : "—"}
                      </td>
                    </tr>
                  );
                })}

                {/* Итоговая строка объекта */}
                <tr style={{borderTop:`2px solid ${T.border}`,background:T.bg3}}>
                  <td style={{padding:"6px 12px",fontWeight:700,color:T.cyan,fontSize:12,
                    position:"sticky",left:0,background:T.bg3,zIndex:1,borderRight:`1px solid ${T.border}`}}>
                    ⚙ КТГ объекта
                  </td>
                  {days.map(d => {
                    const v = getObjDayKtg(d);
                    return (
                      <td key={d} style={{padding:"2px 1px",textAlign:"center"}}>
                        <div style={{
                          width:30,height:28,borderRadius:4,margin:"0 auto",
                          background:ktgBg(v),
                          border:`1px solid ${v!==null ? ktgColor(v)+"60" : T.border}`,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          fontSize:v!==null?9:8,fontWeight:700,color:v!==null?ktgColor(v):T.txt2,
                        }}>
                          {v !== null ? `${v}%` : <span style={{fontSize:12}}>·</span>}
                        </div>
                      </td>
                    );
                  })}
                  <td style={{padding:"6px 8px",textAlign:"center",fontWeight:700,fontSize:16,
                    color:ktgColor(monthAvg),fontFamily:"'Inter',sans-serif"}}>
                    {monthAvg !== null ? `${monthAvg}%` : "—"}
                  </td>
                </tr>
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
    updateKtgPlanStatus(plan.object_id, plan.year_month, "ACCEPTED", {decided_at:new Date().toISOString()}).catch(e=>console.warn("KTG accept error:",e.message));
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
      const ready=assetIds.filter(aid=>((plan.items[aid]||{})[d]??-1)>0).length;
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
              <th style={{padding:"6px 12px",fontSize:12,color:T.txt2,textAlign:"left",borderBottom:`1px solid ${T.border}`,minWidth:90,position:"sticky",left:0,background:T.bg3,zIndex:2}}>Актив</th>
              {days.map(d=>{
                const dayNum=parseInt(d.slice(8),10);
                const ktgV=assetIds.length?Math.round(assetIds.filter(aid=>((plan.items[aid]||{})[d]??-1)>0).length/assetIds.length*100):null;
                return(
                  <th key={d} style={{padding:"2px 1px",fontSize:12,color:T.txt2,textAlign:"center",borderBottom:`1px solid ${T.border}`,minWidth:28,background:T.bg3}}>
                    <div style={{fontWeight:700}}>{dayNum}</div>
                    {ktgV!==null&&<div style={{fontSize:12,color:ktgV>=85?T.green:ktgV>=70?T.amber:"#ef4444"}}>{ktgV}%</div>}
                  </th>
                );
              })}
              <th style={{padding:"6px 8px",fontSize:12,color:T.green,textAlign:"center",borderBottom:`1px solid ${T.border}`,minWidth:50}}>КТГ</th>
            </tr>
          </thead>
          <tbody>
            {assetIds.map((aid,ai)=>{
              const assetNode=nodes.find(n=>n.id===aid);
              const readyDays=days.filter(d=>((plan.items[aid]||{})[d]??-1)>0).length;
              const ktg=Math.round(readyDays/dim*100);
              return(
                <tr key={aid} style={{background:ai%2?T.rowAlt:"transparent"}}>
                  <td style={{padding:"4px 12px",fontSize:12,fontWeight:700,color:T.txt0,position:"sticky",left:0,background:ai%2?T.rowAlt:T.bg2,zIndex:1}}>{assetNode?.name||aid}</td>
                  {days.map(d=>{
                    const st=(plan.items[aid]||{})[d]||"NONE";
                    const cfg=KTG_DAY_STATUS[st]||KTG_DAY_STATUS.NONE;
                    return(
                      <td key={d} style={{padding:"1px",textAlign:"center"}}>
                        <div style={{width:24,height:22,borderRadius:3,margin:"0 auto",background:cfg.bg,
                          border:`1px solid ${st==="NONE"?T.border:cfg.color+"50"}`,
                          display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>
                          {st!=="NONE"?cfg.icon:"·"}
                        </div>
                      </td>
                    );
                  })}
                  <td style={{padding:"4px 8px",textAlign:"center",fontWeight:700,fontSize:13,
                    color:ktg>=85?T.green:ktg>=70?T.amber:"#ef4444",fontFamily:"'Inter',sans-serif"}}>
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
                <div style={{fontSize:15,fontWeight:700,color:T.txt0,fontFamily:"'Inter',sans-serif"}}>
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
                      <div style={{fontSize:32,fontWeight:700,color:avg>=85?T.green:avg>=70?T.amber:"#ef4444",fontFamily:"'Inter',sans-serif",lineHeight:1}}>{avg}%</div>
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
                    borderRadius:4,color:T.txt0,fontSize:13,resize:"vertical",fontFamily:"'Inter',sans-serif",outline:"none"}}/>
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
                    <div style={{fontSize:14,fontWeight:700,color:T.txt0,fontFamily:"'Inter',sans-serif"}}>{obj?.name||"—"}</div>
                    <div style={{fontSize:12,color:T.txt2}}>{monthLabel(plan.year_month)} · от {plan.created_by}</div>
                  </div>
                  {avg!==null&&(
                    <div style={{textAlign:"center",padding:"8px 14px",background:`${avg>=85?T.green:"#f59e0b"}12`,borderRadius:5,border:`1px solid ${avg>=85?T.green+"30":"rgba(245,158,11,0.3)"}`}}>
                      <div style={{fontSize:22,fontWeight:700,color:avg>=85?T.green:T.amber,fontFamily:"'Inter',sans-serif",lineHeight:1}}>{avg}%</div>
                      <div style={{fontSize:12,color:T.txt2,marginTop:2}}>КТГ план</div>
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
                    {plan.engineer_comment&&<div style={{fontSize:12,color:"#f87171",marginTop:2}}>↩ {plan.engineer_comment}</div>}
                  </div>
                  {avg!==null&&<span style={{fontSize:14,fontWeight:700,color:T.txt2,fontFamily:"'Inter',sans-serif"}}>{avg}% КТГ</span>}
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



// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 1 — DOWNTIME CLASSIFIER
// Added to ForemanForm: structured downtime reasons per rig per shift
// ═══════════════════════════════════════════════════════════════════════════════

// Классификация простоев:
// technical → снижает КТГ и КИО
// organizational / external → снижает только КИО, не влияет на КТГ
const DOWNTIME_CATS = {
  technical: {
    label: "🔧 Технический",
    color: "#ef4444",
    affectsKtg: true,
    subs: [
      "ТО станка",
      "ТО компрессора",
      "Ремонт (шланг/РВД)",
      "Замена деталей",
      "Ошибка / неисправность",
      "Замерзание / отогрев",
      "Прочий ремонт",
    ],
  },
  organizational: {
    label: "⏳ ОФР / Организационный",
    color: "#f59e0b",
    affectsKtg: false,
    subs: [
      "ОФР (нет фронта работ)",
      "Перегон станка",
      "Ожидание ДТ",
      "Ожидание ВВ / СВ",
      "Зачистка забоя",
      "Ожидание маркшейдера",
      "Пересменка",
      "Прочее организационное",
    ],
  },
  external: {
    label: "🌩 Внешний",
    color: "#3b82f6",
    affectsKtg: false,
    subs: [
      "Погодные условия",
      "Дорога заблокирована",
      "Зона отчуждения (взрыв)",
      "Горнотехническая остановка",
      "Прочее внешнее",
    ],
  },
};

function DowntimeModal({ rigName, onSave, onClose, T }) {
  const [cat,  setCat]  = useState("technical");
  const [sub,  setSub]  = useState("");
  const [desc, setDesc] = useState("");
  const [hrs,  setHrs]  = useState("");

  const catObj = DOWNTIME_CATS[cat];

  function save() {
    if (!sub || !hrs) return;
    onSave({ cat, category: cat, sub, desc, hrs: toNum(hrs), durationHours: toNum(hrs) });
  }

  return (
    <div style={{ position:"fixed", inset:0, background:T.modalBg, zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderRadius:8, width:"100%", maxWidth:460, overflow:"hidden" }}>
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:T.cardSh }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.txt0 }}>⏸ Простой — {rigName}</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:T.txt2, fontSize:18, cursor:"pointer" }}>×</button>
        </div>
        <div style={{ padding:"16px 18px", display:"flex", flexDirection:"column", gap:12 }}>
          {/* Category */}
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", letterSpacing:".08em", marginBottom:6 }}>Категория</div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {Object.entries(DOWNTIME_CATS).map(([k,v]) => (
                <button key={k} onClick={() => { setCat(k); setSub(""); }}
                  style={{ padding:"8px 12px", borderRadius:5, border:`1.5px solid ${cat===k ? v.color : T.border}`,
                    background: cat===k ? `${v.color}18` : "transparent",
                    color: cat===k ? v.color : T.txt2, fontSize:12, fontWeight:600, cursor:"pointer",
                    textAlign:"left", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span>{v.label}</span>
                  <span style={{ fontSize:10, fontWeight:700, color: v.affectsKtg ? "#ef4444" : "#f59e0b", background: v.affectsKtg ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", padding:"2px 6px", borderRadius:3 }}>
                    {v.affectsKtg ? "↓ КТГ + КИО" : "↓ КИО"}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {/* Subcategory */}
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", letterSpacing:".08em", marginBottom:6 }}>Причина</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {catObj.subs.map(s => (
                <button key={s} onClick={() => setSub(s)}
                  style={{ padding:"5px 10px", borderRadius:4, border:`1px solid ${sub===s ? catObj.color : T.border}`,
                    background: sub===s ? `${catObj.color}18` : T.bg3,
                    color: sub===s ? catObj.color : T.txt1, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          {/* Hours */}
          <FieldInput label="Часов простоя" type="text" value={hrs} onChange={e=>setHrs(e.target.value)} placeholder="0.5" T={T} />
          {/* Description */}
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", letterSpacing:".08em", marginBottom:5 }}>Описание (необязательно)</div>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Дополнительные детали..."
              style={{ width:"100%", padding:"8px 10px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt1, fontSize:12, resize:"vertical", minHeight:56, fontFamily:"'Inter',sans-serif", outline:"none" }} />
          </div>
        </div>
        <div style={{ padding:"12px 18px", borderTop:`1px solid ${T.border}`, display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"8px 16px", borderRadius:5, border:`1px solid ${T.border}`, background:"transparent", color:T.txt2, fontSize:12, fontWeight:600, cursor:"pointer" }}>Отмена</button>
          <button onClick={save} disabled={!sub || !hrs}
            style={{ padding:"8px 18px", borderRadius:5, border:"none", background: (!sub||!hrs) ? T.bg3 : T.red, color: (!sub||!hrs) ? T.txt2 : "#fff", fontSize:12, fontWeight:700, cursor: (!sub||!hrs)?"not-allowed":"pointer" }}>
            Сохранить простой
          </button>
        </div>
      </div>
    </div>
  );
}

function DowntimeList({ events, onDelete, T }) {
  if (!events.length) return (
    <div style={{ padding:"10px 14px", fontSize:12, color:T.txt2, fontStyle:"italic" }}>Простои не зафиксированы</div>
  );
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4, padding:"8px 14px" }}>
      {events.map((ev, i) => {
        const catKey = ev.cat || ev.category || "organizational";
        const catObj = DOWNTIME_CATS[catKey] || DOWNTIME_CATS.organizational;
        const affectsKtg = catObj.affectsKtg;
        return (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", background:T.bg3, borderRadius:5, border:`1px solid ${T.border}` }}>
            <div style={{ width:3, height:36, borderRadius:2, background:catObj.color, flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.txt0 }}>{ev.sub || ev.reason || "Простой"}</div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:2 }}>
                <span style={{ fontSize:11, color:T.txt2 }}>{catObj.label}</span>
                <span style={{ fontSize:10, fontWeight:700, color: affectsKtg ? "#ef4444" : "#f59e0b", background: affectsKtg ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", padding:"1px 5px", borderRadius:3 }}>
                  {affectsKtg ? "↓ КТГ" : "↓ КИО"}
                </span>
              </div>
              {ev.desc && <div style={{ fontSize:11, color:T.txt2, marginTop:1 }}>{ev.desc}</div>}
            </div>
            <div style={{ fontSize:13, fontWeight:700, color:catObj.color, fontFamily:"'Inter',sans-serif", minWidth:36, textAlign:"right" }}>{ev.hrs || ev.durationHours}ч</div>
            {onDelete && <button onClick={() => onDelete(i)} style={{ background:"none", border:"none", color:T.txt2, fontSize:14, cursor:"pointer", padding:"0 4px" }}>×</button>}
          </div>
        );
      })}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 2 — BLAST PASSPORT  (Engineer → Планирование → tab)
// ═══════════════════════════════════════════════════════════════════════════════

// Категоризированный справочник ВВ и средств взрывания
const EXP_CATALOG = [
  {
    category: "Основное ВВ",
    color: "#ef4444",
    unit: "кг",
    items: ["Анфо", "Эмульсит", "Гранулит", "Граммонит 79/21", "Детонит"],
  },
  {
    category: "Боевики / патроны-боевики",
    color: "#f97316",
    unit: "шт",
    items: [
      "Superpower-90 d50 mm 500 гр",
      "Superpower-90 d50 mm 1000 гр",
      "Superpower-90 d32 mm 200 гр",
      "ЭПВВ Z-Power D50 mm, 500 гр.",
      "Senatel Powerfrag D38, 300 гр.",
    ],
  },
  {
    category: "SUPREMEDET-S COMBIDET — внутрискважинные замедлители",
    color: "#8b5cf6",
    unit: "шт",
    items: [
      "SUPREMEDET-S COMBIDET 17/500, 9 м",
      "SUPREMEDET-S COMBIDET 17/500, 12 м",
      "SUPREMEDET-S COMBIDET 17/500, 15 м",
      "SUPREMEDET-S COMBIDET 17/500, 18 м",
      "SUPREMEDET-S COMBIDET 25/500, 9 м",
      "SUPREMEDET-S COMBIDET 25/500, 12 м",
      "SUPREMEDET-S COMBIDET 25/500, 15 м",
      "SUPREMEDET-S COMBIDET 25/500, 18 м",
    ],
  },
  {
    category: "SUPREMEDET-S DTH — донные инициаторы",
    color: "#6366f1",
    unit: "шт",
    items: [
      "SUPREMEDET-S DTH 500 mc, 7 м",
      "SUPREMEDET-S DTH 500 mc, 9 м",
      "SUPREMEDET-S DTH 500 mc, 12 м",
      "SUPREMEDET-S DTH 500 mc, 16 м",
    ],
  },
  {
    category: "SUPREMEDET-S STL — поверхностные замедлители",
    color: "#3b82f6",
    unit: "шт",
    items: [
      "SUPREMEDET-S STL, 17 ms, 6 м",
      "SUPREMEDET-S STL, 25 ms, 6 м",
      "SUPREMEDET-S STL, 42 ms, 6 м",
      "SUPREMEDET-S STL, 67 ms, 6 м",
      "SUPREMEDET-S STL, 100 ms, 6 м",
      "SUPREMEDET-S STL, 0 ms, 100 м",
      "SUPREMEDET-S STL, 0 ms, 200 м",
      "SUPREMEDET-S STL, 0 ms, 300 м",
    ],
  },
  {
    category: "Детонирующий шнур",
    color: "#10b981",
    unit: "м",
    items: [
      "ДШ Solar Cord T",
      "ДШ Solar Cord III",
    ],
  },
  {
    category: "Прочее",
    color: "#6b7280",
    unit: "шт",
    items: ["Прочее"],
  },
];

// Плоский список для совместимости с автосписанием
const EXPLOSIVE_TYPES = EXP_CATALOG.flatMap(c => c.items);

// Найти категорию и единицу по названию
function expCatalogLookup(name) {
  for (const cat of EXP_CATALOG) {
    if (cat.items.includes(name)) return cat;
  }
  return EXP_CATALOG[EXP_CATALOG.length - 1];
}
const INIT_BLAST_PASSPORTS = [];

function BlastPassportPage({ passports_bvr, setPassportsBvr, objs, reps, T }) {
  const [showForm, setShowForm]  = useState(false);
  const [editing,  setEditing]   = useState(null);
  const [filterObj, setFilterObj] = useState("all");

  const filtered = passports_bvr.filter(p => filterObj === "all" || p.oid === Number(filterObj));

  function save(data) {
    if (editing) {
      setPassportsBvr(prev => prev.map(p => p.id === editing.id ? { ...data, id: editing.id } : p));
    } else {
      setPassportsBvr(prev => [...prev, { ...data, id: genId() }]);
    }
    setShowForm(false); setEditing(null);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:600, color:T.txt0 }}>Паспорта БВР</div>
          <div style={{ fontSize:12, color:T.txt2, marginTop:2 }}>Буровзрывные работы · {passports_bvr.length} паспортов</div>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          style={{ padding:"9px 18px", borderRadius:6, border:"none", background:T.red, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
          + Новый паспорт
        </button>
      </div>

      {/* Filter */}
      <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
        {[["all","Все участки"], ...objs.map(o=>[String(o.id),o.name])].map(([v,lbl]) => (
          <button key={v} onClick={() => setFilterObj(v)}
            style={{ padding:"5px 12px", borderRadius:4, border:`1px solid ${filterObj===v ? T.red : T.border}`,
              background: filterObj===v ? `${T.red}12` : "transparent",
              color: filterObj===v ? T.red : T.txt2, fontSize:12, fontWeight:600, cursor:"pointer" }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ padding:40, textAlign:"center", color:T.txt2, fontSize:13 }}>
          Паспортов нет. Создайте первый.
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map(p => {
            const obj = objs.find(o => o.id === p.oid);
            const eff = p.designed_vol > 0 ? Math.round(p.actual_vol / p.designed_vol * 100) : null;
            const statusColors = { draft:"#6b7fa0", approved:T.green, executed:T.blue };
            const statusLabels = { draft:"Черновик", approved:"Утверждён", executed:"Выполнен" };
            return (
              <div key={p.id} style={{ background:T.bg2, border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden" }}>
                <div style={{ padding:"12px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ fontSize:15, fontWeight:700, color:T.txt0, fontFamily:"'Inter',sans-serif" }}>
                        {p.block_name || `Блок #${p.id}`}
                      </div>
                      <span style={{ padding:"2px 8px", borderRadius:3, background:`${statusColors[p.status]}18`, color:statusColors[p.status], fontSize:12, fontWeight:700, border:`1px solid ${statusColors[p.status]}40` }}>
                        {statusLabels[p.status]}
                      </span>
                    </div>
                    <div style={{ fontSize:12, color:T.txt2, marginTop:3 }}>
                      {obj?.name} · {p.date} · Инж: {p.engineer}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={() => { setEditing(p); setShowForm(true); }}
                      style={{ padding:"6px 14px", borderRadius:5, border:`1px solid ${T.border}`, background:T.bg3, color:T.txt1, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                      Открыть
                    </button>
                    <button onClick={() => setPassportsBvr(prev => prev.filter(x => x.id !== p.id))}
                      style={{ padding:"6px 10px", borderRadius:5, border:`1px solid ${T.border}`, background:"transparent", color:"#ef4444", fontSize:12, cursor:"pointer" }}>
                      ×
                    </button>
                  </div>
                </div>
                {/* Stats row */}
                <div style={{ padding:"8px 18px 12px", display:"flex", gap:20, flexWrap:"wrap", borderTop:`1px solid ${T.border}`, background:T.bg3 }}>
                  {[
                    ["Скважин", p.holes_count, "шт", T.blue],
                    ["Глубина ср.", p.avg_depth, "м", T.txt1],
                    ["Заряд", p.total_charge_kg?.toLocaleString(), "кг", T.amber],
                    ["Объём проект.", p.designed_vol?.toLocaleString(), "м³", T.violet],
                    ["Объём факт.", p.actual_vol > 0 ? p.actual_vol?.toLocaleString() : "—", p.actual_vol > 0 ? "м³" : "", T.green],
                    eff !== null ? ["Эффективность", eff, "%", eff >= 90 ? T.green : eff >= 70 ? T.amber : "#ef4444"] : null,
                  ].filter(Boolean).map(([lbl, val, unit, color]) => (
                    <div key={lbl}>
                      <div style={{ fontSize:12, color:T.txt2, textTransform:"uppercase", letterSpacing:".06em" }}>{lbl}</div>
                      <div style={{ fontSize:16, fontWeight:700, color, fontFamily:"'Inter',sans-serif" }}>
                        {val} <span style={{ fontSize:12, fontWeight:400, color:T.txt2 }}>{unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <BlastPassportForm
          initial={editing}
          objs={objs}
          onSave={save}
          onClose={() => { setShowForm(false); setEditing(null); }}
          T={T}
        />
      )}
    </div>
  );
}

function BlastPassportForm({ initial, objs, onSave, onClose, T }) {
  const [oid,         setOid]        = useState(initial?.oid || objs[0]?.id || "");
  const [date,        setDate]       = useState(initial?.date || "");
  const [blockName,   setBlockName]  = useState(initial?.block_name || "");
  const [engineer,    setEngineer]   = useState(initial?.engineer || "");
  const [holes,       setHoles]      = useState(initial?.holes_count || "");
  const [avgDepth,    setAvgDepth]   = useState(initial?.avg_depth || "");
  const [diameter,    setDiameter]   = useState(initial?.diameter || "");
  const [expType,     setExpType]    = useState(initial?.exp_type || EXPLOSIVE_TYPES[0]);
  const [charge,      setCharge]     = useState(initial?.total_charge_kg || "");
  const [initSystem,  setInitSystem] = useState(initial?.init_system || "СИНВ");
  const [designedVol, setDesignedVol]= useState(initial?.designed_vol || "");
  const [actualVol,   setActualVol]  = useState(initial?.actual_vol || "");
  const [postStatus,  setPostStatus] = useState(initial?.post_status || "ok");
  const [status,      setStatus]     = useState(initial?.status || "draft");
  const [notes,       setNotes]      = useState(initial?.notes || "");

  function handleSave() {
    onSave({ oid:Number(oid), date, block_name:blockName, engineer, holes_count:toNum(holes),
      avg_depth:toNum(avgDepth), diameter:toNum(diameter), exp_type:expType,
      total_charge_kg:toNum(charge), init_system:initSystem, designed_vol:toNum(designedVol),
      actual_vol:toNum(actualVol), post_status:postStatus, status, notes });
  }

  const F = ({ label, children }) => (
    <div>
      <div style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", letterSpacing:".08em", marginBottom:5 }}>{label}</div>
      {children}
    </div>
  );

  const inp = (val, set, ph="") => (
    <input type="text" value={val} onChange={e=>set(e.target.value)} placeholder={ph}
      style={{ width:"100%", padding:"8px 10px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:13, outline:"none", fontFamily:"'Inter',sans-serif" }} />
  );

  const sel = (val, set, opts) => (
    <select value={val} onChange={e=>set(e.target.value)}
      style={{ width:"100%", padding:"8px 10px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:13, outline:"none" }}>
      {opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );

  return (
    <div style={{ position:"fixed", inset:0, background:T.modalBg, zIndex:1000, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"20px 16px", overflowY:"auto" }}>
      <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderRadius:8, width:"100%", maxWidth:600, marginBottom:20 }}>
        <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:T.cardSh }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.txt0 }}>💥 {initial ? "Редактировать" : "Новый"} паспорт БВР</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:T.txt2, fontSize:18, cursor:"pointer" }}>×</button>
        </div>
        <div style={{ padding:"18px 20px", display:"flex", flexDirection:"column", gap:14 }}>

          {/* Section: Общее */}
          <div style={{ fontSize:12, fontWeight:700, color:T.amber, textTransform:"uppercase", letterSpacing:".12em", borderBottom:`1px solid ${T.border}`, paddingBottom:6 }}>Общие данные</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <F label="Участок">{sel(oid, setOid, objs.map(o=>[String(o.id),o.name]))}</F>
            <F label="Дата">{inp(date, setDate, "2025-06-01")}</F>
            <F label="Название блока">{inp(blockName, setBlockName, "Блок 14-СВ")}</F>
            <F label="Ответственный инженер">{inp(engineer, setEngineer, "Иванов Н.С.")}</F>
          </div>

          {/* Section: Скважины */}
          <div style={{ fontSize:12, fontWeight:700, color:T.blue, textTransform:"uppercase", letterSpacing:".12em", borderBottom:`1px solid ${T.border}`, paddingBottom:6, marginTop:4 }}>Скважины</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
            <F label="Кол-во скважин">{inp(holes, setHoles, "48")}</F>
            <F label="Средняя глубина, м">{inp(avgDepth, setAvgDepth, "12.5")}</F>
            <F label="Диаметр, мм">{inp(diameter, setDiameter, "250")}</F>
          </div>

          {/* Section: ВВ */}
          <div style={{ fontSize:12, fontWeight:700, color:T.amber, textTransform:"uppercase", letterSpacing:".12em", borderBottom:`1px solid ${T.border}`, paddingBottom:6, marginTop:4 }}>Взрывчатые вещества</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
            <F label="Тип ВВ">{sel(expType, setExpType, EXPLOSIVE_TYPES.map(e=>[e,e]))}</F>
            <F label="Общий заряд, кг">{inp(charge, setCharge, "14400")}</F>
            <F label="Система инициирования">{sel(initSystem, setInitSystem, [["СИНВ","СИНВ"],["СИНВ-Ш","СИНВ-Ш"],["ЭДКЗ","ЭДКЗ"],["Детошнур","Детошнур"]])}</F>
          </div>

          {/* Section: Объёмы */}
          <div style={{ fontSize:12, fontWeight:700, color:T.violet, textTransform:"uppercase", letterSpacing:".12em", borderBottom:`1px solid ${T.border}`, paddingBottom:6, marginTop:4 }}>Объёмы горной массы</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <F label="Проектный объём, м³">{inp(designedVol, setDesignedVol, "120000")}</F>
            <F label="Фактический объём, м³">{inp(actualVol, setActualVol, "0 — заполнить после взрыва")}</F>
          </div>

          {/* Section: Статус */}
          <div style={{ fontSize:12, fontWeight:700, color:T.green, textTransform:"uppercase", letterSpacing:".12em", borderBottom:`1px solid ${T.border}`, paddingBottom:6, marginTop:4 }}>Статус и итог взрыва</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <F label="Статус паспорта">{sel(status, setStatus, [["draft","Черновик"],["approved","Утверждён"],["executed","Выполнен"]])}</F>
            <F label="Результат взрыва">{sel(postStatus, setPostStatus, [["ok","Успешно"],["misfires","Отказы"],["reblast","↺ Перебур требуется"],["pending","— Ожидание"]])}</F>
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", letterSpacing:".08em", marginBottom:5 }}>Примечания</div>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Особые условия, отклонения, наблюдения..."
              style={{ width:"100%", padding:"8px 10px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt1, fontSize:12, resize:"vertical", minHeight:64, fontFamily:"'Inter',sans-serif", outline:"none" }} />
          </div>
        </div>
        <div style={{ padding:"12px 20px", borderTop:`1px solid ${T.border}`, display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"8px 18px", borderRadius:5, border:`1px solid ${T.border}`, background:"transparent", color:T.txt2, fontSize:13, fontWeight:600, cursor:"pointer" }}>Отмена</button>
          <button onClick={handleSave} style={{ padding:"8px 22px", borderRadius:5, border:"none", background:T.red, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
            {initial ? "Сохранить" : "Создать паспорт"}
          </button>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 3 — MAINTENANCE SCHEDULE  (Mechanic → новая вкладка)
// ═══════════════════════════════════════════════════════════════════════════════

const MAINT_TYPES = {
  "ТО-1": { interval_hrs: 250,  label: "ТО-1",  color: "#10b981", desc: "Замена масла, фильтры" },
  "ТО-2": { interval_hrs: 500,  label: "ТО-2",  color: "#3b82f6", desc: "ТО-1 + осмотр компрессора, гидравлики" },
  "ТО-3": { interval_hrs: 1000, label: "ТО-3",  color: "#8b5cf6", desc: "ТО-2 + ревизия мачты, ходовой части" },
  "ТО-4": { interval_hrs: 2000, label: "ТО-4",  color: "#f59e0b", desc: "Капитальная ревизия агрегатов" },
  "Ремонт": { interval_hrs: null, label: "Ремонт", color: "#ef4444", desc: "Внеплановый ремонт" },
};

const INIT_MAINT_LOGS = [];

function MaintenancePage({ nodes, passports, maintLogs, setMaintLogs, user, T }) {
  const [showForm,  setShowForm]  = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [filterRig, setFilterRig] = useState("all");

  const rigs = nodes.filter(n => n.type === "ASSET");

  function getLastMaint(nodeId, type) {
    return maintLogs
      .filter(l => l.node_id === nodeId && l.type === type)
      .sort((a,b) => b.date.localeCompare(a.date))[0] || null;
  }

  function getHoursLeft(nodeId, type) {
    const mt = MAINT_TYPES[type];
    if (!mt.interval_hrs) return null;
    const last = getLastMaint(nodeId, type);
    const curHrs = passports[nodeId]?.moto_hours || 0;
    const lastHrs = last?.moto_hours_at || 0;
    const done = curHrs - lastHrs;
    return Math.max(0, mt.interval_hrs - done);
  }

  function urgencyColor(left, interval) {
    if (left === null) return T.txt2;
    const pct = left / interval;
    if (pct <= 0.1) return "#ef4444";
    if (pct <= 0.25) return "#f59e0b";
    return T.green;
  }

  const displayRigs = filterRig === "all" ? rigs : rigs.filter(r => r.id === filterRig);

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:600, color:T.txt0 }}>График ТО</div>
          <div style={{ fontSize:12, color:T.txt2, marginTop:2 }}>Техническое обслуживание · {rigs.length} единиц оборудования</div>
        </div>
        <button onClick={() => { setEditEntry(null); setShowForm(true); }}
          style={{ padding:"9px 18px", borderRadius:6, border:"none", background:T.blue, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
          + Запись ТО
        </button>
      </div>

      {/* Rig filter */}
      <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
        <button onClick={() => setFilterRig("all")}
          style={{ padding:"5px 12px", borderRadius:4, border:`1px solid ${filterRig==="all" ? T.blue : T.border}`,
            background: filterRig==="all" ? `${T.blue}12` : "transparent",
            color: filterRig==="all" ? T.blue : T.txt2, fontSize:12, fontWeight:600, cursor:"pointer" }}>
          Все станки
        </button>
        {rigs.map(r => (
          <button key={r.id} onClick={() => setFilterRig(r.id)}
            style={{ padding:"5px 12px", borderRadius:4, border:`1px solid ${filterRig===r.id ? T.blue : T.border}`,
              background: filterRig===r.id ? `${T.blue}12` : "transparent",
              color: filterRig===r.id ? T.blue : T.txt2, fontSize:12, fontWeight:600, cursor:"pointer" }}>
            {r.name}
          </button>
        ))}
      </div>

      {/* Fleet health cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))", gap:12, marginBottom:24 }}>
        {displayRigs.map(rig => {
          const curHrs = passports[rig.id]?.moto_hours || 0;
          const alerts = Object.keys(MAINT_TYPES).filter(t => {
            const left = getHoursLeft(rig.id, t);
            return left !== null && left / MAINT_TYPES[t].interval_hrs <= 0.1;
          });
          return (
            <div key={rig.id} style={{ background:T.bg2, border:`1px solid ${alerts.length > 0 ? "#ef444440" : T.border}`, borderRadius:8, overflow:"hidden" }}>
              <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:T.txt0, fontFamily:"'Inter',sans-serif" }}>{rig.name}</div>
                  <div style={{ fontSize:12, color:T.txt2, marginTop:1 }}>
                    Моточасов: <b style={{ color:T.txt0, fontFamily:"'JetBrains Mono',monospace" }}>{curHrs.toLocaleString()}</b>
                  </div>
                </div>
                {alerts.length > 0 && (
                  <div style={{ padding:"3px 8px", borderRadius:4, background:"#ef444420", border:"1px solid #ef444440", fontSize:12, color:"#ef4444", fontWeight:700 }}>
                    ⚠ {alerts.length} к ТО
                  </div>
                )}
              </div>
              <div style={{ padding:"10px 16px", display:"flex", flexDirection:"column", gap:6 }}>
                {["ТО-1","ТО-2","ТО-3","ТО-4"].map(t => {
                  const left = getHoursLeft(rig.id, t);
                  const mt = MAINT_TYPES[t];
                  const last = getLastMaint(rig.id, t);
                  const uc = urgencyColor(left, mt.interval_hrs);
                  const pctLeft = left !== null ? Math.min(100, Math.round(left / mt.interval_hrs * 100)) : 100;
                  return (
                    <div key={t} style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:mt.color, minWidth:32 }}>{t}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ height:5, background:T.bg0, borderRadius:3, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${pctLeft}%`, background:uc, borderRadius:3, transition:"width .4s" }} />
                        </div>
                      </div>
                      <div style={{ fontSize:12, color:uc, fontFamily:"'JetBrains Mono',monospace", minWidth:55, textAlign:"right" }}>
                        {left !== null ? `${left}ч` : "—"}
                      </div>
                      <div style={{ fontSize:12, color:T.txt2, minWidth:70, textAlign:"right" }}>
                        {last ? last.date : "не было"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Log table */}
      <div style={{ fontSize:13, fontWeight:700, color:T.txt0, marginBottom:10 }}>📋 Журнал ТО</div>
      <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden" }}>
        {maintLogs.length === 0 ? (
          <div style={{ padding:32, textAlign:"center", color:T.txt2, fontSize:13 }}>Записей ТО нет</div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:T.rowHdr }}>
                {["Станок","Тип ТО","Дата","Моточасов","Работы","Запчасти","Выполнил",""].map(h => (
                  <th key={h} style={{ padding:"9px 12px", textAlign:"left", fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", letterSpacing:".06em", borderBottom:`1px solid ${T.border}`, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...maintLogs].sort((a,b) => b.date.localeCompare(a.date)).map((l, i) => {
                const rig = nodes.find(n => n.id === l.node_id);
                const mt = MAINT_TYPES[l.type];
                return (
                  <tr key={l.id} style={{ background: i%2 ? T.rowAlt : "transparent" }}>
                    <td style={{ padding:"8px 12px", fontSize:13, fontWeight:700, color:T.txt0 }}>{rig?.name || "—"}</td>
                    <td style={{ padding:"8px 12px" }}>
                      <span style={{ padding:"2px 7px", borderRadius:3, background:`${mt?.color||T.border}18`, color:mt?.color||T.txt2, fontSize:12, fontWeight:700 }}>{l.type}</span>
                    </td>
                    <td style={{ padding:"8px 12px", fontSize:12, color:T.txt1 }}>{l.date}</td>
                    <td style={{ padding:"8px 12px", fontSize:12, color:T.txt1, fontFamily:"'JetBrains Mono',monospace" }}>{l.moto_hours_at?.toLocaleString()}</td>
                    <td style={{ padding:"8px 12px", fontSize:12, color:T.txt1, maxWidth:180 }}>{l.work_done || "—"}</td>
                    <td style={{ padding:"8px 12px", fontSize:12, color:T.txt1 }}>{l.parts || "—"}</td>
                    <td style={{ padding:"8px 12px", fontSize:12, color:T.txt2 }}>{l.performed_by || "—"}</td>
                    <td style={{ padding:"8px 12px" }}>
                      <button onClick={() => setMaintLogs(prev => prev.filter(x => x.id !== l.id))}
                        style={{ background:"none", border:"none", color:T.txt2, fontSize:13, cursor:"pointer" }}>×</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <MaintenanceFormModal
          initial={editEntry}
          rigs={rigs}
          passports={passports}
          onSave={entry => { setMaintLogs(prev => [...prev, { ...entry, id: genId() }]); setShowForm(false); }}
          onClose={() => setShowForm(false)}
          T={T}
        />
      )}
    </div>
  );
}

function MaintenanceFormModal({ initial, rigs, passports, onSave, onClose, T }) {
  const [nodeId,   setNodeId]   = useState(initial?.node_id || rigs[0]?.id || "");
  const [type,     setType]     = useState(initial?.type || "ТО-1");
  const [date,     setDate]     = useState(initial?.date || "");
  const [workDone, setWorkDone] = useState(initial?.work_done || "");
  const [parts,    setParts]    = useState(initial?.parts || "");
  const [by,       setBy]       = useState(initial?.performed_by || "");

  const curHrs = passports[nodeId]?.moto_hours || 0;

  return (
    <div style={{ position:"fixed", inset:0, background:T.modalBg, zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderRadius:8, width:"100%", maxWidth:480 }}>
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:T.cardSh }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.txt0 }}>🔧 Запись технического обслуживания</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:T.txt2, fontSize:18, cursor:"pointer" }}>×</button>
        </div>
        <div style={{ padding:"16px 18px", display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", letterSpacing:".08em", marginBottom:5 }}>Станок</div>
              <select value={nodeId} onChange={e=>setNodeId(e.target.value)}
                style={{ width:"100%", padding:"8px 10px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:13, outline:"none" }}>
                {rigs.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", letterSpacing:".08em", marginBottom:5 }}>Тип ТО</div>
              <select value={type} onChange={e=>setType(e.target.value)}
                style={{ width:"100%", padding:"8px 10px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:13, outline:"none" }}>
                {Object.keys(MAINT_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ padding:"10px 14px", background:`${T.blue}10`, border:`1px solid ${T.blue}30`, borderRadius:5, fontSize:12 }}>
            Текущий ресурс станка: <b style={{ color:T.blue, fontFamily:"'JetBrains Mono',monospace" }}>{curHrs.toLocaleString()} моточасов</b>
            {MAINT_TYPES[type].interval_hrs && <> · Интервал ТО: <b style={{ color:T.txt0 }}>{MAINT_TYPES[type].interval_hrs}ч</b></>}
          </div>
          <FieldInput label="Дата ТО" type="date" value={date} onChange={e=>setDate(e.target.value)} T={T} />
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", letterSpacing:".08em", marginBottom:5 }}>Выполненные работы</div>
            <textarea value={workDone} onChange={e=>setWorkDone(e.target.value)} placeholder="Замена масла 15W-40, фильтр масляный, воздушный фильтр..."
              style={{ width:"100%", padding:"8px 10px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt1, fontSize:12, resize:"vertical", minHeight:64, fontFamily:"'Inter',sans-serif", outline:"none" }} />
          </div>
          <FieldInput label="Запчасти / расходники" value={parts} onChange={e=>setParts(e.target.value)} placeholder="Масло 20л, фильтр арт. 12345" T={T} />
          <FieldInput label="Выполнил" value={by} onChange={e=>setBy(e.target.value)} placeholder="Механик Асанов" T={T} />
        </div>
        <div style={{ padding:"12px 18px", borderTop:`1px solid ${T.border}`, display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"8px 16px", borderRadius:5, border:`1px solid ${T.border}`, background:"transparent", color:T.txt2, fontSize:12, fontWeight:600, cursor:"pointer" }}>Отмена</button>
          <button onClick={() => onSave({ node_id:nodeId, type, date, moto_hours_at:curHrs, work_done:workDone, parts, performed_by:by })}
            disabled={!date}
            style={{ padding:"8px 22px", borderRadius:5, border:"none", background:!date ? T.bg3 : T.blue, color:!date ? T.txt2 : "#fff", fontSize:12, fontWeight:700, cursor:!date?"not-allowed":"pointer" }}>
            Сохранить запись
          </button>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 4 — EXPLOSIVES INVENTORY  (Engineer → Планирование → tab)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── INVENTORY: STORAGE UNITS & TRANSACTIONS ─────────────────────────────────
const INIT_STORAGE_UNITS = [
  // Борлы (oid:1)
  { id:"su1",  oid:1, name:"Резервуар ДТ-1",     item_type:"FUEL",      item_name:"Дизельное топливо", unit:"л",  capacity:15000, min_level:1000 },
  { id:"su2",  oid:1, name:"Резервуар ДТ-2",     item_type:"FUEL",      item_name:"Дизельное топливо", unit:"л",  capacity:10000, min_level:500  },
  { id:"su3",  oid:1, name:"Склад ВВ — АНФО",    item_type:"EXPLOSIVE", item_name:"АНФО",              unit:"кг", capacity:20000, min_level:500  },
  { id:"su4",  oid:1, name:"Склад ВВ — Эмульсия",item_type:"EXPLOSIVE", item_name:"Эмульсия",          unit:"кг", capacity:10000, min_level:200  },
  // Коскудук (oid:2)
  { id:"su5",  oid:2, name:"Резервуар ДТ-1",     item_type:"FUEL",      item_name:"Дизельное топливо", unit:"л",  capacity:12000, min_level:800  },
  { id:"su6",  oid:2, name:"Склад ВВ — АНФО",    item_type:"EXPLOSIVE", item_name:"АНФО",              unit:"кг", capacity:15000, min_level:400  },
  { id:"su7",  oid:2, name:"Склад ВВ — Эмульсия",item_type:"EXPLOSIVE", item_name:"Эмульсия",          unit:"кг", capacity:8000,  min_level:200  },
  // Бактай (oid:3)
  { id:"su8",  oid:3, name:"Резервуар ДТ-1",     item_type:"FUEL",      item_name:"Дизельное топливо", unit:"л",  capacity:12000, min_level:800  },
  { id:"su9",  oid:3, name:"Склад ВВ — АНФО",    item_type:"EXPLOSIVE", item_name:"АНФО",              unit:"кг", capacity:18000, min_level:500  },
  { id:"su10", oid:3, name:"Склад ВВ — Эмульсия",item_type:"EXPLOSIVE", item_name:"Эмульсия",          unit:"кг", capacity:8000,  min_level:200  },
  // Жолымбет (oid:4)
  { id:"su11", oid:4, name:"Резервуар ДТ-1",     item_type:"FUEL",      item_name:"Дизельное топливо", unit:"л",  capacity:10000, min_level:600  },
  { id:"su12", oid:4, name:"Склад ВВ — АНФО",    item_type:"EXPLOSIVE", item_name:"АНФО",              unit:"кг", capacity:12000, min_level:300  },
  // Шыганак (oid:5)
  { id:"su13", oid:5, name:"Резервуар ДТ-1",     item_type:"FUEL",      item_name:"Дизельное топливо", unit:"л",  capacity:8000,  min_level:500  },
  { id:"su14", oid:5, name:"Склад ВВ — АНФО",    item_type:"EXPLOSIVE", item_name:"АНФО",              unit:"кг", capacity:10000, min_level:300  },
];

const INIT_INV_TXNS = []; // { id, txn_type:"IN"|"OUT"|"ADJUSTMENT", su_id, qty, date, asset_id, doc_ref, note, recorded_by, shift_report_id }

// ─── INVENTORY PAGE ───────────────────────────────────────────────────────────
const INV_TYPE_CFG = {
  FUEL:      { label:"ГСМ",          color:"#2d7de0", icon:"⛽", unitLabel:"л"  },
  EXPLOSIVE: { label:"ВВ",           color:"#d48818", icon:"💥", unitLabel:"кг" },
  MATERIAL:  { label:"ТМЦ",          color:"#12a068", icon:"📦", unitLabel:"шт" },
};
const INV_TXN_CFG = {
  IN:         { label:"Приход",       color:"#12a068", sign:+1 },
  OUT:        { label:"Выдача",       color:"#d48818", sign:-1 },
  ADJUSTMENT: { label:"Корректировка",color:"#7050e0", sign:0  },
};

function InventoryPage({ storageUnits, setStorageUnits, invTxns, setInvTxns, objs, nodes, user, T }) {
  const [tab,         setTab]         = useState("units");    // "units" | "journal"
  const [filterOid,   setFilterOid]   = useState("all");
  const [filterType,  setFilterType]  = useState("all");
  const [txnModal,    setTxnModal]    = useState(null);       // null | "IN" | "OUT" | "ADJUSTMENT"
  const [unitModal,   setUnitModal]   = useState(null);       // null | "add" | unit obj
  const [deleteConf,  setDeleteConf]  = useState(null);       // unit id
  const [unitForm,    setUnitForm]    = useState({});
  const [unitErr,     setUnitErr]     = useState("");

  // ── EAM assets list (буровые станки и техника из nodes) ──────────────────
  const eamAssets = nodes.filter(n => n.type === "ASSET");

  // ── Balance calculation ──────────────────────────────────────────────────
  function calcBalance(suId) {
    return invTxns
      .filter(t => t.su_id === suId)
      .reduce((s, t) => {
        const cfg = INV_TXN_CFG[t.txn_type];
        if (t.txn_type === "ADJUSTMENT") return t.qty; // ADJUSTMENT задаёт абсолютный остаток
        return s + cfg.sign * t.qty;
      }, 0);
  }

  // ── Filtered views ───────────────────────────────────────────────────────
  const visibleOids = user?.role === "foreman"
    ? (user.oids === "all" ? objs.map(o => o.id) : user.oids)
    : objs.map(o => o.id);

  const filteredUnits = storageUnits.filter(u => {
    if (!visibleOids.includes(u.oid)) return false;
    if (filterOid !== "all" && u.oid !== Number(filterOid)) return false;
    if (filterType !== "all" && u.item_type !== filterType) return false;
    return true;
  });

  const filteredTxns = [...invTxns]
    .filter(t => {
      const su = storageUnits.find(u => u.id === t.su_id);
      if (!su) return false;
      if (!visibleOids.includes(su.oid)) return false;
      if (filterOid !== "all" && su.oid !== Number(filterOid)) return false;
      if (filterType !== "all" && su.item_type !== filterType) return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  // ── Summary KPIs ────────────────────────────────────────────────────────
  const kpis = Object.keys(INV_TYPE_CFG).map(type => {
    const units = storageUnits.filter(u => visibleOids.includes(u.oid) && u.item_type === type);
    const totalBalance = units.reduce((s, u) => s + Math.max(0, calcBalance(u.id)), 0);
    const totalCapacity = units.reduce((s, u) => s + u.capacity, 0);
    const lowCount = units.filter(u => {
      const bal = calcBalance(u.id);
      return bal <= u.min_level;
    }).length;
    return { type, ...INV_TYPE_CFG[type], totalBalance, totalCapacity, unitCount: units.length, lowCount };
  }).filter(k => k.unitCount > 0);

  // ── Storage unit CRUD ────────────────────────────────────────────────────
  function openAddUnit() {
    setUnitForm({ oid: String(objs[0]?.id || ""), name:"", item_type:"FUEL", item_name:"Дизельное топливо", unit:"л", capacity:"", min_level:"" });
    setUnitErr(""); setUnitModal("add");
  }
  function openEditUnit(u) {
    setUnitForm({ ...u, oid: String(u.oid), capacity: String(u.capacity), min_level: String(u.min_level) });
    setUnitErr(""); setUnitModal(u);
  }
  function saveUnit() {
    if (!unitForm.name.trim()) { setUnitErr("Введите название"); return; }
    if (!unitForm.capacity || isNaN(Number(unitForm.capacity)) || Number(unitForm.capacity) <= 0) { setUnitErr("Укажите вместимость"); return; }
    const su = {
      name: unitForm.name.trim(),
      oid: Number(unitForm.oid),
      item_type: unitForm.item_type,
      item_name: unitForm.item_name.trim() || unitForm.item_type,
      unit: unitForm.unit.trim() || "л",
      capacity: Number(unitForm.capacity),
      min_level: Number(unitForm.min_level) || 0,
    };
    if (unitModal === "add") {
      setStorageUnits(prev => [...prev, { ...su, id: genId() }]);
    } else {
      setStorageUnits(prev => prev.map(u => u.id === unitModal.id ? { ...u, ...su } : u));
    }
    setUnitModal(null); setUnitErr("");
  }
  function deleteUnit() {
    setStorageUnits(prev => prev.filter(u => u.id !== deleteConf));
    setInvTxns(prev => prev.filter(t => t.su_id !== deleteConf));
    setDeleteConf(null);
  }

  const ITEM_DEFAULTS = {
    FUEL:      { unit:"л",  suggestions:["Дизельное топливо","Бензин АИ-92","Бензин АИ-95","Авиационный керосин"] },
    EXPLOSIVE: { unit:"кг", suggestions:["АНФО","Эмульсия","Граммонит 79/21","Детонирующий шнур","Детонатор ЭД-8"] },
    MATERIAL:  { unit:"шт", suggestions:["Долото","Штанга бурильная","Фильтр масляный","Ремень ГРМ"] },
  };

  return (
    <div>
      {/* ── Delete confirm modal ── */}
      {deleteConf && (
        <div style={{position:"fixed",inset:0,background:T.modalBg,zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:T.bg2,border:"1px solid rgba(239,68,68,0.4)",borderRadius:8,maxWidth:380,width:"100%",padding:28,textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:12}}>⚠️</div>
            <div style={{fontSize:14,fontWeight:700,color:T.txt0,marginBottom:8}}>Удалить склад?</div>
            <div style={{fontSize:13,color:T.txt2,marginBottom:20}}>Все транзакции по этому складу будут удалены. Действие необратимо.</div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <Btn variant="danger" onClick={deleteUnit} T={T}>Удалить</Btn>
              <Btn variant="ghost" onClick={()=>setDeleteConf(null)} T={T}>Отмена</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── Storage unit modal ── */}
      {unitModal && (
        <div style={{position:"fixed",inset:0,background:T.modalBg,zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:8,width:"100%",maxWidth:500,padding:24}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <div style={{fontSize:14,fontWeight:700,color:T.txt0}}>{unitModal==="add" ? "Новый склад / резервуар" : "Редактировать склад"}</div>
              <button onClick={()=>setUnitModal(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:T.txt2}}>×</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <FieldInput label="Название" value={unitForm.name||""} onChange={e=>setUnitForm(p=>({...p,name:e.target.value}))} T={T} placeholder="Резервуар ДТ-1"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <FieldSelect label="Объект" value={unitForm.oid||""} onChange={e=>setUnitForm(p=>({...p,oid:e.target.value}))} T={T}>
                  {objs.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
                </FieldSelect>
                <FieldSelect label="Тип ресурса" value={unitForm.item_type||"FUEL"} onChange={e=>{
                  const def = ITEM_DEFAULTS[e.target.value];
                  setUnitForm(p=>({...p, item_type:e.target.value, unit:def.unit, item_name:def.suggestions[0]}));
                }} T={T}>
                  {Object.entries(INV_TYPE_CFG).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
                </FieldSelect>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:700,color:T.txt2,textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:6}}>Наименование ресурса</label>
                <input list={`inv-suggestions-${unitModal}`} value={unitForm.item_name||""} onChange={e=>setUnitForm(p=>({...p,item_name:e.target.value}))}
                  style={{width:"100%",padding:"8px 12px",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:4,color:T.txt0,fontSize:13,outline:"none",fontFamily:"'Inter',sans-serif"}}/>
                <datalist id={`inv-suggestions-${unitModal}`}>
                  {(ITEM_DEFAULTS[unitForm.item_type||"FUEL"]?.suggestions||[]).map(s=><option key={s} value={s}/>)}
                </datalist>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                <FieldInput label="Единица" value={unitForm.unit||""} onChange={e=>setUnitForm(p=>({...p,unit:e.target.value}))} T={T} placeholder="л"/>
                <FieldInput label="Вместимость" type="number" value={unitForm.capacity||""} onChange={e=>setUnitForm(p=>({...p,capacity:e.target.value}))} T={T}/>
                <FieldInput label="Мин. запас" type="number" value={unitForm.min_level||""} onChange={e=>setUnitForm(p=>({...p,min_level:e.target.value}))} T={T}/>
              </div>
              {unitErr && <div style={{fontSize:12,color:"#ef4444",fontWeight:600}}>⚠ {unitErr}</div>}
            </div>
            <div style={{display:"flex",gap:8,marginTop:18}}>
              <Btn variant="success" style={{flex:1}} onClick={saveUnit} T={T}>Сохранить</Btn>
              <Btn variant="ghost" onClick={()=>setUnitModal(null)} T={T}>Отмена</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── Transaction modal ── */}
      {txnModal && (
        <InvTxnModal
          txnType={txnModal}
          storageUnits={storageUnits.filter(u=>visibleOids.includes(u.oid))}
          eamAssets={eamAssets}
          objs={objs}
          onSave={txn => { setInvTxns(prev => [...prev, {...txn, id:genId()}]); setTxnModal(null); }}
          onClose={() => setTxnModal(null)}
          user={user}
          T={T}
        />
      )}

      {/* ── Header ── */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:T.blue,textTransform:"uppercase",letterSpacing:".18em",marginBottom:4}}>▌ СКЛАД</div>
          <div style={{fontSize:22,fontWeight:700,color:T.txt0}}>Управление запасами</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn variant="ghost" onClick={openAddUnit} T={T} style={{fontSize:12}}>+ Склад/резервуар</Btn>
          <Btn variant="primary" onClick={()=>setTxnModal("IN")} T={T} style={{fontSize:12,background:T.green,borderColor:T.green}}>↓ Приход</Btn>
          <Btn variant="primary" onClick={()=>setTxnModal("OUT")} T={T} style={{fontSize:12,background:T.amber,borderColor:T.amber}}>↑ Выдача</Btn>
          <Btn variant="ghost" onClick={()=>setTxnModal("ADJUSTMENT")} T={T} style={{fontSize:12}}>⚖ Корректировка</Btn>
        </div>
      </div>

      {/* ── KPI summary ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10,marginBottom:20}}>
        {kpis.map(k => {
          const pct = k.totalCapacity > 0 ? Math.round(k.totalBalance / k.totalCapacity * 100) : 0;
          const barColor = pct < 15 ? "#ef4444" : pct < 30 ? T.amber : k.color;
          return (
            <div key={k.type} style={{background:T.bg2,border:`1px solid ${k.lowCount>0?"#ef444440":T.border}`,borderTop:`3px solid ${k.color}`,borderRadius:6,padding:"14px 16px"}}>
              <div style={{fontSize:12,fontWeight:700,color:k.color,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>{k.icon} {k.label}</div>
              <div style={{fontSize:26,fontWeight:700,color:T.txt0,lineHeight:1,fontFamily:"'Inter',sans-serif"}}>{k.totalBalance.toLocaleString()}</div>
              <div style={{fontSize:12,color:T.txt2,marginBottom:10}}>{k.unitLabel} · {k.unitCount} ед. хранения</div>
              <div style={{height:4,background:T.border,borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:barColor,borderRadius:2,transition:"width 0.3s"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                <span style={{fontSize:12,color:T.txt2}}>{pct}% заполнено</span>
                {k.lowCount > 0 && <span style={{fontSize:12,color:"#ef4444",fontWeight:700}}>⚠ {k.lowCount} низкий запас</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Filters ── */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        {/* Tabs */}
        <div style={{display:"flex",gap:0,border:`1px solid ${T.border}`,borderRadius:5,overflow:"hidden"}}>
          {[["units","Склады"],["journal","Журнал"]].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{padding:"7px 16px",border:"none",background:tab===k?T.blue:"transparent",color:tab===k?"#fff":T.txt2,fontSize:12,fontWeight:700,cursor:"pointer",transition:"all 0.15s"}}>
              {l}
            </button>
          ))}
        </div>
        <div style={{marginLeft:8,display:"flex",gap:6,flexWrap:"wrap"}}>
          {[["all","Все объекты"],...objs.filter(o=>visibleOids.includes(o.id)).map(o=>[String(o.id),o.name])].map(([v,l])=>(
            <button key={v} onClick={()=>setFilterOid(v)} style={{padding:"5px 12px",borderRadius:4,border:`1px solid ${filterOid===v?T.blue:T.border}`,background:filterOid===v?`${T.blue}15`:"transparent",color:filterOid===v?T.blue:T.txt2,fontSize:12,fontWeight:600,cursor:"pointer"}}>{l}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:5,marginLeft:4}}>
          {[["all","Все"],["FUEL","ГСМ"],["EXPLOSIVE","ВВ"],["MATERIAL","ТМЦ"]].map(([v,l])=>(
            <button key={v} onClick={()=>setFilterType(v)} style={{padding:"5px 10px",borderRadius:4,border:`1px solid ${filterType===v?T.blue:T.border}`,background:filterType===v?`${T.blue}15`:"transparent",color:filterType===v?T.blue:T.txt2,fontSize:12,fontWeight:600,cursor:"pointer"}}>{l}</button>
          ))}
        </div>
      </div>

      {/* ── UNITS TAB ── */}
      {tab === "units" && (
        <div>
          {filteredUnits.length === 0 ? (
            <Card style={{padding:32,textAlign:"center"}} T={T}>
              <div style={{fontSize:32,marginBottom:12}}>🏗</div>
              <div style={{fontSize:13,color:T.txt2,marginBottom:16}}>Нет складов по выбранному фильтру</div>
              <Btn variant="primary" onClick={openAddUnit} T={T} style={{fontSize:12}}>+ Добавить склад</Btn>
            </Card>
          ) : (
            // Group by object
            objs.filter(o=>visibleOids.includes(o.id)).map(obj => {
              const objUnits = filteredUnits.filter(u => u.oid === obj.id);
              if (!objUnits.length) return null;
              return (
                <div key={obj.id} style={{marginBottom:24}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.txt0,textTransform:"uppercase",letterSpacing:".1em",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
                    <span>📍 {obj.name}</span>
                    <span style={{fontSize:12,color:T.txt2,fontWeight:400,textTransform:"none",letterSpacing:0}}>({objUnits.length} ед. хранения)</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
                    {objUnits.map(u => {
                      const balance = calcBalance(u.id);
                      const pct = u.capacity > 0 ? Math.round(balance / u.capacity * 100) : 0;
                      const cfg = INV_TYPE_CFG[u.item_type] || INV_TYPE_CFG.MATERIAL;
                      const isLow = balance <= u.min_level;
                      const isEmpty = balance <= 0;
                      const barColor = isEmpty ? "#ef4444" : isLow ? T.amber : cfg.color;
                      const lastTxns = invTxns.filter(t=>t.su_id===u.id).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,1);
                      return (
                        <div key={u.id} style={{background:T.bg2,border:`1px solid ${isEmpty?"#ef444450":isLow?"#d4881840":T.border}`,borderRadius:8,overflow:"hidden",boxShadow:`0 2px 8px ${T.cardSh}`}}>
                          <div style={{height:3,background:`linear-gradient(90deg,${barColor},${barColor}60)`}}/>
                          <div style={{padding:"14px 16px"}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                              <div>
                                <div style={{fontSize:14,fontWeight:700,color:T.txt0}}>{u.name}</div>
                                <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
                                  <span style={{fontSize:12,fontWeight:700,color:cfg.color,background:`${cfg.color}15`,padding:"1px 6px",borderRadius:3}}>{cfg.icon} {cfg.label}</span>
                                  <span style={{fontSize:12,color:T.txt2}}>{u.item_name}</span>
                                </div>
                              </div>
                              <div style={{display:"flex",gap:4}} onClick={e=>e.stopPropagation()}>
                                <button onClick={()=>openEditUnit(u)} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:4,cursor:"pointer",fontSize:12,color:T.txt2,padding:"3px 7px"}}>✏</button>
                                <button onClick={()=>setDeleteConf(u.id)} style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:4,cursor:"pointer",fontSize:12,color:"#f87171",padding:"3px 7px"}}>🗑</button>
                              </div>
                            </div>

                            {/* Balance + bar */}
                            <div style={{marginBottom:10}}>
                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5}}>
                                <div style={{fontSize:26,fontWeight:700,color:isEmpty?"#ef4444":isLow?T.amber:T.txt0,fontFamily:"'Inter',sans-serif",lineHeight:1}}>
                                  {balance.toLocaleString()}
                                  <span style={{fontSize:13,fontWeight:400,color:T.txt2,marginLeft:4}}>{u.unit}</span>
                                </div>
                                <div style={{fontSize:12,color:T.txt2}}>{pct}% / {u.capacity.toLocaleString()} {u.unit}</div>
                              </div>
                              <div style={{height:6,background:T.border,borderRadius:3,overflow:"hidden"}}>
                                <div style={{height:"100%",width:`${Math.min(Math.max(pct,0),100)}%`,background:barColor,borderRadius:3,transition:"width 0.3s"}}/>
                              </div>
                              {isLow && !isEmpty && <div style={{fontSize:12,color:T.amber,fontWeight:700,marginTop:4}}>⚠ Низкий запас (мин. {u.min_level.toLocaleString()} {u.unit})</div>}
                              {isEmpty && <div style={{fontSize:12,color:"#ef4444",fontWeight:700,marginTop:4}}>⛔ Остаток пустой</div>}
                            </div>

                            {/* Last txn */}
                            {lastTxns.length > 0 && (
                              <div style={{fontSize:12,color:T.txt2,borderTop:`1px solid ${T.border}`,paddingTop:8,display:"flex",justifyContent:"space-between"}}>
                                <span>Последняя операция: {INV_TXN_CFG[lastTxns[0].txn_type]?.label}</span>
                                <span>{lastTxns[0].date}</span>
                              </div>
                            )}

                            {/* Quick action buttons */}
                            <div style={{display:"flex",gap:6,marginTop:10}}>
                              <button onClick={()=>setTxnModal("IN")} style={{flex:1,padding:"6px",borderRadius:4,border:`1px solid ${T.green}40`,background:`${T.green}10`,color:T.green,fontSize:12,fontWeight:700,cursor:"pointer"}}>↓ Приход</button>
                              <button onClick={()=>setTxnModal("OUT")} style={{flex:1,padding:"6px",borderRadius:4,border:`1px solid ${T.amber}40`,background:`${T.amber}10`,color:T.amber,fontSize:12,fontWeight:700,cursor:"pointer"}}>↑ Выдача</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── JOURNAL TAB ── */}
      {tab === "journal" && (
        <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:8,overflow:"hidden"}}>
          {filteredTxns.length === 0 ? (
            <div style={{padding:32,textAlign:"center",color:T.txt2,fontSize:13}}>Операций нет. Добавьте первый приход.</div>
          ) : (
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:750}}>
                <thead>
                  <tr style={{background:T.rowHdr}}>
                    {["Тип","Склад / Резервуар","Объект","Ресурс","Кол-во","Техника (EAM)","Документ","Дата","Кто"].map(h=>(
                      <th key={h} style={{padding:"9px 12px",textAlign:"left",fontSize:12,fontWeight:700,color:T.txt2,textTransform:"uppercase",letterSpacing:".05em",borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTxns.map((t,i) => {
                    const su  = storageUnits.find(u=>u.id===t.su_id);
                    const obj = objs.find(o=>o.id===su?.oid);
                    const cfg = INV_TXN_CFG[t.txn_type] || INV_TXN_CFG.IN;
                    const asset = eamAssets.find(n=>n.id===t.asset_id);
                    const sign = t.txn_type === "IN" ? "+" : t.txn_type === "OUT" ? "−" : "±";
                    return (
                      <tr key={t.id} style={{background:i%2?T.rowAlt:"transparent"}}>
                        <td style={{padding:"8px 12px"}}>
                          <span style={{fontSize:12,fontWeight:700,color:cfg.color,background:`${cfg.color}15`,padding:"2px 8px",borderRadius:3,whiteSpace:"nowrap"}}>{cfg.label}</span>
                        </td>
                        <td style={{padding:"8px 12px",fontSize:12,color:T.txt0,fontWeight:600}}>{su?.name||"—"}</td>
                        <td style={{padding:"8px 12px",fontSize:12,color:T.txt2}}>{obj?.name||"—"}</td>
                        <td style={{padding:"8px 12px",fontSize:12,color:T.txt1}}>{su?.item_name||"—"}</td>
                        <td style={{padding:"8px 12px",fontSize:13,fontWeight:700,color:cfg.color,fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap"}}>
                          {sign}{t.qty.toLocaleString()} <span style={{fontSize:12,color:T.txt2,fontWeight:400}}>{su?.unit||""}</span>
                        </td>
                        <td style={{padding:"8px 12px",fontSize:12,color:t.asset_id?T.cyan:T.txt2}}>
                          {asset ? `${asset.name}` : t.asset_id ? t.asset_id : "—"}
                        </td>
                        <td style={{padding:"8px 12px",fontSize:12,color:T.txt2}}>{t.doc_ref||"—"}</td>
                        <td style={{padding:"8px 12px",fontSize:12,color:T.txt2,whiteSpace:"nowrap"}}>{t.date}</td>
                        <td style={{padding:"8px 12px",fontSize:12,color:T.txt2}}>{t.recorded_by||"—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Transaction modal ─────────────────────────────────────────────────────────
function InvTxnModal({ txnType, storageUnits, eamAssets, objs, onSave, onClose, user, T }) {
  const cfg = INV_TXN_CFG[txnType];
  const [suId,     setSuId]     = useState(storageUnits[0]?.id || "");
  const [qty,      setQty]      = useState("");
  const [date,     setDate]     = useState(()=>new Date().toISOString().slice(0,10));
  const [assetId,  setAssetId]  = useState("");
  const [docRef,   setDocRef]   = useState("");
  const [note,     setNote]     = useState("");
  const [err,      setErr]      = useState("");

  const su = storageUnits.find(u=>u.id===suId);
  const obj = objs.find(o=>o.id===su?.oid);

  function handleSave() {
    if (!suId) { setErr("Выберите склад"); return; }
    if (!qty || isNaN(Number(qty)) || Number(qty) <= 0) { setErr("Введите корректное количество"); return; }
    if (txnType === "OUT" && !assetId) { setErr("Укажите технику (EAM) — обязательное поле"); return; }
    setErr("");
    onSave({
      txn_type:    txnType,
      su_id:       suId,
      qty:         Number(qty),
      date,
      asset_id:    assetId || null,
      doc_ref:     docRef.trim() || null,
      note:        note.trim() || null,
      recorded_by: user?.name || "—",
    });
  }

  // Group storage units by object for cleaner select
  const groupedUnits = objs.map(o => ({
    obj: o,
    units: storageUnits.filter(u=>u.oid===o.id)
  })).filter(g=>g.units.length>0);

  return (
    <div style={{position:"fixed",inset:0,background:T.modalBg,zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderLeft:`4px solid ${cfg.color}`,borderRadius:8,width:"100%",maxWidth:500,padding:24}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:T.txt0}}>{cfg.label}</div>
            {su && <div style={{fontSize:12,color:cfg.color,marginTop:2}}>{su.name} · {su.item_name} · остаток: {Math.max(0,storageUnits.find(u=>u.id===suId) ? 0 : 0).toLocaleString()} {su.unit}</div>}
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:T.txt2}}>×</button>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* Склад */}
          <div>
            <label style={{fontSize:12,fontWeight:700,color:T.txt2,textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:6}}>Склад / Резервуар</label>
            <select value={suId} onChange={e=>setSuId(e.target.value)}
              style={{width:"100%",padding:"8px 12px",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:4,color:T.txt0,fontSize:13,outline:"none"}}>
              {groupedUnits.map(g=>(
                <optgroup key={g.obj.id} label={g.obj.name}>
                  {g.units.map(u=><option key={u.id} value={u.id}>{u.name} ({u.item_name})</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:T.txt2,textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:6}}>
                Количество {su ? `(${su.unit})` : ""}
              </label>
              <input type="text" inputMode="numeric" value={qty} onChange={e=>setQty(e.target.value)} placeholder="0"
                style={{width:"100%",padding:"8px 12px",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:4,color:T.txt0,fontSize:13,outline:"none",fontFamily:"'JetBrains Mono',monospace"}}/>
            </div>
            <FieldInput label="Дата" type="date" value={date} onChange={e=>setDate(e.target.value)} T={T}/>
          </div>

          {/* Техника EAM — обязательно для OUT */}
          {txnType === "OUT" && (
            <div>
              <label style={{fontSize:12,fontWeight:700,color:T.txt2,textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:6}}>
                Техника (EAM) <span style={{color:"#ef4444"}}>*</span>
              </label>
              <select value={assetId} onChange={e=>setAssetId(e.target.value)}
                style={{width:"100%",padding:"8px 12px",background:T.inputBg,border:`1px solid ${assetId?T.border:"#ef444450"}`,borderRadius:4,color:T.txt0,fontSize:13,outline:"none"}}>
                <option value="">— Выберите технику —</option>
                {eamAssets.map(a=><option key={a.id} value={a.id}>{a.name} {a.serialNo ? `(${a.serialNo})` : ""}</option>)}
              </select>
              <div style={{fontSize:12,color:T.txt2,marginTop:4}}>Каждая выдача должна быть привязана к единице техники</div>
            </div>
          )}

          {/* Документ-основание */}
          <FieldInput label={txnType==="IN" ? "Накладная / документ" : "Документ-основание"} value={docRef} onChange={e=>setDocRef(e.target.value)} T={T} placeholder={txnType==="IN" ? "№ накладной" : "Заявка, путёвка..."}/>

          {/* Примечание */}
          {txnType === "ADJUSTMENT" && (
            <div>
              <label style={{fontSize:12,fontWeight:700,color:T.txt2,textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:6}}>
                Обоснование корректировки <span style={{color:"#ef4444"}}>*</span>
              </label>
              <textarea value={note} onChange={e=>setNote(e.target.value)} rows={3} placeholder="Причина расхождения..."
                style={{width:"100%",padding:"8px 12px",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:4,color:T.txt0,fontSize:13,outline:"none",resize:"vertical",fontFamily:"'Inter',sans-serif"}}/>
            </div>
          )}

          {err && <div style={{fontSize:12,color:"#ef4444",fontWeight:600,padding:"8px 12px",background:"rgba(239,68,68,0.08)",borderRadius:4}}>⚠ {err}</div>}
        </div>

        <div style={{display:"flex",gap:8,marginTop:18}}>
          <Btn variant="primary" style={{flex:1,background:cfg.color,borderColor:cfg.color}} onClick={handleSave} T={T}>
            {cfg.label}
          </Btn>
          <Btn variant="ghost" onClick={onClose} T={T}>Отмена</Btn>
        </div>
      </div>
    </div>
  );
}

const INIT_EXPLOSIVES = [];

function ExplosivesPage({ explosives, setExplosives, objs, reps, user, T }) {
  const isForeman = user?.role === "foreman";
  // Форман видит только свои участки
  const visibleOids = isForeman
    ? (user.oids === "all" ? objs.map(o=>o.id) : user.oids)
    : objs.map(o => o.id);
  const visibleObjs  = objs.filter(o => visibleOids.includes(o.id));
  const visibleExpl  = explosives.filter(t => visibleOids.includes(t.oid));

  const [showForm, setShowForm] = useState(false);
  const [filterOid, setFilterOid] = useState("all"); // "all" | oid string

  // Фильтр по участку (для журнала)
  const filteredExpl = filterOid === "all" ? visibleExpl : visibleExpl.filter(t => t.oid === Number(filterOid));

  // Compute balances per site per explosive type (только видимые)
  const balances = {};
  visibleExpl.forEach(txn => {
    const key = `${txn.oid}__${txn.exp_type}`;
    if (!balances[key]) balances[key] = { oid: txn.oid, exp_type: txn.exp_type, qty: 0 };
    if (txn.txn_type === "receipt") balances[key].qty += txn.qty;
    else balances[key].qty -= txn.qty;
  });
  const balList = Object.values(balances).filter(b => b.qty !== 0);

  // KPIs (видимые операции)
  const totalIn  = visibleExpl.filter(t=>t.txn_type==="receipt").reduce((s,t)=>s+t.qty,0);
  const totalOut = visibleExpl.filter(t=>t.txn_type!=="receipt").reduce((s,t)=>s+t.qty,0);
  const totalBalance = totalIn - totalOut;

  // Auto-consumption from approved reports (только видимые участки)
  const autoConsumed = reps.filter(r=>r.status==="approved"&&r.fuel_kg>0&&visibleOids.includes(r.oid))
    .reduce((s,r)=>s+r.fuel_kg,0);

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:600, color:T.txt0 }}>Склад ВВ</div>
          <div style={{ fontSize:12, color:T.txt2, marginTop:2 }}>
            Учёт взрывчатых веществ и средств взрывания
            {isForeman && <span style={{ marginLeft:8, color:T.amber, fontWeight:600 }}>· {visibleObjs.map(o=>o.name).join(", ")}</span>}
          </div>
        </div>
        <button onClick={() => setShowForm(true)}
          style={{ padding:"9px 18px", borderRadius:6, border:"none", background:T.amber, color:"#000", fontSize:13, fontWeight:700, cursor:"pointer" }}>
          + Операция
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:10, marginBottom:20 }}>
        {[
          ["Приход", totalIn.toLocaleString(), T.green, "за всё время"],
          ["Расход", totalOut.toLocaleString(), T.amber, "выдано + списано"],
          ["Остаток", totalBalance.toLocaleString(), totalBalance < 0 ? "#ef4444" : T.blue, "расчётный"],
          ["Факт взрывов", autoConsumed.toLocaleString()+" кг", T.violet, "из утверждённых отчётов"],
        ].map(([lbl, val, color, sub]) => (
          <div key={lbl} style={{ background:T.bg2, border:`1px solid ${T.border}`, borderRadius:6, padding:"12px 16px" }}>
            <div style={{ fontSize:12, fontWeight:700, color, textTransform:"uppercase", letterSpacing:".1em", marginBottom:4 }}>{lbl}</div>
            <div style={{ fontSize:22, fontWeight:700, color, fontFamily:"'Inter',sans-serif", lineHeight:1, marginBottom:2 }}>{val}</div>
            <div style={{ fontSize:12, color:T.txt2 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Balances by site — сгруппированы по участку */}
      {balList.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.txt0, marginBottom:10 }}>Остатки по участкам</div>
          {visibleObjs.map(obj => {
            const objBals = balList.filter(b => b.oid === obj.id);
            if (!objBals.length) return null;
            return (
              <div key={obj.id} style={{ marginBottom:12 }}>
                <div style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", letterSpacing:".07em", marginBottom:6 }}>
                  📍 {obj.name}
                </div>
                {/* Группируем по категориям внутри участка */}
                {EXP_CATALOG.map(cat => {
                  const catBals = objBals.filter(b => cat.items.includes(b.exp_type));
                  if (!catBals.length) return null;
                  return (
                    <div key={cat.category} style={{ marginBottom:8 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:cat.color, textTransform:"uppercase", letterSpacing:".06em", marginBottom:4, paddingLeft:4, borderLeft:`2px solid ${cat.color}` }}>
                        {cat.category}
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:6 }}>
                        {catBals.map(b => (
                          <div key={`${b.oid}_${b.exp_type}`}
                            style={{ background:T.bg2, border:`1px solid ${b.qty < 0 ? "#ef444440" : T.border}`, borderRadius:6, padding:"8px 12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <div style={{ fontSize:12, color:T.txt1, flex:1, paddingRight:8 }}>{b.exp_type}</div>
                            <div style={{ textAlign:"right" }}>
                              <div style={{ fontSize:16, fontWeight:700, color: b.qty < 0 ? "#ef4444" : b.qty < 10 ? T.amber : T.green, fontFamily:"'Inter',sans-serif", lineHeight:1 }}>
                                {b.qty.toLocaleString()}
                              </div>
                              <div style={{ fontSize:12, color:T.txt2 }}>{cat.unit}</div>
                            </div>
                            {b.qty < 0 && <div style={{ fontSize:12, color:"#ef4444", marginTop:2 }}>⚠</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Фильтр по участку для журнала */}
      <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap", alignItems:"center" }}>
        <span style={{ fontSize:13, fontWeight:700, color:T.txt0 }}>📋 Журнал операций</span>
        <div style={{ marginLeft:"auto", display:"flex", gap:5, flexWrap:"wrap" }}>
          {[["all","Все"],  ...visibleObjs.map(o=>[String(o.id),o.name])].map(([v,lbl]) => (
            <button key={v} onClick={() => setFilterOid(v)}
              style={{ padding:"4px 12px", borderRadius:4, border:`1px solid ${filterOid===v ? T.amber : T.border}`,
                background: filterOid===v ? `${T.amber}18` : "transparent",
                color: filterOid===v ? T.amber : T.txt2, fontSize:12, fontWeight:600, cursor:"pointer" }}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction log */}
      <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden" }}>
        {filteredExpl.length === 0 ? (
          <div style={{ padding:32, textAlign:"center", color:T.txt2, fontSize:13 }}>Операций нет. Добавьте первую запись прихода.</div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:700 }}>
              <thead>
                <tr style={{ background:T.rowHdr }}>
                  {["Тип","Участок","Категория","ВВ / СВ","Кол-во","Сертификат","Паспорт БВР","Дата","Кто"].map(h => (
                    <th key={h} style={{ padding:"9px 12px", textAlign:"left", fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", letterSpacing:".05em", borderBottom:`1px solid ${T.border}`, whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...filteredExpl].sort((a,b)=>b.date.localeCompare(a.date)).map((t,i) => {
                  const obj = objs.find(o=>o.id===t.oid);
                  const txnColors = { receipt:T.green, issuance:T.amber, return:T.blue, writeoff:"#ef4444" };
                  const txnLabels = { receipt:"Приход", issuance:"Выдача", return:"↩ Возврат", writeoff:"🗑 Списание" };
                  const catInfo = expCatalogLookup(t.exp_type);
                  return (
                    <tr key={t.id} style={{ background:i%2 ? T.rowAlt : "transparent" }}>
                      <td style={{ padding:"8px 12px" }}>
                        <span style={{ fontSize:12, fontWeight:700, color:txnColors[t.txn_type] }}>{txnLabels[t.txn_type]}</span>
                        {t.auto && <span style={{ marginLeft:5, fontSize:12, color:T.txt2, fontStyle:"italic" }}>авто</span>}
                      </td>
                      <td style={{ padding:"8px 12px", fontSize:12, color:T.txt1 }}>{obj?.name||"—"}</td>
                      <td style={{ padding:"8px 12px" }}>
                        <span style={{ fontSize:12, fontWeight:700, color:catInfo.color, background:`${catInfo.color}15`, padding:"2px 6px", borderRadius:3, whiteSpace:"nowrap" }}>
                          {catInfo.category.split("—")[0].trim().substring(0,18)}
                        </span>
                      </td>
                      <td style={{ padding:"8px 12px", fontSize:12, color:T.txt0, fontWeight:600, maxWidth:200 }}>{t.exp_type}</td>
                      <td style={{ padding:"8px 12px", fontSize:13, fontWeight:700, color:txnColors[t.txn_type], fontFamily:"'Inter',sans-serif", whiteSpace:"nowrap" }}>
                        {t.txn_type==="receipt" ? "+" : "−"}{t.qty.toLocaleString()} <span style={{ fontSize:12, color:T.txt2, fontWeight:400 }}>{catInfo.unit}</span>
                      </td>
                      <td style={{ padding:"8px 12px", fontSize:12, color:T.txt2 }}>{t.cert_no||"—"}</td>
                      <td style={{ padding:"8px 12px", fontSize:12, color:T.txt2 }}>{t.passport_ref||"—"}</td>
                      <td style={{ padding:"8px 12px", fontSize:12, color:T.txt2 }}>{t.date}</td>
                      <td style={{ padding:"8px 12px", fontSize:12, color:T.txt2 }}>{t.recorded_by||"—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <ExplosiveTxnModal
          objs={visibleObjs}
          defaultOid={isForeman && visibleObjs.length === 1 ? visibleObjs[0].id : undefined}
          onSave={txn => { setExplosives(prev=>[...prev, {...txn, id:genId()}]); setShowForm(false); }}
          onClose={() => setShowForm(false)}
          T={T}
        />
      )}
    </div>
  );
}

function ExplosiveTxnModal({ objs, defaultOid, onSave, onClose, T }) {
  const [txnType,  setTxnType]  = useState("receipt");
  const [oid,      setOid]      = useState(defaultOid || objs[0]?.id || "");
  const [expCat,   setExpCat]   = useState(EXP_CATALOG[0].category);
  const [expType,  setExpType]  = useState(EXP_CATALOG[0].items[0]);
  const [qty,      setQty]      = useState("");
  const [date,     setDate]     = useState(() => new Date().toISOString().slice(0, 10));
  const [certNo,   setCertNo]   = useState("");
  const [passRef,  setPassRef]  = useState("");
  const [by,       setBy]       = useState("");

  const txnColors = { receipt:T.green, issuance:T.amber, return:T.blue, writeoff:"#ef4444" };
  const txnLabels = { receipt:"Приход", issuance:"Выдача", return:"↩ Возврат", writeoff:"🗑 Списание" };

  const activeCat = EXP_CATALOG.find(c => c.category === expCat) || EXP_CATALOG[0];

  function changeCat(cat) {
    setExpCat(cat.category);
    setExpType(cat.items[0]);
  }

  return (
    <div style={{ position:"fixed", inset:0, background:T.modalBg, zIndex:1000, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:20, overflowY:"auto" }}>
      <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderRadius:8, width:"100%", maxWidth:540, marginTop:20, marginBottom:40 }}>
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:T.cardSh }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.txt0 }}>💣 Операция со складом ВВ</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:T.txt2, fontSize:18, cursor:"pointer" }}>×</button>
        </div>
        <div style={{ padding:"16px 18px", display:"flex", flexDirection:"column", gap:12 }}>
          {/* Тип операции */}
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", letterSpacing:".08em", marginBottom:6 }}>Тип операции</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
              {Object.entries(txnLabels).map(([k,v]) => (
                <button key={k} onClick={() => setTxnType(k)}
                  style={{ padding:"7px 10px", borderRadius:5, border:`1.5px solid ${txnType===k ? txnColors[k] : T.border}`,
                    background: txnType===k ? `${txnColors[k]}18` : "transparent",
                    color: txnType===k ? txnColors[k] : T.txt2, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Участок */}
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", letterSpacing:".08em", marginBottom:5 }}>Участок</div>
            <select value={oid} onChange={e=>setOid(Number(e.target.value))}
              style={{ width:"100%", padding:"8px 10px", background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:4, color:T.txt0, fontSize:13, outline:"none" }}>
              {objs.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>

          {/* Категория ВВ/СВ — горизонтальный скролл */}
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", letterSpacing:".08em", marginBottom:6 }}>Категория</div>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              {EXP_CATALOG.map(cat => (
                <button key={cat.category} onClick={() => changeCat(cat)}
                  style={{ padding:"5px 10px", borderRadius:4, border:`1.5px solid ${expCat===cat.category ? cat.color : T.border}`,
                    background: expCat===cat.category ? `${cat.color}18` : T.bg3,
                    color: expCat===cat.category ? cat.color : T.txt2,
                    fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
                  {cat.category.split("—")[0].trim().substring(0, 22)}
                </button>
              ))}
            </div>
          </div>

          {/* Наименование ВВ/СВ */}
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.txt2, textTransform:"uppercase", letterSpacing:".08em", marginBottom:5 }}>
              Наименование · <span style={{ color:activeCat.color }}>{activeCat.category}</span>
            </div>
            <select value={expType} onChange={e=>setExpType(e.target.value)}
              style={{ width:"100%", padding:"8px 10px", background:T.inputBg, border:`1.5px solid ${activeCat.color}40`, borderRadius:4, color:T.txt0, fontSize:13, outline:"none" }}>
              {activeCat.items.map(e=><option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          {/* Количество + единица + дата */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 1fr", gap:10, alignItems:"end" }}>
            <FieldInput label={`Количество, ${activeCat.unit}`} value={qty} onChange={e=>setQty(e.target.value)} placeholder="0" T={T} />
            <div style={{ padding:"8px 10px", background:T.bg3, border:`1px solid ${T.border}`, borderRadius:4, textAlign:"center", fontSize:13, fontWeight:700, color:activeCat.color, height:38, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {activeCat.unit}
            </div>
            <FieldInput label="Дата" type="date" value={date} onChange={e=>setDate(e.target.value)} T={T} />
          </div>

          {txnType === "receipt" && (
            <FieldInput label="№ сертификата" value={certNo} onChange={e=>setCertNo(e.target.value)} placeholder="СЕР-2025-001" T={T} />
          )}
          {(txnType === "issuance" || txnType === "writeoff") && (
            <FieldInput label="Ссылка на паспорт БВР" value={passRef} onChange={e=>setPassRef(e.target.value)} placeholder="Блок 14-СВ / 2025-06-01" T={T} />
          )}
          <FieldInput label="Ответственный" value={by} onChange={e=>setBy(e.target.value)} placeholder="Иванов Н.С." T={T} />
        </div>
        <div style={{ padding:"12px 18px", borderTop:`1px solid ${T.border}`, display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"8px 16px", borderRadius:5, border:`1px solid ${T.border}`, background:"transparent", color:T.txt2, fontSize:12, fontWeight:600, cursor:"pointer" }}>Отмена</button>
          <button onClick={() => onSave({ txn_type:txnType, oid:Number(oid), exp_type:expType, qty:toNum(qty), date, cert_no:certNo, passport_ref:passRef, recorded_by:by })}
            disabled={!qty||!date}
            style={{ padding:"8px 22px", borderRadius:5, border:"none", background:(!qty||!date)?T.bg3:txnColors[txnType], color:(!qty||!date)?T.txt2:"#000", fontSize:12, fontWeight:700, cursor:(!qty||!date)?"not-allowed":"pointer" }}>
            Записать
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FOREMAN MAINTENANCE PAGE ─────────────────────────────────────────────────
// Начальник вахты видит технику своего объекта и может записывать ТО
function ForemanMaintenancePage({ user, objs, rigs, maintRecords, setMaintRecords, passports, setPassports, meters, T }) {
  // Объекты форманa
  const myObjs = user.oids === "all" ? objs : objs.filter(o => user.oids.includes(o.id));
  const [selObjId, setSelObjId] = useState(myObjs[0]?.id || null);
  const [selRigId, setSelRigId] = useState(null);

  // Буровые на объекте из INIT_RIGS
  const objRigs = rigs.filter(r => Number(r.o) === Number(selObjId));

  // Когда меняем объект — сбрасываем выбранный станок
  function selectObj(id) { setSelObjId(id); setSelRigId(null); }

  const selRig = objRigs.find(r => r.id === selRigId);

  // Найти nodeId по имени станка (для maintRecords)
  // maintRecords ключ = nodeId (EAM), но у форманов нет nodes.
  // Используем строку "rig_<id>" как ключ — изолировано от EAM, но едино внутри системы
  const rigKey = selRig ? `rig_${selRig.id}` : null;

  // Для паспортных данных ищем по совпадению имени в passports
  const rigPassport = selRig ? Object.values(passports).find(p => p?.model === selRig.n || p?.name === selRig.n) || {} : {};
  const rigHours = rigPassport.total_hours || 0;

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
        <div style={{background:T.amber,color:"#000",padding:"4px 12px",borderRadius:3,fontSize:12,fontWeight:700,textTransform:"uppercase"}}>
          НАРЯДЧИК — ТО ТЕХНИКИ
        </div>
        <div style={{fontSize:12,color:T.txt2}}>График и история технического обслуживания</div>
      </div>

      {/* Выбор объекта */}
      {myObjs.length > 1 && (
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
          {myObjs.map(o => (
            <button key={o.id} onClick={() => selectObj(o.id)}
              style={{padding:"6px 16px",borderRadius:5,border:`1px solid ${selObjId===o.id?T.amber:T.border}`,
                background:selObjId===o.id?`${T.amber}20`:"transparent",
                color:selObjId===o.id?T.amber:T.txt1,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
              {o.name}
            </button>
          ))}
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"220px 1fr",gap:14,alignItems:"start"}}>

        {/* Список буровых */}
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          <div style={{fontSize:12,fontWeight:700,color:T.txt2,textTransform:"uppercase",marginBottom:4,padding:"0 2px"}}>
            Буровые · {objRigs.length}
          </div>
          {objRigs.length === 0 ? (
            <Card T={T} style={{padding:16,textAlign:"center"}}>
              <div style={{fontSize:12,color:T.txt2}}>Нет техники</div>
            </Card>
          ) : objRigs.map(r => {
            const recs = maintRecords[`rig_${r.id}`] || [];
            const lastRec = recs.sort((a,b)=>b.date.localeCompare(a.date))[0];
            const pp = Object.values(passports).find(p => p?.model === r.n) || {};
            const curH = pp.total_hours || 0;
            const lastH = lastRec ? parseFloat(lastRec.hours) : curH - (curH % TO_INTERVAL_HRS);
            const rem = Math.max(0, lastH + TO_INTERVAL_HRS - curH);
            const urgColor = rem <= 20 ? "#ef4444" : rem <= 50 ? T.amber : T.green;
            const isSelected = selRigId === r.id;
            return (
              <div key={r.id} onClick={() => setSelRigId(r.id)}
                style={{padding:"10px 12px",borderRadius:6,border:`1px solid ${isSelected?T.amber:T.border}`,
                  background:isSelected?`${T.amber}12`:T.bg2,cursor:"pointer",transition:"all 0.15s"}}>
                <div style={{fontSize:13,fontWeight:700,color:T.txt0,marginBottom:4}}>{r.n}</div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{fontSize:12,color:T.txt2}}>{recs.length} записей</div>
                  <div style={{fontSize:12,fontWeight:700,color:urgColor}}>
                    {rem > 0 ? `−${rem} мч` : "⚠ ТО"}
                  </div>
                </div>
                {/* Mini progress bar */}
                <div style={{height:3,background:T.border,borderRadius:2,marginTop:5,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${Math.min(100,Math.round((curH-lastH)/TO_INTERVAL_HRS*100))}%`,background:urgColor,borderRadius:2}}/>
                </div>
              </div>
            );
          })}
        </div>

        {/* Детали выбранного станка */}
        <div>
          {!selRig ? (
            <Card T={T} style={{padding:40,textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:12}}>🔧</div>
              <div style={{fontSize:14,color:T.txt2}}>Выберите станок для просмотра ТО</div>
            </Card>
          ) : (
            <Card T={T} style={{padding:0,overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,background:T.bg3,display:"flex",alignItems:"center",gap:10}}>
                <div style={{fontSize:14,fontWeight:700,color:T.txt0}}>{selRig.n}</div>
                <div style={{fontSize:12,color:T.txt2,padding:"2px 8px",borderRadius:3,background:`${T.amber}15`,border:`1px solid ${T.amber}40`,color:T.amber,fontWeight:600}}>
                  {objs.find(o=>o.id===Number(selObjId))?.name}
                </div>
              </div>
              <div style={{padding:"16px"}}>
                <AssetMaintenanceTab
                  nodeId={rigKey}
                  nodeName={selRig.n}
                  passport={{ total_hours: rigHours, toSchedule: rigPassport.toSchedule }}
                  meters={{ [rigKey]: { current: rigHours } }}
                  maintRecords={maintRecords}
                  setMaintRecords={setMaintRecords}
                  setPassports={null}
                  user={user} T={T}
                />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [isDark, setIsDark] = useState(false);
  const T = isDark ? DARK : LIGHT;

  const [user,    setUser]    = useState(null);
  const [subPage, setSubPage] = useState("dash");
  const [view,    setView]    = useState({ type: "dash" }); // type: dash | obj | rig

  const [objs,       setObjs]       = useState(INIT_OBJS);
  const [rigs,       setRigs]       = useState(INIT_RIGS);
  const [users,      setUsers]      = useState(INIT_USERS);
  const [reps,       setReps]       = useState(INIT_REPS);
  const [plans,      setPlans]      = useState(INIT_PLANS);
  const [dbLoading,  setDbLoading]  = useState(true);

  // ── Загрузка данных из Supabase при старте ──────────────────
  useEffect(() => {
    async function loadFromDB() {
      try {
        const [dbObjs, dbRigs, dbReps, dbPlans, dbKtg] = await Promise.all([
          getObjects(),
          getRigs(),
          getReports(),
          getPlans(),
          getKtgPlans(),
        ]);
        if (dbObjs?.length)  setObjs(dbObjs);
        if (dbRigs?.length)  setRigs(prev => { const localIds = new Set(prev.map(r => r.id)); const localNames = new Set(prev.map(r => r.n + "_" + r.o)); const dbOnly = dbRigs.filter(r => !localIds.has(r.id) && !localNames.has(r.n + "_" + r.o)); return dbOnly.length > 0 ? [...prev, ...dbOnly] : prev; });
        if (dbReps?.length)  setReps(prev => { const dbIds = new Set(dbReps.map(r => r.id)); const localOnly = prev.filter(r => !dbIds.has(r.id)); return [...localOnly, ...dbReps]; });
        if (dbPlans?.length) setPlans(dbPlans);
        if (dbKtg?.length)   setKtgPlans(dbKtg);
      } catch (e) {
        console.warn("Supabase недоступен, работаем локально:", e.message);
      } finally {
        setDbLoading(false);
      }
    }
    loadFromDB();
  }, []);
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
  const [blastPassports, setBlastPassports] = useState(INIT_BLAST_PASSPORTS);
  const [maintLogs,      setMaintLogs]      = useState(INIT_MAINT_LOGS);
  const [maintRecords,   setMaintRecords]   = useState({});  // { nodeId: [{id,date,type,hours,note,by}] }
  const [explosives,     setExplosives]     = useState(INIT_EXPLOSIVES);
  const [storageUnits,   setStorageUnits]   = useState(INIT_STORAGE_UNITS);
  const [invTxns,        setInvTxns]        = useState(INIT_INV_TXNS);

  const [downtimeLog,      setDowntimeLog]      = useState(INIT_DOWNTIME_LOG);

  const pending = reps.filter((r) => r.status === "submitted").length + ktgPlans.filter(p=>p.status==="SUBMITTED").length;

  function goPage(p) { setSubPage(p); setView({ type: "dash" }); }
  function goDash()  { setSubPage("dash"); setView({ type: "dash" }); }

  function handleLogin(u) { setUser(u); setSubPage("dash"); setView({ type: "dash" }); }
  function handleLogout()  { setUser(null); setSubPage("dash"); setView({ type: "dash" }); }

  // ── Отправка отчёта в Supabase ──────────────────────────────
  async function handleSubmitReport(rep) {
    try {
      const saved = await apiSubmitReport(rep, user?.id);
      setReps(prev => [...prev, saved]);
    } catch (e) {
      // Fallback: сохраняем локально если БД недоступна
      console.warn("DB error, saving locally:", e.message);
      setReps(prev => [...prev, rep]);
    }
  }

  async function handleUpdateReport(rep) {
    try {
      const saved = await apiUpdateReport(rep, user?.id);
      setReps(prev => prev.map(x => x.id === rep.id ? saved : x));
    } catch (e) {
      console.warn("Update DB error:", e.message);
      setReps(prev => prev.map(x => x.id === rep.id ? rep : x));
    }
  }

  async function handleDeleteReport(id) {
    setReps(prev => prev.filter(r => r.id !== id));
    try {
      await apiDeleteReport(id);
    } catch (e) {
      console.warn("Delete DB error:", e.message);
    }
  }

  function handleApprove(id, edited) {
    // Оптимистично обновляем UI
    setReps((prev) => prev.map((r) => r.id === id ? { ...edited, id, status: "approved", approvedAt: new Date().toISOString() } : r));

    // Сохраняем в Supabase и обновляем состояние актуальными данными из БД
    apiApproveReport(id, {
      df: edited.df, bf: edited.bf, wh: edited.wh,
      dh: edited.dh, fuel: edited.fuel, fuel_kg: edited.fuel_kg,
      over_drill: (edited.rigs || []).reduce((s, r) => s + (r.overDrill || 0), 0),
    }, user?.id)
      .then(saved => setReps(prev => prev.map(r => r.id === id ? saved : r)))
      .catch(e => console.warn("Approve DB error:", e.message));
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

  const navCEO  = [["dash","Сводка"],["finance","Финансы"],["engineers","Команда"]];
  const navEng  = [["dash","Сводка"],["planning","Планирование"],["inbox","Входящие"],["users","Персонал"]];
  const navFor  = [["dash","Сводка"],["enter","Сменные отчёты"],["inventory","Склад"],["maint","ТО техники"]];
  const navMech = [["assets","Активы"],["objects","Участки"],["ktgplan","КТГ-план"],["ktgfact","Факт КТГ"]];
  const nav     = !user ? [] : user.role === "ceo" ? navCEO : user.role === "engineer" ? navEng : user.role === "mechanic" ? navMech : navFor;

  const vObjs = !user ? objs : user.role === "foreman" ? objs.filter((o) => user.oids === "all" || user.oids.includes(o.id)) : objs;
  const vReps = !user ? reps : user.role === "foreman" ? reps.filter((r) => user.oids === "all" || user.oids.includes(r.oid)) : reps;

  const css = [
    "@import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700&family=JetBrains+Mono:wght@400;500;700&display=swap');",
    "*,*::before,*::after{-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;margin:0;padding:0;}",
    `html,body{width:100%;min-height:100%;background:${T.bg0};color:${T.txt0};font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}`,
    `#root{width:100%;min-height:100vh;}`,
    `::-webkit-scrollbar{width:4px;height:4px;}`,
    `::-webkit-scrollbar-track{background:${T.bg1};}`,
    `::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px;}`,
    `input,select,textarea{font-family:'Inter',sans-serif;-webkit-appearance:none;-moz-appearance:none;}`,
    `input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}`,
    `input[type=number]{-moz-appearance:textfield;appearance:textfield;}`,
    `select option{background:${T.bg2};color:${T.txt0};}`,
    `button{-webkit-appearance:none;-moz-appearance:none;appearance:none;cursor:pointer;}`,
    `img{max-width:100%;height:auto;}`,
    `@-webkit-keyframes fadeUp{from{opacity:0;-webkit-transform:translateY(10px);transform:translateY(10px);}to{opacity:1;-webkit-transform:translateY(0);transform:translateY(0);}}`,
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
      ? <ForemanDash user={user} objs={vObjs} rigs={rigs} reps={vReps} plans={plans} T={T} />
      : <Dashboard objs={objs} rigs={rigs} reps={reps} plans={plans} ktgPlans={ktgPlans} nodes={nodes} onDrillObj={(id) => setView({ type: "obj", objId: id })} T={T} />;
  } else if (subPage === "enter") {
    content = <ForemanForm user={user} objs={vObjs} rigs={rigs} reps={vReps} onSubmit={handleSubmitReport} onUpdate={handleUpdateReport} setExplosives={setExplosives} downtimeLog={downtimeLog} setDowntimeLog={setDowntimeLog} T={T} />;
  } else if (subPage === "planning") {
    content = <PlanningPage objs={objs} plans={plans} setPlans={setPlans} ktgPlans={ktgPlans} setKtgPlans={setKtgPlans} nodes={nodes} T={T} />;
  } else if (subPage === "inbox") {
    content = <EngineerInbox reps={reps} objs={objs} rigs={rigs} onApprove={handleApprove} onDelete={handleDeleteReport} onUpdate={handleUpdateReport} ktgPlans={ktgPlans} setKtgPlans={setKtgPlans} nodes={nodes} setExplosives={setExplosives} T={T} />;
  } else if (subPage === "objects") {
    content = <ObjectsEditor objs={objs} setObjs={setObjs} rigs={rigs} setRigs={setRigs} nodes={nodes} setNodes={setNodes} T={T} />;
  } else if (subPage === "users") {
    content = <UsersEditor users={users} setUsers={setUsers} objs={objs} T={T} />;
  } else if (subPage === "engineers") {
    content = <EngineerAssign users={users} setUsers={setUsers} T={T} />;
  } else if (subPage === "bvr") {
    content = <BlastPassportPage passports_bvr={blastPassports} setPassportsBvr={setBlastPassports} objs={objs} reps={reps} T={T} />;
  } else if (subPage === "explosives") {
    content = <ExplosivesPage explosives={explosives} setExplosives={setExplosives} objs={objs} reps={reps} user={user} T={T} />;
  } else if (subPage === "inventory") {
    content = <InventoryPage storageUnits={storageUnits} setStorageUnits={setStorageUnits} invTxns={invTxns} setInvTxns={setInvTxns} objs={user.role==="foreman"?vObjs:objs} nodes={nodes} user={user} T={T} />;
  } else if (subPage === "maint" && user.role === "foreman") {
    content = <ForemanMaintenancePage user={user} objs={vObjs} rigs={rigs} maintRecords={maintRecords} setMaintRecords={setMaintRecords} passports={passports} setPassports={setPassports} meters={meters} T={T} />;
  } else if (subPage === "ktgfact" && user.role === "mechanic") {
    content = <MechanicKTGFactPage nodes={nodes} objs={objs} reps={reps} rigs={rigs} passports={passports} T={T} />;
  } else if (subPage === "finance") {
    content = <FinancePage T={T} />;
  } else if (subPage === "ktgplan" && user.role === "mechanic") {
    content = <MechanicKTGPage nodes={nodes} objs={objs} mechCats={mechCats} passports={passports} meters={meters} ktgPlans={ktgPlans} setKtgPlans={setKtgPlans} user={user} T={T} />;
  } else if (subPage === "assets" && user.role === "mechanic") {
    content = <MechanicAssetsPage nodes={nodes} setNodes={setNodes} objs={objs} reps={reps} assetClasses={assetClasses} mechCats={mechCats} setMechCats={setMechCats} passports={passports} setPassports={setPassports} maintRecords={maintRecords} setMaintRecords={setMaintRecords} user={user} T={T} />;
  } else if (user.role === "mechanic") {
    content = <MechanicAssetsPage nodes={nodes} setNodes={setNodes} objs={objs} reps={reps} assetClasses={assetClasses} mechCats={mechCats} setMechCats={setMechCats} passports={passports} setPassports={setPassports} maintRecords={maintRecords} setMaintRecords={setMaintRecords} user={user} T={T} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg0, fontFamily: "'Inter',sans-serif", color: T.txt0, display: "flex", flexDirection: "column" }}>
      <style>{css}</style>
      {!user ? content : (
        <>
          <Topbar user={user} nav={nav} page={subPage} onNav={goPage} onOut={handleLogout} onUpdateUser={(u) => { setUser(u); setUsers(prev => prev.map(x => x.id === u.id ? u : x)); }} pending={pending} isDark={isDark} toggleTheme={() => setIsDark((d) => !d)} T={T} />
          <div style={{ flex: 1, padding: 24, maxWidth: "100%", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
            {content}
          </div>
          <div style={{ borderTop: `1px solid ${T.border}`, padding: "8px 24px", background: T.bg1, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: T.txt2, textTransform: "uppercase" }}>ExSo Drill & Blast Control · v14.0</span>
            <span style={{ fontSize: 12, color: T.txt2, textTransform: "uppercase" }}>© 2025 ExSo Explosion Solutions</span>
          </div>
        </>
      )}
    </div>
  );
}
