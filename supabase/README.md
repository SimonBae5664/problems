# Supabase Setup Guide

This folder contains SQL scripts and RLS (Row Level Security) policies for the Supabase database.

## Setup Order

1. Run `01_create_tables.sql` to create all tables (or use Prisma migrations)
2. Run `02_enable_rls.sql` to enable RLS on all tables
3. Run `03_create_policies.sql` to create RLS policies
4. Run `04_create_storage_buckets.sql` to create storage buckets

## Storage Buckets

- `uploads`: Private bucket for original uploaded files
- `derivatives`: Private bucket for processed outputs (extracted text, OCR results, thumbnails, etc.)

## RLS Policies Overview

### Files
- Users can only read/write their own files
- Files with `visibility=SHARED` or `PUBLIC` can be read by others (but not modified)

### ProcessingJobs
- Users can only read/write their own jobs
- Workers use service role key to bypass RLS

### JobOutputs
- Users can only read outputs of their own jobs

### Problems
- Public read access (based on visibility)
- Only owner can modify

### UserActivity
- Users can only read their own activity

### StudentRecords
- Users can only read/write their own records

## Notes

- All policies use `auth.uid()` which requires Supabase Auth
- For JWT-based auth, policies need to be adjusted to use custom claims
- Service role key bypasses RLS (used by workers)

