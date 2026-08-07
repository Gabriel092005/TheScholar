import { motion } from "framer-motion";

interface AnimatedLettersProps {
  text: string;
  className?: string;
  letterClassName?: string;
  delay?: number;
  stagger?: number;
  loop?: boolean;
  waveAmplitude?: number;
  waveDuration?: number;
}

const letterEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function AnimatedLetters({
  text,
  className,
  letterClassName,
  delay = 0,
  stagger = 0.04,
  loop = false,
  waveAmplitude = 6,
  waveDuration = 3.2,
}: AnimatedLettersProps) {
  const words = text.split(" ");

  return (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      aria-label={text}
    >
      {words.map((word, wordIndex) => {
        const baseOffset = wordIndex * 0.14;
        return (
          <span key={wordIndex} className="inline-block whitespace-nowrap" aria-hidden="true">
            {word.split("").map((char, charIndex) => {
              const i = baseOffset + charIndex * 0.05;
              return (
                <motion.span
                  key={charIndex}
                  className="inline-block"
                  animate={loop ? { y: [0, -waveAmplitude, 0] } : undefined}
                  transition={
                    loop
                      ? {
                          duration: waveDuration,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.12,
                        }
                      : undefined
                  }
                >
                  <motion.span
                    className={`inline-block ${letterClassName ?? ""}`}
                    style={{ display: "inline-block", transformStyle: "preserve-3d" }}
                    variants={{
                      hidden: { y: "0.8em", opacity: 0, rotateX: -80, transformPerspective: 600 },
                      visible: {
                        y: 0,
                        opacity: 1,
                        rotateX: 0,
                        transition: { duration: 0.7, ease: letterEase },
                      },
                    }}
                  >
                    {char}
                  </motion.span>
                </motion.span>
              );
            })}
            {wordIndex < words.length - 1 && <span className="inline-block">&nbsp;</span>}
          </span>
        );
      })}
    </motion.span>
  );
}
