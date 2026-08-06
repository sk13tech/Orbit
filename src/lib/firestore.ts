import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc,
  query, where, Timestamp, serverTimestamp, setDoc,
} from "firebase/firestore";
import { getDb, auth } from "./firebase";

/* ── Site Config (read-only from client, edit from Firebase Console) ── */
export interface SiteConfig {
  siteName: string;
  contactEmail: string;
  logoUrl: string;
}

const DEFAULT_CONFIG: SiteConfig = {
  siteName: "Orbit",
  contactEmail: "sitaenterprisespvtltd@gmail.com",
  logoUrl: "/logo.png",
};
let cachedConfig: SiteConfig | null = null;

export async function getSiteConfig(): Promise<SiteConfig> {
  if (cachedConfig) return cachedConfig;
  try {
    const snap = await getDoc(doc(getDb(), "config", "site"));
    if (snap.exists()) {
      const d = snap.data();
      cachedConfig = {
        siteName: typeof d.siteName === "string" && d.siteName ? d.siteName : DEFAULT_CONFIG.siteName,
        contactEmail: typeof d.contactEmail === "string" && d.contactEmail ? d.contactEmail : DEFAULT_CONFIG.contactEmail,
        logoUrl: typeof d.logoUrl === "string" && d.logoUrl ? d.logoUrl : DEFAULT_CONFIG.logoUrl,
      };
    } else {
      // Create default config doc if it doesn't exist
      await setDoc(doc(getDb(), "config", "site"), DEFAULT_CONFIG).catch(() => {});
      cachedConfig = DEFAULT_CONFIG;
    }
  } catch {
    cachedConfig = DEFAULT_CONFIG;
  }
  return cachedConfig;
}

