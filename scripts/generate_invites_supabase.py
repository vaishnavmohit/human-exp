#!/usr/bin/env python3
"""
Generate invite links and store them in Supabase.

Usage:
  python generate_invites_supabase.py --input emails.csv --out invites.csv [--send]

Input CSV columns: email,enrollment,group (group optional integer 1-6)
Output CSV columns: participant_id,email,assigned_group,invite_link,invite_code

Requirements:
  pip install supabase python-dotenv

Environment variables (in .env file):
  SUPABASE_URL=https://xxxxx.supabase.co
  SUPABASE_KEY=your_service_role_key  # Use service role for admin operations
"""
import csv
import os
import sys
import json
import random
import string
import argparse
from datetime import datetime, timedelta
from typing import Optional, Tuple, Union

try:
    from supabase import create_client, Client
    from dotenv import load_dotenv
except ImportError:
    print("Please install required packages: pip install supabase python-dotenv")
    sys.exit(1)

# Load environment variables
load_dotenv()

SUPABASE_URL = os.environ.get('SUPABASE_URL') or os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY') or os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_KEY environment variables are required")
    print("Create a .env file with:")
    print("  SUPABASE_URL=https://xxxxx.supabase.co")
    print("  SUPABASE_KEY=your_service_role_key")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Default configuration
DEFAULT_N_PER_CATEGORY = int(os.environ.get('N_PER_CAT', '10'))


def generate_participant_id() -> str:
    """Generate a unique participant ID."""
    return 'pid_' + str(random.randint(10000, 99999))


def generate_invite_code(length: int = 8) -> str:
    """Generate a unique invite code."""
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choice(chars) for _ in range(length))


def get_or_create_participant(email: str, enrollment: Optional[str] = None, group: Optional[Union[int, str]] = None) -> Tuple:
    """
    Get existing participant or create new one.
    Returns (participant_id, assigned_group, is_new)
    """
    email_norm = email.strip().lower()
    enrollment_norm = enrollment.strip().lower() if enrollment else None
    
    # Try to find existing participant by email
    result = supabase.table('participants').select('participant_id, assigned_group').eq('email', email_norm).execute()
    
    if result.data and len(result.data) > 0:
        existing = result.data[0]
        return existing['participant_id'], existing['assigned_group'], False
    
    # Try to find by enrollment number
    if enrollment_norm:
        result = supabase.table('participants').select('participant_id, assigned_group').eq('enrollment_number', enrollment_norm).execute()
        if result.data and len(result.data) > 0:
            existing = result.data[0]
            # Update email if not set
            supabase.table('participants').update({'email': email_norm}).eq('participant_id', existing['participant_id']).execute()
            return existing['participant_id'], existing['assigned_group'], False
    
    # Create new participant
    participant_id = generate_participant_id()
    assigned_group = int(group) if group and str(group).isdigit() else random.randint(1, 6)
    
    new_participant = {
        'participant_id': participant_id,
        'email': email_norm,
        'enrollment_number': enrollment_norm,
        'assigned_group': assigned_group,
        'consent': True,
        'share_data': False,
        'n_per_category': DEFAULT_N_PER_CATEGORY,
        'metadata_json': {'created_by': 'invite_script', 'created_at': datetime.utcnow().isoformat()}
    }
    
    try:
        supabase.table('participants').insert(new_participant).execute()
        return participant_id, assigned_group, True
    except Exception as e:
        print(f"Error creating participant: {e}")
        # Try with a new ID in case of collision
        participant_id = generate_participant_id()
        new_participant['participant_id'] = participant_id
        supabase.table('participants').insert(new_participant).execute()
        return participant_id, assigned_group, True


def create_invite(participant_id: str, email: str, assigned_group: int, expires_days: int = 30) -> str:
    """
    Create an invite record in the database.
    Returns the invite code.
    """
    invite_code = generate_invite_code()
    email_norm = email.strip().lower()
    
    invite_data = {
        'participant_id': participant_id,
        'invite_code': invite_code,
        'email': email_norm,
        'assigned_group': assigned_group,
        'used': False,
        'expires_at': (datetime.utcnow() + timedelta(days=expires_days)).isoformat()
    }
    
    try:
        supabase.table('invites').insert(invite_data).execute()
        return invite_code
    except Exception as e:
        # In case of code collision, try again
        print(f"Invite creation failed, retrying: {e}")
        invite_code = generate_invite_code()
        invite_data['invite_code'] = invite_code
        supabase.table('invites').insert(invite_data).execute()
        return invite_code


