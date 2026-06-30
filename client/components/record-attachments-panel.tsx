"use client";

import { Eye, FileUp, Paperclip, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveApiAssetUrl } from "@/lib/api";

export type StoredAttachment = {
  _id: string;
  originalName: string;
  url: string;
  mimeType?: string;
  size?: number;
};

type RecordAttachmentsPanelProps = {
  storedAttachments?: StoredAttachment[];
  newAttachments?: File[];
  onNewAttachmentsChange?: (files: File[]) => void;
  onRemoveStoredAttachment?: (attachmentId: string) => void;
  disabled?: boolean;
  editable?: boolean;
  title?: string;
  description?: string;
};

const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx", ".xlsx", ".jpg", ".jpeg", ".png"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatFileSize(size?: number) {
  const safeSize = Number(size) || 0;
  if (safeSize < 1024 * 1024) return `${Math.max(1, Math.round(safeSize / 1024))} KB`;
  return `${(safeSize / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
}

export function RecordAttachmentsPanel({
  storedAttachments = [],
  newAttachments = [],
  onNewAttachmentsChange,
  onRemoveStoredAttachment,
  disabled = false,
  editable = false,
  title = "Attachments",
  description,
}: RecordAttachmentsPanelProps) {
  const openStoredAttachment = (url: string) => {
    window.open(resolveApiAssetUrl(url), "_blank", "noopener,noreferrer");
  };

  const openNewAttachment = (file: File) => {
    const url = URL.createObjectURL(file);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const addFiles = (files: FileList | null) => {
    if (!files || !onNewAttachmentsChange) return;
    const next = [...newAttachments];
    Array.from(files).forEach((file) => {
      const extension = getFileExtension(file.name);
      if (!ACCEPTED_EXTENSIONS.includes(extension) || file.size > MAX_FILE_SIZE) return;
      next.push(file);
    });
    onNewAttachmentsChange(next);
  };

  const removeNewAttachment = (index: number) => {
    if (!onNewAttachmentsChange) return;
    onNewAttachmentsChange(newAttachments.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="rounded-xl border border-neutral-200/70 p-4 dark:border-neutral-700/70">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{title}</h3>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          {description || (editable
            ? "Optional. Stored attachments stay with this record and are sent automatically on email resend."
            : "Saved attachments for this record.")}
        </p>
      </div>

      {editable && onNewAttachmentsChange && (
        <label className="mb-3 block">
          <input
            type="file"
            multiple
            accept={ACCEPTED_EXTENSIONS.join(",")}
            className="hidden"
            onChange={(event) => addFiles(event.target.files)}
            disabled={disabled}
          />
          <span>
            <Button type="button" variant="outline" className="w-full gap-2" disabled={disabled} asChild>
              <span>
                <FileUp className="h-4 w-4" />
                Add Attachments
              </span>
            </Button>
          </span>
        </label>
      )}

      {storedAttachments.length === 0 && newAttachments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-500 dark:border-neutral-700">
          No attachments added.
        </div>
      ) : (
        <div className="space-y-2">
          {storedAttachments.map((attachment) => (
            <div
              key={attachment._id}
              className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-700"
            >
              <Paperclip className="h-4 w-4 shrink-0 text-neutral-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                  {attachment.originalName}
                </p>
                <p className="text-xs text-neutral-500">{formatFileSize(attachment.size)}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => openStoredAttachment(attachment.url)}>
                <Eye className="h-4 w-4" />
              </Button>
              {editable && onRemoveStoredAttachment && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20"
                  onClick={() => onRemoveStoredAttachment(attachment._id)}
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          {newAttachments.map((attachment, index) => (
            <div
              key={`${attachment.name}-${attachment.lastModified}-${index}`}
              className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-700"
            >
              <Paperclip className="h-4 w-4 shrink-0 text-neutral-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                  {attachment.name}
                </p>
                <p className="text-xs text-neutral-500">{formatFileSize(attachment.size)}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => openNewAttachment(attachment)}>
                <Eye className="h-4 w-4" />
              </Button>
              {editable && onNewAttachmentsChange && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20"
                  onClick={() => removeNewAttachment(index)}
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
