import json
import os
import sys

def merge_json_files(file1_path, file2_path, output_path):
    # Load first JSON file
    with open(file1_path, "r", encoding="utf-8") as f:
        data1 = json.load(f)

    # Load second JSON file
    with open(file2_path, "r", encoding="utf-8") as f:
        data2 = json.load(f)

    # Load existing output file if it exists (append mode)
    existing = []
    if os.path.exists(output_path):
        with open(output_path, "r", encoding="utf-8") as f:
            existing = json.load(f)["data"]
        print(f"Loaded {len(existing)} existing entries from: {output_path}")

    # Combine all, lowercase, deduplicate, and sort
    combined = existing + data1["data"] + data2["data"]
    combined_lower = [word.lower() for word in combined]
    unique_sorted = sorted(set(combined_lower))

    duplicates_removed = len(combined_lower) - len(unique_sorted)

    # Save result
    result = {"data": unique_sorted}
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"Added from file1: {len(data1['data'])} | file2: {len(data2['data'])}")
    print(f"Duplicates removed: {duplicates_removed}")
    print(f"Total unique entries: {len(unique_sorted)}")
    print(f"Output saved to: {output_path}")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python merge_json.py <file1.json> <file2.json> <output.json>")
        sys.exit(1)

    merge_json_files(sys.argv[1], sys.argv[2], sys.argv[3])