"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Map,
  Plus,
  Trash2,
  Calendar,
  Users,
  MapPin,
  BookmarkPlus,
  Car,
  Train,
  Plane,
  ArrowRight,
  FolderOpen,
} from "lucide-react";
import { Trip, TravelMode } from "@/lib/types";
import {
  getAllTrips,
  deleteTrip,
  setActiveTripId,
  getTripDisplayName,
  formatDate,
  createNewTrip,
  saveTrip,
} from "@/lib/tripStorage";

const modeIcons: Record<TravelMode, typeof Car> = {
  auto: Car,
  zug: Train,
  flug: Plane,
};

const modeLabels: Record<TravelMode, string> = {
  auto: "Auto",
  zug: "Zug",
  flug: "Flug",
};

export default function MeineReisenPage() {
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    setTrips(getAllTrips());
  }, []);

  const handleDelete = (id: string) => {
    deleteTrip(id);
    setTrips(getAllTrips());
  };

  const handleNewTrip = () => {
    const newTrip = createNewTrip();
    saveTrip(newTrip);
    setActiveTripId(newTrip.id);
    window.location.href = "/planer";
  };

  const handleOpenTrip = (id: string) => {
    setActiveTripId(id);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FolderOpen className="w-7 h-7 text-white/80" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Meine Reisen
              </h1>
            </div>
            <p className="text-blue-100 text-sm">
              {trips.length === 0
                ? "Du hast noch keine Reisen gespeichert."
                : `${trips.length} ${trips.length === 1 ? "gespeicherte Reise" : "gespeicherte Reisen"}`}
            </p>
          </div>
          <button
            onClick={handleNewTrip}
            className="inline-flex items-center gap-2 bg-white text-blue-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-all shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Neue Reise planen
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {trips.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Map className="w-10 h-10 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Noch keine Reisen
            </h2>
            <p className="text-gray-500 max-w-md mx-auto mb-8">
              Plane deine erste Reise – wähle Start und Ziel, vergleiche Hotels
              und Flüge und erstelle deine persönliche Bucket List.
            </p>
            <button
              onClick={handleNewTrip}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all"
            >
              <Plus className="w-5 h-5" />
              Erste Reise planen
            </button>
          </div>
        ) : (
          /* Trip Cards */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => {
              const ModeIcon = modeIcons[trip.travelMode];
              const stopsCount = trip.stops.filter(
                (s) => s.type === "stop"
              ).length;
              const filledStops = trip.stops.filter(
                (s) => s.name.trim() !== ""
              );

              return (
                <Link
                  key={trip.id}
                  href="/planer"
                  onClick={() => handleOpenTrip(trip.id)}
                  className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-400 p-5 relative overflow-hidden">
                    <div className="absolute top-2 right-2 opacity-10">
                      <ModeIcon className="w-20 h-20 text-white" />
                    </div>
                    <div className="relative">
                      <h3 className="font-bold text-white text-lg leading-tight">
                        {getTripDisplayName(trip)}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 text-xs text-white/80 bg-white/15 px-2 py-0.5 rounded-full">
                          <ModeIcon className="w-3 h-3" />
                          {modeLabels[trip.travelMode]}
                        </span>
                        {trip.bucketList.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-white/80 bg-white/15 px-2 py-0.5 rounded-full">
                            <BookmarkPlus className="w-3 h-3" />
                            {trip.bucketList.length} POIs
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    {/* Dates */}
                    {trip.startDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(trip.startDate)}
                        {trip.endDate && ` – ${formatDate(trip.endDate)}`}
                      </div>
                    )}

                    {/* Travelers */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Users className="w-4 h-4 text-gray-400" />
                      {trip.travelers}{" "}
                      {trip.travelers === 1 ? "Person" : "Personen"}
                    </div>

                    {/* Stops Preview */}
                    {stopsCount > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {stopsCount} Zwischenstopp
                        {stopsCount > 1 ? "s" : ""}
                      </div>
                    )}

                    {/* Route Preview – Start → End only */}
                    {filledStops.length >= 2 && (
                      <div className="mt-3 pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                          <span className="text-gray-600 truncate">{filledStops[0].name}</span>
                          <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                          <span className="text-gray-600 truncate">{filledStops[filledStops.length - 1].name}</span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                      <span className="text-xs text-gray-400">
                        Zuletzt bearbeitet:{" "}
                        {formatDate(trip.updatedAt)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(trip.id);
                        }}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
