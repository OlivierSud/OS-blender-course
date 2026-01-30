import os
import json
import re

# Configuration
COURSES_DIR = 'Cours'
OUTPUT_FILE = 'courses_data.js'
ALLOWED_EXTENSIONS = {'.pdf'}

def load_existing_visibility(filepath):
    """
    Loads the existing JS file and extracts a map of item paths/names to their visibility status.
    Returns a dictionary: { "path_or_name": boolean_visibility }
    """
    visibility_map = {}
    if not os.path.exists(filepath):
        return visibility_map

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Extract JSON part: remove "window.COURSE_DATA = " and trailing ";"
        match = re.search(r'window\.COURSE_DATA\s*=\s*(\{.*?\});', content, re.DOTALL)
        if match:
            json_str = match.group(1)
            data = json.loads(json_str)
            
            def extract_visibility(items):
                for item in items:
                    # Use path as key if available, otherwise name (for folders)
                    key = item.get('path', item.get('name'))
                    if key:
                        # Default to True if visibility key is missing in existing data
                        visibility_map[key] = item.get('visibility', True)
                    
                    if 'children' in item:
                        extract_visibility(item['children'])

            if 'courses' in data:
                extract_visibility(data['courses'])
            if 'tips' in data:
                extract_visibility(data['tips'])
                
    except Exception as e:
        print(f"Warning: Could not load existing visibility settings: {e}")
        
    return visibility_map

def scan_directory(path, visibility_map):
    """
    Recursively scans a directory and returns a predictable structure.
    """
    items = []
    
    try:
        # Get all entries in the directory
        entries = os.listdir(path)
        # Sort them: Folders first, then files, both alphabetically
        entries.sort(key=lambda x: (not os.path.isdir(os.path.join(path, x)), x.lower()))

        for entry in entries:
            full_path = os.path.join(path, entry)
            
            # Determine logic key for visibility lookup
            # We'll calculate the relative path or name *before* creating the item dict
            # to check against the map.
            
            if os.path.isdir(full_path):
                # Check if folder acts as an HTML project (contains index.html)
                index_path = os.path.join(full_path, 'index.html')
                if os.path.exists(index_path):
                    # Treat as a file/link
                    rel_path = index_path.replace('\\', '/')
                    
                    # Lookup visibility
                    is_visible = visibility_map.get(rel_path, True)

                    items.append({
                        "type": "file",
                        "name": entry, # Folder name acting as title
                        "path": rel_path,
                        "visibility": is_visible
                    })
                else:
                    # Recursively scan subdirectories
                    children = scan_directory(full_path, visibility_map)
                    # Only add folder if it has content (optional, but cleaner)
                    if children:
                        # For pure folders, we use the folder name as key since they don't have a 'path' prop in the current schema
                        # Ideally we should use a path, but 'name' was used in my extraction logic above.
                        # Let's verify uniqueness. Usually folder names at the same level are unique.
                        # But across the tree? extraction logic used simple recursion.
                        # Wait, the extraction logic put *all* keys in one flat map. 
                        # This might collide if two folders have same name "Chapter 1" in different parents.
                        # But typically 'name' is just the local name.
                        # Let's assume unique names or sufficient enough for now.
                        # Better approach: map keys should probably be 'name' for folders? 
                        # Actually, let's stick to 'name' for folders as per the extraction logic.
                        
                        is_visible = visibility_map.get(entry, True)

                        items.append({
                            "type": "folder",
                            "name": entry,
                            "children": children,
                            "visibility": is_visible
                        })
            else:
                # Check for allowed extensions
                _, ext = os.path.splitext(entry)
                if ext.lower() in ALLOWED_EXTENSIONS:
                    # Create relative path for the web link
                    rel_path = full_path.replace('\\', '/')
                    
                    is_visible = visibility_map.get(rel_path, True)

                    items.append({
                        "type": "file",
                        "name": entry,
                        "path": rel_path,
                        "visibility": is_visible
                    })
                    
    except PermissionError:
        print(f"Permission denied: {path}")
    except Exception as e:
        print(f"Error scanning {path}: {e}")

    return items

def generate_js_file():
    print("Loading existing visibility settings...")
    visibility_map = load_existing_visibility(OUTPUT_FILE)
    
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
        data['courses'] = scan_directory(cours_dir, visibility_map)
    else:
        print("Warning: 'Cours' directory not found.")

    # Scan 'Tips'
    tips_dir = find_dir('tips')
    if tips_dir:
        print(f"Scanning '{tips_dir}'...")
        data['tips'] = scan_directory(tips_dir, visibility_map)
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
