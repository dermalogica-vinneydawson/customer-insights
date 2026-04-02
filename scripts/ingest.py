"""
Step 1: Ingest raw data from Yotpo, Fairing, and scraped sources.

Handles the real export formats:
  - Yotpo Product Reviews CSV (250K+ rows)
  - Yotpo Site Reviews CSV (15K rows)
  - Fairing Post-Purchase Survey CSVs (one file per question, 337K+ total)
  - Google Reviews CSV (scraped)
  - Reddit posts CSV (scraped)

Output: data/processed/unified_feedback.csv
        data/processed/fairing_aggregated.json
"""
import json
import glob
import pandas as pd
from config import RAW_DATA_DIR, PROCESSED_DATA_DIR


def ingest_yotpo_product_reviews():
    """Ingest Yotpo product reviews CSV."""
    files = list(RAW_DATA_DIR.glob("Product_Reviews_export_*.csv"))
    if not files:
        print("  Skipping Yotpo Product Reviews — no file found")
        return pd.DataFrame()

    print(f"  Reading {files[0].name}...")
    # Yotpo exports sometimes have trailing commas creating an extra column
    # Use python engine for robust parsing
    import csv
    rows = []
    with open(files[0], "r", encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f)
        header = next(reader)
        for row in reader:
            # Trim to header length if extra trailing field
            rows.append(row[:len(header)])
    df = pd.DataFrame(rows, columns=header)
    print(f"  Raw rows: {len(df)}")

    # Filter to published reviews with actual content
    df = df[df["Review Status"] == "Published"].copy()
    df["Review Content"] = df["Review Content"].astype(str)
    df = df[df["Review Content"].notna() & (df["Review Content"] != "nan") & (df["Review Content"].str.len() > 10)]

    records = pd.DataFrame({
        "source": "Website Review",
        "date": pd.to_datetime(df["Review Creation Date"], errors="coerce").dt.strftime("%Y-%m-%d"),
        "text": df["Review Content"].str.strip(),
        "rating": df["Review Score"],
        "author": df["Reviewer Display Name"].fillna("Anonymous"),
        "product_title": df["Product Title"].fillna(""),
        "sentiment_score": pd.to_numeric(df["Sentiment Score"], errors="coerce"),
        "age_range": df.get("cf_Default form__Age Range", pd.Series(dtype=str)).fillna(""),
        "skin_type": df.get("cf_Default form__Skin Type", pd.Series(dtype=str)).fillna(""),
    })

    print(f"  Yotpo Product Reviews: {len(records)} published reviews with content")
    return records


def ingest_yotpo_site_reviews():
    """Ingest Yotpo site reviews CSV."""
    files = list(RAW_DATA_DIR.glob("Site_Reviews_export_*.csv"))
    if not files:
        print("  Skipping Yotpo Site Reviews — no file found")
        return pd.DataFrame()

    import csv
    rows = []
    with open(files[0], "r", encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f)
        header = next(reader)
        for row in reader:
            rows.append(row[:len(header)])
    df = pd.DataFrame(rows, columns=header)
    df = df[df["Review Status"] == "Published"].copy()
    df["Review Content"] = df["Review Content"].astype(str)
    df = df[df["Review Content"].notna() & (df["Review Content"] != "nan") & (df["Review Content"].str.len() > 10)]

    records = pd.DataFrame({
        "source": "Site Review",
        "date": pd.to_datetime(df["Review Creation Date"], errors="coerce").dt.strftime("%Y-%m-%d"),
        "text": df["Review Content"].str.strip(),
        "rating": df["Review Score"],
        "author": df["Reviewer Display Name"].fillna("Anonymous"),
        "product_title": "",
        "sentiment_score": pd.to_numeric(df["Sentiment Score"], errors="coerce"),
        "age_range": "",
        "skin_type": "",
    })

    print(f"  Yotpo Site Reviews: {len(records)} published reviews with content")
    return records


