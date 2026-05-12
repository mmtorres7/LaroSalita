import json
import re

def normalize(word):
    """Lowercase and strip non-alpha characters (like hyphens, spaces)."""
    return re.sub(r'[^a-z]', '', word.lower())

def main():
    print("=" * 50)
    print("  Word to JSON Converter")
    print("=" * 50)
    print("Paste your space-separated words below.")
    print("Press Enter twice when done.\n")

    lines = []
    while True:
        line = input()
        if line == "":
            break
        lines.append(line)

    raw_input = " ".join(lines)
    words = raw_input.split()

    if not words:
        print("\n[!] No words entered.")
        return

    normalized = [normalize(w) for w in words if normalize(w)]
    normalized = list(dict.fromkeys(normalized))  # remove duplicates, preserve order

    output = {"data": normalized}

    print(f"\n--- ADDED WORDS ({len(normalized)}) ---\n")
    for i, word in enumerate(normalized, 1):
        print(f"  {i:>3}. {word}")

    json_str = json.dumps(output, indent=2, ensure_ascii=False)
    print("\n--- JSON OUTPUT ---\n")
    print(json_str)

    save = input("\nSave to file? (y/n): ").strip().lower()
    if save == "y":
        filename = input("Filename (default: output.json): ").strip() or "output.json"
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        print(f"[✓] Saved to {filename}")

if __name__ == "__main__":
    main()