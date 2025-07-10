/*
  # Fix RLS policy for messages table

  1. Security Policy Fix
    - Drop the existing problematic INSERT policy on messages table
    - Create a new, properly structured INSERT policy that avoids set-returning function issues
    - Ensure the policy correctly checks that users can only insert messages to chats they participate in

  2. Changes
    - Remove existing "Users can insert messages to their chats" policy
    - Add new policy with cleaner syntax that PostgreSQL can properly parse
*/

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Users can insert messages to their chats" ON messages;

-- Create a new, properly structured policy
CREATE POLICY "Users can insert messages to their chats"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id 
    AND EXISTS (
      SELECT 1 
      FROM chats 
      WHERE chats.id = messages.chat_id 
        AND auth.uid() = ANY(chats.participants)
    )
  );