import Navbar from "@/src/components/Navbar";
import OrderForm from "@/src/components/OrderForm";
import PriceChart from "@/src/components/PriceChart";

export default function TradePage() {
  return (
    <main className="min-h-screen bg-[#0a0e27] text-white">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-white">
            <span className="text-k-teal">Trade</span>
          </h1>
          <p className="text-gray-400 mt-1">실시간 매수/매도 주문</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Price chart — 2/3 width on desktop */}
          <div className="lg:col-span-2">
            <PriceChart />
          </div>
          {/* Order form — 1/3 width */}
          <div className="lg:col-span-1">
            <OrderForm />
          </div>
        </div>
      </div>
    </main>
  );
}
