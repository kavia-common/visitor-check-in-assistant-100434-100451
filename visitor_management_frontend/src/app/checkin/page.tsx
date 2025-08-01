"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

// Branding/colors – based on provided container details
const BRAND = {
  primary: "#1976D2",
  secondary: "#424242",
  accent: "#FFB300",
  background: "#fff",
  foreground: "#171717",
};

// Types for API interaction (from OpenAPI spec)
type VisitorCheckinStepRequest = {
  conversation_state: Record<string, string>;
  user_input: string;
  input_mode: "voice" | "text";
};
type VisitorCheckinStepResponse = {
  next_prompt: string;
  next_field: string | null;
  conversation_state: Record<string, string>;
  is_complete?: boolean;
  errors?: string[] | null;
  advice?: string | null;
};

// Utility: fetch backend host from env or assume same origin for preview/dev
const API_BASE =
  process.env.NEXT_PUBLIC_KIOSK_BACKEND_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "";

// Input mode step: text/voice
interface CheckinStepProps {
  prompt: string;
  field: string | null;
  onSubmit: (
    user_input: string,
    input_mode: "voice" | "text",
    ocrImageFile?: File
  ) => void;
  input_mode: "voice" | "text";
  loading: boolean;
  field_type?: string; // for future (email, id, etc)
  errors?: string[];
  advice?: string | null;
}

