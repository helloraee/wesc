"use client";

import Image from "next/image";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push("/back-office/dashboard");
    router.refresh();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <Card className="border-w-700 bg-w-800/50 backdrop-blur-sm">
        <CardHeader className="items-center space-y-4 pb-2">
          <Image
            src="/assets/WEST_Logo.png"
            alt="West End Sports Club"
            width={80}
            height={80}
            priority
            className="drop-shadow-lg"
          />
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-white">
              West End SC
            </h1>
            <p className="mt-1 text-sm text-w-300">
              Sign in to the back office
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-w-200">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@westendsc.mv"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-w-600 bg-w-900 text-white placeholder:text-w-500 focus-visible:ring-w-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-w-200">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-w-600 bg-w-900 text-white placeholder:text-w-500 focus-visible:ring-w-400"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-red-400"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-w-600 text-white hover:bg-w-500"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
