-- Add role column to profiles table
alter table profiles 
add column role text not null default 'user' check (role in ('user', 'admin'));

-- Update existing records to have 'user' role
update profiles set role = 'user' where role is null;

-- Add comment to explain the role column
comment on column profiles.role is 'User role: user or admin';