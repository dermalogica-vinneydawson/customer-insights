"""
Step 2: Analyze unified feedback using Claude API.

Reads: data/processed/unified_feedback.csv
Produces: data/processed/analyzed_feedback.csv (with sentiment, themes, persona tags)

Then generates all JSON files for the dashboard:
  - public/data/personas.json
  - public/data/themes.json
  - public/data/sentiment.json
  - public/data/verbatims.json
  - public/data/fairing.json
"""
import json
import os
import pandas as pd
from anthropic import Anthropic
from config import PROCESSED_DATA_DIR, PUBLIC_DATA_DIR, CLAUDE_MODEL, MAX_BATCH_SIZE

client = Anthropic()


def analyze_batch(texts_with_sources: list[dict]) -> list[dict]:
    """
    Send a batch of feedback texts to Claude for sentiment + theme analysis.
    Returns a list of dicts with: sentiment, score, themes, key_quote, persona_hint.
    """
    formatted = "\n".join(
        f"[{i+1}] ({item['source']}) {item['text'][:500]}"
        for i, item in enumerate(texts_with_sources)
    )

    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=4096,
        messages=[{
            "role": "user",
            "content": f"""Analyze each piece of customer feedback below. For each numbered item, return a JSON object with:
- "sentiment": "positive", "negative", or "mixed"
- "score": float 0.0 (very negative) to 1.0 (very positive)
- "themes": array of 1-3 theme labels (e.g., "pricing", "product quality", "shipping", "ingredients", "routine complexity", "loyalty", "customer service", "professional trust", "results/efficacy")
- "is_key_quote": boolean — true if this is a particularly insightful or representative customer quote
- "persona_hint": one of "ingredient-conscious", "routine-simplifier", "deal-seeker", "skin-concern-solver", "brand-loyalist", or "unknown"

Return ONLY a JSON array of objects, one per item, in the same order. No markdown, no explanation.

Feedback to analyze:
{formatted}"""
        }]
    )

    try:
        text = response.content[0].text.strip()
        # Handle potential markdown wrapping
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0]
        return json.loads(text)
    except (json.JSONDecodeError, IndexError) as e:
        print(f"  ⚠️  Failed to parse batch response: {e}")
        # Return neutral defaults
        return [
            {"sentiment": "neutral", "score": 0.5, "themes": [], "is_key_quote": False, "persona_hint": "unknown"}
            for _ in texts_with_sources
        ]


