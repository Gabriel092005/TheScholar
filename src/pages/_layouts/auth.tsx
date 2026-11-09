import { Link, Outlet } from "react-router-dom";
import { Award, FileText, Video } from "lucide-react";
import logo from "@/assets/logo-icone.png";

const destaques = [
  { icon: Award, texto: "Encontre bolsas de estudo e acompanhe as suas candidaturas" },
  { icon: FileText, texto: "Reveja os seus documentos antes de os enviar" },
  { icon: Video, texto: "Treine a entrevista e teste o seu nível de idioma" },
];

function Marca({ claro = false }: { claro?: boolean }) {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5">
      <img src={logo} alt="" className="h-9 w-9 rounded-lg object-cover" />
      <span className={`font-marca text-lg font-bold tracking-tight ${claro ? "text-white" : "text-gray-900 dark:text-white"}`}>
        Afroscholars
      </span>
    </Link>
  );
}

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col justify-between bg-zinc-950 p-12 text-white lg:flex">
        <Marca claro />
        <div>
          <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
            Da procura da bolsa à preparação da candidatura.
          </h2>
          <ul className="mt-8 space-y-4">
            {destaques.map(({ icon: Icon, texto }) => (
              <li key={texto} className="flex items-center gap-3 text-sm text-zinc-300">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                  <Icon size={16} />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-zinc-500">© {new Date().getFullYear()} Afroscholars</p>
      </aside>

      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 lg:hidden">
            <Marca />
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
