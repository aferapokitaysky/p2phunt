import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../components/Button.js";
import { Field, Input } from "../components/Field.js";
import { IconLogo } from "../components/icons/NavIcons.js";
import { ThemeToggle } from "../components/ThemeToggle.js";
import { useRegister } from "../hooks/useAuth.js";

const schema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(8, "Минимум 8 символов"),
  displayName: z.string().optional(),
  workspaceName: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const registerAccount = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit((values) => {
    registerAccount.mutate(values, { onSuccess: () => navigate("/") });
  });

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <div className="glass-panel-strong w-full max-w-sm rounded-3xl p-7">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand/15 text-brand">
            <IconLogo size={22} />
          </div>
          <span className="text-base font-bold tracking-tight text-ink">P2PHunt</span>
        </div>
        <h1 className="mb-1 text-lg font-semibold text-ink">Создайте рабочее пространство</h1>
        <p className="mb-5 text-sm text-muted">Единый пульт управления для всех ваших P2P-аккаунтов.</p>

        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" autoComplete="email" {...register("email")} />
          </Field>
          <Field label="Пароль" error={errors.password?.message}>
            <Input type="password" autoComplete="new-password" {...register("password")} />
          </Field>
          <Field label="Ваше имя (необязательно)">
            <Input {...register("displayName")} />
          </Field>
          <Field label="Название рабочего пространства (необязательно)">
            <Input placeholder="например, Мой трейдинг-деск" {...register("workspaceName")} />
          </Field>

          {registerAccount.isError && <p className="text-xs text-danger">{(registerAccount.error as Error).message}</p>}

          <Button type="submit" variant="primary" className="w-full" loading={registerAccount.isPending}>
            Создать аккаунт
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted">
          Уже есть аккаунт? <Link to="/login" className="text-accent hover:underline">Войти</Link>
        </p>
      </div>
    </div>
  );
}
