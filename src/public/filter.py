import json
import re

# ===== FILES =====
TXT_FILE = "filipino_word_list.txt"
OUTPUT_FILTERED = "tagalog_dict.json"
OUTPUT_ADDED = "added_words.json"

# ===== REDUPLICATION CHECK =====
def has_reduplication(word):
    word = word.lower()

    if not re.fullmatch(r"[a-zñ]+", word):
        return False

    if len(word) < 4:
        return False

    # 2-letter repetition (na-na, ka-ka)
    for i in range(len(word) - 3):
        chunk = word[i:i+2]
        if chunk * 2 in word:
            return True

    # 3-letter repetition
    for i in range(len(word) - 5):
        chunk = word[i:i+3]
        if chunk * 2 in word:
            return True

    return False

# ===== PROCESS =====
filtered = set()

with open(TXT_FILE, "r", encoding="utf-8") as f:
    for line in f:
        word = line.strip().lower()

        if has_reduplication(word):
            filtered.add(word)

# sort final list
filtered_list = sorted(filtered)

# ===== SAVE FILTERED LIST =====
with open(OUTPUT_FILTERED, "w", encoding="utf-8") as f:
    json.dump({"data": filtered_list}, f, ensure_ascii=False, indent=2)

# ===== SAVE ADDED WORDS FILE =====
# (same list for now, but separated file as requested)
with open(OUTPUT_ADDED, "w", encoding="utf-8") as f:
    json.dump({"added": filtered_list}, f, ensure_ascii=False, indent=2)

print(f"Total reduplication words found: {len(filtered_list)}")
print("Saved:")
print("-", OUTPUT_FILTERED)
print("-", OUTPUT_ADDED)