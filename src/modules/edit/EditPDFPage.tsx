import { PenLine } from "lucide-react";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card } from "@/shared/components/Card";
import { EmptyState } from "@/shared/components/EmptyState";

export default function EditPDFPage() {
  return (
    <div className="space-y-6">
      <PageHeader icon={PenLine} title="Edit PDF"
        description="Add text, images, annotations, and drawings to PDF pages" />
      <Card padding="lg">
        <EmptyState
          icon={<PenLine className="h-7 w-7 text-muted" />}
          title="PDF Editor"
          description="This will open a rich PDF editor where you can add text boxes, images, freehand drawings, highlights, and annotations to any page of your document."
          action={
            <div className="text-xs text-muted text-center">
              Full PDF editing will be available in a future update.
            </div>
          }
        />
      </Card>
    </div>
  );
}
