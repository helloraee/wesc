"use client";

import Image from "next/image";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-w-900 px-6 text-center">
      <Image
        src="/assets/WEST_Logo.svg"
        alt="West End Sports Club"
        width={100}
        height={100}
        className="mb-6 opacity-60"
      />
      <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-white">
        You&apos;re Offline
      </h1>
      <p className="mt-3 max-w-sm text-sm text-w-300">
        It looks like you&apos;ve lost your internet connection. Some features
        may be limited until you reconnect.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 rounded-md bg-w-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-w-500"
      >
        Try Again
      </button>
    </div>
  );
}
