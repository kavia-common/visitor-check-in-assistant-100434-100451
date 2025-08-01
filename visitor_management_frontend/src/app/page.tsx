import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 py-10">
      <div className="bg-white rounded shadow-lg p-10 flex flex-col items-center max-w-lg gap-8 border border-gray-200">
        <span className="mb-4">
          <Image src="/favicon.ico" alt="kiosk logo" width={64} height={64} />
        </span>
        <span className="text-3xl font-extrabold text-[#1976D2] mb-2">
          Welcome to Visitor Kiosk
        </span>
        <p className="text-lg text-gray-600 mb-4">
          Please touch below to begin check-in.
        </p>
        <a
          href="/checkin"
          className="rounded-full px-10 py-4 font-bold bg-[#1976D2] text-white text-2xl shadow-lg hover:bg-blue-700 focus:bg-[#FFB300] transition"
        >
          Start Check-In
        </a>
        <span className="text-gray-400 text-xs mt-6">
          Powered by AI Check-In Assistant Kiosk
        </span>
      </div>
      <footer className="text-gray-300 mt-10">
        &copy; {new Date().getFullYear()} Visitor Kiosk | For help, ask the front desk.
      </footer>
    </div>
  );
}
