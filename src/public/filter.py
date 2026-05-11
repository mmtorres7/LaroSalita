import json

# ===== FILES =====
TAGALOG_FILE = "tagalog_dict.json"
ADDED_FILE = "added_words.json"

# ===== LOAD TAGALOG =====
with open(TAGALOG_FILE, "r", encoding="utf-8") as f:
    tagalog_data = json.load(f)

existing_words = set(
    word.strip().lower()
    for word in tagalog_data["data"]
)

# ===== LOAD ADDED WORDS =====
with open(ADDED_FILE, "r", encoding="utf-8") as f:
    added_data = json.load(f)

# your file uses {"added": [...]}
added_words = added_data.get("added", [])

# ===== MERGE =====
new_count = 0

for word in added_words:
    w = word.strip().lower()

    if w not in existing_words:
        existing_words.add(w)
        new_count += 1

# ===== SAVE BACK =====
tagalog_data["data"] = sorted(existing_words)

with open(TAGALOG_FILE, "w", encoding="utf-8") as f:
    json.dump(tagalog_data, f, ensure_ascii=False, indent=2)

print(f"Re-added {new_count} words back into tagalog_dict.json")
print(f"Total words now: {len(existing_words)}")