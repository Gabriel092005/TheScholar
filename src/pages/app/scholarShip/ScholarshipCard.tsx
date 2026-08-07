import { motion } from "framer-motion";
import {
  MapPin,
  Calendar,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { Scholarship } from "./types";

interface ScholarshipCardProps {
  scholarship: Scholarship;
  onSelect: (scholarship: Scholarship) => void;
  index?: number;
}

export function ScholarshipCard({
  scholarship,
  onSelect,
  index = 0,
}: ScholarshipCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="group relative bg-white dark:bg-[#111113] border border-gray-200/70 dark:border-white/[0.06] rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden"
    >
      {/* Cover image */}
      <div className={`relative h-48 w-full overflow-hidden ${scholarship.bgImage ? '' : 'bg-emerald-600'}`}>
        {scholarship.bgImage ? (
          <img
            src={scholarship.bgImage}
            alt={scholarship.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <GraduationCap className="h-12 w-12 text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-base font-bold text-white leading-snug line-clamp-2">
            {scholarship.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <MapPin className="h-3 w-3 text-emerald-300 shrink-0" />
            <span className="text-[11px] text-gray-300 truncate">
              {scholarship.university}{scholarship.country ? `, ${scholarship.country}` : ""}
            </span>
          </div>
        </div>
        <div className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-black/40 text-white/90 backdrop-blur-sm">
          {scholarship.level}
        </div>
      </div>

      {/* Content */}
      <div className="relative p-4 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-xs text-gray-500 dark:text-zinc-500 font-medium mb-2">
            {scholarship.area}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-zinc-400 mb-3">
            <Calendar className="h-3 w-3 text-emerald-500 shrink-0" />
            <span>Prazo: <span className="font-semibold text-gray-900 dark:text-white">{scholarship.deadline}</span></span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {scholarship.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-zinc-400 border border-gray-200/60 dark:border-white/[0.06]"
              >
                {tag}
              </span>
            ))}
            {scholarship.tags.length > 3 && (
              <span className="text-[9px] px-2 py-1 rounded-md bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-zinc-500">
                +{scholarship.tags.length - 3}
              </span>
            )}
          </div>

        </div>

        {/* CTA */}
        <button
          onClick={() => onSelect(scholarship)}
          className="w-full mt-4 bg-emerald-600 dark:bg-emerald-600 text-white hover:bg-emerald-500 dark:hover:bg-emerald-500 rounded-xl h-10 font-semibold flex items-center justify-center gap-2 transition-all duration-200 text-xs group/btn"
        >
          <span>Ver Detalhes</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}
