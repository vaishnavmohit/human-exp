"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase-client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Invite Link Handler
 * 
 * Handles both:
 * 1. Direct participant IDs: /invite/pid_12345
 * 2. Invite codes: /invite/ABC123XY (from database)
 * 
 * Redirects to quiz with participant ID and group
 */
export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Processing your invite...");

  const inviteParam = params.participantId as string;

  useEffect(() => {
    async function handleInvite() {
      try {
        // Create Supabase client
        const supabase = createBrowserSupabaseClient();
        
        // Check if Supabase is configured
        if (!supabase) {
          console.log('Supabase not configured, using direct mode');
          // Fallback: treat inviteParam as participant_id directly
          router.push(`/${inviteParam}?group=1`);
          return;
        }

        // First, check if it's an invite code (shorter, alphanumeric)
        if (inviteParam.length <= 12 && !inviteParam.startsWith('pid_')) {
          setStatus("Looking up invite code...");
          
          const { data: invite, error: inviteError } = await supabase
            .from('invites')
            .select('participant_id, assigned_group, used, expires_at')
            .eq('invite_code', inviteParam.toUpperCase())
            .single();
          
          if (invite && !inviteError) {
            // Check if invite is expired
            if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
              setError('This invite link has expired. Please contact the study administrator.');
              return;
            }
            
            // Check if already used (optional - you might want to allow reuse)
            if (invite.used) {
              // Still allow access, just proceed
              //console.log('Invite already used, but allowing access');
            }
            
            // Mark invite as used
            await supabase
              .from('invites')
              .update({ used: true, used_at: new Date().toISOString() })
              .eq('invite_code', inviteParam.toUpperCase());
            
            setStatus("Redirecting to quiz...");
            router.push(`/${invite.participant_id}?group=${invite.assigned_group}`);
            return;
          }
        }
        
        // Try as participant_id directly
        setStatus("Looking up participant...");
        
        const { data: participant, error: participantError } = await supabase
          .from('participants')
          .select('participant_id, assigned_group')
          .eq('participant_id', inviteParam)
          .single();
        
        if (participant && !participantError) {
          setStatus("Redirecting to quiz...");
          router.push(`/${participant.participant_id}?group=${participant.assigned_group}`);
          return;
        }
        
        // Also try looking up by email (in case invite param is an email)
        const { data: byEmail } = await supabase
          .from('participants')
          .select('participant_id, assigned_group')
          .eq('email', inviteParam.toLowerCase())
          .single();
        
        if (byEmail) {
          setStatus("Redirecting to quiz...");
          router.push(`/${byEmail.participant_id}?group=${byEmail.assigned_group}`);
          return;
        }
        
        // If nothing found in database, allow direct access with defaults
        //console.log('Participant not found in database, using direct mode');
        router.push(`/${inviteParam}?group=1`);
        
      } catch (err) {
        console.error('Error handling invite:', err);
        // On any error, try direct mode as fallback
        router.push(`/${inviteParam}?group=1`);
      }
    }

    if (inviteParam) {
      handleInvite();
    }
  }, [inviteParam, router]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-600 text-xl font-bold mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50">
      <div className="text-center">
        <div className="animate-pulse text-2xl mb-4">🔄</div>
        <p className="text-gray-600">{status}</p>
        <p className="text-sm text-gray-400 mt-2">Invite: {inviteParam}</p>
      </div>
    </div>
  );
}