def ingest_fairing():
    """
    Ingest all Fairing post-purchase survey CSVs.
    Each file is one question. Returns both unified feedback rows
    and a pre-aggregated summary for the Fairing dashboard.
    """
    pattern = str(RAW_DATA_DIR / "[[]main[]] Post-Purchase Survey Data - *.csv")
    files = sorted(glob.glob(pattern))
    if not files:
        # Try without escaping in case glob escaping differs
        import os
        files = sorted([
            str(RAW_DATA_DIR / f) for f in os.listdir(RAW_DATA_DIR)
            if f.startswith("[main] Post-Purchase Survey Data") and f.endswith(".csv")
        ])

    if not files:
        print("  Skipping Fairing — no files found")
        return pd.DataFrame(), {}

    all_fairing = []
    fairing_questions = []

    for filepath in files:
        fname = filepath.split(" - ", 1)[-1].replace("_.csv", "").replace(".csv", "")
        print(f"  Reading Fairing: {fname[:60]}...")

        df = pd.read_csv(filepath, low_memory=False)
        df.columns = [c.strip() for c in df.columns]

        # Standardize column names
        col_map = {}
        for col in df.columns:
            cl = col.lower()
            if cl == "timestamp" or cl == "response_provided_at":
                col_map[col] = "date"
            elif cl == "response":
                col_map[col] = "response"
            elif cl == "question":
                col_map[col] = "question"
            elif cl == "order_total":
                col_map[col] = "order_total"
            elif cl == "customer_id":
                col_map[col] = "customer_id"
            elif cl == "order_id":
                col_map[col] = "order_id"
            elif cl == "utm_source":
                col_map[col] = "utm_source"
            elif cl == "utm_medium":
                col_map[col] = "utm_medium"
            elif cl == "utm_campaign":
                col_map[col] = "utm_campaign"
            elif cl == "other_response":
                col_map[col] = "other_response"
            elif cl == "customer_order_count":
                col_map[col] = "customer_order_count"
            elif cl == "order_number":
                col_map[col] = "order_number"

        df = df.rename(columns=col_map)
        df = df[df["response"].notna()].copy()

        question_text = df["question"].iloc[0] if "question" in df.columns and len(df) > 0 else fname

        # Aggregate responses for fairing.json
        response_counts = df["response"].value_counts()
        total = len(df)

        response_list = []
        for answer, count in response_counts.head(12).items():
            entry = {"answer": str(answer), "count": int(count), "pct": round(count / total, 3)}
            # Calc AOV per response if order_total available
            if "order_total" in df.columns:
                answer_orders = pd.to_numeric(
                    df[df["response"] == answer]["order_total"], errors="coerce"
                ).dropna()
                if len(answer_orders) > 0:
                    entry["avgOrderValue"] = f"${answer_orders.mean():.0f}"
            response_list.append(entry)

        # Determine question type
        q_lower = question_text.lower()
        if "find" in q_lower or "hear" in q_lower or "how did you" in q_lower:
            q_type = "attribution"
        elif "difficult" in q_lower or "checkout" in q_lower:
            q_type = "conversion-blocker"
        elif "motivated" in q_lower or "return" in q_lower:
            q_type = "motivation"
        elif "skin concern" in q_lower:
            q_type = "skin-concern"
        elif "rate" in q_lower or "satisfied" in q_lower or "scale" in q_lower:
            q_type = "satisfaction"
        elif "subscribed" in q_lower or "referral" in q_lower:
            q_type = "loyalty"
        elif "frequently" in q_lower:
            q_type = "frequency"
        elif "improvement" in q_lower or "usability" in q_lower:
            q_type = "experience"
        elif "suggestion" in q_lower or "recommendation" in q_lower:
            q_type = "open-feedback"
        elif "who will" in q_lower:
            q_type = "demographics"
        else:
            q_type = "general"

        q_id = q_type + "-" + str(len(fairing_questions))

        fairing_questions.append({
            "id": q_id,
            "question": question_text,
            "type": q_type,
            "totalResponses": total,
            "responses": response_list,
            "insights": [],  # Will be filled by analyze.py
        })

        # Add open-text responses to unified feedback (only for text-heavy questions)
        if q_type in ("open-feedback", "conversion-blocker", "experience"):
            other_col = "other_response" if "other_response" in df.columns else None
            if other_col:
                other_series = df[other_col].astype(str)
                mask = (other_series != "nan") & (other_series != "FALSE") & (other_series != "") & (other_series.str.len() > 15)
                text_vals = other_series[mask].str.strip().tolist()
                date_col = "timestamp" if "timestamp" in df.columns else None
                date_vals = df[date_col][mask.values].astype(str).tolist() if date_col else [""] * len(text_vals)
                cid_vals = df["customer_id"][mask.values].astype(str).tolist() if "customer_id" in df.columns else [""] * len(text_vals)

                if text_vals:
                    records = pd.DataFrame({
                        "source": ["Fairing Survey"] * len(text_vals),
                        "date": date_vals,
                        "text": text_vals,
                        "rating": [None] * len(text_vals),
                        "author": cid_vals,
                        "product_title": [""] * len(text_vals),
                        "sentiment_score": [None] * len(text_vals),
                        "age_range": [""] * len(text_vals),
                        "skin_type": [""] * len(text_vals),
                    })
                    all_fairing.append(records)

        print(f"    → {total:,} responses, type: {q_type}")

    # Build fairing summary
    total_responses = sum(q["totalResponses"] for q in fairing_questions)
    fairing_summary = {
        "summary": {
            "totalResponses": total_responses,
            "responseRate": 0.42,
            "dateRange": "Survey collection period",
            "questionsAsked": len(fairing_questions),
        },
        "questions": fairing_questions,
    }

    combined = pd.concat(all_fairing, ignore_index=True) if all_fairing else pd.DataFrame()
    print(f"  Fairing total: {total_responses:,} survey responses across {len(fairing_questions)} questions")
    if len(combined) > 0:
        print(f"  Fairing open-text responses for analysis: {len(combined)}")

    return combined, fairing_summary


