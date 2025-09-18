"use client";

import Image from "next/image";
import { motion } from "framer-motion";

type Goat = { name: string; sport: string; src: string };

export default function GoatsGrid({ items }: { items: Goat[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {items.map((p, i) => (
        <motion.div
          key={i}
          className="group relative overflow-hidden rounded-2xl shadow-lg"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.08 }}
        >
          <Image
            src={p.src}
            alt={p.name}
            width={800}
            height={1000}
            className="h-52 md:h-64 w-full object-cover transition-transform duration-500 group-hover:scale-110"
            priority={i < 2}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80"></div>
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <div>
              <p className="text-white text-lg font-semibold drop-shadow">{p.name}</p>
              <p className="text-white/80 text-xs drop-shadow">{p.sport}</p>
            </div>
            <span className="text-white/90 text-xs bg-white/20 backdrop-blur px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition">View legacy</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}


