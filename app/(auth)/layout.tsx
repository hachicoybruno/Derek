import Link from "next/link";
import { Logo } from "@/components/logo";

export default function LayoutAuth({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 py-10">
      <Link href="/" className="self-center" aria-label="Ir al inicio">
        <Logo />
      </Link>
      {children}
    </main>
  );
}
