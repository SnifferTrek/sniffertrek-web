"use client";

const DESTINATIONS = [
  { name: "Santorini", img: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=300&q=80" },
  { name: "Nordlichter", img: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=300&q=80" },
  { name: "Venedig", img: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=300&q=80" },
  { name: "Malediven", img: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=300&q=80" },
  { name: "Paris", img: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=300&q=80" },
  { name: "Barcelona", img: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=300&q=80" },
  { name: "Amalfi", img: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=300&q=80" },
  { name: "Hallstatt", img: "https://images.unsplash.com/photo-1617329636938-90cf1b12c279?w=300&q=80" },
  { name: "Dubrovnik", img: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=300&q=80" },
  { name: "Cinque Terre", img: "https://images.unsplash.com/photo-1534008897995-27a23e859048?w=300&q=80" },
];

const doubled = [...DESTINATIONS, ...DESTINATIONS];

export default function InspirationTicker() {
  return (
    <section className="py-8 bg-white overflow-hidden">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 text-center mb-5">
        Lass dich inspirieren
      </h2>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
        <div className="flex gap-6 animate-scroll-destinations w-max">
          {doubled.map((d, i) => (
            <div
              key={`${d.name}-${i}`}
              className="flex-shrink-0 text-center group cursor-pointer"
            >
              <div className="w-[110px] h-[110px] rounded-full overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 mx-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={d.img}
                  alt={d.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <p className="mt-2 text-xs font-semibold text-gray-600 group-hover:text-blue-600 transition-colors">
                {d.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
