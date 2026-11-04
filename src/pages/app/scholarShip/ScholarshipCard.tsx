import {
  MapPin,
  Calendar,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { Scholarship } from "./types";
import { CardAccent, Reveal, cardArrow, cardTitle, userCard } from "@/components/user-ui";

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
    <Reveal index={index}>
      <article className={`${userCard} flex h-full flex-col`}>
        <CardAccent />

        {/* Cover image */}
        <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/5">
          {scholarship.bgImage ? (
            <img
              src={scholarship.bgImage}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <GraduationCap className="h-9 w-9text-emerald-300 transition-transform duration-500 group-hover:scale-110 dark:text-emerald-500/40" />
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-lg bg-white/90 px-2 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm backdrop-blur-sm dark:bg-black/60 dark:text-emerald-300">
            {scholarship.level}
          </span>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-4">
          {scholarship.area && (
            <p className="mb-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {scholarship.area}
            </p>
          )}
          <h3 className={`${cardTitle} line-clamp-2 text-sm`}>{scholarship.title}</h3>

          <div className="mt-3 space-y-1.5 text-xs text-gray-500 dark:text-zinc-400">
            <p className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              <span className="truncate">
                {scholarship.university}{scholarship.country ? `, ${scholarship.country}` : ""}
              </span>
            </p>
            <p className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              <span>
                Prazo: <span className="font-medium text-gray-900 dark:text-white">{scholarship.deadline}</span>
              </span>
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {scholarship.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-white/[0.06] dark:text-zinc-400"
              >
                {tag}
              </span>
            ))}
            {scholarship.tags.length > 3 && (
              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500 dark:bg-white/[0.06] dark:text-zinc-500">
                +{scholarship.tags.length - 3}
              </span>
            )}
          </div>

          {/* O ::after estica a área clicável do botão a todo o card */}
          <div className="mt-auto flex items-center justify-between pt-3">
            <button
              onClick={() => onSelect(scholarship)}
              className="text-sm font-semibold text-emerald-600 after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-emerald-500 dark:text-emerald-400"
            >
              Ver detalhes
            </button>
            <span className={cardArrow}>
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </article>
    </Reveal>
  );
}
