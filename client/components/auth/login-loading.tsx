"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function LoginLoading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-neutral-900"
    >
      <div className="flex flex-col items-center gap-6">
        {/* AMP Logo with pulse animation */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Image
            src="/assets/AMP-TILES-LOGO.png"
            alt="AMP Tiles"
            width={200}
            height={68}
            priority
            className="h-auto w-auto"
          />
        </motion.div>

        {/* Loading text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-2"
        >
          <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
            Logging in...
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Please wait while we verify your credentials
          </p>
        </motion.div>

        {/* Animated dots */}
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -10, 0],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: "#c7a864" }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
