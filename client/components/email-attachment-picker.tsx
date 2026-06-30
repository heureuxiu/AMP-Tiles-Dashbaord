"use client";

import { useRef } from "react";
import { Eye, FileUp, Paperclip, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx", ".xlsx", ".jpg", ".jpeg", ".png"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type EmailAttachmentPickerProps = {
  attachments: File[];
  onChange: (attachments: File[]) => void;
  disabled?: boolean;
};

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
}

export function EmailAttachmentPicker({
  attachments,
  onChange,
  disabled = false,
}: EmailAttachmentPickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFilesSelected = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const nextFiles = Array.from(selectedFiles);
    const validFiles: File[] = [];

    for (const file of nextFiles) {
      const extension = getFileExtension(file.name);
      if (!ACCEPTED_EXTENSIONS.includes(extension) || file.size > MAX_FILE_SIZE) {
        toast.error("Attachment not added", {
          description: "Allowed: PDF, DOC, DOCX, XLSX, JPG, JPEG, PNG. Max 10 MB each.",
        });
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onChange([...attachments, ...validFiles]);
    }

    if (inputRef.current) inputRef.current.value = "";
  };

  const handlePreview = (file: File) => {
    const url = URL.createObjectURL(file);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const handleRemove = (index: number) => {
    onChange(attachments.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_EXTENSIONS.join(",")}
        className="hidden"
        onChange={(event) => handleFilesSelected(event.target.files)}
      />

      <Button
        type="button"
        variant="outline"
        className="w-full justify-center gap-2"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <FileUp className="h-4 w-4" />
        Add Attachments
      </Button>

      {attachments.length > 0 ? (
        <div className="space-y-2">
          {attachments.map((file, index) => (
            <div
              key={`${file.name}-${file.lastModified}-${index}`}
              className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-700"
            >
              <Paperclip className="h-4 w-4 shrink-0 text-neutral-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                  {file.name}
                </p>
                <p className="text-xs text-neutral-500">{formatFileSize(file.size)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={disabled}
                onClick={() => handlePreview(file)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20"
                disabled={disabled}
                onClick={() => handleRemove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-500 dark:border-neutral-700">
          Optional. Add files only if you want them attached with the email.
        </div>
      )}
    </div>
  );
}
