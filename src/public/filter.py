import json
import re

# ===== FILES =====
JSON_FILE = "tagalog_dict.json"
TXT_FILE = "words.txt"

# ===== LOAD EXISTING JSON =====
with open(JSON_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

# existing words set
existing_words = set(
    word.strip().lower()
    for word in data["data"]
)

# ===== READ TXT =====
new_words = []

with open(TXT_FILE, "r", encoding="utf-8") as f:
    for line in f:
        word = line.strip().lower()

        # skip empty
        if not word:
            continue

        # remove 1-3 letter words
        if len(word) <= 3:
            continue

        # keep ONLY alphabet letters
        # removes:
        # A.D.
        # Abante!
        # hello123
        if not re.fullmatch(r"[a-zA-ZñÑ]+", word):
            continue

        # skip duplicates
        if word not in existing_words:
            existing_words.add(word)
            new_words.append(word)

# ===== APPEND =====
data["data"].extend(new_words)

# optional sorting
data["data"] = sorted(set(data["data"]))

# ===== SAVE =====
with open(JSON_FILE, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Added {len(new_words)} new words")
print(f"Total words: {len(data['data'])}")