"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();
  const [participantId, setParticipantId] = useState("");
  const [email, setEmail] = useState("");
  const [enrollmentNumber, setEnrollmentNumber] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<number>(1);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    if (!consent) {
      setError("Please provide consent to participate");
      return;
    }

    if (!participantId && !email && !enrollmentNumber) {
      setError("Please provide at least one identifier (Participant ID, Email, or Enrollment Number)");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use provided participant ID, or generate from email/enrollment
      const pid = participantId || email || enrollmentNumber || `pid_${Date.now()}`;
      
      // Register participant in Supabase
      const registerRes = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: pid,
          email: email || null,
          enrollment_number: enrollmentNumber || null,
          assigned_group: selectedGroup,
          consent: consent,
          share_data: true,
        })
      });

      if (!registerRes.ok) {
        const errorData = await registerRes.json();
        throw new Error(errorData.error || 'Failed to register participant');
      }

      console.log('✅ Participant registered:', pid);

      // Navigate to quiz (no need to pass group, it will be auto-detected)
      router.push(`/${pid}`);
    } catch (err) {
      console.error("Error starting quiz:", err);
      setError("Failed to start quiz. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 p-4">
      <div className="w-full max-w-2xl">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <Image
              src="/img/Taltech-logo.png"
              alt="TalTech Logo"
              width={200}
              height={80}
              className="mx-auto"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Bongard Problem Experiment
          </h1>
          <p className="text-gray-600">
            Visual Reasoning Task - Human Behavioral Study
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome, Participant!</CardTitle>
            <CardDescription>
              Please provide your information to begin the experiment
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Participant Information */}
            <div className="space-y-4">
              <div>
                <label htmlFor="participantId" className="block text-sm font-medium text-gray-700 mb-2">
                  Participant ID (if provided)
                </label>
                <input
                  id="participantId"
                  type="text"
                  value={participantId}
                  onChange={(e) => setParticipantId(e.target.value)}
                  placeholder="e.g., participant_001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="text-center text-sm text-gray-500">— OR —</div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="enrollment" className="block text-sm font-medium text-gray-700 mb-2">
                  Enrollment Number (if applicable)
                </label>
                <input
                  id="enrollment"
                  type="text"
                  value={enrollmentNumber}
                  onChange={(e) => setEnrollmentNumber(e.target.value)}
                  placeholder="e.g., ENR12345"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Group Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Experiment Group
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedGroup(1)}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    selectedGroup === 1
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="font-bold text-lg mb-1">Group 1</div>
                  <div className="text-sm text-gray-600">Visual Only</div>
                  <div className="text-xs text-gray-500 mt-2">
                    Images without concept labels
                  </div>
                </button>

                <button
                  onClick={() => setSelectedGroup(4)}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    selectedGroup === 4
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="font-bold text-lg mb-1">Group 4</div>
                  <div className="text-sm text-gray-600">Visual + Concept</div>
                  <div className="text-xs text-gray-500 mt-2">
                    Images with concept descriptions
                  </div>
                </button>
              </div>
            </div>

            {/* Consent */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-5 w-5 text-blue-600 focus:ring-2 focus:ring-blue-500 rounded"
                />
                <span className="text-sm text-gray-700">
                  <strong>I consent to participate</strong> in this study. 
                  I understand that my responses will be recorded.
                </span>
              </label>
            </div>

            {/* Study Information */}
            <div className="bg-blue-50 p-4 rounded-lg text-sm text-gray-700">
              <h3 className="font-bold mb-2">📋 Study Information:</h3>
              <ul className="space-y-1 ml-4 list-disc">
                <li>You will see visual reasoning problems (Bongard problems)</li>
                <li>Each problem has positive and negative examples</li>
                <li>Your task: classify a query image as positive or negative</li>
                <li>Estimated time: 15-20 minutes</li>
              </ul>
            </div>

            {/* Start Button */}
            <Button
              onClick={handleStart}
              disabled={!consent || loading}
              className="w-full py-6 text-lg font-semibold"
              size="lg"
            >
              {loading ? "Starting..." : "Begin Experiment"}
            </Button>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 pt-4 border-t">
              Tallinn University of Technology | Department of Software Science
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Have an invite link? It will automatically start your session.</p>
          <p className="mt-2">
            Questions? Contact:{" "}
            <a href="mailto:mohit@taltech.ee" className="text-blue-600 hover:underline">
              mohit@taltech.ee
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

