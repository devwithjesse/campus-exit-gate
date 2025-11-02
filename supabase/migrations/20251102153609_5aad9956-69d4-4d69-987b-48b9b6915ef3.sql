-- Drop existing profiles table and recreate with proper user type tables
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create students table
CREATE TABLE public.students (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone_number text,
  hall_id uuid REFERENCES public.halls(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create hall_admins table with one-to-one hall relationship
CREATE TABLE public.hall_admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hall_admin_id text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone_number text,
  hall_id uuid UNIQUE NOT NULL REFERENCES public.halls(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create security_personnel table
CREATE TABLE public.security_personnel (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  security_id text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create super_admins table
CREATE TABLE public.super_admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hall_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for students table
CREATE POLICY "Students can view their own profile"
  ON public.students FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Students can update their own profile"
  ON public.students FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Hall admins can view students in their hall"
  ON public.students FOR SELECT
  USING (
    has_role(auth.uid(), 'hall_admin'::app_role) AND
    hall_id IN (SELECT hall_id FROM public.hall_admins WHERE id = auth.uid())
  );

CREATE POLICY "Super admins can view all students"
  ON public.students FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for hall_admins table
CREATE POLICY "Hall admins can view their own profile"
  ON public.hall_admins FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Hall admins can update their own profile"
  ON public.hall_admins FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    -- Prevent changing hall_id
    (SELECT hall_id FROM public.hall_admins WHERE id = auth.uid()) = hall_id
  );

CREATE POLICY "Super admins can view all hall admins"
  ON public.hall_admins FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage hall admins"
  ON public.hall_admins FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for security_personnel table
CREATE POLICY "Security personnel can view their own profile"
  ON public.security_personnel FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Security personnel can update their own profile"
  ON public.security_personnel FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Super admins can view all security personnel"
  ON public.security_personnel FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage security personnel"
  ON public.security_personnel FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for super_admins table
CREATE POLICY "Super admins can view their own profile"
  ON public.super_admins FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Super admins can update their own profile"
  ON public.super_admins FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Super admins can view all super admins"
  ON public.super_admins FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Update exit_requests RLS policies
DROP POLICY IF EXISTS "Hall admins can view requests from their hall" ON public.exit_requests;
DROP POLICY IF EXISTS "Hall admins can update requests" ON public.exit_requests;

CREATE POLICY "Hall admins can view requests from their hall"
  ON public.exit_requests FOR SELECT
  USING (
    has_role(auth.uid(), 'hall_admin'::app_role) AND
    EXISTS (
      SELECT 1 FROM public.students s
      JOIN public.hall_admins ha ON s.hall_id = ha.hall_id
      WHERE s.id = exit_requests.student_id AND ha.id = auth.uid()
    )
  );

CREATE POLICY "Hall admins can update requests from their hall"
  ON public.exit_requests FOR UPDATE
  USING (
    has_role(auth.uid(), 'hall_admin'::app_role) AND
    EXISTS (
      SELECT 1 FROM public.students s
      JOIN public.hall_admins ha ON s.hall_id = ha.hall_id
      WHERE s.id = exit_requests.student_id AND ha.id = auth.uid()
    )
  );

CREATE POLICY "Security can view approved requests"
  ON public.exit_requests FOR SELECT
  USING (
    has_role(auth.uid(), 'security'::app_role) AND
    status IN ('approved', 'exited')
  );

CREATE POLICY "Security can update approved requests"
  ON public.exit_requests FOR UPDATE
  USING (
    has_role(auth.uid(), 'security'::app_role) AND
    status IN ('approved', 'exited')
  );

CREATE POLICY "Super admins can view all requests"
  ON public.exit_requests FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can update all requests"
  ON public.exit_requests FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Get the user's role
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = new.id
  LIMIT 1;

  -- Insert into appropriate table based on role
  IF user_role = 'student' THEN
    INSERT INTO public.students (id, full_name, student_id)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', new.email),
      'STU' || SUBSTRING(new.id::text, 1, 8)
    );
  ELSIF user_role = 'hall_admin' THEN
    INSERT INTO public.hall_admins (id, full_name, hall_admin_id, hall_id)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', new.email),
      'HA' || SUBSTRING(new.id::text, 1, 8),
      (new.raw_user_meta_data->>'hall_id')::uuid
    );
  ELSIF user_role = 'security' THEN
    INSERT INTO public.security_personnel (id, full_name, security_id)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', new.email),
      'SEC' || SUBSTRING(new.id::text, 1, 8)
    );
  ELSIF user_role = 'super_admin' THEN
    INSERT INTO public.super_admins (id, full_name)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', new.email)
    );
  END IF;

  RETURN new;
END;
$$;

-- Add update triggers
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hall_admins_updated_at
  BEFORE UPDATE ON public.hall_admins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_security_personnel_updated_at
  BEFORE UPDATE ON public.security_personnel
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_super_admins_updated_at
  BEFORE UPDATE ON public.super_admins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();