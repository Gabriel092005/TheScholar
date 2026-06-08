import { useState, useRef, useEffect } from "react";
import { ChevronDown, Phone } from "lucide-react";

interface Country {
  code: string;
  name: string;
  dial: string;
  flag: string;
}

const countries: Country[] = [
  { code: "AO", name: "Angola", dial: "+244", flag: "🇦🇴" },
  { code: "PT", name: "Portugal", dial: "+351", flag: "🇵🇹" },
  { code: "BR", name: "Brasil", dial: "+55", flag: "🇧🇷" },
  { code: "MZ", name: "Moçambique", dial: "+258", flag: "🇲🇿" },
  { code: "CV", name: "Cabo Verde", dial: "+238", flag: "🇨🇻" },
  { code: "GW", name: "Guiné-Bissau", dial: "+245", flag: "🇬🇼" },
  { code: "ST", name: "São Tomé e Príncipe", dial: "+239", flag: "🇸🇹" },
  { code: "TL", name: "Timor-Leste", dial: "+670", flag: "🇹🇱" },
  { code: "US", name: "Estados Unidos", dial: "+1", flag: "🇺🇸" },
  { code: "GB", name: "Reino Unido", dial: "+44", flag: "🇬🇧" },
  { code: "FR", name: "França", dial: "+33", flag: "🇫🇷" },
  { code: "ES", name: "Espanha", dial: "+34", flag: "🇪🇸" },
  { code: "DE", name: "Alemanha", dial: "+49", flag: "🇩🇪" },
  { code: "IT", name: "Itália", dial: "+39", flag: "🇮🇹" },
  { code: "CN", name: "China", dial: "+86", flag: "🇨🇳" },
  { code: "ZA", name: "África do Sul", dial: "+27", flag: "🇿🇦" },
  { code: "NG", name: "Nigéria", dial: "+234", flag: "🇳🇬" },
  { code: "CM", name: "Camarões", dial: "+237", flag: "🇨🇲" },
  { code: "CG", name: "República do Congo", dial: "+242", flag: "🇨🇬" },
  { code: "CD", name: "RDCongo", dial: "+243", flag: "🇨🇩" },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
  disabled?: boolean;
}

const inputBase = `h-12 rounded-xl text-sm font-medium
  border transition-all duration-200 outline-none
  focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-0`;

const inputNormal = `bg-gray-50 border-gray-200 text-gray-900 placeholder:text-zinc-400
  dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white`;

const inputErr = `bg-red-50 border-red-300 text-gray-900 placeholder:text-red-300
  dark:bg-red-500/[0.08] dark:border-red-500/40 dark:text-white`;

export function PhoneInput({ value, onChange, hasError, disabled }: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Country>(
    countries.find((c) => value.startsWith(c.dial)) || countries[0]
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  const numberPart = value.startsWith(selected.dial)
    ? value.slice(selected.dial.length).trim()
    : value;

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    onChange(digits ? `${selected.dial} ${digits}` : "");
  }

  function selectCountry(country: Country) {
    setSelected(country);
    setOpen(false);
    const oldDial = selected.dial;
    const digits = value.replace(/\D/g, "").slice(oldDial.replace(/\D/g, "").length);
    onChange(digits ? `${country.dial} ${digits}` : "");
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative group flex">
        <Phone
          size={15}
          className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-colors duration-200
            ${hasError ? "text-red-400" : "text-zinc-400 group-focus-within:text-emerald-500"}`}
        />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          disabled={disabled}
          className={`relative flex items-center gap-1.5 pl-10 pr-2.5 rounded-l-xl border-r-0 transition-colors shrink-0
            ${hasError ? inputErr : inputNormal}
            ${inputBase}
            rounded-r-none
          `}
        >
          <span className="text-base leading-none">{selected.flag}</span>
          <span className="text-xs font-semibold">{selected.dial}</span>
          <ChevronDown
            size={12}
            className={`text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        <input
          type="tel"
          value={numberPart}
          onChange={handleNumberChange}
          placeholder="999 999 999"
          disabled={disabled}
          className={`flex-1 h-12 rounded-r-xl text-sm font-medium
            border transition-all duration-200 outline-none
            focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-0
            rounded-l-none
            ${hasError ? inputErr : inputNormal}
          `}
        />
      </div>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 w-72 max-h-60 overflow-y-auto
          bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800
          shadow-lg shadow-black/5"
        >
          {countries.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={() => selectCountry(country)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm transition-colors
                ${selected.code === country.code
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                }`}
            >
              <span className="text-lg leading-none">{country.flag}</span>
              <span className="flex-1 text-left font-medium">{country.name}</span>
              <span className="text-xs text-zinc-400 font-semibold">{country.dial}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
