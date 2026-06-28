import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/logo-sofismart.png";

type AppLogoProps = {
  /** sidebar = barre latérale ouverte, compact = barre repliée / header mobile */
  size?: "sidebar" | "compact" | "login";
  className?: string;
  priority?: boolean;
};

export function AppLogo({ size = "sidebar", className, priority }: AppLogoProps) {
  if (size === "compact") {
    return (
      <Image
        src={LOGO_SRC}
        alt="Sofi Smart"
        width={44}
        height={44}
        priority={priority}
        className={cn("h-10 w-10 shrink-0 object-contain object-left", className)}
      />
    );
  }

  if (size === "login") {
    return (
      <Image
        src={LOGO_SRC}
        alt="Sofi Smart"
        width={320}
        height={96}
        priority={priority}
        className={cn(
          "mx-auto h-[5rem] w-auto max-w-[min(320px,90vw)] object-contain",
          className,
        )}
      />
    );
  }

  return (
    <Image
      src={LOGO_SRC}
      alt="Sofi Smart"
      width={220}
      height={64}
      priority={priority}
      className={cn("h-14 w-auto max-w-[220px] object-contain object-left", className)}
    />
  );
}
