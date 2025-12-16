import { supabase } from "./supabase";

export interface Participant {
  id?: string;
  participant_id: string;
  email?: string;
  enrollment_number?: string;
  assigned_group: number;
  consent: boolean;
  share_data?: boolean;
  n_per_category?: number;
  metadata_json?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface Session {
  id?: string;
  participant_id: string;
  current_index: number;
  total_questions: number;
  completed: boolean;
  assignment_json: string[];
  category_map?: Record<string, string>;
  started_at?: string;
  completed_at?: string;
  last_activity_at?: string;
}

export interface Response {
  id?: string;
  participant_id: string;
  session_id: string;
  question_id: string;
  category: string;
  answer: "positive" | "negative";
  is_correct: boolean;
  reaction_time: number;
  question_number?: number;
  mouse_data_json?: Record<string, any>;
  created_at?: string;
}

/**
 * Create or update a participant
 */
export async function upsertParticipant(participant: Participant) {
  const { data, error } = await supabase
    .from("participants")
    .upsert(participant, { onConflict: "participant_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get participant by ID
 */
export async function getParticipant(participant_id: string) {
  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .eq("participant_id", participant_id)
    .single();

  if (error && error.code !== "PGRST116") throw error; // PGRST116 = not found
  return data;
}

/**
 * Create a new session
 */
export async function createSession(session: Omit<Session, "id">) {
  const { data, error } = await supabase
    .from("sessions")
    .insert(session)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get active session for participant
 */
export async function getActiveSession(participant_id: string) {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("participant_id", participant_id)
    .eq("completed", false)
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

/**
 * Update session progress
 */
export async function updateSession(
  session_id: string,
  updates: Partial<Session>
) {
  const { data, error } = await supabase
    .from("sessions")
    .update({ ...updates, last_activity_at: new Date().toISOString() })
    .eq("id", session_id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Save a response
 */
export async function saveResponse(response: Omit<Response, "id">) {
  const { data, error } = await supabase
    .from("responses")
    .insert(response)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all responses for a participant
 */
export async function getParticipantResponses(participant_id: string) {
  const { data, error } = await supabase
    .from("responses")
    .select("*")
    .eq("participant_id", participant_id)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Check if an invite code is valid
 */
export async function checkInvite(invite_code: string) {
  const { data, error } = await supabase
    .from("invites")
    .select("*")
    .eq("invite_code", invite_code)
    .eq("used", false)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

/**
 * Mark invite as used
 */
export async function markInviteUsed(invite_code: string) {
  const { data, error } = await supabase
    .from("invites")
    .update({ used: true, used_at: new Date().toISOString() })
    .eq("invite_code", invite_code)
    .select()
    .single();

  if (error) throw error;
  return data;
}
