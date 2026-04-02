"""
Configuration for the Customer Insights data pipeline.
Update these paths and settings before running.
"""
from pathlib import Path

# Project root
PROJECT_ROOT = Path(__file__).parent.parent

# Data directories
RAW_DATA_DIR = PROJECT_ROOT / "data" / "raw"
PROCESSED_DATA_DIR = PROJECT_ROOT / "data" / "processed"
PUBLIC_DATA_DIR = PROJECT_ROOT / "public" / "data"

# Ensure directories exist
RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
PUBLIC_DATA_DIR.mkdir(parents=True, exist_ok=True)

# --- Data source file paths ---
# Place your exported CSVs in data/raw/ and update these filenames:
YOTPO_REVIEWS_CSV = RAW_DATA_DIR / "yotpo_reviews.csv"
FAIRING_RESPONSES_CSV = RAW_DATA_DIR / "fairing_responses.csv"

# Optional: additional data files (scraped via Firecrawl, etc.)
GOOGLE_REVIEWS_CSV = RAW_DATA_DIR / "google_reviews.csv"
REDDIT_POSTS_CSV = RAW_DATA_DIR / "reddit_posts.csv"
SOCIAL_COMMENTS_CSV = RAW_DATA_DIR / "social_comments.csv"

# --- Claude API settings ---
# Uses ANTHROPIC_API_KEY environment variable automatically
CLAUDE_MODEL = "claude-sonnet-4-20250514"
MAX_BATCH_SIZE = 50  # Reviews per API call for analysis
