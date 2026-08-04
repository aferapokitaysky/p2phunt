import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../components/Button.js";
import { Field, Input } from "../components/Field.js";
import { IconLogo } from "../components/icons/NavIcons.js";
import { ThemeToggle } from "../components/ThemeToggle.js";
import { useLogin } from "../hooks/useAuth.js";

const schema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(1, "Введите пароль")
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, { onSuccess: () => navigate("/") });
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
        <h1 className="mb-1 text-lg font-semibold text-ink">Вход</h1>
        <p className="mb-5 text-sm text-muted">Единый пульт управления P2P-торговлей.</p>

        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" autoComplete="email" {...register("email")} />
          </Field>
          <Field label="Пароль" error={errors.password?.message}>
            <Input type="password" autoComplete="current-password" {...register("password")} />
          </Field>

          {login.isError && <p className="text-xs text-danger">{(login.error as Error).message}</p>}

          <Button type="submit" variant="primary" className="w-full" loading={login.isPending}>
            Войти
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted">
          Нет аккаунта? <Link to="/register" className="text-accent hover:underline">Создать</Link>
        </p>
      </div>
    </div>
  );
}
