-- Create printers table
create table public.printers (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  business_id uuid not null default auth.uid (),
  name text not null,
  type text not null, -- 'Yazıcı'
  printer_type text not null, -- 'Termal Fiş Yazıcısı', 'Etiket Yazıcısı'
  line_width integer not null default 48,
  connection_type text not null, -- 'Ethernet', 'USB', 'Bluetooth'
  connection_port text, -- IP/Port or USB Name
  is_account_printer boolean default false,
  is_active boolean default true,
  is_deleted boolean default false,
  constraint printers_pkey primary key (id)
);

-- RLS Policies
alter table public.printers enable row level security;

create policy "Users can view their own printers" on public.printers
  for select using (auth.uid() = business_id);

create policy "Users can insert their own printers" on public.printers
  for insert with check (auth.uid() = business_id);

create policy "Users can update their own printers" on public.printers
  for update using (auth.uid() = business_id);

create policy "Users can delete their own printers" on public.printers
  for delete using (auth.uid() = business_id);
