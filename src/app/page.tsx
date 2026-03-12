import InputForm from "@/components/InputForm";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-16 sm:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Reels<span className="text-violet-400">IQ</span>
        </h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
          Bulk Instagram Reel transcript analysis. Extract hooks, structures,
          and strategies from top-performing content.
        </p>
      </div>
      <InputForm />
    </main>
  );
}
