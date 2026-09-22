import { config } from './config.js';
import fs from 'fs';
import path from 'path';

// In-memory database, persisted to a JSON file on disk so data survives restarts
interface VideoRecord {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  videoUrl: string;
  viewCount?: number;
  totalComments: number;
  clinicInquiries: number;
  otherComments: number;
  averageConfidence: number;
}

interface CommentRecord {
  id: string;
  videoId: string;
  author: string;
  text: string;
  likes: number;
  isClinicInquiry: boolean;
  inquiryType?: string; // pedir_cita_agendar, lead_potencial, medicacion_tratamiento, injertos_trasplante, consulta_general, dudas_preguntas, seguimiento_recontacto, no_aplica
  confidence: number;
  createdAt: string;
  // true = el doctor ya respondió este comentario, false = no, null = no se pudo verificar
  doctorReplied?: boolean | null;
  totalReplyCount?: number | null;
}

let videos: Map<string, VideoRecord> = new Map();
let comments: Map<string, CommentRecord> = new Map();

export type Video = VideoRecord;
export type Comment = CommentRecord;

// --- Persistence to disk (JSON snapshot) -----------------------------------
// Keeps the in-memory Maps as the source of truth for reads (fast, simple),
// but mirrors every change to a JSON file so data survives process restarts.

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

let saveTimer: NodeJS.Timeout | null = null;
let dirty = false;

function persistNow(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const snapshot = {
      videos: Array.from(videos.values()),
      comments: Array.from(comments.values()),
      savedAt: new Date().toISOString(),
    };
    // Write to a temp file first, then rename, to avoid corrupting the
    // store if the process is killed mid-write.
    const tmpPath = STORE_PATH + '.tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(snapshot, null, 2), 'utf-8');
    fs.renameSync(tmpPath, STORE_PATH);
    dirty = false;
  } catch (err) {
    console.error('⚠️  Error guardando la base de datos en disco:', err);
  }
}

function scheduleSave(): void {
  dirty = true;
  if (saveTimer) return;
  // Debounce writes: batch rapid saveComment() calls into one disk write
  // every 500ms instead of writing on every single comment.
  saveTimer = setTimeout(() => {
    saveTimer = null;
    if (dirty) persistNow();
  }, 500);
}

function loadFromDisk(): void {
  if (!fs.existsSync(STORE_PATH)) {
    return;
  }
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as { videos: VideoRecord[]; comments: CommentRecord[] };
    videos = new Map(parsed.videos.map((v) => [v.id, v]));
    comments = new Map(parsed.comments.map((c) => [c.id, c]));
    console.log(
      `📂 Datos cargados desde disco: ${videos.size} videos, ${comments.size} comentarios (${STORE_PATH})`
    );
  } catch (err) {
    console.error('⚠️  Error leyendo la base de datos guardada, se empieza vacía:', err);
  }
}

export async function initializeDatabase(): Promise<void> {
  loadFromDisk();
  if (videos.size === 0 && comments.size === 0) {
    console.log('✅ Base de datos inicializada (vacía, sin datos previos en disco)');
  }
}

/** Force an immediate flush to disk (used on graceful shutdown) */
export function flushDatabase(): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  persistNow();
}

/** Deletes the persisted snapshot and clears in-memory data (fresh start) */
export function resetDatabase(): void {
  videos = new Map();
  comments = new Map();
  if (fs.existsSync(STORE_PATH)) {
    fs.unlinkSync(STORE_PATH);
  }
  console.log('🗑️  Base de datos reiniciada (borrado el snapshot en disco)');
}

export function getDatabase() {
  return { videos, comments };
}

export function saveVideo(video: Video): void {
  videos.set(video.id, video);
  scheduleSave();
}

export function saveComment(comment: Comment): void {
  comments.set(comment.id, comment);
  scheduleSave();
}

// Canonical inquiry types tracked across the app
export const INQUIRY_TYPES = [
  'pedir_cita_agendar',
  'lead_potencial',
  'medicacion_tratamiento',
  'injertos_trasplante',
  'consulta_general',
  'dudas_preguntas',
  'seguimiento_recontacto',
  'no_aplica',
] as const;

