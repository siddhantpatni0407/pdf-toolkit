import { PenLine } from "lucide-react";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card } from "@/shared/components/Card";
import { EmptyState } from "@/shared/components/EmptyState";

export default function SignaturePage() {
  return (
    <div className="space-y-6">
      <PageHeader icon={PenLine} title="Digital Signature"
        description="Add digital signatures and sign PDF documents" />
      <Card padding="lg">
        <EmptyState
          icon={<PenLine className="h-7 w-7 text-muted" />}
          title="Digital Signature"
          description="Draw, upload, or generate a digital signature and apply it to your PDF document."
          action={
            <div className="text-xs text-muted text-center">
              This feature will be available in a future update.<br />
              It will support drawn signatures, uploaded images, and certificate-based signing.
            </div>
          }
        />
      </Card>
    </div>
  );
}