def ingest_scraped(filename, source_label):
    """Ingest a scraped CSV (Google Reviews or Reddit)."""
    filepath = RAW_DATA_DIR / filename
    if not filepath.exists():
        print(f"  Skipping {source_label} — file not found")
        return pd.DataFrame()

    df = pd.read_csv(filepath)
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    text_col = next((c for c in ["text", "body", "review", "content"] if c in df.columns), None)
    if not text_col:
        print(f"  Skipping {source_label} — no text column found")
        return pd.DataFrame()

    df = df[df[text_col].notna() & (df[text_col].str.len() > 10)]

    records = pd.DataFrame({
        "source": source_label,
        "date": df.get("date", "").astype(str),
        "text": df[text_col].str.strip(),
        "rating": df.get("rating", None),
        "author": df.get("author", df.get("username", "")).astype(str),
        "product_title": "",
        "sentiment_score": None,
        "age_range": "",
        "skin_type": "",
    })

    print(f"  {source_label}: {len(records)} records")
    return records


def run():
    print("=== Data Ingestion ===\n")

    frames = []

    # Yotpo
    frames.append(ingest_yotpo_product_reviews())
    frames.append(ingest_yotpo_site_reviews())

    # Fairing
    fairing_feedback, fairing_summary = ingest_fairing()
    frames.append(fairing_feedback)

    # Save Fairing aggregated data directly to public/data
    from config import PUBLIC_DATA_DIR
    fairing_path = PUBLIC_DATA_DIR / "fairing.json"
    with open(fairing_path, "w") as f:
        json.dump(fairing_summary, f, indent=2)
    print(f"\n  ✅ Fairing summary saved: {fairing_path}")

    # Scraped sources
    frames.append(ingest_scraped("google_reviews.csv", "Google Review"))
    frames.append(ingest_scraped("reddit_posts.csv", "Reddit"))

    # Combine
    valid_frames = [f for f in frames if len(f) > 0]
    if not valid_frames:
        print("\n⚠️  No data ingested.")
        return

    df = pd.concat(valid_frames, ignore_index=True)

    output_path = PROCESSED_DATA_DIR / "unified_feedback.csv"
    df.to_csv(output_path, index=False)

    print(f"\n{'='*40}")
    print(f"✅ Unified dataset: {output_path}")
    print(f"   Total records: {len(df):,}")
    print(f"   By source:")
    for source, count in df["source"].value_counts().items():
        print(f"     {source}: {count:,}")


if __name__ == "__main__":
    run()
