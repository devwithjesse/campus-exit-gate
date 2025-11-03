-- Enforce one active request per student
CREATE UNIQUE INDEX IF NOT EXISTS idx_exit_requests_one_active_per_student
ON public.exit_requests (student_id)
WHERE status IN ('pending','approved','exited');

-- Require students to have a hall before creating a request
DROP POLICY IF EXISTS "Students can create their own requests" ON public.exit_requests;

CREATE POLICY "Students can create their own requests"
ON public.exit_requests
FOR INSERT
WITH CHECK (
  (student_id = auth.uid())
  AND has_role(auth.uid(), 'student'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = auth.uid() AND s.hall_id IS NOT NULL
  )
);