export type InquiryTypeBreakdown = Record<string, number>;

function emptyBreakdown(): InquiryTypeBreakdown {
  return INQUIRY_TYPES.reduce((acc, t) => ({ ...acc, [t]: 0 }), {} as InquiryTypeBreakdown);
}

function computeBreakdown(commentList: Comment[]): InquiryTypeBreakdown {
  const breakdown = emptyBreakdown();
  for (const c of commentList) {
    const type = c.inquiryType && breakdown.hasOwnProperty(c.inquiryType) ? c.inquiryType : 'no_aplica';
    breakdown[type] = (breakdown[type] || 0) + 1;
  }
  return breakdown;
}

const LEAD_TYPES = ['pedir_cita_agendar', 'lead_potencial', 'seguimiento_recontacto'];

export function getVideos(): (Video & { inquiryTypeBreakdown: InquiryTypeBreakdown; hotLeads: number; potentialLeads: number })[] {
  const allComments = Array.from(comments.values());
  return Array.from(videos.values())
    .map((v) => {
      const videoComments = allComments.filter((c) => c.videoId === v.id);
      const inquiryTypeBreakdown = computeBreakdown(videoComments);
      return {
        ...v,
        inquiryTypeBreakdown,
        hotLeads: inquiryTypeBreakdown['pedir_cita_agendar'] || 0,
        potentialLeads: LEAD_TYPES.reduce((sum, t) => sum + (inquiryTypeBreakdown[t] || 0), 0),
      };
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export function getVideoById(videoId: string): Video | undefined {
  return videos.get(videoId);
}

export function getCommentsByVideoId(videoId: string): Comment[] {
  return Array.from(comments.values()).filter((c) => c.videoId === videoId);
}

/** Check if a comment (by its YouTube comment id) was already classified & saved */
export function hasComment(commentId: string): boolean {
  return comments.has(commentId);
}

/** Check if a video was already processed (has at least one comment saved) */
export function hasVideoBeenProcessed(videoId: string): boolean {
  return videos.has(videoId) && getCommentsByVideoId(videoId).length > 0;
}

export function getStatistics() {
  const allComments = Array.from(comments.values());
  const totalComments = allComments.length;
  const clinicInquiries = allComments.filter((c) => c.isClinicInquiry).length;
  const otherComments = totalComments - clinicInquiries;
  const averageConfidence =
    allComments.length > 0
      ? allComments.reduce((sum, c) => sum + c.confidence, 0) / allComments.length
      : 0;
  const inquiryTypeBreakdown = computeBreakdown(allComments);

  // Reply tracking (from a one-off YouTube API enrichment pass; doctorReplied is
  // null for threads that could not be re-verified, not "not replied")
  const verifiedComments = allComments.filter((c) => c.doctorReplied !== null && c.doctorReplied !== undefined);
  const repliedByDoctor = allComments.filter((c) => c.doctorReplied === true).length;
  const unverifiedReplies = totalComments - verifiedComments.length;

  const leadTypes = ['pedir_cita_agendar', 'lead_potencial', 'seguimiento_recontacto'];
  const leadComments = allComments.filter((c) => leadTypes.includes(c.inquiryType || ''));
  const leadsReplied = leadComments.filter((c) => c.doctorReplied === true).length;
  const leadsPending = leadComments.length - leadsReplied;

  return {
    totalVideos: videos.size,
    totalComments,
    clinicInquiries,
    otherComments,
    clinicPercentage: totalComments > 0 ? (clinicInquiries / totalComments) * 100 : 0,
    averageConfidence,
    inquiryTypeBreakdown,
    repliedByDoctor,
    verifiedRepliesCount: verifiedComments.length,
    unverifiedReplies,
    totalPotentialLeads: leadComments.length,
    leadsReplied,
    leadsPending,
    hotLeads: inquiryTypeBreakdown['pedir_cita_agendar'] || 0,
  };
}

export function closeDatabase(): void {
  // Flush any pending changes to disk before the process exits
  flushDatabase();
}
