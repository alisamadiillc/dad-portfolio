import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { z } from "zod";

import { agencyApi } from "@/lib/api";

// --- Schemas ---------------------------------------------------------------

export const sendEmailSchema = z.object({
  to: z.email().or(z.array(z.email()).min(1)),
  subject: z.string().min(1, "Subject is required"),
  html: z.string().min(1, "Body is required"),
  text: z.string().optional(),
  from: z.email().optional(),
});

export type SendEmailInput = z.infer<typeof sendEmailSchema>;

// --- Helpers ---------------------------------------------------------------

const errMsg = (e: unknown) =>
  axios.isAxiosError(e)
    ? (e.response?.data?.error ?? e.message)
    : e instanceof Error
      ? e.message
      : "Something went wrong";

// --- Mutations -------------------------------------------------------------

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
