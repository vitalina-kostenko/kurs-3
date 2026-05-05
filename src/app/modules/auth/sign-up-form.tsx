"use client";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@/app/shared/ui";
import { signUp } from "@/pkg/auth/client";
import { Link, useRouter } from "@/pkg/i18n/routing";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";

const signUpSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

type SignUpData = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const t = useTranslations("auth");

  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const form = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),

    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (data: SignUpData) => {
    setLoading(true);
    try {
      const result = await signUp(data.name, data.email, data.password);

      if (result.error) {
        toast.error(result.error.error ?? "Sign up failed");
      } else {
        toast.success("Account created successfully!");

        router.push("/auth/sign-in");
      }
    } catch {
      toast.error("Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-rose-50 to-amber-50 dark:from-violet-950 dark:via-purple-950 dark:to-indigo-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center space-y-2">
            <Image
              src="/logo.png"
              alt="Massage Center"
              width={56}
              height={56}
              className="mx-auto mb-2 rounded-2xl"
            />
            <CardTitle className="text-2xl">{t("signUp")}</CardTitle>

            <CardDescription>{t("subtitle")}</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("name")}</Label>

                <Input {...form.register("name")} placeholder="John Doe" />

                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t("email")}</Label>

                <Input
                  type="email"
                  {...form.register("email")}
                  placeholder="name@example.com"
                />

                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t("password")}</Label>

                <Input type="password" {...form.register("password")} />
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t("signUp")}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              {t("hasAccount")}{" "}
              <Link
                href="/auth/sign-in"
                className="text-primary hover:underline font-medium"
              >
                {t("signIn")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