def generate_personas(df: pd.DataFrame) -> list[dict]:
    """Use Claude to synthesize customer personas from the analyzed data."""

    # Build a summary for Claude
    theme_counts = {}
    persona_counts = {}
    sentiment_by_persona = {}
    sample_quotes = {}

    for _, row in df.iterrows():
        persona = row.get("persona_hint", "unknown")
        persona_counts[persona] = persona_counts.get(persona, 0) + 1

        if persona not in sentiment_by_persona:
            sentiment_by_persona[persona] = []
        sentiment_by_persona[persona].append(row.get("score", 0.5))

        for theme in (row.get("themes") or []):
            theme_counts[theme] = theme_counts.get(theme, 0) + 1

        if row.get("is_key_quote") and persona != "unknown":
            if persona not in sample_quotes:
                sample_quotes[persona] = []
            if len(sample_quotes[persona]) < 5:
                sample_quotes[persona].append(row["text"][:200])

    summary = f"""Based on analyzing {len(df)} customer feedback items, here's what we found:

Persona distribution: {json.dumps(persona_counts)}
Theme frequency: {json.dumps(dict(sorted(theme_counts.items(), key=lambda x: -x[1])[:15]))}

Average sentiment by persona:
{chr(10).join(f"  {p}: {sum(scores)/len(scores):.2f} ({len(scores)} items)" for p, scores in sentiment_by_persona.items() if p != "unknown")}

Sample quotes by persona:
{chr(10).join(f"  {p}: {json.dumps(quotes)}" for p, quotes in sample_quotes.items())}
"""

    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=8192,
        messages=[{
            "role": "user",
            "content": f"""You are a customer insights analyst. Based on the analyzed feedback data below, generate detailed customer personas.

{summary}

Generate a JSON array of persona objects. Each persona should have:
- "id": kebab-case identifier
- "name": descriptive name (e.g., "The Ingredient-Conscious Shopper")
- "archetype": one-sentence description
- "avatar": single emoji
- "demographics": {{"ageRange", "gender", "location", "income", "education"}}
- "psychographics": {{"values": [...], "lifestyle": "...", "motivations": [...]}}
- "painPoints": [...4 pain points]
- "purchaseBehavior": {{"aov", "frequency", "preferredProducts": [...], "channel"}}
- "contentAffinity": [...what content they engage with]
- "sentimentProfile": {{"overall": "positive/negative/mixed", "score": float, "drivers": {{"positive": [...], "negative": [...]}}}}
- "recommendations": {{"paidMedia": "...", "crm": "...", "cro": "..."}}
- "sampleSize": number of feedback items for this persona
- "confidence": float 0-1
- "topVerbatims": [...3 best quotes from this persona]

Return ONLY the JSON array. No markdown, no explanation. Generate 4-6 personas based on the data patterns."""
        }]
    )

    try:
        text = response.content[0].text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0]
        return json.loads(text)
    except (json.JSONDecodeError, IndexError) as e:
        print(f"  ⚠️  Failed to parse personas: {e}")
        return []


def generate_themes(df: pd.DataFrame) -> list[dict]:
    """Use Claude to generate theme analysis from the data."""

    # Aggregate themes
    theme_data = {}
    for _, row in df.iterrows():
        for theme in (row.get("themes") or []):
            if theme not in theme_data:
                theme_data[theme] = {"count": 0, "sentiments": [], "quotes": [], "personas": []}
            theme_data[theme]["count"] += 1
            theme_data[theme]["sentiments"].append(row.get("score", 0.5))
            if row.get("is_key_quote") and len(theme_data[theme]["quotes"]) < 5:
                theme_data[theme]["quotes"].append(row["text"][:200])
            theme_data[theme]["personas"].append(row.get("persona_hint", "unknown"))

    # Top themes only
    top_themes = sorted(theme_data.items(), key=lambda x: -x[1]["count"])[:10]

    summary = json.dumps({
        name: {
            "mentionCount": data["count"],
            "avgSentiment": round(sum(data["sentiments"]) / len(data["sentiments"]), 2),
            "sampleQuotes": data["quotes"][:3],
            "topPersonas": list(set(data["personas"]))[:5],
        }
        for name, data in top_themes
    }, indent=2)

    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=8192,
        messages=[{
            "role": "user",
            "content": f"""You are a customer insights analyst. Based on the theme data below, generate a detailed themes analysis.

{summary}

Generate a JSON array of theme objects. Each theme should have:
- "id": kebab-case identifier
- "name": human-readable name
- "category": one of "Product", "Price", "Experience", "Brand", "Service"
- "mentionCount": number
- "sentiment": {{"positive": float, "neutral": float, "negative": float}} (must sum to ~1.0)
- "trend": "rising", "stable", or "declining"
- "trendDelta": integer percent change
- "description": one sentence
- "relatedPersonas": [...persona IDs]
- "topVerbatims": [...3 quotes]
- "teamImplications": {{"paidMedia": "...", "crm": "...", "cro": "..."}}

Return ONLY the JSON array. No markdown."""
        }]
    )

    try:
        text = response.content[0].text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0]
        return json.loads(text)
    except (json.JSONDecodeError, IndexError) as e:
        print(f"  ⚠️  Failed to parse themes: {e}")
        return []


