-- ============================================================
-- RC-BioScan IA PRO – Migration 001: Auth Setup
-- Criado em: 2026-05-11
-- ============================================================

-- ------------------------------------------------------------
-- 1. Tabela pública de perfis (espelha auth.users com campos extras)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  full_name   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS
  'Perfil público dos usuários do RC-BioScan IA PRO, sincronizado com auth.users.';

-- ------------------------------------------------------------
-- 2. Habilitar Row Level Security
-- ------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem ler APENAS o próprio perfil
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Usuários autenticados podem atualizar APENAS o próprio perfil
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- ------------------------------------------------------------
-- 3. Função de updated_at automático
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- 4. Trigger: criar perfil automaticamente ao registrar usuário
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_app_meta_data->>'role', 'user'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------
-- 5. Trigger: sincronizar role quando app_metadata é atualizado
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    role  = COALESCE(NEW.raw_app_meta_data->>'role', 'user'),
    email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_role();

-- ------------------------------------------------------------
-- 6. Sincronizar usuários já existentes (retroativo)
-- ------------------------------------------------------------
INSERT INTO public.profiles (id, email, role, full_name)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_app_meta_data->>'role', 'user') AS role,
  COALESCE(au.raw_user_meta_data->>'full_name', '') AS full_name
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 7. View de resumo para o painel admin (sem dados sensíveis)
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW public.admin_users_view AS
SELECT
  au.id,
  au.email,
  p.role,
  p.full_name,
  au.created_at,
  au.last_sign_in_at,
  au.email_confirmed_at,
  au.banned_until
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id;

COMMENT ON VIEW public.admin_users_view IS
  'Visão consolidada de usuários para o painel administrativo. Requer service_role.';

-- ------------------------------------------------------------
-- 8. Confirmar
-- ------------------------------------------------------------
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 001 concluída com sucesso!';
  RAISE NOTICE '   - Tabela public.profiles criada';
  RAISE NOTICE '   - RLS habilitado com políticas por usuário';
  RAISE NOTICE '   - Triggers: on_auth_user_created + on_auth_user_updated';
  RAISE NOTICE '   - View admin_users_view criada';
  RAISE NOTICE '   - Usuários existentes sincronizados para profiles';
END;
$$;
