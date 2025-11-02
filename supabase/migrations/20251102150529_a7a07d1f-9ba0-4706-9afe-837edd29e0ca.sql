-- Update RLS policies for hall admins to only see requests from their hall
DROP POLICY IF EXISTS "Hall admins can view requests from their hall" ON public.exit_requests;

CREATE POLICY "Hall admins can view requests from their hall" ON public.exit_requests
FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'security'::app_role) OR
  (
    has_role(auth.uid(), 'hall_admin'::app_role) AND
    EXISTS (
      SELECT 1 FROM public.profiles admin_profile
      WHERE admin_profile.id = auth.uid()
      AND admin_profile.hall_id = (
        SELECT hall_id FROM public.profiles student_profile
        WHERE student_profile.id = exit_requests.student_id
      )
    )
  )
);

-- Update RLS policy for hall admins to only update requests from their hall
DROP POLICY IF EXISTS "Hall admins can update requests" ON public.exit_requests;

CREATE POLICY "Hall admins can update requests" ON public.exit_requests
FOR UPDATE
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'security'::app_role) OR
  (
    has_role(auth.uid(), 'hall_admin'::app_role) AND
    EXISTS (
      SELECT 1 FROM public.profiles admin_profile
      WHERE admin_profile.id = auth.uid()
      AND admin_profile.hall_id = (
        SELECT hall_id FROM public.profiles student_profile
        WHERE student_profile.id = exit_requests.student_id
      )
    )
  )
);