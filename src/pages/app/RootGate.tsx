import { Loader2 } from "lucide-react";
import { useUser } from "@/api/useGetProfile";
import { AppLayoutAdmin } from "../_layouts/app";
import { WelcomePreview } from "./WelcomePreview";

export function RootGate() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user) {
    return <WelcomePreview />;
  }

  return <AppLayoutAdmin />;
}
