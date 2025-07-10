/*
  # Fix view security invoker setting

  1. Security Update
    - Set security_invoker = on for chat_list_with_unread view
    - This ensures RLS policies are properly enforced when the view is accessed
*/

-- Set security_invoker on the chat_list_with_unread view
ALTER VIEW public.chat_list_with_unread SET (security_invoker = on);