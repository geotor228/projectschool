import Hero from "@/components/Hero";
import Motivation from "@/components/Motivation";
import Methodology from "@/components/Methodology";
import AcademicBase from "@/components/AcademicBase";
import Closing from "@/components/Closing";
import ScrollProgress from "@/components/ScrollProgress";
import JourneyGate from "@/components/journey/JourneyGate";
import JourneyScroll from "@/components/journey/JourneyScroll";
import ChapterOverlay from "@/components/journey/ChapterOverlay";
import {
  HeroContent,
  MotivationContent,
  MethodologyContent,
  AcademicContent,
  ClosingContent,
} from "@/components/journey/JourneyContent";
import { CHAPTERS } from "@/lib/journeyState";

function FlatFallback() {
  return (
    <>
      <ScrollProgress />
      <main>
        <Hero />
        <Motivation />
        <Methodology />
        <AcademicBase />
        <Closing />
      </main>
    </>
  );
}

function Journey() {
  return (
    <>
      <ScrollProgress />
      <JourneyScroll>
        <ChapterOverlay range={CHAPTERS.hero}>
          <HeroContent />
        </ChapterOverlay>
        <ChapterOverlay range={CHAPTERS.motivation} align="left">
          <MotivationContent />
        </ChapterOverlay>
        <ChapterOverlay range={CHAPTERS.methodology} align="left">
          <MethodologyContent />
        </ChapterOverlay>
        <ChapterOverlay range={CHAPTERS.academic} align="left">
          <AcademicContent />
        </ChapterOverlay>
        <ChapterOverlay range={CHAPTERS.closing}>
          <ClosingContent />
        </ChapterOverlay>
      </JourneyScroll>
    </>
  );
}

export default function Home() {
  return <JourneyGate journey={<Journey />} fallback={<FlatFallback />} />;
}
