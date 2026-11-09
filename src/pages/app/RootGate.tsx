import { SplashLogo } from "@/components/splash-logo";
import { useUser } from "@/api/useGetProfile";
import { AppLayoutAdmin } from "../_layouts/app";
import { WelcomePreview } from "./WelcomePreview";

export function RootGate() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <SplashLogo />;
  }

  if (!user) {
    return <WelcomePreview />;
  }

  return <AppLayoutAdmin />;
}
