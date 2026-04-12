"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";

export default function HoldingPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-w-900">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--w-800)_0%,_var(--w-900)_70%)]" />

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center gap-8 border-none px-6 text-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Image
            src="/assets/WEST_Logo.svg"
            alt="West End Sports Club Crest"
            width={160}
            height={160}
            priority
            className="drop-shadow-2xl"
          />
        </motion.div>

        {/* Club name */}
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-4xl font-bold uppercase tracking-wider text-white sm:text-5xl md:text-6xl">
            West End
          </h1>
          <p className="font-display text-lg font-semibold uppercase tracking-[0.3em] text-w-300 sm:text-xl">
            Sports Club
          </p>
        </div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="max-w-md text-xl font-medium text-w-200 sm:text-2xl"
        >
          The Pack Is Getting Ready.
        </motion.p>

        {/* Divider */}
        <div className="h-px w-24 bg-w-600" />

        {/* Email capture */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35 }}
          className="w-full max-w-sm"
        >
          <p className="mb-4 text-sm text-w-300">
            Be the first to know when we launch.
          </p>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 rounded-md border border-w-700 bg-w-800 px-4 py-3 text-sm text-white placeholder:text-w-400 focus:border-w-500 focus:outline-none focus:ring-1 focus:ring-w-500"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-md bg-w-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-w-500 disabled:opacity-50"
            >
              {status === "loading" ? "..." : "Notify Me"}
            </button>
          </form>

          {status === "success" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-sm text-green-400"
            >
              You&apos;re on the list! We&apos;ll be in touch.
            </motion.p>
          )}
          {status === "error" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-sm text-red-400"
            >
              Something went wrong. Please try again.
            </motion.p>
          )}
        </motion.div>

        {/* Social links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.35 }}
          className="flex gap-6 pt-4"
        >
          <SocialLink href="https://instagram.com/westendsc.mv" label="Instagram">
            <InstagramIcon />
          </SocialLink>
          <SocialLink href="https://facebook.com/westendsc.mv" label="Facebook">
            <FacebookIcon />
          </SocialLink>
          <SocialLink href="https://twitter.com/westendsc_mv" label="X / Twitter">
            <XIcon />
          </SocialLink>
        </motion.div>

        {/* Footer */}
        <p className="pt-8 text-xs text-w-500">
          Est. 2024 &middot; Mal&eacute;, Maldives
        </p>
      </motion.main>
    </div>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="text-w-400 transition-colors hover:text-white"
    >
      {children}
    </a>
  );
}

function InstagramIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l11.733 16h4.267l-11.733 -16h-4.267z" />
      <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
    </svg>
  );
}
