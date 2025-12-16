"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Invite Link Handler
 * 
 * Similar to Flask app's /invite/<participant_id> route
 * Redirects to quiz with participant ID and group
 * 
 * URL: /invite/[participantId]
 * Redirects to: /[participantId]?group=[group]
 */
export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const participantId = params.participantId as string;

  useEffect(() => {
    async function handleInvite() {
      try {
        // TODO: In future, fetch participant info from Supabase
        // For now, we'll extract group from participant_id or use default
        
        // Check if participant exists in database
        // const { data, error } = await supabase
        //   .from('participants')
        //   .select('participant_id, group')
        //   .eq('participant_id', participantId)
        //   .single();
        
        // For now, default to group 1
        // In production, this should come from database
        const defaultGroup = 1;
        
        // Redirect to quiz with participant ID and group
        router.push(`/${participantId}?group=${defaultGroup}`);
        
      } catch (err) {
        console.error('Error handling invite:', err);
        setError('Failed to process invite link');
      }
    }

    if (participantId) {
      handleInvite();
    }
  }, [participantId, router]);

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
        <p className="text-gray-600">Processing your invite...</p>
        <p className="text-sm text-gray-400 mt-2">Participant: {participantId}</p>
      </div>
    </div>
  );
}
