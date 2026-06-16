import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 px-6 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-black dark:text-zinc-500">
      <p>
        © {new Date().getFullYear()} Aumchanting ·{" "}
        <Link
          href="/contact"
          className="underline hover:text-zinc-800 dark:hover:text-zinc-300"
        >
          Contact
        </Link>{" "}
        ·{" "}
        <Link
          href="/privacy"
          className="underline hover:text-zinc-800 dark:hover:text-zinc-300"
        >
          Privacy
        </Link>{" "}
        ·{" "}
        <Link
          href="/terms"
          className="underline hover:text-zinc-800 dark:hover:text-zinc-300"
        >
          Terms
        </Link>
      </p>
    </footer>
  );
}
