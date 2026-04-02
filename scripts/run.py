"""
Main runner — executes the full pipeline:
  1. Ingest raw CSV exports → unified_feedback.csv
  2. Analyze with Claude API → dashboard JSON files

Usage:
  cd scripts
  pip install -r requirements.txt
  python run.py

Before running:
  1. Place your CSV exports in data/raw/:
     - yotpo_reviews.csv (from Yotpo dashboard → Export Reviews)
     - fairing_responses.csv (from Fairing dashboard → Question Stream → Export)
     - (optional) google_reviews.csv, reddit_posts.csv, social_comments.csv
  2. Ensure ANTHROPIC_API_KEY is set in your environment
"""
import os
import sys

def main():
    # Check for API key
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("❌ ANTHROPIC_API_KEY not set.")
        print("   Set it with: export ANTHROPIC_API_KEY='your-key-here'")
        sys.exit(1)

    print("🚀 Customer Insights Pipeline\n")
    print("=" * 40)

    # Step 1: Ingest
    import ingest
    ingest.run()

    print("\n" + "=" * 40 + "\n")

    # Step 2: Analyze
    import analyze
    analyze.run()

    print("\n🎉 Pipeline complete!")
    print("   Your dashboard at public/data/ is updated.")
    print("   Run 'npm run dev' from the project root to preview.")


if __name__ == "__main__":
    main()
