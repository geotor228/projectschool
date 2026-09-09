import ScrollProgress from "@/components/ScrollProgress";
import JourneyScroll from "@/components/journey/JourneyScroll";
import JourneyNav from "@/components/journey/JourneyNav";
import ChapterOverlay from "@/components/journey/ChapterOverlay";
import { HeroContent } from "@/components/journey/JourneyContent";
import { ClassroomCards, LabCards, MoleculeCards } from "@/components/journey/SceneCards";
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
        <ClassroomCards />
        <LabCards />
        <MoleculeCards />
      </JourneyScroll>
    </>
  );
}