def make_invite_link(host: str, invite_code: str) -> str:
    """Generate the invite link URL."""
    host = host.rstrip('/')
    return f"{host}/invite/{invite_code}"


def send_email_smtp(smtp_cfg: dict, to_email: str, subject: str, body: str, from_email: Optional[str] = None):
    """Send email using SMTP."""
    import smtplib
    from email.message import EmailMessage
    
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = from_email or smtp_cfg.get('from', '')
    msg['To'] = to_email
    msg.set_content(body)

    host = smtp_cfg.get('host', 'localhost')
    port = int(smtp_cfg.get('port', 587))
    user = smtp_cfg.get('user')
    password = smtp_cfg.get('pass')
    use_tls = smtp_cfg.get('tls', True)

    with smtplib.SMTP(host, port, timeout=20) as s:
        if use_tls:
            s.starttls()
        if user and password:
            s.login(user, password)
        s.send_message(msg)


def main():
    parser = argparse.ArgumentParser(description='Generate invite links and store in Supabase')
    parser.add_argument('--input', '-i', required=True, help='Input CSV of emails (email,enrollment,group)')
    parser.add_argument('--out', '-o', default='invites_out.csv', help='Output CSV path')
    parser.add_argument('--host', default='http://localhost:3000', help='Base host for invite links')
    parser.add_argument('--send', action='store_true', help='Send invite emails if SMTP config exists')
    parser.add_argument('--subject', default='Your study invitation', help='Email subject')
    parser.add_argument('--body-template', default='Hello,\n\nPlease participate using this link: {link}\n\nThank you.', help='Body template (include {link})')
    parser.add_argument('--groups', default=None, help='Comma-separated group ids to balance participants across when group column is empty (e.g. "1,4")')
    parser.add_argument('--expires-days', type=int, default=30, help='Days until invite expires')
    args = parser.parse_args()

    # Parse groups for round-robin assignment
    groups_list = None
    if args.groups:
        groups_list = [int(g) for g in args.groups.split(',') if g.strip()]
    rr_index = 0

    # SMTP config from environment
    smtp_cfg = {
        'host': os.environ.get('SMTP_HOST'),
        'port': os.environ.get('SMTP_PORT', 587),
        'user': os.environ.get('SMTP_USER'),
        'pass': os.environ.get('SMTP_PASS'),
        'from': os.environ.get('SMTP_FROM'),
        'tls': os.environ.get('SMTP_TLS', 'true').lower() == 'true'
    }
    will_send = args.send and smtp_cfg.get('host')

    results = []
    
    with open(args.input, newline='') as inf:
        reader = csv.DictReader(inf)
        
        for row in reader:
            email = (row.get('email') or '').strip()
            enrollment = (row.get('enrollment') or '').strip()
            group = row.get('group')
            
            if not email:
                print('Skipping empty email row')
                continue
            
            # Determine group
            provided_group = group
            if (not provided_group or provided_group.strip() == '') and groups_list:
                provided_group = str(groups_list[rr_index % len(groups_list)])
                rr_index += 1
            
            try:
                # Get or create participant
                pid, assigned_group, is_new = get_or_create_participant(email, enrollment, provided_group)
                
                # Create invite
                invite_code = create_invite(pid, email, assigned_group, args.expires_days)
                
                # Generate link
                link = make_invite_link(args.host, invite_code)
                
                status = 'new' if is_new else 'existing'
                print(f'Created invite for {email}: {pid} (group={assigned_group}, {status})')
                
                results.append({
                    'participant_id': pid,
                    'email': email,
                    'assigned_group': assigned_group,
                    'invite_code': invite_code,
                    'invite_link': link
                })
                
                # Send email if configured
                if will_send:
                    body = args.body_template.format(link=link, email=email)
                    try:
                        from_addr = smtp_cfg.get('from', '') if smtp_cfg else ''
                        send_email_smtp(smtp_cfg, email, args.subject, body, from_addr)
                        print(f'  Emailed {email}')
                    except Exception as e:
                        print(f'  Failed to email {email}: {e}')
                        
            except Exception as e:
                print(f'Error processing {email}: {e}')
                continue
    
    # Write output CSV
    with open(args.out, 'w', newline='') as outf:
        fieldnames = ['participant_id', 'email', 'assigned_group', 'invite_code', 'invite_link']
        writer = csv.DictWriter(outf, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)
    
    print(f'\nWrote {len(results)} invites to {args.out}')
    print(f'Invite links use host: {args.host}')


if __name__ == '__main__':
    main()
