import Navbar from "@/src/components/Navbar";
import Portfolio from "@/src/components/Portfolio";

export default function PortfolioPage() {
  return (
    <main className="min-h-screen bg-[#0a0e27] text-white">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-5xl mx-auto">
        <Portfolio />
      </div>
    </main>
  );
}
