// app/page.tsx
export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center h-screen space-y-6">
      <h1 className="text-5xl font-extrabold text-blue-600">Tailwind is Working!</h1>
      <p className="text-lg text-gray-700">If you see this styled text, Tailwind is applied properly.</p>
      <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">Test Button</button>
    </main>
  );
}
