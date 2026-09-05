import ScrollProgress from "@/components/ScrollProgress";
import JourneyScroll from "@/components/journey/JourneyScroll";
import JourneyNav from "@/components/journey/JourneyNav";
import ChapterOverlay from "@/components/journey/ChapterOverlay";
import {
  HeroContent,
  MotivationContent,
  MethodologyContent,
  AcademicContent,
  ClosingContent,
} from "@/components/journey/JourneyContent";
import { CHAPTERS } from "@/lib/journeyState";

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <JourneyNav />
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
