import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import DashboardPage from "@/app/DashboardPage";
import MergePDFPage from "@/modules/merge-pdf/MergePDFPage";
import SplitPDFPage from "@/modules/split-pdf/SplitPDFPage";
import CompressPDFPage from "@/modules/compress-pdf/CompressPDFPage";
import RotatePDFPage from "@/modules/organize/RotatePDFPage";
import ReorderPDFPage from "@/modules/organize/ReorderPDFPage";
import RemovePagesPDFPage from "@/modules/organize/RemovePagesPDFPage";
import ExtractPagesPDFPage from "@/modules/organize/ExtractPagesPDFPage";
import RepairPDFPage from "@/modules/organize/RepairPDFPage";
import ConvertFromPDFPage from "@/modules/convert-pdf/ConvertFromPDFPage";
import ConvertToPDFPage from "@/modules/convert-pdf/ConvertToPDFPage";
import PasswordProtectPage from "@/modules/security/PasswordProtectPage";
import UnlockPDFPage from "@/modules/security/UnlockPDFPage";
import WatermarkPage from "@/modules/security/WatermarkPage";
import MetadataEditorPage from "@/modules/security/MetadataEditorPage";
import SignaturePage from "@/modules/security/SignaturePage";
import OCRPage from "@/modules/ocr/OCRPage";
import EditPDFPage from "@/modules/edit/EditPDFPage";
import FormFillPage from "@/modules/edit/FormFillPage";
import BatchProcessPage from "@/modules/batch/BatchProcessPage";
import HistoryPage from "@/app/HistoryPage";
import SettingsPage from "@/app/SettingsPage";
import AboutPage from "@/app/AboutPage";

export default function App() {
  return (
    <MainLayout>
      <Routes>
        {/* Dashboard */}
        <Route path="/"              element={<DashboardPage />} />
        <Route path="/dashboard"     element={<DashboardPage />} />

        {/* PDF Management */}
        <Route path="/merge"         element={<MergePDFPage />} />
        <Route path="/split"         element={<SplitPDFPage />} />
        <Route path="/compress"      element={<CompressPDFPage />} />
        <Route path="/rotate"        element={<RotatePDFPage />} />
        <Route path="/reorder"       element={<ReorderPDFPage />} />
        <Route path="/remove-pages"  element={<RemovePagesPDFPage />} />
        <Route path="/extract-pages" element={<ExtractPagesPDFPage />} />
        <Route path="/repair"        element={<RepairPDFPage />} />

        {/* Conversion */}
        <Route path="/pdf-to"        element={<ConvertFromPDFPage />} />
        <Route path="/to-pdf"        element={<ConvertToPDFPage />} />

        {/* Security */}
        <Route path="/protect"       element={<PasswordProtectPage />} />
        <Route path="/unlock"        element={<UnlockPDFPage />} />
        <Route path="/watermark"     element={<WatermarkPage />} />
        <Route path="/metadata"      element={<MetadataEditorPage />} />
        <Route path="/signature"     element={<SignaturePage />} />

        {/* OCR */}
        <Route path="/ocr"           element={<OCRPage />} />

        {/* Edit */}
        <Route path="/edit"          element={<EditPDFPage />} />
        <Route path="/fill-form"     element={<FormFillPage />} />

        {/* Batch */}
        <Route path="/batch"         element={<BatchProcessPage />} />

        {/* App */}
        <Route path="/history"       element={<HistoryPage />} />
        <Route path="/settings"      element={<SettingsPage />} />
        <Route path="/about"         element={<AboutPage />} />

        <Route path="*"              element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
}
