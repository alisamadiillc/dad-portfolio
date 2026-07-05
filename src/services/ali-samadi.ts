import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { z } from "zod";

import { agencyApi } from "@/lib/api";

// --- Schemas ---------------------------------------------------------------

export const uploadSchema = z.object({
  file: z.instanceof(File),
  bucket: z.string().min(1, "Bucket is required"),
  path: z.string().optional(),
});

export const sendEmailSchema = z.object({
  to: z.email().or(z.array(z.email()).min(1)),
  subject: z.string().min(1, "Subject is required"),
  html: z.string().min(1, "Body is required"),
  text: z.string().optional(),
  from: z.email().optional(),
});

export type UploadInput = z.infer<typeof uploadSchema>;
export type SendEmailInput = z.infer<typeof sendEmailSchema>;

// --- Helpers ---------------------------------------------------------------

const errMsg = (e: unknown) =>
  axios.isAxiosError(e)
    ? (e.response?.data?.error ?? e.message)
    : e instanceof Error
      ? e.message
      : "Something went wrong";

type PresignResponse = {
  uploadUrl: string;
  method: "PUT";
  bucket: string;
  key: string;
  // Durable URL to display the object, or null when the bucket isn't public.
  publicUrl: string | null;
  expiresIn: number;
  headers: { "Content-Type": string; "Content-Length": string };
};

// --- Mutations -------------------------------------------------------------

/**
 * Upload a file in one call: presign against the agency-api, then PUT the raw file
 * straight to R2. Returns the stored object's `{ bucket, key }`.
 */
export const useUploadFile = () =>
  useMutation({
    mutationFn: async ({ file, bucket, path }: UploadInput) => {
      // 1. Ask the agency-api for a presigned PUT URL (auth via the `agencyApi` instance).
      const { data: presign } = await agencyApi.post<PresignResponse>(
        "/v1/uploads/presign",
        {
          bucket,
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          contentLength: file.size,
          path,
        }
      );

      // 2. PUT the file directly to R2 with raw axios — the presigned URL rejects the
      //    Authorization bearer, so we must NOT use the `agencyApi` instance here.
      await axios.put(presign.uploadUrl, file, {
        headers: { "Content-Type": presign.headers["Content-Type"] },
      });

      return {
        bucket: presign.bucket,
        key: presign.key,
        publicUrl: presign.publicUrl,
      };
    },
    onSuccess: () => toast.success("File uploaded"),
    onError: (e) => toast.error(errMsg(e)),
  });

/**
 * Send a transactional email through the agency-api. Returns the provider message `{ id }`.
 */
export const useSendEmail = () =>
  useMutation({
    mutationFn: async (input: SendEmailInput) => {
      const { data } = await agencyApi.post<{ id: string }>(
        "/v1/emails/send",
        input
      );
      return data;
    },
    onSuccess: () => toast.success("Email sent"),
    onError: (e) => toast.error(errMsg(e)),
  });
