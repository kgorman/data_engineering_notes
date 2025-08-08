#!/bin/bash

# Validate post structure and content

POST_DIR="$1"

if [ ! -d "$POST_DIR" ]; then
    echo "Error: Post directory '$POST_DIR' not found"
    exit 1
fi

echo "Validating post: $POST_DIR"

# Check required files
files=("index.md" "metadata.json")
for file in "${files[@]}"; do
    if [ ! -f "$POST_DIR/$file" ]; then
        echo "❌ Missing required file: $file"
        exit 1
    else
        echo "✅ Found: $file"
    fi
done

# Check frontmatter
if ! grep -q "^---" "$POST_DIR/index.md"; then
    echo "❌ Missing frontmatter in index.md"
    exit 1
fi

# Check for code directory if code languages are specified
if grep -q "code_languages:" "$POST_DIR/index.md" && [ ! -d "$POST_DIR/code" ]; then
    echo "⚠️  Code languages specified but no code/ directory found"
fi

# Validate JSON metadata
if ! python3 -m json.tool "$POST_DIR/metadata.json" > /dev/null 2>&1; then
    echo "❌ Invalid JSON in metadata.json"
    exit 1
fi

echo "✅ Post validation complete"
