import { FormInput } from "lucide-react";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card } from "@/shared/components/Card";
import { EmptyState } from "@/shared/components/EmptyState";

export default function FormFillPage() {
  return (
    <div className="space-y-6">
      <PageHeader icon={FormInput} title="Fill PDF Form"
        description="Fill in interactive PDF forms" />
      <Card padding="lg">
        <EmptyState
          icon={<FormInput className="h-7 w-7 text-muted" />}
          title="PDF Form Filler"
          description="Load a PDF with form fields (text inputs, checkboxes, radio buttons, dropdowns) and fill them in interactively before saving."
          action={
            <div className="text-xs text-muted text-center">
              Interactive form filling will be available in a future update.
            </div>
          }
        />
      </Card>
    </div>
  );
}
