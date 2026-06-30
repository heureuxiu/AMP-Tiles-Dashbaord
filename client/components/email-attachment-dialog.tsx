"use client";

import { useRef, useState } from "react";
import { Eye, FileUp, Paperclip, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx", ".xlsx", ".jpg", ".jpeg", ".png"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type EmailAttachmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  sendLabel?: string;
  isSending?: boolean;
  onSend: (attachments: File[]) => Promise<void> | void;
};

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
}

export function EmailAttachmentDialog({
  open,
  onOpenChange,
  title,
  description,
  sendLabel = "Send Email",
  isSending = false,
  onSend,
}: EmailAttachmentDialogProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleFilesSelected = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const nextFiles = Array.from(selectedFiles);
    const validFiles: File[] = [];
    const rejectedFiles: string[] = [];

    for (const file of nextFiles) {
      const extension = getFileExtension(file.name);
      if (!ACCEPTED_EXTENSIONS.includes(extension) || file.size > MAX_FILE_SIZE) {
        rejectedFiles.push(file.name);
        continue;
      }
      validFiles.push(file);
    }

    if (rejectedFiles.length > 0) {
      toast.error("Some attachments were not added", {
        description: "Allowed: PDF, DOC, DOCX, XLSX, JPG, JPEG, PNG. Max 10 MB each.",
      });
    }

    if (validFiles.length > 0) {
      setAttachments((current) => [...current, ...validFiles]);
    }

    if (inputRef.current) inputRef.current.value = "";
  };

  const handlePreview = (file: File) => {
    const url = URL.createObjectURL(file);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const handleRemove = (index: number) => {
    setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isSending) {
      setAttachments([]);
    }
    onOpenChange(nextOpen);
  };

  const handleSend = async () => {
    await onSend(attachments);
    setAttachments([]);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

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
            disabled={isSending}
            onClick={() => inputRef.current?.click()}
          >
            <FileUp className="h-4 w-4" />
            Add or Replace Attachments
          </Button>

          {attachments.length > 0 ? (
            <div className="max-h-72 space-y-2 overflow-y-auto">
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
                    disabled={isSending}
                    onClick={() => handlePreview(file)}
                    title="Preview attachment"
                    aria-label={`Preview ${file.name}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20"
                    disabled={isSending}
                    onClick={() => handleRemove(index)}
                    title="Remove attachment"
                    aria-label={`Remove ${file.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
              No extra attachments selected.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSending}
            onClick={() => handleOpenChange(false)}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button type="button" disabled={isSending} onClick={handleSend} className="gap-2">
            <Paperclip className="h-4 w-4" />
            {isSending ? "Sending..." : sendLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
