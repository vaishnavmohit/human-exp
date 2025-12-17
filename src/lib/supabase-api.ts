
import { createSupabaseClient } from "./supabase-server";

// Prefer a server-side Supabase client (service role) when available.
const db = await createSupabaseClient();


// Use server client when running on the server (API routes), otherwise fall back to public client.


// Basic types used in the helpers
export type Participant = {
	id?: number;
	participant_id: string;
	email?: string | null;
	enrollment_number?: string | null;
	assigned_group: number;
	consent?: boolean;
	share_data?: boolean;
	n_per_category?: number;
	metadata_json?: string | null;
};

export type Session = {
	id?: string; // uuid
	participant_id: string;
	assigned_group: number; // Experimental group (1-6)
	total_questions?: number;
	assignment_json?: string;
	category_map?: string;
	progress?: number;
	current_index?: number;
	completed?: boolean;
	started_at?: string;
	last_activity_at?: string;
};

export type Response = {
	id?: number;
	participant_id: string;
	session_id: string;
	question_id: string;
	category: string;
	assigned_group: number; // Experimental group (1-6)
	answer: string;
	is_correct?: boolean;
	reaction_time?: number;
	question_number?: number;
	mouse_data_json?: string | null;
	created_at?: string;
};

/**
 * Upsert a participant by participant_id
 */
export async function upsertParticipant(p: Participant) {
	const { data, error } = await db
		.from("participants")
		.upsert(p, { onConflict: "participant_id" })
		.select()
		.single();

	if (error) throw error;
	return data;
}

export async function getParticipant(participant_id: string) {
	const { data, error } = await db
		.from("participants")
		.select("*")
		.eq("participant_id", participant_id)
		.single();

	if (error && error.code !== "PGRST116") throw error;
	return data;
}

/**
 * Create a session for a participant
 */
export async function createSession(s: Session) {
	const now = new Date().toISOString();
	const payload = {
		...s,
		started_at: now,
		last_activity_at: now,
	};

	const { data, error } = await db
		.from("sessions")
		.insert(payload)
		.select()
		.single();

	if (error) throw error;
	return data;
}

export async function getActiveSession(participant_id: string) {
	const { data, error } = await db
		.from("sessions")
		.select("*")
		.eq("participant_id", participant_id)
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
	const { data, error } = await db
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
	// Check if a response for the same session + question + participant already exists.
	// If it does, return the existing record instead of inserting a duplicate.
	try {
		const { data: existing, error: selErr } = await db
			.from("responses")
			.select("*")
			.eq("session_id", response.session_id)
			.eq("question_id", response.question_id)
			.eq("participant_id", response.participant_id)
			.limit(1)
			.single();


		if (selErr && selErr.code !== "PGRST116") throw selErr;
		if (existing) return existing;

		const { data, error } = await db
			.from("responses")
			.insert(response)
			.select()
			.single();

		if (error) throw error;
		return data;
	} catch (err) {
		// Bubble up errors to caller
		throw err;
	}
}

/**
 * Get all responses for a participant
 */
export async function getParticipantResponses(participant_id: string) {
	const { data, error } = await db
		.from("responses")
		.select("*")
		.eq("participant_id", participant_id)
		.order("created_at", { ascending: true });

	if (error) throw error;
	return data;
}

/**
 * Get responses for a specific session
 */
export async function getSessionResponses(session_id: string) {
	const { data, error } = await db
		.from("responses")
		.select("*")
		.eq("session_id", session_id)
		.order("created_at", { ascending: true });

	if (error) throw error;
	return data;
}

/**
 * Check if participant has an active (incomplete) session
 * Returns the session with progress info
 */
export async function getIncompleteSession(participant_id: string) {
	const { data, error } = await db
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
 * Mark session as completed
 */
export async function completeSession(session_id: string) {
	const { data, error } = await db
		.from("sessions")
		.update({ 
			completed: true,
			completed_at: new Date().toISOString(),
			last_activity_at: new Date().toISOString()
		})
		.eq("id", session_id)
		.select()
		.single();

	if (error) throw error;
	return data;
}

export default db;
