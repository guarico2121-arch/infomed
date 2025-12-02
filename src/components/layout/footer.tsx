import Link from "next/link";
import { Logo } from "@/components/icons/logo";
import { Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-4 md:items-start">
            <Link href="/">
              <Logo />
            </Link>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} InfoMed Central. Todos los derechos reservados.
            </p>
          </div>
          <div className="flex flex-col items-center gap-4 md:items-end">
            <nav className="flex gap-4">
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                Términos de Servicio
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                Política de Privacidad
              </Link>
            </nav>
            <div className="flex gap-4">
              <a href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" aria-label="GitHub" className="text-muted-foreground hover:text-primary">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
