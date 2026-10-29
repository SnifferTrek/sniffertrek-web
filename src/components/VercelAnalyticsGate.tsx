"use client";

import { Analytics } from "@vercel/analytics/react";
import { useEffect, useState } from "react";
import {
 COOKIE_CONSENT_CHANGED_EVENT,
 COOKIE_CONSENT_KEY,
} from "@/lib/cookieConsent";

export default function VercelAnalyticsGate() {
 const [allow, setAllow] = useState(false);

 useEffect(() => {
 const read = () => {
 try {
 setAllow(localStorage.getItem(COOKIE_CONSENT_KEY) === "accepted");
 } catch {
 setAllow(false);
 }
 };
 read();
 const onChange = (e: Event) => {
 const detail = (e as CustomEvent<"accepted" | "declined">).detail;
 if (detail === "accepted") setAllow(true);
 if (detail === "declined") setAllow(false);
 };
 window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChange);
 return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChange);
 }, []);

 if (!allow) return null;
 return <Analytics />;
}
