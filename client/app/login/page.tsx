import Image from "next/image";
import { LoginHero } from "@/components/auth/login-hero";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 lg:min-h-screen">
      <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-10 max-lg:max-w-lg lg:grid-cols-2">
          <div className="flex flex-col items-center justify-center max-lg:order-1">
            <div className="mb-8 flex flex-1 items-center justify-center lg:mb-10">
              <Image
                src="/assets/AMP-TILES-LOGO.png"
                alt="AMP Tiles"
                width={320}
                height={100}
                priority
                className="h-16 w-auto object-contain sm:h-20 lg:h-24 xl:h-28"
              />
            </div>
            <LoginHero />
          </div>
          <div className="max-lg:order-2">
            <LoginForm />
          </div>
        </div>
    </div>
  );
}
