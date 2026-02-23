"use client";

import { ArrowRight } from "lucide-react";

const TRIPS = [
  {
    title: "Roadtrip Südfrankreich",
    route: "Zürich → Côte d'Azur → Provence → Zürich",
    days: 14,
    tags: ["Auto", "Hotels", "POIs", "2'340 km"],
    img: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80",
  },
  {
    title: "Bella Italia",
    route: "Cinque Terre → Rom → Amalfi → Venedig",
    days: 10,
    tags: ["Zug", "Hotels", "Bucket List", "1'800 km"],
    img: "https://images.unsplash.com/photo-1534008897995-27a23e859048?w=800&q=80",
  },
  {
    title: "Spanien & Portugal",
    route: "Barcelona → Madrid → Lissabon → Porto",
    days: 21,
    tags: ["Auto", "Flug", "Hotels", "3'100 km"],
    img: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80",
  },
];

export default function ExampleTrips() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2">
        Inspiration gefällig?
      </h2>
      <p className="text-gray-500 text-center mb-8">
        Entdecke beliebte Reiserouten
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {TRIPS.map((trip) => (
          <div
            key={trip.title}
            className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-400 cursor-pointer"
            style={{ perspective: "800px" }}
          >
            <div className="overflow-hidden h-48">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={trip.img}
                alt={trip.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                  {trip.title}
                </h3>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
              </div>
              <p className="text-sm text-gray-500 mb-3">
                {trip.days} Tage · {trip.route}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {trip.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
