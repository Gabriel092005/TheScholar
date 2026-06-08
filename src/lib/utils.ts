import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInialts(name:string){
    const initials= name.split('').map((word)=>word.charAt(0).toUpperCase())
    .slice(0,2)
    .join('')
    return initials
  }



