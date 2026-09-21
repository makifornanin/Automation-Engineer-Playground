import { NotFoundContent } from "@/components/ui/NotFoundContent";

/** The app shell already supplies the main landmark. */
export default function AppNotFound() {
  return (
    <div className="flex flex-col items-start gap-4">
      <NotFoundContent />
    </div>
  );
}
