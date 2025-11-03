-- Allow students to delete their own pending requests
CREATE POLICY "Students can delete their pending requests"
ON public.exit_requests
FOR DELETE
USING (
  student_id = auth.uid() 
  AND status = 'pending'::request_status
);

-- Recreate hall admin policies with better join logic
DROP POLICY IF EXISTS "Hall admins can view requests from their hall" ON public.exit_requests;
DROP POLICY IF EXISTS "Hall admins can update requests from their hall" ON public.exit_requests;

CREATE POLICY "Hall admins can view requests from their hall"
ON public.exit_requests
FOR SELECT
USING (
  has_role(auth.uid(), 'hall_admin'::app_role)
  AND EXISTS (
    SELECT 1
    FROM public.students s
    INNER JOIN public.hall_admins ha ON ha.hall_id = s.hall_id
    WHERE s.id = exit_requests.student_id
    AND ha.id = auth.uid()
  )
);

CREATE POLICY "Hall admins can update requests from their hall"
ON public.exit_requests
FOR UPDATE
USING (
  has_role(auth.uid(), 'hall_admin'::app_role)
  AND EXISTS (
    SELECT 1
    FROM public.students s
    INNER JOIN public.hall_admins ha ON ha.hall_id = s.hall_id
    WHERE s.id = exit_requests.student_id
    AND ha.id = auth.uid()
  )
);