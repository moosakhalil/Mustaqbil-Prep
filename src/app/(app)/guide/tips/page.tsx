import { BackHeader } from "@/components/home/back-header";
import { LessonBlocks } from "@/components/guide/lesson-blocks";
import { TIPS_BLOCKS } from "@/lib/guide";

export const metadata = { title: "Exam tips and pass plan · Mustaqbil Prep" };

export default function TipsPage() {
  return (
    <>
      <BackHeader title="Exam tips and pass plan" href="/guide" label="Study guide" color="text-military" />
      <div className="mt-4">
        <LessonBlocks blocks={TIPS_BLOCKS} />
      </div>
    </>
  );
}
