ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;

CREATE OR REPLACE FUNCTION public.normalize_username()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.username IS NOT NULL THEN
    NEW.username = lower(trim(NEW.username));
    IF NEW.username = '' THEN
      NEW.username = NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_normalize_username ON public.profiles;
CREATE TRIGGER profiles_normalize_username
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.normalize_username();

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON public.profiles (username) WHERE username IS NOT NULL;

UPDATE public.profiles p
SET username = 'jodicarl25'
FROM auth.users u
WHERE u.id = p.id AND lower(u.email) = 'treetestprep@gmail.com';