// --- Kiosk Input Step Component (supports voice, text, OCR, camera) ---
const KioskCheckinStep: React.FC<CheckinStepProps> = ({
  prompt,
  field,
  onSubmit,
  input_mode,
  loading,
  errors,
  advice,
}) => {
  const [localInput, setLocalInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Voice recording logic
  async function startRecording() {
    setIsRecording(true);
    audioChunksRef.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new window.MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };
    mediaRecorder.onstop = async () => {
      setIsRecording(false);
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      // upload audio for STT
      setIsUploading(true);
      const sttText = await uploadAudioForSTT(audioBlob);
      setIsUploading(false);
      if (sttText && sttText.length > 0) {
        setLocalInput(sttText);
      }
    };
    mediaRecorder.start();
  }
  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  // Camera for ID upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // --- Backend STT stub integration ---
  async function uploadAudioForSTT(audioBlob: Blob) {
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "checkin-voice.webm");
      const res = await fetch(API_BASE + "/api/speech/stt", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Speech-to-text failed");
      const data = await res.json();
      // Assume the stub backend returns { text: "..." }
      return data.text || "";
    } catch {
      return "";
    }
  }

  // --- UI ---
  return (
    <div
      className="flex flex-col items-center justify-center w-full max-w-lg rounded-lg shadow-xl p-6 bg-white gap-6"
      style={{ borderColor: BRAND.primary, borderWidth: 2, minHeight: 360 }}
    >
      <div className="w-full">
        <p className="text-lg sm:text-xl font-semibold mb-2" style={{ color: BRAND.primary }}>
          {prompt}
        </p>
        {(advice || (errors && errors.length > 0)) && (
          <div className="mb-2">
            {advice && (
              <span className="text-sm text-blue-900 block italic font-medium">
                💡 {advice}
              </span>
            )}
            {errors &&
              errors.map((err, idx) => (
                <span key={idx} className="text-sm text-red-700 block">
                  ⚠️ {err}
                </span>
              ))}
          </div>
        )}
      </div>

      {field === "id_image" ? (
        <>
          <span className="text-sm mb-2">
            Please upload or capture a clear photo of your government-issued ID for OCR.
          </span>
          <div className="flex gap-3 items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={async (e) => {
                if (e.target.files && e.target.files.length > 0) {
                  const file = e.target.files[0];
                  await onSubmit("", "text", file); // OCR handled in parent, not as direct field
                }
              }}
            />
            <button
              className="rounded px-4 py-2 font-bold bg-[#1976D2] text-white hover:bg-blue-700 transition"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || isUploading}
              type="button"
            >
              {isUploading ? "Uploading..." : "Upload ID"}
            </button>
          </div>
        </>
      ) : (
        <>
          {input_mode === "text" ? (
            <form
              className="w-full flex gap-3 items-center"
              onSubmit={e => {
                e.preventDefault();
                onSubmit(localInput.trim(), "text");
              }}
            >
              <input
                type="text"
                className="flex-1 px-4 py-2 border border-gray-300 rounded text-base focus:outline-none focus:ring-2"
                placeholder="Type your answer or switch to voice"
                value={localInput}
                onChange={e => setLocalInput(e.target.value)}
                disabled={loading}
                autoFocus
              />
              <button
                className="rounded px-4 py-2 font-bold bg-[#1976D2] text-white hover:bg-blue-700 transition"
                type="submit"
                disabled={!localInput || loading}
              >
                Submit
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-3 w-full">
              <button
                className={`rounded-full p-4 bg-[${BRAND.primary}] text-white shadow-md flex items-center gap-2`}
                style={{
                  background:
                    isRecording || loading
                      ? BRAND.accent
                      : BRAND.primary,
                  opacity: loading ? 0.7 : 1,
                }}
                onClick={() => (isRecording ? stopRecording() : startRecording())}
                type="button"
                disabled={loading || isUploading}
              >
                <span className="material-icons" aria-hidden>
                  {isRecording ? "mic_off" : "mic"}
                </span>
                {isRecording ? "Stop" : "Tap to Speak"}
              </button>
              <span className="text-gray-600 text-xs">
                {isRecording
                  ? "Listening... tap when done."
                  : isUploading
                  ? "Transcribing..."
                  : "Start speaking your answer."}
              </span>
              <div className="flex gap-3 w-full">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-base"
                  value={localInput}
                  onChange={e => setLocalInput(e.target.value)}
                  placeholder="(You can edit transcript)"
                  disabled={loading}
                />
                <button
                  className="rounded px-4 py-2 bg-[#1976D2] text-white font-bold hover:bg-blue-700"
                  onClick={() => onSubmit(localInput.trim(), "voice")}
                  disabled={!localInput || loading}
                  type="button"
                >
                  Go
                </button>
              </div>
              <button
                className="underline text-[14px] mt-1 text-blue-700 hover:text-blue-900"
                style={{ background: "transparent" }}
                onClick={() => {
                  // Quick switch
                  if (!loading) setLocalInput("");
                }}
                disabled={loading}
                type="button"
              >
                Reset/clear input
              </button>
            </div>
          )}

          <div className="w-full flex items-center justify-between mt-4">
            <button
              className={`rounded px-2 py-1 text-xs border ${input_mode === "text" ? "bg-gray-200 text-black" : "bg-white text-blue-900"}`}
              onClick={() => {
                if (!loading)
                  onSubmit(localInput, input_mode === "text" ? "voice" : "text");
              }}
              disabled={loading}
              type="button"
            >
              Switch to {input_mode === "text" ? "voice" : "keyboard"}
            </button>
            {field === "email" ||
            field === "full_name" ||
            field === "host" ? (
              <span className="text-[10px] text-gray-400">{"Touch keyboard icon to switch mode"}</span>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
};

// --- Main Check-in flow (conversation logic with backend) ---
export default function VisitorKioskCheckinPage() {
  const [step, setStep] = useState<VisitorCheckinStepResponse | null>(null);
  const [conversationState, setConversationState] = useState<Record<string, string>>({});
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const [loading, setLoading] = useState(false);
  const [finalized, setFinalized] = useState<unknown | null>(null);
  const [systemError, setSystemError] = useState<string | null>(null);

  // Kick off first prompt on mount
  React.useEffect(() => {
    // Empty input/empty state triggers "start"
    handleCheckinStep("", "text");
    // eslint-disable-next-line
  }, []);

  // API: conversational step
  async function handleCheckinStep(
    user_input: string,
    mode: "text" | "voice",
    ocrFile?: File
  ) {
    setLoading(true);
    setSystemError(null);

    // OCR IMAGE? If so, send file and prefill
    if (step?.next_field === "id_image" && ocrFile) {
      // upload to backend for OCR, update conversationState w/ result
      try {
        const ocrResp = await uploadOCRForID(ocrFile);
        if (ocrResp) {
          // update state with returned fields
          const newState = { ...conversationState, ...ocrResp };
          setConversationState(newState);
          // re-prompt next step with prefilled state
          await backendCheckinStep("", mode, newState);
        }
      } catch {
        setSystemError("Photo upload/OCR failed. Please try again.");
      }
      setLoading(false);
      return;
    }

    // Normal case (text/voice input)
    await backendCheckinStep(user_input, mode, conversationState);
    setLoading(false);
  }

  // --- API Request ---
  async function backendCheckinStep(
    user_input: string,
    input_mode: "voice" | "text",
    state_snapshot: Record<string, string>
  ) {
    try {
      const resp = await fetch(API_BASE + "/api/visitor/checkin-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_state: state_snapshot,
          user_input,
          input_mode,
        } as VisitorCheckinStepRequest),
      });
      if (!resp.ok) {
        setSystemError("Backend error. Please retry.");
        return;
      }
      const data: VisitorCheckinStepResponse = await resp.json();
      setStep(data);
      setInputMode(input_mode); // stick to prior mode
      setConversationState(data.conversation_state);
      // If is_complete, finalize
      if (data.is_complete) {
        await finalizeCheckin(data.conversation_state);
      }
    } catch {
      setSystemError("Could not contact server. Check connection.");
    }
  }

  async function uploadOCRForID(file: File) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const resp = await fetch(API_BASE + "/api/ocr/upload-id", {
        method: "POST",
        body: formData,
      });
      if (!resp.ok) throw new Error();
      return await resp.json();
    } catch {
      return null;
    }
  }

  // Finalize and display feedback
  async function finalizeCheckin(finalState: Record<string, string>) {
    setLoading(true);
    try {
      const resp = await fetch(API_BASE + "/api/visitor/checkin-finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalState),
      });
      if (!resp.ok) throw new Error();
      setFinalized(await resp.json());
    } catch {
      setSystemError(
        "Could not complete check-in. Please see the front desk."
      );
    }
    setLoading(false);
  }

  // Helper type guard for finalized object
  function isVisitLogOut(obj: unknown): obj is {
    visitor: { full_name?: string };
    host: { full_name?: string };
    purpose?: string;
    check_in_time?: string;
  } {
    return Boolean(
      obj &&
        typeof obj === "object" &&
        "visitor" in obj &&
        "host" in obj &&
        "check_in_time" in obj
    );
  }

  // UI ---------------------------------------------------
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 pb-6"
      style={{ background: BRAND.background }}
    >
      {/* Branding banner */}
      <header
        className="w-full flex items-center py-4 px-2 shadow-md"
        style={{ background: BRAND.primary }}
      >
        <span className="mr-3">
          <Image src="/favicon.ico" alt="logo" width={40} height={40} />
        </span>
        <span className="text-white text-xl font-extrabold tracking-wide">
          Welcome to Visitor Kiosk
        </span>
        <span className="flex-1" />
        <span className="text-white text-md mr-2">Admin?</span>
        <Link
          href="/admin"
          className="rounded px-3 py-1 text-xs bg-white text-[#1976D2] font-bold hover:bg-gray-100"
        >
          Admin Login
        </Link>
      </header>

      <main className="flex flex-col items-center pt-10 gap-3 w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-2" style={{ color: BRAND.primary }}>
          Guest Check-In
        </h1>

        {systemError && (
          <div className="bg-red-100 text-red-800 border border-red-300 rounded p-2 mb-2 max-w-lg w-full flex items-center justify-center">
            <span className="material-icons mr-2">error</span> {systemError}
          </div>
        )}

        {/* Show either the step-by-step flow OR final summary */}
        {!finalized ? (
          !!step && (
            <KioskCheckinStep
              prompt={step.next_prompt}
              field={step.next_field}
              onSubmit={(input, mode, ocrFile) => {
                // input_mode switching: if OCR, handled separately
                if (step.next_field === "id_image" && ocrFile) {
                  handleCheckinStep("", mode, ocrFile);
                } else if (mode !== inputMode) {
                  setInputMode(mode);
                } else {
                  handleCheckinStep(input, mode);
                }
              }}
              input_mode={inputMode}
              loading={loading}
              errors={step.errors ?? undefined}
              advice={step.advice ?? undefined}
            />
          )
        ) : isVisitLogOut(finalized) ? (
          <div className="flex flex-col items-center p-6 bg-green-50 border border-green-500 rounded shadow mt-8 max-w-lg">
            <span className="material-icons text-6xl mb-3 text-green-700">
              check_circle
            </span>
            <h2 className="text-2xl font-bold text-green-700 mb-2">
              Thank you, check-in complete!
            </h2>
            <p className="text-lg mb-2">
              <b>Name:</b> {finalized.visitor?.full_name}
              <br />
              <b>Host:</b> {finalized.host?.full_name}
              <br />
              <b>Purpose:</b> {finalized.purpose}
              <br />
              <b>Check-in Time:</b> {finalized.check_in_time ? new Date(finalized.check_in_time).toLocaleString() : ""}
            </p>
            <p className="font-medium">Please wait to be called or contact your host!</p>
            <Link
              href="/"
              className="mt-4 px-6 py-2 rounded bg-[#1976D2] text-white text-lg font-bold shadow hover:bg-blue-700"
            >
              New Check-in
            </Link>
          </div>
        ) : null}
      </main>

      <footer className="text-gray-400 py-4 w-full flex justify-center">
        <span className="text-xs">Powered by A.I. Check-In Assistant Kiosk</span>
      </footer>
    </div>
  );
}
