# Scripts

## generate_invites_supabase.py

Generate invite links for participants and store them in Supabase.

### Setup

1. Install Python dependencies:
   ```bash
   pip install supabase python-dotenv
   ```

2. Create `.env` file with your Supabase credentials:
   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_KEY=your_service_role_key
   ```
   
   **Note:** Use the service role key (not anon key) for admin operations.

3. Create the required tables in Supabase (see `docs/SUPABASE_SETUP.md`)

### Usage

```bash
# Basic usage - generate invites from CSV
python generate_invites_supabase.py --input emails.csv --out invites.csv

# With specific host URL
python generate_invites_supabase.py --input emails.csv --out invites.csv --host https://your-app.vercel.app

# Balance participants across groups 1 and 4
python generate_invites_supabase.py --input emails.csv --out invites.csv --groups "1,4"

# Send emails (requires SMTP config)
python generate_invites_supabase.py --input emails.csv --out invites.csv --send
```

### Input CSV Format

```csv
email,enrollment,group
alice@example.com,ENR001,1
bob@example.com,ENR002,4
carol@example.com,ENR003,
```

- `email` - Required. Participant's email address.
- `enrollment` - Optional. Student enrollment number.
- `group` - Optional. If empty and `--groups` is provided, round-robin assignment is used.

### Output CSV Format

```csv
participant_id,email,assigned_group,invite_code,invite_link
pid_12345,alice@example.com,1,ABC123XY,http://localhost:3000/invite/ABC123XY
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--input`, `-i` | Input CSV file | Required |
| `--out`, `-o` | Output CSV file | `invites_out.csv` |
| `--host` | Base URL for invite links | `http://localhost:3000` |
| `--groups` | Groups to balance across (e.g., "1,4") | Random 1-6 |
| `--expires-days` | Days until invite expires | 30 |
| `--send` | Send invite emails via SMTP | False |
| `--subject` | Email subject | "Your study invitation" |
| `--body-template` | Email body template | See default |

### Email Sending

To send emails, set these environment variables:
```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_username
SMTP_PASS=your_password
SMTP_FROM=noreply@example.com
SMTP_TLS=true
```

Then use `--send` flag.

### Example Workflow

1. Create test CSV:
   ```csv
   email,enrollment,group
   test1@example.com,ENR001,1
   test2@example.com,ENR002,4
   ```

2. Generate invites:
   ```bash
   python generate_invites_supabase.py -i test_emails.csv -o test_invites.csv --host http://localhost:3000 --groups "1,4"
   ```

3. Review output:
   ```bash
   cat test_invites.csv
   ```

4. Share invite links with participants!

### Vercel Deployment

For production, use your Vercel URL:
```bash
python generate_invites_supabase.py -i emails.csv -o invites.csv --host https://your-app.vercel.app
```

---

## test_emails.csv

Sample test file with dummy emails for testing the invite generation script.
