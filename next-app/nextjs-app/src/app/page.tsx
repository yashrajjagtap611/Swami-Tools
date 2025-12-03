import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-8 px-4 bg-white dark:bg-black sm:py-16 sm:px-8 md:py-24 md:px-12 lg:py-32 lg:px-16 lg:items-start">
        <Image
          className="dark:invert mb-4 sm:mb-0"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-4 text-center sm:gap-6 sm:items-start sm:text-left">
          <h1 className="max-w-xs text-2xl font-semibold leading-tight tracking-tight text-black dark:text-zinc-50 sm:text-3xl sm:leading-10">
            To get started, edit the page.tsx file.
          </h1>
          <p className="max-w-md text-base leading-7 text-zinc-600 dark:text-zinc-400 sm:text-lg sm:leading-8">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full text-sm font-medium sm:flex-row sm:gap-4 sm:text-base sm:w-auto">
          <a
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] sm:h-12 sm:w-auto md:w-[158px]"
            href="/login"
          >
            Login
          </a>
          <a
            className="flex h-11 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] sm:h-12 sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
