import V2Navigation from "./V2Navigation";
import V2Hero from "./V2Hero";
import V3Hero from "./V3Hero";
import V2ProblemSolution from "./V2ProblemSolution";
import V2ProductShow from "./V2ProductShow";
import V2HowItWorks from "./V2HowItWorks";
import V2ExampleTrip from "./V2ExampleTrip";
import V2InspirationRoutes from "./V2InspirationRoutes";
import V2TravelVoices from "./V2TravelVoices";
import V2PricingTrust from "./V2PricingTrust";
import V2FinalCTA from "./V2FinalCTA";
import V2Footer from "./V2Footer";

type Props = {
  homeHref?: string;
  hero?: "default" | "immersive";
};

export default function V2HomePage({ homeHref = "/", hero = "default" }: Props) {
  return (
    <div className="v2-home min-h-screen">
      <V2Navigation homeHref={homeHref} />
      {hero === "immersive" ? <V3Hero /> : <V2Hero />}
      <V2ProblemSolution />
      <V2ProductShow />
      <V2HowItWorks />
      <V2ExampleTrip />
      <V2InspirationRoutes />
      <V2TravelVoices />
      <V2PricingTrust />
      <V2FinalCTA />
      <V2Footer homeHref={homeHref} />
    </div>
  );
}
