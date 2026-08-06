import os
import json

def generate_gallery():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    assets_dir = os.path.join(base_dir, 'assets')
    
    gallery_data = []

    # Process 3D Renders
    renders_dir = os.path.join(assets_dir, 'Renders')
    if os.path.exists(renders_dir):
        # Sort files alphabetically
        render_files = sorted(os.listdir(renders_dir))
        for filename in render_files:
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                # Create a title from the filename (e.g., "01_Entrance.jpg" -> "01. Entrance")
                title = os.path.splitext(filename)[0]
                if '_' in title:
                    parts = title.split('_', 1)
                    title = f"{parts[0]}. {parts[1]}"
                
                gallery_data.append({
                    'category': '3d-designs',
                    'src': f"assets/Renders/{filename}",
                    'title': title
                })

    # Process MoodBoards
    moodboards_dir = os.path.join(assets_dir, 'MoodBoards')
    if os.path.exists(moodboards_dir):
        moodboard_files = sorted(os.listdir(moodboards_dir))
        for filename in moodboard_files:
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                title = os.path.splitext(filename)[0].replace('_', ' ')
                gallery_data.append({
                    'category': 'moodboards',
                    'src': f"assets/MoodBoards/{filename}",
                    'title': title
                })

    # Write to gallery_data.js
    output_file = os.path.join(base_dir, 'gallery_data.js')
    js_content = f"const galleryData = {json.dumps(gallery_data, indent=4)};\n"
    
    with open(output_file, 'w') as f:
        f.write(js_content)
        
    print(f"Successfully generated {output_file} with {len(gallery_data)} items.")

if __name__ == "__main__":
    generate_gallery()