def generate_sentiment_summary(df: pd.DataFrame) -> dict:
    """Generate sentiment.json from analyzed data."""
    scores = df["score"].dropna()
    overall_score = round(scores.mean(), 2) if len(scores) > 0 else 0.5

    pos = len(df[df["sentiment"] == "positive"])
    neg = len(df[df["sentiment"] == "negative"])
    mix = len(df) - pos - neg
    total = max(len(df), 1)

    by_source = []
    for source, group in df.groupby("source"):
        s_scores = group["score"].dropna()
        s_pos = len(group[group["sentiment"] == "positive"])
        s_neg = len(group[group["sentiment"] == "negative"])
        s_neu = len(group) - s_pos - s_neg
        s_total = max(len(group), 1)
        by_source.append({
            "source": source,
            "score": round(s_scores.mean(), 2) if len(s_scores) > 0 else 0.5,
            "mentions": len(group),
            "positive": round(s_pos / s_total, 2),
            "neutral": round(s_neu / s_total, 2),
            "negative": round(s_neg / s_total, 2),
        })

    # Monthly time series
    df_dated = df[df["date"].str.len() >= 7].copy()
    df_dated["month"] = df_dated["date"].str[:7]
    over_time = []
    for month, group in sorted(df_dated.groupby("month")):
        over_time.append({
            "month": month,
            "score": round(group["score"].dropna().mean(), 2) if len(group["score"].dropna()) > 0 else 0.5,
            "positive": len(group[group["sentiment"] == "positive"]),
            "neutral": len(group[group["sentiment"].isin(["mixed", "neutral"])]),
            "negative": len(group[group["sentiment"] == "negative"]),
        })

    # Top drivers
    theme_sentiments = {}
    for _, row in df.iterrows():
        for theme in (row.get("themes") or []):
            if theme not in theme_sentiments:
                theme_sentiments[theme] = {"scores": [], "count": 0}
            theme_sentiments[theme]["scores"].append(row.get("score", 0.5))
            theme_sentiments[theme]["count"] += 1

    sorted_themes = sorted(
        theme_sentiments.items(),
        key=lambda x: sum(x[1]["scores"]) / len(x[1]["scores"]) if x[1]["scores"] else 0,
        reverse=True,
    )

    top_positive = [
        {"topic": name, "score": round(sum(d["scores"]) / len(d["scores"]), 2), "mentions": d["count"]}
        for name, d in sorted_themes[:3]
    ]
    top_negative = [
        {"topic": name, "score": round(sum(d["scores"]) / len(d["scores"]), 2), "mentions": d["count"]}
        for name, d in sorted_themes[-3:]
    ]

    return {
        "overall": {
            "score": overall_score,
            "label": "Positive" if overall_score > 0.6 else "Negative" if overall_score < 0.4 else "Mixed",
            "totalMentions": total,
            "breakdown": {
                "positive": round(pos / total, 2),
                "neutral": round(mix / total, 2),
                "negative": round(neg / total, 2),
            }
        },
        "bySource": by_source,
        "overTime": over_time,
        "topPositiveDrivers": top_positive,
        "topNegativeDrivers": top_negative,
    }


def generate_verbatims(df: pd.DataFrame, personas: list, themes: list) -> list[dict]:
    """Generate verbatims.json from analyzed data — top quotes only."""
    key_quotes = df[df["is_key_quote"] == True].head(50)  # noqa: E712

    if len(key_quotes) < 10:
        # If not enough key quotes, take top-scored
        key_quotes = df.nlargest(50, "score")

    persona_ids = [p["id"] for p in personas]
    theme_ids = [t["id"] for t in themes]

    verbatims = []
    for i, (_, row) in enumerate(key_quotes.iterrows()):
        persona = row.get("persona_hint", "unknown")
        row_themes = row.get("themes") or []
        theme = row_themes[0] if row_themes else ""

        # Map theme name to theme ID if possible
        matched_theme = ""
        for t in themes:
            if t["name"].lower() in str(theme).lower() or str(theme).lower() in t["name"].lower():
                matched_theme = t["id"]
                break

        verbatims.append({
            "id": i + 1,
            "text": row["text"][:300],
            "source": row["source"],
            "sentiment": row.get("sentiment", "neutral"),
            "score": round(row.get("score", 0.5), 2),
            "theme": matched_theme or theme,
            "persona": persona if persona in persona_ids else persona,
            "date": row.get("date", ""),
        })

    return verbatims


