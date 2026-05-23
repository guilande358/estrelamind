CREATE TABLE public.offload_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  items JSONB,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.offload_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own offload messages"
ON public.offload_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own offload messages"
ON public.offload_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own offload messages"
ON public.offload_messages FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own offload messages"
ON public.offload_messages FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_offload_messages_user_created ON public.offload_messages(user_id, created_at DESC);