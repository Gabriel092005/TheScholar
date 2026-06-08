const MULTICAIXA_IMG = "https://emis.ao/media/mfznpybd/emis_logo_multicaixa-logoprancheta-1.png?anchor=center&rnd=133184617373700000&preset=mediatextslidermin320";
const EXPRESS_IMG = "https://rna.ao/rna.ao/wp-content/uploads/2022/04/32F6F3FA-4E3F-45B6-BA5A-54025F011B11-770x512.jpeg";

export function ExpressIcon({ className }: { className?: string }) {
  return (
    <img
      src={EXPRESS_IMG}
      alt="Express"
      className={className}
      style={{ objectFit: "contain", borderRadius: "8px" }}
    />
  );
}

export function MulticaixaIcon({ className }: { className?: string }) {
  return (
    <img
      src={MULTICAIXA_IMG}
      alt="Multicaixa"
      className={className}
      style={{ objectFit: "contain", borderRadius: "8px" }}
    />
  );
}

export function PayPalIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" className={className}>
      <rect width="36" height="36" rx="6" fill="#003087" />
      <path d="M12.5 26L13.8 18.5H16.5C20.1 18.5 22.3 16.6 23 13.2C23.3 11.7 23.1 10.5 22.5 9.6C21.9 8.7 20.9 8.2 19.6 8.1C19.1 8.1 18.5 8 17.8 8H13L11 26H12.5Z" fill="#0099DF" />
      <path d="M14 17.5L14.5 14.5L17.5 14.5C19 14.5 20.2 15 20.7 16.1C21 16.8 20.9 17.8 20.5 18.8C19.9 20.2 18.5 21 16.8 21H15.5L14 17.5Z" fill="#012169" />
    </svg>
  );
}
