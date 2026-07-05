import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useSendEmail } from "@/services/ali-samadi";

// Where contact submissions are delivered. Change to the site owner's inbox.
const CONTACT_TO = "a@alisamadii.com";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Enter a valid email"),
  message: z.string().min(1, "Message is required"),
});

type ContactValues = z.infer<typeof contactSchema>;

function Landing() {
  const sendEmail = useSendEmail();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", message: "" },
  });

  const onSubmit = handleSubmit(({ name, email, message }) => {
    sendEmail.mutate(
      {
        to: CONTACT_TO,
        subject: `New contact from ${name}`,
        html: `<p><strong>${name}</strong> (${email}) wrote:</p><p>${message}</p>`,
        text: `${name} (${email}) wrote:\n\n${message}`,
      },
      { onSuccess: () => reset() }
    );
  });

  return (
    <main className="bg-background flex min-h-svh items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Get in touch</CardTitle>
          <CardDescription>
            Send us a message and we'll get back to you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Jane Doe" {...register("name")} />
              {errors.name && (
                <p className="text-destructive text-sm">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jane@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-destructive text-sm">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                rows={5}
                placeholder="How can we help?"
                {...register("message")}
              />
              {errors.message && (
                <p className="text-destructive text-sm">
                  {errors.message.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={sendEmail.isPending}
            >
              {sendEmail.isPending ? "Sending..." : "Send message"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Link
        to="/admin"
        className="text-muted-foreground hover:text-foreground fixed right-4 bottom-4 text-sm"
      >
        Admin
      </Link>
    </main>
  );
}

export default Landing;
