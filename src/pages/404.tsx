
import { Link } from "react-router-dom";

export function NotFound(){


    return(
        <div className="flex h-screen flex-col items-center justify-center gap-2 bg-white dark:bg-[#111113]">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Página não encontrada</h1>
            <p className="text-gray-500 dark:text-zinc-400">
                Voltar para o <Link to="/sign-in" className="text-sky-500 dark:text-sky-400">Dashboard</Link> 
            </p>
        </div>
    )

}