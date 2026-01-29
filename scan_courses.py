import os
import json

# Configuration
COURSES_DIR = 'Cours'
OUTPUT_FILE = 'courses_data.js'
ALLOWED_EXTENSIONS = {'.pdf'}

def scan_directory(path):
    """
    Recursively scans a directory and returns a predictable structure:
    [
        { "type": "folder", "name": "Folder Name", "children": [...] },
        { "type": "file", "name": "File Name.pdf", "path": "path/to/file.pdf" }
    ]
    """
    items = []
    
    try:
        # Get all entries in the directory
        entries = os.listdir(path)
        # Sort them: Folders first, then files, both alphabetically
        entries.sort(key=lambda x: (not os.path.isdir(os.path.join(path, x)), x.lower()))

        for entry in entries:
            full_path = os.path.join(path, entry)
            
            if os.path.isdir(full_path):
                # Check if folder acts as an HTML project (contains index.html)
                index_path = os.path.join(full_path, 'index.html')
                if os.path.exists(index_path):
                    # Treat as a file/link
                    rel_path = index_path.replace('\\', '/')
                    items.append({
                        "type": "file",
                        "name": entry, # Folder name acting as title
                        "path": rel_path
                    })
                else:
                    # Recursively scan subdirectories
                    children = scan_directory(full_path)
                    # Only add folder if it has content (optional, but cleaner)
                    if children:
                        items.append({
                            "type": "folder",
                            "name": entry,
                            "children": children
                        })
            else:
                # Check for allowed extensions
                _, ext = os.path.splitext(entry)
                if ext.lower() in ALLOWED_EXTENSIONS:
                    # Create relative path for the web link
                    # Replace backslashes with forward slashes for URL compatibility
                    rel_path = full_path.replace('\\', '/')
                    items.append({
                        "type": "file",
                        "name": entry,
                        "path": rel_path
                    })
                    
    except PermissionError:
        print(f"Permission denied: {path}")
    except Exception as e:
        print(f"Error scanning {path}: {e}")

    return items

def generate_js_file():
    print("Scanning directories...")
    
    data = {
        "courses": [],
        "tips": []
    }

    # Helper to find directory case-insensitively
    def find_dir(name):
        for d in os.listdir('.'):
            if os.path.isdir(d) and d.lower() == name.lower():
                return d
        return None

    # Scan 'Cours'
    cours_dir = find_dir('cours')
    if cours_dir:
        print(f"Scanning '{cours_dir}'...")
        data['courses'] = scan_directory(cours_dir)
    else:
        print("Warning: 'Cours' directory not found.")

    # Scan 'Tips'
    tips_dir = find_dir('tips')
    if tips_dir:
        print(f"Scanning '{tips_dir}'...")
        data['tips'] = scan_directory(tips_dir)
    else:
        print("Warning: 'Tips' directory not found.")
    
    # Add generation timestamp
    from datetime import datetime
    data['generatedAt'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Wrap in a global variable definition
    js_content = f"window.COURSE_DATA = {json.dumps(data, indent=4)};"
    
    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print(f"Successfully generated {OUTPUT_FILE}")
    except Exception as e:
        print(f"Failed to write {OUTPUT_FILE}: {e}")

if __name__ == "__main__":
    generate_js_file()