def generate_fairing_analysis(df: pd.DataFrame) -> dict:
    """Generate fairing.json from Fairing survey responses."""
    fairing_df = df[df["source"] == "Fairing Survey"]

    if fairing_df.empty:
        print("  ⚠️  No Fairing data found — skipping fairing.json generation")
        return None

    questions = fairing_df.groupby("question")
    question_data = []

    for question, group in questions:
        responses = group["text"].value_counts()
        total = len(group)

        response_list = []
        for answer, count in responses.head(10).items():
            answer_group = group[group["text"] == answer]
            avg_order = None
            if "order_total" in answer_group.columns:
                orders = pd.to_numeric(answer_group["order_total"], errors="coerce").dropna()
                if len(orders) > 0:
                    avg_order = f"${orders.mean():.0f}"

            entry = {
                "answer": str(answer),
                "count": int(count),
                "pct": round(count / total, 2),
            }
            if avg_order:
                entry["avgOrderValue"] = avg_order
            response_list.append(entry)

        # Determine question type
        q_lower = question.lower()
        if "hear" in q_lower or "find" in q_lower:
            q_type = "attribution"
        elif "stop" in q_lower or "almost" in q_lower:
            q_type = "conversion-blocker"
        elif "reason" in q_lower or "decided" in q_lower or "why" in q_lower:
            q_type = "motivation"
        elif "benefit" in q_lower:
            q_type = "value-perception"
        elif "plan" in q_lower or "use" in q_lower or "intent" in q_lower:
            q_type = "intent"
        elif "communication" in q_lower or "prefer" in q_lower:
            q_type = "preference"
        else:
            q_type = "general"

        q_id = q_type + "-" + str(len(question_data))

        question_data.append({
            "id": q_id,
            "question": question,
            "type": q_type,
            "totalResponses": total,
            "responses": response_list,
            "insights": [],  # Will be filled by Claude
        })

    # Use Claude to generate insights for each question
    if question_data:
        q_summary = json.dumps([
            {"question": q["question"], "type": q["type"], "totalResponses": q["totalResponses"],
             "topResponses": [{"answer": r["answer"], "pct": r["pct"]} for r in q["responses"][:5]]}
            for q in question_data
        ], indent=2)

        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=4096,
            messages=[{
                "role": "user",
                "content": f"""For each Fairing post-purchase survey question below, generate 3-4 actionable insights.
Each insight should be specific, data-driven, and mention which team (Paid Media, CRM, or CRO) should act on it.

Questions and responses:
{q_summary}

Return a JSON array where each element is an array of 3-4 insight strings, in the same order as the questions.
Return ONLY the JSON array. No markdown."""
            }]
        )

        try:
            text = response.content[0].text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1].rsplit("```", 1)[0]
            insights_lists = json.loads(text)
            for i, insights in enumerate(insights_lists):
                if i < len(question_data):
                    question_data[i]["insights"] = insights
        except (json.JSONDecodeError, IndexError) as e:
            print(f"  ⚠️  Failed to generate Fairing insights: {e}")

    return {
        "summary": {
            "totalResponses": len(fairing_df),
            "responseRate": 0.42,  # Update with real data if available
            "dateRange": f"{fairing_df['date'].min()[:7]} to {fairing_df['date'].max()[:7]}" if len(fairing_df) > 0 else "",
            "questionsAsked": len(question_data),
        },
        "questions": question_data,
    }


