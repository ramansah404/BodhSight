import psycopg2
import sys

import urllib.parse

project_ref = "jijisnykcjcscxiveimy"
password = urllib.parse.quote_plus("2029@Batch10")

regions = [
    "ap-south-1", "eu-central-1", "us-east-1", "us-west-1", "us-west-2",
    "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "eu-west-1",
    "eu-west-2", "sa-east-1", "ca-central-1"
]

for region in regions:
    host = f"aws-0-{region}.pooler.supabase.com"
    dsn = f"postgresql://postgres.{project_ref}:{password}@{host}:6543/postgres"
    print(f"Trying {host}...")
    try:
        conn = psycopg2.connect(dsn, connect_timeout=3)
        print(f"SUCCESS: {host} is the correct region!")
        conn.close()
        # Save to a file for later use
        with open("pooler_url.txt", "w") as f:
            f.write(dsn)
        sys.exit(0)
    except Exception as e:
        print(f"Failed: {e}")

print("Could not connect to any region.")