/* ── Types ── */
export interface Lead {
  id: string;
  userId: string;
  name: string;
  phone: string;
  product: string;
  status: string;
  dateOfVisit: string;
  expectedPurchaseDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpLog {
  id: string;
  leadId: string;
  remark: string;
  date: string;
  createdAt: string;
}

/* ── Security: sanitize & validate ── */
const VALID_STATUSES = ["in_progress", "closed", "lost"] as const;
const MAX_NAME = 200;
const MAX_PHONE = 30;
const MAX_PRODUCT = 200;
const MAX_NOTES = 2000;
const MAX_REMARK = 2000;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function sanitize(val: unknown, maxLen: number): string {
  if (typeof val !== "string") return "";
  return val
    .replace(/<[^>]*>/g, "")        // strip HTML tags
    .replace(/[<>"'`]/g, "")        // strip dangerous chars
    .trim()
    .slice(0, maxLen);
}

function validateDate(val: unknown): string {
  if (typeof val !== "string") return new Date().toISOString().split("T")[0];
  const clean = val.trim().slice(0, 10);
  if (!DATE_REGEX.test(clean)) return new Date().toISOString().split("T")[0];
  const d = new Date(clean + "T00:00:00");
  if (isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
  return clean;
}

function validateStatus(val: unknown): string {
  if (typeof val === "string" && (VALID_STATUSES as readonly string[]).includes(val)) return val;
  return "in_progress";
}

function getAuthUid(): string {
  const user = auth?.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.uid;
}

/* ── Helpers ── */
function tsToStr(ts: unknown): string {
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === "string") return ts;
  return new Date().toISOString();
}

function docToLead(id: string, data: Record<string, unknown>): Lead {
  return {
    id,
    userId: String(data.userId || ""),
    name: String(data.name || ""),
    phone: String(data.phone || ""),
    product: String(data.product || ""),
    status: validateStatus(data.status),
    dateOfVisit: String(data.dateOfVisit || ""),
    expectedPurchaseDate: String(data.expectedPurchaseDate || ""),
    notes: data.notes ? String(data.notes) : null,
    createdAt: tsToStr(data.createdAt),
    updatedAt: tsToStr(data.updatedAt),
  };
}

/* ── Leads ── */
export async function getLeads(userId: string, search?: string): Promise<Lead[]> {
  const uid = getAuthUid();
  if (uid !== userId) throw new Error("Forbidden");

  const q1 = query(collection(getDb(), "leads"), where("userId", "==", uid));
  const snap = await getDocs(q1);
  let leads = snap.docs.map(d => docToLead(d.id, d.data()));
  leads.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (search) {
    const s = sanitize(search, 100).toLowerCase();
    if (s) {
      leads = leads.filter(l =>
        l.name.toLowerCase().includes(s) ||
        l.phone.toLowerCase().includes(s) ||
        l.product.toLowerCase().includes(s)
      );
    }
  }
  return leads;
}

export async function createLead(userId: string, data: {
  name: string; phone: string; product: string;
  dateOfVisit: string; expectedPurchaseDate: string; notes: string | null;
}): Promise<Lead> {
  const uid = getAuthUid();
  if (uid !== userId) throw new Error("Forbidden");

  const name = sanitize(data.name, MAX_NAME);
  const phone = sanitize(data.phone, MAX_PHONE);
  const product = sanitize(data.product, MAX_PRODUCT);
  const notes = data.notes ? sanitize(data.notes, MAX_NOTES) : null;
  const dateOfVisit = validateDate(data.dateOfVisit);
  const expectedPurchaseDate = validateDate(data.expectedPurchaseDate);

  if (!name || !phone || !product) throw new Error("Name, phone, and product are required");

  const doc_data = {
    userId: uid,
    name, phone, product,
    status: "in_progress" as const,
    dateOfVisit, expectedPurchaseDate, notes,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(getDb(), "leads"), doc_data);
  return {
    id: ref.id, userId: uid, name, phone, product,
    status: "in_progress", dateOfVisit, expectedPurchaseDate, notes,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

export async function updateLead(leadId: string, data: Record<string, unknown>): Promise<void> {
  const uid = getAuthUid();

  // Verify ownership before update
  const leadRef = doc(getDb(), "leads", leadId);
  const leadSnap = await getDoc(leadRef);
  if (!leadSnap.exists() || leadSnap.data().userId !== uid) throw new Error("Forbidden");

  // Whitelist only allowed fields
  const safe: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (data.name !== undefined) safe.name = sanitize(data.name, MAX_NAME);
  if (data.phone !== undefined) safe.phone = sanitize(data.phone, MAX_PHONE);
  if (data.product !== undefined) safe.product = sanitize(data.product, MAX_PRODUCT);
  if (data.notes !== undefined) safe.notes = data.notes ? sanitize(data.notes as string, MAX_NOTES) : null;
  if (data.status !== undefined) safe.status = validateStatus(data.status);
  if (data.dateOfVisit !== undefined) safe.dateOfVisit = validateDate(data.dateOfVisit);
  if (data.expectedPurchaseDate !== undefined) safe.expectedPurchaseDate = validateDate(data.expectedPurchaseDate);
  // userId is NEVER updatable

  await updateDoc(leadRef, safe);
}

export async function deleteLead(leadId: string): Promise<void> {
  const uid = getAuthUid();

  // Verify ownership before delete
  const leadRef = doc(getDb(), "leads", leadId);
  const leadSnap = await getDoc(leadRef);
  if (!leadSnap.exists() || leadSnap.data().userId !== uid) throw new Error("Forbidden");

  // Delete all logs for this lead
  const logsSnap = await getDocs(query(collection(getDb(), "followUpLogs"), where("leadId", "==", leadId)));
  await Promise.all(logsSnap.docs.map(d => deleteDoc(d.ref)));
  await deleteDoc(leadRef);
}

/* ── Follow-up Logs ── */
export async function getLogs(leadId: string): Promise<FollowUpLog[]> {
  const uid = getAuthUid();

  // Verify lead ownership
  const leadSnap = await getDoc(doc(getDb(), "leads", leadId));
  if (!leadSnap.exists() || leadSnap.data().userId !== uid) throw new Error("Forbidden");

  const q1 = query(collection(getDb(), "followUpLogs"), where("leadId", "==", leadId));
  const snap = await getDocs(q1);
  const logs = snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      leadId: String(data.leadId || ""),
      remark: String(data.remark || ""),
      date: String(data.date || ""),
      createdAt: tsToStr(data.createdAt),
    } as FollowUpLog;
  });
  logs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return logs;
}

export async function createLog(leadId: string, remark: string): Promise<FollowUpLog> {
  const uid = getAuthUid();

  // Verify lead ownership before adding log
  const leadSnap = await getDoc(doc(getDb(), "leads", leadId));
  if (!leadSnap.exists() || leadSnap.data().userId !== uid) throw new Error("Forbidden");

  const cleanRemark = sanitize(remark, MAX_REMARK);
  if (!cleanRemark) throw new Error("Remark is required");

  const today = new Date().toISOString().split("T")[0];
  const ref = await addDoc(collection(getDb(), "followUpLogs"), {
    leadId,
    remark: cleanRemark,
    date: today,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, leadId, remark: cleanRemark, date: today, createdAt: new Date().toISOString() };
}

/* ── Log Counts ── */
export async function getLogCounts(leadIds: string[]): Promise<Record<string, number>> {
  if (leadIds.length === 0) return {};
  getAuthUid(); // ensure authenticated

  const map: Record<string, number> = {};
  const chunks: string[][] = [];
  for (let i = 0; i < leadIds.length; i += 30) {
    chunks.push(leadIds.slice(i, i + 30));
  }
  for (const chunk of chunks) {
    const snap = await getDocs(query(collection(getDb(), "followUpLogs"), where("leadId", "in", chunk)));
    snap.docs.forEach(d => {
      const lid = d.data().leadId;
      map[lid] = (map[lid] || 0) + 1;
    });
  }
  return map;
}

/* ── Stats ── */
export async function getStats(userId: string) {
  const leads = await getLeads(userId); // already validates auth
  const totalLeads = leads.length;
  const inProgress = leads.filter(l => l.status === "in_progress").length;
  const closed = leads.filter(l => l.status === "closed").length;
  const lost = leads.filter(l => l.status === "lost").length;
  const conversionRate = totalLeads > 0 ? Math.round((closed / totalLeads) * 100) : 0;

  const productMap: Record<string, number> = {};
  for (const l of leads) productMap[l.product] = (productMap[l.product] || 0) + 1;
  const byProduct = Object.entries(productMap).map(([product, count]) => ({ product, count })).sort((a, b) => b.count - a.count);

  const dailyBreakdown: { day: string; total: number; closed: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split("T")[0];
    const dayLeads = leads.filter(l => l.createdAt.split("T")[0] === dayStr);
    dailyBreakdown.push({
      day: `${d.toLocaleDateString("en-US", { weekday: "short" })}, ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      total: dayLeads.length,
      closed: dayLeads.filter(l => l.status === "closed").length,
    });
  }
  return { totalLeads, inProgress, closed, lost, conversionRate, byProduct, dailyBreakdown };
}

/* ── Followups (alerts) ── */
export async function getFollowups(userId: string) {
  const leads = await getLeads(userId); // already validates auth
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split("T")[0];

  const active = leads.filter(l => l.status === "in_progress");
  const todayLeads = active.filter(l => l.expectedPurchaseDate === today);
  const overdueLeads = active.filter(l => l.expectedPurchaseDate < today);
  const upcomingLeads = active.filter(l => l.expectedPurchaseDate >= tomorrowStr && l.expectedPurchaseDate <= nextWeekStr);

  return {
    todayLeads, overdueLeads, upcomingLeads,
    totalFollowups: todayLeads.length + overdueLeads.length + upcomingLeads.length,
  };
}