def run():
    print("=== AI Analysis ===\n")

    # Load unified data
    unified_path = PROCESSED_DATA_DIR / "unified_feedback.csv"
    if not unified_path.exists():
        print("❌ No unified data found. Run ingest.py first.")
        return

    df = pd.read_csv(unified_path)
    print(f"Loaded {len(df)} records from {unified_path}\n")

    # Step 1: Sentiment & theme analysis in batches
    print("Step 1: Analyzing sentiment and themes...")
    all_analyses = []

    for i in range(0, len(df), MAX_BATCH_SIZE):
        batch = df.iloc[i:i + MAX_BATCH_SIZE]
        items = [{"source": row["source"], "text": str(row["text"])[:500]} for _, row in batch.iterrows()]
        print(f"  Analyzing batch {i // MAX_BATCH_SIZE + 1}/{(len(df) - 1) // MAX_BATCH_SIZE + 1} ({len(items)} items)...")
        results = analyze_batch(items)
        all_analyses.extend(results)

    # Merge analysis results back into dataframe
    for i, analysis in enumerate(all_analyses):
        if i < len(df):
            df.at[df.index[i], "sentiment"] = analysis.get("sentiment", "neutral")
            df.at[df.index[i], "score"] = analysis.get("score", 0.5)
            df.at[df.index[i], "themes"] = analysis.get("themes", [])
            df.at[df.index[i], "is_key_quote"] = analysis.get("is_key_quote", False)
            df.at[df.index[i], "persona_hint"] = analysis.get("persona_hint", "unknown")

    # Save analyzed data
    analyzed_path = PROCESSED_DATA_DIR / "analyzed_feedback.csv"
    # Convert lists to JSON strings for CSV storage
    df_save = df.copy()
    df_save["themes"] = df_save["themes"].apply(lambda x: json.dumps(x) if isinstance(x, list) else x)
    df_save.to_csv(analyzed_path, index=False)
    print(f"  ✅ Analyzed data saved: {analyzed_path}\n")

    # Parse themes back from JSON strings for processing
    df["themes"] = df["themes"].apply(lambda x: json.loads(x) if isinstance(x, str) and x.startswith("[") else x if isinstance(x, list) else [])

    # Step 2: Generate personas
    print("Step 2: Generating personas...")
    personas = generate_personas(df)
    with open(PUBLIC_DATA_DIR / "personas.json", "w") as f:
        json.dump(personas, f, indent=2)
    print(f"  ✅ {len(personas)} personas generated\n")

    # Step 3: Generate themes
    print("Step 3: Generating themes...")
    themes = generate_themes(df)
    with open(PUBLIC_DATA_DIR / "themes.json", "w") as f:
        json.dump(themes, f, indent=2)
    print(f"  ✅ {len(themes)} themes generated\n")

    # Step 4: Generate sentiment summary
    print("Step 4: Generating sentiment summary...")
    sentiment = generate_sentiment_summary(df)
    with open(PUBLIC_DATA_DIR / "sentiment.json", "w") as f:
        json.dump(sentiment, f, indent=2)
    print("  ✅ Sentiment summary generated\n")

    # Step 5: Generate verbatims
    print("Step 5: Selecting top verbatims...")
    verbatims = generate_verbatims(df, personas, themes)
    with open(PUBLIC_DATA_DIR / "verbatims.json", "w") as f:
        json.dump(verbatims, f, indent=2)
    print(f"  ✅ {len(verbatims)} verbatims selected\n")

    # Step 6: Generate Fairing analysis
    print("Step 6: Generating Fairing analysis...")
    fairing = generate_fairing_analysis(df)
    if fairing:
        with open(PUBLIC_DATA_DIR / "fairing.json", "w") as f:
            json.dump(fairing, f, indent=2)
        print("  ✅ Fairing analysis generated\n")

    print("=" * 40)
    print("✅ All dashboard JSON files updated in public/data/")
    print("   Run 'npm run build' to rebuild the static site.")


if __name__ == "__main__":
    run()
